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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          empresa_id: string
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          empresa_id: string
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          empresa_id?: string
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          created_at: string
          descricao: string | null
          empresa_id: string | null
          id: string
          nome: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string | null
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
          empresa_id: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          numero_residencia: string | null
          rg: string | null
          rua: string | null
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bairro?: string | null
          cidade?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          numero_residencia?: string | null
          rg?: string | null
          rua?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bairro?: string | null
          cidade?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          numero_residencia?: string | null
          rg?: string | null
          rua?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      comissoes_mecanicos: {
        Row: {
          base_calculo: number
          created_at: string
          empresa_id: string | null
          finalizado_em: string
          id: string
          mecanico_id: string
          observacoes: string | null
          percentual: number | null
          tipo_calculo: string
          updated_at: string
          user_id: string
          valor_final: number
          valor_fixo: number | null
          venda_id: string
        }
        Insert: {
          base_calculo?: number
          created_at?: string
          empresa_id?: string | null
          finalizado_em?: string
          id?: string
          mecanico_id: string
          observacoes?: string | null
          percentual?: number | null
          tipo_calculo: string
          updated_at?: string
          user_id: string
          valor_final?: number
          valor_fixo?: number | null
          venda_id: string
        }
        Update: {
          base_calculo?: number
          created_at?: string
          empresa_id?: string | null
          finalizado_em?: string
          id?: string
          mecanico_id?: string
          observacoes?: string | null
          percentual?: number | null
          tipo_calculo?: string
          updated_at?: string
          user_id?: string
          valor_final?: number
          valor_fixo?: number | null
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_mecanicos_mecanico_id_fkey"
            columns: ["mecanico_id"]
            isOneToOne: false
            referencedRelation: "mecanicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_mecanicos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: true
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_a_pagar: {
        Row: {
          comprovante_url: string | null
          created_at: string | null
          data_pagamento: string | null
          descricao: string | null
          empresa: string
          empresa_id: string | null
          fixa: boolean | null
          forma_pagamento: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string | null
          valor: number
          vencimento: string
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          empresa: string
          empresa_id?: string | null
          fixa?: boolean | null
          forma_pagamento?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor: number
          vencimento: string
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          empresa?: string
          empresa_id?: string | null
          fixa?: boolean | null
          forma_pagamento?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor?: number
          vencimento?: string
        }
        Relationships: []
      }
      empresa_usuarios: {
        Row: {
          ativo: boolean
          created_at: string
          empresa_id: string
          id: string
          role: Database["public"]["Enums"]["empresa_role"]
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          role?: Database["public"]["Enums"]["empresa_role"]
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          role?: Database["public"]["Enums"]["empresa_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          aliquota_iss: number | null
          ambiente_fiscal: string | null
          bairro: string | null
          cep: string | null
          certificado_url: string | null
          cnae_principal: string | null
          cnpj: string | null
          codigo_regime_tributario: string | null
          complemento: string | null
          created_at: string
          csc_token: string | null
          data_fundacao: string | null
          email: string | null
          email_comercial: string | null
          email_fiscal: string | null
          facebook: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          instagram: string | null
          logo_url: string | null
          logradouro: string | null
          municipio: string | null
          municipio_iss: string | null
          natureza_operacao: string | null
          nome: string
          nome_fantasia: string | null
          numero: string | null
          pais: string | null
          politica_privacidade_url: string | null
          razao_social: string | null
          regime_tributario: string | null
          responsavel_tecnico: string | null
          serie_nfe: string | null
          site: string | null
          telefone_principal: string | null
          telefone_secundario: string | null
          uf: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          aliquota_iss?: number | null
          ambiente_fiscal?: string | null
          bairro?: string | null
          cep?: string | null
          certificado_url?: string | null
          cnae_principal?: string | null
          cnpj?: string | null
          codigo_regime_tributario?: string | null
          complemento?: string | null
          created_at?: string
          csc_token?: string | null
          data_fundacao?: string | null
          email?: string | null
          email_comercial?: string | null
          email_fiscal?: string | null
          facebook?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          instagram?: string | null
          logo_url?: string | null
          logradouro?: string | null
          municipio?: string | null
          municipio_iss?: string | null
          natureza_operacao?: string | null
          nome: string
          nome_fantasia?: string | null
          numero?: string | null
          pais?: string | null
          politica_privacidade_url?: string | null
          razao_social?: string | null
          regime_tributario?: string | null
          responsavel_tecnico?: string | null
          serie_nfe?: string | null
          site?: string | null
          telefone_principal?: string | null
          telefone_secundario?: string | null
          uf?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          aliquota_iss?: number | null
          ambiente_fiscal?: string | null
          bairro?: string | null
          cep?: string | null
          certificado_url?: string | null
          cnae_principal?: string | null
          cnpj?: string | null
          codigo_regime_tributario?: string | null
          complemento?: string | null
          created_at?: string
          csc_token?: string | null
          data_fundacao?: string | null
          email?: string | null
          email_comercial?: string | null
          email_fiscal?: string | null
          facebook?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          instagram?: string | null
          logo_url?: string | null
          logradouro?: string | null
          municipio?: string | null
          municipio_iss?: string | null
          natureza_operacao?: string | null
          nome?: string
          nome_fantasia?: string | null
          numero?: string | null
          pais?: string | null
          politica_privacidade_url?: string | null
          razao_social?: string | null
          regime_tributario?: string | null
          responsavel_tecnico?: string | null
          serie_nfe?: string | null
          site?: string | null
          telefone_principal?: string | null
          telefone_secundario?: string | null
          uf?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      log_movimentacoes: {
        Row: {
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          data_hora: string | null
          empresa_id: string | null
          id: string
          observacoes: string | null
          os_id: string | null
          tipo: string
          user_id: string | null
          usuario: string | null
        }
        Insert: {
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          data_hora?: string | null
          empresa_id?: string | null
          id?: string
          observacoes?: string | null
          os_id?: string | null
          tipo: string
          user_id?: string | null
          usuario?: string | null
        }
        Update: {
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          data_hora?: string | null
          empresa_id?: string | null
          id?: string
          observacoes?: string | null
          os_id?: string | null
          tipo?: string
          user_id?: string | null
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
      mecanicos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          empresa_id: string | null
          especialidade: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          empresa_id?: string | null
          especialidade?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          empresa_id?: string | null
          especialidade?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      movimentacoes: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          motivo: string
          os_numero: string | null
          produto_id: string
          quantidade: number
          quantidade_anterior: number
          tipo: Database["public"]["Enums"]["movimentacao_tipo"]
          user_id: string | null
          valor_unitario: number | null
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          motivo: string
          os_numero?: string | null
          produto_id: string
          quantidade: number
          quantidade_anterior: number
          tipo: Database["public"]["Enums"]["movimentacao_tipo"]
          user_id?: string | null
          valor_unitario?: number | null
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          motivo?: string
          os_numero?: string | null
          produto_id?: string
          quantidade?: number
          quantidade_anterior?: number
          tipo?: Database["public"]["Enums"]["movimentacao_tipo"]
          user_id?: string | null
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
      orcamento_produtos: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          orcamento_id: string
          preco_total: number
          preco_unitario: number
          produto_id: string
          produto_nome: string
          quantidade: number
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          orcamento_id: string
          preco_total: number
          preco_unitario: number
          produto_id: string
          produto_nome: string
          quantidade: number
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          orcamento_id?: string
          preco_total?: number
          preco_unitario?: number
          produto_id?: string
          produto_nome?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_produtos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_servicos: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          orcamento_id: string
          preco: number
          servico_id: string | null
          servico_nome: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          orcamento_id: string
          preco: number
          servico_id?: string | null
          servico_nome: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          orcamento_id?: string
          preco?: number
          servico_id?: string | null
          servico_nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_servicos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_servicos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          cliente_id: string | null
          cliente_nome: string
          created_at: string
          empresa_id: string | null
          id: string
          mecanico_id: string | null
          numero_orcamento: string
          observacoes: string | null
          observacoes_internas: string | null
          os_id: string | null
          status: Database["public"]["Enums"]["orcamento_status"] | null
          updated_at: string
          user_id: string | null
          validade: string
          valor_desconto: number | null
          valor_final: number
          valor_total: number
          veiculo_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome: string
          created_at?: string
          empresa_id?: string | null
          id?: string
          mecanico_id?: string | null
          numero_orcamento: string
          observacoes?: string | null
          observacoes_internas?: string | null
          os_id?: string | null
          status?: Database["public"]["Enums"]["orcamento_status"] | null
          updated_at?: string
          user_id?: string | null
          validade: string
          valor_desconto?: number | null
          valor_final?: number
          valor_total?: number
          veiculo_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string
          created_at?: string
          empresa_id?: string | null
          id?: string
          mecanico_id?: string | null
          numero_orcamento?: string
          observacoes?: string | null
          observacoes_internas?: string | null
          os_id?: string | null
          status?: Database["public"]["Enums"]["orcamento_status"] | null
          updated_at?: string
          user_id?: string | null
          validade?: string
          valor_desconto?: number | null
          valor_final?: number
          valor_total?: number
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_mecanico_id_fkey"
            columns: ["mecanico_id"]
            isOneToOne: false
            referencedRelation: "mecanicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
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
          empresa_id: string | null
          estoque_minimo: number | null
          id: string
          marca: string | null
          nome: string
          preco_custo: number | null
          preco_venda: number
          quantidade: number
          status: Database["public"]["Enums"]["produto_status"] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          categoria_id?: string | null
          codigo?: string | null
          created_at?: string
          data_entrada?: string | null
          empresa_id?: string | null
          estoque_minimo?: number | null
          id?: string
          marca?: string | null
          nome: string
          preco_custo?: number | null
          preco_venda: number
          quantidade?: number
          status?: Database["public"]["Enums"]["produto_status"] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          categoria_id?: string | null
          codigo?: string | null
          created_at?: string
          data_entrada?: string | null
          empresa_id?: string | null
          estoque_minimo?: number | null
          id?: string
          marca?: string | null
          nome?: string
          preco_custo?: number | null
          preco_venda?: number
          quantidade?: number
          status?: Database["public"]["Enums"]["produto_status"] | null
          updated_at?: string
          user_id?: string | null
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
          empresa_atual_id: string | null
          full_name: string | null
          id: string
          primeiro_acesso: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          empresa_atual_id?: string | null
          full_name?: string | null
          id?: string
          primeiro_acesso?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          empresa_atual_id?: string | null
          full_name?: string | null
          id?: string
          primeiro_acesso?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      servicos: {
        Row: {
          created_at: string
          descricao: string | null
          empresa_id: string | null
          id: string
          nome: string
          preco: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          preco: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          preco?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          ano: string | null
          cliente_id: string
          created_at: string
          empresa_id: string | null
          id: string
          marca: string
          modelo: string
          observacoes: string | null
          placa: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ano?: string | null
          cliente_id: string
          created_at?: string
          empresa_id?: string | null
          id?: string
          marca: string
          modelo: string
          observacoes?: string | null
          placa: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ano?: string | null
          cliente_id?: string
          created_at?: string
          empresa_id?: string | null
          id?: string
          marca?: string
          modelo?: string
          observacoes?: string | null
          placa?: string
          updated_at?: string
          user_id?: string | null
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
          categoria_nome: string | null
          created_at: string
          empresa_id: string
          id: string
          preco_total: number
          preco_unitario: number
          produto_id: string
          produto_nome: string
          quantidade: number
          venda_id: string
        }
        Insert: {
          categoria_nome?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          preco_total: number
          preco_unitario: number
          produto_id: string
          produto_nome: string
          quantidade: number
          venda_id: string
        }
        Update: {
          categoria_nome?: string | null
          created_at?: string
          empresa_id?: string
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
          empresa_id: string
          id: string
          preco: number
          servico_id: string | null
          servico_nome: string
          venda_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          preco: number
          servico_id?: string | null
          servico_nome: string
          venda_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
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
          empresa_id: string | null
          finalizado_em: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id: string
          mecanico_id: string | null
          numero_os: string
          observacoes: string | null
          parcelas: number | null
          status: Database["public"]["Enums"]["venda_status"] | null
          updated_at: string
          user_id: string | null
          valor_desconto: number | null
          valor_final: number
          valor_total: number
          veiculo_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome: string
          created_at?: string
          empresa_id?: string | null
          finalizado_em?: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          mecanico_id?: string | null
          numero_os: string
          observacoes?: string | null
          parcelas?: number | null
          status?: Database["public"]["Enums"]["venda_status"] | null
          updated_at?: string
          user_id?: string | null
          valor_desconto?: number | null
          valor_final?: number
          valor_total?: number
          veiculo_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string
          created_at?: string
          empresa_id?: string | null
          finalizado_em?: string | null
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          mecanico_id?: string | null
          numero_os?: string
          observacoes?: string | null
          parcelas?: number | null
          status?: Database["public"]["Enums"]["venda_status"] | null
          updated_at?: string
          user_id?: string | null
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
            foreignKeyName: "vendas_mecanico_id_fkey"
            columns: ["mecanico_id"]
            isOneToOne: false
            referencedRelation: "mecanicos"
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
      create_empresa_with_owner: {
        Args: {
          cnpj_empresa?: string
          email_empresa?: string
          nome_empresa: string
        }
        Returns: string
      }
      get_current_empresa_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_masked_clientes: {
        Args: Record<PropertyKey, never>
        Returns: {
          bairro: string
          cidade: string
          cnpj: string
          cpf: string
          created_at: string
          email: string
          empresa_id: string
          endereco: string
          estado: string
          id: string
          nome: string
          numero_residencia: string
          rg: string
          rua: string
          telefone: string
          updated_at: string
          user_id: string
        }[]
      }
      get_user_role: {
        Args: { check_user_id?: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_empresa_access: {
        Args: { check_empresa_id: string }
        Returns: boolean
      }
      has_empresa_role: {
        Args: {
          check_empresa_id: string
          required_role: Database["public"]["Enums"]["empresa_role"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          check_user_id: string
          required_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_current_empresa_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_empresa_owner_or_admin: {
        Args: { check_empresa_id: string }
        Returns: boolean
      }
      mask_sensitive_data: {
        Args: { input_text: string; show_last?: number }
        Returns: string
      }
      migrate_user_data_to_empresa: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      rpc_finalizar_os_com_comissao: {
        Args: { payload: Json }
        Returns: Json
      }
      validate_user_exists: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      empresa_role: "owner" | "admin" | "user"
      forma_pagamento: "dinheiro" | "cartao" | "pix" | "cheque" | "parcelado"
      movimentacao_tipo: "entrada" | "saida" | "ajuste"
      orcamento_status: "pendente" | "aprovado" | "rejeitado" | "convertido_os"
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
      app_role: ["admin", "user"],
      empresa_role: ["owner", "admin", "user"],
      forma_pagamento: ["dinheiro", "cartao", "pix", "cheque", "parcelado"],
      movimentacao_tipo: ["entrada", "saida", "ajuste"],
      orcamento_status: ["pendente", "aprovado", "rejeitado", "convertido_os"],
      produto_status: ["ativo", "inativo"],
      venda_status: ["pendente", "finalizada", "cancelada"],
    },
  },
} as const
