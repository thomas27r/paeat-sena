import React, { useState } from 'react';
import { Header } from '../components/Header';
import { DailyHistoryRecord, Student, Grade } from '../types';
import { matchStudent } from '../utils/search';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  RotateCcw,
  Search,
  BarChart2,
  Sparkles,
  Truck,
  UserCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  drawInstitutionalHeader,
  drawSummaryMetricCards,
  drawSectionTitle,
  applyPageFooters,
  drawSignatureBoxes,
  PDF_COLORS,
} from '../utils/pdfGenerator';

interface AdminHistoryViewProps {
  historyRecords: DailyHistoryRecord[];
  currentStudents: Student[];
  onBack: () => void;
  onOpenSettings: () => void;
  onGoHome?: () => void;
}

// Helper to get today's date in GMT-5 (Colombia time, UTC-5)
const getTodayGMT5 = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const gmt5 = new Date(utc - (5 * 3600000));
  const year = gmt5.getFullYear();
  const month = String(gmt5.getMonth() + 1).padStart(2, '0');
  const day = String(gmt5.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  const formattedDate = gmt5.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return { dateStr, formattedDate };
};

export const AdminHistoryView: React.FC<AdminHistoryViewProps> = ({
  historyRecords,
  currentStudents,
  onBack,
  onOpenSettings,
  onGoHome,
}) => {
  const { dateStr: todayStr, formattedDate: todayFormatted } = getTodayGMT5();

  const activeDayRecibidos = currentStudents.filter((s) => s.status === 'Recibido').length;
  const activeDayPercentage =
    currentStudents.length > 0
      ? Math.round((activeDayRecibidos / currentStudents.length) * 100)
      : 0;

  const currentDayRecord: DailyHistoryRecord = {
    id: `hist-today-${todayStr}`,
    dateStr: todayStr,
    formattedDate: `Hoy - ${todayFormatted} (GMT-5)`,
    totalStudents: currentStudents.length,
    recibidosCount: activeDayRecibidos,
    pendientesCount: currentStudents.length - activeDayRecibidos,
    percentage: activeDayPercentage,
    students: currentStudents.map((s) => ({
      studentId: s.id,
      fullName: s.fullName,
      documentNumber: s.documentNumber,
      grade: s.grade,
      status: s.status,
      deliveryTimestamp: s.deliveryTimestamp,
      deliveredById: s.deliveredById,
      deliveredByName: s.deliveredByName,
      deliveredByDoc: s.deliveredByDoc,
      deliveredByRole: s.deliveredByRole,
      avatarUrl: s.avatarUrl,
    })),
  };

  // List of all days (Current Day first, followed by past saved days)
  const allRecords: DailyHistoryRecord[] = [
    currentDayRecord,
    ...historyRecords.filter((h) => h.dateStr !== todayStr),
  ];

  const [selectedRecordId, setSelectedRecordId] = useState<string>(currentDayRecord.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<Grade | null>(null);
  const [selectedRepartidorFilter, setSelectedRepartidorFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendientes' | 'recibidos'>('todos');
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState(false);

  const gradeList: Grade[] = ['5', '6', '7', '8', '9', '10', '11'];

  const formatGradeLabel = (g: string) => {
    return `${g}°`;
  };

  const selectedRecord =
    allRecords.find((r) => r.id === selectedRecordId) || currentDayRecord;

  // Calculate delivery breakdown by Repartidor for the selected record
  const repartidoresBreakdown = React.useMemo(() => {
    const map = new Map<string, { name: string; doc: string; role: string; count: number }>();
    for (const s of selectedRecord.students) {
      if (s.status === 'Recibido') {
        const name = s.deliveredByName || 'Repartidor Autorizado';
        const doc = s.deliveredByDoc || '';
        const role = s.deliveredByRole || 'Repartidor';
        const key = doc ? `${name}__${doc}` : name;
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(key, { name, doc, role, count: 1 });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [selectedRecord]);

  // Filter students within the selected record
  const filteredSnapshots = selectedRecord.students.filter((st) => {
    const matchesSearch = matchStudent(
      {
        fullName: st.fullName,
        documentNumber: st.documentNumber,
        grade: st.grade,
      } as Student,
      searchTerm
    );

    const matchesGrade = !selectedGradeFilter || st.grade === selectedGradeFilter;
    const matchesStatus =
      statusFilter === 'todos'
        ? true
        : statusFilter === 'recibidos'
        ? st.status === 'Recibido'
        : st.status !== 'Recibido';

    const matchesRepartidor =
      !selectedRepartidorFilter ||
      (st.status === 'Recibido' &&
        (st.deliveredByName === selectedRepartidorFilter ||
          st.deliveredByDoc === selectedRepartidorFilter));

    return matchesSearch && matchesGrade && matchesStatus && matchesRepartidor;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedGradeFilter(null);
    setSelectedRepartidorFilter(null);
    setStatusFilter('todos');
  };

  // Export CSV for selected day
  const handleExportCSV = () => {
    if (selectedRecord.students.length === 0) return;

    const headers = [
      'Fecha Reporte',
      'Nombre Completo',
      'Documento',
      'Grado',
      'Estado Entrega',
      'Hora Entrega',
      'Entregado Por (Repartidor)',
      'Documento Repartidor',
      'Rol Repartidor',
    ];

    const rows = filteredSnapshots.map((st) => [
      selectedRecord.formattedDate,
      `"${st.fullName}"`,
      `"${st.documentNumber}"`,
      `"${formatGradeLabel(st.grade)}"`,
      `"${st.status}"`,
      `"${st.deliveryTimestamp || 'N/A'}"`,
      `"${st.status === 'Recibido' ? (st.deliveredByName || 'Repartidor Autorizado') : ''}"`,
      `"${st.status === 'Recibido' ? (st.deliveredByDoc || '') : ''}"`,
      `"${st.status === 'Recibido' ? (st.deliveredByRole || 'Repartidor') : ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Historial_Entregas_${selectedRecord.dateStr}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCsvSuccess(true);
    setTimeout(() => setCsvSuccess(false), 3000);
  };

  // Export PDF for selected day with institutional header, grade summary, audit, and signatures
  const handleExportPDF = () => {
    if (selectedRecord.students.length === 0) return;

    const doc = new jsPDF();
    const folioStr = `ACT-${selectedRecord.dateStr.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Institutional Banner Header
    let currentY = drawInstitutionalHeader(
      doc,
      'Acta Oficial de Control y Entrega de Raciones',
      'Institución Educativa Empresarial · PAEAT',
      folioStr,
      [
        `Jornada: ${selectedRecord.formattedDate}`,
        `Cierre: ${selectedRecord.dateStr}`,
        `Estado: Consolidado`,
      ]
    );

    // Summary Metric Cards
    currentY = drawSummaryMetricCards(doc, currentY, [
      { title: 'Total Beneficiarios', value: selectedRecord.totalStudents, color: 'wine', sub: 'Estudiantes Matriculados' },
      { title: 'Raciones Entregadas', value: selectedRecord.recibidosCount, color: 'green', sub: 'Refrigerios Suministrados' },
      { title: 'Raciones Pendientes', value: selectedRecord.pendientesCount, color: 'amber', sub: 'Sin Reclamar' },
      { title: 'Cumplimiento Global', value: `${selectedRecord.percentage}%`, color: selectedRecord.percentage >= 80 ? 'green' : 'amber', sub: 'Efectividad de Entrega' },
    ]);

    // Section 1: Grade Breakdown Summary Table
    currentY = drawSectionTitle(doc, currentY, '1. RESUMEN EJECUTIVO DE CUMPLIMIENTO POR GRADOS');

    const gradeHeaders = [['Grado Escolar', 'Total Asignado', 'Raciones Entregadas', 'Pendientes', '% Cumplimiento']];
    const gradeRows: (string | number)[][] = (['5', '6', '7', '8', '9', '10', '11'] as Grade[]).map((g) => {
      const gTotal = selectedRecord.students.filter((s) => s.grade === g).length;
      const gRec = selectedRecord.students.filter((s) => s.grade === g && s.status === 'Recibido').length;
      const gPen = gTotal - gRec;
      const gPct = gTotal > 0 ? Math.round((gRec / gTotal) * 100) : 0;
      return [`Grado ${g}°`, gTotal, gRec, gPen, `${gPct}%`];
    });

    // Total row
    gradeRows.push([
      'TOTAL GENERAL',
      selectedRecord.totalStudents,
      selectedRecord.recibidosCount,
      selectedRecord.pendientesCount,
      `${selectedRecord.percentage}%`,
    ]);

    autoTable(doc, {
      head: gradeHeaders,
      body: gradeRows,
      startY: currentY,
      theme: 'grid',
      headStyles: {
        fillColor: PDF_COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center', fontStyle: 'bold' },
        3: { halign: 'center' },
        4: { halign: 'center', fontStyle: 'bold' },
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.3,
      },
      alternateRowStyles: {
        fillColor: PDF_COLORS.bgAlt,
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === gradeRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = PDF_COLORS.goldLight;
          data.cell.styles.textColor = PDF_COLORS.primary;
        }
      },
    });

    // Section 1.1: Repartidores Delivery Audit Summary
    const table1FinalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || currentY + 40;
    currentY = table1FinalY + 6;

    if (repartidoresBreakdown.length > 0) {
      currentY = drawSectionTitle(doc, currentY, '1.1. AUDITORÍA DE ENTREGAS POR REPARTIDOR / RESPONSABLE');

      const repHeaders = [['Repartidor / Responsable', 'Documento C.C.', 'Rol Asignado', 'Raciones Entregadas', '% del Total Entregado']];
      const repRows = repartidoresBreakdown.map((r) => [
        r.name,
        r.doc || 'Sin registrar',
        r.role,
        r.count,
        `${selectedRecord.recibidosCount > 0 ? Math.round((r.count / selectedRecord.recibidosCount) * 100) : 0}%`,
      ]);

      autoTable(doc, {
        head: repHeaders,
        body: repRows,
        startY: currentY,
        theme: 'grid',
        headStyles: {
          fillColor: [74, 11, 34],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center', fontStyle: 'bold' },
          4: { halign: 'center', fontStyle: 'bold' },
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.3,
        },
        alternateRowStyles: {
          fillColor: PDF_COLORS.bgAlt,
        },
      });

      currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    }

    // Section 2: Detailed Students List
    currentY = drawSectionTitle(doc, currentY, '2. PLANILLA DETALLADA DE ESTUDIANTES BENEFICIARIOS');

    const tableHeaders = [
      ['N°', 'Estudiante', 'Documento', 'Grado', 'Estado', 'Hora Entrega', 'Entregado Por (Repartidor)'],
    ];

    const tableRows = filteredSnapshots.map((st, index) => [
      index + 1,
      st.fullName,
      st.documentNumber,
      formatGradeLabel(st.grade),
      st.status,
      st.deliveryTimestamp || 'Sin registrar',
      st.status === 'Recibido'
        ? (st.deliveredByName ? `${st.deliveredByName} (${st.deliveredByDoc || ''})` : 'Repartidor Autorizado')
        : '-',
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: currentY,
      theme: 'grid',
      headStyles: {
        fillColor: PDF_COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 50, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 26 },
        3: { halign: 'center', cellWidth: 18 },
        4: { halign: 'center', cellWidth: 22 },
        5: { halign: 'center', cellWidth: 24 },
        6: { cellWidth: 36 },
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.3,
      },
      alternateRowStyles: {
        fillColor: PDF_COLORS.bgAlt,
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const val = data.cell.raw;
          if (val === 'Recibido') {
            data.cell.styles.textColor = PDF_COLORS.success;
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = PDF_COLORS.warning;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    // Section 3: Official Signatures
    const finalTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 200;
    drawSignatureBoxes(doc, finalTableY);

    // Apply Institutional Page Footers & Running Page Count
    applyPageFooters(doc, `Acta Oficial de Entregas - ${selectedRecord.formattedDate}`);

    doc.save(`Reporte_Oficial_Entregas_${selectedRecord.dateStr}.pdf`);

    setPdfSuccess(true);
    setTimeout(() => setPdfSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#3d081b] flex flex-col pb-24 sm:pb-16">
      <Header showBack onBack={onBack} showSettings onSettings={onOpenSettings} onLogoClick={onGoHome} />

      <main className="flex-1 p-2 sm:p-3 max-w-5xl mx-auto w-full animate-in fade-in duration-200">
        {/* Top Title & Auto-Reset Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
          <div>
            <h2 className="text-white text-sm sm:text-base font-black tracking-wide flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Historial Diario de Entregas</span>
            </h2>
            <p className="text-stone-300 text-[10px] sm:text-[11px] font-medium">
              Registro histórico continuo con cierre y reinicio automático diario a medianoche (GMT-5).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs">
              <Clock className="w-3 h-3 text-emerald-400 shrink-0 animate-pulse" />
              <span>Cierre Automático: 11:59 PM (GMT-5)</span>
            </div>
          </div>
        </div>

        {/* Date Selector Cards Carousel / List */}
        <div className="mb-2">
          <span className="text-stone-300 text-[10px] font-bold uppercase tracking-wider mb-1 block flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Seleccionar Fecha:</span>
          </span>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-stone-700">
            {allRecords.map((record) => {
              const isSelected = record.id === selectedRecordId;
              const isToday = record.dateStr === todayStr;

              return (
                <motion.button
                  key={record.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRecordId(record.id)}
                  className={`flex flex-col justify-between p-2 rounded-lg border transition-all cursor-pointer min-w-[145px] sm:min-w-[165px] shrink-0 text-left ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#4a0b22] to-[#2e0513] border-amber-400 shadow-sm ring-1 ring-amber-400/50'
                      : 'bg-[#2e0513] border-stone-800 hover:border-stone-700 opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                        isToday
                          ? 'bg-amber-400 text-stone-950'
                          : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {isToday ? 'Hoy (GMT-5)' : record.dateStr}
                    </span>

                    <span
                      className={`text-[10px] font-black ${
                        record.percentage === 100
                          ? 'text-emerald-400'
                          : record.percentage >= 70
                          ? 'text-amber-300'
                          : 'text-stone-300'
                      }`}
                    >
                      {record.percentage}%
                    </span>
                  </div>

                  <span className="text-white text-[11px] font-bold truncate">
                    {record.formattedDate}
                  </span>

                  <div className="flex items-center justify-between text-[10px] text-stone-300 mt-1 pt-1 border-t border-stone-800/80">
                    <span className="text-emerald-400 font-semibold">
                      ✓ {record.recibidosCount}
                    </span>
                    <span className="text-amber-300 font-semibold">
                      ⏳ {record.pendientesCount}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Stats & Export Header */}
        <div className="bg-[#2e0513] p-2 sm:p-2.5 rounded-lg border border-stone-700/70 shadow-md mb-2 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1.5 border-b border-stone-800">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="bg-amber-400/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded border border-amber-400/40">
                  {selectedRecord.dateStr === todayStr ? 'EN CURSO (GMT-5)' : 'ARCHIVADO'}
                </span>
                <h3 className="text-white text-xs sm:text-sm font-black">
                  {selectedRecord.formattedDate}
                </h3>
              </div>
              <p className="text-stone-400 text-[10px] mt-0.5">
                {selectedRecord.recibidosCount} de {selectedRecord.totalStudents} estudiantes entregados ({selectedRecord.percentage}%).
              </p>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportPDF}
                disabled={selectedRecord.students.length === 0}
                className="flex items-center gap-1 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs px-2 py-1 rounded-md transition-all shadow-xs cursor-pointer border border-red-500/50"
                title="Exportar reporte de este día en PDF"
              >
                <FileText className="w-3 h-3 text-red-200" />
                <span>{pdfSuccess ? '¡Listo!' : 'PDF'}</span>
                <Download className="w-2.5 h-2.5 opacity-80" />
              </button>

              <button
                onClick={handleExportCSV}
                disabled={selectedRecord.students.length === 0}
                className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-black text-xs px-2 py-1 rounded-md transition-all shadow-xs cursor-pointer border border-emerald-400/50"
                title="Exportar reporte de este día en CSV"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-200" />
                <span>{csvSuccess ? '¡Listo!' : 'CSV'}</span>
                <Download className="w-2.5 h-2.5 opacity-80" />
              </button>
            </div>
          </div>

          {/* Progress Bar & Summary Cards */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-[#1e030c] p-1.5 rounded-md border border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-stone-400 text-[9px] font-bold block">Total</span>
                <span className="text-white text-sm sm:text-base font-black">{selectedRecord.totalStudents}</span>
              </div>
              <BarChart2 className="w-3.5 h-3.5 text-amber-400 opacity-80" />
            </div>

            <div className="bg-[#1e030c] p-1.5 rounded-md border border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-emerald-400 text-[9px] font-bold block">Recibidos</span>
                <span className="text-emerald-400 text-sm sm:text-base font-black">{selectedRecord.recibidosCount}</span>
              </div>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 opacity-80" />
            </div>

            <div className="bg-[#1e030c] p-1.5 rounded-md border border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-amber-300 text-[9px] font-bold block">Pendientes</span>
                <span className="text-amber-300 text-sm sm:text-base font-black">{selectedRecord.pendientesCount}</span>
              </div>
              <Clock className="w-3.5 h-3.5 text-amber-400 opacity-80" />
            </div>
          </div>

          {/* Compliance Progress Bar */}
          <div>
            <div className="w-full bg-[#1e030c] h-1.5 rounded-full overflow-hidden border border-stone-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${selectedRecord.percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
              />
            </div>
          </div>

          {/* Grade Breakdown Dashboard */}
          <div className="bg-[#1e030c] p-2 rounded-lg border border-stone-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-stone-300 text-[9px] font-black uppercase tracking-wider block">
                Cumplimiento de Raciones por Grado Escolar:
              </span>
              <span className="text-[9px] text-stone-400">
                Clic en un grado para filtrar
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-1">
              {gradeList.map((g) => {
                const gTotal = selectedRecord.students.filter((s) => s.grade === g).length;
                const gRec = selectedRecord.students.filter((s) => s.grade === g && s.status === 'Recibido').length;
                const gPct = gTotal > 0 ? Math.round((gRec / gTotal) * 100) : 0;
                const isSelected = selectedGradeFilter === g;

                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGradeFilter(isSelected ? null : g)}
                    className={`p-1.5 rounded-md border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-xs font-black'
                        : 'bg-[#2a0411] text-stone-200 border-stone-800 hover:border-amber-400/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black">{g}°</span>
                      <span className="font-extrabold text-[9px]">{gPct}%</span>
                    </div>
                    <div className="w-full bg-stone-900/60 h-1 rounded-full overflow-hidden my-0.5">
                      <div
                        className={`h-full ${isSelected ? 'bg-stone-950' : 'bg-emerald-400'}`}
                        style={{ width: `${gPct}%` }}
                      />
                    </div>
                    <span className="text-[9px] opacity-80 font-mono">
                      {gRec}/{gTotal} ent.
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Repartidores Delivery Breakdown Card */}
          <div className="bg-[#1e030c] p-2 rounded-lg border border-stone-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-white text-[11px] font-black uppercase tracking-wider">
                  Auditoría de Entregas por Repartidor:
                </span>
              </div>
              {selectedRepartidorFilter && (
                <button
                  onClick={() => setSelectedRepartidorFilter(null)}
                  className="text-amber-400 hover:text-amber-300 text-[9px] font-bold underline cursor-pointer"
                >
                  Quitar filtro ({selectedRepartidorFilter})
                </button>
              )}
            </div>

            {repartidoresBreakdown.length === 0 ? (
              <p className="text-stone-400 text-[11px] italic py-0.5">
                No hay entregas registradas en esta jornada aún.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {repartidoresBreakdown.map((r) => {
                  const isSelected = selectedRepartidorFilter === r.name;
                  const pct =
                    selectedRecord.recibidosCount > 0
                      ? Math.round((r.count / selectedRecord.recibidosCount) * 100)
                      : 0;

                  return (
                    <motion.button
                      key={r.name + r.doc}
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setSelectedRepartidorFilter(isSelected ? null : r.name)
                      }
                      className={`p-2 rounded-lg border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-xs ring-1 ring-amber-400'
                          : 'bg-[#2a0411] text-white border-stone-800 hover:border-amber-400/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 font-bold ${
                            isSelected
                              ? 'bg-stone-950 text-amber-400'
                              : 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                          }`}
                        >
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black truncate">{r.name}</h4>
                          <span
                            className={`text-[9px] block ${
                              isSelected ? 'text-stone-800' : 'text-stone-400'
                            }`}
                          >
                            C.C. {r.doc || 'Sin doc'} · {r.role}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black block">
                          {r.count} <span className="text-[9px] font-bold">ent.</span>
                        </span>
                        <span
                          className={`text-[9px] font-bold ${
                            isSelected ? 'text-stone-900' : 'text-emerald-400'
                          }`}
                        >
                          {pct}% del día
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Filter Suite for Historical Records */}
        <div className="bg-[#2e0513] p-1.5 sm:p-2 rounded-lg border border-stone-700/70 shadow-md mb-2 space-y-1.5">
          {/* Row 1: Search & Reset */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar estudiante o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#dedede] text-stone-900 text-xs placeholder-stone-500 rounded-md pl-8 pr-7 py-1.5 font-bold outline-hidden focus:ring-1 focus:ring-amber-400 shadow-inner"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-950 p-0.5 rounded-full bg-stone-300 hover:bg-stone-400 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

            {(searchTerm || selectedGradeFilter || statusFilter !== 'todos') && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleResetFilters}
                className="flex items-center justify-center gap-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-black px-2 py-1.5 rounded-md border border-stone-600 transition cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Limpiar</span>
              </motion.button>
            )}
          </div>

          {/* Row 2: Status Tabs + Grade Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-1 border-t border-stone-800/80">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-[#1e030c] p-0.5 rounded-md border border-stone-800 self-start sm:self-auto">
              <button
                onClick={() => setStatusFilter('todos')}
                className={`px-2 py-0.5 rounded text-[11px] font-black transition cursor-pointer ${
                  statusFilter === 'todos'
                    ? 'bg-[#dedede] text-[#3d081b] shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Todos ({selectedRecord.students.length})
              </button>
              <button
                onClick={() => setStatusFilter('pendientes')}
                className={`px-2 py-0.5 rounded text-[11px] font-black transition flex items-center gap-1 cursor-pointer ${
                  statusFilter === 'pendientes'
                    ? 'bg-amber-400 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Clock className="w-2.5 h-2.5" />
                Pendientes ({selectedRecord.pendientesCount})
              </button>
              <button
                onClick={() => setStatusFilter('recibidos')}
                className={`px-2 py-0.5 rounded text-[11px] font-black transition flex items-center gap-1 cursor-pointer ${
                  statusFilter === 'recibidos'
                    ? 'bg-emerald-500 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-2.5 h-2.5" />
                Recibidos ({selectedRecord.recibidosCount})
              </button>
            </div>

            {/* Grade Filter Chips */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-stone-400 text-[10px] font-bold mr-0.5 flex items-center gap-0.5">
                <Filter className="w-2.5 h-2.5 text-amber-400" /> Grado:
              </span>
              <button
                onClick={() => setSelectedGradeFilter(null)}
                className={`px-1.5 py-0.2 rounded text-[10px] font-black transition cursor-pointer ${
                  !selectedGradeFilter
                    ? 'bg-amber-400 text-stone-950 shadow-xs'
                    : 'bg-[#3d081b] text-stone-300 hover:text-white border border-stone-700'
                }`}
              >
                Todos
              </button>
              {gradeList.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGradeFilter(g)}
                  className={`px-1.5 py-0.2 rounded text-[10px] font-black transition cursor-pointer ${
                    selectedGradeFilter === g
                      ? 'bg-amber-400 text-stone-950 shadow-xs'
                      : 'bg-[#3d081b] text-stone-300 hover:text-white border border-stone-700'
                  }`}
                >
                  {formatGradeLabel(g)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Counter Info Bar */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-stone-300 text-[11px] font-bold bg-[#2e0513] px-2 py-0.5 rounded-md border border-stone-800">
            <span>Resultados jornada:</span>
            <span className="text-amber-300 font-black">
              {filteredSnapshots.length}
            </span>
          </div>
        </div>

        {/* Mobile View: Historical Student Cards */}
        <div className="block sm:hidden space-y-2">
          {filteredSnapshots.length === 0 ? (
            <div className="text-stone-300 text-center py-6 bg-[#2e0513] rounded-xl border border-stone-800 font-bold text-xs">
              No hay registros de estudiantes que coincidan con la búsqueda.
            </div>
          ) : (
            filteredSnapshots.map((st) => (
              <motion.div
                key={st.studentId}
                whileHover={{ scale: 1.005 }}
                className="bg-[#2e0513] border border-stone-700/80 rounded-xl p-3 shadow-md space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white font-black text-sm leading-snug break-words">
                      {st.fullName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-block bg-[#1a0209] text-stone-200 font-mono font-bold text-xs px-2 py-0.5 rounded border border-stone-800 shadow-inner">
                        Doc: {st.documentNumber}
                      </span>
                      <span className="inline-block bg-amber-400/15 text-amber-300 border border-amber-400/40 font-black text-xs px-2 py-0.5 rounded">
                        Grado {formatGradeLabel(st.grade)}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1 shadow-xs shrink-0 ${
                      st.status === 'Recibido'
                        ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                        : 'bg-stone-900/90 text-amber-400 border border-stone-700/80'
                    }`}
                  >
                    {st.status === 'Recibido' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Recibido</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Pendiente</span>
                      </>
                    )}
                  </span>
                </div>

                {st.status === 'Recibido' && (
                  <div className="bg-[#1e030c] p-2 rounded-lg border border-stone-800/90 text-xs space-y-1">
                    {st.deliveredByName && (
                      <div className="flex items-center justify-between text-stone-300">
                        <span className="text-stone-400 font-bold flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          Entregado por:
                        </span>
                        <span className="text-amber-300 font-bold truncate max-w-[180px]">
                          {st.deliveredByName}
                        </span>
                      </div>
                    )}
                    {st.deliveryTimestamp && (
                      <div className="flex items-center justify-between text-stone-400 text-[11px] pt-1 border-t border-stone-800">
                        <span>Hora de registro:</span>
                        <span className="font-mono text-stone-200 font-semibold">{st.deliveryTimestamp}</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Desktop / Tablet Historical Student Table */}
        <div className="hidden sm:block w-full overflow-x-auto bg-[#2e0513] rounded-lg border border-stone-700/80 shadow-md">
          <div className="min-w-[600px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 bg-[#1e030c] px-2.5 py-1.5 border-b border-stone-800 text-stone-300 font-black text-[10px] uppercase tracking-wider items-center">
              <div className="col-span-5">Nombre Completo</div>
              <div className="col-span-3 text-center">Documento</div>
              <div className="col-span-1 text-center">Grado</div>
              <div className="col-span-3 text-center">Estado / Entrega</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-stone-800/80">
              {filteredSnapshots.length === 0 ? (
                <div className="text-stone-300 text-center py-5 bg-[#2e0513] font-bold text-xs">
                  No hay registros de estudiantes que coincidan con la búsqueda.
                </div>
              ) : (
                filteredSnapshots.map((st) => (
                  <motion.div
                    key={st.studentId}
                    whileHover={{ backgroundColor: '#3b0619' }}
                    className="grid grid-cols-12 gap-2 items-center px-2.5 py-1.5 bg-[#2a0411] transition-colors"
                  >
                    <div className="col-span-5 flex flex-col min-w-0 pr-1">
                      <span className="text-white font-bold text-xs leading-tight truncate hover:text-amber-300 transition-colors">
                        {st.fullName}
                      </span>
                    </div>

                    <div className="col-span-3 text-center">
                      <span className="inline-block bg-[#1a0209] text-stone-200 font-mono font-bold text-[11px] px-1.5 py-0.2 rounded border border-stone-800/90 shadow-inner">
                        {st.documentNumber}
                      </span>
                    </div>

                    <div className="col-span-1 text-center">
                      <span className="inline-block bg-amber-400/15 text-amber-300 border border-amber-400/40 font-black text-[10px] px-1.5 py-0.2 rounded">
                        {formatGradeLabel(st.grade)}
                      </span>
                    </div>

                    {/* Delivery Status Column */}
                    <div className="col-span-3 flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black inline-flex items-center gap-1 shadow-xs select-none ${
                            st.status === 'Recibido'
                              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                              : 'bg-stone-900/90 text-amber-400 border border-stone-700/80'
                          }`}
                        >
                          {st.status === 'Recibido' ? (
                            <>
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Recibido</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-2.5 h-2.5 text-amber-400" />
                              <span>Pendiente</span>
                            </>
                          )}
                        </span>
                      </div>

                      {st.status === 'Recibido' && (
                        <div className="flex items-center justify-center gap-1 mt-0.5 flex-wrap max-w-full text-[9px] leading-tight">
                          {st.deliveredByName && (
                            <span
                              className="text-amber-300 font-bold flex items-center gap-0.5 bg-stone-900/90 px-1 py-0.2 rounded border border-amber-500/30 truncate max-w-[120px]"
                              title={`Entrega realizada por: ${st.deliveredByName}${st.deliveredByDoc ? ` (C.C. ${st.deliveredByDoc})` : ''}`}
                            >
                              <Truck className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                              <span className="truncate">{st.deliveredByName}</span>
                            </span>
                          )}
                          {st.deliveryTimestamp && (
                            <span className="text-stone-400 font-medium font-mono">
                              {st.deliveryTimestamp}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
