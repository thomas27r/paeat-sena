import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Student, Grade } from '../types';
import { Search, GraduationCap, Users } from 'lucide-react';
import { AvatarImage } from '../components/AvatarImage';
import { matchStudent } from '../utils/search';
import { motion } from 'motion/react';
import { playTapSound } from '../utils/audio';

interface GradeSelectViewProps {
  students?: Student[];
  onBack: () => void;
  onSelectGrade: (grade: Grade | null) => void;
  onSearchStudentName?: (name: string) => void;
  onOpenSettings?: () => void;
}

export const GradeSelectView: React.FC<GradeSelectViewProps> = ({
  students = [],
  onBack,
  onSelectGrade,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const grades: Grade[] = ['5', '6', '7', '8', '9', '10', '11'];

  const matchedStudents = searchTerm.trim()
    ? students.filter((s) => matchStudent(s, searchTerm))
    : [];

  const handleSelect = (g: Grade | null) => {
    playTapSound();
    onSelectGrade(g);
  };

  const formatGradeLabel = (g: Grade) => {
    return `${g}°`;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#3d081b] via-[#2f0615] to-[#1e030c] flex flex-col pb-16">
      <Header showBack onBack={onBack} />

      <main className="flex-1 flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 py-6 max-w-md mx-auto w-full animate-in fade-in zoom-in-95 duration-200">
        {/* Search input */}
        <div className="w-full flex flex-col items-center gap-1.5 mb-2.5 relative">
          <div className="w-full flex items-center justify-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 shadow-xs">
              <Search className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="bg-[#dedede] rounded-xl px-3 py-1.5 shadow-md flex-1 border border-stone-300">
              <input
                type="text"
                placeholder="Buscar por nombre o doc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-stone-900 placeholder-stone-600 font-bold outline-hidden w-full text-center text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Live Matching Students Dropdown */}
          {searchTerm.trim() !== '' && (
            <div className="w-full bg-[#2e0513] border border-amber-500/50 rounded-xl p-2 shadow-2xl max-h-48 overflow-y-auto z-20 absolute top-12">
              <p className="text-stone-300 text-[10px] font-bold mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-amber-400" />
                <span>Resultados ({matchedStudents.length}):</span>
              </p>
              {matchedStudents.length === 0 ? (
                <p className="text-stone-400 text-xs italic text-center py-2">
                  No se encontró ningún estudiante
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {matchedStudents.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleSelect(st.grade)}
                      className="flex items-center gap-2 bg-[#3d081b] hover:bg-[#4d0c24] p-1.5 rounded-lg text-left transition cursor-pointer border border-stone-800"
                    >
                      <AvatarImage src={st.avatarUrl} alt={st.fullName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-black truncate">
                          {st.fullName}
                        </p>
                        <p className="text-stone-400 text-[10px] font-semibold">
                          Doc: {st.documentNumber}
                        </p>
                      </div>
                      <span className="bg-amber-400 text-stone-950 font-black text-[11px] px-2 py-0.5 rounded-md">
                        {formatGradeLabel(st.grade)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-white text-lg sm:text-xl font-black tracking-wide mb-2 flex items-center gap-1.5">
          <GraduationCap className="w-5 h-5 text-amber-400" />
          <span>Seleccionar Grado</span>
        </h2>

        {/* 2-Column Grade list box */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-[340px] bg-[#dedede] rounded-2xl p-2.5 sm:p-3 shadow-xl border-2 border-[#3d081b] flex flex-col gap-1.5"
        >
          <div className="grid grid-cols-2 gap-1.5">
            {grades.map((g) => {
              const count = students.filter((s) => s.grade === g).length;
              return (
                <motion.button
                  key={g}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleSelect(g)}
                  className="w-full text-[#3d081b] bg-stone-200/80 hover:bg-stone-300 py-1.5 px-2 rounded-lg font-black text-xs sm:text-sm text-center transition cursor-pointer flex items-center justify-between border border-stone-300 shadow-xs"
                >
                  <span>Grado {formatGradeLabel(g)}</span>
                  <span className="text-[10px] text-stone-600 font-bold bg-white/90 px-1 py-0.2 rounded">
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleSelect(null)}
            className="w-full bg-[#3d081b] hover:bg-[#4d0a22] text-amber-300 py-2 rounded-lg font-black text-xs uppercase tracking-wider text-center transition cursor-pointer mt-0.5 shadow-xs"
          >
            Todos los grados ({students.length})
          </motion.button>
        </motion.div>
      </main>
    </div>
  );
};

