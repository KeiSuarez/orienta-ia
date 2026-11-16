/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Tramite,
  TipoEntidad,
  CondicionLaboral,
  Beneficiario,
  QuickReply,
  TramiteResultPayload,
  ResultadoConsulta
} from '../types';
import { TRAMITES_DATA, getTramiteById, CONDICION_LABELS, TIPO_ENTIDAD_LABELS } from '../data/tramitesData';

export interface DecisionState {
  step: 'init' | 'disambiguation' | 'ask_entidad' | 'ask_condicion' | 'ask_beneficiario' | 'complete' | 'derived' | 'out_of_scope';
  tramiteId?: string;
  tipoEntidad?: TipoEntidad;
  condicion?: CondicionLaboral;
  beneficiario?: Beneficiario;
  disambiguationContext?: 'edad_vs_negativa' | 'unificacion_vs_jubilado' | 'opcion_vs_finalizacion' | 'general';
}

export interface DecisionResponse {
  text: string;
  quickReplies?: QuickReply[];
  tramiteResult?: TramiteResultPayload;
  nextState: DecisionState;
  isOfficialDerivation?: boolean;
  isOutOfScope?: boolean;
  loggedOutcome?: ResultadoConsulta;
  loggedTramiteId?: string;
}

// Out-of-scope triggers (unrelated to SSSalud / obras sociales / prepagas)
const OUT_OF_SCOPE_PATTERNS = [
  /viaje\s+a\s+bariloche/i,
  /bariloche/i,
  /sacar\s+el\s+dni/i,
  /renovar\s+el\s+dni/i,
  /pasaporte/i,
  /licencia\s+de\s+conducir/i,
  /receta\s+de/i,
  /precio\s+del\s+d[oó]lar/i,
  /cu[aá]nto\s+cuesta\s+un\s+viaje/i,
  /tiempo\s+mañana/i,
  /clima/i,
  /partido\s+de\s+f[uú]tbol/i,
  /comprar\s+un\s+auto/i,
  /alquiler\s+de/i,
  /vacaciones/i,
  /declaraci[oó]n\s+jurada\s+de\s+ganancias/i
];

// Helper to clean and normalize text
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Checks if query is completely outside the domain of health coverage / SSSalud.
 */
export function isQueryOutOfScope(text: string): boolean {
  for (const pattern of OUT_OF_SCOPE_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }

  const norm = normalize(text);

  // If asking general trivia or unrelated administrative tasks without any health/coverage keywords
  const healthKeywords = [
    'obra social', 'prepaga', 'salud', 'afilia', 'cobertura', 'medicamento', 'medico',
    'estudio', 'resonancia', 'cirugia', 'remedio', 'tratamiento', 'discapacidad', 'cud',
    'cuota', 'aumento', 'edad', 'ive', 'embarazo', 'aborto', 'aporte', 'unifica', 'desunifica',
    'padron', 'opcion', 'cambio', 'sssalud', 'anses', 'monotribut', 'empleador', 'recibo', 'sueldo'
  ];

  const hasHealthKeyword = healthKeywords.some((kw) => norm.includes(kw));

  // If query is short or long question like "cuanto cuesta..." or "donde queda..." without health words
  if (!hasHealthKeyword) {
    const generalQuestionWords = ['donde queda', 'como se hace', 'que hora es', 'quien es', 'precio de', 'cuanto vale'];
    if (generalQuestionWords.some((w) => norm.includes(w))) {
      return true;
    }
  }

  return false;
}

/**
 * Process a user message and returns the appropriate guidance response.
 */
