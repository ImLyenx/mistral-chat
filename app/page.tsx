"use client";

import { useRef, useState } from "react";

import { APIPrompt } from "@/components/api-prompt";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Mistral } from "@mistralai/mistralai";

export default function Home() {
  const [currentChat, setCurrentChat] = useState<{
    messages: { role: "user" | "assistant"; content: string }[];
    model: string;
  }>({
    messages: [],
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
      <div className="flex flex-col gap-4 mx-auto max-w-4xl my-8">
        {currentChat.messages.map((message) => (
          <Card key={message.content}>
            <CardHeader>
              <CardTitle>
                {message.role === "user" ? "You" : "Mistral Large"}
              </CardTitle>
            </CardHeader>
            <CardContent>{message.content}</CardContent>
          </Card>
        ))}
        {lastResponse && (
          <Card>
            <CardHeader>
              <CardTitle>Mistral Large</CardTitle>
            </CardHeader>
            <CardContent>{lastResponse}</CardContent>
          </Card>
        )}

        <Textarea ref={textareaRef} id="textarea" />
        <Button onClick={startCompletion} disabled={isLoading}>
          {isLoading ? "Loading..." : "Send"}
        </Button>
      </div>
      <APIPrompt />
    </>
  );
}
