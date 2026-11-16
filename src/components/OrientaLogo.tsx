import React, { useState } from 'react';

interface OrientaLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'full' | 'isotype';
  className?: string;
  showSubtitle?: boolean;
  onClick?: () => void;
  interactive?: boolean;
  needleAnimation?: 'default' | 'search' | 'error';
  animationTrigger?: number;
}

export const OrientaLogo: React.FC<OrientaLogoProps> = ({
  size = 'md',
  variant = 'isotype',
  className = '',
  showSubtitle = false,
  onClick,
  interactive = true,
  needleAnimation = 'default',
  animationTrigger = 0,
}) => {
  const [spinKey, setSpinKey] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;

    // Reset and trigger fluid compass rotation
    setIsSpinning(false);
    requestAnimationFrame(() => {
      setIsSpinning(true);
      setSpinKey((prev) => prev + 1);
    });

    if (onClick) {
      onClick();
    }
  };

  // Determine active animation class on needle
  const getNeedleAnimationClass = () => {
    if (needleAnimation === 'search') return 'animate-compass-search';
    if (needleAnimation === 'error') return 'animate-needle-error';
    if (isSpinning) return 'animate-compass';
    return '';
  };

  // Full official logo with the EXACT original artwork preserved,
  // separating ONLY the inner compass arrows as an independent animated layer
  if (variant === 'full') {
    // Sizing map for full banner
    const fullHeightMap = {
      xs: 'h-6 sm:h-7',
      sm: 'h-7 sm:h-8',
      md: 'h-8 sm:h-9 md:h-10',
      lg: 'h-10 sm:h-12',
      xl: 'h-12 sm:h-14 md:h-16',
      '2xl': 'h-16 sm:h-20',
    };

    const currentHeight = className.includes('h-') ? '' : fullHeightMap[size];

    return (
      <div
        onClick={handleClick}
        className={`flex items-center gap-2 select-none group ${
          interactive ? 'cursor-pointer hover:opacity-95' : ''
        } ${className}`}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        title="Orienta IA • Hacé clic para girar la brújula"
        aria-label="Logotipo oficial interactivo de Orienta IA"
        onKeyDown={(e) => {
          if (interactive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClick(e as any);
          }
        }}
      >
        <div className="relative inline-block">
          <svg
            viewBox="0 0 168 50"
            className={`${currentHeight} w-auto block overflow-visible`}
            style={{ imageRendering: '-webkit-optimize-contrast' }}
          >
            {/* 1. Capa base: Logotipo oficial ORIENTA IA intacto y con transparencia pura */}
            <image
              href="/assets/aistudio/logo_transparent.png"
              xlinkHref="/assets/aistudio/logo_transparent.png"
              x="0"
              y="0"
              width="168"
              height="50"
            />

            {/* 2. Capa intermedia: Fondo azul original del círculo interior de la letra 'O' (#276088)
                   que mantiene el círculo estático y cubre únicamente las flechas fijas originales */}
            <circle cx="21" cy="26.5" r="9.2" fill="#276088" />

            {/* 3. Capa superior independiente: Las flechas interiores y el núcleo de la brújula,
                   que realizan la animación fluida de rotación al hacer clic o en eventos especiales */}
            <g
              key={`${spinKey}-${needleAnimation}-${animationTrigger}`}
              style={{
                transformOrigin: '21px 26.5px',
                transformBox: 'view-box',
              }}
              className={`needle-rotate-hover ${getNeedleAnimationClass()}`}
              onAnimationEnd={() => setIsSpinning(false)}
            >
              {/* Flecha izquierda blanca */}
              <path
                d="M 12.8 26.5 L 18.2 23.5 L 18.2 29.5 Z"
                fill="#FFFFFF"
              />

              {/* Flecha derecha blanca */}
              <path
                d="M 29.2 26.5 L 23.8 23.5 L 23.8 29.5 Z"
                fill="#FFFFFF"
              />

              {/* Núcleo central dorado característico */}
              <circle
                cx="21"
                cy="26.5"
                r="2.2"
                fill="#FFD062"
                stroke="#FFFFFF"
                strokeWidth="0.4"
              />
            </g>
          </svg>
        </div>

        {showSubtitle && (
          <div className="hidden lg:block pl-3 border-l border-[#1E3553]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#E5B842] block">
              SSSalud • República Argentina
            </span>
            <span className="text-[11px] text-slate-300 font-medium">
              Asistente Virtual Ciudadano
            </span>
          </div>
        )}
      </div>
    );
  }

  // Isotype sizing map for avatars / badges
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
  };

  return (
    <div
      onClick={handleClick}
      className={`relative shrink-0 group ${
        interactive ? 'cursor-pointer hover:opacity-95' : ''
      } ${className}`}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      title="Orienta IA"
    >
      <div
        className={`relative ${sizeMap[size]} rounded-xl bg-[#0B192C] border border-[#1E3553] flex items-center justify-center shrink-0 shadow-sm overflow-hidden select-none transition-transform duration-200 group-active:scale-95`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-0.5"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fondo oscuro */}
          <rect width="100" height="100" rx="14" fill="#0B192C" />

          {/* Arco blanco exterior orbital estático */}
          <path
            d="M 52 14 A 36 36 0 0 0 52 86"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Círculo celeste estático de la 'O' */}
          <circle cx="52" cy="50" r="26" fill="#2B82C9" />

          {/* Círculo central estático */}
          <circle cx="52" cy="50" r="16" fill="#0B192C" />

          {/* Brújula / flechas interiores como elemento INDEPENDIENTE */}
          <g
            key={`${spinKey}-${needleAnimation}`}
            style={{
              transformOrigin: '52px 50px',
              transformBox: 'view-box',
            }}
            className={`needle-rotate-hover ${getNeedleAnimationClass()}`}
            onAnimationEnd={() => setIsSpinning(false)}
          >
            {/* Flecha izquierda */}
            <path d="M 37 50 L 46 44 L 46 56 Z" fill="#FFFFFF" />

            {/* Flecha derecha */}
            <path d="M 67 50 L 58 44 L 58 56 Z" fill="#FFFFFF" />

            {/* Núcleo central dorado */}
            <circle
              cx="52"
              cy="50"
              r="4.8"
              fill="#E5B842"
              stroke="#FFFFFF"
              strokeWidth="1.2"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
