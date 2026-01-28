import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
// (scroll area removed)

import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Users,
  TrendingUp,
  Calendar,
  Building2,
  Banknote,
  History,
  ShieldCheck
} from 'lucide-react';
import type { EmissaoDB } from '@/types/database';
import { DocumentosTab } from './tabs/DocumentosTab';
import { InvestidoresTab } from './tabs/InvestidoresTab';
import { FluxoCaixaTab } from './tabs/FluxoCaixaTab';
import { HistoricoAlteracoesTab } from './tabs/HistoricoAlteracoesTab';
import { InformacoesTab } from './tabs/InformacoesTab';
import { SeriesTab } from './tabs/SeriesTab';
import { DespesasTab } from './tabs/DespesasTab';
import { ComplianceTab } from './tabs/ComplianceTab';
import { formatCurrency } from '@/utils/formatters';

interface EmissaoEstruturacaoDrawerProps {
  emissao: EmissaoDB | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: string;
}

export function EmissaoEstruturacaoDrawer({
  emissao,
  open,
  onOpenChange,
  initialTab = 'informacoes',
}: EmissaoEstruturacaoDrawerProps) {
  if (!emissao) return null;

  // A UI trabalha com duas origens:
  // - comercial: public.emissoes (id = emissao.id)
  // - estruturação: estruturacao.operacoes (id próprio; ref em id_emissao_comercial)
  // Para tabs que leem/escrevem em public.*, sempre usar o id da emissão do comercial.
  const emissaoComercialId = (emissao as any).id_emissao_comercial || emissao.id;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl lg:max-w-5xl p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-start justify-between"
          >
            <div>
              <SheetTitle className="text-xl">
                {emissao.nome_operacao || emissao.numero_emissao}
              </SheetTitle>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex items-center gap-2 mt-1 text-sm text-muted-foreground"
              >
                <Building2 className="h-4 w-4" />
                <span>
                  {emissao.empresa_razao_social ||
                    (emissao as any).empresa_destinataria ||
                    (emissao as any).empresa_nome_fantasia ||
                    'Empresa não informada'}
                </span>
              </motion.div>
            </div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.2 }}
            >
              <Badge variant="secondary">{emissao.numero_emissao}</Badge>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flex items-center gap-4 mt-3 text-sm text-muted-foreground"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.4 }}
              className="flex items-center gap-1"
            >
              <TrendingUp className="h-4 w-4" />
              <span>{formatCurrency(emissao.volume || 0)}</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.5 }}
              className="flex items-center gap-1"
            >
              <Calendar className="h-4 w-4" />
              <span>
                {emissao.criado_em
                  ? new Date(emissao.criado_em).toLocaleDateString('pt-BR')
                  : 'Sem data'
                }
              </span>
            </motion.div>
          </motion.div>
        </SheetHeader>

        {/* Mobile: tabs em linha com scroll horizontal (evita quebrar layout) */}
        <Tabs defaultValue={initialTab} className="flex flex-col h-[calc(100dvh-140px)] min-h-0">
          <div className="relative px-4 sm:px-6 mt-4">
            {/* fade à direita pra indicar scroll horizontal no mobile */}
            <div
              className="pointer-events-none absolute right-4 top-0 h-10 w-12 sm:hidden"
              aria-hidden="true"
            >
              <div className="h-full w-full bg-gradient-to-l from-background via-background/80 to-transparent" />
            </div>

            <TabsList className="w-full justify-start flex-nowrap overflow-x-auto sm:overflow-visible sm:flex-wrap pr-10 sm:pr-1 [-webkit-overflow-scrolling:touch]">
            <TabsTrigger value="informacoes" className="gap-2">
              <Building2 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="series" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Séries
            </TabsTrigger>
            <TabsTrigger value="despesas" className="gap-2">
              <Banknote className="h-4 w-4" />
              Despesas
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="investidores" className="gap-2">
              <Users className="h-4 w-4" />
              Investidores
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Compliance
            </TabsTrigger>
          </TabsList>
          </div>

          {/* Conteúdo com scroll vertical */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 overscroll-contain [-webkit-overflow-scrolling:touch] outline-none focus:outline-none">
            <TabsContent value="informacoes" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <InformacoesTab emissao={emissao as any} />
              </motion.div>
            </TabsContent>
            <TabsContent value="series" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SeriesTab idEmissao={emissaoComercialId} />
              </motion.div>
            </TabsContent>
            <TabsContent value="despesas" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DespesasTab idEmissao={emissaoComercialId} />
              </motion.div>
            </TabsContent>
            <TabsContent value="documentos" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DocumentosTab idEmissao={emissaoComercialId} />
              </motion.div>
            </TabsContent>
            <TabsContent value="investidores" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <InvestidoresTab idEmissao={emissaoComercialId} />
              </motion.div>
            </TabsContent>
            <TabsContent value="historico" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <HistoricoAlteracoesTab idEmissao={emissaoComercialId} />
              </motion.div>
            </TabsContent>
            <TabsContent value="compliance" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ComplianceTab 
                  operacaoId={(emissao as any).id || emissao.id} 
                  emissaoComercialId={emissaoComercialId}
                />
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}