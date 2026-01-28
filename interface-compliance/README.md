# Interface Compliance

Sistema de gestão de compliance para verificação de CNPJs e onboarding de investidores.

## 🏗️ Estrutura do Projeto

Este projeto está temporariamente dentro do repositório `interface-comercial`. Quando houver acesso ao PC, deve ser movido para seu próprio repositório.

## 🚀 Como rodar

```bash
cd interface-compliance
npm install
npm run dev -- --port 5176
```

## 📋 Funcionalidades

### 1. Dashboard
- Estatísticas de verificações pendentes
- Investidores em onboarding
- Histórico de CNPJs verificados

### 2. Verificações de CNPJ
- Lista CNPJs enviados pela estruturação
- Aprovação/reprovação com justificativa
- Consulta automática via BrasilAPI
- Cache de CNPJs já verificados

### 3. Investidores (Onboarding)
- Cadastro de investidores (PF/PJ)
- Upload de documentos (KYC, Suitability, Ficha Cadastral)
- Workflow de aprovação

## 🗄️ Schema do Banco (Supabase)

Schema: `compliance`

Tabelas:
- `cnpjs_verificados` - Base histórica de CNPJs
- `verificacoes_pendentes` - Fila de trabalho
- `investidores` - Cadastro e onboarding
- `investidor_documentos` - Documentos

## 🔗 Integração

A Interface Compliance se integra com a Interface Estruturação:
- Quando um CNPJ é adicionado na Estruturação, aparece automaticamente no Compliance
- Status de verificação é sincronizado entre os sistemas

## 📝 SQLs

Os arquivos SQL estão em `supabase/migrations/`:
- `20260128210000_create_compliance_schema.sql` - Criação do schema
- `20260128211000_seed_test_data.sql` - Dados de teste
- `20260128212000_create_sync_function.sql` - Função de sincronização

## 🎯 Próximos Passos

1. Mover este projeto para repositório próprio: `interface-compliance`
2. Configurar CI/CD para deploy automático
3. Implementar portal do investidor (link externo)
