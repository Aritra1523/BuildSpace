"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Search,
  Send,
  MoreVertical,
  CheckCheck,
  ArrowLeft,
  Loader2,
  Inbox
} from "lucide-react";
import Navbar from "@/component/Navbar/Navbar";
import { useAuth } from "@/customHooks/profile/useProfile"; 

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function MessagesPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. Fetch Conversations List
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchConversations = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/messages/conversations`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
        }
      } catch (err) {
        console.error("Failed to fetch conversations", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUser]);

  // 2. Fetch Messages for Active Chat
  useEffect(() => {
    if (!activeChat || !currentUser) return;

    const fetchChatHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/messages/${activeChat.userId}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };

    fetchChatHistory();
    
    // Optional: Set up basic polling every 5 seconds until you add Socket.IO
    const interval = setInterval(fetchChatHistory, 5000);
    return () => clearInterval(interval);
  }, [activeChat, currentUser]);

  // 3. Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const optimisticMessage = {
      _id: "temp_" + Date.now(),
      senderId: currentUser?._id,
      receiverId: activeChat.userId,
      message: newMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          receiverId: activeChat.userId,
          message: optimisticMessage.message,
        }),
      });
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07090E]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#07090E] text-slate-100 overflow-hidden">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 overflow-hidden sm:p-6 lg:p-8">
        <div className="flex w-full overflow-hidden rounded-none sm:rounded-3xl border border-white/10 bg-slate-900/50 shadow-2xl">
          
          {/* ==========================================
              LEFT PANE: CONVERSATIONS LIST
          ========================================== */}
          <div className={`flex w-full flex-col border-r border-white/10 bg-[#080B12] sm:w-80 md:w-96 ${activeChat ? "hidden sm:flex" : "flex"}`}>
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white mb-4">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950 py-2 pl-9 pr-4 text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 p-6 text-center">
                  <Inbox className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm">No messages yet.</p>
                  <p className="text-xs mt-1">Connect with builders in the Explore feed.</p>
                </div>
              ) : (
                conversations.map((chat) => (
                  <button
                    key={chat.userId}
                    onClick={() => setActiveChat(chat)}
                    className={`flex w-full items-center gap-3 border-b border-white/5 p-4 text-left transition hover:bg-white/5 ${
                      activeChat?.userId === chat.userId ? "bg-white/5 border-l-2 border-l-violet-500" : ""
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={chat.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                        alt={chat.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      {chat.unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white border-2 border-[#080B12]">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white truncate">{chat.name}</span>
                        <span className="text-[10px] text-slate-500">{chat.lastMessageTime}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {chat.lastMessage}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ==========================================
              RIGHT PANE: ACTIVE CHAT
          ========================================== */}
          <div className={`flex flex-1 flex-col bg-[#05070B] ${!activeChat ? "hidden sm:flex" : "flex"}`}>
            {!activeChat ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-500">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 mb-4">
                  <Send className="h-6 w-6 text-slate-600 ml-1" />
                </div>
                <p>Select a conversation to start chatting</p>
              </div>
            ) : (
               <>
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-white/10 bg-[#080B12] p-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setActiveChat(null)}
                      className="sm:hidden p-2 -ml-2 text-slate-400 hover:text-white"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <img
                      src={activeChat.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                      alt={activeChat.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-white">{activeChat.name}</h3>
                      <p className="text-[11px] text-emerald-400">Online</p>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-white">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser?._id;
                    
                    return (
                      <div key={msg._id || idx} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                        <div 
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                            isMe 
                              ? "bg-violet-600 text-white rounded-br-sm" 
                              : "bg-slate-800 text-slate-200 rounded-bl-sm border border-white/10"
                          }`}
                        >
                          {/* Project context block if attached */}
                          {msg.projectId && (
                            <div className="mb-2 rounded-xl bg-black/20 p-2 text-xs border border-white/10">
                              <span className="font-semibold text-cyan-300">Attached Project</span>
                            </div>
                          )}
                          
                          <p className="leading-relaxed">{msg.message}</p>
                          
                          <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe ? "text-violet-300" : "text-slate-500"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isMe && <CheckCheck className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input */}
                <div className="border-t border-white/10 bg-[#080B12] p-4">
                  <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                    <textarea
                      rows={1}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Write a message..."
                      className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-white/15 bg-slate-950 py-3 pl-4 pr-10 text-sm text-white focus:border-violet-500 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-50"
                    >
                      <Send className="h-5 w-5 ml-1" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}