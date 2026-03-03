import { type ActivityLevel, ACTIVITY_MULTIPLIER } from "./constants";

export type Gender = "male" | "female";
export type GoalType = "lose" | "maintain" | "gain";

/**
 * Mifflin-St Jeor Equation
 * 남: 10 × 체중(kg) + 6.25 × 키(cm) - 5 × 나이 + 5
 * 여: 10 × 체중(kg) + 6.25 × 키(cm) - 5 × 나이 - 161
 */
export function calculateBMR(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIER[activity];
}

export function calculateDailyCalories(
  tdee: number,
  goal: GoalType
): number {
  switch (goal) {
    case "lose":
      return Math.round(tdee - 500);
    case "gain":
      return Math.round(tdee + 300);
    case "maintain":
      return Math.round(tdee);
  }
}

export function calculateMacros(
  dailyCalories: number,
  goal: GoalType
): { protein_g: number; carbs_g: number; fat_g: number } {
  let proteinRatio: number;
  let fatRatio: number;

  switch (goal) {
    case "lose":
      proteinRatio = 0.3;
      fatRatio = 0.25;
      break;
    case "gain":
      proteinRatio = 0.3;
      fatRatio = 0.25;
      break;
    case "maintain":
      proteinRatio = 0.25;
      fatRatio = 0.25;
      break;
  }

  const carbsRatio = 1 - proteinRatio - fatRatio;

  return {
    protein_g: Math.round((dailyCalories * proteinRatio) / 4),
    carbs_g: Math.round((dailyCalories * carbsRatio) / 4),
    fat_g: Math.round((dailyCalories * fatRatio) / 9),
  };
}
