import React from 'react';
import { User } from 'lucide-react';

interface AvatarImageProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  alt = 'Foto de perfil',
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = React.useState(false);

  // Reset error state if src changes
  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-9 h-9',
    xl: 'w-12 h-12',
  };

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-stone-300 shadow-md ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-[#dedede] text-[#3d081b] flex items-center justify-center shrink-0 border-2 border-stone-400 shadow-sm ${className}`}
    >
      <User className={`${iconSizes[size]} stroke-[2.2]`} />
    </div>
  );
};
