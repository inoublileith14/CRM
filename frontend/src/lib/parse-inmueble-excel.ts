import type { Cell, Workbook, Worksheet } from 'exceljs';
import { InmuebleFormData, TipoOperacion } from '@/types/inmueble';
import {
  emptyInmuebleRow,
  parseCell,
  resolveHeaderKey,
  rowHasContent,
} from './inmueble-import-utils';

export interface PendingImage {
  field: 'imagen_real' | 'foto_espejo';
  buffer: Buffer | ArrayBuffer | Uint8Array;
  extension: string;
}

export interface ImportRow {
  data: InmuebleFormData;
  images: PendingImage[];
}

export interface ExcelParseResult {
  rows: ImportRow[];
  totalRows: number;
  totalImages: number;
}

interface ParsedRow {
  excelRow: number;
  data: InmuebleFormData;
  images: PendingImage[];
}

function richTextToString(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const obj = value as Record<string, unknown>;
  if (Array.isArray(obj.richText)) {
    return obj.richText
      .map((part) => (part as { text?: string }).text ?? '')
      .join('');
  }
  if (typeof obj.text === 'string') return obj.text;
  if (typeof obj.text === 'object' && obj.text !== null) {
    return richTextToString(obj.text);
  }
  return '';
}

function coerceToString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.hyperlink === 'string') return obj.hyperlink;
    const fromRich = richTextToString(obj);
    if (fromRich) return fromRich;
    if (typeof obj.text === 'string') return obj.text;
    if (obj.result != null) return String(obj.result);
  }
  const str = String(value);
  return str === '[object Object]' ? '' : str;
}

function readCellText(cell: Cell): string {
  if (cell.value instanceof Date) {
    return cell.value.toISOString().split('T')[0];
  }

  const fromText = coerceToString(cell.text);
  if (fromText.trim()) return fromText.trim();

  if (cell.hyperlink) return cell.hyperlink;

  return coerceToString(cell.value).trim();
}

function normalizeSheetName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function scoreWorksheet(
  worksheet: Worksheet,
  tipoOperacion?: TipoOperacion,
): number {
  const name = normalizeSheetName(worksheet.name);
  let score = 0;

  if (tipoOperacion === 'venta') {
    if (/venta\s*propis/.test(name)) score += 120;
    else if (name.includes('venta') && name.includes('propis')) score += 100;
    else if (name.includes('venta')) score += 50;
    if (
      name.includes('antiguo') ||
      name.includes('vendido') ||
      name.includes('revisar')
    ) {
      score -= 80;
    }
    if (name.includes('alquiler')) score -= 40;
  } else if (tipoOperacion === 'alquiler') {
    if (/alquiler\s*propis|aquiler\s*propis/.test(name)) score += 120;
    else if (name.includes('propis') && name.includes('alquiler')) score += 100;
    else if (name.includes('alquiler') || name.includes('aquiler')) score += 50;
    if (name.includes('antiguo') || name.includes('alquilado')) score -= 80;
    if (name.includes('venta')) score -= 40;
  }

  const columnKeys = buildColumnKeys(worksheet);
  score += columnKeys.filter(Boolean).length * 8;

  let dataRows = 0;
  worksheet.eachRow({ includeEmpty: false }, (_row, rowNumber) => {
    if (rowNumber > 1) dataRows++;
  });
  score += Math.min(dataRows, 80);

  return score;
}

function pickWorksheet(
  workbook: Workbook,
  tipoOperacion?: TipoOperacion,
): Worksheet {
  const sheets = workbook.worksheets.filter((ws) => ws.name);
  if (sheets.length === 0) {
    throw new Error('El archivo Excel no contiene hojas');
  }
  if (sheets.length === 1) return sheets[0];

  let best = sheets[0];
  let bestScore = -Infinity;

  for (const ws of sheets) {
    const score = scoreWorksheet(ws, tipoOperacion);
    if (score > bestScore) {
      bestScore = score;
      best = ws;
    }
  }

  return best;
}

function getMaxDataRow(
  worksheet: Worksheet,
  imageNativeRows: number[],
): number {
  let max = 1;

  worksheet.eachRow({ includeEmpty: false }, (_row, rowNumber) => {
    if (rowNumber > max) max = rowNumber;
  });

  for (const nativeRow of imageNativeRows) {
    max = Math.max(max, nativeRow + 1);
  }

  return max;
}

function buildColumnKeys(worksheet: Worksheet): (keyof InmuebleFormData | null)[] {
  const headerRow = worksheet.getRow(1);
  const columnKeys: (keyof InmuebleFormData | null)[] = [];
  const maxCol = Math.max(worksheet.columnCount, headerRow.cellCount, 20);

  for (let c = 1; c <= maxCol; c++) {
    const cell = headerRow.getCell(c);
    const text = readCellText(cell);
    if (text) {
      columnKeys[c - 1] = resolveHeaderKey(text);
    }
  }

  return columnKeys;
}

