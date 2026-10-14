import React, { useState } from 'react';
import { Student } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, CheckCircle2, Clock } from 'lucide-react';

interface DeliveryStatsChartProps {
  students: Student[];
}

export const DeliveryStatsChart: React.FC<DeliveryStatsChartProps> = ({ students }) => {
  const [metricMode, setMetricMode] = useState<'percent' | 'count'>('percent');
  const grades = ['5', '6', '7', '8', '9', '10', '11'];

  const formatGradeLabel = (g: string) => {
    return `${g}°`;
  };

  const chartData = grades.map((g) => {
    const gradeStudents = students.filter((s) => s.grade === g);
    const total = gradeStudents.length;
    const recibidos = gradeStudents.filter((s) => s.status === 'Recibido').length;
    const pendientes = total - recibidos;

    const pctRecibido = total > 0 ? Math.round((recibidos / total) * 100) : 0;
    const pctPendiente = total > 0 ? 100 - pctRecibido : 0;

    const displayGrade = formatGradeLabel(g);

    return {
      grade: displayGrade,
      rawGrade: g,
      gradeFull: `Grado ${displayGrade}`,
      total,
      recibidos,
      pendientes,
      pctRecibido,
      pctPendiente,
      // For display in chart depending on active mode
      valRecibido: metricMode === 'percent' ? pctRecibido : recibidos,
      valPendiente: metricMode === 'percent' ? pctPendiente : pendientes,
    };
  });

  return (
    <div className="w-full bg-[#2e0513] p-3 sm:p-4 rounded-xl border border-stone-700/70 shadow-xl my-3 flex flex-col gap-3">
      {/* Header & Mode Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <h3 className="text-white text-sm sm:text-base font-bold tracking-wide">
            Estadísticas de Entrega por Grado
          </h3>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center bg-[#3d081b] p-0.5 rounded-lg border border-stone-700/80">
          <button
            onClick={() => setMetricMode('percent')}
            className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
              metricMode === 'percent'
                ? 'bg-[#dedede] text-[#3d081b] shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <PieIcon className="w-3 h-3" />
            <span>Porcentaje (%)</span>
          </button>
          <button
            onClick={() => setMetricMode('count')}
            className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
              metricMode === 'count'
                ? 'bg-[#dedede] text-[#3d081b] shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>Cantidad (#)</span>
          </button>
        </div>
      </div>

      {/* Recharts Bar Chart Container */}
      <div className="w-full h-44 sm:h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 8, left: -22, bottom: 0 }}
          >
            <XAxis
              dataKey="grade"
              stroke="#d6d3d1"
              fontSize={11}
              fontWeight="bold"
              tickLine={false}
            />
            <YAxis
              stroke="#d6d3d1"
              fontSize={10}
              domain={[0, metricMode === 'percent' ? 100 : 'auto']}
              unit={metricMode === 'percent' ? '%' : ''}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#3d081b] border border-amber-500/50 p-2 rounded-lg shadow-xl text-xs text-white">
                      <p className="font-extrabold text-amber-300 text-xs mb-0.5">
                        {data.gradeFull} ({data.total} estudiantes)
                      </p>
                      <div className="flex items-center gap-1.5 text-emerald-300 font-semibold my-0.5 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>
                          Recibidos: {data.recibidos} ({data.pctRecibido}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px]">
                        <Clock className="w-3 h-3" />
                        <span>
                          Pendientes: {data.pendientes} ({data.pctPendiente}%)
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              formatter={(value) => (
                <span className="text-stone-300 text-[11px] font-bold capitalize">
                  {value}
                </span>
              )}
            />
            <Bar
              name="Recibidos"
              dataKey="valRecibido"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              name="Pendientes"
              dataKey="valPendiente"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Percentage Breakdown Cards by Grade */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-0.5">
        {chartData.map((d) => (
          <div
            key={d.grade}
            className="bg-[#3d081b] p-1.5 rounded-lg border border-stone-800 flex flex-col items-center text-center shadow-inner"
          >
            <span className="text-stone-200 text-xs font-bold">
              {d.grade}
            </span>

            {/* Progress percentage bar */}
            <div className="w-full h-1.5 bg-amber-950/60 rounded-full overflow-hidden my-1 flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${d.pctRecibido}%` }}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${d.pctPendiente}%` }}
              />
            </div>

            <div className="flex items-center justify-between w-full text-[10px] font-semibold px-0.5">
              <span className="text-emerald-400 font-bold">{d.pctRecibido}%</span>
              <span className="text-stone-400">({d.recibidos}/{d.total})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
