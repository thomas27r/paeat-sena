import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, Link as LinkIcon, Sparkles } from 'lucide-react';
import { AvatarImage } from './AvatarImage';

interface PhotoUploaderProps {
  currentAvatarUrl?: string;
  onAvatarChange: (newUrl: string | undefined) => void;
  label?: string;
}

// Friendly preset profile avatars using Unsplash avatars & avatars for quick selection
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
];

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  currentAvatarUrl,
  onAvatarChange,
  label = 'Foto de perfil',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen no debe superar los 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onAvatarChange(result);
      }
    };
    reader.onerror = () => {
      setUploadError('Error al leer el archivo de imagen');
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      onAvatarChange(customUrl.trim());
      setShowUrlInput(false);
      setCustomUrl('');
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Label */}
      <span className="text-stone-300 text-[10px] font-bold uppercase tracking-wider">
        {label}
      </span>

      {/* Main Avatar Preview & Quick Buttons */}
      <div className="relative group">
        <AvatarImage src={currentAvatarUrl} size="lg" className="shadow-md ring-2 ring-stone-700/50" />
        
        {/* Quick Camera Overlay */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 bg-amber-400 text-stone-900 p-1.5 rounded-full shadow-md hover:bg-amber-300 active:scale-95 transition cursor-pointer border border-[#2e0513]"
          title="Cambiar o subir foto"
        >
          <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {uploadError && (
        <span className="text-red-400 text-[10px] font-semibold">{uploadError}</span>
      )}

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-0.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 bg-[#dedede] hover:bg-stone-200 text-[#3d081b] text-[11px] font-bold px-2 py-1 rounded-md transition active:scale-95 cursor-pointer shadow-xs"
        >
          <Upload className="w-3 h-3" />
          <span>Subir</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowPresets(!showPresets);
            setShowUrlInput(false);
          }}
          className="flex items-center gap-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/60 text-amber-200 text-[11px] font-bold px-2 py-1 rounded-md transition active:scale-95 cursor-pointer shadow-xs"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Galería</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowUrlInput(!showUrlInput);
            setShowPresets(false);
          }}
          className="flex items-center gap-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-bold px-2 py-1 rounded-md transition active:scale-95 cursor-pointer border border-stone-600 shadow-xs"
        >
          <LinkIcon className="w-3 h-3" />
          <span>URL</span>
        </button>

        {currentAvatarUrl && (
          <button
            type="button"
            onClick={() => onAvatarChange(undefined)}
            className="flex items-center gap-1 bg-red-950/60 hover:bg-red-900 text-red-200 text-[11px] font-bold px-2 py-1 rounded-md transition active:scale-95 cursor-pointer border border-red-800 shadow-xs"
            title="Eliminar foto de perfil"
          >
            <Trash2 className="w-3 h-3 text-red-400" />
            <span>Quitar</span>
          </button>
        )}
      </div>

      {/* Presets Gallery Picker */}
      {showPresets && (
        <div className="w-full max-w-xs bg-stone-900/95 p-2 rounded-xl border border-amber-500/40 shadow-xl mt-1 animate-in fade-in duration-200">
          <p className="text-amber-300 text-[10px] font-semibold mb-1.5 text-center">
            Selecciona una foto de la galería:
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {PRESET_AVATARS.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onAvatarChange(url);
                  setShowPresets(false);
                }}
                className={`relative rounded-full overflow-hidden border transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                  currentAvatarUrl === url ? 'border-amber-400 ring-1 ring-amber-400' : 'border-stone-600 hover:border-amber-300'
                }`}
              >
                <img src={url} alt={`Avatar ${idx + 1}`} className="w-9 h-9 object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* URL Input Box */}
      {showUrlInput && (
        <div className="w-full max-w-xs flex gap-1.5 mt-1 animate-in fade-in duration-200">
          <input
            type="url"
            placeholder="Pegar enlace de imagen..."
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleUrlSubmit(e);
              }
            }}
            className="flex-1 bg-[#dedede] text-stone-900 text-[11px] font-semibold rounded-md px-2.5 py-1 outline-hidden focus:ring-1 focus:ring-amber-400"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="bg-amber-400 text-stone-950 text-[11px] font-bold px-2.5 py-1 rounded-md hover:bg-amber-300 transition active:scale-95 cursor-pointer"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
};