function resolveImageField(
  nativeCol: number,
  columnKeys: (keyof InmuebleFormData | null)[],
  imagenCol: number,
  espejoCol: number,
  imageIndexInRow: number,
): 'imagen_real' | 'foto_espejo' | null {
  const headerKey = columnKeys[nativeCol];
  if (headerKey === 'imagen_real' || headerKey === 'foto_espejo') {
    return headerKey;
  }

  if (nativeCol === imagenCol) return 'imagen_real';
  if (nativeCol === espejoCol) return 'foto_espejo';

  if (imagenCol >= 0 && Math.abs(nativeCol - imagenCol) <= 1) return 'imagen_real';
  if (espejoCol >= 0 && Math.abs(nativeCol - espejoCol) <= 1) return 'foto_espejo';

  if (imageIndexInRow === 0) return 'imagen_real';
  if (imageIndexInRow === 1) return 'foto_espejo';

  return null;
}

function getWorkbookImage(
  workbook: import('exceljs').Workbook,
  imageId: number | string,
) {
  try {
    return workbook.getImage(Number(imageId));
  } catch {
    try {
      return workbook.getImage(imageId as number);
    } catch {
      return null;
    }
  }
}

export function extensionToMime(ext: string): string {
  const map: Record<string, string> = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return map[ext.toLowerCase()] ?? 'image/jpeg';
}

export function bufferToFile(
  buffer: Buffer | ArrayBuffer | Uint8Array,
  extension: string,
): File {
  const mime = extensionToMime(extension);
  let bytes: Uint8Array;

  if (buffer instanceof ArrayBuffer) {
    bytes = new Uint8Array(buffer);
  } else if (buffer instanceof Uint8Array) {
    bytes = buffer;
  } else {
    bytes = new Uint8Array(buffer);
  }

  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return new File([copy], `import.${extension}`, { type: mime });
}

export type ExcelParseProgress =
  | { phase: 'reading' }
  | { phase: 'saving'; current: number; total: number };

export interface ParseInmuebleExcelOptions {
  tipoOperacion?: TipoOperacion;
}

export async function parseInmuebleExcel(
  arrayBuffer: ArrayBuffer,
  onProgress?: (progress: ExcelParseProgress) => void,
  options?: ParseInmuebleExcelOptions,
): Promise<ExcelParseResult> {
  onProgress?.({ phase: 'reading' });

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = pickWorksheet(workbook, options?.tipoOperacion);

  const columnKeys = buildColumnKeys(worksheet);
  const mappedCount = columnKeys.filter(Boolean).length;
  if (mappedCount === 0) {
    throw new Error(
      'No se reconocieron columnas en el Excel. Comprueba la primera fila de cabeceras.',
    );
  }

  const imagenCol = columnKeys.indexOf('imagen_real');
  const espejoCol = columnKeys.indexOf('foto_espejo');
  const images = worksheet.getImages();
  const imageNativeRows = images.map((img) => img.range.tl.nativeRow);
  const maxRow = getMaxDataRow(worksheet, imageNativeRows);

  const rowMap = new Map<number, ParsedRow>();

  for (let r = 2; r <= maxRow; r++) {
    const excelRow = worksheet.getRow(r);
    const data = emptyInmuebleRow();
    let hasCellData = false;

    columnKeys.forEach((key, colIndex) => {
      if (!key) return;
      const cell = excelRow.getCell(colIndex + 1);
      const text = readCellText(cell);
      const parsed = parseCell(key, text);
      if (parsed !== null && parsed !== '') {
        hasCellData = true;
        const existing = data[key];
        if (
          key === 'fecha_visitas_entrada' &&
          existing &&
          typeof existing === 'string'
        ) {
          (data as Record<string, unknown>)[key] = `${existing} | ${parsed}`;
        } else {
          (data as Record<string, unknown>)[key] = parsed;
        }
      }
    });

    if (hasCellData) {
      rowMap.set(r, { excelRow: r, data, images: [] });
    }
  }

  const imagesByRow = new Map<number, typeof images>();
  for (const meta of images) {
    const excelRow = meta.range.tl.nativeRow + 1;
    const list = imagesByRow.get(excelRow) ?? [];
    list.push(meta);
    imagesByRow.set(excelRow, list);
  }

  for (const [excelRow] of imagesByRow) {
    if (!rowMap.has(excelRow)) {
      rowMap.set(excelRow, {
        excelRow,
        data: emptyInmuebleRow(),
        images: [],
      });
    }
  }

  let totalImages = 0;

  for (const [excelRow, rowImages] of imagesByRow) {
    const target = rowMap.get(excelRow);
    if (!target) continue;

    const sorted = [...rowImages].sort(
      (a, b) => a.range.tl.nativeCol - b.range.tl.nativeCol,
    );

    for (let i = 0; i < sorted.length; i++) {
      const meta = sorted[i];
      const field = resolveImageField(
        meta.range.tl.nativeCol,
        columnKeys,
        imagenCol,
        espejoCol,
        i,
      );
      if (!field) continue;
      if (
        target.images.some((img) => img.field === field) ||
        target.data[field]
      ) {
        continue;
      }

      const image = getWorkbookImage(workbook, meta.imageId);
      if (!image?.buffer) continue;

      target.images.push({
        field,
        buffer: image.buffer,
        extension: image.extension ?? 'jpeg',
      });
      totalImages++;
    }
  }

  const parsed = [...rowMap.values()]
    .filter((p) => rowHasContent(p.data, p.images.length > 0))
    .sort((a, b) => a.excelRow - b.excelRow);

  if (parsed.length === 0) {
    throw new Error('El Excel no contiene filas de datos ni imágenes');
  }

  return {
    rows: parsed.map((p) => ({ data: p.data, images: p.images })),
    totalRows: parsed.length,
    totalImages,
  };
}
