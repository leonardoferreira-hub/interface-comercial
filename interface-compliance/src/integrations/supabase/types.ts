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
      categorias: {
        Row: {
          codigo: string | null
          criado_em: string | null
          id: string
          nome: string
        }
        Insert: {
          codigo?: string | null
          criado_em?: string | null
          id?: string
          nome: string
        }
        Update: {
          codigo?: string | null
          criado_em?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      custos: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          fee_agente_fiduciario_recorrencia: number | null
          fee_agente_fiduciario_recorrente: number | null
          fee_agente_fiduciario_upfront: number | null
          fee_assessor_legal_upfront: number | null
          fee_auditoria_recorrencia: number | null
          fee_auditoria_recorrente: number | null
          fee_contabilidade_recorrencia: number | null
          fee_contabilidade_recorrente: number | null
          fee_coordenador_lider_upfront: number | null
          fee_custodiante_lastro_recorrencia: number | null
          fee_custodiante_lastro_recorrente: number | null
          fee_custodiante_lastro_upfront: number | null
          fee_escriturador_nc_recorrencia: number | null
          fee_escriturador_nc_recorrente: number | null
          fee_escriturador_nc_upfront: number | null
          fee_escriturador_recorrencia: number | null
          fee_escriturador_recorrente: number | null
          fee_escriturador_upfront: number | null
          fee_gerenciador_obra_recorrencia: number | null
          fee_gerenciador_obra_recorrente: number | null
          fee_gerenciador_obra_upfront: number | null
          fee_liquidante_recorrencia: number | null
          fee_liquidante_recorrente: number | null
          fee_liquidante_upfront: number | null
          fee_securitizadora_recorrencia: number | null
          fee_securitizadora_recorrente: number | null
          fee_securitizadora_upfront: number | null
          fee_servicer_recorrencia: number | null
          fee_servicer_recorrente: number | null
          fee_servicer_upfront: number | null
          id: string
          id_emissao: string
          taxa_anbima_upfront: number | null
          taxa_fiscalizacao_oferta_upfront: number | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          fee_agente_fiduciario_recorrencia?: number | null
          fee_agente_fiduciario_recorrente?: number | null
          fee_agente_fiduciario_upfront?: number | null
          fee_assessor_legal_upfront?: number | null
          fee_auditoria_recorrencia?: number | null
          fee_auditoria_recorrente?: number | null
          fee_contabilidade_recorrencia?: number | null
          fee_contabilidade_recorrente?: number | null
          fee_coordenador_lider_upfront?: number | null
          fee_custodiante_lastro_recorrencia?: number | null
          fee_custodiante_lastro_recorrente?: number | null
          fee_custodiante_lastro_upfront?: number | null
          fee_escriturador_nc_recorrencia?: number | null
          fee_escriturador_nc_recorrente?: number | null
          fee_escriturador_nc_upfront?: number | null
          fee_escriturador_recorrencia?: number | null
          fee_escriturador_recorrente?: number | null
          fee_escriturador_upfront?: number | null
          fee_gerenciador_obra_recorrencia?: number | null
          fee_gerenciador_obra_recorrente?: number | null
          fee_gerenciador_obra_upfront?: number | null
          fee_liquidante_recorrencia?: number | null
          fee_liquidante_recorrente?: number | null
          fee_liquidante_upfront?: number | null
          fee_securitizadora_recorrencia?: number | null
          fee_securitizadora_recorrente?: number | null
          fee_securitizadora_upfront?: number | null
          fee_servicer_recorrencia?: number | null
          fee_servicer_recorrente?: number | null
          fee_servicer_upfront?: number | null
          id?: string
          id_emissao: string
          taxa_anbima_upfront?: number | null
          taxa_fiscalizacao_oferta_upfront?: number | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          fee_agente_fiduciario_recorrencia?: number | null
          fee_agente_fiduciario_recorrente?: number | null
          fee_agente_fiduciario_upfront?: number | null
          fee_assessor_legal_upfront?: number | null
          fee_auditoria_recorrencia?: number | null
          fee_auditoria_recorrente?: number | null
          fee_contabilidade_recorrencia?: number | null
          fee_contabilidade_recorrente?: number | null
          fee_coordenador_lider_upfront?: number | null
          fee_custodiante_lastro_recorrencia?: number | null
          fee_custodiante_lastro_recorrente?: number | null
          fee_custodiante_lastro_upfront?: number | null
          fee_escriturador_nc_recorrencia?: number | null
          fee_escriturador_nc_recorrente?: number | null
          fee_escriturador_nc_upfront?: number | null
          fee_escriturador_recorrencia?: number | null
          fee_escriturador_recorrente?: number | null
          fee_escriturador_upfront?: number | null
          fee_gerenciador_obra_recorrencia?: number | null
          fee_gerenciador_obra_recorrente?: number | null
          fee_gerenciador_obra_upfront?: number | null
          fee_liquidante_recorrencia?: number | null
          fee_liquidante_recorrente?: number | null
          fee_liquidante_upfront?: number | null
          fee_securitizadora_recorrencia?: number | null
          fee_securitizadora_recorrente?: number | null
          fee_securitizadora_upfront?: number | null
          fee_servicer_recorrencia?: number | null
          fee_servicer_recorrente?: number | null
          fee_servicer_upfront?: number | null
          id?: string
          id_emissao?: string
          taxa_anbima_upfront?: number | null
          taxa_fiscalizacao_oferta_upfront?: number | null
        }
        Relationships: []
      }
      custos_emissao: {
        Row: {
          atualizado_em: string | null
          calculado_em: string | null
          id: string
          id_emissao: string
          total_anos_subsequentes: number | null
          total_anual: number | null
          total_mensal: number | null
          total_primeiro_ano: number | null
          total_upfront: number | null
        }
        Insert: {
          atualizado_em?: string | null
          calculado_em?: string | null
          id?: string
          id_emissao: string
          total_anos_subsequentes?: number | null
          total_anual?: number | null
          total_mensal?: number | null
          total_primeiro_ano?: number | null
          total_upfront?: number | null
        }
        Update: {
          atualizado_em?: string | null
          calculado_em?: string | null
          id?: string
          id_emissao?: string
          total_anos_subsequentes?: number | null
          total_anual?: number | null
          total_mensal?: number | null
          total_primeiro_ano?: number | null
          total_upfront?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "custos_emissao_id_emissao_fkey"
            columns: ["id_emissao"]
            isOneToOne: true
            referencedRelation: "emissoes"
            referencedColumns: ["id"]
          },
        ]
      }
      custos_linhas: {
        Row: {
          criado_em: string | null
          gross_up: number | null
          id: string
          id_custos_emissao: string
          id_prestador: string | null
          papel: string
          periodicidade: string | null
          preco_recorrente: number | null
          preco_upfront: number | null
          tipo_preco: string | null
          valor_recorrente_bruto: number | null
          valor_upfront_bruto: number | null
        }
        Insert: {
          criado_em?: string | null
          gross_up?: number | null
          id?: string
          id_custos_emissao: string
          id_prestador?: string | null
          papel: string
          periodicidade?: string | null
          preco_recorrente?: number | null
          preco_upfront?: number | null
          tipo_preco?: string | null
          valor_recorrente_bruto?: number | null
          valor_upfront_bruto?: number | null
        }
        Update: {
          criado_em?: string | null
          gross_up?: number | null
          id?: string
          id_custos_emissao?: string
          id_prestador?: string | null
          papel?: string
          periodicidade?: string | null
          preco_recorrente?: number | null
          preco_upfront?: number | null
          tipo_preco?: string | null
          valor_recorrente_bruto?: number | null
          valor_upfront_bruto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "custos_linhas_id_custos_emissao_fkey"
            columns: ["id_custos_emissao"]
            isOneToOne: false
            referencedRelation: "custos_emissao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custos_linhas_id_prestador_fkey"
            columns: ["id_prestador"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      custos_series: {
        Row: {
          criado_em: string | null
          custodia_b3: number | null
          id: string
          id_prestador: string | null
          id_serie: string
          papel: string
          registro_b3: number | null
          valor: number
        }
        Insert: {
          criado_em?: string | null
          custodia_b3?: number | null
          id?: string
          id_prestador?: string | null
          id_serie: string
          papel: string
          registro_b3?: number | null
          valor: number
        }
        Update: {
          criado_em?: string | null
          custodia_b3?: number | null
          id?: string
          id_prestador?: string | null
          id_serie?: string
          papel?: string
          registro_b3?: number | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "custos_series_id_prestador_fkey"
            columns: ["id_prestador"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custos_series_id_serie_fkey"
            columns: ["id_serie"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      dados_empresa: {
        Row: {
          atualizado_em: string | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string
          complemento: string | null
          criado_em: string | null
          estado: string | null
          id: string
          id_emissao: string
          logradouro: string | null
          numero: string | null
          razao_social: string
        }
        Insert: {
          atualizado_em?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj: string
          complemento?: string | null
          criado_em?: string | null
          estado?: string | null
          id?: string
          id_emissao: string
          logradouro?: string | null
          numero?: string | null
          razao_social: string
        }
        Update: {
          atualizado_em?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string
          complemento?: string | null
          criado_em?: string | null
          estado?: string | null
          id?: string
          id_emissao?: string
          logradouro?: string | null
          numero?: string | null
          razao_social?: string
        }
        Relationships: []
      }
      dados_estruturacao: {
        Row: {
          agencia: string | null
          alertas: string | null
          analista_contabil_id: string | null
          analista_financeiro_id: string | null
          analista_gestao_id: string | null
          atualizado_em: string | null
          banco: string | null
          boletagem: string | null
          compliance: string | null
          conta_bancaria: string | null
          criado_em: string | null
          data_df: string | null
          data_entrada_pipe: string | null
          data_liquidacao: string | null
          due_diligence: string | null
          envio_email_prestadores: string | null
          floating: boolean | null
          id: string
          id_emissao: string
          investidores_obs: string | null
          kick_off: string | null
          lo_status: string | null
          mapa_liquidacao: string | null
          mapa_registros: string | null
          passagem_bastao: string | null
          pmo_id: string | null
          previsao_liquidacao: string | null
          primeira_data_pagamento: string | null
          proximos_passos: string | null
          resumo: string | null
          status_tech: string | null
        }
        Insert: {
          agencia?: string | null
          alertas?: string | null
          analista_contabil_id?: string | null
          analista_financeiro_id?: string | null
          analista_gestao_id?: string | null
          atualizado_em?: string | null
          banco?: string | null
          boletagem?: string | null
          compliance?: string | null
          conta_bancaria?: string | null
          criado_em?: string | null
          data_df?: string | null
          data_entrada_pipe?: string | null
          data_liquidacao?: string | null
          due_diligence?: string | null
          envio_email_prestadores?: string | null
          floating?: boolean | null
          id?: string
          id_emissao: string
          investidores_obs?: string | null
          kick_off?: string | null
          lo_status?: string | null
          mapa_liquidacao?: string | null
          mapa_registros?: string | null
          passagem_bastao?: string | null
          pmo_id?: string | null
          previsao_liquidacao?: string | null
          primeira_data_pagamento?: string | null
          proximos_passos?: string | null
          resumo?: string | null
          status_tech?: string | null
        }
        Update: {
          agencia?: string | null
          alertas?: string | null
          analista_contabil_id?: string | null
          analista_financeiro_id?: string | null
          analista_gestao_id?: string | null
          atualizado_em?: string | null
          banco?: string | null
          boletagem?: string | null
          compliance?: string | null
          conta_bancaria?: string | null
          criado_em?: string | null
          data_df?: string | null
          data_entrada_pipe?: string | null
          data_liquidacao?: string | null
          due_diligence?: string | null
          envio_email_prestadores?: string | null
          floating?: boolean | null
          id?: string
          id_emissao?: string
          investidores_obs?: string | null
          kick_off?: string | null
          lo_status?: string | null
          mapa_liquidacao?: string | null
          mapa_registros?: string | null
          passagem_bastao?: string | null
          pmo_id?: string | null
          previsao_liquidacao?: string | null
          primeira_data_pagamento?: string | null
          proximos_passos?: string | null
          resumo?: string | null
          status_tech?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dados_estruturacao_analista_contabil_id_fkey"
            columns: ["analista_contabil_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dados_estruturacao_analista_financeiro_id_fkey"
            columns: ["analista_financeiro_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dados_estruturacao_analista_gestao_id_fkey"
            columns: ["analista_gestao_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dados_estruturacao_id_emissao_fkey"
            columns: ["id_emissao"]
            isOneToOne: true
            referencedRelation: "emissoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dados_estruturacao_pmo_id_fkey"
            columns: ["pmo_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      emissoes: {
        Row: {
          atualizado_em: string | null
          categoria: string | null
          contato_email: string | null
          contato_nome: string | null
          criado_em: string | null
          demandante_proposta: string | null
          empresa_cnpj: string | null
          empresa_destinataria: string | null
          empresa_endereco: string | null
          empresa_nome_fantasia: string | null
          empresa_razao_social: string | null
          id: string
          lastro: string | null
          nome_operacao: string | null
          numero_emissao: string
          oferta: string | null
          status: string | null
          tipo_oferta: string | null
          veiculo: string | null
          versao: number | null
          volume: number
        }
        Insert: {
          atualizado_em?: string | null
          categoria?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          criado_em?: string | null
          demandante_proposta?: string | null
          empresa_cnpj?: string | null
          empresa_destinataria?: string | null
          empresa_endereco?: string | null
          empresa_nome_fantasia?: string | null
          empresa_razao_social?: string | null
          id?: string
          lastro?: string | null
          nome_operacao?: string | null
          numero_emissao: string
          oferta?: string | null
          status?: string | null
          tipo_oferta?: string | null
          veiculo?: string | null
          versao?: number | null
          volume?: number
        }
        Update: {
          atualizado_em?: string | null
          categoria?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          criado_em?: string | null
          demandante_proposta?: string | null
          empresa_cnpj?: string | null
          empresa_destinataria?: string | null
          empresa_endereco?: string | null
          empresa_nome_fantasia?: string | null
          empresa_razao_social?: string | null
          id?: string
          lastro?: string | null
          nome_operacao?: string | null
          numero_emissao?: string
          oferta?: string | null
          status?: string | null
          tipo_oferta?: string | null
          veiculo?: string | null
          versao?: number | null
          volume?: number
        }
        Relationships: []
      }
      historico_emissoes: {
        Row: {
          criado_em: string | null
          dados_alterados: Json | null
          dados_anteriores: Json | null
          id: string
          id_emissao: string
          motivo: string | null
          status_anterior: string | null
          status_novo: string
          tipo_alteracao: string | null
          usuario_id: string | null
          versao: number | null
        }
        Insert: {
          criado_em?: string | null
          dados_alterados?: Json | null
          dados_anteriores?: Json | null
          id?: string
          id_emissao: string
          motivo?: string | null
          status_anterior?: string | null
          status_novo: string
          tipo_alteracao?: string | null
          usuario_id?: string | null
          versao?: number | null
        }
        Update: {
          criado_em?: string | null
          dados_alterados?: Json | null
          dados_anteriores?: Json | null
          id?: string
          id_emissao?: string
          motivo?: string | null
          status_anterior?: string | null
          status_novo?: string
          tipo_alteracao?: string | null
          usuario_id?: string | null
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_emissoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      lastros: {
        Row: {
          criado_em: string | null
          id: string
          nome: string
        }
        Insert: {
          criado_em?: string | null
          id?: string
          nome: string
        }
        Update: {
          criado_em?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      periodicidades: {
        Row: {
          codigo: string
          created_at: string | null
          dias: number
          id: string
          nome: string
        }
        Insert: {
          codigo: string
          created_at?: string | null
          dias: number
          id?: string
          nome: string
        }
        Update: {
          codigo?: string
          created_at?: string | null
          dias?: number
          id?: string
          nome?: string
        }
        Relationships: []
      }
      prestadores: {
        Row: {
          ativo: boolean | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      prestadores_precos: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          id: string
          id_terceiro: string
          observacoes: string | null
          papel: string
          periodicidade: string | null
          preco_recorrente: number | null
          preco_upfront: number | null
          tipo_preco: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          id_terceiro: string
          observacoes?: string | null
          papel: string
          periodicidade?: string | null
          preco_recorrente?: number | null
          preco_upfront?: number | null
          tipo_preco?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          id_terceiro?: string
          observacoes?: string | null
          papel?: string
          periodicidade?: string | null
          preco_recorrente?: number | null
          preco_upfront?: number | null
          tipo_preco?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prestadores_precos_id_terceiro_fkey"
            columns: ["id_terceiro"]
            isOneToOne: false
            referencedRelation: "terceiros"
            referencedColumns: ["id"]
          },
        ]
      }
      prestadores_precos_emissao: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          id: string
          id_emissao: string
          id_prestador_preco: string
          motivo_override: string | null
          preco_recorrencia_override: number | null
          preco_recorrente_override: number | null
          preco_upfront_override: number | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          id_emissao: string
          id_prestador_preco: string
          motivo_override?: string | null
          preco_recorrencia_override?: number | null
          preco_recorrente_override?: number | null
          preco_upfront_override?: number | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          id_emissao?: string
          id_prestador_preco?: string
          motivo_override?: string | null
          preco_recorrencia_override?: number | null
          preco_recorrente_override?: number | null
          preco_upfront_override?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prestadores_precos_emissao_id_prestador_preco_fkey"
            columns: ["id_prestador_preco"]
            isOneToOne: false
            referencedRelation: "prestadores_precos"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          data_vencimento: string | null
          id: string
          id_emissao: string
          numero: number
          percentual_volume: number | null
          prazo: number | null
          taxa_juros: number | null
          valor_emissao: number
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          data_vencimento?: string | null
          id?: string
          id_emissao: string
          numero: number
          percentual_volume?: number | null
          prazo?: number | null
          taxa_juros?: number | null
          valor_emissao: number
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          data_vencimento?: string | null
          id?: string
          id_emissao?: string
          numero?: number
          percentual_volume?: number | null
          prazo?: number | null
          taxa_juros?: number | null
          valor_emissao?: number
        }
        Relationships: [
          {
            foreignKeyName: "series_id_emissao_fkey"
            columns: ["id_emissao"]
            isOneToOne: false
            referencedRelation: "emissoes"
            referencedColumns: ["id"]
          },
        ]
      }
      terceiros: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          cnpj: string | null
          criado_em: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          tipo: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          cnpj?: string | null
          criado_em?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          tipo: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          cnpj?: string | null
          criado_em?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          tipo?: string
        }
        Relationships: []
      }
      tipos_operacao: {
        Row: {
          criado_em: string | null
          id: string
          nome: string
        }
        Insert: {
          criado_em?: string | null
          id?: string
          nome: string
        }
        Update: {
          criado_em?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      tipos_preco: {
        Row: {
          codigo: string
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          codigo: string
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          codigo?: string
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          departamento: string | null
          email: string
          funcao: string | null
          id: string
          nome_completo: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          departamento?: string | null
          email: string
          funcao?: string | null
          id?: string
          nome_completo: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          departamento?: string | null
          email?: string
          funcao?: string | null
          id?: string
          nome_completo?: string
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          criado_em: string | null
          id: string
          nome: string
          sigla: string | null
        }
        Insert: {
          criado_em?: string | null
          id?: string
          nome: string
          sigla?: string | null
        }
        Update: {
          criado_em?: string | null
          id?: string
          nome?: string
          sigla?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_custos_totalizados: {
        Row: {
          id_emissao: string | null
          total_recorrencia: number | null
          total_recorrente: number | null
          total_upfront: number | null
        }
        Insert: {
          id_emissao?: string | null
          total_recorrencia?: never
          total_recorrente?: never
          total_upfront?: never
        }
        Update: {
          id_emissao?: string | null
          total_recorrencia?: never
          total_recorrente?: never
          total_upfront?: never
        }
        Relationships: []
      }
    }
    Functions: {
      atualizar_status_emissao: {
        Args: {
          p_id_emissao: string
          p_motivo?: string
          p_novo_status: string
          p_usuario_id: string
        }
        Returns: boolean
      }
      calcular_total_custos_prestadores_upfront: {
        Args: { p_id_emissao: string }
        Returns: number
      }
      calcular_total_custos_upfront: {
        Args: { p_id_emissao: string }
        Returns: number
      }
      criar_preco_prestador: {
        Args: {
          p_nome_terceiro: string
          p_papel: string
          p_periodicidade?: string
          p_preco_recorrencia?: number
          p_preco_recorrente?: number
          p_preco_upfront?: number
          p_tipo_preco?: string
        }
        Returns: string
      }
      gerar_numero_emissao: { Args: never; Returns: string }
      get_base_custos_categorias: {
        Args: never
        Returns: {
          ativo: boolean
          codigo: string
          created_at: string
          id: string
          nome: string
        }[]
      }
      get_base_custos_lastros: {
        Args: never
        Returns: {
          ativo: boolean
          codigo: string
          created_at: string
          id: string
          nome: string
        }[]
      }
      get_base_custos_tipos_oferta: {
        Args: never
        Returns: {
          ativo: boolean
          codigo: string
          created_at: string
          id: string
          nome: string
        }[]
      }
      get_base_custos_veiculos: {
        Args: never
        Returns: {
          ativo: boolean
          codigo: string
          created_at: string
          id: string
          nome: string
        }[]
      }
      obter_preco_prestador: {
        Args: {
          p_id_emissao: string
          p_id_terceiro: string
          p_papel: string
          p_tipo_preco?: string
        }
        Returns: number
      }
      obter_preco_prestador_padrao: {
        Args: { p_id_terceiro: string; p_papel: string; p_tipo_preco?: string }
        Returns: number
      }
      sobrescrever_preco_emissao: {
        Args: {
          p_id_emissao: string
          p_motivo?: string
          p_nome_terceiro: string
          p_papel: string
          p_preco_recorrencia_override?: number
          p_preco_recorrente_override?: number
          p_preco_upfront_override?: number
        }
        Returns: string
      }
      validar_volume_series: {
        Args: { p_id_emissao: string }
        Returns: boolean
      }
    }
    Enums: {
      status_proposta:
        | "rascunho"
        | "enviada"
        | "aceita"
        | "recusada"
        | "finalizada"
        | "estruturacao"
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
      status_proposta: [
        "rascunho",
        "enviada",
        "aceita",
        "recusada",
        "finalizada",
        "estruturacao",
      ],
    },
  },
} as const
