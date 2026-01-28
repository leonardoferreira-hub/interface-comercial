import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Users, 
  Layers, 
  AlertTriangle,
  Download,
  Edit,
  X 
} from 'lucide-react';
import { Emissao, STATUS_LABELS } from '@/types';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate, formatPercent } from '@/utils/formatters';
import { exportEmissaoToPDF } from '@/utils/pdfExport';

interface EmissaoDetailDrawerProps {
  emissao: Emissao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (emissao: Emissao) => void;
}

export function EmissaoDetailDrawer({
  emissao,
  open,
  onOpenChange,
  onEdit,
}: EmissaoDetailDrawerProps) {
  if (!emissao) return null;

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || '-'}</span>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{emissao.codigo}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">{emissao.nome}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{emissao.tipo}</Badge>
              <StatusBadge status={emissao.status} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportEmissaoToPDF(emissao)}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(emissao)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <Tabs defaultValue="geral" className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="geral" className="gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="partes" className="gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Partes</span>
            </TabsTrigger>
            <TabsTrigger value="series" className="gap-1">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Séries</span>
            </TabsTrigger>
            <TabsTrigger value="pendencias" className="gap-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Pend.</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-280px)] mt-4">
            <TabsContent value="geral" className="mt-0 space-y-1">
              <InfoRow label="Código" value={emissao.codigo} />
              <InfoRow label="Nome" value={emissao.nome} />
              <InfoRow label="Tipo" value={emissao.tipo} />
              <InfoRow label="Status" value={STATUS_LABELS[emissao.status]} />
              <Separator className="my-2" />
              <InfoRow label="Valor Total" value={formatCurrency(emissao.valor_total)} />
              <InfoRow label="Valor Captado" value={formatCurrency(emissao.valor_captado)} />
              <Separator className="my-2" />
              <InfoRow label="Data de Emissão" value={formatDate(emissao.data_emissao)} />
              <InfoRow label="Data de Registro" value={formatDate(emissao.data_registro)} />
              <InfoRow label="Data de Vencimento" value={formatDate(emissao.data_vencimento)} />
              <Separator className="my-2" />
              <InfoRow label="Registro CVM" value={emissao.numero_registro_cvm} />
              <InfoRow label="Oferta Pública" value={emissao.oferta_publica ? 'Sim' : 'Não'} />
              <InfoRow label="Esforços Restritos" value={emissao.esforcos_restritos ? 'Sim' : 'Não'} />
              <Separator className="my-2" />
              <InfoRow label="Tipo de Lastro" value={emissao.tipo_lastro} />
              <InfoRow label="Descrição do Lastro" value={emissao.descricao_lastro} />
            </TabsContent>

            <TabsContent value="partes" className="mt-0 space-y-1">
              <InfoRow label="Originador" value={emissao.originador} />
              <InfoRow label="Cedente" value={emissao.cedente} />
              <InfoRow label="Servicer" value={emissao.servicer} />
              <Separator className="my-2" />
              <InfoRow label="Custodiante" value={emissao.custodiante} />
              <InfoRow label="Escriturador" value={emissao.escriturador} />
              <InfoRow label="Coordenador Líder" value={emissao.coordenador_lider} />
              <Separator className="my-2" />
              <InfoRow label="Agente Fiduciário" value={emissao.agente_fiduciario} />
              <InfoRow label="Assessor Legal Emissor" value={emissao.assessor_legal_emissor} />
              <InfoRow label="Assessor Legal Coordenador" value={emissao.assessor_legal_coordenador} />
              <Separator className="my-2" />
              <InfoRow label="Auditor" value={emissao.auditor} />
              <InfoRow label="Agência de Rating" value={emissao.agencia_rating} />
            </TabsContent>

            <TabsContent value="series" className="mt-0">
              {emissao.series.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma série cadastrada.
                </p>
              ) : (
                <div className="space-y-4">
                  {emissao.series.map((serie, index) => (
                    <div key={serie.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{serie.numero}</h4>
                        {serie.rating && (
                          <Badge variant="outline">{serie.rating}</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Valor Nominal:</span>
                          <p className="font-medium">{formatCurrency(serie.valor_nominal)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quantidade:</span>
                          <p className="font-medium">{serie.quantidade_titulos}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Taxa:</span>
                          <p className="font-medium">
                            {formatPercent(serie.taxa_juros)} {serie.indexador && `+ ${serie.indexador}`}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vencimento:</span>
                          <p className="font-medium">{formatDate(serie.data_vencimento)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Periodicidade:</span>
                          <p className="font-medium capitalize">{serie.periodicidade_juros}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Amortização:</span>
                          <p className="font-medium capitalize">{serie.amortizacao}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pendencias" className="mt-0">
              {!emissao.pendencias_count || emissao.pendencias_count === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma pendência associada.
                </p>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                  <p className="text-lg font-medium">
                    {emissao.pendencias_count} pendência(s)
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Acesse a seção de Pendências para mais detalhes
                  </p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
