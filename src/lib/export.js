// Data export utilities: CSV and Excel (.xlsx)
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

/**
 * Convert an array of objects to a CSV string.
 * @param {Array<Object>} data
 * @param {string[]} headers - column keys
 * @param {string[]} labels - column display names
 * @returns {string} CSV content
 */
function toCSV(data, headers, labels) {
  const rows = [
    labels.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? '';
          // Escape commas and quotes
          const str = String(val);
          return str.includes(',') || str.includes('"')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    ),
  ];
  return rows.join('\n');
}

/**
 * Trigger a file download in the browser.
 * @param {string|Blob} content
 * @param {string} filename
 * @param {string} mimeType
 */
function downloadFile(content, filename, mimeType) {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const dateStamp = () => format(new Date(), 'yyyy-MM-dd');

// ─── Food Log Export ──────────────────────────────────────────────────────────

const LOG_HEADERS = ['date', 'meal', 'foodName', 'quantity', 'calories', 'protein', 'carbs', 'fat'];
const LOG_LABELS  = ['Fecha', 'Comida', 'Alimento', 'Cantidad (g)', 'Calorías (kcal)', 'Proteínas (g)', 'Carbohidratos (g)', 'Grasas (g)'];

const MEAL_NAMES = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  snack: 'Merienda',
  dinner: 'Cena',
};

function mapLogForExport(entries) {
  return entries.map((e) => ({
    ...e,
    meal: MEAL_NAMES[e.meal] || e.meal,
  }));
}

export function exportLogCSV(entries) {
  const data = mapLogForExport(entries);
  const csv = toCSV(data, LOG_HEADERS, LOG_LABELS);
  downloadFile(csv, `mykalory-registros-${dateStamp()}.csv`, 'text/csv;charset=utf-8;');
}

export function exportLogXLSX(entries) {
  const data = mapLogForExport(entries);
  const ws = XLSX.utils.json_to_sheet(data, { header: LOG_HEADERS });
  ws['!cols'] = LOG_HEADERS.map(() => ({ wch: 18 }));
  // Set header row labels
  LOG_LABELS.forEach((label, i) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: i });
    ws[cell].v = label;
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registros');
  XLSX.writeFile(wb, `mykalory-registros-${dateStamp()}.xlsx`);
}

// ─── Weight Log Export ────────────────────────────────────────────────────────

const WEIGHT_HEADERS = ['date', 'weight', 'notes'];
const WEIGHT_LABELS  = ['Fecha', 'Peso (kg)', 'Notas'];

export function exportWeightCSV(entries) {
  const csv = toCSV(entries, WEIGHT_HEADERS, WEIGHT_LABELS);
  downloadFile(csv, `mykalory-peso-${dateStamp()}.csv`, 'text/csv;charset=utf-8;');
}

export function exportWeightXLSX(entries) {
  const ws = XLSX.utils.json_to_sheet(entries, { header: WEIGHT_HEADERS });
  ws['!cols'] = WEIGHT_HEADERS.map(() => ({ wch: 18 }));
  WEIGHT_LABELS.forEach((label, i) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: i });
    ws[cell].v = label;
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Peso');
  XLSX.writeFile(wb, `mykalory-peso-${dateStamp()}.xlsx`);
}

// ─── Combined Export ──────────────────────────────────────────────────────────

export function exportAllXLSX(logEntries, weightEntries, exerciseEntries) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Food log
  const logData = mapLogForExport(logEntries);
  const ws1 = XLSX.utils.json_to_sheet(logData, { header: LOG_HEADERS });
  LOG_LABELS.forEach((label, i) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: i });
    if (ws1[cell]) ws1[cell].v = label;
  });
  XLSX.utils.book_append_sheet(wb, ws1, 'Registros de comida');

  // Sheet 2: Weight
  const ws2 = XLSX.utils.json_to_sheet(weightEntries, { header: WEIGHT_HEADERS });
  WEIGHT_LABELS.forEach((label, i) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: i });
    if (ws2[cell]) ws2[cell].v = label;
  });
  XLSX.utils.book_append_sheet(wb, ws2, 'Peso');

  // Sheet 3: Exercise
  const EX_HEADERS = ['date', 'name', 'duration', 'caloriesBurned'];
  const EX_LABELS  = ['Fecha', 'Actividad', 'Duración (min)', 'Calorías quemadas'];
  const ws3 = XLSX.utils.json_to_sheet(exerciseEntries, { header: EX_HEADERS });
  EX_LABELS.forEach((label, i) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: i });
    if (ws3[cell]) ws3[cell].v = label;
  });
  XLSX.utils.book_append_sheet(wb, ws3, 'Ejercicio');

  XLSX.writeFile(wb, `mykalory-datos-${dateStamp()}.xlsx`);
}

export function exportAllCSV(logEntries, weightEntries) {
  const logCSV = toCSV(mapLogForExport(logEntries), LOG_HEADERS, LOG_LABELS);
  const weightCSV = toCSV(weightEntries, WEIGHT_HEADERS, WEIGHT_LABELS);
  const combined = `REGISTROS DE COMIDA\n${logCSV}\n\nPESO\n${weightCSV}`;
  downloadFile(combined, `mykalory-datos-${dateStamp()}.csv`, 'text/csv;charset=utf-8;');
}
