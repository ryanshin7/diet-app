import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `당신은 한국식 식단 관리 전문 영양사입니다. 사용자의 남은 칼로리와 영양소 목표에 맞는 한국 음식을 추천해주세요.

규칙:
1. 반드시 한국어로 답변하세요
2. 실제 존재하는 한국 음식만 추천하세요
3. 각 음식의 예상 영양 정보를 포함하세요 (칼로리, 단백질, 탄수화물, 지방)
4. 1인분 기준으로 추천하세요
5. 간단하고 실용적인 추천을 하세요
6. 추천 이유를 간략히 설명하세요
7. 3가지 음식을 추천하세요

응답 형식 (각 추천마다):
**음식 이름**
- 칼로리: ~XXX kcal
- 단백질: ~XXg | 탄수화물: ~XXg | 지방: ~XXg
- 추천 이유: (1줄)`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const {
    remainingCalories,
    remainingProtein,
    remainingCarbs,
    remainingFat,
    mealType,
    preferences,
  } = await request.json();

  const mealLabels: Record<string, string> = {
    breakfast: "아침",
    lunch: "점심",
    dinner: "저녁",
    snack: "간식",
  };

  const userMessage = `현재 상태:
- 남은 칼로리: ${remainingCalories}kcal
- 남은 단백질: ${remainingProtein}g
- 남은 탄수화물: ${remainingCarbs}g
- 남은 지방: ${remainingFat}g
- 식사 종류: ${mealLabels[mealType] || mealType}
${preferences ? `- 선호사항: ${preferences}` : ""}

이 조건에 맞는 한국 음식을 3가지 추천해주세요.`;

  const stream = anthropic.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
            )
          );
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
