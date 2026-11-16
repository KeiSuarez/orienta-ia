/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tramite, CondicionLaboral, TipoEntidad, Beneficiario } from '../types';

export const CONDICION_LABELS: Record<CondicionLaboral, string> = {
  relacion_dependencia: 'Relación de dependencia',
  monotributista: 'Monotributo',
  monotributo_social: 'Monotributo social',
  servicio_domestico: 'Servicio doméstico',
  jubilado_pensionado: 'Jubilado/a o pensionado/a',
  seguro_desempleo: 'Seguro de desempleo',
  prepaga_adherente: 'Adherente directo de prepaga',
  prepaga_via_agente_seguro: 'Prepaga desregulada (vía Agente del Seguro)',
  no_informa: 'No informa'
};

export const TIPO_ENTIDAD_LABELS: Record<TipoEntidad, string> = {
  obra_social: 'Obra social',
  prepaga: 'Prepaga',
  no_informa: 'No informa'
};

export const BENEFICIARIO_LABELS: Record<Beneficiario, string> = {
  titular: 'Titular',
  conyuge_conviviente: 'Cónyuge o conviviente',
  hijo_menor_21: 'Hijo/a menor de 21 años',
  hijo_estudiante_21_25: 'Hijo/a estudiante de 21 a 25 años',
  persona_cud: 'Familiar con CUD (Discapacidad)',
  no_informa: 'No informa'
};

export const ENLACES_OFICIALES = {
  tad: 'https://tramitesadistancia.gob.ar',
  miArgentinaTurnos: 'https://mi.argentina.gob.ar/turnos',
  cav: 'https://cav.sssalud.gob.ar',
  miSssalud: 'https://www.sssalud.gob.ar',
  monotributoAgentes: 'https://www.argentina.gob.ar/sssalud/monotributo/agentes-de-salud',
  arca: 'https://www.arca.gob.ar'
};

