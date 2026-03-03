import { createClient } from "@/lib/supabase/server";
import { RecommendationPanel } from "@/components/meals/recommendation-panel";

export default async function RecommendPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  const [{ data: profile }, { data: summary }] = await Promise.all([
    supabase
      .from("profiles")
      .select("daily_calories, protein_g, carbs_g, fat_g")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("daily_summaries")
      .select("*")
      .eq("user_id", user!.id)
      .eq("summary_date", today)
      .single(),
  ]);

  const remaining = {
    calories: (profile?.daily_calories ?? 2000) - Math.round(summary?.total_calories ?? 0),
    protein: (profile?.protein_g ?? 150) - Math.round(summary?.total_protein_g ?? 0),
    carbs: (profile?.carbs_g ?? 250) - Math.round(summary?.total_carbs_g ?? 0),
    fat: (profile?.fat_g ?? 55) - Math.round(summary?.total_fat_g ?? 0),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">AI 식단 추천</h1>
      <RecommendationPanel remaining={remaining} />
    </div>
  );
}
