import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  RotateCcw,
  FileText,
  User,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  FileSearch,
  PenTool,
} from 'lucide-react';
import { ChatMessage, ChecklistFinal, DatosMinimos, DATOS_VACIOS } from '../types';
import { QuickReply } from '../data/db/types';
import { DecisionState, DecisionResponse } from '../utils/decisionEngine';
import { procesarMensaje } from '../services/orientaEngine';
import { payloadAChecklist } from '../data/db/checklistAdapter';
import { logAnonymousConsultation } from '../data/db/simulatedData';
import { CONDICION_LABELS, TIPO_ENTIDAD_LABELS, ENLACES_OFICIALES } from '../data/db/tramitesData';
import { OrientaLogo } from './OrientaLogo';

interface ChatInterfaceProps {
  onUpdateDatos: (nuevosDatos: DatosMinimos) => void;
  onChecklistGenerado: (checklist: ChecklistFinal) => void;
  onVerChecklist: () => void;
  onAbrirRedactor: () => void;
  onAbrirAuditor: () => void;
}

const CASOS_FRECUENTES: QuickReply[] = [
  { label: 'No me autorizan una resonancia', value: 'No me autorizan una resonancia', type: 'accion' },
  { label: 'Quiero cambiarme de obra social', value: 'Quiero cambiarme de obra social', type: 'accion' },
  { label: 'Mi esposo está jubilado y queremos unificar aportes', value: 'Mi esposo está jubilado y queremos unificar aportes', type: 'accion' },
  { label: 'La prepaga no quiere sumar a mi mamá porque es grande', value: 'La prepaga no quiere sumar a mi mamá porque es grande', type: 'accion' },
];

const MENSAJE_BIENVENIDA = `Hola, soy **Orienta IA**, el asistente que te ayuda con tus trámites ante la Superintendencia de Servicios de Salud (SSSalud).

Mi objetivo es que llegues con la documentación completa y no pierdas tiempo. No hace falta que me des tu nombre, DNI ni datos personales.

Contame con tus palabras: **¿qué te pasó con tu obra social o prepaga?**`;

