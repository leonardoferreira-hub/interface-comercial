import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Trash2,
  FileCheck,
  FileSearch,
  FileSpreadsheet,
} from 'lucide-react';
import {
  useDocumentosInvestidor,
  useUploadDocumentoInvestidor,
  useValidarDocumentoInvestidor,
  useRemoverDocumentoInvestidor,
  type TipoDocumentoInvestidor,
} from '@/hooks/useInvestidorDocumentos';
import { toast } from 'sonner';

interface InvestidorDocumentosProps {
  idInvestidor: string;
  isCompliance?: boolean;
}

const documentoConfig: Record<
  TipoDocumentoInvestidor,
  { label: string; icon: typeof FileText; required: boolean }
> = {
  kyc: { label: 'KYC (Know Your Customer)', icon: FileCheck, required: true },
  suitability: { label: 'Suitability', icon: FileSearch, required: true },
  ficha_cadastral: { label: 'Ficha Cadastral', icon: FileSpreadsheet, required: true },
  outros: { label: 'Outros', icon: FileText, required: false },
};

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  aprovado: { label: 'Aprovado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejeitado: { label: 'Rejeitado', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export function InvestidorDocumentos({ idInvestidor, isCompliance = false }: InvestidorDocumentosProps) {
  const { data: documentos, isLoading } = useDocumentosInvestidor(idInvestidor);
  const uploadDoc = useUploadDocumentoInvestidor();
  const validarDoc = useValidarDocumentoInvestidor();
  const removerDoc = useRemoverDocumentoInvestidor();

  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [validandoId, setValidandoId] = useState<string | null>(null);
  const [observacaoValidacao, setObservacaoValidacao] = useState('');

  const handleFileSelect = async (tipo: TipoDocumentoInvestidor, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx: 10MB)');
      return;
    }

    setUploading((prev) => ({ ...prev, [tipo]: true }));

    try {
      // Upload para Supabase Storage
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const fileExt = file.name.split('.').pop();
      const fileName = `${idInvestidor}/${tipo}_${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('Investidores')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('Investidores').getPublicUrl(fileName);

      await uploadDoc.mutateAsync({
        id_investidor: idInvestidor,
        tipo_documento: tipo,
        nome_arquivo: file.name,
        url_arquivo: urlData.publicUrl,
        mime_type: file.type,
        tamanho_bytes: file.size,
      });
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao fazer upload');
    } finally {
      setUploading((prev) => ({ ...prev, [tipo]: false }));
    }
  };

  const handleValidar = async (docId: string, status: 'aprovado' | 'rejeitado') => {
    if (status === 'rejeitado' && validandoId !== docId) {
      setValidandoId(docId);
      setObservacaoValidacao('');
      return;
    }

    await validarDoc.mutateAsync({
      id: docId,
      id_investidor: idInvestidor,
      status,
      observacoes: status === 'rejeitado' ? observacaoValidacao : undefined,
    });

    setValidandoId(null);
    setObservacaoValidacao('');
  };

  const handleRemover = async (docId: string) => {
    if (!confirm('Remover este documento?')) return;
    await removerDoc.mutateAsync({ id: docId, id_investidor: idInvestidor });
  };

  const documentosPorTipo = documentos?.reduce(
    (acc, doc) => {
      acc[doc.tipo_documento] = doc;
      return acc;
    },
    {} as Record<string, (typeof documentos)[0]>
  );

  const tiposObrigatorios: TipoDocumentoInvestidor[] = ['kyc', 'suitability', 'ficha_cadastral'];

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Documentos do Investidor</h4>
        <div className="text-xs text-muted-foreground">
          {tiposObrigatorios.filter((t) => documentosPorTipo?.[t]?.status === 'aprovado').length} /{' '}
          {tiposObrigatorios.length} aprovados
        </div>
      </div>

      <div className="space-y-3">
        {tiposObrigatorios.map((tipo) => {
          const config = documentoConfig[tipo];
          const Icon = config.icon;
          const doc = documentosPorTipo?.[tipo];

          return (
            <Card key={tipo} className={doc?.status === 'aprovado' ? 'border-green-200' : ''}>
              <CardContent className="py-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{config.label}</span>
                      {config.required && (
                        <span className="text-xs text-red-500">*</span>
                      )}
                    </div>

                    {doc ? (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <Badge className={statusConfig[doc.status].color} variant="outline">
                            {statusConfig[doc.status].label}
                          </Badge>
                          <span className="text-muted-foreground truncate">{doc.nome_arquivo}</span>
                        </div>

                        {doc.observacoes && (
                          <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            {doc.observacoes}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => window.open(doc.url_arquivo, '_blank')}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Baixar
                          </Button>

                          {isCompliance && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-green-600"
                                onClick={() => handleValidar(doc.id, 'aprovado')}
                                disabled={doc.status === 'aprovado'}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-red-600"
                                onClick={() => handleValidar(doc.id, 'rejeitado')}
                                disabled={doc.status === 'rejeitado'}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Rejeitar
                              </Button>
                            </>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => handleRemover(doc.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Campo de observação para rejeição */}
                        {validandoId === doc.id && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <Label className="text-xs text-red-700">Motivo da rejeição</Label>
                            <Textarea
                              value={observacaoValidacao}
                              onChange={(e) => setObservacaoValidacao(e.target.value)}
                              placeholder="Informe o motivo..."
                              className="mt-1 text-xs min-h-[60px]"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs"
                                onClick={() => {
                                  setValidandoId(null);
                                  setObservacaoValidacao('');
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-6 text-xs"
                                disabled={!observacaoValidacao.trim()}
                                onClick={() => handleValidar(doc.id, 'rejeitado')}
                              >
                                Confirmar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileSelect(tipo, file);
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled={uploading[tipo]}
                            asChild
                          >
                            <span>
                              {uploading[tipo] ? (
                                <>
                                  <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full mr-1" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-3 w-3 mr-1" />
                                  Enviar
                                </>
                              )}
                            </span>
                          </Button>
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOC, JPG (máx: 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
