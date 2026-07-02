"use client";
import { useEffect, useRef } from "react";
import { Message } from "@/components/study-page";
import { Loader2 } from "lucide-react";

interface Props {
  messages: Message[];
  charName: string;
  isLoading: boolean;
}

export default function ChatArea({ messages, charName, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-5xl mb-4">💬</div>
          <p className="text-sm">选择学习伙伴，上传资料开始学习吧</p>
          <p className="text-xs mt-2 text-gray-300">他们会用苏格拉底式提问帮你真正掌握知识</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4">
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[80%] lg:max-w-[65%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-[#667eea] text-white rounded-br-md"
                : "bg-white text-gray-800 rounded-bl-md shadow-sm"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="text-xs text-gray-400 font-medium mb-1">{charName}</div>
            )}
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
            <Loader2 className="animate-spin text-[#667eea]" size={20} />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
