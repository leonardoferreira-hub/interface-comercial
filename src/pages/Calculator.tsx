import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { NavigationTabs } from '@/components/NavigationTabs';
import { StepIndicator } from '@/components/calculator/StepIndicator';
import { Step1BasicData, type EmissaoData } from '@/components/calculator/Step1BasicData';
import { Step2CostsProviders, type CostsData, type CostItem } from '@/components/calculator/Step2CostsProviders';
import { criarEmissao, atualizarEmissao, salvarCustos, fetchCustosPorCombinacao, detalhesEmissao } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Função para transformar custos da API para o formato do Step2
function transformCustosToStep2Format(apiResponse: any): CostsData {
  const custos = apiResponse?.data?.custos || [];
  
  const upfront: CostItem[] = [];
  const anual: CostItem[] = [];
  const mensal: CostItem[] = [];

  custos.forEach((custo: any, index: number) => {
    // Normalizar gross_up: se <= 1, é decimal (0.1215), converter para percentual (12.15)
    // Se > 1, já está em percentual
    const rawGrossUp = custo.gross_up || 0;
    const grossUpPercent = rawGrossUp <= 1 ? rawGrossUp * 100 : rawGrossUp;
    
    // Função para calcular valor bruto a partir do valor líquido
    const calcularValorBruto = (valorLiquido: number, grossUp: number) => {
      const grossUpDecimal = grossUp / 100;
      if (grossUpDecimal >= 1) return valorLiquido;
      return valorLiquido / (1 - grossUpDecimal);
    };

    const valorUpfront = custo.valor_upfront_calculado || custo.preco_upfront || 0;
    const valorRecorrente = custo.valor_recorrente_calculado || custo.preco_recorrente || 0;

    const periodicidade = custo.periodicidade?.toLowerCase() || '';
    const temUpfront = valorUpfront > 0;
    const temRecorrente = valorRecorrente > 0;

    // Adicionar item upfront se tiver valor
    if (temUpfront) {
      upfront.push({
        id: custo.id || `custo-${index}`,
        prestador: custo.prestador_nome || custo.papel || 'Não especificado',
        valor: valorUpfront,
        grossUp: grossUpPercent,
        valorBruto: calcularValorBruto(valorUpfront, grossUpPercent),
        tipo: custo.tipo_preco === 'percentual' ? 'calculado' : 'auto',
        id_prestador: custo.id_prestador || null,
        papel: custo.papel,
      });
    }

    // Adicionar item recorrente baseado na periodicidade
    if (temRecorrente) {
      const itemRecorrente: CostItem = {
        id: `${custo.id || `custo-${index}`}-rec`,
        prestador: custo.prestador_nome || custo.papel || 'Não especificado',
        valor: valorRecorrente,
        grossUp: grossUpPercent,
        valorBruto: calcularValorBruto(valorRecorrente, grossUpPercent),
        tipo: custo.tipo_preco === 'percentual' ? 'calculado' : 'auto',
        id_prestador: custo.id_prestador || null,
        papel: custo.papel,
      };

      if (periodicidade === 'mensal') {
        mensal.push(itemRecorrente);
      } else if (periodicidade === 'anual') {
        anual.push(itemRecorrente);
      } else {
        anual.push(itemRecorrente);
      }
    }
  });

  return { upfront, anual, mensal };
}

// Custos default vazios
const emptyCostsData: CostsData = {
  upfront: [],
  anual: [],
  mensal: [],
};

