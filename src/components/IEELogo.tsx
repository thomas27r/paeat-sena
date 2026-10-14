import React from 'react';

interface IEELogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

/**
 * Official Emblem of Institución Educativa Empresarial (I.E.E.)
 * High-fidelity scalable vector reproduction of the school emblem:
 * - Red outer circular ring
 * - Radio waves at the top
 * - Center beacon with letter "I"
 * - Flanking letters "E" (Left) and "E" (Right)
 * - Industrial factory sawtooth silhouette
 * - Industrial cogwheel / gear
 * - Yellow & Green open book base
 */
export const IEELogo: React.FC<IEELogoProps> = ({
  className = 'w-10 h-10',
  size,
  showText = false,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`} style={style}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm shrink-0"
        aria-label="Escudo Institución Educativa Empresarial"
      >
        {/* Outer Circular Ring */}
        <circle cx="100" cy="100" r="94" fill="#E51A1A" />
        <circle cx="100" cy="100" r="76" fill="#FFFFFF" />

        {/* Radio Waves at Top */}
        <path
          d="M 68 64 A 40 40 0 0 1 132 64"
          stroke="#E51A1A"
          strokeWidth="6.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 78 64 A 26 26 0 0 1 122 64"
          stroke="#E51A1A"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Center Trapezoid / Beacon */}
        <polygon
          points="86,60 114,60 130,140 70,140"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2.5"
        />

        {/* Red Letter 'I' inside Beacon */}
        <g fill="#E51A1A" stroke="#111111" strokeWidth="1.2">
          {/* Top serif */}
          <rect x="91" y="65" width="18" height="4.5" rx="0.5" />
          {/* Vertical stem */}
          <rect x="96" y="69.5" width="8" height="20" rx="0.5" />
          {/* Bottom serif */}
          <rect x="91" y="89.5" width="18" height="4.5" rx="0.5" />
        </g>

        {/* Red Letter 'E' (Left) */}
        <g fill="#E51A1A" stroke="#111111" strokeWidth="1.5">
          <path d="M 38 82 H 68 V 97 H 49 V 104 H 66 V 118 H 49 V 125 H 68 V 140 H 38 Z" />
        </g>

        {/* Red Letter 'E' (Right) */}
        <g fill="#E51A1A" stroke="#111111" strokeWidth="1.5">
          <path d="M 132 82 H 162 V 97 H 143 V 104 H 160 V 118 H 143 V 125 H 162 V 140 H 132 Z" />
        </g>

        {/* Black Industrial Factory Silhouette */}
        <path
          d="M 72 114 L 72 92 L 87 103 L 87 92 L 102 103 L 102 92 L 117 103 L 117 92 L 128 100 L 128 114 Z"
          fill="#111111"
        />

        {/* Black Industrial Gear / Cogwheel */}
        <g fill="#111111">
          <path d="M 75 142 C 75 125 86 116 100 116 C 114 116 125 125 125 142 Z" />
          {/* Gear teeth */}
          <rect x="75" y="129" width="6" height="5" transform="rotate(-40 75 129)" />
          <rect x="83" y="120" width="6" height="5" transform="rotate(-20 83 120)" />
          <rect x="97" y="113" width="6" height="5" />
          <rect x="111" y="118" width="6" height="5" transform="rotate(20 111 118)" />
          <rect x="119" y="126" width="6" height="5" transform="rotate(40 119 126)" />
        </g>

        {/* Open Book Chevron Base (Yellow Top Stripe, Green Bottom Stripe) */}
        {/* Yellow Stripe */}
        <polygon
          points="68,141 100,152 132,141 138,148 100,161 62,148"
          fill="#FACC15"
          stroke="#111111"
          strokeWidth="1.2"
        />
        {/* Green Stripe */}
        <polygon
          points="62,148 100,161 138,148 144,155 100,170 56,155"
          fill="#16A34A"
          stroke="#111111"
          strokeWidth="1.2"
        />
      </svg>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="text-white font-black text-xs uppercase tracking-wider">
            I.E. Empresarial
          </span>
          <span className="text-stone-300 text-[10px] font-semibold">
            Dosquebradas · PAEAT
          </span>
        </div>
      )}
    </div>
  );
};
