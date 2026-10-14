import React from 'react';
import { Header } from '../components/Header';
import { UserRole } from '../types';
import { PaeatLogo } from '../components/PaeatLogo';
import {
  Mail,
  Globe,
  Phone,
  Inbox,
  ExternalLink,
  Award,
  Code2,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';

interface ContactsViewProps {
  onBack: () => void;
  onOpenPqrForm?: () => void;
  onOpenPqrInbox?: () => void;
  userRole?: UserRole;
  onOpenSettings?: () => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  onBack,
  onOpenPqrInbox,
  userRole = 'guest',
  onOpenSettings,
}) => {
  const isAdmin = userRole === 'admin';

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#3d081b] via-[#2f0615] to-[#1e030c] flex flex-col">
      <Header
        showBack
        onBack={onBack}
        showSettings={isAdmin}
        onSettings={isAdmin ? onOpenSettings : undefined}
      />

      <main className="flex-1 flex flex-col items-center justify-start p-3 sm:p-4 max-w-xl mx-auto w-full pb-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full space-y-4"
        >
          {/* Header */}
          <div className="text-center space-y-1 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-[#1e030c] text-amber-300 flex items-center justify-center shadow-md mb-1 border border-stone-700 p-1.5">
              <PaeatLogo size="md" />
            </div>
            <div className="inline-flex items-center gap-1.5 bg-amber-400/15 border border-amber-400/30 text-amber-300 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Atención al Usuario & Créditos</span>
            </div>
            <h2 className="text-white text-xl sm:text-2xl font-black tracking-wide">
              Contactos y Créditos PAEAT
            </h2>
            <p className="text-stone-300 text-xs font-medium">
              Canales de soporte, novedades y reconocimientos institucionales del PAEAT
            </p>
          </div>

          {/* Section 1: Contact Channels */}
          <div className="space-y-2">
            <span className="text-stone-400 text-[10px] font-black uppercase tracking-wider px-1 block flex items-center gap-1">
              <Phone className="w-3 h-3 text-amber-400" />
              <span>Canales de Contacto Directo</span>
            </span>

            <div className="w-full flex flex-col gap-2">
              {/* WhatsApp / Phone */}
              <motion.a
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                href="https://wa.me/573003577185"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between group cursor-pointer bg-[#2e0513] p-2.5 rounded-xl border border-stone-700/60 hover:border-amber-400/50 transition-all shadow-md"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-emerald-950 text-emerald-300 rounded-lg flex items-center justify-center shrink-0 border border-emerald-700/60 shadow-xs">
                    <Phone className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                      Teléfono / WhatsApp
                    </span>
                    <span className="text-white font-black text-xs sm:text-sm tracking-wide">
                      +57 300 3577185
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-300 transition-colors" />
              </motion.a>

              {/* Email */}
              <motion.a
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                href="mailto:tom.marin27@gmail.com"
                className="flex items-center justify-between group cursor-pointer bg-[#2e0513] p-2.5 rounded-xl border border-stone-700/60 hover:border-amber-400/50 transition-all shadow-md"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-amber-950 text-amber-300 rounded-lg flex items-center justify-center shrink-0 border border-amber-700/60 shadow-xs">
                    <Mail className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                      Correo Electrónico
                    </span>
                    <span className="text-white font-black text-xs sm:text-sm tracking-wide truncate">
                      tom.marin27@gmail.com
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-300 transition-colors" />
              </motion.a>
            </div>
          </div>

          {/* Admin PQR Inbox Link (Only visible to admin) */}
          {isAdmin && onOpenPqrInbox && (
            <div className="w-full bg-[#2e0513] border border-amber-500/40 p-3 rounded-xl text-center flex flex-col items-center gap-2 shadow-md">
              <p className="text-stone-300 text-xs font-medium">
                Las PQRs y novedades enviadas por los repartidores se reciben en su buzón de administración.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={onOpenPqrInbox}
                className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-lg py-2 px-4 text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Inbox className="w-4 h-4 stroke-[2.2]" />
                <span>Abrir Buzón de PQRs</span>
              </motion.button>
            </div>
          )}

          {/* Section 3: Institutional & Development Credits (Visible to Repartidores and Admins) */}
          <div className="space-y-2 pt-2 border-t border-stone-800">
            <span className="text-stone-400 text-[10px] font-black uppercase tracking-wider px-1 block flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Créditos del Proyecto y Reconocimiento</span>
            </span>

            {/* Developers Card */}
            <div className="bg-[#2e0513] p-3.5 rounded-xl border border-amber-400/40 shadow-lg space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-800">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-stone-950 font-black flex items-center justify-center shrink-0">
                  <Code2 className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 block">
                    Desarrollo y Creación de Software
                  </span>
                  <h3 className="text-white font-black text-xs sm:text-sm">
                    Autores y Desarrolladores
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-[#1e030c] p-2.5 rounded-lg border border-stone-800 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-amber-400/20 text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                    TM
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xs">
                      Thomas Marin Restrepo
                    </h4>
                    <span className="text-stone-400 text-[10px]">
                      Desarrollador / Creador
                    </span>
                  </div>
                </div>

                <div className="bg-[#1e030c] p-2.5 rounded-lg border border-stone-800 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-amber-400/20 text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                    JM
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xs">
                      Joel Estiven Mendoza Ballesteros
                    </h4>
                    <span className="text-stone-400 text-[10px]">
                      Desarrollador / Creador
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Institution & Vocational Framework Card */}
            <div className="bg-[#2e0513] p-3.5 rounded-xl border border-stone-800 shadow-lg space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-800">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0 border border-emerald-500/40">
                  <GraduationCap className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 block">
                    Marco Institucional y Formativo
                  </span>
                  <h3 className="text-white font-black text-xs sm:text-sm">
                    Institución Educativa y Modalidad
                  </h3>
                </div>
              </div>

              <p className="text-stone-300 text-xs leading-relaxed">
                Este software ha sido diseñado para la <strong className="text-white">Institución Educativa Empresarial</strong> de Dosquebradas, mediante un proyecto formativo de la modalidad <strong className="text-amber-300">Conexión Vocacional</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* I.E. Empresarial Link */}
                <a
                  href="https://www.ieempresarial.edu.co/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1e030c] hover:bg-[#3b0619] p-2.5 rounded-lg border border-stone-800 hover:border-amber-400/50 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-white font-bold text-xs block group-hover:text-amber-300 transition-colors truncate">
                        I.E. Empresarial
                      </span>
                      <span className="text-stone-400 text-[10px] truncate block">
                        www.ieempresarial.edu.co
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-300 shrink-0 transition-colors" />
                </a>

                {/* Conexion Vocacional Link */}
                <a
                  href="https://www.dosquebradas.gov.co/web/dosquebradas/ciudad/sala-de-prensa/noticias/301-vigencia-2025/8314-conexion-vocacional-la-estrategia-que-revoluciona-la-educacion-tecnica-en-dosquebradas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1e030c] hover:bg-[#3b0619] p-2.5 rounded-lg border border-stone-800 hover:border-amber-400/50 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-white font-bold text-xs block group-hover:text-amber-300 transition-colors truncate">
                        Conexión Vocacional
                      </span>
                      <span className="text-stone-400 text-[10px] truncate block">
                        Estrategia Dosquebradas
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-300 shrink-0 transition-colors" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
