"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { onboardingSchema } from "@/lib/validations";
import {
  calculateBMR,
  calculateTDEE,
  calculateDailyCalories,
  calculateMacros,
} from "@/lib/nutrition";

export async function completeOnboarding(
  prevState: unknown,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "인증이 필요합니다" };

  const raw = {
    age: Number(formData.get("age")),
    gender: formData.get("gender") as string,
    height_cm: Number(formData.get("height_cm")),
    weight_kg: Number(formData.get("weight_kg")),
    goal_weight_kg: Number(formData.get("goal_weight_kg")),
    activity: formData.get("activity") as string,
    goal: formData.get("goal") as string,
  };

  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { age, gender, height_cm, weight_kg, goal_weight_kg, activity, goal } =
    parsed.data;

  const bmr = calculateBMR(gender, weight_kg, height_cm, age);
  const tdee = calculateTDEE(bmr, activity);
  const dailyCalories = calculateDailyCalories(tdee, goal);
  const macros = calculateMacros(dailyCalories, goal);

  const { error } = await supabase
    .from("profiles")
    .update({
      age,
      gender,
      height_cm,
      weight_kg,
      goal_weight_kg,
      activity,
      goal,
      bmr: Math.round(bmr * 10) / 10,
      tdee: Math.round(tdee * 10) / 10,
      daily_calories: dailyCalories,
      ...macros,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  await supabase.from("weight_logs").upsert({
    user_id: user.id,
    weight_kg,
    log_date: new Date().toISOString().split("T")[0],
  });

  redirect("/dashboard");
}
