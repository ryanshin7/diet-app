-- ======================
-- 1. PROFILES TABLE
-- ======================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female')),
  height_cm NUMERIC(5,1),
  weight_kg NUMERIC(5,1),
  goal_weight_kg NUMERIC(5,1),
  activity TEXT CHECK (activity IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal TEXT CHECK (goal IN ('lose', 'maintain', 'gain')),
  bmr NUMERIC(7,1),
  tdee NUMERIC(7,1),
  daily_calories INTEGER,
  protein_g INTEGER,
  carbs_g INTEGER,
  fat_g INTEGER,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ======================
-- 2. FOOD ITEMS TABLE
-- ======================
CREATE TABLE public.food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  serving_size NUMERIC(7,1) NOT NULL,
  serving_unit TEXT DEFAULT 'g',
  calories NUMERIC(7,1) NOT NULL,
  protein_g NUMERIC(6,1) DEFAULT 0,
  carbs_g NUMERIC(6,1) DEFAULT 0,
  fat_g NUMERIC(6,1) DEFAULT 0,
  fiber_g NUMERIC(6,1) DEFAULT 0,
  sodium_mg NUMERIC(7,1) DEFAULT 0,
  is_custom BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_food_items_name ON public.food_items USING gin(to_tsvector('simple', name));
CREATE INDEX idx_food_items_category ON public.food_items(category);

ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read built-in foods"
  ON public.food_items FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert custom foods"
  ON public.food_items FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_custom = TRUE);

CREATE POLICY "Users can update own custom foods"
  ON public.food_items FOR UPDATE
  USING (auth.uid() = user_id AND is_custom = TRUE);

CREATE POLICY "Users can delete own custom foods"
  ON public.food_items FOR DELETE
  USING (auth.uid() = user_id AND is_custom = TRUE);

-- ======================
-- 3. MEAL LOGS TABLE
-- ======================
CREATE TABLE public.meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES public.food_items(id) ON DELETE SET NULL,
  food_name TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  serving_count NUMERIC(4,1) DEFAULT 1,
  calories NUMERIC(7,1) NOT NULL,
  protein_g NUMERIC(6,1) DEFAULT 0,
  carbs_g NUMERIC(6,1) DEFAULT 0,
  fat_g NUMERIC(6,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_meal_logs_user_date ON public.meal_logs(user_id, log_date DESC);

ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own meal logs"
  ON public.meal_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ======================
-- 4. DAILY SUMMARIES TABLE
-- ======================
CREATE TABLE public.daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  total_calories NUMERIC(7,1) DEFAULT 0,
  total_protein_g NUMERIC(6,1) DEFAULT 0,
  total_carbs_g NUMERIC(6,1) DEFAULT 0,
  total_fat_g NUMERIC(6,1) DEFAULT 0,
  meal_count INTEGER DEFAULT 0,
  target_calories INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, summary_date)
);

CREATE INDEX idx_daily_summaries_user_date ON public.daily_summaries(user_id, summary_date DESC);

ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own summaries"
  ON public.daily_summaries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update daily summary when meal_logs change
CREATE OR REPLACE FUNCTION public.update_daily_summary()
RETURNS TRIGGER AS $$
DECLARE
  target_date DATE;
  target_user UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_date := OLD.log_date;
    target_user := OLD.user_id;
  ELSE
    target_date := NEW.log_date;
    target_user := NEW.user_id;
  END IF;

  INSERT INTO public.daily_summaries (user_id, summary_date, total_calories, total_protein_g, total_carbs_g, total_fat_g, meal_count, target_calories)
  SELECT
    target_user,
    target_date,
    COALESCE(SUM(calories), 0),
    COALESCE(SUM(protein_g), 0),
    COALESCE(SUM(carbs_g), 0),
    COALESCE(SUM(fat_g), 0),
    COUNT(*),
    (SELECT daily_calories FROM public.profiles WHERE id = target_user)
  FROM public.meal_logs
  WHERE user_id = target_user AND log_date = target_date
  ON CONFLICT (user_id, summary_date)
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein_g = EXCLUDED.total_protein_g,
    total_carbs_g = EXCLUDED.total_carbs_g,
    total_fat_g = EXCLUDED.total_fat_g,
    meal_count = EXCLUDED.meal_count,
    target_calories = EXCLUDED.target_calories,
    updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_meal_log_change
  AFTER INSERT OR UPDATE OR DELETE ON public.meal_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_daily_summary();

-- ======================
-- 5. WEIGHT LOGS TABLE
-- ======================
CREATE TABLE public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,1) NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, log_date)
);

CREATE INDEX idx_weight_logs_user_date ON public.weight_logs(user_id, log_date DESC);

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own weight logs"
  ON public.weight_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ======================