export function evaluateUserMessage(userInput: string, currentState: DecisionState): DecisionResponse {
  const norm = normalize(userInput);

  // 1. Check if user is asking to start over
  if (norm.includes('reiniciar') || norm.includes('empezar de nuevo') || norm.includes('otra consulta')) {
    return {
      text: 'Dale, empezamos de nuevo. Contame qué problema tuviste con tu obra social o prepaga y te digo qué trámite corresponde.',
      quickReplies: [
        { label: 'No me autorizan un estudio o remedio', value: 'No me autorizan una resonancia', type: 'accion' },
        { label: 'Quiero cambiarme de obra social', value: 'Quiero cambiarme de obra social', type: 'accion' },
        { label: 'Quiero unificar aportes', value: 'Quiero unificar aportes', type: 'accion' },
        { label: 'No me quieren afiliar', value: 'La obra social no me quiere afiliar', type: 'accion' }
      ],
      nextState: { step: 'init' }
    };
  }

  // 2. Step 1: Out of scope check
  if (currentState.step === 'init' && isQueryOutOfScope(userInput)) {
    return {
      text: 'Solo puedo orientarte sobre trámites de obras sociales y prepagas ante la SSSalud.',
      nextState: { step: 'out_of_scope' },
      isOutOfScope: true,
      loggedOutcome: 'Aclaró su alcance',
      loggedTramiteId: '(sin clasificar)',
      quickReplies: [
        { label: 'Tengo un problema con mi obra social o prepaga', value: 'Tengo un problema de salud para consultar', type: 'reintento' },
        { label: 'Ver los 11 trámites disponibles', value: 'Ver catálogo de trámites', type: 'accion' }
      ]
    };
  }

  // 3. Handle active disambiguation step
  if (currentState.step === 'disambiguation') {
    if (currentState.disambiguationContext === 'edad_vs_negativa') {
      if (norm.includes('rechaz') || norm.includes('no quieren afiliar') || norm.includes('no afilian') || norm.includes('negativa')) {
        const state: DecisionState = { ...currentState, step: 'ask_entidad', tramiteId: 'negativa_afiliacion' };
        return promptMissingData(state);
      } else if (norm.includes('aument') || norm.includes('cuota') || norm.includes('mas cara') || norm.includes('cobran mas')) {
        const state: DecisionState = { ...currentState, step: 'ask_entidad', tramiteId: 'aumento_edad', tipoEntidad: 'prepaga' };
        return promptMissingData(state);
      } else if (norm.includes('duda') || norm.includes('no se') || norm.includes('no queda claro') || norm.includes('ambas')) {
        return {
          text: 'Para no darte una información equivocada, te recomiendo consultarlo en el Centro de Atención Virtual de la SSSalud.',
          nextState: { step: 'derived' },
          isOfficialDerivation: true,
          loggedOutcome: 'Derivada al canal oficial',
          loggedTramiteId: '(sin clasificar)',
          quickReplies: [
            { label: 'Ir al Centro de Atención Virtual (CAV)', value: 'cav_link', type: 'accion' },
            { label: 'Hacer otra consulta', value: 'reiniciar', type: 'accion' }
          ]
        };
      }
    }

    if (currentState.disambiguationContext === 'unificacion_vs_jubilado') {
      if (norm.includes('jubilad') || norm.includes('pension') || norm.includes('si')) {
        const state: DecisionState = { ...currentState, step: 'ask_condicion', tramiteId: 'unificacion_jubilados' };
        return promptMissingData(state);
      } else {
        const state: DecisionState = { ...currentState, step: 'ask_condicion', tramiteId: 'unificacion_aportes' };
        return promptMissingData(state);
      }
    }

    if (currentState.disambiguationContext === 'opcion_vs_finalizacion') {
      if (norm.includes('cerrar') || norm.includes('direccion') || norm.includes('provincia') || norm.includes('finalizar')) {
        const state: DecisionState = { ...currentState, step: 'ask_condicion', tramiteId: 'finalizacion_opcion' };
        return promptMissingData(state);
      } else {
        const state: DecisionState = { ...currentState, step: 'ask_condicion', tramiteId: 'opcion_cambio' };
        return promptMissingData(state);
      }
    }
  }

  // 4. Handle missing data collection steps
  if (currentState.step === 'ask_entidad') {
    let tipo: TipoEntidad = 'obra_social';
    if (norm.includes('prepaga')) tipo = 'prepaga';
    else if (norm.includes('obra social')) tipo = 'obra_social';

    const nextState: DecisionState = { ...currentState, tipoEntidad: tipo, step: 'ask_condicion' };
    return promptMissingData(nextState);
  }

  if (currentState.step === 'ask_condicion') {
    let cond: CondicionLaboral = 'relacion_dependencia';
    if (norm.includes('monotributo social')) cond = 'monotributo_social';
    else if (norm.includes('monotribut')) cond = 'monotributista';
    else if (norm.includes('servicio domestico') || norm.includes('empleada domestica') || norm.includes('casas particulares')) cond = 'servicio_domestico';
    else if (norm.includes('jubilad') || norm.includes('pensionad')) cond = 'jubilado_pensionado';
    else if (norm.includes('desempleo')) cond = 'seguro_desempleo';
    else if (norm.includes('adherente')) cond = 'prepaga_adherente';
    else if (norm.includes('dependencia') || norm.includes('sueldo') || norm.includes('empleado')) cond = 'relacion_dependencia';

    const nextState: DecisionState = { ...currentState, condicion: cond, step: 'ask_beneficiario' };
    return promptMissingData(nextState);
  }

  if (currentState.step === 'ask_beneficiario') {
    let ben: Beneficiario = 'titular';
    if (norm.includes('conyuge') || norm.includes('pareja') || norm.includes('marido') || norm.includes('espos')) ben = 'conyuge_conviviente';
    else if (norm.includes('menor') || norm.includes('hijo menor')) ben = 'hijo_menor_21';
    else if (norm.includes('estudiante') || norm.includes('facultad') || norm.includes('universidad')) ben = 'hijo_estudiante_21_25';
    else if (norm.includes('cud') || norm.includes('discapacidad')) ben = 'persona_cud';
    else if (norm.includes('mama') || norm.includes('madre') || norm.includes('padre') || norm.includes('familiar')) ben = 'conyuge_conviviente';

    const nextState: DecisionState = { ...currentState, beneficiario: ben, step: 'complete' };
    return generateFinalAnswer(nextState);
  }

  // 5. Detection from initial prompt

  // Case: "La prepaga no quiere sumar a mi mamá porque es grande" / "No quieren afiliar por la edad"
  if (
    (norm.includes('sumar') || norm.includes('afiliar') || norm.includes('incorporar') || norm.includes('tomar')) &&
    (norm.includes('grande') || norm.includes('edad') || norm.includes('abuel') || norm.includes('mayor') || norm.includes('mama') || norm.includes('madre') || norm.includes('padre'))
  ) {
    return {
      text: 'Cuando hay un problema para sumar a un familiar por la edad, se puede tratar de dos situaciones distintas:\n\n1. **Negativa de afiliación:** Si la prepaga o entidad rechaza directamente afiliarla.\n2. **Aumento por rango etario:** Si aceptan afiliarla pero le aplican una cuota excesiva o aumento injustificado por tener más edad.\n\n¿Cuál de las dos situaciones te está pasando?',
      quickReplies: [
        { label: 'Rechazan afiliarla por completo', value: 'Rechazan afiliarla', type: 'desambiguacion' },
        { label: 'Aceptan pero le aumentan la cuota por la edad', value: 'Aumentan la cuota por la edad', type: 'desambiguacion' },
        { label: 'No me queda claro / Tengo dudas', value: 'No me queda claro tengo dudas', type: 'desambiguacion' }
      ],
      nextState: {
        step: 'disambiguation',
        disambiguationContext: 'edad_vs_negativa'
      }
    };
  }

  // Case: "Mi esposo está jubilado y queremos unificar aportes" / "Soy jubilado y mi esposa trabaja..."
  if (
    (norm.includes('unificar') || norm.includes('juntar') || norm.includes('unir')) &&
    (norm.includes('jubilad') || norm.includes('pension'))
  ) {
    const state: DecisionState = {
      step: 'ask_condicion',
      tramiteId: 'unificacion_jubilados',
      condicion: 'jubilado_pensionado'
    };
    return promptMissingData(state);
  }

  // Case: "No me autorizan una resonancia" / Cobertura prestacional
  if (
    norm.includes('cobertura') ||
    norm.includes('resonancia') ||
    norm.includes('medicamento') ||
    norm.includes('remedio') ||
    norm.includes('estudio') ||
    norm.includes('analisis') ||
    norm.includes('cirugia') ||
    norm.includes('operacion') ||
    norm.includes('autorizan') ||
    norm.includes('autorizacion') ||
    norm.includes('tratamiento') ||
    norm.includes('prestacion') ||
    norm.includes('internacion') ||
    (norm.includes('no') && norm.includes('cubre'))
  ) {
    // If mentions CUD or discapacidad, route to discapacidad
    if (norm.includes('discapacidad') || norm.includes('cud')) {
      const state: DecisionState = {
        step: 'ask_entidad',
        tramiteId: 'discapacidad'
      };
      return promptMissingData(state);
    }

    const state: DecisionState = {
      step: 'ask_entidad',
      tramiteId: 'cobertura_prestacional'
    };
    // Pre-extract entidad if mentioned
    if (norm.includes('prepaga')) state.tipoEntidad = 'prepaga';
    if (norm.includes('obra social')) state.tipoEntidad = 'obra_social';

    return promptMissingData(state);
  }

  // Case: "Quiero cambiarme de obra social" / Opción de cambio
  if (
    norm.includes('cambiarme de obra social') ||
    norm.includes('cambiar de obra social') ||
    norm.includes('cambio de obra social') ||
    norm.includes('pasarme a otra obra social') ||
    norm.includes('elegir otra obra social') ||
    norm.includes('opcion de cambio') ||
    norm.includes('libre eleccion')
  ) {
    const state: DecisionState = {
      step: 'ask_condicion',
      tramiteId: 'opcion_cambio'
    };
    if (norm.includes('monotribut')) state.condicion = 'monotributista';
    if (norm.includes('jubilad') || norm.includes('pensionad')) state.condicion = 'jubilado_pensionado';
    return promptMissingData(state);
  }

  // Case: Discapacidad
  if (norm.includes('discapacidad') || norm.includes('cud') || norm.includes('acompanante terapeutico') || norm.includes('terapia')) {
    const state: DecisionState = {
      step: 'ask_entidad',
      tramiteId: 'discapacidad'
    };
    if (norm.includes('prepaga')) state.tipoEntidad = 'prepaga';
    if (norm.includes('obra social')) state.tipoEntidad = 'obra_social';
    return promptMissingData(state);
  }

  // Case: Aumento por edad
  if (
    (norm.includes('aumento') || norm.includes('cuota') || norm.includes('subieron') || norm.includes('duplicaron')) &&
    (norm.includes('edad') || norm.includes('anos') || norm.includes('cumpli') || norm.includes('rango etario'))
  ) {
    const state: DecisionState = {
      step: 'ask_condicion',
      tramiteId: 'aumento_edad',
      tipoEntidad: 'prepaga'
    };
    return promptMissingData(state);
  }

  // Case: Negativa de afiliación
  if (
    norm.includes('afiliacion') ||
    norm.includes('afiliar') ||
    norm.includes('no me quieren afiliar') ||
    norm.includes('rechazan la afiliacion') ||
    norm.includes('no me aceptan') ||
    norm.includes('no me toman') ||
    norm.includes('negativa de afiliacion')
  ) {
    const state: DecisionState = {
      step: 'ask_entidad',
      tramiteId: 'negativa_afiliacion'
    };
    if (norm.includes('prepaga')) state.tipoEntidad = 'prepaga';
    if (norm.includes('obra social')) state.tipoEntidad = 'obra_social';
    if (norm.includes('monotribut')) state.condicion = 'monotributista';
    return promptMissingData(state);
  }

  // Case: IVE
  if (norm.includes('ive') || norm.includes('interrupcion') || norm.includes('aborto') || norm.includes('embarazo')) {
    const state: DecisionState = {
      step: 'complete',
      tramiteId: 'ive',
      tipoEntidad: norm.includes('prepaga') ? 'prepaga' : 'obra_social',
      condicion: 'relacion_dependencia',
      beneficiario: 'titular'
    };
    return generateFinalAnswer(state);
  }

  // Case: Desunificación de aportes
  if (norm.includes('desunific') || norm.includes('separar aportes') || norm.includes('divorcio') || norm.includes('separamos')) {
    const state: DecisionState = {
      step: 'ask_condicion',
      tramiteId: 'desunificacion_aportes'
    };
    return promptMissingData(state);
  }

  // Case: Unificación de aportes general
  if (norm.includes('unific') || norm.includes('juntar aportes') || norm.includes('unir aportes')) {
    return {
      text: 'Para saber qué unificación te corresponde, decime:\n¿Alguno de los dos es jubilado/a o pensionado/a?',
      quickReplies: [
        { label: 'Sí, uno es jubilado/a o pensionado/a', value: 'Uno está jubilado', type: 'desambiguacion' },
        { label: 'No, ambos somos trabajadores activos', value: 'Ambos activos', type: 'desambiguacion' }
      ],
      nextState: {
        step: 'disambiguation',
        disambiguationContext: 'unificacion_vs_jubilado'
      }
    };
  }

  // Case: Corrección de padrón
  if (norm.includes('padron') || norm.includes('cambie de trabajo') || norm.includes('empleador anterior') || norm.includes('nueva relacion laboral')) {
    const state: DecisionState = {
      step: 'ask_condicion',
      tramiteId: 'correccion_padron',
      condicion: 'relacion_dependencia'
    };
    return promptMissingData(state);
  }

  // Case: Finalización de opción de cambio
  if (
    norm.includes('finalizacion de opcion') ||
    norm.includes('cerrar opcion') ||
    norm.includes('personal de direccion') ||
    norm.includes('gerente') ||
    norm.includes('obra social provincial')
  ) {
    const state: DecisionState = {
      step: 'ask_condicion',
      tramiteId: 'finalizacion_opcion'
    };
    return promptMissingData(state);
  }

  // Fallback: If still not clear after parsing
  return {
    text: 'Para no darte una información equivocada, te recomiendo consultarlo en el Centro de Atención Virtual de la SSSalud o elegir directamente uno de los trámites que orientamos.',
    quickReplies: [
      { label: 'Problemas de cobertura (TAD 2723)', value: 'No me autorizan una resonancia', type: 'accion' },
      { label: 'Opción de cambio de obra social', value: 'Quiero cambiarme de obra social', type: 'accion' },
      { label: 'Negativa de afiliación (TAD 6020)', value: 'La obra social no me quiere afiliar', type: 'accion' },
      { label: 'Ir al Centro de Atención Virtual (CAV)', value: 'cav_link', type: 'accion' }
    ],
    nextState: { step: 'derived' },
    isOfficialDerivation: true,
    loggedOutcome: 'Derivada al canal oficial',
    loggedTramiteId: '(sin clasificar)'
  };
}

