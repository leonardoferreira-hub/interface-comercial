import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

type AuditRow = {
  id: number;
  schema_name: string;
  table_name: string;
  record_id: string;
  old_data: any;
  new_data: any;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  changed_by: string | null;
  changed_at: string;
};

function getEmissaoIdFromAudit(r: AuditRow): string | null {
  const candidates = [
    r?.new_data?.id_emissao,
    r?.old_data?.id_emissao,
    r?.new_data?.id_emissao_comercial,
    r?.old_data?.id_emissao_comercial,
  ].filter(Boolean);
  return (candidates[0] as string) ?? null;
}

function actionLabel(action: AuditRow['action']) {
  switch (action) {
    case 'INSERT':
      return 'Criado';
    case 'UPDATE':
      return 'Atualizado';
    case 'DELETE':
      return 'Removido';
    default:
      return action;
  }
}

function entityLabel(schema: string, table: string) {
  const t = table.toLowerCase();
  if (t.includes('series')) return 'Séries';
  if (t.includes('custos') || t.includes('despesas')) return 'Despesas';
  if (t.includes('emissoes') || t.includes('operacoes')) return 'Emissão';
  if (t.includes('document')) return 'Documentos';
  if (t.includes('invest')) return 'Investidores';
  if (t.includes('event')) return 'Cronograma';
  return `${schema}.${table}`;
}

const FIELD_LABELS: Record<string, string> = {
  nome_operacao: 'Nome da operação',
  numero_emissao: 'Nº da emissão',
  empresa_razao_social: 'Empresa',
  volume: 'Volume',
  status: 'Status',

  // séries
  numero: 'Número',
  valor_emissao: 'Valor de emissão',
  taxa_juros: 'Taxa de juros',
  prazo: 'Prazo (meses)',
  data_vencimento: 'Vencimento',

  // custos/despesas
  papel: 'Papel',
  prestador: 'Prestador',
  valor: 'Valor',
  gross_up: 'Gross up',
  grossUp: 'Gross up',
  valor_bruto: 'Valor bruto',
  valorBruto: 'Valor bruto',
  tipo: 'Tipo',
};

function fieldLabel(key: string) {
  return FIELD_LABELS[key] ?? key.replaceAll('_', ' ');
}

function formatValue(v: any) {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'number') return new Intl.NumberFormat('pt-BR').format(v);
  if (typeof v === 'string') {
    // ISO date
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
    }
    if (v.length > 80) return `${v.slice(0, 77)}…`;
    return v;
  }
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

const IGNORE_KEYS = new Set([
  'id',
  'created_at',
  'updated_at',
  'criado_em',
  'atualizado_em',
  'changed_at',
  'changed_by',
  'schema_name',
  'table_name',
  'record_id',
  'id_emissao',
  'id_emissao_comercial',
]);

function diffFields(oldData: any, newData: any) {
  const o = oldData ?? {};
  const n = newData ?? {};
  const keys = Array.from(new Set([...Object.keys(o), ...Object.keys(n)])).filter(
    (k) => !IGNORE_KEYS.has(k),
  );

  return keys
    .map((k) => ({ key: k, oldValue: o[k], newValue: n[k] }))
    .filter((c) => JSON.stringify(c.oldValue) !== JSON.stringify(c.newValue));
}

function safeJsonPreview(obj: any, maxLen = 900) {
  try {
    const s = JSON.stringify(obj, null, 2);
    return s.length > maxLen ? `${s.slice(0, maxLen)}\n…` : s;
  } catch {
    return String(obj);
  }
}

