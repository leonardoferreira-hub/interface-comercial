import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, CheckCircle, XCircle, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { configDocumentos, useDocumentosInvestidor, type TipoDocumentoInvestidor } from '@/hooks/useDocumentosInvestidor';
import { toast } from 'sonner';

interface DocumentosUploadProps {
  investidorId: string;
  isCompliance?: boolean;
}

export function DocumentosUpload({ investidorId, isCompliance = false }: DocumentosUploadProps) {
  const { uploading, fazerUpload, removerDocumento, validarDocumento, configDocumentos } = useDocumentosInvestidor(investidorId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTipo, setSelectedTipo] = useState<TipoDocumentoInvestidor | null>(null);

  const handleFileSelect = async (tipo: TipoDocumentoInvestidor, file: File) => {
    await fazerUpload(tipo, file);
  };

  const tiposObrigatorios: TipoDocumentoInvestidor[] = ['kyc', 'suitability', 'ficha_cadastral'];

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-muted-foreground">Documentos Obrigatórios</h4>
      
      <div className="space-y-3">
        {tiposObrigatorios.map((tipo, index) => {
          const config = configDocumentos[tipo];
          const isUploading = uploading[tipo];

          return (
            <motion.div
              key={tipo}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="p-2 bg-background rounded-lg shadow-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{config.label}</span>
                  <span className="text-xs text-muted-foreground">({config.aceitos.join(', ')})</span>
                </div>
                <p className="text-xs text-muted-foreground">{config.descricao}</p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept={config.aceitos.join(',')}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(tipo, file);
                  }}
                />
                
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <h4 className="text-sm font-medium text-muted-foreground mt-6">Documentos Enviados</h4>
      
      <div className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg">
        Nenhum documento enviado ainda
      </div>
    </div>
  );
}
