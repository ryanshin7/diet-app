"use client";

import { useState, useActionState } from "react";
import { addMealLog } from "@/actions/meals";
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

  const [state, formAction, isPending] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      const result = await addMealLog(prevState, formData);
      if (result?.success) {
        setOpen(false);
        resetForm();
      }
      return result;
    },
    null
  );

  const resetForm = () => {
    setSelectedFood(null);
    setServingCount("1");
    setManualMode(false);
    setManualName("");
    setManualCalories("");
    setManualProtein("0");
    setManualCarbs("0");
    setManualFat("0");
  };

  const count = Number(servingCount) || 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>식사 기록</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input
            type="hidden"
            name="log_date"
            value={new Date().toISOString().split("T")[0]}
          />
          <input type="hidden" name="meal_type" value={mealType} />

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

                  <input
                    type="hidden"
                    name="food_item_id"
                    value={selectedFood.id}
                  />
                  <input
                    type="hidden"
                    name="food_name"
                    value={selectedFood.name}
                  />
                  <input
                    type="hidden"
                    name="calories"
                    value={selectedFood.calories}
                  />
                  <input
                    type="hidden"
                    name="protein_g"
                    value={selectedFood.protein_g}
                  />
                  <input
                    type="hidden"
                    name="carbs_g"
                    value={selectedFood.carbs_g}
                  />
                  <input
                    type="hidden"
                    name="fat_g"
                    value={selectedFood.fat_g}
                  />

                  <div className="space-y-2">
                    <Label>인분</Label>
                    <Input
                      name="serving_count"
                      type="number"
                      value={servingCount}
                      onChange={(e) => setServingCount(e.target.value)}
                      min={0.1}
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
                    name="food_name"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="음식 이름을 입력하세요"
                    required
                  />
                </div>
                <input type="hidden" name="serving_count" value="1" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>칼로리 (kcal)</Label>
                    <Input
                      name="calories"
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
                      name="protein_g"
                      type="number"
                      value={manualProtein}
                      onChange={(e) => setManualProtein(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>탄수화물 (g)</Label>
                    <Input
                      name="carbs_g"
                      type="number"
                      value={manualCarbs}
                      onChange={(e) => setManualCarbs(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>지방 (g)</Label>
                    <Input
                      name="fat_g"
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

          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              isPending ||
              (!manualMode && !selectedFood) ||
              (manualMode && (!manualName || !manualCalories))
            }
          >
            {isPending ? "기록 중..." : "기록하기"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
