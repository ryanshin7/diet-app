"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, Plus, Check } from "lucide-react";
import { MEAL_LABEL, type MealType } from "@/lib/constants";
import { quickAddMealLog } from "@/actions/meals";
import { toast } from "sonner";

interface Props {
  remaining: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface ParsedFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function parseRecommendations(text: string): ParsedFood[] {
  const foods: ParsedFood[] = [];
  const blocks = text.split(/\*\*/).filter(Boolean);

  for (let i = 0; i < blocks.length; i++) {
    const nameBlock = blocks[i];
    const name = nameBlock.split("\n")[0].replace(/\*+/g, "").trim();
    if (!name || name.length > 50) continue;

    const nextBlock = blocks[i + 1] || "";
    const combined = nameBlock + nextBlock;

    const calMatch = combined.match(/칼로리[:\s]*~?(\d+)/);
    const proMatch = combined.match(/단백질[:\s]*~?(\d+)/);
    const carbMatch = combined.match(/탄수화물[:\s]*~?(\d+)/);
    const fatMatch = combined.match(/지방[:\s]*~?(\d+)/);

    if (calMatch) {
      foods.push({
        name,
        calories: parseInt(calMatch[1]),
        protein: proMatch ? parseInt(proMatch[1]) : 0,
        carbs: carbMatch ? parseInt(carbMatch[1]) : 0,
        fat: fatMatch ? parseInt(fatMatch[1]) : 0,
      });
    }
  }

  return foods;
}

export function RecommendationPanel({ remaining }: Props) {
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [preferences, setPreferences] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedFoods, setParsedFoods] = useState<ParsedFood[]>([]);
  const [registeredIndexes, setRegisteredIndexes] = useState<Set<number>>(
    new Set()
  );
  const [registeringIndex, setRegisteringIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && response && !response.startsWith("오류")) {
      setParsedFoods(parseRecommendations(response));
    }
  }, [isLoading, response]);

  const handleRecommend = useCallback(async () => {
    setIsLoading(true);
    setResponse("");
    setParsedFoods([]);
    setRegisteredIndexes(new Set());

    try {
      const res = await fetch("/api/recommend-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remainingCalories: remaining.calories,
          remainingProtein: remaining.protein,
          remainingCarbs: remaining.carbs,
          remainingFat: remaining.fat,
          mealType,
          preferences: preferences || undefined,
        }),
      });

      if (!res.ok) {
        setResponse("추천을 가져오는 데 실패했습니다. 다시 시도해주세요.");
        setIsLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                setResponse(`오류: ${data.error}`);
                setIsLoading(false);
                return;
              }
              setResponse((prev) => prev + data.text);
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch {
      setResponse("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    }

    setIsLoading(false);
  }, [remaining, mealType, preferences]);

  const handleRegister = async (food: ParsedFood, index: number) => {
    setRegisteringIndex(index);
    const result = await quickAddMealLog({
      food_name: food.name,
      meal_type: mealType,
      calories: food.calories,
      protein_g: food.protein,
      carbs_g: food.carbs,
      fat_g: food.fat,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`${food.name}이(가) ${MEAL_LABEL[mealType]}에 등록되었습니다`);
      setRegisteredIndexes((prev) => new Set(prev).add(index));
    }
    setRegisteringIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Remaining Nutrients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">남은 영양소</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-muted p-3 text-center">
              <div className="text-xs text-muted-foreground">칼로리</div>
              <div className="text-lg font-bold">
                {remaining.calories > 0 ? remaining.calories : 0} kcal
              </div>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-center">
              <div className="text-xs text-muted-foreground">단백질</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {remaining.protein > 0 ? remaining.protein : 0}g
              </div>
            </div>
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950 p-3 text-center">
              <div className="text-xs text-muted-foreground">탄수화물</div>
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {remaining.carbs > 0 ? remaining.carbs : 0}g
              </div>
            </div>
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-3 text-center">
              <div className="text-xs text-muted-foreground">지방</div>
              <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {remaining.fat > 0 ? remaining.fat : 0}g
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5" />
            AI 추천 받기
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>식사 종류</Label>
            <Tabs
              value={mealType}
              onValueChange={(v) => setMealType(v as MealType)}
            >
              <TabsList className="grid w-full grid-cols-4">
                {(Object.keys(MEAL_LABEL) as MealType[]).map((type) => (
                  <TabsTrigger key={type} value={type}>
                    {MEAL_LABEL[type]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label>선호사항 (선택)</Label>
            <Input
              placeholder="예: 매운 음식, 고단백, 다이어트 등..."
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleRecommend}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                추천 생성 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                식단 추천 받기
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Parsed Food Cards with Register Buttons */}
      {parsedFoods.length > 0 && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">추천 음식 바로 등록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {parsedFoods.map((food, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{food.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {food.calories}kcal · 단 {food.protein}g · 탄{" "}
                    {food.carbs}g · 지 {food.fat}g
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={registeredIndexes.has(i) ? "secondary" : "default"}
                  disabled={registeredIndexes.has(i) || registeringIndex === i}
                  onClick={() => handleRegister(food, i)}
                  className="ml-3 shrink-0"
                >
                  {registeringIndex === i ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : registeredIndexes.has(i) ? (
                    <>
                      <Check className="mr-1 h-4 w-4" />
                      등록됨
                    </>
                  ) : (
                    <>
                      <Plus className="mr-1 h-4 w-4" />
                      등록
                    </>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Streaming Response */}
      {(response || isLoading) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">추천 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {response}
              {isLoading && !response && (
                <span className="text-muted-foreground">
                  추천을 생성하고 있습니다...
                </span>
              )}
              {isLoading && response && (
                <span className="animate-pulse">|</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
