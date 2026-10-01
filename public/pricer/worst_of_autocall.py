"""
Worst-of autocallable Monte Carlo pricer — correlated GBM.

Prices a note on 2-3 underlyings that:
  * pays a contingent coupon when the worst performer is >= the coupon barrier
    (phoenix, memory, or snowball style),
  * autocalls at par when the worst performer is >= the autocall trigger,
  * at maturity repays par if the worst performer is >= the downside threshold,
    otherwise repays notional * worst performance (client is short a European
    down-and-in put on the worst-of).

Because note value is linear in the coupon c (V = A + c*B), one simulation gives
the fair coupon directly: c* = (1 - fee - A) / B.

Sensitivities reuse the same random numbers (common random numbers), so bumps
are smooth even with modest path counts.

    python worst_of_autocall.py
"""

from dataclasses import dataclass, replace

import numpy as np


@dataclass(frozen=True)
class Market:
    n_assets: int = 3
    vol: float = 0.25           # same vol for every underlying
    corr: float = 0.6           # pairwise correlation
    div: float = 0.015          # continuous dividend yield
    rate: float = 0.04          # risk-free rate


@dataclass(frozen=True)
class Note:
    tenor_years: float = 3.0
    obs_per_year: int = 4
    autocall_trigger: float = 1.00
    coupon_barrier: float = 0.70
    downside_threshold: float = 0.60
    first_call_obs: int = 2     # first observation that can autocall (1-based)
    coupon_style: str = "phoenix"  # "phoenix" | "memory" | "snowball"
    funding_spread: float = 0.008  # issuer credit spread over the risk-free rate
    fee: float = 0.015             # upfront fee, fraction of notional


def n_obs(note: Note) -> int:
    return max(1, round(note.tenor_years * note.obs_per_year))


def generate_normals(n_paths: int, n_steps: int, n_assets: int = 3, seed: int = 42) -> np.ndarray:
    """Base normals for n_paths/2 paths; the other half are antithetic."""
    rng = np.random.default_rng(seed)
    return rng.standard_normal((n_paths // 2, n_steps, n_assets))


def simulate_worst(z: np.ndarray, mkt: Market, dt: float) -> np.ndarray:
    """Worst-of performance on each observation date, shape (n_paths, n_steps)."""
    n = mkt.n_assets
    corr = np.full((n, n), mkt.corr) + (1 - mkt.corr) * np.eye(n)
    L = np.linalg.cholesky(corr)
    z = z[:, :, :n] @ L.T
    z = np.concatenate([z, -z])  # antithetic variates

    drift = (mkt.rate - mkt.div - 0.5 * mkt.vol**2) * dt
    log_s = np.cumsum(drift + mkt.vol * np.sqrt(dt) * z, axis=1)
    return np.exp(log_s.min(axis=2))


def evaluate(worst: np.ndarray, note: Note, rate: float) -> dict:
    n_paths, n_steps = worst.shape
    dt = 1 / note.obs_per_year
    k = np.arange(1, n_steps + 1)
    df = np.exp(-(rate + note.funding_spread) * dt * k)

    # First autocall date per path (n_steps means "never called").
    can_call = (k >= note.first_call_obs) & (k < n_steps)
    called = (worst >= note.autocall_trigger) & can_call
    call_idx = np.where(called.any(axis=1), called.argmax(axis=1), n_steps)
    alive = k[None, :] - 1 <= np.minimum(call_idx, n_steps - 1)[:, None]  # obs dates the note lived to see

    # Principal leg (A).
    is_called = call_idx < n_steps
    final = worst[:, -1]
    redemption = np.where(final >= note.downside_threshold, 1.0, final)
    A = np.where(is_called, df[np.minimum(call_idx, n_steps - 1)], redemption * df[-1])

    # Coupon leg (B) — PV of one unit of per-period coupon.
    if note.coupon_style == "snowball":
        pay_k = np.where(is_called, call_idx + 1, n_steps)
        pays = is_called | (final >= note.coupon_barrier)
        B = np.where(pays, pay_k * df[pay_k - 1], 0.0)
    else:
        hit = (worst >= note.coupon_barrier) & alive
        if note.coupon_style == "memory":
            # Units paid at a hit = periods since the previous hit (or since inception).
            last_hit = np.maximum.accumulate(np.where(hit, k, 0), axis=1)
            prev_hit = np.concatenate([np.zeros((n_paths, 1), dtype=int), last_hit[:, :-1]], axis=1)
            units = np.where(hit, k - prev_hit, 0)
        else:
            units = hit.astype(float)
        B = (units * df).sum(axis=1)

    A, B = A.mean(), B.mean()
    loss = ~is_called & (final < note.downside_threshold)
    life = np.where(is_called, call_idx + 1, n_steps) * dt
    return {
        "coupon_pa": (1 - note.fee - A) / B * note.obs_per_year if B > 0 else float("nan"),
        "principal_pv": A,
        "coupon_annuity": B,
        "call_prob_by_obs": np.bincount(call_idx, minlength=n_steps + 1)[:n_steps] / n_paths,
        "loss_prob": loss.mean(),
        "expected_life": life.mean(),
    }


def price(z: np.ndarray, mkt: Market, note: Note) -> dict:
    worst = simulate_worst(z, mkt, 1 / note.obs_per_year)
    return evaluate(worst, note, mkt.rate)


def sensitivities(z: np.ndarray, mkt: Market, note: Note) -> dict:
    """Change in fair coupon p.a. (in bp) for standard bumps, using common random numbers."""
    base = price(z, mkt, note)["coupon_pa"]
    bumps = {
        "vol +1pt": (replace(mkt, vol=mkt.vol + 0.01), note),
        "corr +5pts": (replace(mkt, corr=min(mkt.corr + 0.05, 0.99)), note),
        "div +50bp": (replace(mkt, div=mkt.div + 0.005), note),
        "rate +50bp": (replace(mkt, rate=mkt.rate + 0.005), note),
        "funding +10bp": (mkt, replace(note, funding_spread=note.funding_spread + 0.001)),
    }
    return {name: (price(z, m, n)["coupon_pa"] - base) * 1e4 for name, (m, n) in bumps.items()}


if __name__ == "__main__":
    mkt, note = Market(), Note()
    z = generate_normals(100_000, n_obs(note))

    res = price(z, mkt, note)
    print(f"Fair coupon: {res['coupon_pa']:.2%} p.a.")
    print(f"P(autocall): {res['call_prob_by_obs'].sum():.1%}   P(loss): {res['loss_prob']:.1%}   "
          f"Expected life: {res['expected_life']:.2f}y")

    print("\nSensitivities (fair coupon p.a., bp):")
    for name, bp in sensitivities(z, mkt, note).items():
        print(f"  {name:<14}{bp:+8.1f}")

    print("\nCoupon vs downside threshold:")
    for b in (0.5, 0.6, 0.7, 0.8):
        print(f"  {b:.0%}: {price(z, mkt, replace(note, downside_threshold=b))['coupon_pa']:.2%}")

    print("\nCoupon vs correlation:")
    for rho in (0.2, 0.4, 0.6, 0.8, 0.95):
        print(f"  {rho:.2f}: {price(z, replace(mkt, corr=rho), note)['coupon_pa']:.2%}")
