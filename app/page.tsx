"use client";

import { useRef, useState } from "react";

import { APIPrompt } from "@/components/api-prompt";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Mistral } from "@mistralai/mistralai";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [completion, setCompletion] = useState("");
  const startCompletion = async () => {
    setIsLoading(true);
    setCompletion("");
    const prompt = textareaRef.current?.value;
    if (!prompt) {
      alert("Please enter a prompt");
      return;
    }
    const client = new Mistral({ apiKey: localStorage.getItem("apiKey")! });

    const chatResponse = await client.chat.stream({
      model: "mistral-large-latest",
      messages: [{ role: "user", content: prompt }],
    });
    for await (const chunk of chatResponse) {
      setCompletion((prev) => prev + chunk.data.choices[0].delta.content);
    }
    setIsLoading(false);
  };

  return (
    <>
      <div className="flex flex-col gap-4 mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Mistral Large</CardTitle>
          </CardHeader>
          <CardContent>{completion}</CardContent>
        </Card>
        <Textarea ref={textareaRef} id="textarea" />
        <Button onClick={startCompletion} disabled={isLoading}>
          {isLoading ? "Loading..." : "Send"}
        </Button>
      </div>
      <APIPrompt />
    </>
  );
}
