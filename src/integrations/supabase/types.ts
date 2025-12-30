export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      tab_base_conhecimento: {
        Row: {
          cod_item: string
          des_arquivo_nome: string
          des_arquivo_url: string
          des_descricao: string | null
          des_nome_usuario_atualizacao: string
          des_tipo: string
          des_titulo: string
          dta_atualizacao: string
          dta_cadastro: string
          ind_ativo: boolean | null
          num_tamanho_bytes: number | null
          num_versao: number
          seq_usuario_atualizacao: string
          seq_usuario_criacao: string
        }
        Insert: {
          cod_item?: string
          des_arquivo_nome: string
          des_arquivo_url: string
          des_descricao?: string | null
          des_nome_usuario_atualizacao: string
          des_tipo: string
          des_titulo: string
          dta_atualizacao?: string
          dta_cadastro?: string
          ind_ativo?: boolean | null
          num_tamanho_bytes?: number | null
          num_versao?: number
          seq_usuario_atualizacao: string
          seq_usuario_criacao: string
        }
        Update: {
          cod_item?: string
          des_arquivo_nome?: string
          des_arquivo_url?: string
          des_descricao?: string | null
          des_nome_usuario_atualizacao?: string
          des_tipo?: string
          des_titulo?: string
          dta_atualizacao?: string
          dta_cadastro?: string
          ind_ativo?: boolean | null
          num_tamanho_bytes?: number | null
          num_versao?: number
          seq_usuario_atualizacao?: string
          seq_usuario_criacao?: string
        }
        Relationships: []
      }
      tab_base_conhecimento_versao: {
        Row: {
          cod_versao: string
          des_arquivo_nome: string
          des_arquivo_url: string
          des_nome_usuario: string
          dta_cadastro: string
          num_tamanho_bytes: number | null
          num_versao: number
          seq_item: string
          seq_usuario: string
        }
        Insert: {
          cod_versao?: string
          des_arquivo_nome: string
          des_arquivo_url: string
          des_nome_usuario: string
          dta_cadastro?: string
          num_tamanho_bytes?: number | null
          num_versao: number
          seq_item: string
          seq_usuario: string
        }
        Update: {
          cod_versao?: string
          des_arquivo_nome?: string
          des_arquivo_url?: string
          des_nome_usuario?: string
          dta_cadastro?: string
          num_tamanho_bytes?: number | null
          num_versao?: number
          seq_item?: string
          seq_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "tab_base_conhecimento_versao_seq_item_fkey"
            columns: ["seq_item"]
            isOneToOne: false
            referencedRelation: "tab_base_conhecimento"
            referencedColumns: ["cod_item"]
          },
        ]
      }
      tab_comunicado: {
        Row: {
          cod_comunicado: string
          des_conteudo: string
          des_imagem_url: string | null
          des_popup_modo: string | null
          des_posicao_imagem: string | null
          des_resumo: string
          des_tipo_enquete: string | null
          des_tipo_template: string | null
          des_titulo: string
          dta_atualizacao: string | null
          dta_cadastro: string | null
          dta_fim: string | null
          dta_inicio: string | null
          dta_publicacao: string | null
          ind_ativo: boolean | null
          ind_fixado: boolean | null
          ind_permite_comentarios: boolean | null
          ind_popup: boolean | null
          ind_urgente: boolean | null
          seq_usuario_publicacao: string | null
        }
        Insert: {
          cod_comunicado?: string
          des_conteudo: string
          des_imagem_url?: string | null
          des_popup_modo?: string | null
          des_posicao_imagem?: string | null
          des_resumo: string
          des_tipo_enquete?: string | null
          des_tipo_template?: string | null
          des_titulo: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          dta_fim?: string | null
          dta_inicio?: string | null
          dta_publicacao?: string | null
          ind_ativo?: boolean | null
          ind_fixado?: boolean | null
          ind_permite_comentarios?: boolean | null
          ind_popup?: boolean | null
          ind_urgente?: boolean | null
          seq_usuario_publicacao?: string | null
        }
        Update: {
          cod_comunicado?: string
          des_conteudo?: string
          des_imagem_url?: string | null
          des_popup_modo?: string | null
          des_posicao_imagem?: string | null
          des_resumo?: string
          des_tipo_enquete?: string | null
          des_tipo_template?: string | null
          des_titulo?: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          dta_fim?: string | null
          dta_inicio?: string | null
          dta_publicacao?: string | null
          ind_ativo?: boolean | null
          ind_fixado?: boolean | null
          ind_permite_comentarios?: boolean | null
          ind_popup?: boolean | null
          ind_urgente?: boolean | null
          seq_usuario_publicacao?: string | null
        }
        Relationships: []
      }
      tab_comunicado_comentario: {
        Row: {
          cod_comentario: string
          des_conteudo: string
          dta_atualizacao: string | null
          dta_cadastro: string | null
          ind_editado: boolean | null
          seq_comentario_pai: string | null
          seq_comunicado: string
          seq_usuario: string
        }
        Insert: {
          cod_comentario?: string
          des_conteudo: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_editado?: boolean | null
          seq_comentario_pai?: string | null
          seq_comunicado: string
          seq_usuario: string
        }
        Update: {
          cod_comentario?: string
          des_conteudo?: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_editado?: boolean | null
          seq_comentario_pai?: string | null
          seq_comunicado?: string
          seq_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "tab_comunicado_comentario_seq_comentario_pai_fkey"
            columns: ["seq_comentario_pai"]
            isOneToOne: false
            referencedRelation: "tab_comunicado_comentario"
            referencedColumns: ["cod_comentario"]
          },
          {
            foreignKeyName: "tab_comunicado_comentario_seq_comunicado_fkey"
            columns: ["seq_comunicado"]
            isOneToOne: false
            referencedRelation: "tab_comunicado"
            referencedColumns: ["cod_comunicado"]
          },
        ]
      }
      tab_comunicado_popup_visto: {
        Row: {
          cod_popup_visto: string
          dta_cadastro: string
          seq_comunicado: string
          seq_usuario: string
        }
        Insert: {
          cod_popup_visto?: string
          dta_cadastro?: string
          seq_comunicado: string
          seq_usuario: string
        }
        Update: {
          cod_popup_visto?: string
          dta_cadastro?: string
          seq_comunicado?: string
          seq_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "tab_comunicado_popup_visto_seq_comunicado_fkey"
            columns: ["seq_comunicado"]
            isOneToOne: false
            referencedRelation: "tab_comunicado"
            referencedColumns: ["cod_comunicado"]
          },
        ]
      }
      tab_comunicado_visualizacao: {
        Row: {
          cod_visualizacao: string
          dta_cadastro: string
          seq_comunicado: string
          seq_usuario: string
        }
        Insert: {
          cod_visualizacao?: string
          dta_cadastro?: string
          seq_comunicado: string
          seq_usuario: string
        }
        Update: {
          cod_visualizacao?: string
          dta_cadastro?: string
          seq_comunicado?: string
          seq_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "tab_comunicado_visualizacao_seq_comunicado_fkey"
            columns: ["seq_comunicado"]
            isOneToOne: false
            referencedRelation: "tab_comunicado"
            referencedColumns: ["cod_comunicado"]
          },
        ]
      }
      tab_config_suporte: {
        Row: {
          cod_config: string
          des_descricao: string | null
          des_icone: string | null
          des_nome: string
          des_tipo: string
          des_valor: string
          dta_atualizacao: string | null
          dta_cadastro: string | null
          ind_ativo: boolean | null
          num_ordem: number | null
        }
        Insert: {
          cod_config?: string
          des_descricao?: string | null
          des_icone?: string | null
          des_nome: string
          des_tipo: string
          des_valor: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_ativo?: boolean | null
          num_ordem?: number | null
        }
        Update: {
          cod_config?: string
          des_descricao?: string | null
          des_icone?: string | null
          des_nome?: string
          des_tipo?: string
          des_valor?: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_ativo?: boolean | null
          num_ordem?: number | null
        }
        Relationships: []
      }
      tab_enquete_opcao: {
        Row: {
          cod_opcao: string
          des_texto_opcao: string
          dta_cadastro: string | null
          seq_comunicado: string
        }
        Insert: {
          cod_opcao?: string
          des_texto_opcao: string
          dta_cadastro?: string | null
          seq_comunicado: string
        }
        Update: {
          cod_opcao?: string
          des_texto_opcao?: string
          dta_cadastro?: string | null
          seq_comunicado?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_announcement_id_fkey"
            columns: ["seq_comunicado"]
            isOneToOne: false
            referencedRelation: "tab_comunicado"
            referencedColumns: ["cod_comunicado"]
          },
        ]
      }
      tab_enquete_voto: {
        Row: {
          cod_voto: string
          dta_cadastro: string | null
          seq_opcao: string
          seq_usuario: string
        }
        Insert: {
          cod_voto?: string
          dta_cadastro?: string | null
          seq_opcao: string
          seq_usuario: string
        }
        Update: {
          cod_voto?: string
          dta_cadastro?: string | null
          seq_opcao?: string
          seq_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["seq_opcao"]
            isOneToOne: false
            referencedRelation: "tab_enquete_opcao"
            referencedColumns: ["cod_opcao"]
          },
        ]
      }
      tab_evento_calendario: {
        Row: {
          cod_evento: string
          des_descricao: string | null
          des_tipo_evento: string | null
          des_titulo: string
          dta_atualizacao: string
          dta_cadastro: string
          dta_evento: string
          seq_criado_por: string | null
        }
        Insert: {
          cod_evento?: string
          des_descricao?: string | null
          des_tipo_evento?: string | null
          des_titulo: string
          dta_atualizacao?: string
          dta_cadastro?: string
          dta_evento: string
          seq_criado_por?: string | null
        }
        Update: {
          cod_evento?: string
          des_descricao?: string | null
          des_tipo_evento?: string | null
          des_titulo?: string
          dta_atualizacao?: string
          dta_cadastro?: string
          dta_evento?: string
          seq_criado_por?: string | null
        }
        Relationships: []
      }
      tab_faq: {
        Row: {
          cod_faq: string
          des_imagem_url: string | null
          des_legenda_imagem: string | null
          des_legenda_video: string | null
          des_pergunta: string
          des_resposta: string
          des_tags: string[] | null
          des_video_url: string | null
          dta_atualizacao: string | null
          dta_cadastro: string | null
          ind_ativo: boolean | null
          num_ordem: number | null
        }
        Insert: {
          cod_faq?: string
          des_imagem_url?: string | null
          des_legenda_imagem?: string | null
          des_legenda_video?: string | null
          des_pergunta: string
          des_resposta: string
          des_tags?: string[] | null
          des_video_url?: string | null
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_ativo?: boolean | null
          num_ordem?: number | null
        }
        Update: {
          cod_faq?: string
          des_imagem_url?: string | null
          des_legenda_imagem?: string | null
          des_legenda_video?: string | null
          des_pergunta?: string
          des_resposta?: string
          des_tags?: string[] | null
          des_video_url?: string | null
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_ativo?: boolean | null
          num_ordem?: number | null
        }
        Relationships: []
      }
      tab_kb_anexo: {
        Row: {
          cod_anexo: string
          cod_artigo: string
          des_nome: string
          des_tipo: string | null
          des_url: string
          dta_cadastro: string | null
          num_tamanho_bytes: number | null
          seq_usuario: string | null
        }
        Insert: {
          cod_anexo?: string
          cod_artigo: string
          des_nome: string
          des_tipo?: string | null
          des_url: string
          dta_cadastro?: string | null
          num_tamanho_bytes?: number | null
          seq_usuario?: string | null
        }
        Update: {
          cod_anexo?: string
          cod_artigo?: string
          des_nome?: string
          des_tipo?: string | null
          des_url?: string
          dta_cadastro?: string | null
          num_tamanho_bytes?: number | null
          seq_usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tab_kb_anexo_cod_artigo_fkey"
            columns: ["cod_artigo"]
            isOneToOne: false
            referencedRelation: "tab_kb_artigo"
            referencedColumns: ["cod_artigo"]
          },
        ]
      }
      tab_kb_artigo: {
        Row: {
          arr_pre_requisitos: string[] | null
          arr_sinonimos: string[] | null
          cod_artigo: string
          cod_categoria: string | null
          cod_owner: string | null
          cod_revisor: string | null
          des_conteudo_md: string
          des_link_ferramenta: string | null
          des_publico: string | null
          des_resumo: string
          des_sistema: string | null
          des_tempo_estimado: string | null
          des_tipo: string
          des_titulo: string
          dta_atualizacao: string | null
          dta_criacao: string | null
          dta_publicacao: string | null
          ind_ativo: boolean | null
          ind_critico: boolean | null
          ind_status: string | null
          num_helpful_down: number | null
          num_helpful_up: number | null
          num_versao: number | null
          num_views: number | null
        }
        Insert: {
          arr_pre_requisitos?: string[] | null
          arr_sinonimos?: string[] | null
          cod_artigo?: string
          cod_categoria?: string | null
          cod_owner?: string | null
          cod_revisor?: string | null
          des_conteudo_md: string
          des_link_ferramenta?: string | null
          des_publico?: string | null
          des_resumo: string
          des_sistema?: string | null
          des_tempo_estimado?: string | null
          des_tipo: string
          des_titulo: string
          dta_atualizacao?: string | null
          dta_criacao?: string | null
          dta_publicacao?: string | null
          ind_ativo?: boolean | null
          ind_critico?: boolean | null
          ind_status?: string | null
          num_helpful_down?: number | null
          num_helpful_up?: number | null
          num_versao?: number | null
          num_views?: number | null
        }
        Update: {
          arr_pre_requisitos?: string[] | null
          arr_sinonimos?: string[] | null
          cod_artigo?: string
          cod_categoria?: string | null
          cod_owner?: string | null
          cod_revisor?: string | null
          des_conteudo_md?: string
          des_link_ferramenta?: string | null
          des_publico?: string | null
          des_resumo?: string
          des_sistema?: string | null
          des_tempo_estimado?: string | null
          des_tipo?: string
          des_titulo?: string
          dta_atualizacao?: string | null
          dta_criacao?: string | null
          dta_publicacao?: string | null
          ind_ativo?: boolean | null
          ind_critico?: boolean | null
          ind_status?: string | null
          num_helpful_down?: number | null
          num_helpful_up?: number | null
          num_versao?: number | null
          num_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tab_kb_artigo_cod_categoria_fkey"
            columns: ["cod_categoria"]
            isOneToOne: false
            referencedRelation: "tab_kb_categoria"
            referencedColumns: ["cod_categoria"]
          },
        ]
      }
      tab_kb_artigo_relacionado: {
        Row: {
          cod_artigo: string
          cod_artigo_relacionado: string
          cod_relacao: string
          dta_cadastro: string | null
        }
        Insert: {
          cod_artigo: string
          cod_artigo_relacionado: string
          cod_relacao?: string
          dta_cadastro?: string | null
        }
        Update: {
          cod_artigo?: string
          cod_artigo_relacionado?: string
          cod_relacao?: string
          dta_cadastro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tab_kb_artigo_relacionado_cod_artigo_fkey"
            columns: ["cod_artigo"]
            isOneToOne: false
            referencedRelation: "tab_kb_artigo"
            referencedColumns: ["cod_artigo"]
          },
          {
            foreignKeyName: "tab_kb_artigo_relacionado_cod_artigo_relacionado_fkey"
            columns: ["cod_artigo_relacionado"]
            isOneToOne: false
            referencedRelation: "tab_kb_artigo"
            referencedColumns: ["cod_artigo"]
          },
        ]
      }
      tab_kb_artigo_tag: {
        Row: {
          cod_artigo: string
          cod_artigo_tag: string
          cod_tag: string
          dta_cadastro: string | null
        }
        Insert: {
          cod_artigo: string
          cod_artigo_tag?: string
          cod_tag: string
          dta_cadastro?: string | null
        }
        Update: {
          cod_artigo?: string
          cod_artigo_tag?: string
          cod_tag?: string
          dta_cadastro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tab_kb_artigo_tag_cod_artigo_fkey"
            columns: ["cod_artigo"]
            isOneToOne: false
            referencedRelation: "tab_kb_artigo"
            referencedColumns: ["cod_artigo"]
          },
          {
            foreignKeyName: "tab_kb_artigo_tag_cod_tag_fkey"
            columns: ["cod_tag"]
            isOneToOne: false
            referencedRelation: "tab_kb_tag"
            referencedColumns: ["cod_tag"]
          },
        ]
      }
      tab_kb_artigo_versao: {
        Row: {
          cod_artigo: string
          cod_versao: string
          des_conteudo_md: string
          des_mudancas: string | null
          des_nome_usuario: string
          des_resumo: string
          des_titulo: string
          dta_cadastro: string | null
          num_versao: number
          seq_usuario: string
        }
        Insert: {
          cod_artigo: string
          cod_versao?: string
          des_conteudo_md: string
          des_mudancas?: string | null
          des_nome_usuario: string
          des_resumo: string
          des_titulo: string
          dta_cadastro?: string | null
          num_versao: number
          seq_usuario: string
        }
        Update: {
          cod_artigo?: string
          cod_versao?: string
          des_conteudo_md?: string
          des_mudancas?: string | null
          des_nome_usuario?: string
          des_resumo?: string
          des_titulo?: string
          dta_cadastro?: string | null
          num_versao?: number
          seq_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "tab_kb_artigo_versao_cod_artigo_fkey"
            columns: ["cod_artigo"]
            isOneToOne: false
            referencedRelation: "tab_kb_artigo"
            referencedColumns: ["cod_artigo"]
          },
        ]
      }
      tab_kb_categoria: {
        Row: {
          cod_categoria: string
          des_descricao: string | null
          des_nome: string
          dta_atualizacao: string | null
          dta_cadastro: string | null
          ind_ativo: boolean | null
          num_ordem: number | null
        }
        Insert: {
          cod_categoria?: string
          des_descricao?: string | null
          des_nome: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_ativo?: boolean | null
          num_ordem?: number | null
        }
        Update: {
          cod_categoria?: string
          des_descricao?: string | null
          des_nome?: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_ativo?: boolean | null
          num_ordem?: number | null
        }
        Relationships: []
      }
      tab_kb_favorito: {
        Row: {
          cod_artigo: string
          cod_favorito: string
          dta_cadastro: string | null
          seq_usuario: string
        }
        Insert: {
          cod_artigo: string
          cod_favorito?: string
          dta_cadastro?: string | null
          seq_usuario: string
        }
        Update: {
          cod_artigo?: string
          cod_favorito?: string
          dta_cadastro?: string | null
          seq_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "tab_kb_favorito_cod_artigo_fkey"
            columns: ["cod_artigo"]
            isOneToOne: false
            referencedRelation: "tab_kb_artigo"
            referencedColumns: ["cod_artigo"]
          },
        ]
      }
      tab_kb_feedback: {
        Row: {
          cod_artigo: string
          cod_feedback: string
          des_comentario: string | null
          dta_cadastro: string | null
          ind_helpful: boolean
          seq_usuario: string
        }
        Insert: {
          cod_artigo: string
          cod_feedback?: string
          des_comentario?: string | null
          dta_cadastro?: string | null
          ind_helpful: boolean
          seq_usuario: string
        }
        Update: {
          cod_artigo?: string
          cod_feedback?: string
          des_comentario?: string | null
          dta_cadastro?: string | null
          ind_helpful?: boolean
          seq_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "tab_kb_feedback_cod_artigo_fkey"
            columns: ["cod_artigo"]
            isOneToOne: false
            referencedRelation: "tab_kb_artigo"
            referencedColumns: ["cod_artigo"]
          },
        ]
      }
      tab_kb_tag: {
        Row: {
          cod_tag: string
          des_nome: string
          dta_atualizacao: string | null
          dta_cadastro: string | null
          ind_ativo: boolean | null
          num_ordem: number | null
        }
        Insert: {
          cod_tag?: string
          des_nome: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_ativo?: boolean | null
          num_ordem?: number | null
        }
        Update: {
          cod_tag?: string
          des_nome?: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_ativo?: boolean | null
          num_ordem?: number | null
        }
        Relationships: []
      }
      tab_kb_visualizacao: {
        Row: {
          cod_artigo: string
          cod_visualizacao: string
          dta_cadastro: string | null
          seq_usuario: string
        }
        Insert: {
          cod_artigo: string
          cod_visualizacao?: string
          dta_cadastro?: string | null
          seq_usuario: string
        }
        Update: {
          cod_artigo?: string
          cod_visualizacao?: string
          dta_cadastro?: string | null
          seq_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "tab_kb_visualizacao_cod_artigo_fkey"
            columns: ["cod_artigo"]
            isOneToOne: false
            referencedRelation: "tab_kb_artigo"
            referencedColumns: ["cod_artigo"]
          },
        ]
      }
      tab_log_auditoria: {
        Row: {
          cod_log: string
          des_acao: string
          des_id_entidade: string | null
          des_ip: string | null
          des_tipo_entidade: string
          des_user_agent: string | null
          des_valor_anterior: Json | null
          des_valor_novo: Json | null
          dta_cadastro: string
          seq_usuario: string | null
          seq_usuario_alvo: string | null
        }
        Insert: {
          cod_log?: string
          des_acao: string
          des_id_entidade?: string | null
          des_ip?: string | null
          des_tipo_entidade: string
          des_user_agent?: string | null
          des_valor_anterior?: Json | null
          des_valor_novo?: Json | null
          dta_cadastro?: string
          seq_usuario?: string | null
          seq_usuario_alvo?: string | null
        }
        Update: {
          cod_log?: string
          des_acao?: string
          des_id_entidade?: string | null
          des_ip?: string | null
          des_tipo_entidade?: string
          des_user_agent?: string | null
          des_valor_anterior?: Json | null
          des_valor_novo?: Json | null
          dta_cadastro?: string
          seq_usuario?: string | null
          seq_usuario_alvo?: string | null
        }
        Relationships: []
      }
      tab_menu_item: {
        Row: {
          cod_menu_item: string
          des_caminho: string
          des_icone: string | null
          des_nome: string
          des_tags: string[] | null
          dta_atualizacao: string
          dta_cadastro: string
          ind_admin_only: boolean | null
          ind_ativo: boolean | null
          ind_nova_aba: boolean | null
          num_ordem: number | null
          seq_menu_pai: string | null
        }
        Insert: {
          cod_menu_item?: string
          des_caminho: string
          des_icone?: string | null
          des_nome: string
          des_tags?: string[] | null
          dta_atualizacao?: string
          dta_cadastro?: string
          ind_admin_only?: boolean | null
          ind_ativo?: boolean | null
          ind_nova_aba?: boolean | null
          num_ordem?: number | null
          seq_menu_pai?: string | null
        }
        Update: {
          cod_menu_item?: string
          des_caminho?: string
          des_icone?: string | null
          des_nome?: string
          des_tags?: string[] | null
          dta_atualizacao?: string
          dta_cadastro?: string
          ind_admin_only?: boolean | null
          ind_ativo?: boolean | null
          ind_nova_aba?: boolean | null
          num_ordem?: number | null
          seq_menu_pai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_parent_id_fkey"
            columns: ["seq_menu_pai"]
            isOneToOne: false
            referencedRelation: "tab_menu_item"
            referencedColumns: ["cod_menu_item"]
          },
        ]
      }
      tab_notificacao: {
        Row: {
          cod_notificacao: string
          des_link: string | null
          des_mensagem: string
          des_tipo: string
          des_titulo: string
          dta_cadastro: string | null
          ind_lida: boolean | null
          seq_usuario: string
          seq_usuario_origem: string | null
        }
        Insert: {
          cod_notificacao?: string
          des_link?: string | null
          des_mensagem: string
          des_tipo: string
          des_titulo: string
          dta_cadastro?: string | null
          ind_lida?: boolean | null
          seq_usuario: string
          seq_usuario_origem?: string | null
        }
        Update: {
          cod_notificacao?: string
          des_link?: string | null
          des_mensagem?: string
          des_tipo?: string
          des_titulo?: string
          dta_cadastro?: string | null
          ind_lida?: boolean | null
          seq_usuario?: string
          seq_usuario_origem?: string | null
        }
        Relationships: []
      }
      tab_perfil_tipo: {
        Row: {
          cod_perfil_tipo: string
          des_codigo: string
          des_cor: string | null
          des_descricao: string | null
          des_nome: string
          dta_atualizacao: string | null
          dta_cadastro: string | null
          ind_ativo: boolean | null
          ind_sistema: boolean | null
          num_ordem: number | null
        }
        Insert: {
          cod_perfil_tipo?: string
          des_codigo: string
          des_cor?: string | null
          des_descricao?: string | null
          des_nome: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_ativo?: boolean | null
          ind_sistema?: boolean | null
          num_ordem?: number | null
        }
        Update: {
          cod_perfil_tipo?: string
          des_codigo?: string
          des_cor?: string | null
          des_descricao?: string | null
          des_nome?: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_ativo?: boolean | null
          ind_sistema?: boolean | null
          num_ordem?: number | null
        }
        Relationships: []
      }
      tab_perfil_usuario: {
        Row: {
          cod_usuario: string
          des_ad_object_id: string | null
          des_avatar_url: string | null
          des_cargo: string | null
          des_departamento: string | null
          des_email: string | null
          des_nome_completo: string | null
          des_telefone: string | null
          des_unidade: string | null
          dta_aniversario: string | null
          dta_atualizacao: string | null
          dta_cadastro: string | null
          dta_sincronizacao_ad: string | null
          ind_ativo: boolean | null
        }
        Insert: {
          cod_usuario: string
          des_ad_object_id?: string | null
          des_avatar_url?: string | null
          des_cargo?: string | null
          des_departamento?: string | null
          des_email?: string | null
          des_nome_completo?: string | null
          des_telefone?: string | null
          des_unidade?: string | null
          dta_aniversario?: string | null
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          dta_sincronizacao_ad?: string | null
          ind_ativo?: boolean | null
        }
        Update: {
          cod_usuario?: string
          des_ad_object_id?: string | null
          des_avatar_url?: string | null
          des_cargo?: string | null
          des_departamento?: string | null
          des_email?: string | null
          des_nome_completo?: string | null
          des_telefone?: string | null
          des_unidade?: string | null
          dta_aniversario?: string | null
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          dta_sincronizacao_ad?: string | null
          ind_ativo?: boolean | null
        }
        Relationships: []
      }
      tab_permissao_tela: {
        Row: {
          cod_permissao: string
          des_nome_tela: string
          des_role: string
          des_rota: string
          dta_atualizacao: string | null
          dta_cadastro: string | null
          ind_pode_acessar: boolean
          num_ordem: number | null
        }
        Insert: {
          cod_permissao?: string
          des_nome_tela: string
          des_role: string
          des_rota: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_pode_acessar?: boolean
          num_ordem?: number | null
        }
        Update: {
          cod_permissao?: string
          des_nome_tela?: string
          des_role?: string
          des_rota?: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_pode_acessar?: boolean
          num_ordem?: number | null
        }
        Relationships: []
      }
      tab_reserva_sala: {
        Row: {
          cod_reserva: string
          des_historico_alteracoes: Json | null
          des_motivo_cancelamento: string | null
          des_nome_solicitante: string
          des_observacao: string | null
          dta_atualizacao: string | null
          dta_cadastro: string | null
          dta_cancelamento: string | null
          dta_reserva: string
          hra_fim: string
          hra_inicio: string
          ind_cancelado: boolean | null
          ind_notificado: boolean | null
          num_participantes: number | null
          seq_sala: string
          seq_tipo_reuniao: string | null
          seq_usuario: string
        }
        Insert: {
          cod_reserva?: string
          des_historico_alteracoes?: Json | null
          des_motivo_cancelamento?: string | null
          des_nome_solicitante: string
          des_observacao?: string | null
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          dta_cancelamento?: string | null
          dta_reserva: string
          hra_fim: string
          hra_inicio: string
          ind_cancelado?: boolean | null
          ind_notificado?: boolean | null
          num_participantes?: number | null
          seq_sala: string
          seq_tipo_reuniao?: string | null
          seq_usuario: string
        }
        Update: {
          cod_reserva?: string
          des_historico_alteracoes?: Json | null
          des_motivo_cancelamento?: string | null
          des_nome_solicitante?: string
          des_observacao?: string | null
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          dta_cancelamento?: string | null
          dta_reserva?: string
          hra_fim?: string
          hra_inicio?: string
          ind_cancelado?: boolean | null
          ind_notificado?: boolean | null
          num_participantes?: number | null
          seq_sala?: string
          seq_tipo_reuniao?: string | null
          seq_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_reservations_meeting_type_id_fkey"
            columns: ["seq_tipo_reuniao"]
            isOneToOne: false
            referencedRelation: "tab_tipo_reuniao"
            referencedColumns: ["cod_tipo_reuniao"]
          },
          {
            foreignKeyName: "room_reservations_room_id_fkey"
            columns: ["seq_sala"]
            isOneToOne: false
            referencedRelation: "tab_sala_reuniao"
            referencedColumns: ["cod_sala"]
          },
        ]
      }
      tab_sala_reuniao: {
        Row: {
          cod_sala: string
          des_nome: string
          des_roles_permitidos: string[] | null
          dta_atualizacao: string | null
          dta_cadastro: string | null
          ind_ativo: boolean | null
          num_capacidade: number
          num_ordem: number | null
        }
        Insert: {
          cod_sala?: string
          des_nome: string
          des_roles_permitidos?: string[] | null
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_ativo?: boolean | null
          num_capacidade?: number
          num_ordem?: number | null
        }
        Update: {
          cod_sala?: string
          des_nome?: string
          des_roles_permitidos?: string[] | null
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_ativo?: boolean | null
          num_capacidade?: number
          num_ordem?: number | null
        }
        Relationships: []
      }
      tab_sistema: {
        Row: {
          cod_sistema: string
          des_nome: string
          des_status: string
          dta_atualizacao: string | null
          dta_cadastro: string | null
          dta_ultima_verificacao: string | null
          ind_ativo: boolean | null
          num_ordem: number | null
        }
        Insert: {
          cod_sistema?: string
          des_nome: string
          des_status?: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          dta_ultima_verificacao?: string | null
          ind_ativo?: boolean | null
          num_ordem?: number | null
        }
        Update: {
          cod_sistema?: string
          des_nome?: string
          des_status?: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          dta_ultima_verificacao?: string | null
          ind_ativo?: boolean | null
          num_ordem?: number | null
        }
        Relationships: []
      }
      tab_tipo_reuniao: {
        Row: {
          cod_tipo_reuniao: string
          des_nome: string
          dta_atualizacao: string | null
          dta_cadastro: string | null
          ind_ativo: boolean | null
          num_ordem: number | null
        }
        Insert: {
          cod_tipo_reuniao?: string
          des_nome: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_ativo?: boolean | null
          num_ordem?: number | null
        }
        Update: {
          cod_tipo_reuniao?: string
          des_nome?: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_ativo?: boolean | null
          num_ordem?: number | null
        }
        Relationships: []
      }
      tab_usuario_role: {
        Row: {
          cod_usuario_role: string
          des_role: Database["public"]["Enums"]["app_role"]
          dta_cadastro: string | null
          seq_usuario: string
        }
        Insert: {
          cod_usuario_role?: string
          des_role: Database["public"]["Enums"]["app_role"]
          dta_cadastro?: string | null
          seq_usuario: string
        }
        Update: {
          cod_usuario_role?: string
          des_role?: Database["public"]["Enums"]["app_role"]
          dta_cadastro?: string | null
          seq_usuario?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      setup_first_admin: { Args: { admin_user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
