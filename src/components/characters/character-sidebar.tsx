"use client";
import { Character } from "@/lib/characters";
import { cn } from "@/lib/utils";
import { BookText } from "lucide-react";

interface Props {
  characters: Character[];
  currentChar: string;
  onSelect: (id: string) => void;
  messageCount: number;
  showMobile: boolean;
  onCloseMobile: () => void;
}

export default function CharacterSidebar({ characters, currentChar, onSelect, messageCount, showMobile, onCloseMobile }: Props) {
  const content = (
    <div className="flex flex-col h-full">
      <div className="p-4 text-center border-b">
        <h1 className="text-lg font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
          📘 学习小队
        </h1>
        <p className="text-xs text-gray-400 mt-1">AI陪你一起学</p>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {characters.map((char) => (
          <button
            key={char.id}
            onClick={() => { onSelect(char.id); onCloseMobile(); }}
            className={cn(
              "w-full text-left p-3 rounded-xl transition-all border-2",
              currentChar === char.id
                ? "bg-[#f0ebff] border-[#667eea]"
                : "hover:bg-gray-50 border-transparent"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
                style={{ background: char.color }}
              >
                {char.name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">{char.name}</div>
                <div className="text-xs text-gray-400">{char.title}</div>
                <div className="text-xs text-gray-300 italic truncate">{char.slogan}</div>
              </div>
            </div>
          </button>
        ))}
        <hr className="border-gray-100 my-3" />
        <div className="text-xs text-gray-400 text-center py-2">
          <BookText size={14} className="inline mr-1" />
          进度: {messageCount} 条对话
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r shrink-0 flex-col">{content}</aside>
      {/* Mobile sidebar overlay */}
      {showMobile && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/30" onClick={onCloseMobile} />
          <aside className="relative w-64 bg-white shrink-0 flex-col z-50 shadow-xl">{content}</aside>
        </div>
      )}
    </>
  );
}
