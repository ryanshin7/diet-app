"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { mealLogSchema } from "@/lib/validations";

export async function addMealLog(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "인증이 필요합니다" };

  const raw = {
    food_item_id: (formData.get("food_item_id") as string) || undefined,
    food_name: formData.get("food_name") as string,
    meal_type: formData.get("meal_type") as string,
    log_date: formData.get("log_date") as string,
    serving_count: Number(formData.get("serving_count")),
    calories: Number(formData.get("calories")),
    protein_g: Number(formData.get("protein_g")),
    carbs_g: Number(formData.get("carbs_g")),
    fat_g: Number(formData.get("fat_g")),
  };

  const parsed = mealLogSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { serving_count, calories, protein_g, carbs_g, fat_g, ...rest } =
    parsed.data;

  const { error } = await supabase.from("meal_logs").insert({
    ...rest,
    user_id: user.id,
    serving_count,
    calories: calories * serving_count,
    protein_g: protein_g * serving_count,
    carbs_g: carbs_g * serving_count,
    fat_g: fat_g * serving_count,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/meals");
  return { success: true };
}

export async function deleteMealLog(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "인증이 필요합니다" };

  const { error } = await supabase
    .from("meal_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/meals");
  return { success: true };
}

export async function searchFoods(query: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("food_items")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .ilike("name", `%${query}%`)
    .limit(20);

  return data ?? [];
}
