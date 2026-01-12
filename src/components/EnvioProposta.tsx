import { useState, useEffect } from 'react';
import { Search, FileText, Loader2, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { buscarCnpj, atualizarDadosEmpresa, gerarPDF } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface EnvioPropostaProps {
  emissaoId: string;
  dadosIniciais?: {
    empresa_cnpj?: string;
    empresa_razao_social?: string;
    empresa_endereco?: string;
    contato_nome?: string;
    contato_email?: string;
  };
  onSuccess?: (pdfHtml: string) => void;
  onCancel?: () => void;
}

// CNPJ Mask helper
const formatCnpj = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

// Email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function EnvioProposta({ emissaoId, dadosIniciais, onSuccess, onCancel }: EnvioPropostaProps) {
  const { toast } = useToast();
  
  // Form states
  const [cnpj, setCnpj] = useState(dadosIniciais?.empresa_cnpj || '');
  const [razaoSocial, setRazaoSocial] = useState(dadosIniciais?.empresa_razao_social || '');
  const [endereco, setEndereco] = useState(dadosIniciais?.empresa_endereco || '');
  const [nome, setNome] = useState(dadosIniciais?.contato_nome || '');
  const [email, setEmail] = useState(dadosIniciais?.contato_email || '');
  
  // UI states
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cnpjBuscado, setCnpjBuscado] = useState(false);
  const [camposManuais, setCamposManuais] = useState(false);
  const [error, setError] = useState('');
  const [searchSuccess, setSearchSuccess] = useState(false);

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});

  // If initial data has razaoSocial, enable fields
  useEffect(() => {
    if (dadosIniciais?.empresa_razao_social) {
      setCnpjBuscado(true);
      setCamposManuais(true);
    }
  }, [dadosIniciais]);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnpj(e.target.value);
    setCnpj(formatted);
    setSearchSuccess(false);
    setError('');
    if (errors.cnpj) {
      setErrors(prev => ({ ...prev, cnpj: '' }));
    }
  };

  const handleBuscarCnpj = async () => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    if (cnpjLimpo.length !== 14) {
      setErrors(prev => ({ ...prev, cnpj: 'CNPJ deve ter 14 dígitos' }));
      return;
    }

    setIsSearching(true);
    setError('');
    setSearchSuccess(false);

    try {
      const result = await buscarCnpj(cnpjLimpo);
      
      if (result.success && result.data) {
        setRazaoSocial(result.data.razao_social || '');
        setEndereco(result.data.endereco || '');
        setCnpj(result.data.cnpj || cnpj);
        setCnpjBuscado(true);
        setCamposManuais(false);
        setSearchSuccess(true);
        
        toast({
          title: 'CNPJ encontrado!',
          description: `${result.data.razao_social}`,
        });
      } else {
        throw new Error(result.error || 'CNPJ não encontrado');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar CNPJ';
      setError(message);
      setCnpjBuscado(true);
      setCamposManuais(true);
      
      toast({
        title: 'CNPJ não encontrado',
        description: 'Preencha os dados manualmente.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      newErrors.cnpj = 'CNPJ deve ter 14 dígitos';
    }

    if (!razaoSocial.trim()) {
      newErrors.razaoSocial = 'Razão Social é obrigatória';
    }

    if (!nome.trim() || nome.trim().length < 3) {
      newErrors.nome = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'E-mail inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGerarProposta = async () => {
    if (!validateForm()) {
      toast({
        title: 'Campos inválidos',
        description: 'Corrija os erros antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // First, update the emission with company data
      const updateResult = await atualizarDadosEmpresa(emissaoId, {
        empresa_cnpj: cnpj,
        empresa_razao_social: razaoSocial,
        empresa_endereco: endereco,
        contato_nome: nome,
        contato_email: email,
      });

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Erro ao salvar dados da empresa');
      }

      // Then generate the PDF
      const pdfResult = await gerarPDF(emissaoId);

      if (pdfResult.success && pdfResult.data?.html) {
        toast({
          title: 'Proposta gerada!',
          description: 'O PDF será aberto em uma nova aba.',
        });

        // Open HTML in new tab
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(pdfResult.data.html);
          newWindow.document.close();
        }

        onSuccess?.(pdfResult.data.html);
      } else {
        throw new Error(pdfResult.error || 'Erro ao gerar PDF');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar proposta';
      setError(message);
      toast({
        title: 'Erro ao gerar proposta',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const camposHabilitados = cnpjBuscado || camposManuais;

  return (
    <Card className="border-0 card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Envio de Proposta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Dados da Empresa */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">DADOS DA EMPRESA</h3>
          
          <div className="space-y-4">
            {/* CNPJ */}
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={handleCnpjChange}
                    className={errors.cnpj ? 'border-destructive' : searchSuccess ? 'border-green-500' : ''}
                  />
                  {searchSuccess && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleBuscarCnpj}
                  disabled={isSearching || cnpj.replace(/\D/g, '').length !== 14}
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>
              {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj}</p>}
            </div>

            {/* Razão Social */}
            <div className="space-y-2">
              <Label htmlFor="razaoSocial">Razão Social *</Label>
              <Input
                id="razaoSocial"
                placeholder="Nome da empresa"
                value={razaoSocial}
                onChange={(e) => {
                  setRazaoSocial(e.target.value);
                  if (errors.razaoSocial) setErrors(prev => ({ ...prev, razaoSocial: '' }));
                }}
                disabled={!camposHabilitados}
                className={errors.razaoSocial ? 'border-destructive' : ''}
              />
              {errors.razaoSocial && <p className="text-sm text-destructive">{errors.razaoSocial}</p>}
              {!camposHabilitados && (
                <p className="text-xs text-muted-foreground">Busque o CNPJ primeiro ou clique em "Preencher manualmente"</p>
              )}
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                placeholder="Endereço completo"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                disabled={!camposHabilitados}
                rows={2}
              />
            </div>

            {!camposHabilitados && (
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sm"
                onClick={() => {
                  setCnpjBuscado(true);
                  setCamposManuais(true);
                }}
              >
                Preencher manualmente
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Dados do Contato */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">DADOS DO CONTATO</h3>
          
          <div className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Nome do contato"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  if (errors.nome) setErrors(prev => ({ ...prev, nome: '' }));
                }}
                className={errors.nome ? 'border-destructive' : ''}
              />
              {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
            </div>

            {/* E-mail */}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@empresa.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button
            type="button"
            onClick={handleGerarProposta}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Proposta em PDF
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
