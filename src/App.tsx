/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { LoginView } from './components/LoginView';
import { Header, TabCiudadano, TabAdmin } from './components/Header';
import { ReglaDeOroBanner } from './components/ReglaDeOroBanner';
import { TrackingPills } from './components/TrackingPills';
import { ChatInterface } from './components/ChatInterface';
import { ChecklistView } from './components/ChecklistView';
import { CanalesModal } from './components/CanalesModal';
import { AiToolsModal } from './components/AiToolsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PanelOrganismo } from './components/admin/PanelOrganismo';
import { RedactorNota } from './components/ciudadano/RedactorNota';
import { GestionTramites } from './components/admin/GestionTramites';
import { ConsultasRegistradas } from './components/admin/ConsultasRegistradas';
import { DatosMinimos, ChecklistFinal, DATOS_VACIOS } from './types';
import { resultadoDesdeDatos } from './services/orientaEngine';
import { payloadAChecklist } from './data/db/checklistAdapter';
import { getTramiteById } from './data/db/tramitesData';

const TOKEN_KEY = 'orienta_admin_token';
const NOMBRE_KEY = 'orienta_admin_nombre';

function leerSesion(clave: string): string | null {
  try {
    return sessionStorage.getItem(clave);
  } catch {
    return null;
  }
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  // El ciudadano usa el asistente sin iniciar sesión. Solo el administrador se loguea.
  const [modo, setModo] = useState<'ciudadano' | 'login' | 'admin'>('ciudadano');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminNombre, setAdminNombre] = useState<string | null>(null);

  const [tabCiudadano, setTabCiudadano] = useState<TabCiudadano>('chat');
  const [tabAdmin, setTabAdmin] = useState<TabAdmin>('panel');

  const [datos, setDatos] = useState<DatosMinimos>(DATOS_VACIOS);
  const [checklist, setChecklist] = useState<ChecklistFinal | null>(null);

  // Si el administrador recarga la página, se valida su sesión con el servidor.
  useEffect(() => {
    const token = leerSesion(TOKEN_KEY);
    if (!token) return;
    fetch('/api/admin/verificar', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.ok) {
          setAdminToken(token);
          setAdminNombre(leerSesion(NOMBRE_KEY));
        } else {
          sessionStorage.removeItem(TOKEN_KEY);
        }
      })
      .catch(() => undefined);
  }, []);

  const irAdmin = () => setModo(adminToken ? 'admin' : 'login');

  const handleLoginSuccess = (token: string, nombre: string) => {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(NOMBRE_KEY, nombre);
    } catch {
      // ignorar
    }
    setAdminToken(token);
    setAdminNombre(nombre);
    setModo('admin');
  };

  const handleLogout = () => {
    if (adminToken) {
      fetch('/api/admin/logout', { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } }).catch(() => undefined);
    }
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(NOMBRE_KEY);
    } catch {
      // ignorar
    }
    setAdminToken(null);
    setAdminNombre(null);
    setModo('ciudadano');
  };

  /** Cambios hechos a mano en la barra de datos mínimos: si están completos, se arma el checklist. */
  const handleDatosManual = (nuevos: DatosMinimos) => {
    setDatos(nuevos);
    if (nuevos.tramiteId && nuevos.condicion && nuevos.beneficiario) {
      const res = resultadoDesdeDatos({
        step: 'complete',
        tramiteId: nuevos.tramiteId,
        tipoEntidad: nuevos.tipoEntidad ?? undefined,
        condicion: nuevos.condicion,
        beneficiario: nuevos.beneficiario,
      });
      if (res.tramiteResult) setChecklist(payloadAChecklist(res.tramiteResult));
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (modo === 'login') {
    return <LoginView onLoginSuccess={handleLoginSuccess} onCancel={() => setModo('ciudadano')} />;
  }

  const enAdmin = modo === 'admin' && adminToken;

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0F172A] flex flex-col font-sans relative antialiased overflow-x-hidden w-full">
      <Header
        modo={enAdmin ? 'admin' : 'ciudadano'}
        tabCiudadano={tabCiudadano}
        onTabCiudadano={setTabCiudadano}
        tabAdmin={tabAdmin}
        onTabAdmin={setTabAdmin}
        hasChecklist={checklist !== null}
        adminNombre={adminNombre}
        onIrAdmin={irAdmin}
        onLogout={handleLogout}
      />

      {enAdmin ? (
        <main className="flex-1 py-1.5 sm:py-4 px-1 xs:px-2 sm:px-4 w-full max-w-7xl mx-auto">
          {tabAdmin === 'panel' && <PanelOrganismo />}
          {tabAdmin === 'consultas' && <ConsultasRegistradas token={adminToken} onSesionVencida={handleLogout} />}
          {tabAdmin === 'tramites' && <GestionTramites />}
        </main>
      ) : (
        <>
          <div className="no-print w-full">
            <ReglaDeOroBanner />
          </div>

          {(tabCiudadano === 'chat' || tabCiudadano === 'checklist') && (
            <div className="no-print w-full">
              <TrackingPills datos={datos} onUpdateDatos={handleDatosManual} />
            </div>
          )}

          <main className="flex-1 py-1.5 sm:py-4 px-1 xs:px-2 sm:px-4 w-full max-w-7xl mx-auto flex flex-col">
            {/* El chat queda montado para no perder la conversación al cambiar de pestaña */}
            <div className={tabCiudadano === 'chat' ? 'contents' : 'hidden'}>
              <ChatInterface
                onUpdateDatos={setDatos}
                onChecklistGenerado={setChecklist}
                onVerChecklist={() => setTabCiudadano('checklist')}
                onAbrirRedactor={() => setTabCiudadano('redactor')}
                onAbrirAuditor={() => setTabCiudadano('herramientas-ia')}
              />
            </div>

            {tabCiudadano === 'checklist' && (
              <ChecklistView checklist={checklist} onCrearNuevo={() => setTabCiudadano('chat')} />
            )}

            {tabCiudadano === 'redactor' && (
              <RedactorNota initialTramiteId={datos.tramiteId ?? 'cobertura_prestacional'} />
            )}

            {tabCiudadano === 'herramientas-ia' && (
              <AiToolsModal categoriaActual={datos.tramiteId ? getTramiteById(datos.tramiteId)?.nombre ?? null : null} />
            )}

            {tabCiudadano === 'canales' && <CanalesModal />}
          </main>
        </>
      )}

      <footer className="no-print bg-[#0B192C] text-slate-300 py-5 sm:py-6 border-t border-[#1E3553] text-xs w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="text-center sm:text-left">
            <p className="font-semibold text-white flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              Orienta IA
              <span className="text-[10px] text-[#E5B842] font-mono">PROYECTO ACADÉMICO · IFTS 12</span>
            </p>
            <p className="text-[11px] sm:text-[12px] text-slate-400 mt-0.5 max-w-2xl">
              Orientación no vinculante sobre trámites ante la Superintendencia de Servicios de Salud. No es un canal oficial: no toma
              reclamos ni guarda datos personales. Los trámites se presentan por TAD o con turno en la SSSalud.
            </p>
          </div>
          {!enAdmin && (
            <button onClick={irAdmin} className="text-[11px] text-slate-400 hover:text-white underline underline-offset-2 cursor-pointer">
              Acceso administrador
            </button>
          )}
        </div>
      </footer>

      <OfflineIndicator />
    </div>
  );
}
