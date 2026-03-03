export type Gender = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type GoalType = "lose" | "maintain" | "gain";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  age: number | null;
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal_weight_kg: number | null;
  activity: ActivityLevel | null;
  goal: GoalType | null;
  bmr: number | null;
  tdee: number | null;
  daily_calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface FoodItem {
  id: string;
  name: string;
  name_en: string | null;
  category: string | null;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  is_custom: boolean;
  user_id: string | null;
  created_at: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  food_item_id: string | null;
  food_name: string;
  meal_type: MealType;
  log_date: string;
  serving_count: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
}

export interface DailySummary {
  id: string;
  user_id: string;
  summary_date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  meal_count: number;
  target_calories: number | null;
  created_at: string;
  updated_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  log_date: string;
  created_at: string;
}
