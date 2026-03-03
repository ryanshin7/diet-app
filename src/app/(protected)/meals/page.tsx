import { createClient } from "@/lib/supabase/server";
import { MealLogDialog } from "@/components/meals/meal-log-dialog";
import { TodayMeals } from "@/components/meals/today-meals";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function MealsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  const { data: todayMeals } = await supabase
    .from("meal_logs")
    .select("*")
    .eq("user_id", user!.id)
    .eq("log_date", today)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">식사 기록</h1>
        <MealLogDialog>
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            식사 추가
          </Button>
        </MealLogDialog>
      </div>

      <TodayMeals meals={todayMeals ?? []} />
    </div>
  );
}
