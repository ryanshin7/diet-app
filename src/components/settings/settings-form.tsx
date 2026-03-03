"use client";

import { useState, useActionState } from "react";
import { updateProfile } from "@/actions/profile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ACTIVITY_LABEL, ACTIVITY_LEVELS, type ActivityLevel } from "@/lib/constants";
import type { Profile } from "@/types/database";
import type { GoalType } from "@/lib/nutrition";

export function SettingsForm({ profile }: { profile: Profile }) {
  const [heightCm, setHeightCm] = useState(String(profile.height_cm ?? ""));
  const [weightKg, setWeightKg] = useState(String(profile.weight_kg ?? ""));
  const [goalWeightKg, setGoalWeightKg] = useState(
    String(profile.goal_weight_kg ?? "")
  );
  const [goal, setGoal] = useState<GoalType>(
    (profile.goal as GoalType) ?? "maintain"
  );
  const [activity, setActivity] = useState<ActivityLevel>(
    (profile.activity as ActivityLevel) ?? "moderate"
  );

  const [state, formAction, isPending] = useActionState(updateProfile, null);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="goal" value={goal} />
      <input type="hidden" name="activity" value={activity} />

      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300">
          설정이 저장되었습니다
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>신체 정보</CardTitle>
          <CardDescription>변경하면 영양 목표가 자동으로 재계산됩니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>키 (cm)</Label>
              <Input
                name="height_cm"
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                min={100}
                max={250}
              />
            </div>
            <div className="space-y-2">
              <Label>현재 체중 (kg)</Label>
              <Input
                name="weight_kg"
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                min={30}
                max={300}
                step={0.1}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>목표 체중 (kg)</Label>
            <Input
              name="goal_weight_kg"
              type="number"
              value={goalWeightKg}
              onChange={(e) => setGoalWeightKg(e.target.value)}
              min={30}
              max={300}
              step={0.1}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>목표</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                { value: "lose", label: "감량" },
                { value: "maintain", label: "유지" },
                { value: "gain", label: "증량" },
              ] as const
            ).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setGoal(item.value)}
                className={cn(
                  "rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors",
                  goal === item.value
                    ? "border-primary bg-primary/10"
                    : "border-muted hover:border-primary/50"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>활동 수준</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ACTIVITY_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setActivity(level)}
              className={cn(
                "w-full rounded-lg border-2 p-3 text-left text-sm transition-colors",
                activity === level
                  ? "border-primary bg-primary/10"
                  : "border-muted hover:border-primary/50"
              )}
            >
              {ACTIVITY_LABEL[level]}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Current targets display */}
      <Card>
        <CardHeader>
          <CardTitle>현재 영양 목표</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-muted p-3 text-center">
              <div className="text-xs text-muted-foreground">일일 칼로리</div>
              <div className="text-lg font-bold">{profile.daily_calories} kcal</div>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-center">
              <div className="text-xs text-muted-foreground">단백질</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{profile.protein_g}g</div>
            </div>
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950 p-3 text-center">
              <div className="text-xs text-muted-foreground">탄수화물</div>
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{profile.carbs_g}g</div>
            </div>
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-3 text-center">
              <div className="text-xs text-muted-foreground">지방</div>
              <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{profile.fat_g}g</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "저장 중..." : "설정 저장"}
      </Button>
    </form>
  );
}
