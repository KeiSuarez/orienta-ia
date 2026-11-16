/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Printer,
  FileCheck2,
  ExternalLink,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Info,
  CheckCircle2,
  FileText,
  HeartHandshake,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { ChatMessage, QuickReply, TramiteResultPayload } from '../types';
import { evaluateUserMessage, startConsultationForTramite, DecisionState } from '../utils/decisionEngine';
import { checkPersonalData } from '../utils/privacyGuard';
import { logAnonymousConsultation } from '../data/simulatedData';
import { ENLACES_OFICIALES, CONDICION_LABELS, TIPO_ENTIDAD_LABELS, getTramiteById } from '../data/tramitesData';

interface ChatAssistantProps {
  onOpenRevisor: (tramiteId: string) => void;
  onOpenRedactor: (tramiteId: string) => void;
  onConsultationCompleted: () => void;
  autoStartTramiteId?: string | null;
  onClearAutoStart?: () => void;
}

const INITIAL_GREETING =
  'Hola, soy Orienta IA, el asistente que te ayuda con tus trámites ante la Superintendencia de Servicios de Salud. Contame con tus palabras qué te pasó.';

interface TopicSuggestion {
  category: string;
  label: string;
  fullText: string;
  keywords: string[];
}

const TOPIC_SUGGESTIONS: TopicSuggestion[] = [
  {
    category: 'afiliacion',
    label: 'Afiliación',
    fullText: 'Quiero realizar una consulta sobre afiliación',
    keywords: ['afilia', 'afiliacion', 'rechazan', 'no me quieren afiliar', 'alta', 'adherir', 'sumar', 'incorporar', 'prepaga no me toma', 'obra social no me toma']
  },
  {
    category: 'cobertura',
    label: 'Cobertura',
    fullText: 'Quiero realizar una consulta sobre cobertura',
    keywords: ['cobertura', 'estudio', 'resonancia', 'medicamento', 'remedio', 'cirugia', 'receta', 'autorizacion', 'practica', 'remedios']
  },
  {
    category: 'discapacidad',
    label: 'Discapacidad',
    fullText: 'Quiero realizar una consulta sobre discapacidad',
    keywords: ['discapacidad', 'cud', 'terapia', 'acompanante', 'maestra integradora', 'transporte', 'rehabilitacion']
  },
  {
    category: 'opcion_cambio',
    label: 'Cambio de obra social',
    fullText: 'Quiero realizar una consulta sobre cambio de obra social',
    keywords: ['cambio', 'cambiar', 'pasar', 'elegir', 'otra obra social', 'opcion', 'traslado', 'traspaso']
  },
  {
    category: 'aumento_edad',
    label: 'Aumento por edad',
    fullText: 'Quiero realizar una consulta sobre aumento de cuota por edad',
    keywords: ['aumento', 'edad', 'cuota', 'etario', 'cumpli', 'anos', 'subieron', 'mas cara']
  },
  {
    category: 'unificacion',
    label: 'Unificación de aportes',
    fullText: 'Quiero realizar una consulta sobre unificación de aportes',
    keywords: ['unificar', 'juntar', 'unir', 'aportes', 'pareja', 'conyuge', 'marido', 'esposa', 'jubilado', 'jubilada']
  },
  {
    category: 'desunificacion',
    label: 'Desunificación de aportes',
    fullText: 'Quiero realizar una consulta sobre desunificación de aportes',
    keywords: ['desunificar', 'separar', 'divorcio', 'ex pareja', 'separacion']
  },
  {
    category: 'padron',
    label: 'Corrección del padrón',
    fullText: 'Quiero realizar una consulta sobre corrección del padrón',
    keywords: ['padron', 'nuevo empleador', 'trabajo anterior', 'empleo nuevo']
  },
  {
    category: 'ive',
    label: 'Interrupción voluntaria (IVE)',
    fullText: 'Quiero realizar una consulta sobre negativa u obstáculos para IVE',
    keywords: ['ive', 'embarazo', 'interrupcion', 'aborto', 'medicacion ive']
  }
];

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  onOpenRevisor,
  onOpenRedactor,
  onConsultationCompleted,
  autoStartTramiteId,
  onClearAutoStart
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'assistant',
      text: INITIAL_GREETING,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      quickReplies: [
        { label: 'No me autorizan una resonancia', value: 'No me autorizan una resonancia', type: 'accion' },
        { label: 'Quiero cambiarme de obra social', value: 'Quiero cambiarme de obra social', type: 'accion' },
        { label: 'Mi esposo está jubilado y queremos unificar aportes', value: 'Mi esposo está jubilado y queremos unificar aportes', type: 'accion' },
        { label: 'La prepaga no quiere sumar a mi mamá porque es grande', value: 'La prepaga no quiere sumar a mi mamá porque es grande', type: 'accion' }
      ]
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showBannerDetails, setShowBannerDetails] = useState(true);
  const [isMobileNoticeDismissed, setIsMobileNoticeDismissed] = useState(false);
  const [decisionState, setDecisionState] = useState<DecisionState>({ step: 'init' });
  const [checklistTildes, setChecklistTildes] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // If arriving from the catalog with a specific trámite selected to consult, start the flow automatically
  useEffect(() => {
    if (autoStartTramiteId) {
      const tr = getTramiteById(autoStartTramiteId);
      if (tr) {
        const userText = `Quiero realizar una consulta sobre ${tr.nombre}`;
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: userText,
          timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        };

        const response = startConsultationForTramite(tr.id);
        setDecisionState(response.nextState);

        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now() + 1}`,
          sender: 'assistant',
          text: response.text,
          quickReplies: response.quickReplies,
          tramiteResult: response.tramiteResult,
          isOfficialDerivation: response.isOfficialDerivation,
          isOutOfScope: response.isOutOfScope,
          timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, userMsg, assistantMsg]);
      }
      if (onClearAutoStart) {
        onClearAutoStart();
      }
    }
  }, [autoStartTramiteId, onClearAutoStart]);

  // Compute suggestions based on what the user is typing
  const matchingSuggestions = useMemo(() => {
    const raw = inputText.trim().toLowerCase();
    if (!raw) return [];

    const norm = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // If typing "quiero realizar una consulta sobre" or "consulta sobre" or "quiero"
    if (
      norm.startsWith('quiero') ||
      norm.startsWith('consulta') ||
      norm.includes('sobre') ||
      norm.includes('tramite') ||
      norm.includes('ayuda')
    ) {
      // Check if user is typing a specific keyword after "sobre"
      const parts = norm.split('sobre');
      const termAfterSobre = parts.length > 1 ? parts[1].trim() : '';

      if (termAfterSobre) {
        const filtered = TOPIC_SUGGESTIONS.filter(
          (s) =>
            s.label.toLowerCase().includes(termAfterSobre) ||
            s.keywords.some((k) => k.includes(termAfterSobre))
        );
        return filtered.length > 0 ? filtered : TOPIC_SUGGESTIONS.slice(0, 4);
      }

      // Default top suggestions requested by user: afiliacion, discapacidad, cobertura, etc.
      return TOPIC_SUGGESTIONS;
    }

    // Otherwise match keyword inside text
    return TOPIC_SUGGESTIONS.filter((s) =>
      s.keywords.some((kw) => norm.includes(kw) || kw.includes(norm)) ||
      s.label.toLowerCase().includes(norm) ||
      s.fullText.toLowerCase().includes(norm)
    );
  }, [inputText]);

  const handleSendMessage = (textToSend?: string) => {
    const rawText = textToSend || inputText;
    if (!rawText.trim()) return;

    // 1. Mandatory Privacy Guard Check
    const privacyCheck = checkPersonalData(rawText);

    // If the person wrote personal data (e.g. DNI, CUIL, phone),
    // NEVER repeat it, NEVER store it, and warn them immediately!
    if (privacyCheck.hasPersonalData) {
      const userBubbleText = 'Consulta con datos personales [información reservada por privacidad]';

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: userBubbleText,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      };

      const warningMsg: ChatMessage = {
        id: `asst-${Date.now() + 1}`,
        sender: 'assistant',
        text: privacyCheck.warningMessage + '\n\nContame brevemente qué problema tuviste (por ejemplo: "no me autorizan una práctica", "quiero afiliarme", "me aumentaron la cuota"), sin incluir números de documento.',
        isWarning: true,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        quickReplies: [
          { label: 'No me autorizan un estudio o remedio', value: 'No me autorizan una resonancia', type: 'accion' },
          { label: 'Problemas con la cuota por la edad', value: 'Me aumentaron la cuota por la edad', type: 'accion' },
          { label: 'Quiero cambiarme de obra social', value: 'Quiero cambiarme de obra social', type: 'accion' }
        ]
      };

      setMessages((prev) => [...prev, userMsg, warningMsg]);
      setInputText('');
      return;
    }

    // Normal message flow
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: rawText,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Evaluate in decision engine
    const response = evaluateUserMessage(rawText, decisionState);
    setDecisionState(response.nextState);

    // Log anonymous event if consultation reached an outcome
    if (response.loggedOutcome) {
      logAnonymousConsultation({
        tramite_detectado: response.loggedTramiteId || '(sin clasificar)',
        resultado: response.loggedOutcome,
        condicion: response.nextState.condicion ? CONDICION_LABELS[response.nextState.condicion] : 'No informa',
        tipo_entidad: response.nextState.tipoEntidad ? TIPO_ENTIDAD_LABELS[response.nextState.tipoEntidad] : 'No informa',
        provincia: 'Buenos Aires',
        rango_edad: '30 a 44'
      });
      onConsultationCompleted();
    }

    const assistantMsg: ChatMessage = {
      id: `asst-${Date.now() + 1}`,
      sender: 'assistant',
      text: response.text,
      quickReplies: response.quickReplies,
      tramiteResult: response.tramiteResult,
      isOfficialDerivation: response.isOfficialDerivation,
      isOutOfScope: response.isOutOfScope,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, assistantMsg]);
  };

  const handleQuickReply = (reply: QuickReply) => {
    if (reply.value === 'reiniciar') {
      handleRestart();
      return;
    }
    if (reply.value === 'ir_revisor') {
      if (decisionState.tramiteId) onOpenRevisor(decisionState.tramiteId);
      return;
    }
    if (reply.value === 'ir_redactor') {
      if (decisionState.tramiteId) onOpenRedactor(decisionState.tramiteId);
      return;
    }
    if (reply.value === 'cav_link') {
      window.open(ENLACES_OFICIALES.cav, '_blank');
      return;
    }

    handleSendMessage(reply.value);
  };

  const handleRestart = () => {
    setDecisionState({ step: 'init' });
    setChecklistTildes({});
    setIsMobileNoticeDismissed(false);
    setMessages([
      {
        id: `restart-${Date.now()}`,
        sender: 'assistant',
        text: INITIAL_GREETING,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        quickReplies: [
          { label: 'No me autorizan una resonancia', value: 'No me autorizan una resonancia', type: 'accion' },
          { label: 'Quiero cambiarme de obra social', value: 'Quiero cambiarme de obra social', type: 'accion' },
          { label: 'Mi esposo está jubilado y queremos unificar aportes', value: 'Mi esposo está jubilado y queremos unificar aportes', type: 'accion' },
          { label: 'La prepaga no quiere sumar a mi mamá porque es grande', value: 'La prepaga no quiere sumar a mi mamá porque es grande', type: 'accion' }
        ]
      }
    ]);
  };

  const toggleChecklistItem = (item: string) => {
    setChecklistTildes((prev) => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const handleSelectSuggestion = (suggestion: TopicSuggestion) => {
    handleSendMessage(suggestion.fullText);
  };

  const handlePrintChecklist = (result: TramiteResultPayload) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = [...result.checklistComunes, ...result.checklistSituacion]
      .map(
        (doc) => `
        <li style="margin-bottom: 8px; font-size: 14px;">
          <span style="display:inline-block; width:16px; height:16px; border:1px solid #333; margin-right:8px; vertical-align:middle;">
            ${checklistTildes[doc] ? '✓' : ''}
          </span>
          ${doc}
        </li>`
      )
      .join('');

    const pasosHtml = result.pasos
      .map((p, idx) => `<li style="margin-bottom: 6px; font-size: 14px;"><strong>Paso ${idx + 1}:</strong> ${p}</li>`)
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Checklist - ${result.tramite.nombre}</title>
        <style>
          body { font-family: 'Open Sans', Arial, sans-serif; padding: 24px; color: #1F3A5F; }
          h1 { font-family: 'Montserrat', Arial, sans-serif; color: #1F3A5F; font-size: 20px; border-bottom: 2px solid #2BB5A0; padding-bottom: 8px; }
          .badge { background: #E4F6F3; color: #1F3A5F; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .notice { background: #FFF4DC; border-left: 4px solid #E0AE3B; padding: 10px; font-size: 12px; margin: 16px 0; }
          .channel { background: #f0f4f8; padding: 12px; border-radius: 6px; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div>
          <span class="badge">Orienta IA · Para la SSSalud</span>
        </div>
        <h1>Checklist de documentación: ${result.tramite.nombre}</h1>
        <p><strong>Situación:</strong> ${CONDICION_LABELS[result.condicion] || 'General'} | <strong>Entidad:</strong> ${TIPO_ENTIDAD_LABELS[result.tipoEntidad]}</p>
        
        <div class="channel">
          <p><strong>Canal oficial de presentación:</strong></p>
          <p>${result.canalVirtual}</p>
        </div>

        <h3>Documentación requerida para presentar:</h3>
        <ul style="list-style-type: none; padding-left: 0;">
          ${itemsHtml}
        </ul>

        <h3>Pasos a seguir:</h3>
        <ol style="padding-left: 20px;">
          ${pasosHtml}
        </ol>

        <div class="notice">
          <strong>Aviso:</strong> Orienta IA · Solución desarrollada para la Superintendencia de Servicios de Salud. Versión de demostración: complementa los canales oficiales, no toma reclamos ni brinda asesoramiento legal.
        </div>
        <script>
          window.print();
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4">
      {/* Desktop-only Banner: "Cómo te acompañamos en trámites ante la SSSalud" */}
      <div className="hidden md:block bg-white border border-[#2BB5A0]/30 rounded-2xl p-4 sm:p-5 mb-5 shadow-xs transition-all">
        {/* Banner Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#E4F6F3] border border-[#2BB5A0]/40 text-[#2BB5A0] flex items-center justify-center flex-shrink-0">
              <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#1F3A5F] font-['Montserrat']">
                  Cómo te acompañamos en trámites ante la SSSalud
                </h3>
                <span className="bg-[#E4F6F3] text-[#1F3A5F] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-[#2BB5A0]/30">
                  Orientación & Acompañamiento
                </span>
              </div>
            </div>
          </div>

          {/* Toggle details button */}
          <button
            onClick={() => setShowBannerDetails(!showBannerDetails)}
            className="flex items-center space-x-1 text-xs font-semibold text-[#1F3A5F] hover:text-[#2BB5A0] px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex-shrink-0 cursor-pointer"
          >
            <span>{showBannerDetails ? 'Ocultar detalles' : 'Ver detalles'}</span>
            {showBannerDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Banner Subtitle / Explanation */}
        <p className="text-xs sm:text-[13px] text-gray-700 mt-2.5 leading-relaxed">
          <strong>Orienta está para escucharte, orientarte y facilitarte las cosas.</strong> Para proteger tu privacidad y garantizar que tu reclamo tenga validez legal, no tomamos denuncias directamente por este chat. Nuestra misión es entender tu situación, darte tu <strong>checklist exacto de documentación</strong> y dejarte todo preparado para que ingreses tu trámite en los canales oficiales habilitados (TAD o presencial con turno).
        </p>

        {/* Collapsible 3-column cards */}
        {showBannerDetails && (
          <div className="mt-4 pt-3.5 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Card 1: En qué te ayuda Orienta */}
              <div className="bg-[#F4FAF8] border border-[#2BB5A0]/25 rounded-xl p-3.5">
                <div className="flex items-center space-x-2 mb-2 text-[#1F3A5F]">
                  <CheckCircle2 className="w-4 h-4 text-[#2BB5A0] flex-shrink-0" />
                  <h4 className="font-bold text-xs sm:text-sm font-['Montserrat']">
                    En qué te ayuda Orienta
                  </h4>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  <li className="flex items-start space-x-1.5">
                    <span className="text-[#2BB5A0] font-bold">•</span>
                    <span>Te escucha con empatía en tu propio lenguaje.</span>
                  </li>
                  <li className="flex items-start space-x-1.5">
                    <span className="text-[#2BB5A0] font-bold">•</span>
                    <span>Revisa tu situación y condición de aportes.</span>
                  </li>
                  <li className="flex items-start space-x-1.5">
                    <span className="text-[#2BB5A0] font-bold">•</span>
                    <span>Te entrega el checklist listo para imprimir.</span>
                  </li>
                </ul>
              </div>

              {/* Card 2: Para cuidar tu gestión */}
              <div className="bg-[#F4FAF8] border border-[#2BB5A0]/25 rounded-xl p-3.5">
                <div className="flex items-center space-x-2 mb-2 text-[#1F3A5F]">
                  <HelpCircle className="w-4 h-4 text-[#2BB5A0] flex-shrink-0" />
                  <h4 className="font-bold text-xs sm:text-sm font-['Montserrat']">
                    Para cuidar tu gestión
                  </h4>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  <li className="flex items-start space-x-1.5">
                    <span className="text-[#2BB5A0] font-bold">•</span>
                    <span>No te pedirá claves fiscales ni contraseñas.</span>
                  </li>
                  <li className="flex items-start space-x-1.5">
                    <span className="text-[#2BB5A0] font-bold">•</span>
                    <span>Te evita vueltas o papeles faltantes en la mesa de entrada.</span>
                  </li>
                  <li className="flex items-start space-x-1.5">
                    <span className="text-[#2BB5A0] font-bold">•</span>
                    <span>Te guía paso a paso con las normas oficiales vigentes.</span>
                  </li>
                </ul>
              </div>

              {/* Card 3: Siguientes pasos oficiales */}
              <div className="bg-[#F4FAF8] border border-[#2BB5A0]/25 rounded-xl p-3.5">
                <div className="flex items-center space-x-2 mb-2 text-[#1F3A5F]">
                  <CheckCircle2 className="w-4 h-4 text-[#2BB5A0] flex-shrink-0" />
                  <h4 className="font-bold text-xs sm:text-sm font-['Montserrat']">
                    Siguientes pasos oficiales
                  </h4>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  <li className="flex items-start space-x-1.5">
                    <span className="text-[#2BB5A0] font-bold">•</span>
                    <span>Subir tu trámite a Trámites a Distancia (TAD).</span>
                  </li>
                  <li className="flex items-start space-x-1.5">
                    <span className="text-[#2BB5A0] font-bold">•</span>
                    <span>O presentarte con turno previo en Mi Argentina.</span>
                  </li>
                  <li className="flex items-start space-x-1.5">
                    <span className="text-[#2BB5A0] font-bold">•</span>
                    <span>Hacer valer tus derechos con el expediente iniciado.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile-only Notice at top of chat: disappears when conversation advances (messages.length > 1) or when closed */}
      {!isMobileNoticeDismissed && messages.length <= 1 && (
        <div className="md:hidden mb-3 bg-[#E4F6F3] border border-[#2BB5A0]/40 rounded-xl p-3 text-xs text-[#1F3A5F] flex items-start justify-between gap-2 shadow-xs transition-all">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-[#2BB5A0] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#1F3A5F] block font-['Montserrat'] text-[11px] uppercase tracking-wider mb-0.5">
                Acompañamiento y orientación
              </span>
              <p className="text-[11px] leading-relaxed text-slate-700">
                Orienta te ayuda a conocer tu trámite y armar tu checklist de documentación para presentarlo en TAD o con turno previo. No te pediremos claves ni datos personales.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileNoticeDismissed(true)}
            className="text-slate-400 hover:text-slate-600 p-1 text-xs font-bold cursor-pointer"
            aria-label="Cerrar aviso"
            title="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 min-h-[460px] max-h-[660px] overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#1F3A5F] text-white rounded-br-xs shadow-xs'
                    : msg.isWarning
                    ? 'bg-[#FFF4DC] border-2 border-[#E0AE3B] text-[#1F3A5F] rounded-bl-xs'
                    : msg.isOutOfScope
                    ? 'bg-slate-100 border border-slate-300 text-[#1F3A5F] rounded-bl-xs'
                    : 'bg-[#F6F8FA] border border-slate-200/80 text-[#1F3A5F] rounded-bl-xs shadow-2xs'
                }`}
              >
                {/* Assistant header tag */}
                {!isUser && (
                  <div className="flex items-center space-x-2 mb-2 pb-1.5 border-b border-slate-200/60 text-xs font-semibold text-[#1F3A5F]">
                    <span className="w-2 h-2 rounded-full bg-[#2BB5A0]" />
                    <span className="font-['Montserrat']">Orienta IA</span>
                    <span className="text-[10px] text-gray-500 font-normal">Para la SSSalud</span>
                  </div>
                )}

                {/* Message text with basic markdown */}
                <div className="whitespace-pre-line font-normal text-sm sm:text-base">
                  {msg.text.split('\n\n').map((paragraph, pIdx) => {
                    const formatted = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    return (
                      <p
                        key={pIdx}
                        className={pIdx > 0 ? 'mt-2.5' : ''}
                        dangerouslySetInnerHTML={{ __html: formatted }}
                      />
                    );
                  })}
                </div>

                {/* Final Trámite Structured Card */}
                {msg.tramiteResult && (() => {
                  const result = msg.tramiteResult;
                  return (
                    <div className="mt-4 pt-3 border-t border-slate-300/80">
                      <div className="bg-white rounded-xl border border-[#2BB5A0]/40 p-4 shadow-sm">
                        {/* Trámite Title & Badge */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <span className="bg-[#E4F6F3] text-[#1F3A5F] border border-[#2BB5A0]/30 text-xs font-bold px-2.5 py-1 rounded-md">
                            Trámite oficial detectado
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            {CONDICION_LABELS[result.condicion] || 'General'}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-[#1F3A5F] font-['Montserrat'] mb-2">
                          {result.tramite.nombre}
                        </h3>
                        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                          {result.tramite.descripcion}
                        </p>

                        {/* Official Channel Box */}
                        <div className="bg-[#1F3A5F] text-white rounded-lg p-3.5 mb-4 text-xs sm:text-sm">
                          <div className="font-bold font-['Montserrat'] flex items-center space-x-1.5 text-[#2BB5A0] mb-1">
                            <CheckCircle2 className="w-4 h-4 text-[#2BB5A0]" />
                            <span>Canal oficial para presentarlo</span>
                          </div>
                          <p className="text-gray-100 text-xs sm:text-sm leading-relaxed mb-2 font-medium">
                            {result.canalVirtual}
                          </p>
                          {result.canalPresencial && (
                            <p className="text-gray-300 text-[11px]">
                              Presencial: {result.canalPresencial}
                            </p>
                          )}
                          <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap gap-2 text-xs">
                            {result.tramite.id === 'opcion_cambio' ? (
                              <>
                                <a
                                  href={ENLACES_OFICIALES.miSssalud}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1 bg-[#2BB5A0] text-[#1F3A5F] font-bold px-3 py-1 rounded hover:bg-[#25a18e] transition-colors"
                                >
                                  <span>Portal Mi SSSalud</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={ENLACES_OFICIALES.arca}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1 bg-white/20 text-white font-semibold px-2.5 py-1 rounded hover:bg-white/30"
                                >
                                  <span>Adherir en ARCA</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </>
                            ) : (
                              <a
                                href={ENLACES_OFICIALES.tad}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 bg-[#2BB5A0] text-[#1F3A5F] font-bold px-3 py-1 rounded hover:bg-[#25a18e] transition-colors"
                              >
                                <span>Ingresar a TAD (Trámites a Distancia)</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <a
                              href={ENLACES_OFICIALES.cav}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 bg-white/10 text-gray-200 px-2.5 py-1 rounded hover:bg-white/20"
                            >
                              <span>Centro de Atención Virtual (CAV)</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        {/* Checklist Interactivo */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider font-['Montserrat'] flex items-center space-x-1.5">
                              <FileCheck2 className="w-4 h-4 text-[#2BB5A0]" />
                              <span>Checklist de documentos a juntar:</span>
                            </h4>
                            <span className="text-[11px] text-gray-500 font-medium">Tildá lo que ya tenés</span>
                          </div>

                          <ul className="space-y-1.5 text-xs text-[#1F3A5F]">
                            {result.checklistComunes.map((doc, idx) => {
                              const isChecked = !!checklistTildes[doc];
                              return (
                                <li
                                  key={`comun-${idx}`}
                                  onClick={() => toggleChecklistItem(doc)}
                                  className={`flex items-start space-x-2 p-2 rounded-lg cursor-pointer transition-colors border ${
                                    isChecked
                                      ? 'bg-[#E4F6F3] border-[#2BB5A0]/40 text-[#1F3A5F]'
                                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="mt-0.5 rounded text-[#2BB5A0] focus:ring-[#2BB5A0] w-4 h-4 cursor-pointer"
                                  />
                                  <span className={isChecked ? 'line-through text-gray-500' : 'font-medium'}>
                                    {doc}
                                  </span>
                                </li>
                              );
                            })}

                            {result.checklistSituacion.map((doc, idx) => {
                              const isChecked = !!checklistTildes[doc];
                              return (
                                <li
                                  key={`sit-${idx}`}
                                  onClick={() => toggleChecklistItem(doc)}
                                  className={`flex items-start space-x-2 p-2 rounded-lg cursor-pointer transition-colors border ${
                                    isChecked
                                      ? 'bg-[#E4F6F3] border-[#2BB5A0]/40 text-[#1F3A5F]'
                                      : 'bg-amber-50/50 border-amber-200/60 hover:bg-amber-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="mt-0.5 rounded text-[#2BB5A0] focus:ring-[#2BB5A0] w-4 h-4 cursor-pointer"
                                  />
                                  <div>
                                    <span className={isChecked ? 'line-through text-gray-500' : 'font-medium'}>
                                      {doc}
                                    </span>
                                    <span className="ml-2 text-[10px] text-amber-800 font-semibold uppercase bg-amber-100/80 px-1.5 py-0.2 rounded">
                                      Por tu situación ({CONDICION_LABELS[result.condicion] || 'Laboral'})
                                    </span>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>

                        {/* Pasos a seguir */}
                        <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
                          <h4 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider mb-2 font-['Montserrat']">
                            Pasos a seguir:
                          </h4>
                          <ol className="space-y-1.5 text-xs text-slate-700 list-decimal pl-4">
                            {result.pasos.map((paso, pIdx) => (
                              <li key={pIdx} className="leading-relaxed">
                                {paso}
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                          <button
                            onClick={() => handlePrintChecklist(result)}
                            className="flex items-center space-x-1.5 bg-[#1F3A5F] hover:bg-[#162a45] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Imprimir / descargar checklist</span>
                          </button>

                          <button
                            onClick={() => onOpenRevisor(result.tramite.id)}
                            className="flex items-center space-x-1.5 bg-[#2BB5A0] hover:bg-[#25a18e] text-[#1F3A5F] text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Abrir en Revisor de Checklist</span>
                          </button>

                          <button
                            onClick={() => onOpenRedactor(result.tramite.id)}
                            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-[#1F3A5F] text-xs font-semibold px-3 py-2 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Redactar modelo de nota</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Quick reply buttons inside bubble */}
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                    {msg.quickReplies.map((qr, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickReply(qr)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                          qr.type === 'desambiguacion'
                            ? 'bg-[#1F3A5F] text-white hover:bg-[#162a45] shadow-2xs'
                            : qr.type === 'tipo_entidad' || qr.type === 'condicion' || qr.type === 'beneficiario'
                            ? 'bg-[#2BB5A0] text-[#1F3A5F] hover:bg-[#25a18e] font-bold shadow-2xs'
                            : 'bg-white border border-slate-300 text-[#1F3A5F] hover:bg-slate-100'
                        }`}
                      >
                        <span>{qr.label}</span>
                        <ArrowRight className="w-3 h-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Dynamic Typing Suggestions Box */}
      <div className="relative mt-3">
        {/* If user is typing or input is focused, show live contextual suggestions */}
        {(inputText.trim().length > 0 || isInputFocused) && (
          <div className="mb-2 bg-white border border-[#2BB5A0]/40 rounded-xl p-2.5 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[11px] font-bold text-[#1F3A5F] font-['Montserrat'] flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2BB5A0]" />
                <span>
                  {inputText.trim().length > 0
                    ? 'Sugerencias para tu consulta:'
                    : '¿Sobre qué trámite querés consultar?'}
                </span>
              </span>
              <span className="text-[10px] text-gray-400">Hacé click para seleccionar</span>
            </div>

            {/* Chips or matching suggestion list */}
            <div className="flex flex-wrap gap-1.5">
              {(matchingSuggestions.length > 0 ? matchingSuggestions : TOPIC_SUGGESTIONS.slice(0, 5)).map(
                (sug) => (
                  <button
                    key={sug.category}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent losing input focus prematurely
                      handleSelectSuggestion(sug);
                    }}
                    className="text-xs bg-[#E4F6F3]/70 hover:bg-[#2BB5A0] hover:text-[#1F3A5F] text-[#1F3A5F] border border-[#2BB5A0]/30 font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{sug.label}</span>
                    <ArrowRight className="w-3 h-3 opacity-60" />
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => {
                // Short timeout to allow click on suggestions
                setTimeout(() => setIsInputFocused(false), 250);
              }}
              placeholder="Escribí qué te pasó o 'Quiero realizar una consulta sobre...'"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-[#1F3A5F] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2BB5A0] focus:border-transparent shadow-xs"
            />
          </div>
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-[#2BB5A0] hover:bg-[#25a18e] disabled:opacity-50 disabled:cursor-not-allowed text-[#1F3A5F] font-bold px-4 py-3 rounded-xl transition-colors flex items-center justify-center shadow-xs cursor-pointer"
            aria-label="Enviar mensaje"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Security notice underneath input */}
      <div className="mt-2 text-center text-[11px] text-gray-500 flex items-center justify-center space-x-1.5">
        <Info className="w-3.5 h-3.5 text-gray-400" />
        <span>Nunca te pediremos tu DNI, CUIL, contraseñas ni datos médicos. Tu consulta es anónima.</span>
      </div>
    </div>
  );
};