export const TRAMITES_DATA: Tramite[] = [
  {
    id: 'negativa_afiliacion',
    nombre: 'Negativa de afiliación',
    tipo: 'denuncia',
    macro_categoria: 'Afiliación',
    en_mvp: true,
    descripcion: 'La entidad rechaza o impide la afiliación de la persona o de su grupo familiar.',
    ejemplos_usuario: [
      'La obra social no me quiere afiliar',
      'Soy monotributista y no me aceptan',
      'No me quieren tomar la afiliación'
    ],
    datos_a_preguntar: ['situacion', 'grupo_familiar', 'tipo_entidad'],
    requisitos: {
      comunes: [
        'Formulario de denuncia completo y firmado',
        'DNI del titular, frente y dorso',
        'DNI del apoderado o gestor, si interviene',
        'DNI de los integrantes del grupo familiar, cuando corresponda',
        'Documentación que acredite los vínculos familiares (partida de nacimiento, certificado de matrimonio o unión convivencial)',
        'Certificado de alumno regular, si se trata de hijo/a entre 21 y 25 años',
        'Certificado de discapacidad del hijo/a, si corresponde'
      ],
      por_situacion: {
        relacion_dependencia: ['Último recibo de sueldo'],
        monotributista: [
          'Último pago / cuenta corriente / libre deuda, según corresponda',
          'Formulario F.152',
          'Formulario F.184'
        ],
        monotributo_social: [
          'Último pago',
          'Carátula, constancia o credencial correspondiente'
        ],
        servicio_domestico: [
          'Último pago',
          'Formulario F.575, cuando corresponda'
        ],
        seguro_desempleo: [
          'Constancia de ANSES donde figure el Agente del Seguro',
          'Constancia de cantidad de cuotas',
          'Comprobante de cobro'
        ],
        jubilado_pensionado: ['Último recibo de haberes', 'CODEM de ANSES'],
        prepaga_adherente: ['Última factura paga']
      }
    },
    canal: {
      virtual: 'TAD - trámite 6020 (Datos del Trámite; Presentación de Reclamos de Beneficiarios; Balance, con el formulario adjunto en Balance)',
      presencial: 'Con turno previo en Mi Argentina',
      seguimiento: 'CAV / TINA / TAD'
    },
    notas: 'Las obras sociales no pueden rechazar la afiliación de monotributistas si están en el padrón habilitado ni de trabajadores en relación de dependencia con aportes en regla.',
    fuente: "Guía documentación §1; Manual CAT §4.2 y §13.2; Página oficial SSSalud 'Trámites, denuncias y consultas' (argentina.gob.ar/sssalud, oct. 2026)"
  },
  {
    id: 'cobertura_prestacional',
    nombre: 'Problemas o falta de cobertura prestacional',
    tipo: 'denuncia',
    macro_categoria: 'Cobertura',
    en_mvp: true,
    descripcion: 'Falta de cobertura o autorización de medicamentos, estudios, prácticas, tratamientos, cirugías, internaciones u otras prestaciones.',
    ejemplos_usuario: [
      'No me autorizan una resonancia',
      'La prepaga no me cubre el medicamento',
      'No me dan turno para una cirugía urgente',
      'Me rechazan la orden médica'
    ],
    datos_a_preguntar: ['tipo_entidad', 'situacion', 'grupo_familiar'],
    requisitos: {
      comunes: [
        'Formulario de denuncia completo y firmado',
        'DNI del titular',
        'DNI del apoderado o gestor, si corresponde',
        'DNI del grupo familiar, cuando corresponda',
        'Credencial del Agente del Seguro o prepaga',
        'Prescripción médica actualizada y legible',
        'Síntesis de historia clínica actualizada',
        'Justificación médica actualizada de la prestación reclamada'
      ],
      por_situacion: {
        relacion_dependencia: ['Último recibo de sueldo'],
        prepaga_via_agente_seguro: [
          'Último recibo de sueldo',
          'Última factura de la prepaga'
        ],
        prepaga_adherente: ['Última factura paga'],
        monotributista: [
          'Último pago / cuenta corriente / libre deuda',
          'Formulario F.152',
          'Formulario F.184'
        ],
        monotributo_social: [
          'Último pago',
          'Constancia o alta correspondiente',
          'Formulario F.152'
        ],
        servicio_domestico: [
          'Último pago',
          'Formulario F.575, cuando corresponda'
        ],
        seguro_desempleo: [
          'Constancia de ANSES que acredite hacia qué Obra Social se realizan los aportes'
        ],
        jubilado_pensionado: ['Último recibo de haberes']
      }
    },
    canal: {
      virtual: 'TAD - trámite 2723 (Datos del Trámite; Presentación de Reclamos de Beneficiarios; Balance, con el formulario adjunto en Balance)',
      presencial: 'Con turno previo en Mi Argentina',
      seguimiento: 'CAV / TINA / TAD'
    },
    notas: 'Es fundamental contar con la prescripción médica legible con diagnóstico presuntivo y justificación.',
    fuente: "Guía documentación §2; Manual CAT §4.3 y §13.3; Página oficial SSSalud 'Trámites, denuncias y consultas' (argentina.gob.ar/sssalud, oct. 2026)"
  },
  {
    id: 'discapacidad',
    nombre: 'Prestaciones de discapacidad',
    tipo: 'denuncia',
    macro_categoria: 'Discapacidad',
    en_mvp: true,
    descripcion: 'Falta de cobertura o autorización de una prestación vinculada a una persona con Certificado Único de Discapacidad (CUD).',
    ejemplos_usuario: [
      'No autorizan la terapia de mi hijo que tiene CUD',
      'Problemas con el transporte para discapacidad',
      'No cubren el acompañante terapéutico'
    ],
    datos_a_preguntar: ['tipo_entidad', 'situacion', 'tiene_cud'],
    requisitos: {
      comunes: [
        'Formulario de denuncia completo y firmado',
        'DNI del grupo familiar',
        'Documentación que acredite el vínculo entre el titular y la persona con discapacidad',
        'Credencial del Agente del Seguro o prepaga',
        'Certificado Único de Discapacidad (CUD) vigente y completo',
        'Resumen actualizado de historia clínica',
        'Orden médica de la prestación reclamada',
        'Acreditación de aportes o cuota (recibo de sueldo, monotributo, servicio doméstico, haberes previsionales o cuota de prepaga, según corresponda)'
      ],
      por_situacion: {}
    },
    canal: {
      virtual: 'TAD - Trámites a Distancia (número de trámite a confirmar)',
      presencial: 'Con turno previo (turnos SSSalud en Mi Argentina)',
      seguimiento: 'CAV / TINA / TAD'
    },
    notas: 'Las prestaciones de discapacidad cuentan con cobertura integral al 100% de acuerdo con la Ley 24.901 con CUD vigente.',
    fuente: "Guía documentación §3; Página oficial SSSalud 'Trámites, denuncias y consultas' (argentina.gob.ar/sssalud, oct. 2026)"
  },
  {
    id: 'aumento_edad',
    nombre: 'Aumento indebido de cuota por rango etario',
    tipo: 'denuncia',
    macro_categoria: 'Cuota',
    en_mvp: true,
    descripcion: 'Aumento de la cuota de la prepaga vinculado específicamente a la edad o rango etario.',
    ejemplos_usuario: [
      'Me aumentaron la cuota porque cumplí años',
      'Me cobran un adicional enorme por cumplir 65 años',
      'La prepaga me duplicó la cuota por la edad'
    ],
    datos_a_preguntar: ['tipo_entidad', 'fecha_ingreso'],
    requisitos: {
      comunes: [
        'Formulario de denuncia completo y firmado',
        'DNI del titular',
        'DNI del apoderado o gestor, si corresponde',
        'DNI del grupo familiar',
        'Credencial del titular y del grupo familiar',
        'Factura anterior al aumento',
        'Facturas posteriores al aumento hasta la fecha del reclamo',
        'Composición de la cuota, si se dispone',
        'Comprobante de fecha de ingreso a la entidad (contrato, credencial u otra constancia válida)'
      ],
      por_situacion: {}
    },
    canal: {
      virtual: 'TAD - Trámites a Distancia (número de trámite a confirmar)',
      presencial: 'Con turno previo (turnos SSSalud en Mi Argentina)',
      seguimiento: 'CAV / TINA / TAD'
    },
    notas: 'La Ley 26.682 y normativas de la SSSalud limitan y regulan los aumentos basados exclusivamente en la edad del afiliado.',
    fuente: "Guía documentación §4; Página oficial SSSalud 'Trámites, denuncias y consultas' (argentina.gob.ar/sssalud, oct. 2026)"
  },
  {
    id: 'ive',
    nombre: 'Negativa u obstáculos para la IVE',
    tipo: 'reclamo_especial',
    macro_categoria: 'IVE',
    en_mvp: true,
    descripcion: 'Obstaculización de la práctica o inconvenientes para acceder a la medicación. Formulario específico y confidencial.',
    ejemplos_usuario: [
      'No me quieren dar la medicación para la interrupción del embarazo',
      'Me ponen trabas para la IVE en la obra social'
    ],
    datos_a_preguntar: [],
    requisitos: {
      comunes: [
        'Formulario específico y confidencial',
        'Nombre y apellido',
        'Fecha de nacimiento',
        'DNI',
        'Domicilio',
        'Localidad / partido y provincia',
        'Correo electrónico',
        'Teléfono de contacto',
        'Indicación del inconveniente',
        'Descripción de lo sucedido'
      ],
      por_situacion: {}
    },
    canal: {
      virtual: 'TAD - Trámites a Distancia (número de trámite a confirmar)',
      presencial: 'Con turno previo (turnos SSSalud en Mi Argentina)',
      seguimiento: 'CAV / TINA / TAD'
    },
    notas: 'Tema sensible: el agente solo informa requisitos y NO pide datos personales ni detalles del caso.',
    fuente: "Guía documentación §5; Página oficial SSSalud 'Trámites, denuncias y consultas' (argentina.gob.ar/sssalud, oct. 2026)"
  },
  {
    id: 'unificacion_aportes',
    nombre: 'Unificación de aportes',
    tipo: 'tramite',
    macro_categoria: 'Aportes',
    en_mvp: true,
    descripcion: 'Reunir en una sola obra social los aportes de cónyuges o convivientes.',
    ejemplos_usuario: [
      'Quiero juntar los aportes con los de mi marido',
      'Queremos unificar aportes con mi pareja',
      'Juntar aportes entre cónyuges'
    ],
    datos_a_preguntar: ['situacion', 'vinculo'],
    requisitos: {
      comunes: [
        'Formulario de Unificación de Aportes',
        'DNI',
        'Certificado de matrimonio o constancia de unión convivencial/concubinato',
        'Certificación laboral del empleador actual',
        'Último recibo de sueldo o comprobantes de aportes, según corresponda'
      ],
      por_situacion: {
        monotributista: [
          'Formulario F.184',
          'Formulario F.152',
          'Constancia correspondiente si es Monotributo Social'
        ],
        servicio_domestico: [
          'Formulario F.102',
          'Formulario F.575 para adherentes, cuando corresponda'
        ]
      }
    },
    canal: {
      virtual: 'TAD - Trámites a Distancia (número de trámite a confirmar)',
      presencial: 'Con turno previo (turnos SSSalud en Mi Argentina)',
      seguimiento: 'CAV / TINA / TAD'
    },
    notas: 'Ambos miembros de la pareja deben estar activos en el sistema de salud y presentar acreditación de vínculo legal.',
    fuente: "Guía documentación §6; Página oficial SSSalud 'Trámites, denuncias y consultas' (argentina.gob.ar/sssalud, oct. 2026)"
  },
  {
    id: 'desunificacion_aportes',
    nombre: 'Desunificación de aportes',
    tipo: 'tramite',
    macro_categoria: 'Aportes',
    en_mvp: true,
    descripcion: 'Separar aportes que antes estaban unificados.',
    ejemplos_usuario: [
      'Nos divorciamos y quiero separar los aportes',
      'Terminó la convivencia y quiero desunificar aportes',
      'Separar los aportes de mi ex pareja'
    ],
    datos_a_preguntar: ['motivo'],
    requisitos: {
      comunes: [
        'Formulario de Desunificación de Aportes',
        'DNI de ambos cónyuges o convivientes',
        'Certificación laboral del empleador actual o recibo de sueldo',
        'Certificado o constancia que acredite el vínculo',
        'Documentación que justifique la desunificación (anulación de unión/concubinato, sentencia de divorcio, telegrama de renuncia, despido u otra constancia aplicable)'
      ],
      por_situacion: {}
    },
    canal: {
      virtual: 'TAD - Trámites a Distancia (número de trámite a confirmar)',
      presencial: 'Con turno previo (turnos SSSalud en Mi Argentina)',
      seguimiento: 'CAV / TINA / TAD'
    },
    notas: 'Permite que cada persona vuelva a derivar sus aportes individualmente tras la separación o cambio de vínculo.',
    fuente: "Guía documentación §7; Página oficial SSSalud 'Trámites, denuncias y consultas' (argentina.gob.ar/sssalud, oct. 2026)"
  },
  {
    id: 'unificacion_jubilados',
    nombre: 'Unificación de aportes de jubilados/pensionados',
    tipo: 'tramite',
    macro_categoria: 'Aportes',
    en_mvp: true,
    descripcion: 'Unificación de aportes cuando interviene una jubilación o pensión.',
    ejemplos_usuario: [
      'Soy jubilado y mi esposa trabaja, quiero unificar los aportes',
      'Mi esposo está jubilado y queremos unificar aportes',
      'Juntar aportes jubilatorio y activo'
    ],
    datos_a_preguntar: ['situacion_conyuge'],
    requisitos: {
      comunes: [
        'Formulario de Unificación de Aportes',
        'DNI',
        'Certificado de matrimonio o concubinato/unión convivencial',
        'Certificación laboral y último recibo de sueldo, cuando corresponda',
        'Comprobantes de monotributo, servicio doméstico o recibo de haberes previsionales, según el caso',
        'Certificación del vínculo emitida por ANSES'
      ],
      por_situacion: {
        monotributista: ['Formulario F.184', 'Formulario F.152'],
        servicio_domestico: [
          'Formulario F.102',
          'Formulario F.575, cuando corresponda'
        ]
      }
    },
    canal: {
      virtual: 'TAD - Trámites a Distancia (número de trámite a confirmar)',
      presencial: 'Con turno previo (turnos SSSalud en Mi Argentina)',
      seguimiento: 'CAV / TINA / TAD'
    },
    notas: 'Interviene ANSES en la validación y certificación del haber previsional y vínculo.',
    fuente: "Guía documentación §8; Página oficial SSSalud 'Trámites, denuncias y consultas' (argentina.gob.ar/sssalud, oct. 2026)"
  },
  {
    id: 'correccion_padron',
    nombre: 'Corrección del padrón',
    tipo: 'tramite',
    macro_categoria: 'Padrón',
    en_mvp: true,
    descripcion: 'Al iniciar una nueva relación laboral, corregir una opción de cambio hecha en un empleo anterior para que los aportes del nuevo empleador vayan a la obra social de la actividad.',
    ejemplos_usuario: [
      'Cambié de trabajo y sigo figurando en el empleador anterior',
      'Mis aportes siguen yendo a la obra social que elegí en el trabajo anterior',
      'El nuevo empleador aporta a la obra social equivocada por opción vieja'
    ],
    datos_a_preguntar: ['empleador_actual'],
    requisitos: {
      comunes: [
        'Formulario de Corrección de Padrón',
        'DNI',
        'Certificación laboral extendida por el empleador actual'
      ],
      por_situacion: {}
    },
    canal: {
      virtual: 'TAD - Trámites a Distancia (número de trámite a confirmar)',
      presencial: 'Con turno previo (turnos SSSalud en Mi Argentina)',
      seguimiento: 'CAV / TINA / TAD'
    },
    notas: 'Aplica cuando al cambiar de empleo se debe reencauzar el aporte hacia la obra social de origen de la nueva actividad sindical.',
    fuente: "Guía documentación §9; Página oficial SSSalud 'Trámites, denuncias y consultas' (argentina.gob.ar/sssalud, oct. 2026)"
  },
  {
    id: 'finalizacion_opcion',
    nombre: 'Finalización de opción de cambio',
    tipo: 'tramite',
    macro_categoria: 'Opción de cambio',
    en_mvp: true,
    descripcion: 'Finalizar una opción de cambio activa para acceder a la cobertura de una nueva obra social fuera del sistema nacional o de personal de dirección.',
    ejemplos_usuario: [
      'Me ascendieron a gerente y tengo que pasar a la obra social de personal de dirección',
      'Entré a trabajar en la provincia y tengo que cerrar la opción de cambio que hice',
      'Pasé al escalafón directivo o régimen especial'
    ],
    datos_a_preguntar: ['nuevo_empleo_o_cobertura'],
    requisitos: {
      comunes: [
        'Formulario de Finalización de Opción',
        'DNI',
        'Certificación laboral extendida por el empleador actual o último recibo de sueldo'
      ],
      por_situacion: {}
    },
    canal: {
      virtual: 'TAD - Trámites a Distancia (número de trámite a confirmar)',
      presencial: 'Con turno previo (turnos SSSalud en Mi Argentina)',
      seguimiento: 'CAV / TINA / TAD'
    },
    notas: "Según la SSSalud, no sirve para 'arrepentirse' de una opción: es para pasar a una obra social fuera del sistema o de personal de dirección.",
    fuente: "Guía documentación §10; Página oficial SSSalud 'Trámites, denuncias y consultas' (argentina.gob.ar/sssalud, oct. 2026)"
  },
  {
    id: 'opcion_cambio',
    nombre: 'Opción de cambio / libre elección del Agente del Seguro',
    tipo: 'tramite_online',
    macro_categoria: 'Opción de cambio',
    en_mvp: true,
    descripcion: 'Elegir un nuevo Agente del Seguro de Salud. Se realiza online, preferentemente desde una computadora.',
    ejemplos_usuario: [
      'Quiero cambiarme de obra social',
      'Pasarme a otra obra social',
      'Elegir nueva obra social'
    ],
    datos_a_preguntar: ['situacion', 'opcion_previa', 'obra_social_en_baja'],
    requisitos: {
      comunes: [
        'Clave Fiscal nivel 3 (usuario ARCA)',
        'DNI y CUIL/CUIT',
        'Datos personales y de contacto solicitados por el sistema',
        'Correo electrónico válido',
        'Seleccionar previamente el Agente del Seguro elegido',
        'Confirmar la opción desde el mail recibido dentro de las 48 horas (si no, se desestima)',
        "Tener adherido el servicio 'Mi SSSalud' a la Clave Fiscal (en ARCA, Administrador de Relaciones)"
      ],
      por_situacion: {
        monotributista: [
          'Consultar el listado vigente de agentes que aceptan monotributistas'
        ],
        jubilado_pensionado: [
          'Realizar la opción de cambio ante ANSES'
        ]
      }
    },
    canal: {
      virtual: "Solo online, desde Mi SSSalud (sitio de la SSSalud), con Clave Fiscal nivel 3 y el servicio 'Mi SSSalud' adherido en ARCA. Jubilados y pensionados: ante ANSES.",
      presencial: 'No (solo online)',
      seguimiento: 'CAV / TINA / TAD'
    },
    notas: 'Se puede hacer una vez por año (cada 365 días) y hay que quedarse al menos 1 año en la entidad elegida. Se confirma por mail dentro de las 48 h; si no, se desestima. Se activa el primer día del mes siguiente. No pueden optar, entre otros: quien terminó su relación laboral, quien cobra menos de dos bases mínimas, quien está en licencia por maternidad o excedencia, y personal de entidades no inscriptas en el RNAS (fuerzas armadas y de seguridad, Poder Judicial, Poder Legislativo, obras sociales provinciales). Monotributistas: solo entre agentes inscriptos en el registro de los que aceptan monotributistas.',
    fuente: "Guía documentación §11; Manual CAT §4.1, §8, §9 y §13.4; página oficial 'Realizar Opción de cambio' e instructivo 'Procedimiento Opción de Cambio' (SSSalud, 01/2025); Página oficial SSSalud 'Trámites, denuncias y consultas' (argentina.gob.ar/sssalud, oct. 2026)"
  }
];

export function getTramiteById(id: string): Tramite | undefined {
  return TRAMITES_DATA.find((t) => t.id === id);
}

export function getAllTramites(): Tramite[] {
  return TRAMITES_DATA;
}
