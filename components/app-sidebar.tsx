"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { FilePlus, Trash2 } from "lucide-react";

import { Chat, db } from "@/app/db";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AppSidebar() {
  const [todayChats, setTodayChats] = useState<Chat[]>([]);
  const [lastweekChats, setLastweekChats] = useState<Chat[]>([]);
  const [olderChats, setOlderChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<number | null>(null);
  const [isSidebarUpdated, setIsSidebarUpdated] = useState(true);

  useEffect(() => {
    window.addEventListener("newChat", () => {
      setIsSidebarUpdated(false);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "currentChat",
      currentChat !== null ? currentChat.toString() : "0"
    );
    window.dispatchEvent(new Event("storage"));
  }, [currentChat]);

  const handleChatSwitch = async (id: number) => {
    if (localStorage.getItem("isLoading") === "true") {
      toast.error("Please wait for the current chat to load");
      return;
    }
    if (id === 0) {
      setCurrentChat(0);
      return;
    }
    const chat = await db.chats.where("id").equals(id).first();
    if (chat) {
      setCurrentChat(chat.id!);
    }
  };

  useEffect(() => {
    const fetchChats = async () => {
      const chats = await db.chats.orderBy("updatedAt").reverse().toArray();
      setTodayChats(
        chats.filter(
          (chat) => chat.updatedAt >= new Date(Date.now() - 1000 * 60 * 60 * 24)
        )
      );
      setLastweekChats(
        chats.filter(
          (chat) =>
            chat.updatedAt < new Date(Date.now() - 1000 * 60 * 60 * 24) &&
            chat.updatedAt >= new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
        )
      );
      setOlderChats(
        chats.filter(
          (chat) =>
            chat.updatedAt < new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
        )
      );
    };
    fetchChats();
    setIsSidebarUpdated(true);
  }, [isSidebarUpdated]);

  const handleDeleteChat = async (id: number) => {
    console.log("deleting chat " + id);
    await db.chats.where("id").equals(id).delete();
    if (currentChat === id) {
      setCurrentChat(0);
    }
    setIsSidebarUpdated(false);
  };

  return (
    <Sidebar title="Lyenx Chat">
      <SidebarHeader className="m-2 text-xl font-bold">
        Lyenx Chat
      </SidebarHeader>
      <SidebarGroup>
        <SidebarMenuItem className="list-none">
          <SidebarMenuButton onClick={() => handleChatSwitch(0)}>
            <FilePlus />
            New chat
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarGroup>
      <SidebarContent>
        {todayChats.length > 0 ? (
          <SidebarGroup className="gap-1">
            <SidebarGroupLabel>Today</SidebarGroupLabel>
            {todayChats.map((chat) => (
              <SidebarMenuItem key={chat.id} className="list-none">
                <SidebarMenuButton
                  className="relative group/delete"
                  onClick={() => handleChatSwitch(chat.id!)}
                >
                  {chat.title}
                  <Button
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/delete:opacity-100 bg-slate-200"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteChat(chat.id!)}
                    asChild
                  >
                    <Trash2 />
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarGroup>
        ) : null}
        {lastweekChats.length > 0 ? (
          <SidebarGroup className="gap-1">
            <SidebarGroupLabel>Last Week</SidebarGroupLabel>
            {lastweekChats.map((chat) => (
              <SidebarMenuItem key={chat.id} className="list-none">
                <SidebarMenuButton onClick={() => handleChatSwitch(chat.id!)}>
                  {chat.title}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarGroup>
        ) : null}
        {olderChats.length > 0 ? (
          <SidebarGroup className="gap-1">
            <SidebarGroupLabel>Older</SidebarGroupLabel>
            {olderChats.map((chat) => (
              <SidebarMenuItem key={chat.id} className="list-none">
                <SidebarMenuButton onClick={() => handleChatSwitch(chat.id!)}>
                  {chat.title}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarGroup>
        ) : null}
      </SidebarContent>
    </Sidebar>
  );
}
