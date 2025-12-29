-- Adicionar campo para indicar se a reserva foi cancelada
ALTER TABLE public.tab_reserva_sala 
ADD COLUMN IF NOT EXISTS ind_cancelado boolean DEFAULT false;

-- Adicionar campo para armazenar histórico de alterações em JSONB
ALTER TABLE public.tab_reserva_sala 
ADD COLUMN IF NOT EXISTS des_historico_alteracoes jsonb DEFAULT '[]'::jsonb;

-- Adicionar campo para data/hora do cancelamento
ALTER TABLE public.tab_reserva_sala 
ADD COLUMN IF NOT EXISTS dta_cancelamento timestamp with time zone;

-- Adicionar campo para motivo do cancelamento
ALTER TABLE public.tab_reserva_sala 
ADD COLUMN IF NOT EXISTS des_motivo_cancelamento text;