"use client";

import { useState, useEffect } from "react";
import { APIPrompt } from "@/components/api-prompt";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { systemPrompt } from "@/data/system-prompt";
import { Mistral } from "@mistralai/mistralai";
import "katex/dist/katex.min.css";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { db } from "./db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const initialChatState = {
  messages: [
    {
      role: "system" as const,
      content: systemPrompt,
    },
  ],
  model: "mistral-small-latest",
};

export default function Home() {
  const [currentChat, setCurrentChat] = useState<{
    messages: { role: "user" | "assistant" | "system"; content: string }[];
    model: string;
  }>(initialChatState);

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState("");
  const hasAtLeastOneMessage = currentChat.messages.length > 1;
  const [needsTitle, setNeedsTitle] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(0);

  const client = new Mistral({ apiKey: apiKey! });

  useEffect(() => {
    setApiKey(localStorage.getItem("apiKey"));
  }, []);

  useEffect(() => {
    localStorage.setItem("isLoading", isLoading.toString());
  }, [isLoading]);

  useEffect(() => {
    const handleStorageChange = async () => {
      setApiKey(localStorage.getItem("apiKey"));
      const storedChatId = parseInt(localStorage.getItem("currentChat") ?? "0");
      setCurrentChatId(storedChatId);
      if (storedChatId === 0) {
        setCurrentChat(initialChatState);
        return;
      }
      const storedChat = await db.chats
        .where("id")
        .equals(storedChatId)
        .first();
      if (storedChat) {
        setCurrentChat(storedChat);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (needsTitle) {
      const generateTitle = async () => {
        await new Promise((resolve) => setTimeout(resolve, 2500));

        const titleGenerationResponse = await client.chat.complete({
          model: "mistral-small-latest",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that generates titles for chats.",
            },
            {
              role: "user",
              content:
                "Generate a title for the following chat. The title has to be short and concise, as it will be displayed in a sidebar. Do not put the title in quotes, just return the title. " +
                JSON.stringify(currentChat.messages.slice(1)),
            },
          ],
        });
        const newChat = await db.chats.add({
          title:
            typeof titleGenerationResponse.choices?.[0]?.message?.content ===
            "string"
              ? titleGenerationResponse.choices[0].message.content
              : "New chat",
          model: currentChat.model,
          messages: currentChat.messages,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        window.dispatchEvent(new Event("newChat"));
        setCurrentChatId(newChat);
        localStorage.setItem("currentChat", newChat.toString());
      };
      generateTitle();
      setNeedsTitle(false);
    }
  }, [currentChat.messages, needsTitle, client.chat, currentChat.model]);

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);

    if (!hasAtLeastOneMessage) {
      setNeedsTitle(true);
    }

    const newMessages = [
      ...currentChat.messages,
      { role: "user" as const, content: message },
    ];
    setCurrentChat({
      messages: newMessages,
      model: currentChat.model,
    });

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
      if (localStorage.getItem("currentChat") == "0") {
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
      await db.chats
        .where("id")
        .equals(
          parseInt(
            localStorage.getItem("currentChat") ?? currentChatId.toString()
          )
        )
        .modify({
          messages: [
            ...newMessages,
            { role: "assistant" as const, content: fullResponse },
          ],
          updatedAt: new Date(),
        });
    } catch (error: unknown) {
      console.error(error);
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
    <div className="flex flex-col gap-4 md:mx-auto w-full max-w-4xl px-8 my-8">
      <div className="flex justify-between">
        <h1 className="font-bold text-4xl mb-2">
          <SidebarTrigger className="mr-4 [&_svg]:size-6" />
          Lyenx Chat
        </h1>
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
      {process.env.NODE_ENV === "development" && (
        <Card>
          <CardHeader>Debug</CardHeader>
          <CardContent>
            Current ID : {currentChatId}
            <pre>{JSON.stringify(currentChat, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
