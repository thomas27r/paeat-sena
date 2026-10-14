import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Student, Grade } from '../types';
import { FileSpreadsheet, Upload, Download, CheckCircle2, AlertCircle, X, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toTitleCase } from '../utils/search';

interface ExcelStudentImporterProps {
  onImport: (students: Student[], mode: 'append' | 'replace') => void;
  existingCount?: number;
}

interface ParsedStudentRow {
  fullName: string;
  documentNumber: string;
  grade: Grade;
  valid: boolean;
  errorReason?: string;
}

export const ExcelStudentImporter: React.FC<ExcelStudentImporterProps> = ({
  onImport,
  existingCount = 0,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  // Normalize grade string to valid Grade ('5' | '6' | '7' | '8' | '9' | '10' | '11')
  const normalizeGrade = (raw: unknown): Grade => {
    if (raw === undefined || raw === null) return '6';
    const str = String(raw).trim().toUpperCase();

    // Match numbers 5 through 11
    const match = str.match(/(11|10|9|8|7|6|5)/);
    if (match) {
      return match[1] as Grade;
    }

    if (str.includes('QUINTO')) return '5';
    if (str.includes('SEXTO')) return '6';
    if (str.includes('SEPTIMO') || str.includes('SÉPTIMO')) return '7';
    if (str.includes('OCTAVO')) return '8';
    if (str.includes('NOVENO')) return '9';
    if (str.includes('DECIMO') || str.includes('DÉCIMO')) return '10';
    if (str.includes('ONCE') || str.includes('UNDECIMO') || str.includes('UNDÉCIMO')) return '11';

    return '6';
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
        const parsedList: ParsedStudentRow[] = [];

        rawJson.forEach((row, idx) => {
          // Find key for full name
          let nameVal = '';
          let docVal = '';
          let gradeVal = '6';

          const keys = Object.keys(row);
          for (const key of keys) {
            const lowerKey = key.trim().toLowerCase();
            const val = String(row[key] ?? '').trim();

            if (!nameVal && (lowerKey.includes('nombre') || lowerKey.includes('estudiante') || lowerKey.includes('alumno') || lowerKey === 'name')) {
              nameVal = val;
            } else if (!docVal && (lowerKey.includes('documento') || lowerKey.includes('identifica') || lowerKey.includes('cedula') || lowerKey.includes('cédula') || lowerKey.includes('ti') || lowerKey === 'doc' || lowerKey === 'id' || lowerKey.includes('tarjeta'))) {
              docVal = val;
            } else if (lowerKey.includes('grado') || lowerKey.includes('curso') || lowerKey.includes('grupo') || lowerKey.includes('nivel') || lowerKey === 'grade') {
              gradeVal = val;
            }
          }

          // If standard columns not found by header, fallback to positional if available
          if (!nameVal && keys[0] && typeof row[keys[0]] === 'string') {
            nameVal = String(row[keys[0]]).trim();
          }
          if (!docVal && keys[1]) {
            docVal = String(row[keys[1]]).trim();
          }
          if (keys[2] && (!gradeVal || gradeVal === '6')) {
            gradeVal = String(row[keys[2]]).trim();
          }

          const cleanName = toTitleCase(nameVal.trim());
          const cleanDoc = docVal.replace(/[^0-9A-Za-z-]/g, '').trim();
          const normalizedGrade = normalizeGrade(gradeVal);

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
            fullName: cleanName || `Estudiante Fila ${idx + 2}`,
            documentNumber: cleanDoc || 'Sin documento',
            grade: normalizedGrade,
            valid: isValid,
            errorReason,
          });
        });

        if (parsedList.length === 0) {
          setErrorMessage('No se pudieron extraer estudiantes válidos del archivo.');
          return;
        }

        setParsedRows(parsedList);
        setIsModalOpen(true);
      } catch (err) {
        console.error('Error parsing Excel:', err);
        setErrorMessage('Ocurrió un error al leer el archivo Excel. Asegúrese de que sea un archivo .xlsx, .xls o .csv válido.');
      }
    };

    reader.readAsArrayBuffer(file);
    // Reset file input so same file can be reselected
    e.target.value = '';
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nombre Completo': 'Carlos Mario Restrepo Gil',
        'Número de Documento': '1088320491',
        'Grado': '5',
      },
      {
        'Nombre Completo': 'Valentina Morales Salazar',
        'Número de Documento': '1088320492',
        'Grado': '6',
      },
      {
        'Nombre Completo': 'Mateo Herrera Giraldo',
        'Número de Documento': '1088320493',
        'Grado': '7',
      },
      {
        'Nombre Completo': 'Camila Andrea Ospina',
        'Número de Documento': '1088320494',
        'Grado': '8',
      },
      {
        'Nombre Completo': 'Santiago Henao Duque',
        'Número de Documento': '1088320495',
        'Grado': '10',
      },
      {
        'Nombre Completo': 'Mariana Castro López',
        'Número de Documento': '1088320496',
        'Grado': '11',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 32 }, // Nombre Completo
      { wch: 24 }, // Número de Documento
      { wch: 12 }, // Grado
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes_PAEAT');

    XLSX.writeFile(workbook, 'Plantilla_Estudiantes_PAEAT.xlsx');
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.valid);
    if (validRows.length === 0) return;

    const newStudentObjects: Student[] = validRows.map((r, index) => ({
      id: `st-excel-${Date.now()}-${index}`,
      fullName: r.fullName,
      documentNumber: r.documentNumber,
      grade: r.grade,
      status: 'Pendiente',
    }));

    onImport(newStudentObjects, importMode);
    setIsModalOpen(false);
    setParsedRows([]);
  };

  const formatGradeLabel = (g: string) => {
    const match = g.match(/^(\d+)([A-Za-z])$/);
    if (match) {
      return `${match[1]}°${match[2].toUpperCase()}`;
    }
    return `${g}°`;
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

      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleDownloadTemplate}
          className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 rounded-lg py-1.5 px-2.5 text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          title="Descargar plantilla de Excel para llenar datos"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>Plantilla Excel</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg py-1.5 px-3 text-xs flex items-center gap-1.5 border border-emerald-400/60 shadow-md transition cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
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
              className="w-full max-w-2xl bg-[#2e0513] border border-stone-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-[#1e030c] p-3.5 sm:p-4 border-b border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="text-white font-black text-sm sm:text-base">
                      Previsualización de Importación Excel
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
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary Stats */}
              <div className="p-3 bg-[#24040f] border-b border-stone-800 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-[#1e030c] p-2 rounded-xl border border-stone-800">
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">Total Leídos</span>
                  <span className="text-white font-black text-base">{parsedRows.length}</span>
                </div>
                <div className="bg-[#1e030c] p-2 rounded-xl border border-emerald-900/60">
                  <span className="text-emerald-400 text-[10px] uppercase font-bold block">Válidos</span>
                  <span className="text-emerald-300 font-black text-base">{validCount}</span>
                </div>
                <div className="bg-[#1e030c] p-2 rounded-xl border border-stone-800">
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">Con Errores</span>
                  <span className={`font-black text-base ${invalidCount > 0 ? 'text-rose-400' : 'text-stone-400'}`}>
                    {invalidCount}
                  </span>
                </div>
              </div>

              {/* Import Mode Selector */}
              <div className="p-3 bg-[#1e030c] border-b border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <span className="text-stone-300 font-bold">Modo de integración:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer border ${
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
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer border ${
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
              <div className="flex-1 overflow-y-auto p-3 space-y-1 max-h-64">
                <div className="grid grid-cols-12 gap-2 bg-[#1a0209] px-2.5 py-1.5 rounded-lg text-stone-400 font-extrabold text-[10px] uppercase border border-stone-800">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-6">Nombre Completo</div>
                  <div className="col-span-3 text-center">Documento</div>
                  <div className="col-span-2 text-center">Grado</div>
                </div>

                {parsedRows.slice(0, 50).map((row, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-12 gap-2 items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                      row.valid
                        ? 'bg-[#1e030c] border-stone-800/80 text-stone-200'
                        : 'bg-rose-950/40 border-rose-800 text-rose-300'
                    }`}
                  >
                    <div className="col-span-1 text-center font-mono text-[10px] text-stone-400">
                      {idx + 1}
                    </div>
                    <div className="col-span-6 truncate font-bold text-white">
                      {row.fullName}
                      {!row.valid && (
                        <span className="block text-[10px] text-rose-400 font-normal">
                          {row.errorReason}
                        </span>
                      )}
                    </div>
                    <div className="col-span-3 text-center font-mono text-[11px] text-stone-300">
                      {row.documentNumber}
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded text-[10px] font-black">
                        {formatGradeLabel(row.grade)}
                      </span>
                    </div>
                  </div>
                ))}

                {parsedRows.length > 50 && (
                  <p className="text-stone-400 text-center text-[11px] font-medium py-1">
                    ... y {parsedRows.length - 50} estudiantes más en el archivo.
                  </p>
                )}
              </div>

              {/* Footer Actions */}
              <div className="bg-[#1e030c] p-3 border-t border-stone-800 flex items-center justify-between gap-2">
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
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 font-black px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Confirmar e Importar {validCount} Estudiantes</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
