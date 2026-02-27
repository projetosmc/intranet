
-- Tabela para armazenar os dados de rastreio de vendas (cache da API)
CREATE TABLE public.tab_rastreio_venda (
  cod_rastreio uuid NOT NULL DEFAULT gen_random_uuid(),
  cod_empresa integer NOT NULL,
  des_nom_resumido text,
  cod_pessoa_sacado integer,
  nom_pessoa text,
  tipo_titulo text,
  dta_venda date,
  dta_venc_titulo date,
  dta_faturamento date,
  dta_vencimento_fatura date,
  dta_recebimento date,
  val_bruto_titulo numeric(15,2) DEFAULT 0,
  val_liquido_titulo numeric(15,2) DEFAULT 0,
  val_pagamento numeric(15,2) DEFAULT 0,
  cod_forma_pagto integer,
  des_forma_pagto text,
  seq_titulo integer NOT NULL,
  seq_cupom integer,
  num_cupom integer,
  source_key text,
  dta_prev_recebimento date,
  dta_cadastro timestamp with time zone DEFAULT now(),
  dta_atualizacao timestamp with time zone DEFAULT now(),
  CONSTRAINT tab_rastreio_venda_pkey PRIMARY KEY (cod_rastreio),
  CONSTRAINT tab_rastreio_venda_unique UNIQUE (seq_titulo, cod_empresa)
);

-- Tabela de controle de sincronização
CREATE TABLE public.tab_sync_controle (
  cod_sync uuid NOT NULL DEFAULT gen_random_uuid(),
  des_entidade text NOT NULL UNIQUE,
  des_status text NOT NULL DEFAULT 'idle',
  num_last_seq_titulo integer DEFAULT 0,
  dta_ultima_sync timestamp with time zone,
  dta_inicio_sync timestamp with time zone,
  dta_fim_sync timestamp with time zone,
  num_registros_processados integer DEFAULT 0,
  num_total_registros integer DEFAULT 0,
  des_erro text,
  dta_cadastro timestamp with time zone DEFAULT now(),
  dta_atualizacao timestamp with time zone DEFAULT now(),
  CONSTRAINT tab_sync_controle_pkey PRIMARY KEY (cod_sync)
);

-- Índices para performance
CREATE INDEX idx_rastreio_venda_empresa ON public.tab_rastreio_venda (cod_empresa);
CREATE INDEX idx_rastreio_venda_dta_venda ON public.tab_rastreio_venda (dta_venda);
CREATE INDEX idx_rastreio_venda_seq_titulo ON public.tab_rastreio_venda (seq_titulo);
CREATE INDEX idx_rastreio_venda_forma_pagto ON public.tab_rastreio_venda (des_forma_pagto);
CREATE INDEX idx_rastreio_venda_source_key ON public.tab_rastreio_venda (source_key);

-- RLS
ALTER TABLE public.tab_rastreio_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_sync_controle ENABLE ROW LEVEL SECURITY;

-- Políticas para tab_rastreio_venda
CREATE POLICY "Authenticated users can view sales tracking"
  ON public.tab_rastreio_venda FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Políticas para tab_sync_controle
CREATE POLICY "Authenticated users can view sync status"
  ON public.tab_sync_controle FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage sync control"
  ON public.tab_sync_controle FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Inserir registro inicial de controle
INSERT INTO public.tab_sync_controle (des_entidade, des_status)
VALUES ('rastreio_vendas', 'idle');
