import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

const BASE = path.join(process.cwd(), "uploads");
const CHAR_DIR = path.join(process.cwd(), "src/lib");

function readFile(p: string): string {
  try {
    return readFileSync(p, "utf-8");
  } catch {
    return "";
  }
}

const DEMO_REPLIES: Record<string, any> = {
  linmo: {
    greeting: "来了。今天想学什么？先说说你的理解，我不会直接给答案。",
    question: (topic: string) => `你先说说你的思路。关于「${topic}」，你觉得第一步应该做什么？想清楚了再说。`,
    correct: (topic: string) => `嗯，这个方向是对的。那下一步呢？关于${topic}，继续推导看看。`,
    material: (topic: string) => `你上传了关于「${topic}」的资料。先用自己的话概括一下，这个知识点讲的是什么？`,
    encourage: "思路不错。继续。",
    default: (topic: string) => `关于「${topic}」，你先说说你目前知道多少？`,
  },
  suxiaoxiao: {
    greeting: "嘿嘿嘿！今天学什么呀？一起研究研究！",
    question: (topic: string) => `这个问题有意思！你先猜猜看，「${topic}」你觉得关键在哪里？猜错了也没关系！`,
    correct: (topic: string) => `对对对！就是这个思路！我们继续往下~`,
    material: (topic: string) => `哇，你找到了「${topic}」的资料！你先说说你觉得重点是什么？`,
    encourage: "你进步好大！继续继续！",
    default: (topic: string) => `来来来，今天攻克「${topic}」！先从你最感兴趣的部分开始说~`,
  },
  teacher_chen: {
    greeting: "准备好了吗？今天我们来探索什么新知识？",
    question: (topic: string) => `很好的问题。我们来拆解一下：关于「${topic}」，你觉得它解决的是什么样的问题？`,
    correct: (topic: string) => `很好！你已经抓住了重点。现在我们来深入一层。`,
    material: (topic: string) => `我看到你准备了「${topic}」的资料。先说说你觉得这个知识点的核心是什么？`,
    encourage: "比上次有进步。保持这个节奏，我相信你可以的。",
    default: (topic: string) => `今天我们聚焦「${topic}」。你有什么具体的问题想讨论吗？`,
  },
};

function getDemoReply(charId: string, msg: string, material: string, conversation: any[]) {
  const replies = DEMO_REPLIES[charId] || DEMO_REPLIES.teacher_chen;
  const hasQuestion = /[?？怎么什么为什么如何吗呢]/.test(msg);
  const hasAnswer = /[答案是等于因为所以我认为我觉得我的理解]/.test(msg);
  const isGreeting = /你好|嗨|hi|hello|开始|哈喽|在吗/i.test(msg);
  const topic = material
    ? material.split("\n").find((l: string) => l.trim().length > 5)?.trim().slice(0, 60) || "这个内容"
    : msg.slice(0, 30) || "这个";

  if (isGreeting) return replies.greeting;
  if (material && /资料|上传|学习资料/.test(msg)) return replies.material(topic);
  if (conversation.length > 2 && !hasQuestion && !hasAnswer) return replies.encourage;
  if (hasAnswer) return replies.correct(topic);
  if (hasQuestion) return replies.question(topic);
  return replies.default(topic);
}

export async function POST(req: NextRequest) {
  const { msg, charId, material, apiKey, apiUrl, conversation } = await req.json();

  const charDir = path.join(CHAR_DIR, "characters.ts");
  const settingPath = path.join(process.cwd(), "..", "study-squad", "setting.md");
  const progressPath = path.join(process.cwd(), "..", "study-squad", "progress.md");

  if (apiKey) {
    try {
      const response = await fetch(`${apiUrl.replace(/\/$/, "")}/v1/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `你是学习小队的AI学习伙伴。${
                material ? `学生正在学习的资料如下，请基于这份资料用苏格拉底式提问教学：\n${material.slice(0, 2000)}` : ""
              }
规则：1. 用苏格拉底式提问，不要直接给答案
2. 用问题引导学生自己发现
3. 回应要简洁，适合中学生
4. 偶尔关心学生的状态`,
            },
            ...(conversation || []).slice(-20),
            { role: "user", content: msg },
          ],
        }),
      });
      const data = await response.json();
      return NextResponse.json({ reply: data.choices?.[0]?.message?.content || "（无回复）" });
    } catch (e: any) {
      return NextResponse.json({ reply: `（AI连接失败: ${e.message}）\n让我们继续聊聊~` });
    }
  }

  return NextResponse.json({ reply: getDemoReply(charId, msg, material, conversation || []) });
}
