import type { ReactNode } from "react";
import ShikiHighlighter, { isInlineCode, type Element } from "react-shiki";

interface CodeHighlightProps {
  className?: string | undefined;
  children?: ReactNode | undefined;
  node?: Element | undefined;
  inline?: boolean | undefined;
}

export const CodeHighlight = ({
  inline,
  className,
  children,
  node,
  ...props
}: CodeHighlightProps): React.ReactElement => {
  const match = className?.match(/language-(\w+)/);
  const language = match ? match[1] : undefined;
  const code = String(children).trim();

  return !inline ? (
    <ShikiHighlighter language={language} theme={"houston"} {...props}>
      {code}
    </ShikiHighlighter>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
};
