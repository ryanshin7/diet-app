import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
});

export const signupSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
  displayName: z.string().min(1, "이름을 입력해주세요").max(50),
});

export const onboardingSchema = z.object({
  age: z.number().min(10, "나이는 10세 이상이어야 합니다").max(120),
  gender: z.enum(["male", "female"]),
  height_cm: z.number().min(100, "키는 100cm 이상이어야 합니다").max(250),
  weight_kg: z.number().min(30, "체중은 30kg 이상이어야 합니다").max(300),
  goal_weight_kg: z.number().min(30).max(300),
  activity: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  goal: z.enum(["lose", "maintain", "gain"]),
});

export const mealLogSchema = z.object({
  food_item_id: z.string().uuid().optional(),
  food_name: z.string().min(1, "음식 이름을 입력해주세요"),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serving_count: z.number().min(0.1).max(20).default(1),
  calories: z.number().min(0),
  protein_g: z.number().min(0).default(0),
  carbs_g: z.number().min(0).default(0),
  fat_g: z.number().min(0).default(0),
});

export const weightLogSchema = z.object({
  weight_kg: z.number().min(30).max(300),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
