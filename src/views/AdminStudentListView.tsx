import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Student, Grade } from '../types';
import { matchStudent, matchStudentFilters } from '../utils/search';
import { Download, CheckCircle2, Clock, FileSpreadsheet, FileText, Search, Filter, RotateCcw, Truck } from 'lucide-react';
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

interface AdminStudentListViewProps {
  students: Student[];
  initialFilters?: { nombre: string; documento: string; grupo: string };
  onBack: () => void;
  onOpenSettings: () => void;
}

export const AdminStudentListView: React.FC<AdminStudentListViewProps> = ({
  students,
  initialFilters,
  onBack,
  onOpenSettings,
}) => {
  const [searchTerm, setSearchTerm] = useState(
    initialFilters?.nombre || initialFilters?.documento || ''
  );
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<Grade | null>(
    (initialFilters?.grupo as Grade) || null
  );
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendientes' | 'recibidos'>('todos');
  const [csvSuccess, setCsvSuccess] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  const gradeList: Grade[] = ['5', '6', '7', '8', '9', '10', '11'];

  const formatGradeLabel = (g: string) => {
    return `${g}°`;
  };

  const filteredStudents = students.filter((st) => {
    const passesInitial = matchStudentFilters(st, initialFilters);
    const passesLiveSearch = matchStudent(st, searchTerm);
    const matchesGrade = !selectedGradeFilter || st.grade === selectedGradeFilter;
    const matchesStatus =
      statusFilter === 'todos'
        ? true
        : statusFilter === 'recibidos'
        ? st.status === 'Recibido'
        : st.status !== 'Recibido';

    return passesInitial && passesLiveSearch && matchesGrade && matchesStatus;
  });

  const totalFiltered = filteredStudents.length;
  const recibidosCount = students.filter((s) => s.status === 'Recibido').length;
  const pendientesCount = students.length - recibidosCount;
  const filteredRecibidos = filteredStudents.filter((s) => s.status === 'Recibido').length;
  const filteredPendientes = totalFiltered - filteredRecibidos;
  const filteredPct = totalFiltered > 0 ? Math.round((filteredRecibidos / totalFiltered) * 100) : 0;

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedGradeFilter(null);
    setStatusFilter('todos');
  };

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;

    const headers = ['ID', 'Nombre Completo', 'Número Documento', 'Grado', 'Estado Entrega', 'Fecha/Hora Entrega', 'Repartidor / Entregado Por', 'Doc Repartidor'];
    const rows = filteredStudents.map((st) => [
      st.id,
      `"${st.fullName.replace(/"/g, '""')}"`,
      `"${st.documentNumber}"`,
      `"${formatGradeLabel(st.grade)}"`,
      `"${st.status || 'Pendiente'}"`,
      `"${st.deliveryTimestamp || 'No registrada'}"`,
      `"${st.status === 'Recibido' ? (st.deliveredByName || 'Repartidor Autorizado') : ''}"`,
      `"${st.status === 'Recibido' ? (st.deliveredByDoc || '') : ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_entregas_estudiantes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCsvSuccess(true);
    setTimeout(() => setCsvSuccess(false), 3000);
  };

  const handleExportPDF = () => {
    if (filteredStudents.length === 0) return;

    const doc = new jsPDF();
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const folioStr = `EST-${dateStamp}-${Math.floor(1000 + Math.random() * 9000)}`;

    const filterDescription = selectedGradeFilter ? `Grado ${selectedGradeFilter}°` : 'Todos los Grados';
    const statusDesc = statusFilter === 'recibidos' ? 'Solo Entregados' : statusFilter === 'pendientes' ? 'Solo Pendientes' : 'Todos los Estados';

    let currentY = drawInstitutionalHeader(
      doc,
      'Reporte Oficial de Estudiantes y Estado de Entrega',
      'Institución Educativa Empresarial · PAEAT',
      folioStr,
      [
        `Filtro de Grado: ${filterDescription}`,
        `Filtro de Estado: ${statusDesc}`,
        `Registros Filtrados: ${filteredStudents.length}`,
      ]
    );

    // Summary Cards
    currentY = drawSummaryMetricCards(doc, currentY, [
      { title: 'Total en Reporte', value: totalFiltered, color: 'wine', sub: 'Estudiantes en vista' },
      { title: 'Raciones Entregadas', value: filteredRecibidos, color: 'green', sub: 'Reclamaron refrigerio' },
      { title: 'Pendientes', value: filteredPendientes, color: 'amber', sub: 'Por entregar' },
      { title: '% Efectividad', value: `${filteredPct}%`, color: filteredPct >= 80 ? 'green' : 'amber', sub: 'Tasa de cumplimiento' },
    ]);

    // Section 1: Detailed List
    currentY = drawSectionTitle(doc, currentY, 'PLANILLA DETALLADA DE CONTROL DE BENEFICIARIOS');

    const tableColumn = ['#', 'Nombre Completo del Estudiante', 'Documento', 'Grado', 'Estado', 'Hora Entrega', 'Entregado Por'];
    const tableRows = filteredStudents.map((st, idx) => [
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
      head: [tableColumn],
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

    // Apply Institutional Page Footers & Running Page Count
    applyPageFooters(doc, 'Reporte Oficial de Beneficiarios PAEAT');

    doc.save(`Reporte_PAEAT_Estudiantes_${new Date().toISOString().slice(0, 10)}.pdf`);
    setPdfSuccess(true);
    setTimeout(() => setPdfSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3d081b] via-[#2f0615] to-[#1e030c] flex flex-col pb-24 sm:pb-16">
      <Header
        showBack
        onBack={onBack}
        showSettings
        onSettings={onOpenSettings}
      />

      <main className="flex-1 p-2 sm:p-3 max-w-5xl mx-auto w-full animate-in fade-in duration-200">
        
        {/* Compact View Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 mb-2">
          <div>
            <h1 className="text-sm sm:text-base font-black text-white tracking-wide leading-tight flex items-center gap-1.5">
              <span>Listado General de Estudiantes</span>
              <span className="text-[10px] bg-stone-800/80 text-amber-300 px-1.5 py-0.2 rounded border border-stone-700 font-mono">
                {totalFiltered} de {students.length}
              </span>
            </h1>
            <p className="text-stone-300 text-[11px] font-medium">
              Consulta el estado de entrega en tiempo real y descarga reportes
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportCSV}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 font-black rounded-md py-1 px-2.5 text-xs flex items-center justify-center gap-1 border border-stone-600 shadow-xs cursor-pointer transition-all"
              title="Exportar reporte en formato Excel/CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{csvSuccess ? '¡Listo!' : 'Excel'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportPDF}
              className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-md py-1 px-2.5 text-xs flex items-center justify-center gap-1 border border-amber-300 shadow-xs cursor-pointer transition-all"
              title="Exportar reporte oficial en formato PDF"
            >
              <Download className="w-3.5 h-3.5 text-stone-950" />
              <span>{pdfSuccess ? '¡Listo!' : 'PDF Oficial'}</span>
            </motion.button>
          </div>
        </div>

        {/* Compact Filter Box */}
        <div className="mb-2 bg-[#2e0513] p-1.5 rounded-lg border border-stone-700/80 shadow-xs flex flex-col sm:flex-row gap-1.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o número de documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1e030c] text-white pl-8 pr-3 py-1 rounded-md border border-stone-800 text-xs font-medium outline-hidden focus:ring-1 focus:ring-amber-400 shadow-inner"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1 bg-[#1e030c] px-2 py-0.5 rounded-md border border-stone-800 shrink-0">
              <Filter className="w-3 h-3 text-stone-400" />
              <select
                value={selectedGradeFilter || ''}
                onChange={(e) => setSelectedGradeFilter(e.target.value ? (e.target.value as Grade) : null)}
                className="bg-transparent text-white text-xs font-bold outline-hidden cursor-pointer"
              >
                <option value="" className="bg-[#1e030c] text-white">Todos los Grados</option>
                {gradeList.map((g) => (
                  <option key={g} value={g} className="bg-[#1e030c] text-white">
                    Grado {g}°
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-[#1e030c] px-2 py-0.5 rounded-md border border-stone-800 shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'pendientes' | 'recibidos')}
                className="bg-transparent text-white text-xs font-bold outline-hidden cursor-pointer"
              >
                <option value="todos" className="bg-[#1e030c] text-white">Todos los Estados</option>
                <option value="recibidos" className="bg-[#1e030c] text-emerald-400">Recibidos ({recibidosCount})</option>
                <option value="pendientes" className="bg-[#1e030c] text-amber-400">Pendientes ({pendientesCount})</option>
              </select>
            </div>

            {(searchTerm || selectedGradeFilter || statusFilter !== 'todos') && (
              <button
                onClick={handleResetFilters}
                className="text-stone-400 hover:text-white p-1 rounded-md hover:bg-stone-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                title="Limpiar todos los filtros"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile View: Responsive Cards List */}
        <div className="block sm:hidden space-y-2">
          {filteredStudents.length === 0 ? (
            <div className="py-8 text-center text-stone-400 bg-[#2e0513] rounded-xl border border-stone-800">
              <FileText className="w-7 h-7 mx-auto text-stone-500 mb-1.5" />
              <p className="font-bold text-xs">No se encontraron estudiantes con los filtros aplicados</p>
            </div>
          ) : (
            filteredStudents.map((student, index) => {
              const isReceived = student.status === 'Recibido';
              return (
                <motion.div
                  key={student.id}
                  whileHover={{ scale: 1.005 }}
                  className="bg-[#2e0513] border border-stone-700/80 rounded-xl p-3 shadow-md space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-stone-400 font-bold">
                          #{index + 1}
                        </span>
                        <h3 className="text-white font-black text-sm leading-snug break-words">
                          {student.fullName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="inline-block bg-[#1a0209] text-stone-200 font-mono font-bold text-xs px-2 py-0.5 rounded border border-stone-800 shadow-inner">
                          Doc: {student.documentNumber}
                        </span>
                        <span className="inline-block bg-amber-400/15 text-amber-300 border border-amber-400/40 font-black text-xs px-2 py-0.5 rounded">
                          Grado {formatGradeLabel(student.grade)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1 shadow-xs shrink-0 ${
                        isReceived
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                          : 'bg-stone-900/90 text-amber-400 border border-stone-700/80'
                      }`}
                    >
                      {isReceived ? (
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

                  {isReceived && (
                    <div className="bg-[#1e030c] p-2 rounded-lg border border-stone-800 text-xs space-y-1">
                      {student.deliveredByName && (
                        <div className="flex items-center justify-between text-stone-300">
                          <span className="text-stone-400 font-bold flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            Entregado por:
                          </span>
                          <span className="text-amber-300 font-bold truncate max-w-[180px]">
                            {student.deliveredByName}
                          </span>
                        </div>
                      )}
                      {student.deliveryTimestamp && (
                        <div className="flex items-center justify-between text-stone-400 text-[11px] pt-1 border-t border-stone-800">
                          <span>Hora de entrega:</span>
                          <span className="font-mono text-stone-200 font-semibold">{student.deliveryTimestamp}</span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* Desktop / Tablet Compact Table */}
        <div className="hidden sm:block w-full overflow-x-auto bg-[#2e0513] rounded-lg border border-stone-700/80 shadow-md">
          <div className="min-w-[620px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-1.5 bg-[#1e030c] px-2.5 py-1.5 text-stone-300 font-black text-[10px] sm:text-xs uppercase tracking-wider border-b border-stone-700/80">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">Nombre Completo</div>
              <div className="col-span-2 text-center">Documento</div>
              <div className="col-span-1 text-center">Grado</div>
              <div className="col-span-2 text-center">Estado</div>
              <div className="col-span-2 text-center">Hora / Repartidor</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-stone-800">
              {filteredStudents.length === 0 ? (
                <div className="py-8 text-center text-stone-400">
                  <FileText className="w-7 h-7 mx-auto text-stone-500 mb-1.5" />
                  <p className="font-bold text-xs">No se encontraron estudiantes con los filtros aplicados</p>
                </div>
              ) : (
                filteredStudents.map((student, index) => {
                  const isReceived = student.status === 'Recibido';
                  return (
                    <div
                      key={student.id}
                      className={`grid grid-cols-12 gap-1.5 items-center px-2.5 py-1.5 text-xs transition-colors hover:bg-white/5 ${
                        isReceived ? 'bg-emerald-950/15' : 'bg-transparent'
                      }`}
                    >
                      <div className="col-span-1 text-center font-mono text-[10px] text-stone-400">
                        {index + 1}
                      </div>

                      <div className="col-span-4 truncate font-bold text-white text-xs">
                        {student.fullName}
                      </div>

                      <div className="col-span-2 text-center font-mono text-[11px] text-stone-300">
                        {student.documentNumber}
                      </div>

                      <div className="col-span-1 text-center">
                        <span className="font-bold text-[10px] bg-stone-800 text-amber-300 px-1.5 py-0.2 rounded border border-stone-700 font-mono">
                          {formatGradeLabel(student.grade)}
                        </span>
                      </div>

                      <div className="col-span-2 flex justify-center">
                        {isReceived ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.2 rounded-full">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Recibido</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-1.5 py-0.2 rounded-full">
                            <Clock className="w-2.5 h-2.5 text-amber-400" />
                            <span>Pendiente</span>
                          </span>
                        )}
                      </div>

                      <div className="col-span-2 text-center text-[10.5px]">
                        {isReceived ? (
                          <div className="flex flex-col items-center">
                            <span className="font-mono text-stone-300 text-[10px]">
                              {student.deliveryTimestamp || 'Registrado'}
                            </span>
                            {student.deliveredByName && (
                              <span className="text-[9px] text-amber-300/90 font-medium truncate max-w-[110px] flex items-center gap-0.5" title={`Repartidor: ${student.deliveredByName} (${student.deliveredByDoc || ''})`}>
                                <Truck className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                <span className="truncate">{student.deliveredByName}</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-500 font-mono text-[10px]">-</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};
