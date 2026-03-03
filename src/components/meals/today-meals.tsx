import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MealCard } from "@/components/meals/meal-card";
import { MEAL_LABEL, type MealType } from "@/lib/constants";
import type { MealLog } from "@/types/database";

const mealOrder: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export function TodayMeals({ meals }: { meals: MealLog[] }) {
  const groupedMeals = mealOrder.reduce(
    (acc, type) => {
      acc[type] = meals.filter((m) => m.meal_type === type);
      return acc;
    },
    {} as Record<MealType, MealLog[]>
  );

  const hasAnyMeals = meals.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">오늘의 식사</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasAnyMeals ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            아직 기록된 식사가 없습니다
          </p>
        ) : (
          <div className="space-y-6">
            {mealOrder.map((type) => {
              const typeMeals = groupedMeals[type];
              if (typeMeals.length === 0) return null;
              const subtotal = typeMeals.reduce(
                (sum, m) => sum + Number(m.calories),
                0
              );
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">
                      {MEAL_LABEL[type]}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(subtotal)} kcal
                    </span>
                  </div>
                  <div className="space-y-2">
                    {typeMeals.map((meal) => (
                      <MealCard key={meal.id} meal={meal} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
