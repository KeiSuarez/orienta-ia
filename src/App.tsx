/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header, ActiveTab } from './components/Header';
import { Footer } from './components/Footer';
import { ChatAssistant } from './components/ChatAssistant';
import { RevisorChecklist } from './components/RevisorChecklist';
import { RedactorNota } from './components/RedactorNota';
import { CatalogoTramites } from './components/CatalogoTramites';
import { PanelOrganismo } from './components/PanelOrganismo';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [targetTramiteId, setTargetTramiteId] = useState<string>('cobertura_prestacional');
  const [autoStartTramiteId, setAutoStartTramiteId] = useState<string | null>(null);
  const [sessionConsultasCount, setSessionConsultasCount] = useState<number>(0);

  const handleOpenRevisor = (tramiteId: string) => {
    setTargetTramiteId(tramiteId);
    setActiveTab('revisor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenRedactor = (tramiteId: string) => {
    setTargetTramiteId(tramiteId);
    setActiveTab('redactor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectFromCatalogo = (tramiteId: string) => {
    setTargetTramiteId(tramiteId);
    setAutoStartTramiteId(tramiteId);
    setActiveTab('chat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConsultationCompleted = () => {
    setSessionConsultasCount((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FA] text-[#1F3A5F]">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sessionConsultasCount={sessionConsultasCount}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'chat' && (
          <ChatAssistant
            onOpenRevisor={handleOpenRevisor}
            onOpenRedactor={handleOpenRedactor}
            onConsultationCompleted={handleConsultationCompleted}
            autoStartTramiteId={autoStartTramiteId}
            onClearAutoStart={() => setAutoStartTramiteId(null)}
          />
        )}

        {activeTab === 'revisor' && (
          <RevisorChecklist
            initialTramiteId={targetTramiteId}
            onNavigateToRedactor={handleOpenRedactor}
          />
        )}

        {activeTab === 'redactor' && (
          <RedactorNota initialTramiteId={targetTramiteId} />
        )}

        {activeTab === 'catalogo' && (
          <CatalogoTramites
            onSelectTramite={handleSelectFromCatalogo}
            onOpenChecklist={handleOpenRevisor}
          />
        )}

        {activeTab === 'panel' && <PanelOrganismo />}
      </main>

      {/* Mandatory Fixed Footer */}
      <Footer />
    </div>
  );
}
