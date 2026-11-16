/**
 * Convierte el resultado del motor (basado en la base de 11 trámites) en el
 * formato de checklist que usa la vista imprimible.
 */

import { TramiteResultPayload } from './types';
import { CONDICION_LABELS, BENEFICIARIO_LABELS, TIPO_ENTIDAD_LABELS, ENLACES_OFICIALES } from './tramitesData';
import { ChecklistFinal, ChecklistItem } from '../../types';

const CODIGOS_TAD: Record<string, string> = {
  cobertura_prestacional: '2723',
  negativa_afiliacion: '6020'
};

const ES_MEDICO = /(m[eé]dic|historia cl[ií]nica|prescripci|receta|diagn[oó]stic|cud|discapacidad)/i;

function aItems(textos: string[], prefijo: string, seccion: ChecklistItem['seccion']): ChecklistItem[] {
  return textos.map((texto, i) => ({
    id: `${prefijo}-${i}`,
    texto,
    obligatorio: !/si corresponde|cuando corresponda|si interviene|si la hubiera|si lo hubiera|si la hubiere|si lo hubiere|opcional|si se trata/i.test(texto),
    seccion
  }));
}

export function payloadAChecklist(p: TramiteResultPayload): ChecklistFinal {
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const generales = p.checklistComunes.filter((t) => !ES_MEDICO.test(t));
  const medicos = p.checklistComunes.filter((t) => ES_MEDICO.test(t));

  const codigo = CODIGOS_TAD[p.tramite.id];

  return {
    id: `chk-${p.tramite.id}-${Date.now()}`,
    fecha,
    tramiteId: p.tramite.id,
    categoria: p.tramite.nombre,
    condicionLaboral: CONDICION_LABELS[p.condicion] ?? 'No informa',
    destinatario: BENEFICIARIO_LABELS[p.beneficiario] ?? 'Titular',
    tipoEntidad: TIPO_ENTIDAD_LABELS[p.tipoEntidad] ?? 'No informa',
    docGeneral: aItems(generales, 'gen', 'general'),
    docMedica: aItems(medicos, 'med', 'medica'),
    docLaboral: aItems(p.checklistSituacion, 'sit', 'laboral'),
    canalPresentacion: {
      nombre: p.canalVirtual,
      tadCodigo: codigo ? `TAD ${codigo}` : undefined,
      tadUrl: codigo ? ENLACES_OFICIALES.tad : undefined,
      presencialDireccion: p.canalPresencial,
      presencialHorario: '',
      turnosUrl: ENLACES_OFICIALES.miArgentinaTurnos,
      instruccionesTad: p.pasos
    },
    criteriosAplicables: p.tramite.notas ? [p.tramite.notas] : [],
    fuente: p.tramite.fuente
  };
}
