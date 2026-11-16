/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventoConsulta, ResultadoConsulta } from './types';
import { cargarConsultasSimuladas } from './consultasSimuladas';

export const K_MINIMO = 10;
const STORAGE_KEY = 'orienta_ia_sesion_consultas';

export interface TableroFiltros {
  mes: string;
  provincia: string;
  tipoEntidad: string;
  tramite: string;
}

export interface TableroMetricas {
  totalConsultas: number;
  respondidasCount: number;
  respondidasPct: number;
  derivadasCount: number;
  derivadasPct: number;
  fueraAlcanceCount: number;
  fueraAlcancePct: number;
  tramitesRanking: { nombre: string; id: string; count: number | null; display: string }[];
  condicionDistribucion: { condicion: string; count: number | null; display: string; pct: number }[];
  entidadesDenuncia: { entidad: string; count: number | null; display: string; tipo: string }[];
  mesEvolucion: { mes: string; respondidas: number | null; derivadas: number | null; fueraAlcance: number | null; total: number | null }[];
  provinciaDistribucion: { provincia: string; count: number | null; display: string }[];
  edadDistribucion: { rango: string; count: number | null; display: string }[];
}

/**
 * Loads both the 2,000 baseline simulated events and any newly logged session events from localStorage.
 */
export async function loadAllConsultas(): Promise<EventoConsulta[]> {
  // Base: las 2.000 consultas simuladas incluidas en el código.
  let simulatedEvents: EventoConsulta[] = cargarConsultasSimuladas();

  // Si el proyecto tiene un CSV propio en public/assets/aistudio, se usa ese en su lugar.
  try {
    const res = await fetch('/assets/aistudio/consultas_simuladas_d3c394fb.csv');
    if (res.ok) {
      const csvText = await res.text();
      if (csvText.trimStart().startsWith('fecha,')) {
        const delCsv = parseConsultasCsv(csvText);
        if (delCsv.length > 0) simulatedEvents = delCsv;
      }
    }
  } catch {
    // Sin CSV: se usan las consultas simuladas incluidas en el código.
  }

  // Consultas reales registradas en este navegador.
  const sessionEvents = getSessionConsultas();
  return [...simulatedEvents, ...sessionEvents];
}

export function parseConsultasCsv(csv: string): EventoConsulta[] {
  const lines = csv.trim().split('\n');
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const results: EventoConsulta[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < headers.length) continue;

    results.push({
      fecha: parts[0] || '2026-10-26',
      tramite_detectado: parts[1] || '(sin clasificar)',
      resultado: (parts[2] as ResultadoConsulta) || 'Respondida',
      condicion: parts[3] || 'No informa',
      tipo_entidad: parts[4] || 'No informa',
      entidad: parts[5] || 'No informa',
      provincia: parts[6] || 'Otras',
      rango_edad: parts[7] || 'No informa',
      mes: parts[8] || '2026-10'
    });
  }

  return results;
}

/**
 * Retrieves new session consultations from localStorage.
 */
export function getSessionConsultas(): EventoConsulta[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as EventoConsulta[];
  } catch {
    return [];
  }
}

/**
 * Logs a new strictly anonymous consultation event to localStorage.
 * No conversational text or personal data is ever saved.
 */
