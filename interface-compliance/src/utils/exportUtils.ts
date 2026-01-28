import { Emissao, Pendencia } from '@/types';
import { formatCurrency, formatDate } from './formatters';

export function exportToCSV<T>(
  data: T[],
  columns: { key: keyof T; header: string; formatter?: (value: unknown) => string }[],
  filename: string
): void {
  const headers = columns.map(col => col.header).join(',');
  
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key];
      const formatted = col.formatter ? col.formatter(value) : String(value ?? '');
      // Escape quotes and wrap in quotes if contains comma
      const escaped = formatted.replace(/"/g, '""');
      return escaped.includes(',') || escaped.includes('\n') ? `"${escaped}"` : escaped;
    }).join(',');
  });
  
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportEmissoesToCSV(emissoes: Emissao[], filename = 'emissoes'): void {
  exportToCSV(emissoes, [
    { key: 'codigo', header: 'Código' },
    { key: 'nome', header: 'Nome' },
    { key: 'tipo', header: 'Tipo' },
    { key: 'status', header: 'Status' },
    { key: 'originador', header: 'Originador' },
    { key: 'valor_total', header: 'Valor Total', formatter: (v) => formatCurrency(v as number) },
    { key: 'data_emissao', header: 'Data Emissão', formatter: (v) => formatDate(v as string) },
    { key: 'data_vencimento', header: 'Data Vencimento', formatter: (v) => formatDate(v as string) },
  ], filename);
}

export function exportPendenciasToCSV(pendencias: Pendencia[], filename = 'pendencias'): void {
  exportToCSV(pendencias, [
    { key: 'emissao_codigo', header: 'Emissão' },
    { key: 'titulo', header: 'Título' },
    { key: 'status', header: 'Status' },
    { key: 'prioridade', header: 'Prioridade' },
    { key: 'categoria', header: 'Categoria' },
    { key: 'responsavel', header: 'Responsável' },
    { key: 'data_limite', header: 'Data Limite', formatter: (v) => formatDate(v as string) },
  ], filename);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
