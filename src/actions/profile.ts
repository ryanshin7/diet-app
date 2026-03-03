"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  calculateBMR,
  calculateTDEE,
  calculateDailyCalories,
  calculateMacros,
  type Gender,
  type GoalType,
} from "@/lib/nutrition";
import type { ActivityLevel } from "@/lib/constants";

export async function updateProfile(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "인증이 필요합니다" };

  // Get current profile for age and gender
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("age, gender")
    .eq("id", user.id)
    .single();

  if (!currentProfile) return { error: "프로필을 찾을 수 없습니다" };

  const heightCm = Number(formData.get("height_cm"));
  const weightKg = Number(formData.get("weight_kg"));
  const goalWeightKg = Number(formData.get("goal_weight_kg"));
  const goal = formData.get("goal") as GoalType;
  const activity = formData.get("activity") as ActivityLevel;

  // Recalculate nutrition targets
  const bmr = calculateBMR(
    currentProfile.gender as Gender,
    weightKg,
    heightCm,
    currentProfile.age!
  );
  const tdee = calculateTDEE(bmr, activity);
  const dailyCalories = calculateDailyCalories(tdee, goal);
  const macros = calculateMacros(dailyCalories, goal);

  const { error } = await supabase
    .from("profiles")
    .update({
      height_cm: heightCm,
      weight_kg: weightKg,
      goal_weight_kg: goalWeightKg,
      goal,
      activity,
      bmr: Math.round(bmr * 10) / 10,
      tdee: Math.round(tdee * 10) / 10,
      daily_calories: dailyCalories,
      ...macros,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/recommend");
  return { success: true };
}
