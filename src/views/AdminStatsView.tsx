import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Student, Grade } from '../types';
import { DeliveryStatsChart } from '../components/DeliveryStatsChart';
import { BarChart3, Download, FileSpreadsheet, FileText, CheckCircle2, Clock, Users } from 'lucide-react';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { playSuccessSound } from '../utils/audio';
import {
  drawInstitutionalHeader,
  drawSummaryMetricCards,
  drawSectionTitle,
  applyPageFooters,
  drawSignatureBoxes,
  PDF_COLORS,
} from '../utils/pdfGenerator';

interface AdminStatsViewProps {
  students: Student[];
  onBack: () => void;
  onOpenSettings: () => void;
  onGoHome?: () => void;
}

export const AdminStatsView: React.FC<AdminStatsViewProps> = ({
  students,
  onBack,
  onOpenSettings,
  onGoHome,
}) => {
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState(false);

  const total = students.length;
  const recibidosCount = students.filter((s) => s.status === 'Recibido').length;
  const pendientesCount = total - recibidosCount;
  const globalPct = total > 0 ? Math.round((recibidosCount / total) * 100) : 0;

  const grades: Grade[] = ['5', '6', '7', '8', '9', '10', '11'];

  const formatGradeLabel = (g: string) => {
    return `${g}°`;
  };

  const gradeStats = grades.map((g) => {
    const list = students.filter((s) => s.grade === g);
    const tot = list.length;
    const rec = list.filter((s) => s.status === 'Recibido').length;
    const pen = tot - rec;
    const pct = tot > 0 ? Math.round((rec / tot) * 100) : 0;
    return { grade: g, label: formatGradeLabel(g), total: tot, recibidos: rec, pendientes: pen, pct };
  });

  const handleExportPDF = () => {
    if (students.length === 0) return;

    const doc = new jsPDF();
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const folioStr = `ESTAD-${dateStamp}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Banner Header
    let currentY = drawInstitutionalHeader(
      doc,
      'Informe Ejecutivo y Estadístico de Control de Raciones',
      'Institución Educativa Empresarial · PAEAT',
      folioStr,
      [
        `Total Estudiantes: ${total}`,
        `Entregas Efectivas: ${recibidosCount} (${globalPct}%)`,
        `Estado: Consolidado General`,
      ]
    );

    // Metric cards
    currentY = drawSummaryMetricCards(doc, currentY, [
      { title: 'Población Objetivo', value: total, color: 'wine', sub: 'Matrícula Total' },
      { title: 'Raciones Entregadas', value: recibidosCount, color: 'green', sub: `${globalPct}% de Cobertura` },
      { title: 'Raciones Pendientes', value: pendientesCount, color: 'amber', sub: `${100 - globalPct}% Restante` },
      { title: 'Índice de Efectividad', value: `${globalPct}%`, color: globalPct >= 80 ? 'green' : 'amber', sub: 'Desempeño Global' },
    ]);

    // Table 1: Grade Breakdown
    currentY = drawSectionTitle(doc, currentY, '1. RESUMEN ESTADÍSTICO POR GRADO ESCOLAR');

    const gradeColumns = ['Grado Escolar', 'Total Asignado', 'Raciones Entregadas', 'Pendientes', '% Cumplimiento'];
    const gradeRows: (string | number)[][] = gradeStats.map((s) => [
      `Grado ${s.label}`,
      s.total,
      s.recibidos,
      s.pendientes,
      `${s.pct}%`,
    ]);

    // Total row
    gradeRows.push([
      'TOTAL GENERAL',
      total,
      recibidosCount,
      pendientesCount,
      `${globalPct}%`,
    ]);

    autoTable(doc, {
      head: [gradeColumns],
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

    // Table 2: Detailed Student List
    const table1FinalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || currentY + 40;
    currentY = table1FinalY + 6;

    currentY = drawSectionTitle(doc, currentY, '2. DETALLE GENERAL DE BENEFICIARIOS Y ENTREGAS');

    const studentColumns = ['#', 'Nombre Completo del Estudiante', 'Documento', 'Grado', 'Estado', 'Fecha/Hora Entrega', 'Repartidor / Responsable'];
    const studentRows = students.map((st, idx) => [
      (idx + 1).toString(),
      st.fullName,
      st.documentNumber,
      formatGradeLabel(st.grade),
      st.status || 'Pendiente',
      st.deliveryTimestamp || 'No registrada',
      st.status === 'Recibido'
        ? (st.deliveredByName ? `${st.deliveredByName} (${st.deliveredByDoc || ''})` : 'Repartidor Autorizado')
        : '-',
    ]);

    autoTable(doc, {
      head: [studentColumns],
      body: studentRows,
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
          if (data.cell.raw === 'Recibido') {
            data.cell.styles.textColor = PDF_COLORS.success;
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = PDF_COLORS.warning;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    // Signature boxes
    const finalTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 200;
    drawSignatureBoxes(doc, finalTableY);

    // Page footers
    applyPageFooters(doc, 'Informe Estadístico Oficial PAEAT');

    doc.save(`Estadisticas_Reporte_PAEAT_${new Date().toISOString().slice(0, 10)}.pdf`);
    playSuccessSound();
    setPdfSuccess(true);
    setTimeout(() => setPdfSuccess(false), 3000);
  };

  const handleExportCSV = () => {
    if (students.length === 0) return;

    playSuccessSound();

    const summarySection = [
      '--- RESUMEN GENERAL DE ESTADÍSTICAS ---',
      `Total Estudiantes,${total}`,
      `Entregas Recibidas,${recibidosCount}`,
      `Entregas Pendientes,${pendientesCount}`,
      `Porcentaje Global Cumplimiento,${globalPct}%`,
      '',
      '--- DESGLOSE POR GRADO ---',
      'Grado,Total,Recibidos,Pendientes,Porcentaje Cumplimiento',
      ...gradeStats.map((g) => `${g.grade}°,${g.total},${g.recibidos},${g.pendientes},${g.pct}%`),
      '',
      '--- DETALLE INDIVIDUAL DE ESTUDIANTES ---',
      'ID,Nombre Completo,Documento,Grado,Estado Entrega,Fecha/Hora Entrega',
      ...students.map(
        (st) =>
          `${st.id},"${st.fullName.replace(/"/g, '""')}","${st.documentNumber}","${st.grade}°","${
            st.status || 'Pendiente'
          }","${st.deliveryTimestamp || 'No registrada'}"`
      ),
    ];

    const csvContent = '\uFEFF' + summarySection.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_estadisticas_paeat_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCsvSuccess(true);
    setTimeout(() => setCsvSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#3d081b] flex flex-col pb-24 sm:pb-16">
      <Header showBack onBack={onBack} showSettings onSettings={onOpenSettings} onLogoClick={onGoHome} />

      <main className="flex-1 p-2.5 sm:p-3.5 max-w-5xl mx-auto w-full animate-in fade-in duration-200">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 my-2 border-b border-stone-800 pb-2">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-white text-lg sm:text-xl font-black tracking-wide flex items-center gap-1.5">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <span>Estadísticas y Reportes</span>
              </h2>
              <p className="text-stone-300 text-[11px] sm:text-xs">
                Monitoreo detallado de entregas del Programa PAEAT
              </p>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleExportPDF}
              className="flex items-center gap-1 bg-red-800 hover:bg-red-700 text-white font-black text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer border border-red-500/50"
            >
              <FileText className="w-3.5 h-3.5 text-red-200" />
              <span>{pdfSuccess ? '¡Listo!' : 'PDF'}</span>
              <Download className="w-3 h-3 ml-0.5 opacity-80" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleExportCSV}
              className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer border border-emerald-400/50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>{csvSuccess ? '¡Listo!' : 'CSV'}</span>
              <Download className="w-3 h-3 ml-0.5 opacity-80" />
            </motion.button>
          </div>
        </div>

        {/* Global Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-2.5">
          <div className="bg-[#2e0513] p-3 rounded-xl border border-stone-700/60 shadow-md flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-stone-300 text-[10px] font-bold uppercase block">
                Total Estudiantes
              </span>
              <span className="text-white text-xl font-black">{total}</span>
            </div>
          </div>

          <div className="bg-[#2e0513] p-3 rounded-xl border border-stone-700/60 shadow-md flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-emerald-300 text-[10px] font-bold uppercase block">
                Entregas Recibidas
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-emerald-400 text-xl font-black">{recibidosCount}</span>
                <span className="text-emerald-300 text-[10px] font-extrabold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-700">
                  {globalPct}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#2e0513] p-3 rounded-xl border border-stone-700/60 shadow-md flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-amber-200 text-[10px] font-bold uppercase block">
                Entregas Pendientes
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-stone-200 text-xl font-black">{pendientesCount}</span>
                <span className="text-amber-300 text-[10px] font-extrabold bg-amber-950 px-1.5 py-0.5 rounded border border-amber-700">
                  {100 - globalPct}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Chart Component */}
        <DeliveryStatsChart students={students} />

        {/* Detailed Grade Breakdown Table */}
        <div className="w-full bg-[#2e0513] p-3 sm:p-4 rounded-xl border border-stone-700/70 shadow-lg my-3">
          <h3 className="text-white text-sm sm:text-base font-bold tracking-wide mb-2.5">
            Tabla Detallada por Grado Escolar
          </h3>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-stone-200 text-xs">
              <thead>
                <tr className="border-b border-stone-700 text-amber-300 text-[10px] font-bold uppercase">
                  <th className="pb-2 px-2.5">Grado</th>
                  <th className="pb-2 px-2.5 text-center">Total</th>
                  <th className="pb-2 px-2.5 text-center">Recibidos</th>
                  <th className="pb-2 px-2.5 text-center">Pendientes</th>
                  <th className="pb-2 px-2.5 text-center">% Cumplimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 font-semibold">
                {gradeStats.map((st) => (
                  <tr key={st.grade} className="hover:bg-[#3d081b]/60 transition">
                    <td className="py-2 px-2.5 font-black text-white text-xs sm:text-sm">
                      Grado {st.label}
                    </td>
                    <td className="py-2 px-2.5 text-center text-stone-300">{st.total}</td>
                    <td className="py-2 px-2.5 text-center text-emerald-400 font-bold">
                      {st.recibidos}
                    </td>
                    <td className="py-2 px-2.5 text-center text-amber-400 font-bold">
                      {st.pendientes}
                    </td>
                    <td className="py-2 px-2.5 text-center">
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/80 px-2 py-0.5 rounded text-[11px] font-black">
                        {st.pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