export function logAnonymousConsultation(params: {
  tramite_detectado: string;
  resultado: ResultadoConsulta;
  condicion?: string;
  tipo_entidad?: string;
  entidad?: string;
  provincia?: string;
  rango_edad?: string;
}): void {
  try {
    const currentList = getSessionConsultas();
    const currentDate = new Date().toISOString().split('T')[0];
    const currentMonth = currentDate.slice(0, 7);

    // Default fictional entities for demo
    const defaultEntitiesOs = ['Obra social A', 'Obra social B', 'Obra social C', 'Obra social D', 'Obra social E', 'Obra social F'];
    const defaultEntitiesPrepaga = ['Prepaga A', 'Prepaga B', 'Prepaga C', 'Prepaga D'];

    let ent = params.entidad;
    if (!ent || ent === 'No informa') {
      if (params.tipo_entidad === 'Prepaga') {
        ent = defaultEntitiesPrepaga[Math.floor(Math.random() * defaultEntitiesPrepaga.length)];
      } else if (params.tipo_entidad === 'Obra social') {
        ent = defaultEntitiesOs[Math.floor(Math.random() * defaultEntitiesOs.length)];
      } else {
        ent = 'No informa';
      }
    }

    const newEvent: EventoConsulta = {
      fecha: currentDate,
      tramite_detectado: params.tramite_detectado || '(sin clasificar)',
      resultado: params.resultado,
      condicion: params.condicion || 'No informa',
      tipo_entidad: params.tipo_entidad || 'No informa',
      entidad: ent,
      provincia: params.provincia || 'Buenos Aires',
      rango_edad: params.rango_edad || '30 a 44',
      mes: currentMonth
    };

    currentList.push(newEvent);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentList));

    // Registro anónimo también en el servidor, para que el administrador
    // pueda descargarlo desde cualquier dispositivo. Nunca se envía texto libre.
    fetch('/api/consultas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent)
    }).catch(() => {
      // Sin conexión: queda solo el registro local.
    });
  } catch (e) {
    console.error('Error logging anonymous consultation:', e);
  }
}

/**
 * Applies k-anonymity (k=10): groups with < 10 are represented as null / "—".
 */
export function applyKAnonymity(count: number): { count: number | null; display: string } {
  if (count < K_MINIMO) {
    return { count: null, display: '—' };
  }
  return { count, display: count.toLocaleString('es-AR') };
}

/**
 * Computes dashboard metrics and aggregates filtered by user selections.
 */
