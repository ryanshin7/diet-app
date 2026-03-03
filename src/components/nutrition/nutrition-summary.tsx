"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MacroBar } from "@/components/nutrition/macro-bar";

interface NutritionSummaryProps {
  targets: { calories: number; protein: number; carbs: number; fat: number };
  consumed: { calories: number; protein: number; carbs: number; fat: number };
}

export function NutritionSummary({ targets, consumed }: NutritionSummaryProps) {
  const caloriePercent = Math.min(
    Math.round((consumed.calories / targets.calories) * 100),
    100
  );
  const remaining = targets.calories - consumed.calories;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">오늘의 영양 요약</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Calorie Circle */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative h-40 w-40">
              <svg className="h-40 w-40 -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-muted"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - caloriePercent / 100)}`}
                  strokeLinecap="round"
                  className={
                    caloriePercent > 100
                      ? "text-destructive"
                      : caloriePercent > 80
                        ? "text-yellow-500"
                        : "text-primary"
                  }
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{consumed.calories}</span>
                <span className="text-xs text-muted-foreground">
                  / {targets.calories} kcal
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {remaining > 0
                ? `${remaining} kcal 남음`
                : `${Math.abs(remaining)} kcal 초과`}
            </p>
          </div>

          {/* Macro Bars */}
          <div className="flex-1 space-y-4">
            <MacroBar
              label="단백질"
              consumed={consumed.protein}
              target={targets.protein}
              unit="g"
              color="bg-blue-500"
            />
            <MacroBar
              label="탄수화물"
              consumed={consumed.carbs}
              target={targets.carbs}
              unit="g"
              color="bg-orange-500"
            />
            <MacroBar
              label="지방"
              consumed={consumed.fat}
              target={targets.fat}
              unit="g"
              color="bg-yellow-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
