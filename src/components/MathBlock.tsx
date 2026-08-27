"use client";

import katex from "katex";

interface MathBlockProps {
  latex: string;
}

export default function MathBlock({ latex }: MathBlockProps) {
  const html = katex.renderToString(latex, {
    throwOnError: false,
    displayMode: true,
  });

  return (
    <div
      className="overflow-x-auto rounded-xl border border-border bg-background/40 px-4 py-4 text-foreground [&_.katex]:text-[1.05rem]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