/**
 * Prompts the user step-by-step for any missing data (tipo de cobertura, condición laboral, beneficiario).
 */
function promptMissingData(state: DecisionState): DecisionResponse {
  const tramite = state.tramiteId ? getTramiteById(state.tramiteId) : undefined;
  if (!tramite) {
    return {
      text: 'Para no darte una información equivocada, te recomiendo consultarlo en el Centro de Atención Virtual de la SSSalud.',
      nextState: { step: 'derived' },
      isOfficialDerivation: true,
      loggedOutcome: 'Derivada al canal oficial',
      loggedTramiteId: '(sin clasificar)'
    };
  }

  // 1. Missing tipo de entidad?
  if (tramite.datos_a_preguntar.includes('tipo_entidad') && !state.tipoEntidad) {
    return {
      text: `Entendido, para el trámite de **${tramite.nombre}**, ¿tu cobertura actual es una obra social o una empresa de medicina prepaga?`,
      quickReplies: [
        { label: 'Obra social', value: 'Obra social', type: 'tipo_entidad' },
        { label: 'Prepaga', value: 'Prepaga', type: 'tipo_entidad' }
      ],
      nextState: { ...state, step: 'ask_entidad' }
    };
  }

  // 2. Missing condicion?
  if (tramite.datos_a_preguntar.includes('situacion') && !state.condicion) {
    return {
      text: `¿Cuál es tu condición o situación laboral actual? Esto define qué comprobantes específicos vas a necesitar presentar.`,
      quickReplies: [
        { label: 'Relación de dependencia (en blanco)', value: 'Relación de dependencia', type: 'condicion' },
        { label: 'Monotributo', value: 'Monotributo', type: 'condicion' },
        { label: 'Monotributo social', value: 'Monotributo social', type: 'condicion' },
        { label: 'Servicio doméstico', value: 'Servicio doméstico', type: 'condicion' },
        { label: 'Jubilado/a o pensionado/a', value: 'Jubilado/a o pensionado/a', type: 'condicion' },
        { label: 'Seguro de desempleo', value: 'Seguro de desempleo', type: 'condicion' },
        { label: 'Adherente de prepaga', value: 'Adherente de prepaga', type: 'condicion' }
      ],
      nextState: { ...state, step: 'ask_condicion' }
    };
  }

  // 3. Missing beneficiario?
  if (tramite.datos_a_preguntar.includes('grupo_familiar') && !state.beneficiario) {
    return {
      text: `¿Para quién es la cobertura o el reclamo?`,
      quickReplies: [
        { label: 'Para mí (Titular)', value: 'Titular', type: 'beneficiario' },
        { label: 'Cónyuge o conviviente', value: 'Cónyuge o conviviente', type: 'beneficiario' },
        { label: 'Hijo/a menor de 21 años', value: 'Hijo/a menor de 21 años', type: 'beneficiario' },
        { label: 'Hijo/a estudiante (21 a 25 años)', value: 'Hijo/a estudiante de 21 a 25 años', type: 'beneficiario' },
        { label: 'Familiar con CUD (Discapacidad)', value: 'Familiar con CUD', type: 'beneficiario' }
      ],
      nextState: { ...state, step: 'ask_beneficiario' }
    };
  }

  // All needed fields present -> generate final answer
  return generateFinalAnswer({ ...state, step: 'complete' });
}

