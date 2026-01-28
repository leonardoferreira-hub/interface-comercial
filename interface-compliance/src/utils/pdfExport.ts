import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Emissao, STATUS_LABELS } from '@/types';
import { formatCurrency, formatDate } from './formatters';

export function exportEmissaoToPDF(emissao: Emissao): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text('Relatório de Emissão', 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
  
  // Linha separadora
  doc.setDrawColor(200);
  doc.line(14, 35, 196, 35);
  
  // Informações básicas
  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text('Informações Gerais', 14, 45);
  
  autoTable(doc, {
    startY: 50,
    head: [],
    body: [
      ['Código', emissao.codigo],
      ['Nome', emissao.nome],
      ['Tipo', emissao.tipo],
      ['Status', STATUS_LABELS[emissao.status]],
      ['Originador', emissao.originador],
      ['Valor Total', formatCurrency(emissao.valor_total)],
      ['Data de Emissão', formatDate(emissao.data_emissao)],
      ['Data de Vencimento', formatDate(emissao.data_vencimento)],
    ],
    theme: 'grid',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 130 },
    },
  });
  
  // Séries
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  
  doc.setFontSize(14);
  doc.text('Séries', 14, finalY);
  
  autoTable(doc, {
    startY: finalY + 5,
    head: [['Série', 'Valor Nominal', 'Taxa', 'Indexador', 'Vencimento']],
    body: emissao.series.map(serie => [
      serie.numero,
      formatCurrency(serie.valor_nominal),
      `${serie.taxa_juros.toFixed(2)}%`,
      serie.indexador || '-',
      formatDate(serie.data_vencimento),
    ]),
    theme: 'striped',
    styles: { fontSize: 9 },
  });
  
  // Partes envolvidas
  const finalY2 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  
  if (finalY2 < 250) {
    doc.setFontSize(14);
    doc.text('Partes Envolvidas', 14, finalY2);
    
    autoTable(doc, {
      startY: finalY2 + 5,
      head: [],
      body: [
        ['Cedente', emissao.cedente || '-'],
        ['Servicer', emissao.servicer || '-'],
        ['Custodiante', emissao.custodiante || '-'],
        ['Escriturador', emissao.escriturador || '-'],
        ['Coordenador Líder', emissao.coordenador_lider || '-'],
        ['Agente Fiduciário', emissao.agente_fiduciario || '-'],
      ],
      theme: 'grid',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 130 },
      },
    });
  }
  
  // Salvar
  doc.save(`${emissao.codigo}_relatorio.pdf`);
}

export function exportEmissoesListToPDF(emissoes: Emissao[], titulo = 'Lista de Emissões'): void {
  const doc = new jsPDF('landscape');
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text(titulo, 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Total: ${emissoes.length} emissões | Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
  
  // Tabela
  autoTable(doc, {
    startY: 38,
    head: [['Código', 'Nome', 'Tipo', 'Status', 'Originador', 'Valor Total', 'Emissão', 'Vencimento']],
    body: emissoes.map(e => [
      e.codigo,
      e.nome.length > 30 ? e.nome.substring(0, 30) + '...' : e.nome,
      e.tipo,
      STATUS_LABELS[e.status],
      e.originador,
      formatCurrency(e.valor_total),
      formatDate(e.data_emissao),
      formatDate(e.data_vencimento),
    ]),
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  doc.save(`${titulo.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}
