import * as XLSX from 'xlsx-js-style';
import type { WorkBook, WorkSheet } from 'xlsx-js-style';
import type { CostItem } from '@/components/estruturacao/tabs/despesas/CostRow';

function downloadWorkbook(wb: WorkBook, filename: string) {
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const COLS = ['Despesas', 'Agente', 'Base de Cálculo', 'Valor Líquido', 'Alíquota', 'Valor Bruto'];

const COLORS = {
  green: '0B3B2E', // verde escuro (print)
  headerGray: 'F3F4F6',
  border: 'D1D5DB',
};

function styleFill(rgb: string) {
  return { patternType: 'solid', fgColor: { rgb } } as const;
}

const styles = {
  titleBar: {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
    fill: styleFill(COLORS.green),
    alignment: { horizontal: 'center', vertical: 'center' },
  } as const,
  sectionBar: {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
    fill: styleFill(COLORS.green),
    alignment: { horizontal: 'center', vertical: 'center' },
  } as const,
  tableHeader: {
    font: { bold: true, color: { rgb: '111827' }, sz: 10 },
    fill: styleFill(COLORS.headerGray),
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: COLORS.border } },
      bottom: { style: 'thin', color: { rgb: COLORS.border } },
      left: { style: 'thin', color: { rgb: COLORS.border } },
      right: { style: 'thin', color: { rgb: COLORS.border } },
    },
  } as const,
  cell: {
    font: { color: { rgb: '111827' }, sz: 10 },
    alignment: { vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: COLORS.border } },
      bottom: { style: 'thin', color: { rgb: COLORS.border } },
      left: { style: 'thin', color: { rgb: COLORS.border } },
      right: { style: 'thin', color: { rgb: COLORS.border } },
    },
  } as const,
  num: {
    font: { color: { rgb: '111827' }, sz: 10 },
    alignment: { vertical: 'center', horizontal: 'right' },
    border: {
      top: { style: 'thin', color: { rgb: COLORS.border } },
      bottom: { style: 'thin', color: { rgb: COLORS.border } },
      left: { style: 'thin', color: { rgb: COLORS.border } },
      right: { style: 'thin', color: { rgb: COLORS.border } },
    },
  } as const,
  totalRow: {
    font: { bold: true, color: { rgb: '111827' }, sz: 10 },
    fill: styleFill('FAFAFA'),
    border: {
      top: { style: 'thin', color: { rgb: COLORS.border } },
      bottom: { style: 'thin', color: { rgb: COLORS.border } },
      left: { style: 'thin', color: { rgb: COLORS.border } },
      right: { style: 'thin', color: { rgb: COLORS.border } },
    },
  } as const,
};

function mapRow(item: CostItem) {
  const base = item.tipo === 'input' ? 'Fixo' : item.tipo === 'calculado' ? 'Percentual' : 'Auto';
  const aliquota = item.grossUp ?? 0;
  return {
    despesas: item.papel || item.prestador,
    agente: item.prestador,
    base,
    valorLiquido: item.valor ?? 0,
    aliquota,
    valorBruto: item.valorBruto ?? 0,
  };
}

function setCell(ws: WorkSheet, r: number, c: number, v: any, s?: any, z?: string) {
  const addr = XLSX.utils.encode_cell({ r, c });
  ws[addr] = { t: typeof v === 'number' ? 'n' : 's', v, s, z } as any;
}

function merge(ws: WorkSheet, r0: number, c0: number, r1: number, c1: number) {
  ws['!merges'] = ws['!merges'] || [];
  (ws['!merges'] as any[]).push({ s: { r: r0, c: c0 }, e: { r: r1, c: c1 } });
}

function section(ws: WorkSheet, startRow: number, title: string, items: CostItem[]) {
  let r = startRow;

  // section title bar (merge A..F)
  setCell(ws, r, 0, title, styles.sectionBar);
  for (let c = 1; c <= 5; c++) setCell(ws, r, c, '', styles.sectionBar);
  merge(ws, r, 0, r, 5);
  r++;

  // header row
  COLS.forEach((h, idx) => setCell(ws, r, idx, h, styles.tableHeader));
  r++;

  const mapped = items.map(mapRow);
  mapped.forEach((m) => {
    setCell(ws, r, 0, m.despesas, styles.cell);
    setCell(ws, r, 1, m.agente, styles.cell);
    setCell(ws, r, 2, m.base, styles.cell);
    setCell(ws, r, 3, m.valorLiquido, styles.num, 'R$ #,##0.00');
    setCell(ws, r, 4, m.aliquota / 100, styles.num, '0.00%');
    setCell(ws, r, 5, m.valorBruto, styles.num, 'R$ #,##0.00');
    r++;
  });

  const totalLiquido = mapped.reduce((s, i) => s + i.valorLiquido, 0);
  const totalBruto = mapped.reduce((s, i) => s + i.valorBruto, 0);

  // total row
  setCell(ws, r, 0, 'Total', styles.totalRow);
  setCell(ws, r, 1, '', styles.totalRow);
  setCell(ws, r, 2, '', styles.totalRow);
  setCell(ws, r, 3, totalLiquido, styles.totalRow, 'R$ #,##0.00');
  setCell(ws, r, 4, '', styles.totalRow);
  setCell(ws, r, 5, totalBruto, styles.totalRow, 'R$ #,##0.00');
  r += 2; // blank line

  return r;
}

export function exportDespesasLayoutToExcel(params: {
  numeroEmissao: string;
  volumeEmissao: number;
  upfront: CostItem[];
  anual: CostItem[];
  mensal: CostItem[];
}) {
  const { numeroEmissao, volumeEmissao, upfront, anual, mensal } = params;

  const ws: WorkSheet = {} as any;

  // column widths close to the screenshot
  (ws as any)['!cols'] = [
    { wch: 30 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
  ];

  let r = 0;

  // top title bar: "Volume da Emissão" + value
  setCell(ws, r, 0, 'Volume da Emissão', styles.titleBar);
  setCell(ws, r, 1, volumeEmissao, styles.titleBar, 'R$ #,##0.00');
  for (let c = 2; c <= 5; c++) setCell(ws, r, c, '', styles.titleBar);
  merge(ws, r, 0, r, 4);
  r += 2;

  r = section(ws, r, 'DESPESAS FLAT - Up front', upfront);
  r = section(ws, r, 'DESPESAS ANUAIS', anual);
  r = section(ws, r, 'DESPESAS MENSAIS', mensal);

  // set sheet range
  const endRow = Math.max(r - 1, 0);
  (ws as any)['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: endRow, c: 5 } });

  const wb: WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Despesas');

  downloadWorkbook(wb, `${numeroEmissao}_despesas.xlsx`);
}