function recordTitle(r: AuditRow) {
  const data = (r.action === 'DELETE' ? r.old_data : r.new_data) ?? {};
  // heurísticas por entidade
  if (r.table_name.toLowerCase().includes('series')) {
    return data.numero ? `Série ${data.numero}` : 'Série';
  }
  if (r.table_name.toLowerCase().includes('custos') || r.table_name.toLowerCase().includes('despesas')) {
    const papel = data.papel || data.tipo || 'Despesa';
    const prestador = data.prestador || data.prestador_servico;
    return prestador ? `${papel} • ${prestador}` : String(papel);
  }
  if (r.table_name.toLowerCase().includes('operacoes') || r.table_name.toLowerCase().includes('emissoes')) {
    return data.nome_operacao || data.numero_emissao || 'Emissão';
  }
  return null;
}

function HistoryItem({ row }: { row: AuditRow }) {
  const [expanded, setExpanded] = useState(false);

  const title = recordTitle(row);
  const entity = entityLabel(row.schema_name, row.table_name);
  const label = actionLabel(row.action);

  const changes = useMemo(() => {
    if (row.action !== 'UPDATE') return [];
    return diffFields(row.old_data, row.new_data);
  }, [row]);

  const preview = expanded ? changes : changes.slice(0, 4);
  const changedFieldsSummary = changes.length
    ? changes
        .slice(0, 3)
        .map((c) => fieldLabel(c.key))
        .join(', ') + (changes.length > 3 ? ` (+${changes.length - 3})` : '')
    : null;

  const showDebug = expanded && (row.old_data || row.new_data);

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{label}</Badge>
            <span className="text-sm font-medium">{entity}</span>
          </div>
          {title ? <div className="mt-1 text-sm text-foreground truncate">{title}</div> : null}
          <div className="mt-1 text-xs text-muted-foreground">
            {new Date(row.changed_at).toLocaleString('pt-BR')}
            {row.changed_by ? ` • ${row.changed_by}` : ''}
          </div>
        </div>

        {/* ID técnico só pra referência (não domina o card) */}
        <div className="text-[11px] text-muted-foreground shrink-0 tabular-nums">ID {String(row.record_id).slice(0, 8)}…</div>
      </div>

      {row.action === 'UPDATE' ? (
        changes.length === 0 ? (
          <div className="mt-2 text-xs text-muted-foreground">
            Não foi possível identificar quais campos mudaram (a auditoria não trouxe old/new completos).
            <div>
              <Button variant="ghost" size="sm" className="mt-1 px-2" onClick={() => setExpanded((v) => !v)}>
                {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
              </Button>
            </div>
            {showDebug ? (
              <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-snug rounded-md bg-muted/30 p-2 overflow-x-auto">
                {safeJsonPreview({ old: row.old_data, new: row.new_data })}
              </pre>
            ) : null}
          </div>
        ) : (
          <div className="mt-2">
            <div className="text-xs text-muted-foreground">
              Alterado: <span className="text-foreground">{changedFieldsSummary}</span>
            </div>

            <div className="mt-3 space-y-2">
              {preview.map((c) => (
                <div key={c.key} className="rounded-md bg-muted/30 p-2">
                  <div className="text-[11px] text-muted-foreground">{fieldLabel(c.key)}</div>
                  <div className="mt-1 text-xs">
                    <span className="text-muted-foreground">{formatValue(c.oldValue)}</span>
                    <span className="mx-2 text-muted-foreground">→</span>
                    <span className="font-medium">{formatValue(c.newValue)}</span>
                  </div>
                </div>
              ))}

              {(changes.length > 4 || true) ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2"
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? 'Mostrar menos' : changes.length > 4 ? `Mostrar mais (${changes.length - 4})` : 'Ver detalhes'}
                </Button>
              ) : null}

              {showDebug ? (
                <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-snug rounded-md bg-muted/30 p-2 overflow-x-auto">
                  {safeJsonPreview({ old: row.old_data, new: row.new_data })}
                </pre>
              ) : null}
            </div>
          </div>
        )
      ) : (
        <div className="mt-2 text-xs text-muted-foreground">
          {row.action === 'INSERT' ? 'Registro criado.' : 'Registro removido.'}
          <div>
            <Button variant="ghost" size="sm" className="mt-1 px-2" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
            </Button>
          </div>
          {showDebug ? (
            <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-snug rounded-md bg-muted/30 p-2 overflow-x-auto">
              {safeJsonPreview(row.action === 'DELETE' ? row.old_data : row.new_data)}
            </pre>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function HistoricoAlteracoesTab({ idEmissao }: { idEmissao: string }) {
  // Precisamos do id_custos_emissao para conseguir correlacionar alterações de custos_linhas.
  const { data: custosEmissao } = useQuery({
    queryKey: ['custos_emissao_for_audit', idEmissao],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custos_emissao')
        .select('id')
        .eq('id_emissao', idEmissao)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string } | null;
    },
    enabled: !!idEmissao,
  });

  const idCustosEmissao = custosEmissao?.id ?? null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', idEmissao],
    queryFn: async () => {
      // A tabela existe no banco, mas não está tipada no supabase/types.ts; usar cast seguro.
      const { data: rows, error } = await (supabase as any)
        .from('historico_alteracoes')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(300);
      if (error) throw error;
      return rows as AuditRow[];
    },
    enabled: !!idEmissao,
  });

  // Baseline: não mostrar eventos "de criação" (setup inicial) — só mudanças pós-criação da emissão.
  const { data: emissaoMeta } = useQuery({
    queryKey: ['emissao_meta_for_audit', idEmissao],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emissoes')
        .select('criado_em')
        .eq('id', idEmissao)
        .maybeSingle();
      if (error) throw error;
      return data as { criado_em: string | null } | null;
    },
    enabled: !!idEmissao,
  });

  const baselineChangedAt = emissaoMeta?.criado_em ? new Date(emissaoMeta.criado_em).getTime() : null;

  const filtered = useMemo(() => {
    const rows = data ?? [];

    return rows
      .filter((r) => {
        // 1) Tabelas que carregam id_emissao direto no JSON
        if (getEmissaoIdFromAudit(r) === idEmissao) return true;

        // 2) Custos: correlacionar via id_custos_emissao
        const table = r.table_name?.toLowerCase?.() ?? '';

        if (table === 'custos_emissao' && idCustosEmissao) {
          return r.record_id === idCustosEmissao;
        }

        if (table === 'custos_linhas' && idCustosEmissao) {
          const candidates = [
            r?.new_data?.id_custos_emissao,
            r?.old_data?.id_custos_emissao,
          ].filter(Boolean);
          return candidates.includes(idCustosEmissao);
        }

        return false;
      })
      .filter((r) => {
        // Mostrar apenas ALTERAÇÕES (update) — deletions também geram ruído.
        if (r.action !== 'UPDATE') return false;

        const changes = diffFields(r.old_data, r.new_data);
        if (changes.length === 0) return false;

        // Custos: focar no que importa (valores/aliquota/periodicidade),
        // ignorando ruído do tipo_preco e alterações técnicas.
        const table = r.table_name?.toLowerCase?.() ?? '';
        if (table === 'custos_linhas') {
          const allowed = new Set([
            'papel',
            'id_prestador',
            'periodicidade',
            'preco_upfront',
            'preco_recorrente',
            'gross_up',
            'valor_upfront_bruto',
            'valor_recorrente_bruto',
          ]);

          const meaningful = changes.filter((c) => allowed.has(c.key));
          return meaningful.length > 0;
        }

        return true;
      })
      .filter((r) => {
        // Só após a criação da emissão (evita "setup inicial")
        if (!baselineChangedAt) return true;
        const t = new Date(r.changed_at).getTime();
        return Number.isFinite(t) ? t > baselineChangedAt : true;
      });
  }, [data, idEmissao, idCustosEmissao, baselineChangedAt]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Não foi possível carregar o histórico.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Histórico de Alterações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhuma alteração registrada para esta emissão.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <HistoryItem key={r.id} row={r} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