export function computeDashboardMetrics(events: EventoConsulta[], filters: TableroFiltros): TableroMetricas {
  // Apply filters
  const filtered = events.filter((ev) => {
    if (filters.mes !== 'Todos' && ev.mes !== filters.mes) return false;
    if (filters.provincia !== 'Todas' && ev.provincia !== filters.provincia) return false;
    if (filters.tipoEntidad !== 'Todos' && ev.tipo_entidad !== filters.tipoEntidad) return false;
    if (filters.tramite !== 'Todos' && ev.tramite_detectado !== filters.tramite) return false;
    return true;
  });

  const totalConsultas = filtered.length;

  let respondidasCount = 0;
  let derivadasCount = 0;
  let fueraAlcanceCount = 0;

  const tramiteCounts: Record<string, number> = {};
  const condicionCounts: Record<string, number> = {};
  const entidadDenunciaCounts: Record<string, { count: number; tipo: string }> = {};
  const mesCounts: Record<string, { respondidas: number; derivadas: number; fueraAlcance: number; total: number }> = {};
  const provinciaCounts: Record<string, number> = {};
  const edadCounts: Record<string, number> = {};

  for (const ev of filtered) {
    // Outcomes
    if (ev.resultado === 'Respondida') respondidasCount++;
    else if (ev.resultado === 'Derivada al canal oficial') derivadasCount++;
    else if (ev.resultado === 'Aclaró su alcance') fueraAlcanceCount++;

    // Trámites
    const trId = ev.tramite_detectado || '(sin clasificar)';
    tramiteCounts[trId] = (tramiteCounts[trId] || 0) + 1;

    // Condición
    const cond = ev.condicion || 'No informa';
    condicionCounts[cond] = (condicionCounts[cond] || 0) + 1;

    // Entidades en denuncias (cobertura_prestacional, negativa_afiliacion, discapacidad, aumento_edad)
    const esDenuncia = ['cobertura_prestacional', 'negativa_afiliacion', 'discapacidad', 'aumento_edad'].includes(ev.tramite_detectado);
    if (esDenuncia && ev.entidad && ev.entidad !== 'No informa') {
      if (!entidadDenunciaCounts[ev.entidad]) {
        entidadDenunciaCounts[ev.entidad] = { count: 0, tipo: ev.tipo_entidad };
      }
      entidadDenunciaCounts[ev.entidad].count++;
    }

    // Mes
    const m = ev.mes || '2026-10';
    if (!mesCounts[m]) {
      mesCounts[m] = { respondidas: 0, derivadas: 0, fueraAlcance: 0, total: 0 };
    }
    mesCounts[m].total++;
    if (ev.resultado === 'Respondida') mesCounts[m].respondidas++;
    else if (ev.resultado === 'Derivada al canal oficial') mesCounts[m].derivadas++;
    else if (ev.resultado === 'Aclaró su alcance') mesCounts[m].fueraAlcance++;

    // Provincia
    const prov = ev.provincia || 'Otras';
    provinciaCounts[prov] = (provinciaCounts[prov] || 0) + 1;

    // Edad
    const edad = ev.rango_edad || 'No informa';
    edadCounts[edad] = (edadCounts[edad] || 0) + 1;
  }

  // Map trámite labels
  const tramiteNames: Record<string, string> = {
    cobertura_prestacional: 'Problemas o falta de cobertura prestacional',
    opcion_cambio: 'Opción de cambio / libre elección',
    aumento_edad: 'Aumento indebido de cuota por rango etario',
    discapacidad: 'Prestaciones de discapacidad',
    negativa_afiliacion: 'Negativa de afiliación',
    finalizacion_opcion: 'Finalización de opción de cambio',
    desunificacion_aportes: 'Desunificación de aportes',
    unificacion_aportes: 'Unificación de aportes',
    unificacion_jubilados: 'Unificación de aportes de jubilados',
    correccion_padron: 'Corrección del padrón',
    ive: 'Negativa u obstáculos para la IVE',
    '(sin clasificar)': 'Sin clasificar / Consultas derivadas o alcance'
  };

  const tramitesRanking = Object.entries(tramiteCounts)
    .map(([id, rawCount]) => {
      const k = applyKAnonymity(rawCount);
      return {
        id,
        nombre: tramiteNames[id] || id,
        count: k.count,
        display: k.display,
        rawCount
      };
    })
    .sort((a, b) => b.rawCount - a.rawCount)
    .map(({ rawCount, ...rest }) => rest);

  const condicionDistribucion = Object.entries(condicionCounts)
    .map(([condicion, rawCount]) => {
      const k = applyKAnonymity(rawCount);
      const pct = totalConsultas > 0 ? Math.round((rawCount / totalConsultas) * 100) : 0;
      return {
        condicion,
        count: k.count,
        display: k.display,
        pct,
        rawCount
      };
    })
    .sort((a, b) => b.rawCount - a.rawCount)
    .map(({ rawCount, ...rest }) => rest);

  const entidadesDenuncia = Object.entries(entidadDenunciaCounts)
    .map(([entidad, val]) => {
      const k = applyKAnonymity(val.count);
      return {
        entidad,
        tipo: val.tipo,
        count: k.count,
        display: k.display,
        rawCount: val.count
      };
    })
    .sort((a, b) => b.rawCount - a.rawCount)
    .map(({ rawCount, ...rest }) => rest);

  const mesEvolucion = Object.entries(mesCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, d]) => {
      return {
        mes,
        respondidas: applyKAnonymity(d.respondidas).count,
        derivadas: applyKAnonymity(d.derivadas).count,
        fueraAlcance: applyKAnonymity(d.fueraAlcance).count,
        total: applyKAnonymity(d.total).count
      };
    });

  const provinciaDistribucion = Object.entries(provinciaCounts)
    .map(([provincia, rawCount]) => {
      const k = applyKAnonymity(rawCount);
      return {
        provincia,
        count: k.count,
        display: k.display,
        rawCount
      };
    })
    .sort((a, b) => b.rawCount - a.rawCount)
    .map(({ rawCount, ...rest }) => rest);

  const edadDistribucion = Object.entries(edadCounts)
    .map(([rango, rawCount]) => {
      const k = applyKAnonymity(rawCount);
      return {
        rango,
        count: k.count,
        display: k.display,
        rawCount
      };
    })
    .sort((a, b) => b.rawCount - a.rawCount)
    .map(({ rawCount, ...rest }) => rest);

  return {
    totalConsultas,
    respondidasCount,
    respondidasPct: totalConsultas > 0 ? Math.round((respondidasCount / totalConsultas) * 100) : 0,
    derivadasCount,
    derivadasPct: totalConsultas > 0 ? Math.round((derivadasCount / totalConsultas) * 100) : 0,
    fueraAlcanceCount,
    fueraAlcancePct: totalConsultas > 0 ? Math.round((fueraAlcanceCount / totalConsultas) * 100) : 0,
    tramitesRanking,
    condicionDistribucion,
    entidadesDenuncia,
    mesEvolucion,
    provinciaDistribucion,
    edadDistribucion
  };
}

