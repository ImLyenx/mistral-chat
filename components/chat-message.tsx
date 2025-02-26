import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import emoji from "remark-emoji";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { CodeHighlight } from "@/components/code-highlight";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isError = content.match(/^(\d{3}) - (.+)$/);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{role === "user" ? "You" : "Mistral Large"}</CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <div className="prose dark:prose-invert max-w-none">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{content}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="prose dark:prose-invert max-w-none">
            <Markdown
              remarkPlugins={[remarkGfm, emoji, remarkMath]}
              rehypePlugins={[rehypeRaw, rehypeKatex]}
              components={{ code: CodeHighlight }}
            >
              {content}
            </Markdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
