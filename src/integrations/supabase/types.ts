export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          bairro: string | null
          cidade: string | null
          cnpj: string | null
          cpf: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          numero_residencia: string | null
          rg: string | null
          rua: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cidade?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          numero_residencia?: string | null
          rg?: string | null
          rua?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cidade?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          numero_residencia?: string | null
          rg?: string | null
          rua?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contas_a_pagar: {
        Row: {
          comprovante_url: string | null
          created_at: string | null
          data_pagamento: string | null
          descricao: string | null
          empresa: string
          fixa: boolean | null
          forma_pagamento: string | null
          id: string
          status: string | null
          updated_at: string | null
          valor: number
          vencimento: string
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          empresa: string
          fixa?: boolean | null
          forma_pagamento?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          valor: number
          vencimento: string
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          empresa?: string
          fixa?: boolean | null
          forma_pagamento?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          valor?: number
          vencimento?: string
        }
        Relationships: []
      }
      log_movimentacoes: {
        Row: {
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          data_hora: string | null
          id: string
          observacoes: string | null
          os_id: string
          tipo: string
          usuario: string | null
        }
        Insert: {
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          data_hora?: string | null
          id?: string
          observacoes?: string | null
          os_id: string
          tipo: string
          usuario?: string | null
        }
        Update: {
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          data_hora?: string | null
          id?: string
          observacoes?: string | null
          os_id?: string
          tipo?: string
          usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_movimentacoes_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes: {
        Row: {
          created_at: string
          id: string
          motivo: string
          os_numero: string | null
          produto_id: string
          quantidade: number
          quantidade_anterior: number
          tipo: Database["public"]["Enums"]["movimentacao_tipo"]
          valor_unitario: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          motivo: string
          os_numero?: string | null
          produto_id: string
          quantidade: number
          quantidade_anterior: number
          tipo: Database["public"]["Enums"]["movimentacao_tipo"]
          valor_unitario?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          motivo?: string
          os_numero?: string | null
          produto_id?: string
          quantidade?: number
          quantidade_anterior?: number
          tipo?: Database["public"]["Enums"]["movimentacao_tipo"]
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria_id: string | null
          codigo: string | null
          created_at: string
          data_entrada: string | null
          estoque_minimo: number | null
          id: string
          marca: string | null
          nome: string
          preco_custo: number | null
          preco_venda: number
          quantidade: number
          status: Database["public"]["Enums"]["produto_status"] | null
          updated_at: string
        }
        Insert: {
          categoria_id?: string | null
          codigo?: string | null
          created_at?: string
          data_entrada?: string | null
          estoque_minimo?: number | null
          id?: string
          marca?: string | null
          nome: string
          preco_custo?: number | null
          preco_venda: number
          quantidade?: number
          status?: Database["public"]["Enums"]["produto_status"] | null
          updated_at?: string
        }
        Update: {
          categoria_id?: string | null
          codigo?: string | null
          created_at?: string
          data_entrada?: string | null
          estoque_minimo?: number | null
          id?: string
          marca?: string | null
          nome?: string
          preco_custo?: number | null
          preco_venda?: number
          quantidade?: number
          status?: Database["public"]["Enums"]["produto_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      servicos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          preco: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          preco: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco?: number
          updated_at?: string
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          ano: string | null
          cliente_id: string
          created_at: string
          id: string
          marca: string
          modelo: string
          observacoes: string | null
          placa: string
          updated_at: string
        }
        Insert: {
          ano?: string | null
          cliente_id: string
          created_at?: string
          id?: string
          marca: string
          modelo: string
          observacoes?: string | null
          placa: string
          updated_at?: string
        }
        Update: {
          ano?: string | null
          cliente_id?: string
          created_at?: string
          id?: string
          marca?: string
          modelo?: string
          observacoes?: string | null
          placa?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      venda_produtos: {
        Row: {
          created_at: string
          id: string
          preco_total: number
          preco_unitario: number
          produto_id: string
          produto_nome: string
          quantidade: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preco_total: number
          preco_unitario: number
          produto_id: string
          produto_nome: string
          quantidade: number
          venda_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preco_total?: number
          preco_unitario?: number
          produto_id?: string
          produto_nome?: string
          quantidade?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venda_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_produtos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      venda_servicos: {
        Row: {
          created_at: string
          id: string
          preco: number
          servico_id: string | null
          servico_nome: string
          venda_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preco: number
          servico_id?: string | null
          servico_nome: string
          venda_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preco?: number
          servico_id?: string | null
          servico_nome?: string
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venda_servicos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_servicos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          cliente_id: string | null
          cliente_nome: string
          created_at: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id: string
          numero_os: string
          observacoes: string | null
          parcelas: number | null
          status: Database["public"]["Enums"]["venda_status"] | null
          updated_at: string
          valor_desconto: number | null
          valor_final: number
          valor_total: number
          veiculo_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome: string
          created_at?: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          numero_os: string
          observacoes?: string | null
          parcelas?: number | null
          status?: Database["public"]["Enums"]["venda_status"] | null
          updated_at?: string
          valor_desconto?: number | null
          valor_final?: number
          valor_total?: number
          veiculo_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string
          created_at?: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          numero_os?: string
          observacoes?: string | null
          parcelas?: number | null
          status?: Database["public"]["Enums"]["venda_status"] | null
          updated_at?: string
          valor_desconto?: number | null
          valor_final?: number
          valor_total?: number
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      forma_pagamento: "dinheiro" | "cartao" | "pix" | "cheque" | "parcelado"
      movimentacao_tipo: "entrada" | "saida" | "ajuste"
      produto_status: "ativo" | "inativo"
      venda_status: "pendente" | "finalizada" | "cancelada"
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
      forma_pagamento: ["dinheiro", "cartao", "pix", "cheque", "parcelado"],
      movimentacao_tipo: ["entrada", "saida", "ajuste"],
      produto_status: ["ativo", "inativo"],
      venda_status: ["pendente", "finalizada", "cancelada"],
    },
  },
} as const