/**
 * Exports ONLY aggregated summaries that comply with k-anonymity (k>=10).
 * Never exports raw individual rows!
 */
export function exportAggregatedDashboardCsv(metricas: TableroMetricas): string {
  const lines: string[] = [];

  lines.push('# TABLERO DE MONITOREO AGREGADO - ORIENTA IA (SOLUCION DESARROLLADA PARA LA SSSALUD)');
  lines.push('# AVISO: Datos simulados anonimos y agregados. Entidades con nombres ficticios.');
  lines.push('# REGLA DE PRIVACIDAD: Grupos con menos de 10 consultas han sido suprimidos conforme a k-anonymity (k=10).');
  lines.push('');

  // 1. Indicadores generales
  lines.push('INDICADORES GENERALES');
  lines.push('Total de Consultas,Respondidas (%),Derivadas al Canal Oficial (%),Fuera de Alcance (%)');
  lines.push(
    `${metricas.totalConsultas},${metricas.respondidasPct}%,${metricas.derivadasPct}%,${metricas.fueraAlcancePct}%`
  );
  lines.push('');

  // 2. Ranking de trámites
  lines.push('TRAMITES CON MAS CONSULTAS (k >= 10)');
  lines.push('Tramite,Consultas Registradas');
  metricas.tramitesRanking.forEach((t) => {
    if (t.count !== null) {
      lines.push(`"${t.nombre}",${t.count}`);
    }
  });
  lines.push('');

  // 3. Condición laboral
  lines.push('DISTRIBUCION POR CONDICION LABORAL (k >= 10)');
  lines.push('Condicion Laboral,Consultas Registradas,Porcentaje Estimado');
  metricas.condicionDistribucion.forEach((c) => {
    if (c.count !== null) {
      lines.push(`"${c.condicion}",${c.count},${c.pct}%`);
    }
  });
  lines.push('');

  // 4. Entidades en trámites de denuncia
  lines.push('CONSULTAS POR ENTIDAD FICTICIA EN TRAMITES DE DENUNCIA (k >= 10)');
  lines.push('Entidad Ficticia,Tipo de Entidad,Consultas Registradas');
  metricas.entidadesDenuncia.forEach((e) => {
    if (e.count !== null) {
      lines.push(`"${e.entidad}","${e.tipo}",${e.count}`);
    }
  });
  lines.push('');

  // 5. Distribución por provincia
  lines.push('DISTRIBUCION POR PROVINCIA (k >= 10)');
  lines.push('Provincia,Consultas Registradas');
  metricas.provinciaDistribucion.forEach((p) => {
    if (p.count !== null) {
      lines.push(`"${p.provincia}",${p.count}`);
    }
  });
  lines.push('');

  // 6. Rango de edad
  lines.push('DISTRIBUCION POR RANGO DE EDAD (k >= 10)');
  lines.push('Rango de Edad,Consultas Registradas');
  metricas.edadDistribucion.forEach((ed) => {
    if (ed.count !== null) {
      lines.push(`"${ed.rango}",${ed.count}`);
    }
  });

  return lines.join('\n');
}