// Transform costs from DB format to Step2 format
function transformCustosFromDB(custosLinhas: any[]): CostsData {
  const upfront: CostItem[] = [];
  const anual: CostItem[] = [];
  const mensal: CostItem[] = [];

  custosLinhas.forEach((linha: any, index: number) => {
    const grossUpPercent = linha.gross_up ? (linha.gross_up <= 1 ? linha.gross_up * 100 : linha.gross_up) : 0;

    if (linha.preco_upfront > 0) {
      upfront.push({
        id: linha.id || `db-${index}`,
        prestador: linha.papel || 'Não especificado',
        valor: linha.preco_upfront,
        grossUp: grossUpPercent,
        valorBruto: linha.valor_upfront_bruto || linha.preco_upfront,
        tipo: linha.tipo_preco === 'percentual' ? 'calculado' : 'auto',
        id_prestador: linha.id_prestador || null,
        papel: linha.papel,
      });
    }

    if (linha.preco_recorrente > 0) {
      const item: CostItem = {
        id: `${linha.id || `db-${index}`}-rec`,
        prestador: linha.papel || 'Não especificado',
        valor: linha.preco_recorrente,
        grossUp: grossUpPercent,
        valorBruto: linha.valor_recorrente_bruto || linha.preco_recorrente,
        tipo: linha.tipo_preco === 'percentual' ? 'calculado' : 'auto',
        id_prestador: linha.id_prestador || null,
        papel: linha.papel,
      };

      if (linha.periodicidade === 'mensal') {
        mensal.push(item);
      } else {
        anual.push(item);
      }
    }
  });

  return { upfront, anual, mensal };
}

