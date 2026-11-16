import React from 'react';
import {
  ShieldCheck,
  FileText,
  HelpCircle,
  Sparkles,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { OrientaLogo } from './OrientaLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: 'chat' | 'checklist' | 'herramientas-ia' | 'canales';
  setActiveTab: (tab: 'chat' | 'checklist' | 'herramientas-ia' | 'canales') => void;
  hasChecklist: boolean;
  currentUser?: { name: string; cuil: string; rol: string } | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hasChecklist,
  currentUser,
  onLogout,
}) => {
  const navItems = [
    {
      id: 'chat' as const,
      label: 'Asistente Ciudadano',
      shortLabel: 'Asistente',
      icon: HelpCircle,
    },
    {
      id: 'checklist' as const,
      label: 'Checklist Requisitos',
      shortLabel: 'Checklist',
      icon: FileText,
      badge: hasChecklist,
    },
    {
      id: 'herramientas-ia' as const,
      label: 'Herramientas IA',
      shortLabel: 'Herram. IA',
      icon: Sparkles,
      accent: true,
    },
    {
      id: 'canales' as const,
      label: 'Canales TAD',
      shortLabel: 'Canales',
      icon: ShieldCheck,
    },
  ];

  return (
    <header className="bg-[#0B192C] text-white border-b border-[#1E3553] sticky top-0 z-40 shadow-md">
      {/* Top micro line: Argentine sky blue + gold accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#2B82C9] via-[#E5B842] to-[#2B82C9]" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2.5 sm:gap-3.5">
          {/* Brand & SSSalud identification */}
          <div className="flex items-center justify-between w-full lg:w-auto gap-3">
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
              {/* Official Logo Banner */}
              <div className="flex items-center shrink-0">
                <OrientaLogo variant="full" onClick={() => setActiveTab('chat')} />
              </div>

              {/* Institutional subtitle for larger screens */}
              <div className="hidden md:block pl-3 border-l border-[#1E3553] leading-tight truncate">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <span className="font-semibold text-slate-200">SSSalud</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 truncate">Superintendencia de Servicios de Salud</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#2B82C9] font-bold">
                    República Argentina
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#E5B842]/15 text-[#E5B842] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#E5B842]/30">
                    <Sparkles className="w-2.5 h-2.5" />
                    Oficial
                  </span>
                </div>
              </div>
            </div>

            {/* Right side PWA Install + user status / logout */}
            <div className="flex items-center gap-2 shrink-0">
              <PWAInstallButton />

              {currentUser && onLogout && (
                <div className="flex items-center gap-1.5 bg-[#11223A] px-2 py-1 rounded-lg border border-[#1E3553]">
                  <UserCheck className="w-3.5 h-3.5 text-[#2B82C9] shrink-0" />
                  <span className="text-[11px] text-slate-300 hidden sm:inline max-w-[130px] truncate">
                    {currentUser.name}
                  </span>
                  <button
                    onClick={onLogout}
                    className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                    title="Cerrar sesión"
                    aria-label="Cerrar sesión"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Compact Official badge on mobile if no user */}
              {!currentUser && (
                <div className="md:hidden flex items-center">
                  <span className="inline-flex items-center gap-1 bg-[#E5B842]/15 text-[#E5B842] text-[10px] xs:text-[11px] font-bold px-2 xs:px-2.5 py-1 rounded-full border border-[#E5B842]/30 whitespace-nowrap">
                    <Sparkles className="w-2.5 h-2.5 text-[#E5B842]" />
                    Oficial
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs (Mobile 4-col responsive grid, Tablet/Desktop flex row) */}
          <div className="w-full lg:w-auto">
            <nav
              className="grid grid-cols-4 sm:flex items-center gap-1 p-1 bg-[#11223A] rounded-xl border border-[#1E3553] w-full"
              aria-label="Navegación principal"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`min-h-[44px] sm:h-9 px-1.5 sm:px-3 rounded-lg text-[11px] sm:text-[13px] font-semibold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all duration-200 cursor-pointer relative select-none w-full sm:w-auto text-center ${
                      isActive
                        ? 'bg-[#2B82C9] text-white shadow-sm ring-1 ring-[#2B82C9]/60'
                        : 'text-slate-300 hover:text-white hover:bg-[#162A45]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-white'
                          : item.accent
                          ? 'text-[#E5B842]'
                          : 'text-[#2B82C9]'
                      }`}
                      strokeWidth={2}
                    />
                    {/* Responsive text label: short on phone, full on tablet/desktop */}
                    <span className="truncate sm:hidden">{item.shortLabel}</span>
                    <span className="hidden sm:inline whitespace-nowrap">{item.label}</span>

                    {item.badge && !isActive && (
                      <span className="w-2 h-2 rounded-full bg-[#E5B842] ring-2 ring-[#0B192C] absolute top-1.5 right-1.5 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
