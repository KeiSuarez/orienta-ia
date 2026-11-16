import React, { useState } from 'react';
import { OrientaLogo } from './OrientaLogo';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Info,
} from 'lucide-react';
import { OfflineIndicator } from './OfflineIndicator';

interface LoginViewProps {
  /** Se llama con el token de sesión que devuelve el servidor. */
  onLoginSuccess: (token: string, nombre: string) => void;
  /** Vuelve al asistente sin iniciar sesión. */
  onCancel: () => void;
}

/**
 * Ingreso exclusivo para el administrador de contenidos.
 * La contraseña se valida en el servidor (variable ADMIN_PASSWORD), nunca en el navegador.
 * El ciudadano no necesita iniciar sesión para usar el asistente.
 */
export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const triggerError = (msg: string) => {
    // Increment counter to ensure key-based animations restart on every attempt
    setErrorCount((prev) => prev + 1);
    setHasError(true);
    setErrorMessage(msg);

    // Reset shake animation class after 500ms so it can re-trigger subsequently
    setTimeout(() => {
      setHasError(false);
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const pass = password.trim();

    if (!pass) {
      triggerError('Por favor, ingresá la contraseña de acceso.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) {
        triggerError(data.error || 'Contraseña incorrecta, intentá otra vez.');
        return;
      }
      onLoginSuccess(data.token, data.nombre || 'Administrador');
    } catch {
      triggerError('No se pudo conectar con el servidor. Probá de nuevo en unos segundos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0B192C] flex flex-col justify-center items-center px-4 py-8 relative overflow-x-hidden w-full select-none"
    >
      {/* Top subtle Argentine accent line */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2B82C9] via-[#E5B842] to-[#2B82C9]" />

      {/* Volver al asistente */}
      <div className="absolute top-4 left-4 z-20">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[40px] px-3 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 border border-[#1E3553] cursor-pointer transition-colors"
        >
          ← Volver al asistente
        </button>
      </div>

      <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center">
        {/* Logotipo */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8 animate-fadeIn">
          <OrientaLogo
            variant="full"
            size="xl"
            needleAnimation={errorCount > 0 ? 'error' : 'default'}
            animationTrigger={errorCount}
            interactive={true}
          />
          <p className="mt-3.5 text-xs sm:text-[13px] font-semibold tracking-wide text-[#E5B842] select-text">
            Panel de administración
          </p>
        </div>

        {/* Tarjeta central blanca redondeada y minimalista */}
        <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-[#E2E8F0] shadow-2xl p-6 sm:p-8 relative z-10">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0B192C] tracking-tight">
              Acceso administrador
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] mt-1.5 leading-relaxed">
              Solo para quien administra los contenidos. Para consultar un trámite no hace falta iniciar sesión.
            </p>
          </div>

          {/* Formulario de Login exclusivo por contraseña */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0B192C] mb-1.5">
                Contraseña de administrador
              </label>
              <div
                className={`relative transition-transform ${
                  hasError ? 'animate-soft-shake' : ''
                }`}
              >
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2B82C9]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Ingresá tu contraseña..."
                  autoFocus
                  className={`w-full pl-10 pr-11 py-3 bg-[#F8FAFD] rounded-xl text-base sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 min-h-[48px] transition-all border ${
                    errorMessage
                      ? 'border-[#F4D381] bg-[#FEF9EB] focus:border-[#E5B842] focus:ring-[#E5B842]/20'
                      : 'border-[#B6D6EC] hover:border-[#8DC1E3] focus:border-[#2B82C9] focus:ring-[#2B82C9]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#0B192C] cursor-pointer min-h-[48px] min-w-[40px] justify-center transition-colors"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Manejo de Error Suave: Aviso amigable y discreto debajo del campo */}
              {errorMessage && (
                <div className="mt-2.5 p-3 rounded-xl bg-[#FEF8E7] border border-[#F4D381] text-[#8C650A] text-xs flex items-center gap-2 animate-fadeIn leading-relaxed">
                  <Info className="w-4 h-4 text-[#E5B842] shrink-0" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Botón principal */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] bg-[#2B82C9] hover:bg-[#2170B0] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-200 cursor-pointer active:scale-[0.99] mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Verificando contraseña...</span>
                </span>
              ) : (
                <>
                  <span>Ingresar al panel</span>
                  <ArrowRight className="w-4 h-4 text-white" strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Nota institucional de confianza */}
          <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center justify-center gap-1.5 text-[11px] text-[#64748B] text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2B82C9] shrink-0" />
            <span>La contraseña se verifica en el servidor</span>
          </div>
        </div>
      </div>

      {/* Connectivity status indicator */}
      <OfflineIndicator />
    </div>
  );
};
