/**
 * Motor de conversación de Orienta IA (sin dependencia de servicios externos).
 *
 * 1. Reglas (decisionEngine): reconocen el problema por palabras clave y
 *    arman el checklist SIEMPRE a partir de la base de trámites (tramites.json).
 * 2. Preguntas guiadas: si las reglas no reconocen la consulta, el asistente
 *    pregunta el tema y después el trámite, con botones armados desde la base.
 * 3. Si la persona no encuentra su caso, se la deriva al canal oficial (CAV).
 *
 * Relación con el diagrama de clases: AsistenteIA.interpretarConsulta() ->
 * Consulta.asignarTramite() -> Tramite.obtenerRequisitos() -> Checklist.
 */

import {
  DecisionState,
  DecisionResponse,
  evaluateUserMessage,
  promptMissingData,
  generateFinalAnswer,
  startConsultationForTramite,
  detectarTipoEntidad,
  detectarCondicion,
  detectarBeneficiario
} from '../utils/decisionEngine';
import { checkPersonalData, sanitizeText } from '../utils/privacyGuard';
import { TRAMITES_DATA } from '../data/db/tramitesData';
import { TipoEntidad, CondicionLaboral, Beneficiario, QuickReply } from '../data/db/types';

export interface ResultadoMotor extends DecisionResponse {
  /** Aviso a mostrar si la persona escribió datos personales. */
  avisoPrivacidad?: string;
  fuente: 'reglas';
}

const PREFIJO_TEMA = 'tema:';
const PREFIJO_TRAMITE = 'tramite:';

const DERIVACION_CAV: DecisionResponse = {
  text: 'Para no darte una información equivocada, te recomiendo consultarlo en el Centro de Atención Virtual (CAV) de la SSSalud, donde pueden revisar tu caso puntual.',
  nextState: { step: 'derived' },
  isOfficialDerivation: true,
  loggedOutcome: 'Derivada al canal oficial',
  loggedTramiteId: '(sin clasificar)',
  quickReplies: [
    { label: 'Ir al Centro de Atención Virtual (CAV)', value: 'cav_link', type: 'accion' },
    { label: 'Hacer otra consulta', value: 'reiniciar', type: 'accion' }
  ]
};

/**
 * Las pensiones no las regula la SSSalud. Las pensiones no contributivas tienen
 * cobertura a través del programa Incluir Salud, que depende del Ministerio de Salud.
 */
const RESPUESTA_PENSION: DecisionResponse = {
  text: 'Las pensiones no están reguladas por la Superintendencia de Servicios de Salud, por eso no puedo orientarte con ese trámite.\n\nSi cobrás una **pensión no contributiva**, tu cobertura de salud es el programa **Incluir Salud**, que no es una obra social y depende directamente del **Ministerio de Salud de la Nación**. Las consultas y reclamos se hacen ante ese programa.\n\nSi además sos **jubilado/a** o tenés una obra social o prepaga, contame tu problema y te oriento.',
  nextState: { step: 'out_of_scope' },
  isOutOfScope: true,
  loggedOutcome: 'Aclaró su alcance',
  loggedTramiteId: '(sin clasificar)',
  quickReplies: [{ label: 'Hacer otra consulta', value: 'reiniciar', type: 'accion' }]
};

function mencionaPension(texto: string): boolean {
  const norm = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // "jubilado y pensionado" se trata como jubilado.
  return /\bpension/.test(norm) && !norm.includes('jubilad');
}

function quiereReiniciar(texto: string): boolean {
  const t = texto.toLowerCase();
  return t.includes('reiniciar') || t.includes('empezar de nuevo') || t.includes('otra consulta');
}

/** Temas disponibles, tomados de la base (macro_categoria de cada trámite). */
function temasDisponibles(): string[] {
  return Array.from(new Set(TRAMITES_DATA.map((t) => t.macro_categoria).filter(Boolean)));
}

/** Botones con los temas de la base, más "Ninguno de estos". */
function botonesDeTemas(): QuickReply[] {
  const opciones: QuickReply[] = temasDisponibles().map((tema) => ({
    label: tema,
    value: `${PREFIJO_TEMA}${tema}`,
    type: 'desambiguacion'
  }));
  opciones.push({ label: 'Ninguno de estos', value: 'derivar_cav', type: 'accion' });
  return opciones;
}

/** Datos del caso que la persona ya contó (cobertura, condición laboral, beneficiario). */
type DatosConocidos = Pick<DecisionState, 'tipoEntidad' | 'condicion' | 'beneficiario'>;

function datosDe(state: DecisionState): DatosConocidos {
  return { tipoEntidad: state.tipoEntidad, condicion: state.condicion, beneficiario: state.beneficiario };
}