-- 6. SEED: KOREAN FOOD DATABASE
-- ======================
INSERT INTO public.food_items (name, category, serving_size, calories, protein_g, carbs_g, fat_g, sodium_mg) VALUES
-- 밥류
('흰밥', '밥류', 210, 313, 5.3, 68.6, 0.6, 3),
('현미밥', '밥류', 210, 310, 6.5, 65.8, 1.8, 5),
('잡곡밥', '밥류', 210, 305, 6.8, 64.2, 1.5, 8),
('볶음밥', '밥류', 300, 450, 12.0, 62.0, 16.0, 820),
('비빔밥', '밥류', 450, 530, 18.5, 78.2, 14.8, 680),
('김밥 (1줄)', '밥류', 250, 430, 12.5, 65.0, 12.0, 780),
('김치볶음밥', '밥류', 300, 468, 11.5, 64.0, 17.5, 890),
('오므라이스', '밥류', 350, 520, 16.0, 68.0, 18.0, 750),
('카레라이스', '밥류', 400, 550, 14.0, 82.0, 16.0, 920),
('덮밥 (제육)', '밥류', 400, 580, 22.0, 72.0, 20.0, 850),
-- 국/찌개류
('김치찌개', '국/찌개류', 300, 158, 11.2, 8.5, 9.1, 1280),
('된장찌개', '국/찌개류', 300, 127, 8.4, 10.2, 5.8, 1150),
('순두부찌개', '국/찌개류', 350, 180, 13.0, 8.0, 11.0, 1100),
('부대찌개', '국/찌개류', 400, 350, 18.0, 22.0, 20.0, 1500),
('미역국', '국/찌개류', 250, 45, 3.5, 4.2, 1.5, 680),
('소고기무국', '국/찌개류', 300, 85, 7.5, 5.8, 3.2, 750),
('콩나물국', '국/찌개류', 250, 35, 3.2, 3.5, 0.8, 620),
('떡국', '국/찌개류', 400, 420, 15.0, 65.0, 10.0, 1050),
('삼계탕', '국/찌개류', 500, 550, 38.0, 35.0, 25.0, 850),
-- 고기류
('삼겹살 (구이, 100g)', '고기류', 100, 331, 17.2, 0, 29.3, 58),
('닭가슴살 (100g)', '고기류', 100, 109, 23.1, 0, 1.2, 45),
('소고기 등심 (구이, 100g)', '고기류', 100, 250, 26.0, 0, 16.0, 55),
('돼지갈비 (양념, 150g)', '고기류', 150, 380, 22.0, 18.0, 24.0, 720),
('닭볶음탕 (1인분)', '고기류', 350, 380, 28.0, 15.0, 22.0, 950),
('제육볶음 (1인분)', '고기류', 200, 320, 20.0, 12.0, 22.0, 780),
('불고기 (1인분)', '고기류', 150, 258, 24.3, 12.5, 12.1, 620),
('치킨 (후라이드 1조각)', '고기류', 100, 260, 18.0, 10.0, 16.0, 450),
('치킨 (양념 1조각)', '고기류', 100, 290, 17.0, 18.0, 16.0, 520),
('족발 (100g)', '고기류', 100, 220, 26.0, 0, 12.0, 380),
-- 생선/해산물류
('고등어구이 (1토막)', '생선류', 100, 180, 20.0, 0, 11.0, 350),
('연어 (회, 100g)', '생선류', 100, 180, 20.0, 0, 11.0, 50),
('참치회 (100g)', '생선류', 100, 130, 28.0, 0, 1.5, 45),
('새우 (100g)', '생선류', 100, 85, 18.0, 0.5, 0.8, 200),
('오징어볶음 (1인분)', '생선류', 200, 220, 22.0, 12.0, 8.0, 680),
-- 반찬류
('계란프라이 (1개)', '반찬류', 60, 107, 7.5, 0.4, 8.4, 198),
('계란말이 (1인분)', '반찬류', 100, 160, 11.0, 2.0, 12.0, 350),
('김치 (1인분)', '반찬류', 40, 12, 0.8, 1.8, 0.2, 280),
('깍두기 (1인분)', '반찬류', 40, 15, 0.6, 2.5, 0.2, 300),
('잡채 (1인분)', '반찬류', 150, 245, 5.2, 38.1, 8.3, 520),
('두부조림 (1인분)', '반찬류', 120, 110, 8.0, 6.0, 6.0, 450),
('시금치나물 (1인분)', '반찬류', 70, 25, 2.5, 2.8, 0.5, 300),
('콩나물무침 (1인분)', '반찬류', 70, 30, 2.8, 3.2, 0.6, 280),
('멸치볶음 (1인분)', '반찬류', 30, 70, 6.0, 3.0, 3.5, 350),
('감자조림 (1인분)', '반찬류', 100, 120, 2.0, 22.0, 2.5, 380),
('어묵볶음 (1인분)', '반찬류', 80, 95, 6.0, 10.0, 3.0, 420),
-- 면류
('라면', '면류', 120, 500, 10.2, 72.3, 18.6, 1750),
('짜장면', '면류', 400, 620, 15.0, 88.0, 22.0, 1200),
('짬뽕', '면류', 450, 520, 18.0, 68.0, 18.0, 1800),
('잔치국수', '면류', 350, 380, 12.1, 64.5, 6.8, 920),
('비빔국수', '면류', 350, 420, 10.0, 72.0, 9.0, 780),
('칼국수', '면류', 400, 450, 14.0, 72.0, 10.0, 1100),
('냉면', '면류', 400, 480, 12.0, 85.0, 8.0, 1200),
('쫄면', '면류', 350, 430, 10.0, 78.0, 7.0, 850),
('파스타 (토마토)', '면류', 300, 420, 14.0, 60.0, 12.0, 680),
-- 분식류
('떡볶이 (1인분)', '분식류', 250, 378, 8.5, 72.5, 6.2, 850),
('순대 (1인분)', '분식류', 150, 265, 12.0, 28.0, 12.0, 620),
('튀김 (모듬 1인분)', '분식류', 150, 380, 8.0, 35.0, 22.0, 450),
('만두 (군만두 5개)', '분식류', 150, 350, 12.0, 32.0, 18.0, 620),
('호떡 (1개)', '분식류', 80, 230, 4.0, 38.0, 7.0, 180),
('핫도그 (1개)', '분식류', 100, 280, 8.0, 25.0, 16.0, 550),
-- 빵/베이커리류
('식빵 (1장)', '빵류', 35, 92, 3.2, 16.5, 1.3, 175),
('크로아상 (1개)', '빵류', 60, 250, 5.0, 26.0, 14.0, 300),
('베이글 (1개)', '빵류', 100, 270, 10.0, 50.0, 2.0, 480),
('소보로빵 (1개)', '빵류', 80, 310, 6.0, 44.0, 12.0, 220),
-- 과일류
('사과 (1개)', '과일류', 200, 104, 0.4, 27.6, 0.4, 2),
('바나나 (1개)', '과일류', 120, 106, 1.3, 27.1, 0.4, 1),
('귤 (1개)', '과일류', 100, 43, 0.7, 10.5, 0.1, 1),
('딸기 (10개)', '과일류', 150, 48, 1.0, 11.4, 0.4, 2),
('포도 (1송이)', '과일류', 200, 120, 1.2, 30.0, 0.4, 4),
('수박 (1조각)', '과일류', 200, 60, 1.2, 14.8, 0.2, 2),
('블루베리 (1컵)', '과일류', 150, 86, 1.1, 21.5, 0.5, 2),
-- 유제품류
('우유 (1컵)', '유제품류', 200, 130, 6.4, 9.6, 7.4, 100),
('요거트 (플레인)', '유제품류', 150, 90, 5.0, 12.0, 2.0, 70),
('치즈 (1장)', '유제품류', 20, 65, 4.0, 0.5, 5.2, 180),
('아이스크림 (1스쿱)', '유제품류', 70, 140, 2.5, 16.0, 7.0, 50),
-- 음료류
('아메리카노', '음료류', 355, 10, 0.4, 1.8, 0, 10),
('카페라떼', '음료류', 355, 150, 7.5, 12.0, 7.5, 120),
('녹차', '음료류', 200, 2, 0, 0.5, 0, 1),
('콜라 (1캔)', '음료류', 355, 140, 0, 39.0, 0, 45),
('오렌지주스 (1컵)', '음료류', 200, 90, 1.4, 21.0, 0.2, 4),
('두유 (1팩)', '음료류', 200, 120, 8.0, 10.0, 5.0, 120),
('프로틴쉐이크', '음료류', 300, 150, 25.0, 8.0, 2.5, 200),
-- 간식류
('고구마 (1개)', '간식류', 130, 169, 1.6, 39.7, 0.1, 15),
('삶은달걀 (1개)', '간식류', 50, 72, 6.3, 0.4, 5.0, 62),
('견과류 (한줌)', '간식류', 30, 180, 5.0, 6.0, 16.0, 2),
('초콜릿 (1개)', '간식류', 40, 210, 2.5, 24.0, 12.0, 30),
('과자 (1봉지)', '간식류', 60, 300, 3.0, 38.0, 15.0, 350),
('떡 (송편 3개)', '간식류', 90, 180, 3.0, 40.0, 1.0, 80),
('약과 (1개)', '간식류', 40, 170, 2.0, 22.0, 8.0, 60),
('에너지바 (1개)', '간식류', 50, 200, 8.0, 26.0, 7.0, 120),
-- 주류
('소주 (1잔)', '주류', 50, 63, 0, 0, 0, 0),
('맥주 (1잔)', '주류', 355, 153, 1.6, 12.6, 0, 14),
('막걸리 (1잔)', '주류', 200, 92, 1.0, 7.0, 0.2, 6),
('와인 (1잔)', '주류', 150, 125, 0.1, 3.8, 0, 6),
-- 패스트푸드/외식
('햄버거 (불고기)', '간식류', 200, 450, 18.0, 42.0, 22.0, 850),
('피자 (1조각)', '간식류', 120, 280, 12.0, 30.0, 12.0, 620),
('치즈돈까스', '고기류', 250, 580, 25.0, 45.0, 32.0, 920),
('김치전 (1인분)', '반찬류', 150, 220, 6.0, 25.0, 10.0, 580),
('해물파전 (1인분)', '반찬류', 200, 320, 12.0, 35.0, 14.0, 750);
