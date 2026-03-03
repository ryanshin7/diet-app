"use client";

import { deleteMealLog } from "@/actions/meals";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { MealLog } from "@/types/database";

export function MealCard({ meal }: { meal: MealLog }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{meal.food_name}</span>
          {meal.serving_count !== 1 && (
            <span className="text-xs text-muted-foreground">
              x{meal.serving_count}
            </span>
          )}
        </div>
        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
          <span>{Math.round(Number(meal.calories))} kcal</span>
          <span>단 {Math.round(Number(meal.protein_g))}g</span>
          <span>탄 {Math.round(Number(meal.carbs_g))}g</span>
          <span>지 {Math.round(Number(meal.fat_g))}g</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={async () => {
          await deleteMealLog(meal.id);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
