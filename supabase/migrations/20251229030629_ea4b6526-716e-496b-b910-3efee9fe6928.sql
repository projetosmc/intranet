-- Create table for support page configuration
CREATE TABLE public.tab_config_suporte (
  cod_config uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  des_tipo text NOT NULL, -- 'link' or 'contact'
  des_nome text NOT NULL,
  des_descricao text,
  des_valor text NOT NULL, -- URL for links, value for contacts
  des_icone text DEFAULT 'Circle',
  num_ordem integer DEFAULT 0,
  ind_ativo boolean DEFAULT true,
  dta_cadastro timestamp with time zone DEFAULT now(),
  dta_atualizacao timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tab_config_suporte ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view active support config"
ON public.tab_config_suporte
FOR SELECT
USING (ind_ativo = true);

CREATE POLICY "Admins can manage support config"
ON public.tab_config_suporte
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_tab_config_suporte_dta_atualizacao
BEFORE UPDATE ON public.tab_config_suporte
FOR EACH ROW
EXECUTE FUNCTION public.update_dta_atualizacao_column();

-- Insert default data
INSERT INTO public.tab_config_suporte (des_tipo, des_nome, des_descricao, des_valor, des_icone, num_ordem) VALUES
('link', 'GLPI - Service Desk', 'Abra chamados de suporte técnico', 'https://glpi.montecarlo.com.br', 'MessageCircle', 0),
('link', 'Microsoft Teams', 'Canal de suporte TI', 'https://teams.microsoft.com', 'MessageCircle', 1),
('link', 'Base de Conhecimento', 'Documentação e tutoriais', '#', 'Book', 2),
('contact', 'E-mail', 'E-mail de suporte', 'suporte@montecarlo.com.br', 'Mail', 0),
('contact', 'Ramal', 'Ramal de suporte', '8001', 'Phone', 1);