/**
 * Motor híbrido de Orienta IA.
 *
 * 1. Reglas (decisionEngine): clasifican las consultas típicas y arman el
 *    checklist SIEMPRE a partir de la base de 11 trámites (tramites.json).
 * 2. IA (Gemini, vía /api/interpretar): solo interpreta el texto libre cuando
 *    las reglas no alcanzan (consulta que no matchea ninguna palabra clave, o
 *    respuesta que no se entiende). Nunca redacta requisitos: devuelve qué
 *    trámite y qué datos detectó, y los requisitos salen de la base.
 *
 * Esto replica el diagrama de clases: AsistenteIA.interpretarConsulta() ->
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
import { getTramiteById, TRAMITES_DATA } from '../data/db/tramitesData';
import { TipoEntidad, CondicionLaboral, Beneficiario } from '../data/db/types';

export interface Interpretacion {
  tramite_id: string | null;
  tipo_entidad: TipoEntidad | null;
  condicion: CondicionLaboral | null;
  beneficiario: Beneficiario | null;
  fuera_de_alcance: boolean;
}

export interface ResultadoMotor extends DecisionResponse {
  /** Aviso a mostrar si la persona escribió datos personales. */
  avisoPrivacidad?: string;
  /** Qué parte del motor resolvió la respuesta (útil para la demo). */
  fuente: 'reglas' | 'ia';
}

async function interpretarConIA(texto: string, state: DecisionState): Promise<Interpretacion | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch('/api/interpretar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texto: sanitizeText(texto),
        etapa: state.step,
        tramiteActual: state.tramiteId ?? null,
        // Se envía el catálogo vigente para que la IA reconozca también los
        // trámites que el administrador haya agregado o editado.
        catalogo: TRAMITES_DATA.map((t) => ({
          id: t.id,
          nombre: t.nombre,
          descripcion: t.descripcion,
          ejemplos: t.ejemplos_usuario
        }))
      }),
      signal: controller.signal
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.interpretacion as Interpretacion) ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const RESPUESTA_FUERA_DE_ALCANCE: DecisionResponse = {
  text: 'Solo puedo orientarte sobre trámites de obras sociales y prepagas ante la SSSalud. Para otros temas te conviene consultar el organismo que corresponda.',
  nextState: { step: 'out_of_scope' },
  isOutOfScope: true,
  loggedOutcome: 'Aclaró su alcance',
  loggedTramiteId: '(sin clasificar)',
  quickReplies: [
    { label: 'Tengo un problema con mi obra social o prepaga', value: 'Tengo un problema con mi obra social', type: 'reintento' }
  ]
};

function quiereReiniciar(texto: string): boolean {
  const t = texto.toLowerCase();
  return t.includes('reiniciar') || t.includes('empezar de nuevo') || t.includes('otra consulta');
}

/** Procesa un mensaje del ciudadano y devuelve la respuesta del asistente. */
export async function procesarMensaje(texto: string, estadoActual: DecisionState): Promise<ResultadoMotor> {
  const privacidad = checkPersonalData(texto);
  const avisoPrivacidad = privacidad.hasPersonalData ? privacidad.warningMessage : undefined;
  const limpio = privacidad.hasPersonalData ? sanitizeText(texto) : texto;

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

    const conDato = (valor: string): DecisionState =>
      state.step === 'ask_entidad'
        ? { ...state, tipoEntidad: valor as TipoEntidad }
        : state.step === 'ask_condicion'
          ? { ...state, condicion: valor as CondicionLaboral }
          : { ...state, beneficiario: valor as Beneficiario };

    if (detectado) {
      return { ...promptMissingData(conDato(detectado)), avisoPrivacidad, fuente: 'reglas' };
    }

    // Las reglas no entendieron la respuesta: le pedimos a la IA que la interprete.
    const ia = await interpretarConIA(limpio, state);
    const campo =
      state.step === 'ask_entidad' ? ia?.tipo_entidad : state.step === 'ask_condicion' ? ia?.condicion : ia?.beneficiario;

    if (campo && campo !== 'no_informa') {
      return { ...promptMissingData(conDato(campo)), avisoPrivacidad, fuente: 'ia' };
    }

    const repregunta = promptMissingData(state);
    return {
      ...repregunta,
      text: `No llegué a entender bien tu respuesta. ${repregunta.text}`,
      avisoPrivacidad,
      fuente: 'reglas'
    };
  }

  // --- Consulta nueva o desambiguación: primero las reglas ---
  const porReglas = evaluateUserMessage(limpio, state);
  const sinClasificar =
    porReglas.isOfficialDerivation && porReglas.loggedTramiteId === '(sin clasificar)' && state.step === 'init';

  if (!sinClasificar) {
    return { ...porReglas, avisoPrivacidad, fuente: 'reglas' };
  }

  // Las reglas no reconocieron la consulta: interpreta la IA.
  const ia = await interpretarConIA(limpio, state);

  if (ia?.fuera_de_alcance) {
    return { ...RESPUESTA_FUERA_DE_ALCANCE, avisoPrivacidad, fuente: 'ia' };
  }

  const tramite = ia?.tramite_id ? getTramiteById(ia.tramite_id) : undefined;
  if (ia && tramite) {
    const base: DecisionState = {
      step: 'ask_entidad',
      tramiteId: tramite.id,
      tipoEntidad: ia.tipo_entidad && ia.tipo_entidad !== 'no_informa' ? ia.tipo_entidad : undefined,
      condicion: ia.condicion && ia.condicion !== 'no_informa' ? ia.condicion : undefined,
      beneficiario: ia.beneficiario && ia.beneficiario !== 'no_informa' ? ia.beneficiario : undefined
    };
    const respuesta = tramite.id === 'ive' ? startConsultationForTramite('ive') : promptMissingData(base);
    return {
      ...respuesta,
      text: `Por lo que me contás, tu caso corresponde a **${tramite.nombre}**.\n\n${respuesta.text}`,
      avisoPrivacidad,
      fuente: 'ia'
    };
  }

  // Ni reglas ni IA: derivamos al canal oficial (sin inventar información).
  return { ...porReglas, avisoPrivacidad, fuente: 'reglas' };
}

/** Arranca una consulta guiada desde el catálogo o desde la barra de datos mínimos. */
export function iniciarTramite(tramiteId: string): DecisionResponse {
  return startConsultationForTramite(tramiteId);
}

/** Genera el resultado final directamente a partir de los datos mínimos completos. */
export function resultadoDesdeDatos(state: DecisionState): DecisionResponse {
  return generateFinalAnswer({ ...state, step: 'complete' });
}
