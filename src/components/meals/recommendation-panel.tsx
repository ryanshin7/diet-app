"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2 } from "lucide-react";
import { MEAL_LABEL, type MealType } from "@/lib/constants";

interface Props {
  remaining: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export function RecommendationPanel({ remaining }: Props) {
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [preferences, setPreferences] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRecommend = useCallback(async () => {
    setIsLoading(true);
    setResponse("");

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
              const { text } = JSON.parse(line.slice(6));
              setResponse((prev) => prev + text);
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
                <span className="text-muted-foreground">추천을 생성하고 있습니다...</span>
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