/**
 * Builds the final structured answer complying with Section 3.3 and 3.4.
 */
function generateFinalAnswer(state: DecisionState): DecisionResponse {
  const tramite = state.tramiteId ? getTramiteById(state.tramiteId) : undefined;
  if (!tramite) {
    return {
      text: 'Para no darte una información equivocada, te recomiendo consultarlo en el Centro de Atención Virtual de la SSSalud.',
      nextState: { step: 'derived' },
      isOfficialDerivation: true,
      loggedOutcome: 'Derivada al canal oficial',
      loggedTramiteId: '(sin clasificar)'
    };
  }

  const condicion = state.condicion || 'relacion_dependencia';
  const tipoEntidad = state.tipoEntidad || 'obra_social';
  const beneficiario = state.beneficiario || 'titular';

  // Gather checklist: comunes + situation specific
  const comunes = [...tramite.requisitos.comunes];
  let porSituacion: string[] = [];

  if (tramite.requisitos.por_situacion) {
    if (condicion && tramite.requisitos.por_situacion[condicion]) {
      porSituacion = [...tramite.requisitos.por_situacion[condicion]];
    } else if (condicion === 'monotributista' && tramite.requisitos.por_situacion['monotributista']) {
      porSituacion = [...tramite.requisitos.por_situacion['monotributista']];
    } else if (condicion === 'relacion_dependencia' && tramite.requisitos.por_situacion['relacion_dependencia']) {
      porSituacion = [...tramite.requisitos.por_situacion['relacion_dependencia']];
    }
  }

  // Custom steps depending on channel
  const pasos: string[] = [];
  if (tramite.id === 'opcion_cambio') {
    if (condicion === 'jubilado_pensionado') {
      pasos.push('Los jubilados y pensionados realizan la opción de cambio directamente ante ANSES (con turno previo o web oficial de ANSES).');
      pasos.push('Reuní tu último recibo de haberes y DNI.');
    } else {
      pasos.push('Ingresá al portal de ARCA con tu Clave Fiscal nivel 3 y confirmá que tengas adherido el servicio interactivo "Mi SSSalud" desde el Administrador de Relaciones.');
      pasos.push('Entrá a la plataforma Mi SSSalud desde una computadora y seleccioná el Agente del Seguro al que deseás cambiarte.');
      pasos.push('¡Muy importante!: Revisá tu correo electrónico y confirmá la opción desde el enlace recibido dentro de las 48 horas. Si no lo confirmás en ese plazo, el trámite se desestima automáticamente.');
      pasos.push('La opción se hace una vez cada 365 días y entra en vigencia el primer día del mes siguiente.');
    }
  } else if (tramite.id === 'negativa_afiliacion') {
    pasos.push('Juntá la documentación requerida y el formulario de denuncia completo y firmado.');
    pasos.push('Ingresá a la plataforma TAD (Trámites a Distancia) con tu DNI y clave fiscal o Mi Argentina.');
    pasos.push('Buscá el trámite código 6020: "Presentación de Reclamos de Beneficiarios".');
    pasos.push('Completá los "Datos del Trámite" y adjuntá el formulario de denuncia en el apartado "Balance" según la instrucción oficial.');
    pasos.push('Guardá el número de expediente generado para realizar el seguimiento en el Centro de Atención Virtual (CAV).');
  } else if (tramite.id === 'cobertura_prestacional') {
    pasos.push('Asegurate de contar con la prescripción médica legible con diagnóstico presuntivo, síntesis de historia clínica y justificación médica.');
    pasos.push('Ingresá a TAD (Trámites a Distancia) con tu clave.');
    pasos.push('Iniciá el trámite código 2723: "Presentación de Reclamos de Beneficiarios".');
    pasos.push('Adjuntá toda la documental médica y el formulario de denuncia en la sección indicada.');
    pasos.push('Hacé el seguimiento posterior con tu expediente en el CAV de la SSSalud.');
  } else {
    pasos.push('Juntá todos los documentos del checklist indicado abajo.');
    pasos.push('Canal virtual: Ingresá a Trámites a Distancia (TAD) (número de trámite a confirmar según catálogo oficial).');
    pasos.push('Canal presencial alternativo: Solicitá turno previo en la SSSalud a través de Mi Argentina.');
    pasos.push('Si necesitás asistencia directa, comunicate con el Centro de Atención Virtual (CAV) de la SSSalud.');
  }

  const payload: TramiteResultPayload = {
    tramite,
    tipoEntidad,
    condicion,
    beneficiario,
    checklistComunes: comunes,
    checklistSituacion: porSituacion,
    canalVirtual: tramite.canal.virtual,
    canalPresencial: tramite.canal.presencial,
    pasos,
    advertenciaPrivacidad: 'Orienta IA · Solución desarrollada para la Superintendencia de Servicios de Salud. Versión de demostración: complementa los canales oficiales, no toma reclamos ni brinda asesoramiento legal.'
  };

  let summaryText = `Te corresponde realizar el trámite de **${tramite.nombre}** ante la Superintendencia de Servicios de Salud.`;

  if (tramite.id === 'opcion_cambio') {
    summaryText += `\n\n📌 **Canal oficial:** Recordá que la opción de cambio es **solo online**, desde **Mi SSSalud**, con **Clave Fiscal nivel 3** y el servicio 'Mi SSSalud' adherido en ARCA. Se realiza una vez al año y debe confirmarse por mail dentro de las 48 horas.`;
    if (condicion === 'jubilado_pensionado') {
      summaryText += ` Como indicaste que intervenís como jubilado/a o pensionado/a, el cambio se gestiona ante **ANSES**.`;
    }
  } else if (tramite.id === 'cobertura_prestacional') {
    summaryText += `\n\n📌 **Canal oficial:** Se presenta a través de **TAD (Trámites a Distancia), trámite 2723**.`;
  } else if (tramite.id === 'negativa_afiliacion') {
    summaryText += `\n\n📌 **Canal oficial:** Se presenta a través de **TAD (Trámites a Distancia), trámite 6020**.`;
  } else {
    summaryText += `\n\n📌 **Canal oficial:** Se presenta por **TAD (número de trámite a confirmar)** o en forma presencial con **turno previo en Mi Argentina**.`;
  }

  summaryText += `\n\nAbajo tenés el checklist interactivo con los documentos que tenés que juntar para tu situación (${CONDICION_LABELS[condicion] || 'General'}), los pasos a seguir y los accesos oficiales.`;

  return {
    text: summaryText,
    tramiteResult: payload,
    nextState: { ...state, step: 'complete' },
    loggedOutcome: 'Respondida',
    loggedTramiteId: tramite.id,
    quickReplies: [
      { label: 'Revisar checklist completo', value: 'ir_revisor', type: 'accion' },
      { label: 'Generar modelo de nota', value: 'ir_redactor', type: 'accion' },
      { label: 'Hacer otra consulta', value: 'reiniciar', type: 'accion' }
    ]
  };
}

/**
 * Starts a direct guided consultation for a specific trámite selected from the catalog.
 */
export function startConsultationForTramite(tramiteId: string): DecisionResponse {
  const tramite = getTramiteById(tramiteId);
  if (!tramite) {
    return evaluateUserMessage(tramiteId, { step: 'init' });
  }

  // Specific initializations
  if (tramite.id === 'ive') {
    return generateFinalAnswer({
      step: 'complete',
      tramiteId: 'ive',
      tipoEntidad: 'obra_social',
      condicion: 'relacion_dependencia',
      beneficiario: 'titular'
    });
  }

  const initialState: DecisionState = {
    step: 'ask_entidad',
    tramiteId: tramite.id,
    tipoEntidad: tramite.id === 'aumento_edad' ? 'prepaga' : undefined
  };

  return promptMissingData(initialState);
}
