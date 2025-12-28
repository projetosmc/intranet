-- Add birthday and unit fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birthday_date date,
ADD COLUMN IF NOT EXISTS unit text;

-- Add some indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_birthday_month ON public.profiles (EXTRACT(MONTH FROM birthday_date));
CREATE INDEX IF NOT EXISTS idx_profiles_unit ON public.profiles (unit);