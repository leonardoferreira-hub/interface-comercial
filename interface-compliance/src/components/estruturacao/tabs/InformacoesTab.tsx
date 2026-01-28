import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDadosEstruturacao, useUpdateCampoEstruturacao } from '@/hooks/useDadosEstruturacao';
import { useUpdateOperacao } from '@/hooks/useUpdateOperacao';
import { useOperacao } from '@/hooks/useOperacoesEstruturacao';
import { useUsuarios } from '@/hooks/useUsuarios';
import { useCategorias, useVeiculos, useLastros, useTiposOferta } from '@/hooks/useLookups';
import { useUpdateEmissao } from '@/hooks/useUpdateEmissao';
import { useSeries } from '@/hooks/useEmissoes';
import { formatCurrency } from '@/utils/formatters';
import type { EmissaoDB } from '@/types/database';
import type { StatusOkNok, StatusBoletagem } from '@/types/dados-estruturacao';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { salvarCustos } from '@/lib/supabase-custos';
import {
  EditableTextField,
  EditableDateField,
  StatusOkNokField,
  StatusBoletagemField,
  UserSelectField,
  BooleanField,
} from '../EditableFields';

interface InformacoesTabProps {
  emissao: EmissaoDB;
}

export function InformacoesTab({ emissao }: InformacoesTabProps) {
  // Para campos da OPERAÇÃO, precisamos do registro mais atual (selectedEmissao fica stale no state)
  const { data: operacaoAtual } = useOperacao(emissao.id);
  const operacao = (operacaoAtual || emissao) as any;

  const emissaoComercialId = operacao.id_emissao_comercial || emissao.id;

  const { data: dadosEstruturacao, isLoading: loadingDados } = useDadosEstruturacao(emissaoComercialId);
  const { updateCampo } = useUpdateCampoEstruturacao();
  const updateOperacao = useUpdateOperacao();
  const updateEmissao = useUpdateEmissao();
  const queryClient = useQueryClient();
  
  const { data: usuarios = [] } = useUsuarios();
  const { data: categorias = [] } = useCategorias();
  const { data: veiculos = [] } = useVeiculos();
  const { data: lastros = [] } = useLastros();
  const { data: tiposOferta = [] } = useTiposOferta();
  const { data: series = [] } = useSeries(emissaoComercialId);

  const { data: emissaoComercial } = useQuery({
    queryKey: ['emissao-comercial', emissaoComercialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emissoes')
        .select('id, categoria, veiculo, lastro, tipo_oferta, volume')
        .eq('id', emissaoComercialId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!emissaoComercialId,
  });

  // Handlers para campos de estruturação
  const handleUpdateEstruturacao = async (campo: string, valor: unknown) => {
    try {
      await updateCampo(emissaoComercialId, campo, valor);
      toast.success('Salvo');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar');
    }
  };

  // Handler para campos da operação (tabela estruturacao.operacoes)
  const handleUpdateOperacao = async (campo: string, valor: unknown) => {
    try {
      await updateOperacao.mutateAsync({ id: emissao.id, dados: { [campo]: valor } as any });
      toast.success('Salvo');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar');
    }
  };

  const recalcDespesasFromComercial = async (next: {
    categoriaId?: string | null;
    veiculoId?: string | null;
    lastroId?: string | null;
    tipoOfertaId?: string | null;
    volume?: number | null;
  }) => {
    const categoriaId = next.categoriaId ?? emissaoComercial?.categoria ?? null;
    const veiculoId = next.veiculoId ?? emissaoComercial?.veiculo ?? null;
    const lastroId = next.lastroId ?? emissaoComercial?.lastro ?? null;
    const tipoOfertaId = next.tipoOfertaId ?? emissaoComercial?.tipo_oferta ?? null;
    const volume = (next.volume ?? emissaoComercial?.volume ?? operacao.volume ?? 0) as number;

    const categoria = categorias.find((c) => c.id === categoriaId)?.codigo || null;
    const veiculo = veiculos.find((v) => v.id === veiculoId)?.nome || null;
    const lastro = lastros.find((l) => l.id === lastroId)?.nome || null;
    const rawTipoOferta = tiposOferta.find((t) => t.id === tipoOfertaId)?.nome || null;
    // A Edge Function do Comercial espera strings no formato "Oferta Privada Pura" etc.
    // Nossos lookups podem vir como "Privada Pura"/"CVM 160".
    const tipo_oferta = (() => {
      if (!rawTipoOferta) return null;
      const s = String(rawTipoOferta);
      if (/^oferta\s+/i.test(s)) return s;
      return `Oferta ${s}`;
    })();

    if (!categoria) throw new Error('Categoria inválida para recalcular');

    const seriesPayload = (series || []).map((s: any) => ({
      numero: s.numero,
      valor_emissao: s.valor_emissao,
      prazo: s.prazo ?? undefined,
    }));

    toast.message('Recalculando despesas…');

    const { data, error } = await supabase.functions.invoke('fluxo_custos_por_combinacao', {
      body: {
        categoria,
        // compat: a edge function aceita "tipo_oferta" ou "oferta".
        // usamos tipo_oferta já normalizado para casar com as chaves internas.
        tipo_oferta,
        veiculo,
        lastro,
        volume,
        series: seriesPayload,
      },
    });

    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Falha ao recalcular custos');

    const custos = (data?.data?.custos || []) as any[];

    // converter para custos_linhas (recalculados)
    const linhasRecalc = custos.flatMap((c) => {
      const upfront = Number(c.valor_upfront_calculado ?? c.preco_upfront ?? 0) || 0;
      const recorr = Number(c.valor_recorrente_calculado ?? c.preco_recorrente ?? 0) || 0;
      const tipo_preco = c.tipo_preco === 'percentual' ? 'percentual' : 'fixo';
      const periodicidade = (c.periodicidade ?? null) as string | null;

      const items: any[] = [];
      if (upfront > 0) {
        items.push({
          origem: 'auto',
          papel: c.papel,
          id_prestador: c.id_prestador ?? null,
          tipo_preco,
          preco_upfront: upfront,
          preco_recorrente: 0,
          periodicidade: null,
          gross_up: 0,
          valor_upfront_bruto: upfront,
          valor_recorrente_bruto: 0,
        });
      }
      if (recorr > 0) {
        items.push({
          origem: 'auto',
          papel: c.papel,
          id_prestador: c.id_prestador ?? null,
          tipo_preco,
          preco_upfront: 0,
          preco_recorrente: recorr,
          periodicidade: periodicidade || 'mensal',
          gross_up: 0,
          valor_upfront_bruto: 0,
          valor_recorrente_bruto: recorr,
        });
      }
      return items;
    });

    // Regra: ao recalcular, SUBSTITUIR apenas custos automáticos (origem='auto'),
    // mantendo custos manuais intactos.
    const { data: custosEmissaoRow, error: custosEmissaoErr } = await supabase
      .from('custos_emissao')
      .select('id')
      .eq('id_emissao', emissaoComercialId)
      .maybeSingle();
    if (custosEmissaoErr) throw custosEmissaoErr;

    const { data: existingLinhas, error: existingLinhasErr } = await supabase
      .from('custos_linhas')
      .select('*')
      .eq('id_custos_emissao', custosEmissaoRow?.id || '__none__');
    if (existingLinhasErr) throw existingLinhasErr;

    const keyOf = (l: any) => `${l.papel}::${l.periodicidade ?? 'upfront'}`;
    const existingByKey = new Map((existingLinhas || []).map((l: any) => [keyOf(l), l]));

    // preservar apenas MANUAIS (e não preservar automáticos antigos)
    const linhasManuais = (existingLinhas || [])
      .filter((l: any) => (l.origem || 'manual') !== 'auto')
      .map((l: any) => ({
        id: l.id,
        origem: (l.origem || 'manual') as any,
        papel: l.papel,
        id_prestador: l.id_prestador ?? null,
        tipo_preco: l.tipo_preco,
        preco_upfront: l.preco_upfront || 0,
        preco_recorrente: l.preco_recorrente || 0,
        periodicidade: l.periodicidade ?? null,
        gross_up: l.gross_up || 0,
        valor_upfront_bruto: l.valor_upfront_bruto || 0,
        valor_recorrente_bruto: l.valor_recorrente_bruto || 0,
      }));

    // reaproveitar IDs quando possível (por chave papel+periodicidade)
    const linhasAuto = [...linhasRecalc].map((l) => {
      const existing = existingByKey.get(keyOf(l));
      return existing ? { ...l, id: existing.id } : l;
    });

    // Deduplicar por chave (papel + periodicidade). Se houver conflito,
    // preferir manual (usuário) > auto (recalculo).
    const byKey = new Map<string, any>();
    for (const row of [...linhasAuto, ...linhasManuais]) {
      const key = keyOf(row);
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, row);
        continue;
      }
      const existingIsManual = (existing.origem || 'manual') !== 'auto';
      const rowIsManual = (row.origem || 'manual') !== 'auto';
      if (rowIsManual && !existingIsManual) {
        byKey.set(key, row);
      }
    }

    // Garantir IDs únicos (Postgres falha se o mesmo id aparecer duas vezes no upsert)
    const usedIds = new Set<string>();
    const merged = Array.from(byKey.values()).map((r: any) => {
      if (r.id && usedIds.has(r.id)) {
        return { ...r, id: crypto.randomUUID() };
      }
      if (r.id) usedIds.add(r.id);
      return r;
    });

    const total_upfront = merged.reduce((s, l) => s + (l.valor_upfront_bruto || 0), 0);
    const mensal = merged.filter((l) => l.periodicidade === 'mensal');
    const anual = merged.filter((l) => l.periodicidade === 'anual');
    const total_mensal = mensal.reduce((s, l) => s + (l.valor_recorrente_bruto || 0), 0);
    const total_anual = anual.reduce((s, l) => s + (l.valor_recorrente_bruto || 0), 0);

    const totais = {
      total_upfront,
      total_mensal,
      total_anual,
      total_primeiro_ano: total_upfront + total_anual + total_mensal * 12,
      total_anos_subsequentes: total_anual + total_mensal * 12,
    };

    const res = await salvarCustos({
      id_emissao_comercial: emissaoComercialId,
      custos: merged,
      totais,
    });

    if (!res.success) throw new Error(res.error || 'Falha ao salvar despesas recalculadas');

    // refresh UI
    queryClient.invalidateQueries({ queryKey: ['custos', emissaoComercialId] });
    queryClient.invalidateQueries({ queryKey: ['custos-linhas'] });
    toast.success('Despesas recalculadas');
  };

  const handleUpdateComercial = async (campo: 'categoria' | 'veiculo' | 'lastro' | 'tipo_oferta', valor: string | null) => {
    try {
      await updateEmissao.mutateAsync({ id: emissaoComercialId, dados: { [campo]: valor } as any });

      // recalcula ao mudar combinação
      const next = {
        categoriaId: campo === 'categoria' ? valor : undefined,
        veiculoId: campo === 'veiculo' ? valor : undefined,
        lastroId: campo === 'lastro' ? valor : undefined,
        tipoOfertaId: campo === 'tipo_oferta' ? valor : undefined,
      };
      await recalcDespesasFromComercial(next);

      toast.success('Salvo');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar');
    }
  };

  if (loadingDados) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isMajoracao = (operacao.volume || 0) > 50000000;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        {/* GESTÃO */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold tracking-tight">Gestão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(() => {
              const PMO_ORDER = ['Leonardo', 'Lucas', 'Ronaldo', 'Beatriz', 'Eduarda'];
              const pmos = PMO_ORDER
                .map((n) => {
                  const needle = n.toLowerCase();
                  return usuarios.find((u) => (u.nome_completo || '').trim().toLowerCase() === needle);
                })
                .filter(Boolean) as typeof usuarios;

              // Se a base ainda não tem os PMOs cadastrados (ou nomes diferentes), não deixa o select vazio.
              const pmosFallback = pmos.length > 0 ? pmos : usuarios;

              return (
                <UserSelectField
                  label="PMO"
                  value={dadosEstruturacao?.pmo_id}
                  usuarios={pmosFallback}
                  onSave={(v) => handleUpdateEstruturacao('pmo_id', v)}
                  placeholder="Selecionar PMO"
                />
              );
            })()}
            <UserSelectField
              label="Analista Financeiro"
              value={dadosEstruturacao?.analista_financeiro_id}
              usuarios={usuarios}
              onSave={(v) => handleUpdateEstruturacao('analista_financeiro_id', v)}
              placeholder="Selecionar Analista"
            />
            <UserSelectField
              label="Analista Contábil"
              value={dadosEstruturacao?.analista_contabil_id}
              usuarios={usuarios}
              onSave={(v) => handleUpdateEstruturacao('analista_contabil_id', v)}
              placeholder="Selecionar Analista"
            />
            <UserSelectField
              label="Analista de Gestão"
              value={dadosEstruturacao?.analista_gestao_id}
              usuarios={usuarios}
              onSave={(v) => handleUpdateEstruturacao('analista_gestao_id', v)}
              placeholder="Selecionar Analista"
            />
            </div>
          </CardContent>
        </Card>

        {/* OPERAÇÃO */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold tracking-tight">Operação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <EditableTextField
              label="Nome da Operação"
              value={operacao.nome_operacao}
              onSave={(v) => handleUpdateOperacao('nome_operacao', v)}
              placeholder="Não informado"
            />
            <EditableTextField
              label="Número da Emissão"
              value={operacao.numero_emissao}
              onSave={(v) => handleUpdateOperacao('numero_emissao', v)}
            />
            
            {(() => {
              const categoriaId = (emissaoComercial?.categoria ?? null) as string | null;
              const categoriaCodigo = categorias.find((c) => c.id === categoriaId)?.codigo ?? null;
              const showLastro = categoriaCodigo === 'CRI' || categoriaCodigo === 'CRA';

              return (
                <>
                  {/* Categoria (fonte: Comercial/public.emissoes) */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Categoria</Label>
                    <Select
                      value={categoriaId || '__none__'}
                      onValueChange={(v) => handleUpdateComercial('categoria', v === '__none__' ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          <span className="text-muted-foreground">Selecionar categoria</span>
                        </SelectItem>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.codigo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Veículo */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Veículo</Label>
                    <Select
                      value={(emissaoComercial?.veiculo ?? null) || '__none__'}
                      onValueChange={(v) => handleUpdateComercial('veiculo', v === '__none__' ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar veículo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          <span className="text-muted-foreground">Selecionar veículo</span>
                        </SelectItem>
                        {veiculos.map((veic) => (
                          <SelectItem key={veic.id} value={veic.id}>
                            {veic.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lastro - apenas para CRI e CRA */}
                  {showLastro && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Lastro</Label>
                      <Select
                        value={(emissaoComercial?.lastro ?? null) || '__none__'}
                        onValueChange={(v) => handleUpdateComercial('lastro', v === '__none__' ? null : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar lastro" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            <span className="text-muted-foreground">Selecionar lastro</span>
                          </SelectItem>
                          {lastros.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Tipo Oferta */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Tipo Oferta</Label>
                    <Select
                      value={(emissaoComercial?.tipo_oferta ?? null) || '__none__'}
                      onValueChange={(v) => handleUpdateComercial('tipo_oferta', v === '__none__' ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          <span className="text-muted-foreground">Selecionar tipo</span>
                        </SelectItem>
                        {tiposOferta.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id}>
                            {tipo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              );
            })()}

            {/* Volume e Majoração */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Volume</Label>
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatCurrency(operacao.volume || 0)}</span>
                {isMajoracao && (
                  <Badge variant="secondary" className="text-xs">
                    Majoração
                  </Badge>
                )}
              </div>
            </div>

            <BooleanField
              label="Floating"
              value={dadosEstruturacao?.floating}
              onSave={(v) => handleUpdateEstruturacao('floating', v)}
            />
            </div>
          </CardContent>
        </Card>

        {/* DATAS E FINANCEIRO */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold tracking-tight">Datas e Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Data Entrada Pipe</Label>
              <p className="text-sm font-medium py-2">
                {dadosEstruturacao?.data_entrada_pipe 
                  ? new Date(dadosEstruturacao.data_entrada_pipe).toLocaleDateString('pt-BR')
                  : '-'
                }
              </p>
            </div>
            <EditableDateField
              label="Previsão Liquidação"
              value={dadosEstruturacao?.previsao_liquidacao}
              onSave={(v) => handleUpdateEstruturacao('previsao_liquidacao', v)}
            />
            <EditableDateField
              label="Data Liquidação"
              value={dadosEstruturacao?.data_liquidacao}
              onSave={(v) => handleUpdateEstruturacao('data_liquidacao', v)}
            />
            <EditableDateField
              label="1ª Data Pagamento"
              value={dadosEstruturacao?.primeira_data_pagamento}
              onSave={(v) => handleUpdateEstruturacao('primeira_data_pagamento', v)}
            />
            <EditableDateField
              label="Data DF"
              value={dadosEstruturacao?.data_df}
              onSave={(v) => handleUpdateEstruturacao('data_df', v)}
            />
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <EditableTextField
              label="Banco"
              value={dadosEstruturacao?.banco}
              onSave={(v) => handleUpdateEstruturacao('banco', v)}
              placeholder="Nome do banco"
            />
            <EditableTextField
              label="Agência"
              value={dadosEstruturacao?.agencia}
              onSave={(v) => handleUpdateEstruturacao('agencia', v)}
              placeholder="Número da agência"
            />
            <EditableTextField
              label="Conta Bancária"
              value={dadosEstruturacao?.conta_bancaria}
              onSave={(v) => handleUpdateEstruturacao('conta_bancaria', v)}
              placeholder="Número da conta"
            />
          </div>
        </CardContent>
      </Card>
      </div>

      <div className="space-y-6">
        {/* STATUS E CHECKLIST */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold tracking-tight">Status e Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatusOkNokField
              label="Compliance"
              value={dadosEstruturacao?.compliance as StatusOkNok}
              onSave={(v) => handleUpdateEstruturacao('compliance', v)}
            />
            <StatusBoletagemField
              label="Boletagem"
              value={dadosEstruturacao?.boletagem as StatusBoletagem}
              onSave={(v) => handleUpdateEstruturacao('boletagem', v)}
            />
            <StatusOkNokField
              label="Due Diligence"
              value={dadosEstruturacao?.due_diligence as StatusOkNok}
              onSave={(v) => handleUpdateEstruturacao('due_diligence', v)}
            />
            <StatusOkNokField
              label="Mapa Liquidação"
              value={dadosEstruturacao?.mapa_liquidacao as StatusOkNok}
              onSave={(v) => handleUpdateEstruturacao('mapa_liquidacao', v)}
            />
            <StatusOkNokField
              label="Mapa Registros"
              value={dadosEstruturacao?.mapa_registros as StatusOkNok}
              onSave={(v) => handleUpdateEstruturacao('mapa_registros', v)}
            />
            <StatusOkNokField
              label="LO"
              value={dadosEstruturacao?.lo_status as StatusOkNok}
              onSave={(v) => handleUpdateEstruturacao('lo_status', v)}
            />
            <StatusOkNokField
              label="Kick Off"
              value={dadosEstruturacao?.kick_off as StatusOkNok}
              onSave={(v) => handleUpdateEstruturacao('kick_off', v)}
            />
            <StatusOkNokField
              label="Envio E-mail Prestadores"
              value={dadosEstruturacao?.envio_email_prestadores as StatusOkNok}
              onSave={(v) => handleUpdateEstruturacao('envio_email_prestadores', v)}
            />
            <StatusOkNokField
              label="Passagem Bastão"
              value={dadosEstruturacao?.passagem_bastao as StatusOkNok}
              onSave={(v) => handleUpdateEstruturacao('passagem_bastao', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* OBSERVAÇÕES */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold tracking-tight">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Notas rápidas por categoria (estilo Notion)
            </div>

            {/* Tabs internas para reduzir altura e ficar mais "produto" */}
            <div className="overflow-x-auto">
              <div className="min-w-max">
                <Tabs defaultValue="proximos">
                  <TabsList className="w-auto justify-start">
                    <TabsTrigger value="proximos">Próximos</TabsTrigger>
                    <TabsTrigger value="alertas">Alertas</TabsTrigger>
                    <TabsTrigger value="tech">Tech</TabsTrigger>
                    <TabsTrigger value="resumo">Resumo</TabsTrigger>
                    <TabsTrigger value="investidores">Investidores</TabsTrigger>
                  </TabsList>

                  <TabsContent value="proximos" className="mt-4">
                    <EditableTextField
                      label="Próximos Passos"
                      value={dadosEstruturacao?.proximos_passos}
                      onSave={(v) => handleUpdateEstruturacao('proximos_passos', v)}
                      placeholder="Descreva os próximos passos..."
                      multiline
                    />
                  </TabsContent>

                  <TabsContent value="alertas" className="mt-4">
                    <EditableTextField
                      label="Alertas"
                      value={dadosEstruturacao?.alertas}
                      onSave={(v) => handleUpdateEstruturacao('alertas', v)}
                      placeholder="Registre alertas importantes..."
                      multiline
                    />
                  </TabsContent>

                  <TabsContent value="tech" className="mt-4">
                    <EditableTextField
                      label="Status Tech"
                      value={dadosEstruturacao?.status_tech}
                      onSave={(v) => handleUpdateEstruturacao('status_tech', v)}
                      placeholder="Status técnico da operação..."
                      multiline
                    />
                  </TabsContent>

                  <TabsContent value="resumo" className="mt-4">
                    <EditableTextField
                      label="Resumo"
                      value={dadosEstruturacao?.resumo}
                      onSave={(v) => handleUpdateEstruturacao('resumo', v)}
                      placeholder="Resumo da operação..."
                      multiline
                    />
                  </TabsContent>

                  <TabsContent value="investidores" className="mt-4">
                    <EditableTextField
                      label="Observações Investidores"
                      value={dadosEstruturacao?.investidores_obs}
                      onSave={(v) => handleUpdateEstruturacao('investidores_obs', v)}
                      placeholder="Observações sobre investidores..."
                      multiline
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HISTÓRICO */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold tracking-tight">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Criado em</Label>
              <p className="font-medium">
                {emissao.criado_em 
                  ? new Date(emissao.criado_em).toLocaleString('pt-BR')
                  : '-'
                }
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Atualizado em</Label>
              <p className="font-medium">
                {emissao.atualizado_em 
                  ? new Date(emissao.atualizado_em).toLocaleString('pt-BR')
                  : '-'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
