import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  HelpCircle,
  Sparkles,
  LogOut,
  UserCheck,
  BookOpen,
  BarChart3,
  Database,
  PenTool,
  Lock,
  Menu,
  X,
} from 'lucide-react';
import { OrientaLogo } from './OrientaLogo';

export type TabCiudadano = 'chat' | 'checklist' | 'redactor' | 'herramientas-ia' | 'canales';
export type TabAdmin = 'panel' | 'consultas' | 'tramites';

interface NavItem<T extends string> {
  id: T;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  accent?: boolean;
  badge?: boolean;
}

interface HeaderProps {
  modo: 'ciudadano' | 'admin';
  tabCiudadano: TabCiudadano;
  onTabCiudadano: (tab: TabCiudadano) => void;
  tabAdmin: TabAdmin;
  onTabAdmin: (tab: TabAdmin) => void;
  hasChecklist: boolean;
  adminNombre?: string | null;
  onIrAdmin: () => void;
  onLogout: () => void;
}

const ITEMS_CIUDADANO: NavItem<TabCiudadano>[] = [
  { id: 'chat', label: 'Asistente', shortLabel: 'Asistente', icon: HelpCircle },
  { id: 'checklist', label: 'Mi checklist', shortLabel: 'Checklist', icon: FileText },
  { id: 'redactor', label: 'Redactor de nota', shortLabel: 'Nota', icon: PenTool },
  { id: 'herramientas-ia', label: 'Herramientas IA', shortLabel: 'IA', icon: Sparkles, accent: true },
  { id: 'canales', label: 'Canales de contacto', shortLabel: 'Contacto', icon: ShieldCheck },
];

const ITEMS_ADMIN: NavItem<TabAdmin>[] = [
  { id: 'panel', label: 'Panel del organismo', shortLabel: 'Panel', icon: BarChart3 },
  { id: 'consultas', label: 'Consultas', shortLabel: 'Consultas', icon: Database },
  { id: 'tramites', label: 'Gestión de trámites', shortLabel: 'Trámites', icon: BookOpen },
];