/** Busca en el mensaje los datos del caso, aunque todavía no se sepa el trámite. */
function extraerDatos(texto: string, previos: DatosConocidos): DatosConocidos {
  return {
    tipoEntidad: detectarTipoEntidad(texto) ?? previos.tipoEntidad,
    condicion: detectarCondicion(texto) ?? previos.condicion,
    beneficiario: detectarBeneficiario(texto) ?? previos.beneficiario
  };
}

/** Completa el estado con los datos ya conocidos, sin pisar los que ya tenga. */
function completarCon(state: DecisionState, datos: DatosConocidos): DecisionState {
  return {
    ...state,
    tipoEntidad: state.tipoEntidad ?? datos.tipoEntidad,
    condicion: state.condicion ?? datos.condicion,
    beneficiario: state.beneficiario ?? datos.beneficiario
  };
}

/** Arranca un trámite usando los datos que la persona ya dio, para no volver a preguntarlos. */
function iniciarConDatos(tramiteId: string, datos: DatosConocidos): DecisionResponse {
  if (tramiteId === 'ive') return startConsultationForTramite('ive');
  return promptMissingData(
    completarCon(
      { step: 'ask_entidad', tramiteId, tipoEntidad: tramiteId === 'aumento_edad' ? 'prepaga' : undefined },
      datos
    )
  );
}

/** Pregunta guiada: ¿sobre qué tema es tu consulta? */
function preguntarTema(texto: string, intentos: number, datos: DatosConocidos): DecisionResponse {
  return {
    text: texto,
    quickReplies: botonesDeTemas(),
    nextState: { step: 'init', disambiguationContext: 'general', intentosSinClasificar: intentos, ...datos }
  };
}

/**
 * Palabras que no describen un problema: saludos, pedidos genéricos de ayuda
 * o datos personales. Con estas palabras el asistente pregunta el trámite y no deriva.
 */
const PALABRAS_GENERICAS = new Set(
  (
    'hola buenas buen buenos dia dias tarde tardes noche noches que tal como estas gracias ' +
    'quiero queria quisiera necesito necesitaria tengo tendria hacer hago una un unas unos la el los las lo de del a al ' +
    'consulta consultar consultas pregunta preguntar duda dudas ayuda ayudar ayudame informacion info saber ' +
    'mi mis me yo es son esta por favor para con y o tramite tramites realizar iniciar empezar ' +
    'dni documento numero nro nombre llamo telefono celular cel mail correo email cuil cuit afiliado ' +
    'numero_protegido nombre_protegido telefono_protegido correo_protegido cuil_protegido afiliado_protegido ok si no dale bueno listo ' +
    // Datos del caso (no alcanzan para saber el trámite, pero se guardan para no volver a preguntarlos)
    'soy estoy trabajo obra social obras prepaga problema problemas inconveniente inconvenientes tema ' +
    'monotributista monotributo monotributo relacion dependencia blanco empleado empleada domestico domestica casas particulares ' +
    'jubilado jubilada desempleo seguro adherente titular hijo hija esposo esposa pareja conyuge familiar'
  ).split(' ')
);

