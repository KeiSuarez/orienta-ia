/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { LoginView } from './components/LoginView';
import { Header } from './components/Header';
import { ReglaDeOroBanner } from './components/ReglaDeOroBanner';
import { TrackingPills } from './components/TrackingPills';
import { ChatInterface } from './components/ChatInterface';
import { ChecklistView } from './components/ChecklistView';
import { CanalesModal } from './components/CanalesModal';
import { AiToolsModal } from './components/AiToolsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DatosMinimos, ChecklistFinal } from './types';
import { generarChecklistOficial } from './data/manualCAT';

interface UserSession {
  name: string;
  cuil: string;
  rol: string;
}

export default function App() {
  // Splash Screen state on entry/reload (starts true)
  const [showSplash, setShowSplash] = useState(true);

  // Mandatory authentication state: strictly starts in false on every page load
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Clear any residual storage keys on mount so login is always strictly mandatory
  useEffect(() => {
    try {
      sessionStorage.removeItem('orienta_auth');
      sessionStorage.removeItem('orienta_user');
      localStorage.removeItem('orienta_auth');
      localStorage.removeItem('orienta_user');
    } catch {
      // ignore
    }
  }, []);

  const [activeTab, setActiveTab] = useState<
    'chat' | 'checklist' | 'herramientas-ia' | 'canales'
  >('chat');

  const [datos, setDatos] = useState<DatosMinimos>({
    categoria: null,
    condicionLaboral: null,
    destinatario: null,
  });

  const [checklist, setChecklist] = useState<ChecklistFinal | null>(null);

  // Handle successful login
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setCurrentUser({
      name: 'Usuario Autorizado',
      cuil: 'orienta2026',
      rol: 'Acceso Seguro SSSalud',
    });
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  // If user updates tracking pills directly and all 3 are set, automatically update checklist
  const handleUpdateDatos = (nuevosDatos: DatosMinimos) => {
    setDatos(nuevosDatos);
    if (nuevosDatos.categoria && nuevosDatos.condicionLaboral && nuevosDatos.destinatario) {
      const nuevoChk = generarChecklistOficial(
        nuevosDatos.categoria,
        nuevosDatos.condicionLaboral,
        nuevosDatos.destinatario
      );
      setChecklist(nuevoChk);
    }
  };

  const handleChecklistGenerado = (chk: ChecklistFinal) => {
    setChecklist(chk);
  };

  // 1. Splash Screen Phase: Brújula buscando orientación
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 2. Authentication Phase: Bloqueo obligatorio mientras isLoggedIn sea false
  if (!isLoggedIn) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // 3. Main Authenticated Application: Solo visible si isLoggedIn === true
  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0F172A] flex flex-col font-sans relative antialiased overflow-x-hidden w-full">
      {/* Official SSSalud Header with Official Logo & Session controls */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasChecklist={checklist !== null}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Regla de Oro institucional */}
      <div className="no-print w-full">
        <ReglaDeOroBanner />
      </div>

      {/* Minimum data point tracking pills */}
      <div className="no-print w-full">
        <TrackingPills datos={datos} onUpdateDatos={handleUpdateDatos} />
      </div>

      {/* Main Content Body */}
      <main className="flex-1 py-1.5 sm:py-4 px-1 xs:px-2 sm:px-4 w-full max-w-7xl mx-auto flex flex-col">
        {activeTab === 'chat' && (
          <ChatInterface
            datos={datos}
            onUpdateDatos={handleUpdateDatos}
            onChecklistGenerado={handleChecklistGenerado}
            onVerChecklist={() => setActiveTab('checklist')}
            onAbrirHerramientasIa={() => setActiveTab('herramientas-ia')}
          />
        )}

        {activeTab === 'checklist' && (
          <ChecklistView
            checklist={checklist}
            onCrearNuevo={() => setActiveTab('chat')}
          />
        )}

        {activeTab === 'herramientas-ia' && (
          <AiToolsModal categoriaActual={datos.categoria} />
        )}

        {activeTab === 'canales' && <CanalesModal />}
      </main>

      {/* Official Argentine Footer with Midnight Navy matching the logo */}
      <footer className="no-print bg-[#0B192C] text-slate-300 py-5 sm:py-6 border-t border-[#1E3553] text-xs w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-8 h-8 rounded-lg bg-[#11223A] text-[#2B82C9] flex items-center justify-center font-black text-xs border border-[#1E3553] shadow-xs shrink-0">
              AR
            </div>
            <div>
              <p className="font-semibold text-white flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                Superintendencia de Servicios de Salud (SSSalud)
                <span className="text-[10px] text-[#E5B842] font-mono">ORIENTA IA</span>
              </p>
              <p className="text-[11px] sm:text-[12px] text-slate-400">
                Ministerio de Salud • Presidencia de la Nación • Bartolomé Mitre 434, CABA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] sm:text-[12px] text-slate-400 font-medium text-center">
              Canal de Orientación y Requisitos Previos (CAT)
            </span>
          </div>
        </div>
      </footer>

      {/* Indicador de conectividad PWA */}
      <OfflineIndicator />
    </div>
  );
}
