import type { TipoEntidad, CondicionLaboral, Beneficiario, QuickReply } from './data/db/types';

/**
 * Datos mínimos del caso que muestra la barra superior del asistente.
 * Usa las mismas claves que la base de 11 trámites (tramites.json).
 */
export interface DatosMinimos {
  tramiteId: string | null;
  tipoEntidad: TipoEntidad | null;
  condicion: CondicionLaboral | null;
  beneficiario: Beneficiario | null;
}

export const DATOS_VACIOS: DatosMinimos = {
  tramiteId: null,
  tipoEntidad: null,
  condicion: null,
  beneficiario: null
};

export interface ChecklistItem {
  id: string;
  texto: string;
  detalle?: string;
  obligatorio: boolean;
  seccion: 'general' | 'medica' | 'laboral' | 'canal';
  checked?: boolean;
}

export interface ChecklistFinal {
  id: string;
  fecha: string;
  tramiteId: string;
  /** Nombre del trámite. */
  categoria: string;
  /** Etiqueta legible de la condición laboral. */
  condicionLaboral: string;
  /** Etiqueta legible del beneficiario. */
  destinatario: string;
  tipoEntidad: string;
  docGeneral: ChecklistItem[];
  docMedica: ChecklistItem[];
  docLaboral: ChecklistItem[];
  canalPresentacion: {
    nombre: string;
    tadCodigo?: string;
    tadUrl?: string;
    presencialDireccion: string;
    presencialHorario: string;
    turnosUrl: string;
    instruccionesTad: string[];
    aclaracionEspecial?: string;
  };
  criteriosAplicables: string[];
  fuente: string;
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: string;
  checklist?: ChecklistFinal;
  quickReplies?: QuickReply[];
  avisoPrivacidad?: string;
  fuente?: 'reglas' | 'ia';
}
