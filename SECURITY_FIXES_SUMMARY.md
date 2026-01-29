# 🛡️ Correções de Segurança Críticas - Resumo

**Data:** 27/01/2025  
**Agente:** Security Fix Agent  
**Status:** ✅ CONCLUÍDO

---

## ✅ Correções Aplicadas

### 1. CORS Permissivo nas Edge Functions

**Problema:** Todas as 20 Edge Functions usavam `"Access-Control-Allow-Origin": "*"`, permitindo requisições de qualquer origem.

**Solução:** Alterado para validar e restringir origens específicas:
- `http://100.91.53.76:5173`
- `http://100.91.53.76:5174`
- `http://100.91.53.76:5176`

**Arquivos modificados (20):**
```
supabase/functions/
├── anbima_cri/index.ts
├── anbima_todos/index.ts
├── buscar-cnpj/index.ts
├── custodiab3_cr/index.ts
├── custodiab3_cra/index.ts
├── custodiab3_deb/index.ts
├── fluxo-0-detalhes-emissao/index.ts
├── fluxo-0-historico-emissao/index.ts
├── fluxo-0-listar-emissoes/index.ts
├── fluxo-1-atualizar-emissao/index.ts
├── fluxo-1-criar-emissao/index.ts
├── fluxo-1-salvar-custos/index.ts
├── fluxo-2-finalizar-proposta/index.ts
├── fluxo_custos_por_combinacao/index.ts
├── gerar-proposta-pdf/index.ts
├── registrob3_cr/index.ts
├── registrob3_debpriv/index.ts
├── registrob3_debpub/index.ts
└── taxacvm/index.ts
```

**Padrão aplicado:**
```typescript
const ALLOWED_ORIGINS = [
  "http://100.91.53.76:5173",
  "http://100.91.53.76:5174",
  "http://100.91.53.76:5176",
];

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
};
```

---

### 2. Autenticação nas Edge Functions

**Problema:** Funções que acessam dados sensíveis não validavam JWT antes de processar requisições.

**Solução:** Adicionada função `verifyAuth()` em 9 Edge Functions críticas:

**Arquivos modificados (9):**
```
supabase/functions/
├── fluxo-0-detalhes-emissao/index.ts
├── fluxo-0-historico-emissao/index.ts
├── fluxo-0-listar-emissoes/index.ts
├── fluxo-1-atualizar-emissao/index.ts
├── fluxo-1-criar-emissao/index.ts
├── fluxo-1-salvar-custos/index.ts
├── fluxo-2-finalizar-proposta/index.ts
├── fluxo_custos_por_combinacao/index.ts
└── gerar-proposta-pdf/index.ts
```

**Função de verificação JWT:**
```typescript
async function verifyAuth(req: Request, supabaseUrl: string): Promise<{ user: any | null; error: string | null }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return { user: null, error: "Authorization header missing" };
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return { user: null, error: "Token missing" };
  }

  try {
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return { user: null, error: "Invalid token" };
    }
    return { user, error: null };
  } catch (e) {
    return { user: null, error: "Token verification failed" };
  }
}
```

---

### 3. SQL Injection na Busca

**Problema:** A função `fluxo-0-listar-emissoes` usava interpolação de string direta na query de busca:
```typescript
query = query.or(`numero_emissao.ilike.%${search}%,nome_operacao.ilike.%${search}%,empresa_razao_social.ilike.%${search}%`);
```

**Solução:** Adicionada função de sanitização de input:

```typescript
function sanitizeSearchInput(input: string): string {
  return input
    .replace(/[%;'"\\]/g, '')  // Remove dangerous SQL characters
    .replace(/[%_]/g, '\\$&')    // Escape SQL wildcards
    .trim();
}
```

**Uso:**
```typescript
if (search) {
  const sanitizedSearch = sanitizeSearchInput(search);
  if (sanitizedSearch.length > 0) {
    query = query.or(`numero_emissao.ilike.${'%' + sanitizedSearch + '%'},...`);
  }
}
```

---

### 4. RLS Anônimo - Migration

**Problema:** Tabelas podiam ter políticas que permitiam acesso anônimo (role `anon`).

**Solução:** Criada migration `20250127000000_security_hardening_rls.sql` com:

1. **Drop de todas as políticas anônimas** no schema `public`
2. **RLS habilitado em todas as tabelas** (public e base_custos)
3. **Políticas para usuários autenticados** em todas as tabelas principais:
   - `emissoes`
   - `series`
   - `custos_emissao`
   - `custos_linhas`
   - `custos_series`
   - `custos`
   - `dados_empresa`
   - `historico_emissoes`
4. **Políticas read-only** para tabelas base_custos:
   - `categorias`
   - `veiculos`
   - `tipos_oferta`
   - `lastros`
5. **Revogação de privilégios** do role `anon`
6. **Force RLS** para table owners

---

## 📋 Próximos Passos

1. **Deploy das Edge Functions:**
   ```bash
   supabase functions deploy
   ```

2. **Aplicar Migration:**
   ```bash
   supabase db push
   ```

3. **Testar aplicação:**
   - Verificar se login funciona corretamente
   - Verificar se busca de emissões funciona
   - Verificar se CORS permite acesso apenas das origens configuradas

4. **Configurar SUPABASE_ANON_KEY** nas Edge Functions (se necessário)

---

## 🔍 Lista Completa de Alterações

| # | Arquivo | Alteração |
|---|---------|-----------|
| 1 | `supabase/functions/*/index.ts` (20 arquivos) | CORS restrito |
| 2 | `supabase/functions/fluxo-0-*/index.ts` (3 arquivos) | Auth JWT |
| 3 | `supabase/functions/fluxo-1-*/index.ts` (3 arquivos) | Auth JWT |
| 4 | `supabase/functions/fluxo-2-*/index.ts` (1 arquivo) | Auth JWT |
| 5 | `supabase/functions/gerar-proposta-pdf/index.ts` | Auth JWT |
| 6 | `supabase/functions/fluxo_custos_por_combinacao/index.ts` | Auth JWT |
| 7 | `supabase/functions/fluxo-0-listar-emissoes/index.ts` | Sanitização SQL |
| 8 | `supabase/migrations/20250127000000_security_hardening_rls.sql` | Migration RLS |

**Total: 20 Edge Functions + 1 Migration modificados**
