"use client";

import { useRef, useState } from "react";

import { APIPrompt } from "@/components/api-prompt";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import emoji from "remark-emoji";

import { Mistral } from "@mistralai/mistralai";

export default function Home() {
  const [currentChat, setCurrentChat] = useState<{
    messages: { role: "user" | "assistant" | "system"; content: string }[];
    model: string;
  }>({
    messages: [
      {
        role: "system" as const,
        content:
          "You are a helpful assistant that can answer questions and help with tasks. You also have markdown formatting.",
      },
    ],
    model: "mistral-large-latest",
  });

  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lastResponse, setLastResponse] = useState("");
  const startCompletion = async () => {
    setIsLoading(true);
    const prompt = textareaRef.current?.value;
    if (!prompt) {
      alert("Please enter a prompt");
      return;
    }
    if (textareaRef.current) textareaRef.current.value = "";

    const newMessages = [
      ...currentChat.messages,
      { role: "user" as const, content: prompt },
    ];
    setCurrentChat({
      messages: newMessages,
      model: currentChat.model,
    });

    const client = new Mistral({ apiKey: localStorage.getItem("apiKey")! });

    const chatResponse = await client.chat.stream({
      model: currentChat.model,
      messages: newMessages,
    });

    let fullResponse = "";
    for await (const chunk of chatResponse) {
      const content = chunk.data.choices[0].delta.content;
      setLastResponse((prev) => prev + content);
      fullResponse += content;
    }

    setCurrentChat((prev) => ({
      ...prev,
      messages: [
        ...newMessages,
        { role: "assistant" as const, content: fullResponse },
      ],
    }));
    setLastResponse("");
    setIsLoading(false);
  };

  return (
    <>
      <div className="flex flex-col gap-4 md:mx-auto mx-8 max-w-4xl my-8">
        <div className="flex justify-between">
          <h1 className="font-bold text-4xl mb-2">Lyenx Chat</h1>
          <APIPrompt />
        </div>
        {currentChat.messages.map((message) =>
          message.role !== "system" ? (
            <Card key={message.content}>
              <CardHeader>
                <CardTitle>
                  {message.role === "user" ? "You" : "Mistral Large"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <Markdown
                    remarkPlugins={[remarkGfm, emoji]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {message.content}
                  </Markdown>
                </div>
              </CardContent>
            </Card>
          ) : null
        )}
        {lastResponse && (
          <Card>
            <CardHeader>
              <CardTitle>Mistral Large</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <Markdown
                  remarkPlugins={[remarkGfm, emoji]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {lastResponse}
                </Markdown>
              </div>
            </CardContent>
          </Card>
        )}

        <Textarea
          ref={textareaRef}
          id="textarea"
          placeholder="Ask a question..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              startCompletion();
            }
          }}
        />
        <Button onClick={startCompletion} disabled={isLoading}>
          {isLoading ? "Loading..." : "Send"}
        </Button>
      </div>
    </>
  );
}
