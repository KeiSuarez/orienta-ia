/**
 * Base de conocimiento de Orienta IA: los 11 trámites ante la SSSalud.
 *
 * Fuente: src/data/db/tramites.json (editable).
 * El administrador puede editar los trámites desde "Gestión de trámites":
 * esos cambios se guardan en el navegador del administrador y se pueden
 * descargar como un nuevo tramites.json para reemplazar este archivo.
 */

import { Tramite, CondicionLaboral, TipoEntidad, Beneficiario } from './types';
import baseJson from './tramites.json';

export const CONDICION_LABELS: Record<CondicionLaboral, string> = {
  relacion_dependencia: 'Relación de dependencia',
  monotributista: 'Monotributo',
  monotributo_social: 'Monotributo social',
  servicio_domestico: 'Servicio doméstico',
  jubilado_pensionado: 'Jubilado/a', // la clave se mantiene por compatibilidad; las pensiones no las regula la SSSalud
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
  cav: 'https://www.argentina.gob.ar/sssalud/centro-de-atencion-virtual',
  miSssalud: 'https://www.sssalud.gob.ar',
  monotributoAgentes: 'https://www.argentina.gob.ar/sssalud/monotributo/agentes-de-salud',
  arca: 'https://www.arca.gob.ar'
};

/** Trámites tal como vienen en tramites.json (sin ediciones del administrador). */
export const TRAMITES_BASE: Tramite[] = (baseJson as { tramites: Tramite[] }).tramites;

const OVERRIDE_KEY = 'orienta_ia_tramites_admin';

function loadOverride(): Tramite[] | null {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as Tramite[]) : null;
  } catch {
    return null;
  }
}

/**
 * Lista activa de trámites. Es un arreglo mutable para que las ediciones del
 * administrador se vean al instante en el asistente sin recargar la página.
 */
export const TRAMITES_DATA: Tramite[] = [...(loadOverride() ?? TRAMITES_BASE)];

export function getTramiteById(id: string): Tramite | undefined {
  return TRAMITES_DATA.find((t) => t.id === id);
}

export function getAllTramites(): Tramite[] {
  return TRAMITES_DATA;
}

export function hasAdminOverride(): boolean {
  return loadOverride() !== null;
}

/** Guarda la lista editada en el navegador del administrador y la activa. */
export function saveTramitesOverride(lista: Tramite[]): void {
  try {
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(lista));
  } catch {
    // Si el navegador bloquea el almacenamiento, los cambios valen solo para esta sesión.
  }
  TRAMITES_DATA.splice(0, TRAMITES_DATA.length, ...lista);
}

/** Descarta las ediciones locales y vuelve a tramites.json. */
export function resetTramitesOverride(): void {
  try {
    localStorage.removeItem(OVERRIDE_KEY);
  } catch {
    // ignorar
  }
  TRAMITES_DATA.splice(0, TRAMITES_DATA.length, ...TRAMITES_BASE);
}

/** Genera el contenido de un tramites.json con la lista indicada. */
export function exportTramitesJson(lista: Tramite[]): string {
  return JSON.stringify(
    {
      version: '0.3',
      fecha: new Date().toISOString().split('T')[0],
      aviso: 'Base académica; contrastar con argentina.gob.ar/sssalud antes de usar.',
      tramites: lista
    },
    null,
    2
  );
}
