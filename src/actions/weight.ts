"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addWeightLog(weightKg: number, logDate: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "인증이 필요합니다" };

  const { error } = await supabase.from("weight_logs").upsert(
    {
      user_id: user.id,
      weight_kg: weightKg,
      log_date: logDate,
    },
    { onConflict: "user_id,log_date" }
  );

  if (error) return { error: error.message };

  // Also update profile weight
  await supabase
    .from("profiles")
    .update({ weight_kg: weightKg })
    .eq("id", user.id);

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { success: true };
}
