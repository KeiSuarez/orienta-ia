/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PrivacyCheckResult {
  hasPersonalData: boolean;
  detectedTypes: string[];
  warningMessage: string;
}

// Regex patterns to detect personal and medical data
const DNI_REGEX = /\b(dni|documento)?\s*:?\s*(\d{1,2}\.?\d{3}\.?\d{3}|\d{7,8})\b/i;
const CUIL_CUIT_REGEX = /\b(cuil|cuit)?\s*:?\s*(20|23|24|27|30|33|34)[-\s]?\d{8}[-\s]?\d\b/i;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const PHONE_REGEX = /\b(\+?54\s?9?)?\s*(11|[2368]\d{2,3})[-\s]?\d{3,4}[-\s]?\d{4}\b/;
const CLAVE_FISCAL_REGEX = /\b(clave\s+fiscal|clave\s+arca|clave\s+afip)\b/i;

/**
 * Checks if the user message contains sensitive personal or health data.
 * Crucial rule: Never repeat the data, never store it.
 */
export function checkPersonalData(input: string): PrivacyCheckResult {
  const detectedTypes: string[] = [];
  const text = input.trim();

  // Check pure numbers or DNI patterns
  if (DNI_REGEX.test(text) || (/^\d{7,8}$/.test(text.replace(/\./g, '')))) {
    detectedTypes.push('DNI / Documento');
  }

  if (CUIL_CUIT_REGEX.test(text)) {
    detectedTypes.push('CUIL / CUIT');
  }

  if (EMAIL_REGEX.test(text)) {
    detectedTypes.push('Correo electrónico');
  }

  if (PHONE_REGEX.test(text) && text.replace(/\D/g, '').length >= 8) {
    detectedTypes.push('Teléfono');
  }

  if (CLAVE_FISCAL_REGEX.test(text)) {
    detectedTypes.push('Clave Fiscal');
  }

  if (detectedTypes.length > 0) {
    return {
      hasPersonalData: true,
      detectedTypes,
      warningMessage:
        'Para cuidar tu privacidad, recordá que no hace falta que compartas tu DNI, CUIL, nombre, teléfono ni datos médicos. En este asistente no guardamos ningún dato personal.'
    };
  }

  return {
    hasPersonalData: false,
    detectedTypes: [],
    warningMessage: ''
  };
}

/**
 * Sanitizes any personal data if logs or internal state are processed.
 * Masks digits and sensitive strings.
 */
export function sanitizeText(text: string): string {
  return text
    .replace(EMAIL_REGEX, '[CORREO_PROTEGIDO]')
    .replace(CUIL_CUIT_REGEX, '[CUIL_PROTEGIDO]')
    .replace(DNI_REGEX, '[DNI_PROTEGIDO]')
    .replace(/\b\d{7,8}\b/g, '[NUMERO_PROTEGIDO]');
}
