import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  children: string;
  className?: string;
  /** Suppress block-level wrappers for short inline content */
  inline?: boolean;
}

export function Markdown({ children, className, inline }: MarkdownProps) {
  return (
    <div className={cn(className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      disallowedElements={inline ? ["p", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "blockquote", "ul", "ol", "pre", "table"] : undefined}
      unwrapDisallowed={inline}
      components={{
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        del: ({ children }) => <del className="line-through opacity-70">{children}</del>,
        pre: ({ children }) => (
          <pre className="my-2 overflow-x-auto rounded-lg bg-muted/80 border p-3 text-xs font-mono leading-relaxed">
            {children}
          </pre>
        ),
        code: ({ className: cls, children }) => {
          const isBlock = cls?.startsWith("language-");
          return isBlock ? (
            <code className={cn("font-mono text-xs", cls)}>{children}</code>
          ) : (
            <code className="rounded border border-border/50 bg-muted/80 px-1 py-0.5 font-mono text-[0.82em]">
              {children}
            </code>
          );
        },
        ul: ({ children }) => (
          <ul className="my-1 list-disc pl-5 space-y-0.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-1 list-decimal pl-5 space-y-0.5">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="my-2 border-l-2 border-muted-foreground/40 pl-3 text-muted-foreground italic">
            {children}
          </blockquote>
        ),
        h1: ({ children }) => (
          <h1 className="mb-2 text-lg font-semibold">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-1.5 text-base font-semibold">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1 text-sm font-semibold">{children}</h3>
        ),
        hr: () => <hr className="my-3 border-border" />,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 text-primary hover:opacity-80"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="my-2 overflow-x-auto">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border px-2 py-1 text-left font-semibold bg-muted/50">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-2 py-1">{children}</td>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
    </div>
  );
}
