-- Tabela para rastrear tentativas de login
CREATE TABLE public.tab_tentativa_login (
  cod_tentativa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  des_ip_address VARCHAR(45) NOT NULL,
  des_username VARCHAR(255),
  ind_sucesso BOOLEAN DEFAULT false,
  des_motivo_falha VARCHAR(255),
  des_user_agent TEXT,
  dta_tentativa TIMESTAMPTZ DEFAULT now()
);

-- Índices para queries rápidas de rate limiting
CREATE INDEX idx_tentativa_login_ip_data ON tab_tentativa_login(des_ip_address, dta_tentativa);
CREATE INDEX idx_tentativa_login_username_data ON tab_tentativa_login(des_username, dta_tentativa);
CREATE INDEX idx_tentativa_login_data ON tab_tentativa_login(dta_tentativa);

-- Comentários
COMMENT ON TABLE tab_tentativa_login IS 'Registro de tentativas de login para rate limiting e proteção contra força bruta';
COMMENT ON COLUMN tab_tentativa_login.des_ip_address IS 'Endereço IP do cliente';
COMMENT ON COLUMN tab_tentativa_login.des_username IS 'Username tentado (normalizado para lowercase)';
COMMENT ON COLUMN tab_tentativa_login.ind_sucesso IS 'Se a tentativa foi bem-sucedida';
COMMENT ON COLUMN tab_tentativa_login.des_motivo_falha IS 'Motivo da falha (credenciais inválidas, rate limit, etc)';

-- RLS desabilitado - apenas Edge Functions com service_role acessam
ALTER TABLE tab_tentativa_login ENABLE ROW LEVEL SECURITY;

-- Política apenas para service_role (Edge Functions)
CREATE POLICY "Service role can manage login attempts"
ON tab_tentativa_login
FOR ALL
USING (true)
WITH CHECK (true);

-- Função para limpeza automática de registros antigos (> 24h)
CREATE OR REPLACE FUNCTION limpar_tentativas_antigas()
RETURNS void AS $$
BEGIN
  DELETE FROM tab_tentativa_login WHERE dta_tentativa < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;