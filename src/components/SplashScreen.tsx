import React, { useEffect, useState } from 'react';
import { OrientaLogo } from './OrientaLogo';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 2200,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Progress increment simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 100;
        }
        return prev + 18;
      });
    }, 280);

    // Fade out timeout
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, durationMs - 500);

    // Finish timeout
    const finishTimer = setTimeout(() => {
      onFinish();
    }, durationMs);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#0B192C] flex flex-col items-center justify-center px-4 transition-opacity duration-500 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 40%, #162C4A 0%, #0B192C 70%)',
      }}
      role="status"
      aria-live="polite"
      aria-label="Cargando Orienta IA"
    >
      <div className="flex flex-col items-center text-center max-w-sm w-full animate-fadeIn">
        {/* Logo oficial con la brújula en animación fluida de búsqueda */}
        <div className="relative mb-6 transform transition-transform duration-500 scale-105 sm:scale-110">
          <OrientaLogo
            variant="full"
            size="xl"
            needleAnimation="search"
            interactive={false}
          />

          {/* Sutil halo luminoso detrás de la 'O' */}
          <div className="absolute top-1/2 left-[12%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#2B82C9]/25 rounded-full blur-xl pointer-events-none animate-pulse" />
        </div>

        {/* Identificación institucional */}
        <div className="space-y-1 mb-8">
          <div className="flex items-center justify-center gap-1.5 text-[#E5B842] text-[11px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#E5B842]" />
            <span>Superintendencia de Servicios de Salud</span>
          </div>
          <h2 className="text-white text-base sm:text-lg font-bold tracking-tight">
            Asistente Oficial de Orientación Ciudadana
          </h2>
          <p className="text-slate-400 text-xs">
            Calibrando brújula de requisitos normativos y canales TAD...
          </p>
        </div>

        {/* Barra de progreso de carga estilizada en azul y dorado */}
        <div className="w-56 bg-[#11223A] border border-[#1E3553] h-2 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#2B82C9] via-[#7BB6E4] to-[#E5B842] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Etiqueta de seguridad inferior */}
        <div className="mt-8 flex items-center gap-1.5 text-slate-500 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2B82C9]" />
          <span>Entorno Seguro • República Argentina</span>
        </div>
      </div>
    </div>
  );
};
