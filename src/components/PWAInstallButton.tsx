import React, { useState, useEffect } from 'react';
import { usePWAInstall, DevicePlatform } from '../hooks/usePWAInstall';
import {
  Download,
  Share2,
  PlusSquare,
  X,
  Smartphone,
  Monitor,
  MoreVertical,
  CheckCircle2,
  Sparkles,
  WifiOff,
  Zap,
  Cpu,
  Layers,
  ArrowDownToLine,
  ShieldCheck,
} from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'login' | 'inline';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, platform, install } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<DevicePlatform>(platform);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [lastDownloaded, setLastDownloaded] = useState<string | null>(null);

  // Sync tab with detected platform when it changes or modal opens
  useEffect(() => {
    setSelectedTab(platform);
  }, [platform, isOpen]);

  // If already installed and running standalone, do not show button
  if (isInstalled) {
    return null;
  }

  const handleDirectInstall = async () => {
    setIsInstalling(true);
    const result = await install();
    setIsInstalling(false);
    if (result) {
      setInstallSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setInstallSuccess(false);
      }, 1800);
    }
  };

  const handleDownloadClick = (filename: string) => {
    setLastDownloaded(filename);
    setTimeout(() => {
      setLastDownloaded(null);
    }, 3500);
  };

  return (
    <>
      {/* Trigger Button */}
      {variant === 'login' ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1E3553] bg-[#11223A]/90 hover:bg-[#162A45] text-slate-200 text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer hover:border-[#2B82C9]/60 hover:text-white ${className}`}
          title="Instalar aplicación Orienta IA"
        >
          <Download className="w-3.5 h-3.5 text-[#E5B842]" />
          <span>Instalar App</span>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#1E3553] bg-[#11223A] hover:bg-[#162A45] text-slate-200 text-xs font-medium shadow-xs transition-all duration-200 cursor-pointer hover:border-[#2B82C9]/60 hover:text-white ${className}`}
          title="Instalar Orienta IA en tu dispositivo"
        >
          <Download className="w-3.5 h-3.5 text-[#2B82C9]" />
          <span className="hidden sm:inline">Instalar App</span>
          <span className="sm:hidden">Instalar</span>
        </button>
      )}

      {/* Multiplatform Install & Direct Download Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#070F1E]/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fadeIn select-none"
        >
          <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 text-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Top Accent Argentine gradient line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#2B82C9] via-[#E5B842] to-[#2B82C9] shrink-0" />

            {/* Modal Header */}
            <div className="px-5 sm:px-6 pt-5 pb-3 flex items-start justify-between border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0B192C] flex items-center justify-center p-1.5 shadow-sm shrink-0 border border-[#1E3553]">
                  <img
                    src="/pwa-192x192.png"
                    alt="Orienta IA"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-[#0B192C]">
                      Instalación y Descargas
                    </h3>
                    <span className="bg-[#E5B842]/15 text-[#8C650A] text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#E5B842]/30">
                      Oficial SSSalud
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Orienta IA • Ejecutables y Acceso Directo Oficial
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {/* Notification Banner when user triggers download */}
              {lastDownloaded && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <strong>¡Descarga iniciada!</strong> Se está descargando{' '}
                    <span className="font-mono font-semibold">{lastDownloaded}</span> en tu equipo.
                  </div>
                </div>
              )}

              {/* Direct 1-Click Install Banner (Triggered when beforeinstallprompt is active) */}
              {isInstallable && (
                <div className="p-3.5 rounded-2xl bg-[#EBF4FA] border border-[#B6D6EC] flex flex-col gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-[#2B82C9] text-white shrink-0 mt-0.5 shadow-xs">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0B192C]">
                        ¡Instalación directa disponible en este navegador!
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        Hacé clic para agregar Orienta IA directamente a tu sistema con soporte sin conexión.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleDirectInstall}
                    disabled={isInstalling || installSuccess}
                    className="w-full min-h-[42px] bg-[#2B82C9] hover:bg-[#2170B0] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-[0.99]"
                  >
                    {isInstalling ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Abriendo aviso del sistema...</span>
                      </>
                    ) : installSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>¡Instalación confirmada!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Instalar aplicación ahora (1 Clic)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Device Selector Tabs */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Elegí tu plataforma:
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedTab('desktop')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1.5 sm:px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedTab === 'desktop'
                        ? 'bg-white text-[#0B192C] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5 text-[#2B82C9]" />
                    <span>PC / Mac</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTab('android')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1.5 sm:px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedTab === 'android'
                        ? 'bg-white text-[#0B192C] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#2B82C9]" />
                    <span>Android</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTab('ios')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1.5 sm:px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedTab === 'ios'
                        ? 'bg-white text-[#0B192C] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#2B82C9]" />
                    <span>iPhone (iOS)</span>
                  </button>
                </div>
              </div>

              {/* Tab Content: PC / Desktop (Windows & Mac) */}
              {selectedTab === 'desktop' && (
                <div className="space-y-3 animate-fadeIn">
                  {/* Native Executables Direct Download Section */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0B192C]/5 to-[#2B82C9]/10 border border-[#B6D6EC]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Cpu className="w-4 h-4 text-[#2B82C9]" />
                      <h4 className="text-xs font-bold text-[#0B192C]">
                        Descarga Directa de Ejecutables de Escritorio
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                      Descargá la aplicación oficial de Orienta IA para usarla de forma independiente en tu computadora sin necesidad de abrir un navegador:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Windows .exe Download Card & Button */}
                      <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <strong className="text-[#0B192C] font-bold text-xs flex items-center gap-1.5">
                              <span>🪟 Windows (.exe)</span>
                            </strong>
                            <span className="text-[10px] font-semibold text-[#2B82C9] bg-[#EBF4FA] px-1.5 py-0.5 rounded">
                              Instalador
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mb-2.5 leading-snug">
                            Instalador oficial ejecutable con acceso directo en Escritorio y Menú Inicio.
                          </p>
                        </div>

                        <a
                          href="/downloads/OrientaIA-Setup.exe"
                          download="OrientaIA-Setup.exe"
                          onClick={() => handleDownloadClick('OrientaIA-Setup.exe')}
                          className="w-full min-h-[38px] bg-[#2B82C9] hover:bg-[#2170B0] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                          <span>Descargar (.exe)</span>
                        </a>
                      </div>

                      {/* macOS .dmg Download Card & Button */}
                      <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <strong className="text-[#0B192C] font-bold text-xs flex items-center gap-1.5">
                              <span>🍏 macOS (.dmg)</span>
                            </strong>
                            <span className="text-[10px] font-semibold text-[#2B82C9] bg-[#EBF4FA] px-1.5 py-0.5 rounded">
                              Universal
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mb-2.5 leading-snug">
                            Paquete de imagen de disco DMG para Mac (Apple Silicon M1/M2/M3/M4 e Intel).
                          </p>
                        </div>

                        <a
                          href="/downloads/OrientaIA.dmg"
                          download="OrientaIA.dmg"
                          onClick={() => handleDownloadClick('OrientaIA.dmg')}
                          className="w-full min-h-[38px] bg-[#0B192C] hover:bg-[#162A45] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer border border-[#1E3553]"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5 text-[#E5B842]" />
                          <span>Descargar (.dmg)</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Desktop PWA Alternative */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <Download className="w-4 h-4 text-[#2B82C9] shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-700 leading-relaxed">
                      <strong className="block text-slate-900 font-semibold mb-0.5">
                        O instalar directamente desde el navegador (Chrome / Edge / Brave):
                      </strong>
                      Hacé clic en el ícono de <strong>Instalar</strong> en la barra de direcciones de tu navegador o abrí el menú (⋮) y seleccioná <strong>"Instalar Orienta IA"</strong>.
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Android Direct APK Download & PWA */}
              {selectedTab === 'android' && (
                <div className="space-y-3 animate-fadeIn">
                  {/* Android APK Direct Download Section */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-[#2B82C9]/10 border border-[#B6D6EC]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Layers className="w-4 h-4 text-[#2B82C9]" />
                      <h4 className="text-xs font-bold text-[#0B192C]">
                        Descarga Directa de Archivo APK (.apk)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                      Descargá el archivo instalador APK oficial de <strong>Orienta IA</strong> para instalar la app en cualquier celular o tablet Android sin depender de Google Play:
                    </p>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-[#0B192C]">
                            OrientaIA-Android.apk
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Paquete APK Oficial
                        </span>
                      </div>

                      <a
                        href="/downloads/OrientaIA.apk"
                        download="OrientaIA.apk"
                        onClick={() => handleDownloadClick('OrientaIA.apk')}
                        className="w-full min-h-[40px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <ArrowDownToLine className="w-4 h-4" />
                        <span>Descargar Archivo APK (.apk)</span>
                      </a>
                    </div>
                  </div>

                  {/* Android PWA Steps */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      O agregar como acceso directo instantáneo desde Chrome:
                    </span>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[#2B82C9] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs text-slate-700 leading-relaxed">
                        Tocá los <strong>tres puntos verticales (⋮)</strong> en la esquina superior de Chrome.
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[#2B82C9] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs text-slate-700 leading-relaxed">
                        Seleccioná <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: iPhone / iPad (iOS Safari) Instructions */}
              {selectedTab === 'ios' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="p-3 rounded-xl bg-[#FEF9EB] border border-[#F4D381] text-xs text-[#8C650A] leading-relaxed">
                    <strong>Instalación Oficial en iPhone:</strong> iOS Safari permite instalar Orienta IA en tu pantalla de inicio con soporte sin conexión, ícono oficial y ejecución a pantalla completa sin barras del navegador.
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#2B82C9] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs text-slate-700 leading-relaxed">
                        <strong className="block text-slate-900 font-semibold mb-0.5 flex items-center gap-1">
                          Tocá el botón Compartir
                          <Share2 className="w-3.5 h-3.5 text-[#2B82C9] inline" />
                        </strong>
                        En la barra de navegación de Safari (inferior en iPhone o superior en iPad), tocá el ícono de <strong>Compartir</strong> (un cuadrado con una flecha hacia arriba ⬆️).
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#2B82C9] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs text-slate-700 leading-relaxed">
                        <strong className="block text-slate-900 font-semibold mb-0.5 flex items-center gap-1">
                          "Agregar a inicio"
                          <PlusSquare className="w-3.5 h-3.5 text-slate-600 inline" />
                        </strong>
                        Deslizá las opciones hacia abajo y seleccioná <strong>"Agregar a inicio"</strong> (o <em>"Añadir a pantalla de inicio"</em> con el ícono <strong>+</strong>).
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#E5B842] text-slate-950 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="text-xs text-slate-700 leading-relaxed">
                        <strong className="block text-slate-900 font-semibold mb-0.5">
                          Tocá "Agregar" en la esquina superior
                        </strong>
                        Confirmá la acción. La app se agregará a tu pantalla de inicio como una aplicación nativa.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Benefits highlight footer */}
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2B82C9]" />
                  Descarga Segura y Oficial
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <WifiOff className="w-3.5 h-3.5 text-[#2B82C9]" />
                  Caché sin conexión
                </span>
                <span className="text-emerald-700 font-semibold">100% Gratuito</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0B192C] hover:bg-[#162A45] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
