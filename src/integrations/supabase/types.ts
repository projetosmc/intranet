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
      tab_comunicado: {
        Row: {
          cod_comunicado: string
          des_conteudo: string
          des_imagem_url: string | null
          des_resumo: string
          des_tipo_enquete: string | null
          des_tipo_template: string | null
          des_titulo: string
          dta_atualizacao: string | null
          dta_cadastro: string | null
          dta_publicacao: string | null
          ind_ativo: boolean | null
          ind_fixado: boolean | null
        }
        Insert: {
          cod_comunicado?: string
          des_conteudo: string
          des_imagem_url?: string | null
          des_resumo: string
          des_tipo_enquete?: string | null
          des_tipo_template?: string | null
          des_titulo: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          dta_publicacao?: string | null
          ind_ativo?: boolean | null
          ind_fixado?: boolean | null
        }
        Update: {
          cod_comunicado?: string
          des_conteudo?: string
          des_imagem_url?: string | null
          des_resumo?: string
          des_tipo_enquete?: string | null
          des_tipo_template?: string | null
          des_titulo?: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          dta_publicacao?: string | null
          ind_ativo?: boolean | null
          ind_fixado?: boolean | null
        }
        Relationships: []
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
          des_pergunta: string
          des_resposta: string
          dta_atualizacao: string | null
          dta_cadastro: string | null
          ind_ativo: boolean | null
          num_ordem: number | null
        }
        Insert: {
          cod_faq?: string
          des_pergunta: string
          des_resposta: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_ativo?: boolean | null
          num_ordem?: number | null
        }
        Update: {
          cod_faq?: string
          des_pergunta?: string
          des_resposta?: string
          dta_atualizacao?: string | null
          dta_cadastro?: string | null
          ind_ativo?: boolean | null
          num_ordem?: number | null
        }
        Relationships: []
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
