"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { characters, getCharacter } from "@/lib/characters";
import CharacterSidebar from "@/components/characters/character-sidebar";
import ChatArea from "@/components/chat/chat-area";
import ChatInput from "@/components/chat/chat-input";
import MaterialPanel from "@/components/materials/material-panel";
import DiaryDialog, { saveDiaryEntry } from "@/components/diary-dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Settings, Menu, X } from "lucide-react";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function StudyPage() {
  const [currentChar, setCurrentChar] = useState("linmo");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [showDiary, setShowDiary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiUrl, setApiUrl] = useState("https://api.deepseek.com/v1");
  const [model, setModel] = useState("deepseek-chat");
  const materialEndRef = useRef<HTMLDivElement>(null);

  const handleSend = useCallback(async (content: string) => {
    const userMsg: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msg: content,
          charId: currentChar,
          material: selectedMaterial,
          apiKey,
          apiUrl,
          conversation: [...messages, userMsg],
        }),
      });
      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "（连接失败，请检查API设置）\n让我们继续聊聊你对这个问题的看法~" },
      ]);
    }
    setIsLoading(false);
  }, [currentChar, selectedMaterial, apiKey, apiUrl, messages]);

  const handleCharChange = (id: string) => {
    setCurrentChar(id);
    if (messages.length === 0) {
      const char = getCharacter(id);
      setMessages([
        { role: "assistant", content: getWelcomeMessage(id) },
      ]);
    }
  };

  const char = getCharacter(currentChar);
  const recordProgress = () => {
    const topic = prompt("学习主题是什么？");
    if (!topic) return;
    const note = prompt("今天学到了什么？") || "完成了本节课学习";
    saveDiaryEntry({ date: new Date().toLocaleString("zh-CN"), topic, note, charName: char.name });
    alert("学习记录已保存到日记！");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile menu toggle */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-white shadow-md"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Left sidebar - Character selection */}
      <CharacterSidebar
        characters={characters}
        currentChar={currentChar}
        onSelect={handleCharChange}
        messageCount={messages.length}
        showMobile={showMobileMenu}
        onCloseMobile={() => setShowMobileMenu(false)}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b px-4 lg:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 pl-10 lg:pl-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: char.color }}
            >
              {char.name[0]}
            </div>
            <div>
              <h1 className="text-sm font-semibold">{char.name}</h1>
              <p className="text-xs text-gray-500">{char.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowDiary(true)}>
              <BookOpen size={16} className="mr-1" /> 学习记录
            </Button>
            <Button variant="outline" size="sm" onClick={recordProgress} className="text-xs h-8">
              📝 记录进度
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <BookOpen size={16} className="mr-1" /> 学习记录
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings size={16} />
            </Button>
          </div>
        </header>

        {/* Settings panel */}
        {showSettings && (
          <div className="bg-white border-b px-4 lg:px-6 py-3">
            <div className="max-w-2xl mx-auto space-y-2">
              <div className="flex gap-2 items-center text-xs text-gray-500">
                <input
                  type="text"
                  placeholder="API地址"
                  className="flex-1 px-2 py-1 border rounded text-xs"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="API Key (sk-...)"
                  className="flex-1 px-2 py-1 border rounded text-xs"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <span className="text-gray-400 shrink-0">
                  {apiKey ? "🟢 已配置" : "⚪ 演示模式"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Chat messages */}
        <ChatArea messages={messages} charName={char.name} isLoading={isLoading} />

        {/* Input */}
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>

      {/* Right sidebar - Materials */}
      <MaterialPanel
        selectedMaterial={selectedMaterial}
        onSelectMaterial={setSelectedMaterial}
      />

      {/* Diary dialog */}
      <DiaryDialog open={showDiary} onClose={() => setShowDiary(false)} />
    </div>
  );
}

function getWelcomeMessage(id: string): string {
  

const welcomemsgs: Record<string, string> = {
    linmo: "来了？今天想学什么？先说说你的理解，我不会直接给你答案。",
    suxiaoxiao: "哈喽哈喽！今天学什么呀？我们一起研究！",
    teacher_chen: "准备好了吗？今天我们来探索什么新知识？",
  };
  return welcomemsgs[id] || "今天想学什么？";
}
