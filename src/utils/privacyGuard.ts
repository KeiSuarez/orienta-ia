/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PrivacyCheckResult {
  hasPersonalData: boolean;
  detectedTypes: string[];
  warningMessage: string;
}

// Patrones para detectar datos personales (nunca se repiten ni se guardan).
const DNI_CON_PALABRA_REGEX = /\b(dni|d\.n\.i\.?|documento)\b[^\d]{0,20}\d[\d.\s-]{5,13}\d/i;
const CUIL_CUIT_REGEX = /\b(20|23|24|27|30|33|34)[-\s.]?\d{8}[-\s.]?\d\b/;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const PHONE_REGEX = /\b(\+?54\s?9?)?\s*(11|[2368]\d{2,3})[-\s]?\d{3,4}[-\s]?\d{4}\b/;
const NUMERO_LARGO_REGEX = /\b\d{1,3}(?:\.\d{3}){2,3}\b|\b\d{7,11}\b/;
const CLAVE_FISCAL_REGEX = /\b(mi\s+)?clave\s+(fiscal|arca|afip)\s+(es|:)/i;
const NOMBRE_REGEX = /\b(me llamo|mi nombre es)\s+\p{L}+/iu;
// Para enmascarar: el primer nombre y hasta dos palabras más que empiecen con mayúscula.
const NOMBRE_COMPLETO_REGEX = /\b([Mm]e llamo|[Mm]i nombre es)\s+\p{L}+(?:\s+\p{Lu}\p{L}*){0,2}/gu;
const AFILIADO_REGEX = /\b(n(ro|°|º|umero)?\.?\s*(de\s+)?afiliad[oa])\s*:?\s*[\d/-]{4,}/i;

/**
 * Revisa si el mensaje trae datos personales.
 * Regla: nunca se repiten ni se guardan.
 */
export function checkPersonalData(input: string): PrivacyCheckResult {
  const text = input.trim();
  const tipos = new Set<string>();

  if (DNI_CON_PALABRA_REGEX.test(text)) tipos.add('DNI / Documento');
  if (CUIL_CUIT_REGEX.test(text)) tipos.add('CUIL / CUIT');
  if (EMAIL_REGEX.test(text)) tipos.add('Correo electrónico');
  if (PHONE_REGEX.test(text) && text.replace(/\D/g, '').length >= 8) tipos.add('Teléfono');
  if (NOMBRE_REGEX.test(text)) tipos.add('Nombre');
  if (AFILIADO_REGEX.test(text)) tipos.add('Número de afiliado');
  if (CLAVE_FISCAL_REGEX.test(text)) tipos.add('Clave Fiscal');
  // Cualquier número largo (7 a 11 dígitos) puede ser un DNI o un teléfono.
  if (tipos.size === 0 && NUMERO_LARGO_REGEX.test(text)) tipos.add('Número de documento o teléfono');

  if (tipos.size > 0) {
    return {
      hasPersonalData: true,
      detectedTypes: [...tipos],
      warningMessage:
        'Para cuidar tu privacidad, ocultamos los datos personales que escribiste. No hace falta que compartas tu DNI, CUIL, nombre, teléfono ni datos médicos: este asistente no guarda ningún dato personal.'
    };
  }

  return { hasPersonalData: false, detectedTypes: [], warningMessage: '' };
}

/** Enmascara los datos personales antes de procesar el texto. */
export function sanitizeText(text: string): string {
  return text
    .replace(/\b((mi\s+)?clave\s+(fiscal|arca|afip)\s+(es|:)\s*)\S+/gi, '$1[CLAVE_PROTEGIDA]')
    .replace(new RegExp(EMAIL_REGEX.source, 'g'), '[CORREO_PROTEGIDO]')
    .replace(new RegExp(CUIL_CUIT_REGEX.source, 'g'), '[CUIL_PROTEGIDO]')
    .replace(NOMBRE_COMPLETO_REGEX, (_m, frase) => `${frase} [NOMBRE_PROTEGIDO]`)
    .replace(new RegExp(AFILIADO_REGEX.source, 'gi'), '[AFILIADO_PROTEGIDO]')
    .replace(new RegExp(PHONE_REGEX.source, 'g'), (m) => (m.replace(/\D/g, '').length >= 8 ? ' [TELEFONO_PROTEGIDO]' : m))
    .replace(/\b\d{1,3}(?:\.\d{3}){2,3}\b|\b\d{7,11}(?:\/\d+)?\b/g, '[NUMERO_PROTEGIDO]');
}

/**
 * Versión del texto para mostrar en pantalla: los datos personales se reemplazan
 * por puntos, así no quedan visibles en la conversación.
 */
export function ocultarDatosPersonales(text: string): string {
  if (!checkPersonalData(text).hasPersonalData) return text;
  return sanitizeText(text)
    .replace(/\s?\[[A-Z]+_PROTEGID[OA]\]/g, ' ••••••')
    .trim();
}
