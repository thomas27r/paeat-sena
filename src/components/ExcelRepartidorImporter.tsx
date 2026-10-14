import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Repartidor } from '../types';
import { FileSpreadsheet, Download, CheckCircle2, AlertCircle, X, KeyRound, Clock, Shield, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toTitleCase } from '../utils/search';
import { SHIFT_PRESETS, formatDaysOfWeek } from '../utils/schedule';

interface ExcelRepartidorImporterProps {
  onImport: (repartidores: Repartidor[], mode: 'append' | 'replace') => void;
  existingCount?: number;
}

interface ParsedRepartidorRow {
  fullName: string;
  documentNumber: string;
  password?: string;
  hasScheduleRestriction: boolean;
  shiftStart: string;
  shiftEnd: string;
  shiftName: string;
  shiftDays: number[];
  shiftDaysStr: string;
  valid: boolean;
  errorReason?: string;
}

export const ExcelRepartidorImporter: React.FC<ExcelRepartidorImporterProps> = ({
  onImport,
  existingCount = 0,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRepartidorRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  // Helper to parse time string into HH:mm format
  const parseTimeStr = (val: string, fallback: string): string => {
    if (!val) return fallback;
    const clean = val.trim().toLowerCase();
    
    // Check if format is "6", "06", "6:00", "06:00", "12:30", etc.
    const match = clean.match(/^(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      const ampm = match[3];

      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;

      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
    }

    // Direct HH:MM check
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(clean)) {
      return clean;
    }

    return fallback;
  };

  // Helper to parse days string (e.g. "Lunes a Viernes", "1,2,3,4,5", "Lun-Vie")
  const parseDaysStr = (val: string): number[] => {
    if (!val) return [1, 2, 3, 4, 5];
    const clean = val.trim().toLowerCase();

    if (clean.includes('todo') || clean.includes('semana') || clean.includes('domingo a sabado')) {
      return [0, 1, 2, 3, 4, 5, 6];
    }
    if (clean.includes('sabado') || clean.includes('sábado') || clean.includes('lun-sab') || clean.includes('lunes a sabado')) {
      return [1, 2, 3, 4, 5, 6];
    }
    if (clean.includes('lun') || clean.includes('viernes') || clean.includes('lun-vie') || clean.includes('lunes a viernes')) {
      return [1, 2, 3, 4, 5];
    }

    // Parse numeric lists like "1,2,3,4,5"
    const nums = clean.split(/[,;\s]+/).map((n) => parseInt(n, 10)).filter((n) => !isNaN(n) && n >= 0 && n <= 6);
    if (nums.length > 0) {
      return Array.from(new Set(nums));
    }

    return [1, 2, 3, 4, 5];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          setErrorMessage('El archivo de Excel no contiene hojas de cálculo válidas.');
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
        });

        if (rawJson.length === 0) {
          setErrorMessage('La hoja de cálculo está vacía o no contiene registros válidos.');
          return;
        }

        // Process rows and find matching columns
        const parsedList: ParsedRepartidorRow[] = [];

        rawJson.forEach((row, idx) => {
          let nameVal = '';
          let docVal = '';
          let passVal = '';
          let shiftNameVal = '';
          let shiftStartVal = '';
          let shiftEndVal = '';
          let shiftDaysVal = '';
          let restrictionVal = '';

          const keys = Object.keys(row);
          for (const key of keys) {
            const lowerKey = key.trim().toLowerCase();
            const val = String(row[key] ?? '').trim();

            if (
              !nameVal &&
              (lowerKey.includes('nombre') ||
                lowerKey.includes('repartidor') ||
                lowerKey.includes('personal') ||
                lowerKey.includes('funcionario') ||
                lowerKey === 'name')
            ) {
              nameVal = val;
            } else if (
              !docVal &&
              (lowerKey.includes('documento') ||
                lowerKey.includes('identifica') ||
                lowerKey.includes('cedula') ||
                lowerKey.includes('cédula') ||
                lowerKey.includes('cc') ||
                lowerKey === 'doc' ||
                lowerKey === 'id')
            ) {
              docVal = val;
            } else if (
              !passVal &&
              (lowerKey.includes('clave') ||
                lowerKey.includes('contrase') ||
                lowerKey.includes('password') ||
                lowerKey.includes('pass'))
            ) {
              passVal = val;
            } else if (
              !shiftNameVal &&
              (lowerKey.includes('turno') ||
                lowerKey.includes('jornada') ||
                lowerKey.includes('shift') ||
                lowerKey === 'tipo de turno')
            ) {
              shiftNameVal = val;
            } else if (
              !shiftStartVal &&
              (lowerKey.includes('hora inicio') ||
                lowerKey.includes('inicio') ||
                lowerKey.includes('hora entrada') ||
                lowerKey.includes('desde') ||
                lowerKey.includes('start'))
            ) {
              shiftStartVal = val;
            } else if (
              !shiftEndVal &&
              (lowerKey.includes('hora fin') ||
                lowerKey.includes('fin') ||
                lowerKey.includes('hora salida') ||
                lowerKey.includes('hasta') ||
                lowerKey.includes('end'))
            ) {
              shiftEndVal = val;
            } else if (
              !shiftDaysVal &&
              (lowerKey.includes('días') ||
                lowerKey.includes('dias') ||
                lowerKey.includes('days') ||
                lowerKey.includes('laborales') ||
                lowerKey.includes('semana'))
            ) {
              shiftDaysVal = val;
            } else if (
              !restrictionVal &&
              (lowerKey.includes('restringir') ||
                lowerKey.includes('restricci') ||
                lowerKey.includes('control') ||
                lowerKey.includes('bloqueo'))
            ) {
              restrictionVal = val;
            }
          }

          // Positional fallbacks
          if (!nameVal && keys[0] && typeof row[keys[0]] === 'string') {
            nameVal = String(row[keys[0]]).trim();
          }
          if (!docVal && keys[1]) {
            docVal = String(row[keys[1]]).trim();
          }
          if (!passVal && keys[2]) {
            passVal = String(row[keys[2]]).trim();
          }

          const cleanName = toTitleCase(nameVal.trim());
          const cleanDoc = docVal.replace(/[^0-9A-Za-z-]/g, '').trim();
          const cleanPass = passVal.trim();

          // Determine Shift / Schedule details
          let hasRestriction = true;
          if (restrictionVal) {
            const rLow = restrictionVal.toLowerCase();
            if (rLow === 'no' || rLow === 'false' || rLow === 'libre' || rLow === 'desactivado' || rLow === '0') {
              hasRestriction = false;
            }
          }

          let resolvedShiftName = 'Jornada Mañana';
          let resolvedStart = '06:00';
          let resolvedEnd = '12:00';
          let resolvedDays = [1, 2, 3, 4, 5];

          const shiftLow = shiftNameVal.toLowerCase();
          if (shiftLow.includes('tarde') || shiftLow.includes('vespertina')) {
            resolvedShiftName = 'Jornada Tarde';
            resolvedStart = '12:30';
            resolvedEnd = '18:30';
          } else if (shiftLow.includes('completa') || shiftLow.includes('todo el dia') || shiftLow.includes('completo')) {
            resolvedShiftName = 'Jornada Completa';
            resolvedStart = '06:00';
            resolvedEnd = '18:30';
          } else if (shiftLow.includes('libre') || shiftLow.includes('sin restriccion') || shiftLow.includes('sin restricción') || shiftLow.includes('ninguno')) {
            resolvedShiftName = 'Acceso Libre (Sin Restricción)';
            hasRestriction = false;
          } else if (shiftLow.includes('mañana') || shiftLow.includes('manana') || shiftLow.includes('matutino')) {
            resolvedShiftName = 'Jornada Mañana';
            resolvedStart = '06:00';
            resolvedEnd = '12:00';
          } else if (shiftNameVal) {
            resolvedShiftName = shiftNameVal;
          }

          // Check if explicit hours provided in specific columns or within shift text (e.g. "06:00 - 12:00")
          if (shiftStartVal) {
            resolvedStart = parseTimeStr(shiftStartVal, resolvedStart);
          }
          if (shiftEndVal) {
            resolvedEnd = parseTimeStr(shiftEndVal, resolvedEnd);
          }

          // If hours were typed inside the shiftName column like "07:00 a 13:00" or "07:00 - 13:00"
          const rangeMatch = shiftNameVal.match(/(\d{1,2}[:.]\d{2})\s*(?:-|a|hasta|to)\s*(\d{1,2}[:.]\d{2})/i);
          if (rangeMatch && !shiftStartVal && !shiftEndVal) {
            resolvedStart = parseTimeStr(rangeMatch[1], resolvedStart);
            resolvedEnd = parseTimeStr(rangeMatch[2], resolvedEnd);
          }

          if (shiftDaysVal) {
            resolvedDays = parseDaysStr(shiftDaysVal);
          }

          let isValid = true;
          let errorReason = '';

          if (!cleanName) {
            isValid = false;
            errorReason = 'Falta el nombre completo.';
          } else if (!cleanDoc) {
            isValid = false;
            errorReason = 'Falta el número de documento.';
          }

          parsedList.push({
            fullName: cleanName || `Repartidor Fila ${idx + 2}`,
            documentNumber: cleanDoc || 'Sin documento',
            password: cleanPass || cleanDoc || 'repartidor123',
            hasScheduleRestriction: hasRestriction,
            shiftStart: resolvedStart,
            shiftEnd: resolvedEnd,
            shiftName: resolvedShiftName,
            shiftDays: resolvedDays,
            shiftDaysStr: formatDaysOfWeek(resolvedDays),
            valid: isValid,
            errorReason,
          });
        });

        if (parsedList.length === 0) {
          setErrorMessage('No se pudieron extraer repartidores válidos del archivo.');
          return;
        }

        setParsedRows(parsedList);
        setIsModalOpen(true);
      } catch (err) {
        console.error('Error parsing Excel:', err);
        setErrorMessage(
          'Ocurrió un error al leer el archivo Excel. Asegúrese de que sea un archivo .xlsx, .xls o .csv válido.'
        );
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nombre Completo': 'Carlos Mario Gomez Perez',
        'Número de Documento': '1088456123',
        'Contraseña (Opcional)': '1088456123',
        'Turno / Jornada': 'Jornada Mañana',
        'Hora Inicio': '06:00',
        'Hora Fin': '12:00',
        'Días Laborales': 'Lunes a Viernes',
        'Restringir Horario': 'SI',
      },
      {
        'Nombre Completo': 'Luisa Fernanda Restrepo Rios',
        'Número de Documento': '1140065999',
        'Contraseña (Opcional)': 'repartidor123',
        'Turno / Jornada': 'Jornada Tarde',
        'Hora Inicio': '12:30',
        'Hora Fin': '18:30',
        'Días Laborales': 'Lunes a Viernes',
        'Restringir Horario': 'SI',
      },
      {
        'Nombre Completo': 'Andres Felipe Jaramillo Gil',
        'Número de Documento': '1089624555',
        'Contraseña (Opcional)': '1089624555',
        'Turno / Jornada': 'Jornada Completa',
        'Hora Inicio': '06:00',
        'Hora Fin': '18:30',
        'Días Laborales': 'Lunes a Sábado',
        'Restringir Horario': 'SI',
      },
      {
        'Nombre Completo': 'Maria Camila Torres Diaz',
        'Número de Documento': '1053812440',
        'Contraseña (Opcional)': '1053812440',
        'Turno / Jornada': 'Acceso Libre (Sin Restricción)',
        'Hora Inicio': '06:00',
        'Hora Fin': '18:30',
        'Días Laborales': 'Todos los días',
        'Restringir Horario': 'NO',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    worksheet['!cols'] = [
      { wch: 34 }, // Nombre Completo
      { wch: 24 }, // Número de Documento
      { wch: 24 }, // Contraseña
      { wch: 26 }, // Turno / Jornada
      { wch: 14 }, // Hora Inicio
      { wch: 14 }, // Hora Fin
      { wch: 20 }, // Días Laborales
      { wch: 20 }, // Restringir Horario
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Repartidores_PAEAT');
    XLSX.writeFile(workbook, 'Plantilla_Repartidores_PAEAT.xlsx');
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.valid);
    if (validRows.length === 0) return;

    const newRepartidores: Repartidor[] = validRows.map((r, index) => ({
      id: `rep-excel-${Date.now()}-${index}`,
      fullName: r.fullName,
      documentNumber: r.documentNumber,
      password: r.password || r.documentNumber || 'repartidor123',
      isActive: true,
      hasScheduleRestriction: r.hasScheduleRestriction,
      shiftStart: r.shiftStart,
      shiftEnd: r.shiftEnd,
      shiftName: r.shiftName,
      shiftDays: r.shiftDays,
    }));

    onImport(newRepartidores, importMode);
    setIsModalOpen(false);
    setParsedRows([]);
  };

  const validCount = parsedRows.filter((r) => r.valid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      <div className="flex items-center gap-1.5">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleDownloadTemplate}
          className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 rounded-md py-1 px-2 text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
          title="Descargar plantilla de Excel con columnas de turno y horario para repartidores"
        >
          <Download className="w-3 h-3 text-amber-400" />
          <span className="hidden sm:inline">Plantilla</span>
          <span>Excel</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-md py-1 px-2.5 text-xs flex items-center gap-1 border border-emerald-400/60 shadow-xs transition cursor-pointer"
          title="Importar personal de repartidores y horarios desde archivo Excel o CSV"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
          <span>Importar Excel</span>
        </motion.button>
      </div>

      {errorMessage && (
        <div className="w-full bg-rose-950/90 border border-rose-500 text-rose-200 text-xs font-bold rounded-lg p-2 mt-2 flex items-center gap-2 shadow-md">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage('')}
            className="ml-auto text-rose-400 hover:text-white p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Preview and Confirmation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-3xl bg-[#2e0513] border border-stone-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-[#1e030c] p-3 sm:p-3.5 border-b border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="text-white font-black text-sm sm:text-base">
                      Previsualización de Importación de Repartidores
                    </h2>
                    <p className="text-stone-300 text-[11px] font-medium truncate max-w-xs sm:max-w-md">
                      Archivo: <span className="text-amber-300 font-bold">{fileName}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Summary Stats */}
              <div className="p-2.5 bg-[#24040f] border-b border-stone-800 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-[#1e030c] p-2 rounded-lg border border-stone-800">
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">Total Leídos</span>
                  <span className="text-white font-black text-sm sm:text-base">{parsedRows.length}</span>
                </div>
                <div className="bg-[#1e030c] p-2 rounded-lg border border-emerald-900/60">
                  <span className="text-emerald-400 text-[10px] uppercase font-bold block">Válidos</span>
                  <span className="text-emerald-300 font-black text-sm sm:text-base">{validCount}</span>
                </div>
                <div className="bg-[#1e030c] p-2 rounded-lg border border-stone-800">
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">Con Errores</span>
                  <span className={`font-black text-sm sm:text-base ${invalidCount > 0 ? 'text-rose-400' : 'text-stone-400'}`}>
                    {invalidCount}
                  </span>
                </div>
              </div>

              {/* Import Mode Selector */}
              <div className="p-2.5 bg-[#1e030c] border-b border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <span className="text-stone-300 font-bold text-[11px]">Modo de integración:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`px-2.5 py-1 rounded-md font-bold text-xs transition cursor-pointer border ${
                      importMode === 'append'
                        ? 'bg-amber-400 text-stone-950 border-amber-300 font-black'
                        : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                    }`}
                  >
                    Sumar a los {existingCount} existentes
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`px-2.5 py-1 rounded-md font-bold text-xs transition cursor-pointer border ${
                      importMode === 'replace'
                        ? 'bg-rose-600 text-white border-rose-400 font-black'
                        : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                    }`}
                  >
                    Reemplazar lista completa
                  </button>
                </div>
              </div>

              {/* Table Preview */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 max-h-72">
                <div className="grid grid-cols-12 gap-2 bg-[#1a0209] px-2.5 py-1 rounded-md text-stone-400 font-extrabold text-[10px] uppercase border border-stone-800">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-4">Nombre Completo</div>
                  <div className="col-span-2 text-center">Documento</div>
                  <div className="col-span-3">Turno / Horario</div>
                  <div className="col-span-2 text-center">Clave</div>
                </div>

                {parsedRows.slice(0, 50).map((row, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-12 gap-2 items-center px-2.5 py-1.5 rounded-md text-xs font-semibold border ${
                      row.valid
                        ? 'bg-[#1e030c] border-stone-800/80 text-stone-200'
                        : 'bg-rose-950/40 border-rose-800 text-rose-300'
                    }`}
                  >
                    <div className="col-span-1 text-center font-mono text-[10px] text-stone-400">
                      {idx + 1}
                    </div>
                    <div className="col-span-4 truncate font-bold text-white text-xs">
                      {row.fullName}
                      {!row.valid && (
                        <span className="block text-[10px] text-rose-400 font-normal">
                          {row.errorReason}
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 text-center font-mono text-[11px] text-stone-300">
                      {row.documentNumber}
                    </div>
                    <div className="col-span-3">
                      {row.hasScheduleRestriction ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-300">
                            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{row.shiftStart} - {row.shiftEnd}</span>
                          </span>
                          <span className="text-[9.5px] text-stone-400 truncate">
                            {row.shiftName} ({row.shiftDaysStr})
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                          <Shield className="w-2.5 h-2.5" />
                          <span>Sin Restricción</span>
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="inline-flex items-center gap-1 bg-[#1a0209] text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded font-mono text-[10px]">
                        <KeyRound className="w-2.5 h-2.5 text-amber-400" />
                        <span>{row.password ? '••••••••' : 'Predeterminada'}</span>
                      </span>
                    </div>
                  </div>
                ))}

                {parsedRows.length > 50 && (
                  <p className="text-stone-400 text-center text-[11px] font-medium py-1">
                    ... y {parsedRows.length - 50} repartidores más en el archivo.
                  </p>
                )}
              </div>

              {/* Footer Actions */}
              <div className="bg-[#1e030c] p-2.5 border-t border-stone-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  disabled={validCount === 0}
                  onClick={handleConfirmImport}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 font-black px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Confirmar e Importar {validCount} Repartidores</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
