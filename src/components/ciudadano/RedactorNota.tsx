/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Copy,
  Printer,
  Check,
  AlertTriangle,
  Building,
  RotateCcw
} from 'lucide-react';
import { TRAMITES_DATA } from '../../data/db/tramitesData';

interface RedactorNotaProps {
  initialTramiteId?: string;
}

export const RedactorNota: React.FC<RedactorNotaProps> = ({ initialTramiteId }) => {
  const [selectedTramiteId, setSelectedTramiteId] = useState<string>(
    initialTramiteId || 'cobertura_prestacional'
  );

  const [destinatario, setDestinatario] = useState('A la Dirección Médica / Auditoría de la Obra Social / Prepaga');
  const [entidadNombre, setEntidadNombre] = useState('');
  const [lugarFecha, setLugarFecha] = useState(
    `Buenos Aires, ${new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}`
  );
  const [motivo, setMotivo] = useState('');
  const [cuerpoReclamo, setCuerpoReclamo] = useState('');
  const [documentacionAdjunta, setDocumentacionAdjunta] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync default template when trámite changes
  useEffect(() => {
    const tr = TRAMITES_DATA.find((t) => t.id === selectedTramiteId);
    if (!tr) return;

    if (tr.id === 'cobertura_prestacional') {
      setMotivo('RECLAMO POR FALTA DE COBERTURA / AUTORIZACIÓN DE PRESTACIÓN MÉDICA');
      setCuerpoReclamo(
        'Por medio de la presente, vengo a intimar la inmediata autorización y cobertura integral al 100% de la prestación/medicamento prescripto por mi médico tratante, del cual adjunto prescripción y resumen de historia clínica. Habiendo transcurrido los plazos razonables sin respuesta favorable, hago saber que en caso de persistir la negativa, elevaré la correspondiente denuncia ante la Superintendencia de Servicios de Salud (TAD Trámite 2723).'
      );
      setDocumentacionAdjunta('Prescripción médica legible; Síntesis de historia clínica; Copia de credencial; Último comprobante de aportes/pago.');
    } else if (tr.id === 'negativa_afiliacion') {
      setMotivo('INTIMACIÓN ANTE NEGATIVA O TRABA INDEBIDA DE AFILIACIÓN');
      setCuerpoReclamo(
        'Me dirijo a ustedes a fin de solicitar se haga efectiva mi inmediata afiliación (y/o la de mi grupo familiar), habiendo cumplido con todos los requisitos formales y legales exigibles de acuerdo con mi condición laboral. Dejo constancia de que la negativa o demora injustificada en el alta configura un incumplimiento pasible de denuncia formal ante la SSSalud (TAD Trámite 6020).'
      );
      setDocumentacionAdjunta('Formulario de afiliación; Copia de DNI frente y dorso; Comprobante de aportes / F.184 / Recibo de sueldo.');
    } else if (tr.id === 'aumento_edad') {
      setMotivo('IMPUGNACIÓN DE AUMENTO DE CUOTA POR RANGO ETARIO');
      setCuerpoReclamo(
        'Por la presente vengo a impugnar el aumento aplicado sobre mi cuota mensual fundado exclusivamente en el cambio de franja etaria. Dicho incremento resulta arbitrario y vulnera la Ley 26.682 y normativas concordantes de la SSSalud. Solicito el reajuste inmediato a los valores vigentes y la restitución de los importes cobrados en exceso.'
      );
      setDocumentacionAdjunta('Factura previa al aumento; Facturas posteriores con el incremento; Constancia de fecha de ingreso original a la entidad.');
    } else if (tr.id === 'discapacidad') {
      setMotivo('SOLICITUD DE COBERTURA INTEGRAL LEY 24.901 (DISCAPACIDAD)');
      setCuerpoReclamo(
        'Vengo por la presente a exigir la cobertura integral al 100% de la prestación indicada para la persona beneficiaria, quien cuenta con Certificado Único de Discapacidad (CUD) vigente, en estricto cumplimiento del régimen tutelar de la Ley 24.901. Solicito pronta respuesta por escrito en el plazo de 48 horas hábiles.'
      );
      setDocumentacionAdjunta('Copia del CUD vigente; Prescripción médica detallada; Resumen de historia clínica; Acreditación de vínculo familiar.');
    } else {
      setMotivo(`SOLICITUD FORMAL REFERIDA A: ${tr.nombre.toUpperCase()}`);
      setCuerpoReclamo(
        `Por medio de la presente, me presento a fin de solicitar la correcta tramitación y resolución vinculada a ${tr.nombre.toLowerCase()}, conforme a la normativa vigente supervisada por la Superintendencia de Servicios de Salud.`
      );
      setDocumentacionAdjunta('Copia de DNI; Comprobantes de situación laboral y aportes; Documental respaldatoria.');
    }
  }, [selectedTramiteId]);

  // Generate clean formal letter text without pre-loaded personal data
  const textoNotaCompleto = `${lugarFecha}

${destinatario}${entidadNombre ? ` - ${entidadNombre}` : ''}
S. / D.:

REF.: ${motivo}
DATOS DE REFERENCIA: [Completar Nombre y Apellido / DNI / N° de Afiliado/a]

De mi mayor consideración:

${cuerpoReclamo}

Documentación que se acompaña a la presente:
${documentacionAdjunta}

A la espera de una respuesta formal y por escrito a la brevedad, saludo a ustedes atentamente.


Firma: ____________________________________
Aclaración: _______________________________
DNI: ______________________________________
Teléfono / Correo de contacto: _____________

---------------------------------------------------------------------------------
Aviso: Modelo orientativo; no es asesoramiento legal. (Orienta IA · Para la SSSalud)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(textoNotaCompleto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nota de Reclamo - Orienta IA</title>
        <style>
          body { font-family: 'Open Sans', Georgia, serif; padding: 40px; color: #0B192C; line-height: 1.6; }
          .aviso { background: #FFF4DC; border-left: 4px solid #E5B842; padding: 8px 12px; font-size: 11px; margin-bottom: 24px; font-family: sans-serif; }
          pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="aviso">
          <strong>Aviso:</strong> Modelo orientativo; no es asesoramiento legal. Orienta IA · Solución desarrollada para la Superintendencia de Servicios de Salud.
        </div>
        <pre>${textoNotaCompleto}</pre>
        <script>
          window.print();
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-[#2B82C9] text-xs font-bold uppercase tracking-wider font-['Montserrat']">
          <FileText className="w-4 h-4" />
          <span>Herramienta de redacción administrativa</span>
        </div>
        <h2 className="text-2xl font-bold text-[#0B192C] font-['Montserrat'] mt-1">
          Redactor de modelo de nota
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
          Generá una nota formal para presentar ante tu obra social, prepaga o la SSSalud para dejar constancia fehaciente de tu reclamo.
        </p>
      </div>

      {/* Mandatory Legal Disclaimer */}
      <div className="bg-[#FFF4DC] border-l-4 border-[#E5B842] rounded-r-xl p-3.5 mb-6 text-xs text-[#0B192C]">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-[#E5B842] flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-amber-950 font-['Montserrat']">
              Aviso obligatorio: Modelo orientativo; no es asesoramiento legal.
            </strong>{' '}
            Esta plantilla está pensada con fines organizativos y de demostración. Los campos se completan sin almacenar tus datos personales.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B192C] font-['Montserrat'] border-b border-slate-100 pb-2">
            Completar datos de la nota
          </h3>

          <div>
            <label className="block text-xs font-bold text-[#0B192C] mb-1 font-['Montserrat']">
              Trámite o motivo de base:
            </label>
            <select
              value={selectedTramiteId}
              onChange={(e) => setSelectedTramiteId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-[#2B82C9]"
            >
              {TRAMITES_DATA.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B192C] mb-1 font-['Montserrat']">
              Destinatario:
            </label>
            <input
              type="text"
              value={destinatario}
              onChange={(e) => setDestinatario(e.target.value)}
              placeholder="Ej: A la Dirección Médica de..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-[#2B82C9]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B192C] mb-1 font-['Montserrat']">
              Nombre de la Obra Social o Prepaga:
            </label>
            <input
              type="text"
              value={entidadNombre}
              onChange={(e) => setEntidadNombre(e.target.value)}
              placeholder="Ej: Obra Social del Personal de... o Prepaga..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-[#2B82C9]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B192C] mb-1 font-['Montserrat']">
              Lugar y fecha:
            </label>
            <input
              type="text"
              value={lugarFecha}
              onChange={(e) => setLugarFecha(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-[#2B82C9]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B192C] mb-1 font-['Montserrat']">
              Asunto / Objeto del reclamo:
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-[#2B82C9]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B192C] mb-1 font-['Montserrat']">
              Texto / Hechos del reclamo:
            </label>
            <textarea
              rows={4}
              value={cuerpoReclamo}
              onChange={(e) => setCuerpoReclamo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0B192C] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#2B82C9]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B192C] mb-1 font-['Montserrat']">
              Documentación adjunta mencionada:
            </label>
            <input
              type="text"
              value={documentacionAdjunta}
              onChange={(e) => setDocumentacionAdjunta(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-[#2B82C9]"
            />
          </div>
        </div>

        {/* Right Column: Live Formal Preview */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="flex-1 bg-white rounded-2xl border border-slate-300 shadow-sm p-5 flex flex-col font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-[550px]">
            <div className="text-[11px] font-sans font-bold text-[#2B82C9] pb-2 mb-2 border-b border-slate-200">
              Vista previa en tiempo real
            </div>
            {textoNotaCompleto}
          </div>

          {/* Action buttons */}
          <div className="mt-3 flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center space-x-1.5 bg-[#2B82C9] hover:bg-[#25a18e] text-[#0B192C] text-xs font-bold py-2.5 px-4 rounded-xl transition-colors shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado al portapapeles!' : 'Copiar modelo de nota'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-[#0B192C] hover:bg-[#11223A] text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