function Nav<T extends string>({
  items,
  activo,
  onSelect,
}: {
  items: NavItem<T>[];
  activo: T;
  onSelect: (id: T) => void;
}) {
  return (
    <nav
      className={`grid ${items.length === 5 ? 'grid-cols-5' : 'grid-cols-3'} sm:flex items-center gap-1 p-1 bg-[#11223A] rounded-xl border border-[#1E3553] w-full`}
      aria-label="Navegación principal"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activo === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`min-h-[44px] sm:h-9 px-1 sm:px-3 rounded-lg text-[10px] xs:text-[11px] sm:text-[13px] font-semibold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all duration-200 cursor-pointer relative select-none w-full sm:w-auto text-center ${
              isActive
                ? 'bg-[#2B82C9] text-white shadow-sm ring-1 ring-[#2B82C9]/60'
                : 'text-slate-300 hover:text-white hover:bg-[#162A45]'
            }`}
          >
            <Icon
              className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.accent ? 'text-[#E5B842]' : 'text-[#2B82C9]'}`}
              strokeWidth={2}
            />
            <span className="truncate sm:hidden">{item.shortLabel}</span>
            <span className="hidden sm:inline whitespace-nowrap">{item.label}</span>
            {item.badge && !isActive && (
              <span className="w-2 h-2 rounded-full bg-[#E5B842] ring-2 ring-[#0B192C] absolute top-1.5 right-1.5 animate-pulse" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

export const Header: React.FC<HeaderProps> = ({
  modo,
  tabCiudadano,
  onTabCiudadano,
  tabAdmin,
  onTabAdmin,
  hasChecklist,
  adminNombre,
  onIrAdmin,
  onLogout,
}) => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const itemsCiudadano = ITEMS_CIUDADANO.map((i) => (i.id === 'checklist' ? { ...i, badge: hasChecklist } : i));
  const itemsActivos = modo === 'admin' ? ITEMS_ADMIN : itemsCiudadano;
  const tabActivo = modo === 'admin' ? tabAdmin : tabCiudadano;

  const handleSelectTab = (id: string) => {
    setMenuAbierto(false);
    if (modo === 'admin') {
      onTabAdmin(id as TabAdmin);
    } else {
      onTabCiudadano(id as TabCiudadano);
    }
  };

  return (
    <header className="no-print bg-[#0B192C] text-white border-b border-[#1E3553] sticky top-0 z-40 shadow-md relative">
      <div className="h-1 w-full bg-gradient-to-r from-[#2B82C9] via-[#E5B842] to-[#2B82C9]" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex flex-col 2xl:flex-row items-center justify-between gap-2.5 sm:gap-3.5">
          <div className="flex items-center justify-between w-full 2xl:w-auto gap-3">
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
              <div className="flex items-center shrink-0">
                <OrientaLogo variant="full" onClick={() => (modo === 'admin' ? onTabAdmin('panel') : onTabCiudadano('chat'))} />
              </div>

              <div className="hidden md:block pl-3 border-l border-[#1E3553] leading-tight truncate">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <span className="font-semibold text-slate-200">Para la SSSalud</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 truncate">Orientación sobre obras sociales y prepagas</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {modo === 'admin' ? (
                    <span className="inline-flex items-center gap-1 bg-[#E5B842]/15 text-[#E5B842] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#E5B842]/30">
                      <Lock className="w-2.5 h-2.5" />
                      Modo administrador
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider text-[#2B82C9] font-bold">
                      Proyecto académico · IFTS 12
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Login / Admin button */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {modo === 'admin' ? (
                <div className="flex items-center gap-1.5 bg-[#11223A] px-2 py-1 rounded-lg border border-[#1E3553]">
                  <UserCheck className="w-3.5 h-3.5 text-[#E5B842] shrink-0" />
                  <span className="text-[11px] text-slate-300 hidden sm:inline max-w-[130px] truncate">Administrador</span>
                  <button
                    onClick={onLogout}
                    className="text-slate-300 hover:text-white px-1.5 rounded transition-colors cursor-pointer min-h-[32px] flex items-center justify-center gap-1 text-[11px]"
                    title="Cerrar sesión y volver al asistente"
                    aria-label="Cerrar sesión"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Salir</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={onIrAdmin}
                  className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded-lg border border-transparent hover:border-[#1E3553] cursor-pointer min-h-[32px] transition-colors"
                  title="Acceso para el administrador de contenidos"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Administrador</span>
                </button>
              )}
            </div>

            {/* Mobile Hamburger Button (replaces separate login and nav row on mobile) */}
            <div className="md:hidden flex items-center">
              <button
                type="button"
                onClick={() => setMenuAbierto(!menuAbierto)}
                className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-[#11223A] hover:bg-[#162A45] border border-[#1E3553] text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer relative"
                aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú de navegación'}
                aria-expanded={menuAbierto}
              >
                {menuAbierto ? <X className="w-5 h-5 text-slate-200" /> : <Menu className="w-5 h-5 text-slate-200" />}
                {hasChecklist && !menuAbierto && modo === 'ciudadano' && tabCiudadano !== 'checklist' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E5B842] ring-2 ring-[#0B192C] absolute -top-0.5 -right-0.5 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* Desktop Navigation: Visible on md+, hidden on mobile */}
          <div className="hidden md:block w-full 2xl:w-auto">
            {modo === 'admin' ? (
              <Nav items={ITEMS_ADMIN} activo={tabAdmin} onSelect={onTabAdmin} />
            ) : (
              <Nav items={itemsCiudadano} activo={tabCiudadano} onSelect={onTabCiudadano} />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu Popover */}
      {menuAbierto && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMenuAbierto(false)}
          />

          <div
            className="absolute top-full left-3 right-3 mt-1 z-50 bg-[#0B192C] border border-[#1E3553] rounded-2xl shadow-2xl p-2.5 md:hidden"
            role="dialog"
            aria-label="Menú principal móvil"
          >
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1 mb-1">
              {modo === 'admin' ? 'Panel de Administración' : 'Secciones del Asistente'}
            </div>

            {/* Navigation items */}
            <div className="space-y-1">
              {itemsActivos.map((item) => {
                const Icon = item.icon;
                const isActive = tabActivo === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer text-left ${
                      isActive
                        ? 'bg-[#2B82C9] text-white shadow-xs'
                        : 'text-slate-200 hover:text-white hover:bg-[#11223A]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-white'
                            : item.accent
                            ? 'text-[#E5B842]'
                            : 'text-[#2B82C9]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E5B842] text-[#0B192C]">
                        Listo
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="border-t border-[#1E3553] my-2" />

            {/* Login / Admin section */}
            {modo === 'admin' ? (
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center gap-2 px-2.5 py-1 text-xs text-[#E5B842]">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span className="font-semibold truncate">
                    {adminNombre ? `Admin: ${adminNombre}` : 'Modo Administrador Activo'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setMenuAbierto(false);
                    onLogout();
                  }}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-red-300 hover:text-white hover:bg-red-950/30 border border-red-900/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMenuAbierto(false);
                  onIrAdmin();
                }}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-slate-300 hover:text-white hover:bg-[#11223A] border border-[#1E3553] transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4 text-[#E5B842] shrink-0" />
                <span>Acceso Administrador</span>
              </button>
            )}
          </div>
        </>
      )}
    </header>
  );
};
