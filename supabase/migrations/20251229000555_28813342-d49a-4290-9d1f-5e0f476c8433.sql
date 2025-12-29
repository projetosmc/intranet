-- Create meeting_rooms table
CREATE TABLE public.meeting_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 10,
  allowed_roles text[] DEFAULT ARRAY['all']::text[],
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for meeting_rooms
ALTER TABLE public.meeting_rooms ENABLE ROW LEVEL SECURITY;

-- RLS policies for meeting_rooms
CREATE POLICY "Authenticated users can view active rooms"
ON public.meeting_rooms FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage rooms"
ON public.meeting_rooms FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create meeting_types table
CREATE TABLE public.meeting_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for meeting_types
ALTER TABLE public.meeting_types ENABLE ROW LEVEL SECURITY;

-- RLS policies for meeting_types
CREATE POLICY "Authenticated users can view active meeting types"
ON public.meeting_types FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage meeting types"
ON public.meeting_types FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create room_reservations table
CREATE TABLE public.room_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.meeting_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  requester_name text NOT NULL,
  reservation_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  meeting_type_id uuid REFERENCES public.meeting_types(id) ON DELETE SET NULL,
  participants_count integer DEFAULT 1,
  notes text,
  notified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for room_reservations
ALTER TABLE public.room_reservations ENABLE ROW LEVEL SECURITY;

-- RLS policies for room_reservations
CREATE POLICY "Users can view all reservations"
ON public.room_reservations FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reservations"
ON public.room_reservations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations"
ON public.room_reservations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reservations"
ON public.room_reservations FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reservations"
ON public.room_reservations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at triggers
CREATE TRIGGER update_meeting_rooms_updated_at
  BEFORE UPDATE ON public.meeting_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_types_updated_at
  BEFORE UPDATE ON public.meeting_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_room_reservations_updated_at
  BEFORE UPDATE ON public.room_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default meeting types
INSERT INTO public.meeting_types (name, sort_order) VALUES 
  ('Reunião de Equipe', 0),
  ('Reunião com Cliente', 1),
  ('Treinamento', 2),
  ('Entrevista', 3),
  ('Apresentação', 4),
  ('Videoconferência', 5),
  ('Workshop', 6),
  ('Alinhamento', 7);