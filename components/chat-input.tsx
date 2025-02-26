import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const message = textareaRef.current?.value;
    if (!message) return;

    onSend(message);
    if (textareaRef.current) textareaRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        className="px-6 py-4 min-h-24"
        ref={textareaRef}
        id="textarea"
        placeholder="Ask a question..."
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !isLoading) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <Button onClick={handleSend} disabled={isLoading}>
        {isLoading ? "Loading..." : "Send"}
      </Button>
    </div>
  );
}
