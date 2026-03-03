export const APP_NAME = "식단 관리";
export const APP_DESCRIPTION = "AI 기반 한국식 식단 관리 앱";

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

export const ACTIVITY_LEVELS = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: "비활동적 (운동 안 함)",
  light: "가벼운 활동 (주 1-3회)",
  moderate: "보통 활동 (주 3-5회)",
  active: "활발한 활동 (주 6-7회)",
  very_active: "매우 활발 (고강도 매일)",
};

export const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const GOAL_LABEL: Record<string, string> = {
  lose: "체중 감량",
  maintain: "체중 유지",
  gain: "체중 증가",
};

export const FOOD_CATEGORIES = [
  "밥류",
  "국/찌개류",
  "고기류",
  "생선류",
  "반찬류",
  "면류",
  "분식류",
  "빵류",
  "과일류",
  "채소류",
  "유제품류",
  "음료류",
  "간식류",
  "주류",
] as const;