export default function Calculator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCosts, setIsFetchingCosts] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

  const [basicData, setBasicData] = useState<EmissaoData>({
    demandante_proposta: '',
    empresa_destinataria: '',
    categoria: '',
    oferta: '',
    veiculo: '',
    lastro: '',
    quantidade_series: '1',
    series: [{ numero: 1, valor_emissao: 0 }],
  });

  const [costsData, setCostsData] = useState<CostsData>(emptyCostsData);

  // Load emission data when editing
  useEffect(() => {
    if (editId) {
      loadEmissaoForEdit(editId);
    }
  }, [editId]);

  const loadEmissaoForEdit = async (id: string) => {
    setIsLoadingEdit(true);
    try {
      console.log('📝 [Calculator] Carregando emissão para edição:', id);
      const result = await detalhesEmissao(id);
      
      if (result?.data) {
        const data = result.data;
        console.log('📝 [Calculator] Dados carregados:', data);
        
        // Populate basic data
        setBasicData({
          demandante_proposta: data.demandante_proposta || '',
          empresa_destinataria: data.empresa_destinataria || '',
          categoria: data.categorias?.codigo || data.categoria || '',
          oferta: data.tipos_oferta?.codigo || data.oferta || '',
          veiculo: data.veiculos?.codigo || data.veiculo || '',
          lastro: data.lastros?.codigo || data.lastro || '',
          quantidade_series: String(data.series?.length || 1),
          series: data.series?.length > 0 
            ? data.series.map((s: any) => ({
                numero: s.numero,
                valor_emissao: s.valor_emissao,
                prazo: s.prazo,
              }))
            : [{ numero: 1, valor_emissao: data.volume || 0 }],
        });
        
        // Populate costs if available
        if (data.custos?.custos_linhas && data.custos.custos_linhas.length > 0) {
          const transformedCosts = transformCustosFromDB(data.custos.custos_linhas);
          console.log('📝 [Calculator] Custos transformados:', transformedCosts);
          setCostsData(transformedCosts);
        }
      }
    } catch (error) {
      console.error('💥 [Calculator] Erro ao carregar emissão:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os dados da emissão.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const validateStep1 = (): string[] => {
    const errors: string[] = [];
    if (!basicData.demandante_proposta.trim()) errors.push('Demandante da Proposta');
    if (!basicData.empresa_destinataria.trim()) errors.push('Empresa Destinatária');
    if (!basicData.categoria) errors.push('Categoria');

    const showLastro = ['CRI', 'CRA'].includes(basicData.categoria);
    const showOfertaVeiculo = ['DEB', 'CR', 'NC'].includes(basicData.categoria);

    if (showLastro && !basicData.lastro) errors.push('Lastro');
    if (showOfertaVeiculo) {
      if (!basicData.oferta) errors.push('Tipo de Oferta');
      if (!basicData.veiculo) errors.push('Veículo');
    }

    const volumeTotal = basicData.series.reduce((sum, s) => sum + (s.valor_emissao || 0), 0);
    if (volumeTotal <= 0) errors.push('Valor das Séries (deve ser maior que zero)');

    return errors;
  };

  const volumeTotal = basicData.series.reduce((sum, s) => sum + (s.valor_emissao || 0), 0);

  const handleNext = async () => {
    if (currentStep === 1) {
      const errors = validateStep1();
      if (errors.length > 0) {
        toast({
          title: 'Campos obrigatórios',
          description: `Preencha: ${errors.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }

      // Buscar custos automaticamente ao avançar para Step 2
      setIsFetchingCosts(true);
      try {
        console.log('🔄 [Calculator] Buscando custos para combinação...');
        
        const custosResponse = await fetchCustosPorCombinacao({
          categoria: basicData.categoria,
          tipo_oferta: basicData.oferta,
          veiculo: basicData.veiculo,
          lastro: basicData.lastro,
          volume: volumeTotal,
          series: basicData.series,
        });

        console.log('📊 [Calculator] Custos recebidos:', custosResponse);

        if (custosResponse?.success && custosResponse?.data?.custos) {
          const transformedCosts = transformCustosToStep2Format(custosResponse);
          console.log('✅ [Calculator] Custos transformados:', transformedCosts);
          setCostsData(transformedCosts);
        } else {
          console.log('⚠️ [Calculator] Nenhum custo encontrado, usando defaults');
          setCostsData(emptyCostsData);
        }
      } catch (error) {
        console.error('💥 [Calculator] Erro ao buscar custos:', error);
        toast({
          title: 'Aviso',
          description: 'Não foi possível buscar os custos. Você pode preencher manualmente.',
          variant: 'default',
        });
        setCostsData(emptyCostsData);
      } finally {
        setIsFetchingCosts(false);
      }
    }

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const validCategories = ['DEB', 'CRA', 'CRI', 'NC', 'CR'] as const;
      const categoria = validCategories.includes(basicData.categoria as any)
        ? (basicData.categoria as 'DEB' | 'CRA' | 'CRI' | 'NC' | 'CR')
        : 'DEB';

      // Build payload with correct fields
      const emissaoPayload = {
        demandante_proposta: basicData.demandante_proposta,
        empresa_destinataria: basicData.empresa_destinataria,
        categoria,
        oferta: basicData.oferta || null,
        veiculo: basicData.veiculo || null,
        lastro: basicData.lastro || null,
        quantidade_series: basicData.series.length,
        series: basicData.series.map(s => ({
          numero: s.numero,
          valor_emissao: s.valor_emissao,
          prazo: s.prazo || null
        }))
      };

      let emissaoId: string;

      // Check if we're editing or creating
      if (editId) {
        console.log('🧾 [Calculator] payload atualizarEmissao:', emissaoPayload);
        const result = await atualizarEmissao(editId, emissaoPayload);
        console.log('🧾 [Calculator] resposta atualizarEmissao:', result);

        if (result?.error) {
          throw new Error(result.error);
        }
        emissaoId = editId;
      } else {
        console.log('🧾 [Calculator] payload criarEmissao:', emissaoPayload);
        const result = await criarEmissao(emissaoPayload);
        console.log('🧾 [Calculator] resposta criarEmissao:', result);

        if (result?.error) {
          throw new Error(result.error);
        }
        emissaoId = result?.data?.id;
      }

      // Save costs from all sections with correct mapping
      const allCosts = [
        ...costsData.upfront.map((c) => ({
          papel: c.papel || c.prestador,
          id_prestador: c.id_prestador || null,
          tipo_preco: c.tipo === 'calculado' ? 'percentual' : 'fixo',
          preco_upfront: c.valor,
          preco_recorrente: 0,
          periodicidade: null,
          gross_up: (c.grossUp || 0) / 100,
          valor_upfront_bruto: c.valorBruto,
          valor_recorrente_bruto: 0,
        })),
        ...costsData.anual.map((c) => ({
          papel: c.papel || c.prestador,
          id_prestador: c.id_prestador || null,
          tipo_preco: c.tipo === 'calculado' ? 'percentual' : 'fixo',
          preco_upfront: 0,
          preco_recorrente: c.valor,
          periodicidade: 'anual',
          gross_up: (c.grossUp || 0) / 100,
          valor_upfront_bruto: 0,
          valor_recorrente_bruto: c.valorBruto,
        })),
        ...costsData.mensal.map((c) => ({
          papel: c.papel || c.prestador,
          id_prestador: c.id_prestador || null,
          tipo_preco: c.tipo === 'calculado' ? 'percentual' : 'fixo',
          preco_upfront: 0,
          preco_recorrente: c.valor,
          periodicidade: 'mensal',
          gross_up: (c.grossUp || 0) / 100,
          valor_upfront_bruto: 0,
          valor_recorrente_bruto: c.valorBruto,
        })),
      ].filter((c) => c.preco_upfront > 0 || c.preco_recorrente > 0);

      // Calcular totais para salvar
      const totalUpfront = costsData.upfront.reduce((sum, item) => sum + item.valorBruto, 0);
      const totalAnual = costsData.anual.reduce((sum, item) => sum + item.valorBruto, 0);
      const totalMensal = costsData.mensal.reduce((sum, item) => sum + item.valorBruto, 0);
      const custoPrimeiroAno = totalUpfront + totalAnual + (totalMensal * 12);
      const custoAnosSubsequentes = totalAnual + (totalMensal * 12);

      const totais = {
        total_upfront: totalUpfront,
        total_anual: totalAnual,
        total_mensal: totalMensal,
        total_primeiro_ano: custoPrimeiroAno,
        total_anos_subsequentes: custoAnosSubsequentes,
      };

      // Extrair custos por série
      const custosSeries: Array<{ numero: number; registro_b3: number; custodia_b3: number }> = [];
      const custoRegistroB3 = costsData.upfront.find(c => c.prestador === 'Registro B3' || c.papel === 'Registro B3');
      const custoCustodiaB3 = costsData.upfront.find(c => c.prestador === 'Custódia B3' || c.papel === 'Custódia B3');
      const volumeTotal = basicData.series.reduce((sum, s) => sum + (s.valor_emissao || 0), 0);
      
      if (basicData.series && basicData.series.length > 0) {
        basicData.series.forEach((serie) => {
          const proporcao = volumeTotal > 0 ? (serie.valor_emissao || 0) / volumeTotal : 0;
          custosSeries.push({
            numero: serie.numero,
            registro_b3: custoRegistroB3 ? custoRegistroB3.valorBruto * proporcao : 0,
            custodia_b3: custoCustodiaB3 ? custoCustodiaB3.valorBruto * proporcao : 0,
          });
        });
      }

      if (emissaoId) {
        const salvarResult = await salvarCustos(emissaoId, allCosts, totais, custosSeries);
        if (salvarResult?.error) {
          throw new Error(salvarResult.error);
        }
      }

      toast({
        title: 'Cotação salva!',
        description: editId ? 'Emissão atualizada com sucesso.' : 'Emissão criada com sucesso.',
      });

      navigate('/');
    } catch (error) {
      console.error('💥 [Calculator] erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NavigationTabs />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            {editId ? 'Editar Cotação' : 'Nova Cotação'}
          </h2>
          <p className="text-muted-foreground">
            Preencha os dados para {editId ? 'atualizar' : 'criar'} a cotação
          </p>
        </div>

        <StepIndicator currentStep={currentStep} totalSteps={2} />

        <div className="animate-fade-in">
          {currentStep === 1 && (
            <Step1BasicData data={basicData} onChange={setBasicData} />
          )}
          {currentStep === 2 && (
            <Step2CostsProviders
              costsData={costsData}
              volume={volumeTotal}
              onChange={setCostsData}
            />
          )}
        </div>

        <div className="flex items-center justify-between mt-8">
          <Button variant="outline" onClick={handleBack} disabled={isFetchingCosts || isLoading}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </Button>

          <div className="flex items-center gap-3">
            {currentStep === 2 && (
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Salvando...' : 'Salvar Cotação'}
              </Button>
            )}
            {currentStep < 2 && (
              <Button onClick={handleNext} disabled={isFetchingCosts}>
                {isFetchingCosts ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando custos...
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
