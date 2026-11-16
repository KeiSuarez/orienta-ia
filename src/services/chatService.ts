/**
 * Servicios de IA del lado del ciudadano.
 * La conversación del asistente vive en services/orientaEngine.ts.
 */

export interface ResultadoAuditoria {
  tipoDocumento: string;
  estado: string;
  observacionesPositivas: string[];
  elementosFaltantes: string[];
  recomendacionCiudadana: string;
}

export async function auditarDocumentoConIA(params: {
  documentBase64?: string;
  mimeType?: string;
  documentText?: string;
  tipoTramite?: string;
}): Promise<ResultadoAuditoria> {
  try {
    const res = await fetch('/api/ai/audit-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.debug('No se pudo contactar el servicio de revisión:', e);
  }

  return {
    tipoDocumento: 'Documento sin revisar',
    estado: 'No se pudo revisar',
    observacionesPositivas: [],
    elementosFaltantes: [
      'Verificá que se vea la firma y el sello con la matrícula del profesional.',
      'Revisá que la fecha de la prescripción sea reciente.',
      'Comprobá que el diagnóstico esté escrito y sea legible.',
    ],
    recomendacionCiudadana:
      'En este momento no pudimos revisar el documento automáticamente. Usá estos puntos como guía y volvé a intentarlo en unos minutos.',
  };
}
