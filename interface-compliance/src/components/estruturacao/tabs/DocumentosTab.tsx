import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  ExternalLink, 
  MoreVertical,
  FileUp
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDocumentosEmissao, useUpdateDocumentoStatus, useDeleteDocumento } from '@/hooks/useDocumentosEmissao';
import { 
  STATUS_DOCUMENTO_LABELS, 
  STATUS_DOCUMENTO_COLORS,
  TIPO_DOCUMENTO_LABELS,
  type StatusDocumento 
} from '@/types/estruturacao';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DocumentosTabProps {
  idEmissao: string;
}

export function DocumentosTab({ idEmissao }: DocumentosTabProps) {
  const { data: documentos, isLoading } = useDocumentosEmissao(idEmissao);
  const updateStatus = useUpdateDocumentoStatus();
  const deleteDocumento = useDeleteDocumento();

  const handleStatusChange = (id: string, status: StatusDocumento) => {
    updateStatus.mutate(
      { id, status, idEmissao },
      {
        onSuccess: () => toast.success('Status atualizado'),
        onError: () => toast.error('Erro ao atualizar status'),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteDocumento.mutate(
      { id, idEmissao },
      {
        onSuccess: () => toast.success('Documento removido'),
        onError: () => toast.error('Erro ao remover documento'),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Documentos</h3>
          <p className="text-sm text-muted-foreground">
            {documentos?.length || 0} documento(s)
          </p>
        </div>
        <Button size="sm" disabled>
          <Plus className="h-4 w-4 mr-2" />
          Novo Documento
        </Button>
      </div>

      {!documentos || documentos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum documento cadastrado.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Configure o Supabase Storage para habilitar upload.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documentos.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium">{doc.nome_documento}</h4>
                      <p className="text-sm text-muted-foreground">
                        {TIPO_DOCUMENTO_LABELS[doc.tipo_documento] || doc.tipo_documento}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant="outline" 
                          className={cn(STATUS_DOCUMENTO_COLORS[doc.status])}
                        >
                          {STATUS_DOCUMENTO_LABELS[doc.status]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          v{doc.versao}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={doc.url_documento} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(doc.id, 'pendente')}>
                          Marcar como Pendente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(doc.id, 'em_revisao')}>
                          Marcar como Em Revisão
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(doc.id, 'aprovado')}>
                          Marcar como Aprovado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(doc.id, 'rejeitado')}>
                          Marcar como Rejeitado
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(doc.id)}
                          className="text-destructive"
                        >
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
