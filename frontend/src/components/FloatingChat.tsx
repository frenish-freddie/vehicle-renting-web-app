"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "bot",
      text: "Hi there! I am your FlexiRide virtual helper. Ask me about booking vehicles, price calculations, driver service options, or payments!",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Browse vehicles",
    "How does pricing work?",
    "Driver services",
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chats
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      // 2. Query FastAPI Chatbot Endpoint
      const response = await api.post("/api/chatbot", { message: text });
      
      // 3. Simulated short typing latency for premium UX feel
      setTimeout(() => {
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: response.data.response,
        };
        setMessages((prev) => [...prev, botMsg]);
        setSuggestions(response.data.suggestions || []);
        setIsTyping(false);
      }, 750);
      
    } catch (error) {
      setTimeout(() => {
        const errMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "I am experiencing network connectivity issues right now. However, you can browse available vehicles or proceed with checkout from the dashboard directly!",
        };
        setMessages((prev) => [...prev, errMsg]);
        setIsTyping(false);
      }, 750);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="mb-4 h-[480px] w-[340px] sm:w-[380px] rounded-2xl bg-white shadow-2xl border border-neutral-200/50 flex flex-col overflow-hidden dark:bg-neutral-900 dark:border-neutral-800/80"
          >
            {/* Chatbot Header */}
            <div className="bg-primary-600 dark:bg-neutral-800 px-4 py-3 flex items-center justify-between text-white border-b border-transparent dark:border-neutral-700/80">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-tight">FlexiRide AI Helper</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-primary-100 font-medium">Assistant Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 hover:bg-white/10 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/50 dark:bg-neutral-950/20">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      msg.sender === "user"
                        ? "bg-primary-500 text-white rounded-br-none dark:bg-blue-600"
                        : "bg-white text-neutral-800 border border-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700/50 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-700/50 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Chips */}
            {suggestions.length > 0 && (
              <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-wrap gap-1.5 bg-white dark:bg-neutral-900">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(sug)}
                    className="text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 border border-primary-200/50 dark:border-neutral-700 px-2.5 py-1 rounded-full transition font-medium"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(inputValue);
              }}
              className="p-3 border-t border-neutral-200/50 bg-white flex items-center gap-2 dark:bg-neutral-900 dark:border-neutral-800/80"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about rental costs..."
                className="flex-1 text-sm bg-neutral-100 border border-neutral-200/50 px-3.5 h-10 rounded-xl focus:outline-none focus:border-primary-500 dark:bg-neutral-800 dark:border-neutral-700/80 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-600"
              />
              <button
                type="submit"
                className="bg-primary-500 text-white rounded-xl p-2.5 hover:bg-primary-600 shadow-sm transition dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-xl hover:bg-primary-600 transition hover:scale-105 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500"
        aria-label="Help desk Chatbot"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    </div>
  );
}