const hora = () => new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Quita accesos a secciones que ya no existen (catálogo de trámites). */
function filtrarRespuestasCiudadano(replies?: QuickReply[]): QuickReply[] | undefined {
  return replies?.filter((r) => r.value !== 'ver_catalogo' && r.value !== 'Ver catálogo de trámites');
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onUpdateDatos,
  onChecklistGenerado,
  onVerChecklist,
  onAbrirRedactor,
  onAbrirAuditor,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'bienvenida',
      role: 'assistant',
      content: MENSAJE_BIENVENIDA,
      timestamp: hora(),
      quickReplies: CASOS_FRECUENTES,
    },
  ]);
  const [estado, setEstado] = useState<DecisionState>({ step: 'init' });
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Desplaza solo la caja del chat (no toda la página) hasta el último mensaje.
  useEffect(() => {
    const caja = feedRef.current;
    if (caja) caja.scrollTo({ top: caja.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  /** Aplica una respuesta del motor: actualiza estado, datos mínimos, checklist y registro anónimo. */
  const aplicarRespuesta = (res: DecisionResponse & { avisoPrivacidad?: string; fuente?: 'reglas' | 'ia' }) => {
    const next = res.nextState;
    setEstado(next);
    onUpdateDatos({
      tramiteId: next.tramiteId ?? null,
      tipoEntidad: next.tipoEntidad ?? null,
      condicion: next.condicion ?? null,
      beneficiario: next.beneficiario ?? null,
    });

    let checklist: ChecklistFinal | undefined;
    if (res.tramiteResult) {
      checklist = payloadAChecklist(res.tramiteResult);
      onChecklistGenerado(checklist);
    }

    if (res.loggedOutcome) {
      logAnonymousConsultation({
        tramite_detectado: res.loggedTramiteId || '(sin clasificar)',
        resultado: res.loggedOutcome,
        condicion: next.condicion ? CONDICION_LABELS[next.condicion] : undefined,
        tipo_entidad: next.tipoEntidad ? TIPO_ENTIDAD_LABELS[next.tipoEntidad] : undefined,
      });
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: res.text,
        timestamp: hora(),
        quickReplies: filtrarRespuestasCiudadano(res.quickReplies),
        checklist,
        avisoPrivacidad: res.avisoPrivacidad,
        fuente: res.fuente,
      },
    ]);
  };

  const handleSend = async (textoAEnviar?: string, textoVisible?: string) => {
    const texto = (textoAEnviar ?? inputText).trim();
    if (!texto || isTyping) return;

    setInputText('');
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: textoVisible ?? texto, timestamp: hora() },
    ]);
    setIsTyping(true);

    try {
      const res = await procesarMensaje(texto, estado);
      aplicarRespuesta(res);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Disculpame, hubo un problema al procesar tu consulta. Probá de nuevo en unos segundos.',
          timestamp: hora(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const reiniciarConversacion = () => {
    setEstado({ step: 'init' });
    onUpdateDatos(DATOS_VACIOS);
    setMessages([
      {
        id: `bienvenida-${Date.now()}`,
        role: 'assistant',
        content: 'Empezamos de nuevo. Contame con tus palabras: ¿qué problema o trámite necesitás consultar?',
        timestamp: hora(),
        quickReplies: CASOS_FRECUENTES,
      },
    ]);
  };

  const manejarRespuestaRapida = (reply: QuickReply) => {
    switch (reply.value) {
      case 'ir_revisor':
        onVerChecklist();
        return;
      case 'reiniciar':
        reiniciarConversacion();
        return;
      case 'cav_link':
        window.open(ENLACES_OFICIALES.cav, '_blank', 'noopener,noreferrer');
        return;
      case 'ir_redactor':
        onAbrirRedactor();
        return;
      default:
        handleSend(reply.value, reply.label);
    }
  };


  const renderFormattedContent = (content: string) => {
    // If the message contains a code block with JSON
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const preText = content.substring(0, jsonMatch.index).trim();
      const jsonStr = jsonMatch[1].trim();
      const postText = content.substring((jsonMatch.index || 0) + jsonMatch[0].length).trim();

      return (
        <div className="space-y-3 text-[14px] sm:text-[15px] leading-relaxed">
          {preText && renderFormattedContent(preText)}
          <div className="bg-[#0B192C] border border-[#1E3553] text-[#EAF3FA] rounded-xl p-3 sm:p-3.5 shadow-xs font-mono text-[11px] sm:text-xs overflow-x-auto my-2">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/15 text-[10px] text-slate-300 font-sans uppercase font-bold tracking-wider">
              <span className="text-[#2B82C9]">Resumen estructurado</span>
            </div>
            <pre className="text-white leading-relaxed whitespace-pre font-mono text-[11px] sm:text-xs">
              {jsonStr}
            </pre>
          </div>
          {postText && renderFormattedContent(postText)}
        </div>
      );
    }

    const lines = content.split('\n');

    return (
      <div className="space-y-2 text-[14px] sm:text-[15px] font-normal leading-relaxed text-[#0F172A]">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          if (trimmed.startsWith('### ')) {
            return (
              <h4
                key={idx}
                className="text-[15px] sm:text-[16px] font-bold text-[#2B82C9] uppercase tracking-wide pt-2.5 pb-1 border-b border-[#E2E8F0] flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-[#2B82C9] shrink-0" />
                <span>{trimmed.replace('### ', '')}</span>
              </h4>
            );
          }

          if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
            const itemText = trimmed.replace(/^[•-]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-0.5 text-[#0F172A]">
                <span className="text-[#2B82C9] font-bold leading-5 shrink-0">•</span>
                <span
                  className="flex-1"
                  dangerouslySetInnerHTML={{
                    __html: escapeHtml(itemText)
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#0B192C]">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>'),
                  }}
                />
              </div>
            );
          }

          if (trimmed.startsWith('> ') || trimmed.startsWith('💡 ')) {
            return (
              <div
                key={idx}
                className="p-3 bg-[#EAF3FA]/80 border-l-3 border-[#2B82C9] rounded-r-xl text-xs sm:text-sm text-[#0B192C] my-2 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: escapeHtml(trimmed).replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#2B82C9]">$1</strong>'),
                }}
              />
            );
          }

          if (trimmed === '') {
            return <div key={idx} className="h-1" />;
          }

          return (
            <p
              key={idx}
              className="text-[#0F172A]"
              dangerouslySetInnerHTML={{
                __html: escapeHtml(trimmed)
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#0B192C]">$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>'),
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-185px)] min-h-[480px] sm:min-h-[550px] max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-3 w-full">
      {/* Friendly Human Bar: Reorganizes into single column / responsive wrap on mobile */}
      <div className="mb-2 bg-white px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5 text-[#0F172A]">
          <OrientaLogo size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-[#2B82C9] text-[13px] sm:text-[14px]">ORIENTA</span>
              <span className="font-bold text-[#E5B842] text-[13px] sm:text-[14px]">IA</span>
              <span className="text-slate-400 text-xs hidden xs:inline">•</span>
              <span className="text-[11px] sm:text-[12px] font-semibold text-[#475569] truncate">Atención Ciudadana</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-[#64748B] block truncate">
              Orientación personalizada y empática • SSSalud
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <>
              <button
                onClick={onAbrirAuditor}
                className="flex-1 sm:flex-none min-h-[38px] sm:min-h-[34px] px-2.5 sm:px-3 rounded-[8px] bg-[#F4F8FC] hover:bg-[#EAF3FA] text-[#1C68A6] border border-[#CBDCEB] font-semibold flex items-center justify-center gap-1.5 transition-colors duration-200 cursor-pointer text-[11px] sm:text-xs"
              >
                <FileSearch className="w-3.5 h-3.5 text-[#2B82C9] shrink-0" />
                <span>Revisar receta</span>
              </button>
              <button
                onClick={onAbrirRedactor}
                className="flex-1 sm:flex-none min-h-[38px] sm:min-h-[34px] px-2.5 sm:px-3 rounded-[8px] bg-[#F4F8FC] hover:bg-[#EAF3FA] text-[#1C68A6] border border-[#CBDCEB] font-semibold flex items-center justify-center gap-1.5 transition-colors duration-200 cursor-pointer text-[11px] sm:text-xs"
              >
                <PenTool className="w-3.5 h-3.5 text-[#2B82C9] shrink-0" />
                <span>Redactar nota</span>
              </button>
            </>
        </div>
      </div>

      {/* Chat scrollable feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto custom-scrollbar bg-white rounded-2xl p-3 sm:p-6 border border-[#E2E8F0] space-y-3.5 sm:space-y-4 shadow-xs">
        {messages.map((msg) => {
          const isAsst = msg.role === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2 sm:gap-3 ${isAsst ? 'justify-start' : 'justify-end'}`}
            >
              {isAsst && (
                <div className="mt-0.5 shrink-0 hidden xs:block">
                  <OrientaLogo size="sm" />
                </div>
              )}

              <div
                className={`w-full max-w-[94%] sm:max-w-[82%] rounded-2xl p-3.5 sm:p-4 shadow-2xs transition-all ${
                  isAsst
                    ? 'bg-white text-[#0F172A] border border-[#E2E8F0] rounded-tl-sm'
                    : 'bg-[#0B192C] text-white rounded-tr-sm border border-[#1E3553]'
                }`}
              >
                {/* Speaker tag and timestamp */}
                <div
                  className={`flex items-center justify-between text-[11px] sm:text-[12px] mb-2 pb-1.5 border-b ${
                    isAsst
                      ? 'border-[#E2E8F0] text-[#64748B]'
                      : 'border-white/15 text-slate-300'
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5">
                    {isAsst ? (
                      <>
                        <span className="text-[#2B82C9] font-extrabold text-[12px] sm:text-[13px]">ORIENTA</span>
                        <span className="text-[#E5B842] font-black text-[12px] sm:text-[13px]">IA</span>
                        <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF3FA] text-[#1C68A6] border border-[#CBDCEB]">
                          Para la SSSalud
                        </span>
                        {msg.fuente === 'ia' && (
                          <span
                            className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF8E7] text-[#8C650A] border border-[#F4D381] inline-flex items-center gap-1"
                            title="La IA interpretó tu mensaje; los requisitos salen de la base de trámites"
                          >
                            <Sparkles className="w-3 h-3" /> Interpretado con IA
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-white font-medium">Vos</span>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-[11px] text-slate-400">{msg.timestamp}</span>
                  </div>
                </div>

                {/* Aviso de privacidad si la persona escribió datos personales */}
                {msg.avisoPrivacidad && (
                  <div className="mb-2.5 flex items-start gap-2 rounded-[10px] border border-[#F4D381] bg-[#FEF8E7] p-2.5 text-[12px] sm:text-[13px] text-[#8C650A]">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{msg.avisoPrivacidad}</span>
                  </div>
                )}

                {/* Message body */}
                {isAsst ? (
                  renderFormattedContent(msg.content)
                ) : (
                  <p className="text-[14px] sm:text-[15px] font-normal leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}

                {/* If checklist was generated inside this message */}
                {msg.checklist && (
                  <div className="mt-4 pt-3 border-t border-[#E2E8F0] bg-[#EAF3FA] p-3.5 sm:p-4 rounded-xl border border-[#CBDCEB]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-[#0B192C] text-[#E5B842] flex items-center justify-center shrink-0 shadow-xs border border-[#1E3553]">
                          <CheckCircle className="w-5 h-5 text-[#E5B842]" />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-[#0B192C] block">
                            Tu checklist está listo
                          </span>
                          <span className="text-[11px] sm:text-[12px] text-[#475569]">
                            {msg.checklist.docGeneral.length +
                              msg.checklist.docMedica.length +
                              msg.checklist.docLaboral.length}{' '}
                            requisitos organizados
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={onVerChecklist}
                        className="w-full sm:w-auto min-h-[44px] px-4 bg-[#2B82C9] hover:bg-[#2170B0] text-white rounded-[10px] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors duration-200 cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        Abrir Checklist & Imprimir
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick replies chips with touch-friendly 44px min-height targets */}
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="mt-3.5 pt-2.5 border-t border-[#E2E8F0]">
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">
                      Podés responder rápido con un toque:
                    </span>
                    <div className="grid grid-cols-1 gap-1.5 sm:flex sm:flex-wrap">
                      {msg.quickReplies.map((reply, i) => (
                        <button
                          key={i}
                          onClick={() => manejarRespuestaRapida(reply)}
                          className="w-full sm:w-auto min-h-[42px] px-3.5 py-2.5 rounded-[9px] bg-[#F4F8FC] hover:bg-[#EAF3FA] text-[#0B192C] text-xs font-semibold border border-[#E2E8F0] hover:border-[#2B82C9] transition-all duration-200 flex items-center justify-between sm:justify-start gap-2 cursor-pointer text-left"
                        >
                          <span className="leading-snug">{reply.label}</span>
                          <ChevronRight className="w-4 h-4 text-[#2B82C9] shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!isAsst && (
                <div className="w-8 h-8 rounded-full bg-[#0B192C] text-white border border-[#1E3553] flex items-center justify-center shrink-0 shadow-xs mt-0.5 hidden xs:flex">
                  <User className="w-4 h-4 text-slate-200" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="hidden xs:block">
              <OrientaLogo size="sm" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm p-3.5 sm:p-4 border border-[#E2E8F0] shadow-2xs flex items-center gap-2.5">
              <div className="flex space-x-1 shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#2B82C9] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#E5B842] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#0B192C] animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-xs text-[#64748B] font-medium leading-tight">
                Orienta IA está analizando tu consulta...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar: 44px min-height targets and 16px mobile font to prevent auto-zoom */}
      <div className="mt-2.5 sm:mt-3 bg-white p-1.5 sm:p-2.5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-1.5 sm:gap-2"
        >
          <button
            type="button"
            onClick={reiniciarConversacion}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-[#64748B] hover:text-[#0B192C] hover:bg-[#F4F8FC] rounded-[10px] transition-colors duration-200 cursor-pointer shrink-0"
            title="Reiniciar conversación"
            aria-label="Reiniciar conversación"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribí tu consulta..."
            className="flex-1 text-base sm:text-sm text-[#0F172A] placeholder-[#94A3B8] px-2.5 sm:px-3 py-2 bg-transparent focus:outline-none min-h-[44px]"
            disabled={isTyping}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className={`min-h-[44px] px-3.5 sm:px-4 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 shadow-xs shrink-0 ${
              inputText.trim() && !isTyping
                ? 'bg-[#2B82C9] hover:bg-[#2170B0] text-white cursor-pointer'
                : 'bg-[#F4F8FC] text-[#94A3B8] cursor-not-allowed'
            }`}
          >
            <span className="hidden xs:inline">Enviar</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
