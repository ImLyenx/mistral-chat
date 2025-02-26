"use client";

import { useState, useEffect } from "react";
import { APIPrompt } from "@/components/api-prompt";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { systemPrompt } from "@/data/system-prompt";
import { Mistral } from "@mistralai/mistralai";
import "katex/dist/katex.min.css";

export default function Home() {
  const [currentChat, setCurrentChat] = useState<{
    messages: { role: "user" | "assistant" | "system"; content: string }[];
    model: string;
  }>({
    messages: [
      {
        role: "system" as const,
        content: systemPrompt,
      },
    ],
    model: "mistral-large-latest",
  });

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState("");

  useEffect(() => {
    setApiKey(localStorage.getItem("apiKey"));
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setApiKey(localStorage.getItem("apiKey"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);

    const newMessages = [
      ...currentChat.messages,
      { role: "user" as const, content: message },
    ];
    setCurrentChat({
      messages: newMessages,
      model: currentChat.model,
    });

    const client = new Mistral({ apiKey: apiKey! });

    try {
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
    } catch (error: unknown) {
      let fullResponse = "An error occurred";

      if (
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        "body" in error &&
        typeof error.body === "string"
      ) {
        try {
          const parsedBody = JSON.parse(error.body);
          fullResponse = `${error.statusCode} - ${
            parsedBody.message || "Unknown error"
          }`;
        } catch {
          fullResponse = `000 - Error parsing body`;
        }
      }

      setCurrentChat((prev) => ({
        ...prev,
        messages: [
          ...newMessages,
          { role: "assistant" as const, content: fullResponse },
        ],
      }));
      setLastResponse("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:mx-auto mx-8 max-w-4xl my-8">
      <div className="flex justify-between">
        <h1 className="font-bold text-4xl mb-2">Lyenx Chat</h1>
        <APIPrompt />
      </div>

      {currentChat.messages.map((message) =>
        message.role !== "system" ? (
          <ChatMessage
            key={crypto.randomUUID()}
            role={message.role}
            content={message.content}
          />
        ) : null
      )}

      {lastResponse && <ChatMessage role="assistant" content={lastResponse} />}

      <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}