function esMensajeGenerico(texto: string): boolean {
  const palabras = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\[([a-z_]+)\]/g, ' $1 ')
    .replace(/[^a-z_\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const significativas = palabras.filter((p) => !PALABRAS_GENERICAS.has(p) && p.length > 2);
  return significativas.length === 0;
}

/** Segunda pregunta guiada: los trámites del tema elegido. */
function preguntarTramiteDelTema(tema: string, datos: DatosConocidos): DecisionResponse {
  const tramites = TRAMITES_DATA.filter((t) => t.macro_categoria === tema);
  if (tramites.length === 1) {
    return iniciarConDatos(tramites[0].id, datos);
  }
  if (tramites.length === 0) {
    return preguntarTema('Elegí el tema de tu consulta:', 0, datos);
  }
  const opciones: QuickReply[] = tramites.map((t) => ({
    label: t.nombre,
    value: `${PREFIJO_TRAMITE}${t.id}`,
    type: 'desambiguacion'
  }));
  opciones.push({ label: 'Ninguno de estos', value: 'derivar_cav', type: 'accion' });

  const detalle = tramites.map((t) => `• **${t.nombre}:** ${t.descripcion}`).join('\n');
  return {
    text: `Sobre **${tema}** te puedo orientar en estos trámites:\n\n${detalle}\n\n¿Cuál se parece más a tu situación?`,
    quickReplies: opciones,
    nextState: { step: 'init', disambiguationContext: 'general', ...datos }
  };
}

/** Procesa un mensaje del ciudadano y devuelve la respuesta del asistente. */
export async function procesarMensaje(texto: string, estadoActual: DecisionState): Promise<ResultadoMotor> {
  const privacidad = checkPersonalData(texto);
  const avisoPrivacidad = privacidad.hasPersonalData ? privacidad.warningMessage : undefined;
  const limpio = privacidad.hasPersonalData ? sanitizeText(texto) : texto;
  const responder = (r: DecisionResponse): ResultadoMotor => ({ ...r, avisoPrivacidad, fuente: 'reglas' });

  // --- Respuestas de los botones del menú guiado ---
  if (limpio.startsWith(PREFIJO_TEMA)) {
    return responder(preguntarTramiteDelTema(limpio.slice(PREFIJO_TEMA.length), datosDe(estadoActual)));
  }
  if (limpio.startsWith(PREFIJO_TRAMITE)) {
    return responder(iniciarConDatos(limpio.slice(PREFIJO_TRAMITE.length), datosDe(estadoActual)));
  }
  if (limpio === 'derivar_cav') {
    return responder(DERIVACION_CAV);
  }

  // Pensionados: fuera del alcance de la SSSalud (programa Incluir Salud).
  if (mencionaPension(limpio)) {
    return responder(RESPUESTA_PENSION);
  }

  // Si ya terminó una consulta, el siguiente mensaje arranca una nueva.
  const terminado = ['complete', 'derived', 'out_of_scope'].includes(estadoActual.step);
  const state: DecisionState = terminado ? { step: 'init' } : estadoActual;

  // --- Etapas en las que el asistente espera un dato puntual ---
  if (!quiereReiniciar(limpio) && ['ask_entidad', 'ask_condicion', 'ask_beneficiario'].includes(state.step)) {
    const detectado =
      state.step === 'ask_entidad'
        ? detectarTipoEntidad(limpio)
        : state.step === 'ask_condicion'
          ? detectarCondicion(limpio)
          : detectarBeneficiario(limpio);

    if (detectado) {
      const next: DecisionState =
        state.step === 'ask_entidad'
          ? { ...state, tipoEntidad: detectado as TipoEntidad }
          : state.step === 'ask_condicion'
            ? { ...state, condicion: detectado as CondicionLaboral }
            : { ...state, beneficiario: detectado as Beneficiario };
      // Si en el mismo mensaje dio otros datos (p. ej. "obra social, soy monotributista"), se aprovechan.
      return responder(promptMissingData(completarCon(next, extraerDatos(limpio, {}))));
    }

    // No se entendió la respuesta: se vuelve a preguntar con las opciones en botones.
    const repregunta = promptMissingData(state);
    return responder({
      ...repregunta,
      text: `No llegué a entender bien tu respuesta. ${repregunta.text} Podés tocar una de las opciones.`
    });
  }

  // Datos del caso que ya contó la persona (en este mensaje o en los anteriores).
  const conocidos = extraerDatos(limpio, datosDe(state));

  // --- Consulta nueva: reglas por palabras clave ---
  const porReglas = evaluateUserMessage(limpio, state);
  const sinClasificar =
    porReglas.isOutOfScope || (porReglas.isOfficialDerivation && porReglas.loggedTramiteId === '(sin clasificar)');

  if (!sinClasificar) {
    // Las reglas identificaron el trámite: se completan los datos ya contados
    // y solo se pregunta lo que falta.
    const next = porReglas.nextState;
    if (next.tramiteId && ['ask_entidad', 'ask_condicion', 'ask_beneficiario'].includes(next.step)) {
      return responder(promptMissingData(completarCon(next, conocidos)));
    }
    return responder({ ...porReglas, nextState: next.step === 'disambiguation' ? completarCon(next, conocidos) : next });
  }

  // Fuera del alcance de la SSSalud (reglas de alcance): se aclara y no se insiste.
  if (porReglas.isOutOfScope) {
    return responder(porReglas);
  }

  // Saludos, "quiero consultar", datos personales: preguntamos el trámite, sin derivar.
  if (esMensajeGenerico(limpio)) {
    return responder(
      preguntarTema(
        'Contame qué trámite querés hacer o qué problema tuviste con tu obra social o prepaga. Si preferís, elegí el tema:',
        state.intentosSinClasificar ?? 0,
        conocidos
      )
    );
  }

  // Mensaje concreto que no se pudo identificar: volvemos a preguntar el tema.
  // Solo si después de dos intentos sigue sin identificarse, derivamos al CAV.
  const intentos = (state.intentosSinClasificar ?? 0) + 1;
  if (intentos <= 2) {
    return responder(
      preguntarTema(
        intentos === 1
          ? 'No llegué a identificar el trámite con lo que me contaste. Para orientarte bien, elegí el tema de tu consulta:'
          : 'Sigo sin poder identificar el trámite. Probá eligiendo el tema que más se parezca a tu situación:',
        intentos,
        conocidos
      )
    );
  }
  return responder(DERIVACION_CAV);
}

/** Arranca una consulta guiada para un trámite puntual. */
export function iniciarTramite(tramiteId: string): DecisionResponse {
  return startConsultationForTramite(tramiteId);
}

/** Genera el resultado final directamente a partir de los datos mínimos completos. */
export function resultadoDesdeDatos(state: DecisionState): DecisionResponse {
  return generateFinalAnswer({ ...state, step: 'complete' });
}