/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TramiteRequisitos {
  comunes: string[];
  por_situacion: Record<string, string[]>;
}

export interface TramiteCanal {
  virtual: string;
  presencial: string;
  seguimiento: string;
}

export interface Tramite {
  id: string;
  nombre: string;
  tipo: string;
  macro_categoria: string;
  en_mvp: boolean;
  descripcion: string;
  ejemplos_usuario: string[];
  datos_a_preguntar: string[];
  requisitos: TramiteRequisitos;
  canal: TramiteCanal;
  notas: string;
  fuente: string;
}

export type TipoEntidad = 'obra_social' | 'prepaga' | 'no_informa';

export type CondicionLaboral =
  | 'relacion_dependencia'
  | 'monotributista'
  | 'monotributo_social'
  | 'servicio_domestico'
  | 'jubilado_pensionado'
  | 'seguro_desempleo'
  | 'prepaga_adherente'
  | 'prepaga_via_agente_seguro'
  | 'no_informa';

export type Beneficiario =
  | 'titular'
  | 'conyuge_conviviente'
  | 'hijo_menor_21'
  | 'hijo_estudiante_21_25'
  | 'persona_cud'
  | 'no_informa';

export type ResultadoConsulta = 'Respondida' | 'Derivada al canal oficial' | 'Aclaró su alcance';

export interface EventoConsulta {
  fecha: string;
  tramite_detectado: string;
  resultado: ResultadoConsulta;
  condicion: string;
  tipo_entidad: string;
  entidad: string;
  provincia: string;
  rango_edad: string;
  mes: string;
}

export interface QuickReply {
  label: string;
  value: string;
  type: 'tipo_entidad' | 'condicion' | 'beneficiario' | 'desambiguacion' | 'accion' | 'reintento';
}

export interface TramiteResultPayload {
  tramite: Tramite;
  tipoEntidad: TipoEntidad;
  condicion: CondicionLaboral;
  beneficiario: Beneficiario;
  checklistComunes: string[];
  checklistSituacion: string[];
  canalVirtual: string;
  canalPresencial: string;
  pasos: string[];
  advertenciaPrivacidad?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  quickReplies?: QuickReply[];
  tramiteResult?: TramiteResultPayload;
  isWarning?: boolean;
  isOfficialDerivation?: boolean;
  isOutOfScope?: boolean;
  timestamp: string;
}
