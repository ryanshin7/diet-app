import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

  const { foodName } = await request.json();

  if (!foodName || typeof foodName !== "string") {
    return new Response(JSON.stringify({ error: "음식 이름이 필요합니다" }), {
      status: 400,
    });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(
      `"${foodName}"의 1인분 기준 영양 정보를 JSON으로 알려주세요.
반드시 아래 형식으로만 답변하세요. 설명 없이 JSON만 출력하세요.

{"name":"음식이름","serving_size":0,"serving_unit":"g","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0}

규칙:
- name: 한국어 음식 이름 (1인분 기준 명시)
- serving_size: 1인분 기준 그램 수
- 모든 숫자는 정수로 반올림
- 실제 영양 정보에 기반하세요`
    );

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[^}]+\}/);

    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "영양 정보를 생성할 수 없습니다" }),
        { status: 500 }
      );
    }

    const food = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(food), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI 생성 중 오류가 발생했습니다.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
