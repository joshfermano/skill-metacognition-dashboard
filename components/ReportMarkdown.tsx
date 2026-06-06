'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Renders the technical report markdown in the dashboard's dark research theme.
export function ReportMarkdown({ md }: { md: string }) {
  return (
    <div className="max-w-[72ch] text-[15px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-2 font-display text-3xl font-semibold leading-tight text-paper">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-10 font-display text-xl font-semibold text-accent">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-6 font-semibold text-paper">{children}</h3>
          ),
          p: ({ children }) => <p className="my-3 leading-relaxed text-paper-dim">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-paper">{children}</strong>,
          em: ({ children }) => <em className="italic text-paper">{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="my-3 ml-5 list-disc space-y-1 text-paper-dim">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 ml-5 list-decimal space-y-1 text-paper-dim">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ className, children }) =>
            className ? (
              <code className={`font-mono text-[13px] ${className}`}>{children}</code>
            ) : (
              <code className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[0.85em] text-paper">
                {children}
              </code>
            ),
          pre: ({ children }) => (
            <pre className="my-4 overflow-x-auto rounded-lg border border-hairline bg-panel-2/60 p-4 text-[13px] leading-relaxed text-paper-dim">
              {children}
            </pre>
          ),
          hr: () => <hr className="my-8 border-hairline/60" />,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-accent/50 pl-4 italic text-paper-dim">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-hairline bg-panel-2/60 px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-paper-dim">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-hairline px-3 py-2 text-paper-dim">{children}</td>
          ),
        }}
      >
        {md}
      </ReactMarkdown>
    </div>
  );
}
