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

import { FilePlus } from "lucide-react";

import { Chat, db } from "@/app/db";
import { useEffect, useState } from "react";

export default function AppSidebar() {
  const [todayChats, setTodayChats] = useState<Chat[]>([]);
  const [lastweekChats, setLastweekChats] = useState<Chat[]>([]);
  const [olderChats, setOlderChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem(
      "currentChat",
      currentChat !== null ? currentChat.toString() : ""
    );
    window.dispatchEvent(new Event("storage"));
  }, [currentChat]);

  const handleChatSwitch = async (id: number) => {
    if (id === 0) {
      setCurrentChat(0);
      return;
    }
    const chat = await db.chats.where("id").equals(id).first();
    console.log(chat);
    if (chat) {
      setCurrentChat(chat.id!);
    }
  };

  useEffect(() => {
    const fetchChats = async () => {
      const chats = await db.chats.orderBy("createdAt").reverse().toArray();
      setTodayChats(
        chats.filter(
          (chat) => chat.createdAt >= new Date(Date.now() - 1000 * 60 * 60 * 24)
        )
      );
      setLastweekChats(
        chats.filter(
          (chat) =>
            chat.createdAt < new Date(Date.now() - 1000 * 60 * 60 * 24) &&
            chat.createdAt >= new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
        )
      );
      setOlderChats(
        chats.filter(
          (chat) =>
            chat.createdAt < new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
        )
      );
    };
    fetchChats();
  }, []);

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
                <SidebarMenuButton onClick={() => handleChatSwitch(chat.id!)}>
                  {chat.title}
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
