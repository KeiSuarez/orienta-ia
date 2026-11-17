import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { logAnonymousConsultation } from '../data/db/simulatedData';
import { ENLACES_OFICIALES, TRAMITES_DATA } from '../data/db/tramitesData';
import { AsistenteIA, Ciudadano, Checklist, Consulta, RespuestaAsistente } from '../modelo';
import { OrientaLogo } from './OrientaLogo';
import { ocultarDatosPersonales } from '../utils/privacyGuard';

interface ChatInterfaceProps {
  /** La persona anónima que usa el asistente (clase Ciudadano). */
  ciudadano: Ciudadano;
  onUpdateDatos: (nuevosDatos: DatosMinimos) => void;
  onChecklistGenerado: (checklist: Checklist) => void;
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

/**
 * Palabras extra para reconocer cada trámite mientras la persona escribe
 * (se suman al nombre, la categoría y los ejemplos de tramites.json).
 */
const PALABRAS_SUGERENCIA: Record<string, string[]> = {
  negativa_afiliacion: ['afilia', 'rechaz', 'no me toman', 'no me aceptan', 'alta', 'sumar', 'incorporar'],
  cobertura_prestacional: ['cobertura', 'estudio', 'resonancia', 'medicamento', 'remedio', 'cirugia', 'receta', 'autoriz', 'practica', 'tratamiento', 'silla', 'protesis', 'internacion'],
  discapacidad: ['discapacidad', 'cud', 'terapia', 'acompanante', 'integradora', 'rehabilitacion'],
  aumento_edad: ['aumento', 'edad', 'cuota', 'etario', 'subieron', 'mas cara'],
  ive: ['ive', 'interrupcion', 'aborto'],
  unificacion_aportes: ['unificar', 'juntar', 'unir', 'aportes', 'pareja', 'conyuge'],
  desunificacion_aportes: ['desunific', 'separar', 'divorcio', 'separacion'],
  unificacion_jubilados: ['jubilad', 'unificar'],
  correccion_padron: ['padron', 'nuevo empleador', 'trabajo anterior', 'cambie de trabajo'],
  finalizacion_opcion: ['finalizar opcion', 'cerrar opcion', 'gerente', 'provincial'],
  opcion_cambio: ['cambio', 'cambiar', 'cambiarme', 'pasarme', 'otra obra social', 'opcion', 'traspaso']
};

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Busca hasta 4 trámites de la base que coincidan con lo que la persona está escribiendo. */
function buscarSugerencias(texto: string): { id: string; nombre: string }[] {
  const consulta = normalizar(texto.trim());
  if (consulta.length < 3) return [];
  const palabras = consulta.split(/\s+/).filter((p) => p.length >= 3);

  return TRAMITES_DATA.filter((t) => t.en_mvp !== false)
    .map((t) => {
      const nombre = normalizar(t.nombre);
      const categoria = normalizar(t.macro_categoria);
      const ejemplos = t.ejemplos_usuario.map(normalizar);
      const extra = PALABRAS_SUGERENCIA[t.id] ?? [];
      let puntaje = 0;
      if (nombre.includes(consulta) || categoria.includes(consulta)) puntaje += 5;
      if (ejemplos.some((e) => e.includes(consulta))) puntaje += 4;
      const palabrasTramite = `${nombre} ${categoria}`.split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
      for (const p of palabras) {
        if (palabrasTramite.some((w) => w.startsWith(p) || (w.length >= 4 && p.startsWith(w)))) puntaje += 2;
        if (extra.some((k) => p.startsWith(k) || k.startsWith(p) || consulta.includes(k))) puntaje += 2;
        if (ejemplos.some((e) => e.includes(p))) puntaje += 1;
      }
      return { id: t.id, nombre: t.nombre, puntaje };
    })
    .filter((s) => s.puntaje >= 2)
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, 4)
    .map(({ id, nombre }) => ({ id, nombre }));
}

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
  ciudadano,
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
  // El asistente (clase AsistenteIA, ver src/modelo).
  const asistenteRef = useRef<AsistenteIA>(new AsistenteIA());
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  // Paso actual de la conversación: las sugerencias solo se muestran cuando no se está esperando un dato puntual.
  const [pasoActual, setPasoActual] = useState<string>('init');
  const sugerencias = useMemo(
    () => (['ask_entidad', 'ask_condicion', 'ask_beneficiario'].includes(pasoActual) ? [] : buscarSugerencias(inputText)),
    [inputText, pasoActual]
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Desplaza solo la caja del chat (no toda la página) hasta el último mensaje.
  useEffect(() => {
    const caja = feedRef.current;
    if (caja) caja.scrollTo({ top: caja.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  /** Aplica una respuesta del motor: actualiza estado, datos mínimos, checklist y registro anónimo. */
  const aplicarRespuesta = (consulta: Consulta, res: RespuestaAsistente) => {
    const next = consulta.getEstado();
    setPasoActual(next.step);
    ciudadano.actualizarDatos(consulta);
    onUpdateDatos({
      tramiteId: next.tramiteId ?? null,
      tipoEntidad: next.tipoEntidad ?? null,
      condicion: next.condicion ?? null,
      beneficiario: next.beneficiario ?? null,
    });

    let checklist: ChecklistFinal | undefined;
    if (res.checklist) {
      checklist = res.checklist.mostrar();
      onChecklistGenerado(res.checklist);
    }

    // Registro anónimo de la consulta (sin texto ni datos personales).
    if (res.loggedOutcome) {
      logAnonymousConsultation(consulta.aRegistroAnonimo(res.loggedOutcome, res.loggedTramiteId));
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
      { id: `user-${Date.now()}`, role: 'user', content: ocultarDatosPersonales(textoVisible ?? texto), timestamp: hora() },
    ]);
    setIsTyping(true);

    try {
      const consulta = ciudadano.ingresarConsulta(texto);
      const res = await asistenteRef.current!.interpretarConsulta(consulta, texto);
      aplicarRespuesta(consulta, res);
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

  /** Elegir una sugerencia inicia directamente la consulta guiada de ese trámite. */
  const elegirSugerencia = (id: string, nombre: string) => {
    handleSend(`tramite:${id}`, `Quiero consultar sobre: ${nombre}`);
  };

  const reiniciarConversacion = () => {
    setPasoActual('init');
    ciudadano.nuevaConsulta();
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
      <div className="space-y-1.5 text-[12.5px] sm:text-[13.5px] font-normal leading-normal text-[#0F172A]">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          if (trimmed.startsWith('### ')) {
            return (
              <h4
                key={idx}
                className="text-[13px] sm:text-[14px] font-bold text-[#2B82C9] uppercase tracking-wide pt-1.5 pb-0.5 border-b border-[#E2E8F0] flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-[#2B82C9] shrink-0" />
                <span>{trimmed.replace('### ', '')}</span>
              </h4>
            );
          }

          if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
            const itemText = trimmed.replace(/^[•-]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-0.5 text-[#0F172A]">
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
                className="p-2 sm:p-2.5 bg-[#EAF3FA]/80 border-l-3 border-[#2B82C9] rounded-r-xl text-[11.5px] sm:text-xs text-[#0B192C] my-1.5 leading-normal"
                dangerouslySetInnerHTML={{
                  __html: escapeHtml(trimmed).replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#2B82C9]">$1</strong>'),
                }}
              />
            );
          }

          if (trimmed === '') {
            return <div key={idx} className="h-0.5" />;
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
    <div className="flex flex-col flex-1 min-h-0 md:h-[calc(100dvh-185px)] md:min-h-[550px] max-w-5xl mx-auto px-1.5 xs:px-2 sm:px-4 pt-0 pb-1 sm:py-3 w-full">
      {/* Friendly Human Bar: Visible on desktop (md+), hidden on mobile to maximize chat input space */}
      <div className="mb-2 bg-white px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-[#E2E8F0] hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs">
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
      <div ref={feedRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-white rounded-2xl p-2.5 sm:p-5 border border-[#E2E8F0] space-y-2 sm:space-y-3.5 shadow-xs">
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
                className={`w-full max-w-[96%] sm:max-w-[82%] rounded-2xl p-2.5 sm:p-3.5 shadow-2xs transition-all ${
                  isAsst
                    ? 'bg-white text-[#0F172A] border border-[#E2E8F0] rounded-tl-sm'
                    : 'bg-[#0B192C] text-white rounded-tr-sm border border-[#1E3553]'
                }`}
              >
                {/* Speaker tag and timestamp */}
                <div
                  className={`flex items-center justify-between text-[11px] sm:text-[12px] mb-1.5 pb-1 border-b ${
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
                  <div className="mb-2 flex items-start gap-2 rounded-[10px] border border-[#F4D381] bg-[#FEF8E7] p-2 text-[11.5px] sm:text-xs text-[#8C650A]">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{msg.avisoPrivacidad}</span>
                  </div>
                )}

                {/* Message body */}
                {isAsst ? (
                  renderFormattedContent(msg.content)
                ) : (
                  <p className="text-[12.5px] sm:text-[13.5px] font-normal leading-normal whitespace-pre-wrap">{msg.content}</p>
                )}

                {/* If checklist was generated inside this message */}
                {msg.checklist && (
                  <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] bg-[#EAF3FA] p-3 sm:p-3.5 rounded-xl border border-[#CBDCEB]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#0B192C] text-[#E5B842] flex items-center justify-center shrink-0 shadow-xs border border-[#1E3553]">
                          <CheckCircle className="w-4 h-4 text-[#E5B842]" />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-[#0B192C] block">
                            Tu checklist está listo
                          </span>
                          <span className="text-[10.5px] sm:text-[11.5px] text-[#475569]">
                            {msg.checklist.docGeneral.length +
                              msg.checklist.docMedica.length +
                              msg.checklist.docLaboral.length}{' '}
                            requisitos organizados
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={onVerChecklist}
                        className="w-full sm:w-auto min-h-[40px] px-3.5 bg-[#2B82C9] hover:bg-[#2170B0] text-white rounded-[10px] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors duration-200 cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        Ver Checklist & Descargar PDF
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick replies chips: 2 options on welcome message; on follow-up questions hide if > 2 options */}
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div
                    className={`mt-2 pt-1.5 border-t border-[#E2E8F0] ${
                      !msg.id.startsWith('bienvenida') && msg.quickReplies.length > 2 ? 'hidden md:block' : 'block'
                    }`}
                  >
                    <div className="grid grid-cols-1 gap-1.5 sm:flex sm:flex-wrap">
                      {msg.quickReplies.map((reply, i) => (
                        <button
                          key={i}
                          onClick={() => manejarRespuestaRapida(reply)}
                          className={`w-full sm:w-auto min-h-[38px] px-3 py-1.5 rounded-[8px] bg-[#F4F8FC] hover:bg-[#EAF3FA] text-[#0B192C] text-[11.5px] sm:text-xs font-semibold border border-[#E2E8F0] hover:border-[#2B82C9] transition-all duration-200 items-center justify-between sm:justify-start gap-2 cursor-pointer text-left ${
                            msg.id.startsWith('bienvenida') && i >= 2 ? 'hidden md:flex' : 'flex'
                          }`}
                        >
                          <span className="leading-snug">{reply.label}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#2B82C9] shrink-0" />
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

      {/* Sugerencias de trámites mientras la persona escribe (autocompletado) */}
      {sugerencias.length > 0 && !isTyping && (
        <div className="mt-2.5 bg-white border border-[#CBDCEB] rounded-2xl p-2.5 shadow-xs" role="listbox" aria-label="Sugerencias de trámites">
          <div className="flex items-center gap-1.5 px-1 mb-1.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#E5B842]" />
            <span>¿Tu consulta es sobre alguno de estos trámites?</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sugerencias.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                role="option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegirSugerencia(s.id, s.nombre)}
                className={`min-h-[38px] px-3 py-1.5 rounded-[9px] bg-[#F4F8FC] hover:bg-[#EAF3FA] text-[#0B192C] text-xs font-semibold border border-[#E2E8F0] hover:border-[#2B82C9] transition-colors items-center gap-1.5 cursor-pointer text-left ${
                  idx >= 2 ? 'hidden md:flex' : 'flex'
                }`}
              >
                <span>{s.nombre}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#2B82C9] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="mt-1.5 sm:mt-3 bg-white p-1.5 sm:p-2.5 rounded-2xl border border-[#E2E8F0] shadow-xs shrink-0">
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
            className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center text-[#64748B] hover:text-[#0B192C] hover:bg-[#F4F8FC] rounded-[10px] transition-colors duration-200 cursor-pointer shrink-0"
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
            aria-autocomplete="list"
            className="flex-1 text-[13px] sm:text-sm text-[#0F172A] placeholder-[#94A3B8] placeholder:text-[12.5px] sm:placeholder:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2 bg-transparent focus:outline-none min-h-[40px] sm:min-h-[44px]"
            disabled={isTyping}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className={`min-h-[40px] sm:min-h-[44px] px-3.5 sm:px-4 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 shadow-xs shrink-0 ${
              inputText.trim() && !isTyping
                ? 'bg-[#2B82C9] hover:bg-[#2170B0] text-white cursor-pointer'
                : 'bg-[#F4F8FC] text-[#94A3B8] cursor-not-allowed'
            }`}
          >
            <span className="hidden xs:inline">Enviar</span>
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
