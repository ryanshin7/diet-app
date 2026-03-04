"use client";

import { useState } from "react";
import { quickAddMealLog } from "@/actions/meals";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FoodSearch } from "@/components/meals/food-search";
import { MEAL_LABEL, type MealType } from "@/lib/constants";
import { toast } from "sonner";
import type { FoodItem } from "@/types/database";

export function MealLogDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servingCount, setServingCount] = useState("1");
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("0");
  const [manualCarbs, setManualCarbs] = useState("0");
  const [manualFat, setManualFat] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setSelectedFood(null);
    setServingCount("1");
    setManualMode(false);
    setManualName("");
    setManualCalories("");
    setManualProtein("0");
    setManualCarbs("0");
    setManualFat("0");
    setError(null);
  };

  const count = Number(servingCount) || 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    let foodName: string;
    let calories: number;
    let protein_g: number;
    let carbs_g: number;
    let fat_g: number;

    if (manualMode) {
      foodName = manualName;
      calories = Number(manualCalories) || 0;
      protein_g = Number(manualProtein) || 0;
      carbs_g = Number(manualCarbs) || 0;
      fat_g = Number(manualFat) || 0;
    } else if (selectedFood) {
      foodName = selectedFood.name;
      calories = Math.round(Number(selectedFood.calories) * count);
      protein_g = Math.round(Number(selectedFood.protein_g) * count);
      carbs_g = Math.round(Number(selectedFood.carbs_g) * count);
      fat_g = Math.round(Number(selectedFood.fat_g) * count);
    } else {
      setIsSubmitting(false);
      return;
    }

    const result = await quickAddMealLog({
      food_name: foodName,
      meal_type: mealType,
      calories,
      protein_g,
      carbs_g,
      fat_g,
    });

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success(`${foodName}이(가) ${MEAL_LABEL[mealType]}에 기록되었습니다`);
    setOpen(false);
    resetForm();
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>식사 기록</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meal Type Tabs */}
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

          {!manualMode ? (
            <>
              <FoodSearch
                onSelect={(food) => {
                  setSelectedFood(food);
                  setServingCount("1");
                }}
              />

              {selectedFood && (
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {selectedFood.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFood(null)}
                    >
                      변경
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>인분</Label>
                    <Input
                      type="number"
                      value={servingCount}
                      onChange={(e) => setServingCount(e.target.value)}
                      min={0.5}
                      max={20}
                      step={0.5}
                    />
                  </div>

                  <div className="rounded-lg bg-muted p-2 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>칼로리</span>
                      <span className="font-medium">
                        {Math.round(Number(selectedFood.calories) * count)} kcal
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>단백질</span>
                      <span>
                        {Math.round(Number(selectedFood.protein_g) * count)}g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>탄수화물</span>
                      <span>
                        {Math.round(Number(selectedFood.carbs_g) * count)}g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>지방</span>
                      <span>
                        {Math.round(Number(selectedFood.fat_g) * count)}g
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setManualMode(true)}
                className="text-xs text-muted-foreground underline"
              >
                직접 입력하기
              </button>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>음식 이름</Label>
                  <Input
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="음식 이름을 입력하세요"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>칼로리 (kcal)</Label>
                    <Input
                      type="number"
                      value={manualCalories}
                      onChange={(e) => setManualCalories(e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>단백질 (g)</Label>
                    <Input
                      type="number"
                      value={manualProtein}
                      onChange={(e) => setManualProtein(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>탄수화물 (g)</Label>
                    <Input
                      type="number"
                      value={manualCarbs}
                      onChange={(e) => setManualCarbs(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>지방 (g)</Label>
                    <Input
                      type="number"
                      value={manualFat}
                      onChange={(e) => setManualFat(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="text-xs text-muted-foreground underline"
              >
                음식 검색하기
              </button>
            </>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              isSubmitting ||
              (!manualMode && !selectedFood) ||
              (manualMode && (!manualName || !manualCalories))
            }
          >
            {isSubmitting ? "기록 중..." : "기록하기"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
