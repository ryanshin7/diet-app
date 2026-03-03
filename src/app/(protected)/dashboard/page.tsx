import { createClient } from "@/lib/supabase/server";
import { NutritionSummary } from "@/components/nutrition/nutrition-summary";
import { TodayMeals } from "@/components/meals/today-meals";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  const [{ data: profile }, { data: todayMeals }, { data: summary }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("daily_calories, protein_g, carbs_g, fat_g, display_name")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("log_date", today)
        .order("created_at", { ascending: true }),
      supabase
        .from("daily_summaries")
        .select("*")
        .eq("user_id", user!.id)
        .eq("summary_date", today)
        .single(),
    ]);

  const targets = {
    calories: profile?.daily_calories ?? 2000,
    protein: profile?.protein_g ?? 150,
    carbs: profile?.carbs_g ?? 250,
    fat: profile?.fat_g ?? 55,
  };

  const consumed = {
    calories: Math.round(summary?.total_calories ?? 0),
    protein: Math.round(summary?.total_protein_g ?? 0),
    carbs: Math.round(summary?.total_carbs_g ?? 0),
    fat: Math.round(summary?.total_fat_g ?? 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            안녕하세요, {profile?.display_name ?? ""}님
          </h1>
          <p className="text-muted-foreground">오늘의 식단을 확인하세요</p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/meals">
              <Plus className="mr-1 h-4 w-4" />
              식사 기록
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/recommend">
              <Sparkles className="mr-1 h-4 w-4" />
              AI 추천
            </Link>
          </Button>
        </div>
      </div>

      <NutritionSummary targets={targets} consumed={consumed} />

      <TodayMeals meals={todayMeals ?? []} />
    </div>
  );
}
