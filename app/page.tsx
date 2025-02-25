"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useState } from "react";

import { Mistral } from "@mistralai/mistralai";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [completion, setCompletion] = useState("");
  const startCompletion = async () => {
    setIsLoading(true);
    const apiKey = inputRef.current?.value;
    if (!apiKey) {
      alert("Please enter an API key");
      return;
    }
    const prompt = textareaRef.current?.value;
    if (!prompt) {
      alert("Please enter a prompt");
      return;
    }
    const client = new Mistral({ apiKey: apiKey });

    const chatResponse = await client.chat.complete({
      model: "mistral-tiny",
      messages: [{ role: "user", content: prompt }],
    });
    setCompletion(chatResponse.choices![0].message.content as any);
    setIsLoading(false);
  };

  return (
    <div>
      <Input ref={inputRef} type="text" />
      <Textarea ref={textareaRef} id="textarea" />
      <Button onClick={startCompletion} disabled={isLoading}>
        {isLoading ? "Loading..." : "Send"}
      </Button>
      <p>{completion}</p>
    </div>
  );
}
