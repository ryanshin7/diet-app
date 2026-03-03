"use client";

import { useState, useActionState } from "react";
import { completeOnboarding } from "@/actions/onboarding";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  calculateBMR,
  calculateTDEE,
  calculateDailyCalories,
  calculateMacros,
  type Gender,
  type GoalType,
} from "@/lib/nutrition";
import {
  ACTIVITY_LABEL,
  ACTIVITY_LEVELS,
  type ActivityLevel,
} from "@/lib/constants";

export function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [state, formAction, isPending] = useActionState(
    completeOnboarding,
    null
  );

  // Form state
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [goalWeightKg, setGoalWeightKg] = useState("");
  const [goal, setGoal] = useState<GoalType>("lose");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");

  const canProceed = () => {
    switch (step) {
      case 0:
        return age && gender && heightCm && weightKg;
      case 1:
        return goalWeightKg && goal;
      case 2:
        return activity;
      case 3:
        return true;
      default:
        return false;
    }
  };

  // Calculate preview for step 4
  const preview = (() => {
    const a = Number(age);
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (!a || !h || !w) return null;
    const bmr = calculateBMR(gender, w, h, a);
    const tdee = calculateTDEE(bmr, activity);
    const calories = calculateDailyCalories(tdee, goal);
    const macros = calculateMacros(calories, goal);
    return { bmr: Math.round(bmr), tdee: Math.round(tdee), calories, macros };
  })();

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">프로필 설정</CardTitle>
        <CardDescription>맞춤 식단 관리를 위한 정보를 입력하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <StepIndicator currentStep={step} />

        {state?.error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <form action={formAction}>
          {/* Hidden inputs for form submission */}
          <input type="hidden" name="age" value={age} />
          <input type="hidden" name="gender" value={gender} />
          <input type="hidden" name="height_cm" value={heightCm} />
          <input type="hidden" name="weight_kg" value={weightKg} />
          <input type="hidden" name="goal_weight_kg" value={goalWeightKg} />
          <input type="hidden" name="goal" value={goal} />
          <input type="hidden" name="activity" value={activity} />

          {/* Step 1: Basic Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>성별</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["male", "female"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={cn(
                        "rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors",
                        gender === g
                          ? "border-primary bg-primary/10"
                          : "border-muted hover:border-primary/50"
                      )}
                    >
                      {g === "male" ? "남성" : "여성"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">나이</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min={10}
                  max={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">키 (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="170"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  min={100}
                  max={250}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">체중 (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="70"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  min={30}
                  max={300}
                  step={0.1}
                />
              </div>
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>목표</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { value: "lose", label: "감량", desc: "체중을 줄이고 싶어요" },
                      { value: "maintain", label: "유지", desc: "현재 체중을 유지할래요" },
                      { value: "gain", label: "증량", desc: "체중을 늘리고 싶어요" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setGoal(item.value)}
                      className={cn(
                        "rounded-lg border-2 p-3 text-center transition-colors",
                        goal === item.value
                          ? "border-primary bg-primary/10"
                          : "border-muted hover:border-primary/50"
                      )}
                    >
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goalWeight">목표 체중 (kg)</Label>
                <Input
                  id="goalWeight"
                  type="number"
                  placeholder="65"
                  value={goalWeightKg}
                  onChange={(e) => setGoalWeightKg(e.target.value)}
                  min={30}
                  max={300}
                  step={0.1}
                />
              </div>
            </div>
          )}

          {/* Step 3: Activity Level */}
          {step === 2 && (
            <div className="space-y-3">
              <Label>활동 수준</Label>
              {ACTIVITY_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setActivity(level)}
                  className={cn(
                    "w-full rounded-lg border-2 p-3 text-left transition-colors",
                    activity === level
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <div className="text-sm font-medium">
                    {ACTIVITY_LABEL[level]}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Summary */}
          {step === 3 && preview && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">기초대사량 (BMR)</span>
                  <span className="font-medium">{preview.bmr} kcal</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    일일 에너지 소비량 (TDEE)
                  </span>
                  <span className="font-medium">{preview.tdee} kcal</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-base font-semibold">
                  <span>일일 목표 칼로리</span>
                  <span className="text-primary">{preview.calories} kcal</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-center">
                  <div className="text-xs text-muted-foreground">단백질</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {preview.macros.protein_g}g
                  </div>
                </div>
                <div className="rounded-lg bg-orange-50 dark:bg-orange-950 p-3 text-center">
                  <div className="text-xs text-muted-foreground">탄수화물</div>
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {preview.macros.carbs_g}g
                  </div>
                </div>
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-3 text-center">
                  <div className="text-xs text-muted-foreground">지방</div>
                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    {preview.macros.fat_g}g
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-6 flex gap-3">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep(step - 1)}
              >
                이전
              </Button>
            )}
            {step < 3 ? (
              <Button
                type="button"
                className="flex-1"
                disabled={!canProceed()}
                onClick={() => setStep(step + 1)}
              >
                다음
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex-1"
                disabled={isPending}
              >
                {isPending ? "저장 중..." : "시작하기"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
