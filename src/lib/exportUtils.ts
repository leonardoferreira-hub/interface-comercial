import * as XLSX from 'xlsx';
import type { Emissao } from './supabase';

export function exportToCSV(data: Emissao[], filename: string = 'relatorio') {
  const headers = [
    'Número Emissão',
    'Demandante',
    'Empresa Destinatária',
    'Categoria',
    'Volume',
    'Séries',
    'Status',
    'Data Criação',
  ];

  const rows = data.map((e) => [
    e.numero_emissao,
    e.demandante_proposta,
    e.empresa_destinataria || '',
    e.categoria,
    e.volume,
    e.quantidade_series || 1,
    e.status_proposta,
    new Date(e.data_criacao).toLocaleDateString('pt-BR'),
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map((row) => row.join(';')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

export function exportToXLSX(data: Emissao[], filename: string = 'relatorio') {
  const worksheetData = [
    ['Número Emissão', 'Demandante', 'Empresa Destinatária', 'Categoria', 'Volume', 'Séries', 'Status', 'Data Criação'],
    ...data.map((e) => [
      e.numero_emissao,
      e.demandante_proposta,
      e.empresa_destinataria || '',
      e.categoria,
      e.volume,
      e.quantidade_series || 1,
      e.status_proposta,
      new Date(e.data_criacao).toLocaleDateString('pt-BR'),
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // Número Emissão
    { wch: 25 }, // Demandante
    { wch: 25 }, // Empresa
    { wch: 10 }, // Categoria
    { wch: 15 }, // Volume
    { wch: 8 },  // Séries
    { wch: 15 }, // Status
    { wch: 12 }, // Data
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Emissões');
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
