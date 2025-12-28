-- Criar bucket para imagens de comunicados
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcements', 'announcements', true);

-- Policies para o bucket
CREATE POLICY "Anyone can view announcement images"
ON storage.objects FOR SELECT
USING (bucket_id = 'announcements');

CREATE POLICY "Authenticated users can upload announcement images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'announcements');

CREATE POLICY "Authenticated users can update announcement images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'announcements');

CREATE POLICY "Authenticated users can delete announcement images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'announcements');

-- Adicionar coluna de tipo de template e imagem na tabela announcements
ALTER TABLE public.announcements
ADD COLUMN template_type TEXT DEFAULT 'simple' CHECK (template_type IN ('simple', 'banner', 'poll')),
ADD COLUMN image_url TEXT,
ADD COLUMN poll_type TEXT CHECK (poll_type IN ('single', 'multiple'));

-- Criar tabela de opções de enquete
CREATE TABLE public.poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read poll options"
ON public.poll_options FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage poll options"
ON public.poll_options FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Criar tabela de votos
CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(option_id, user_id)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see vote counts"
ON public.poll_votes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can vote"
ON public.poll_votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote"
ON public.poll_votes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Criar tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atualizar policy de announcements para requerer auth
DROP POLICY IF EXISTS "Anyone can read active announcements" ON public.announcements;

CREATE POLICY "Authenticated users can read active announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (active = true);