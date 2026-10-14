import React from 'react';

interface InstitutionLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export const InstitutionLogo: React.FC<InstitutionLogoProps> = ({
  size = 'md',
  className = '',
  showText = true,
}) => {
  const dimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`${dimensions[size]} rounded-lg bg-stone-900 text-amber-400 border border-amber-500/40 p-1 flex items-center justify-center shadow-sm shrink-0`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full"
        >
          {/* Institutional Shield & Book */}
          <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
          <path d="M12 7v8" />
          <path d="M8 11l4-2 4 2" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[11px] sm:text-xs font-black tracking-wide uppercase text-stone-100">
            I.E. EMPRESARIAL
          </span>
          <span className="text-[9px] font-semibold text-amber-400/90 tracking-wider">
            DOSQUEBRADAS · RISARALDA
          </span>
        </div>
      )}
    </div>
  );
};
