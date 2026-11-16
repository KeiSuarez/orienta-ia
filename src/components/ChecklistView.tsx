import React, { useState } from 'react';
import {
  Printer,
  Copy,
  CheckCircle2,
  ExternalLink,
  Calendar,
  AlertTriangle,
  FileCheck,
  Building,
  Info,
  Clock,
  MapPin,
  Check,
} from 'lucide-react';
import { ChecklistFinal, ChecklistItem } from '../types';

interface ChecklistViewProps {
  checklist: ChecklistFinal | null;
  onCrearNuevo: () => void;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  checklist,
  onCrearNuevo,
}) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copiado, setCopiado] = useState(false);

  if (!checklist) {
    return (
      <div className="max-w-4xl mx-auto px-3 py-6 sm:p-10 text-center">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#EAF3FA] text-[#2B82C9] flex items-center justify-center mx-auto mb-4 border border-[#CBDCEB]">
            <FileCheck className="w-7 h-7 sm:w-8 sm:h-8 text-[#2B82C9]" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#0B192C]">
            Aún no se ha generado un Checklist de Requisitos
          </h3>
          <p className="mt-2 text-[#475569] max-w-md mx-auto text-xs sm:text-sm">
            Conversá con <strong>Orienta IA</strong> indicando tu trámite y tu condición laboral, o seleccioná los datos arriba para generar tu lista oficial de documentación y canales.
          </p>
          <button
            onClick={onCrearNuevo}
            className="mt-5 sm:mt-6 w-full sm:w-auto min-h-[44px] px-5 bg-[#2B82C9] hover:bg-[#2170B0] text-white rounded-[10px] font-semibold text-xs sm:text-sm shadow-xs transition-colors duration-200 cursor-pointer"
          >
            Iniciar consulta con Orienta IA
          </button>
        </div>
      </div>
    );
  }

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalItems =
    checklist.docGeneral.length +
    checklist.docMedica.length +
    checklist.docLaboral.length;

  const completados = Object.values(checkedItems).filter(Boolean).length;
  const porcentaje = totalItems > 0 ? Math.round((completados / totalItems) * 100) : 0;

  const copiarAlPortapapeles = () => {
    const texto = `SUPERINTENDENCIA DE SERVICIOS DE SALUD (SSSalud)
CHECKLIST OFICIAL DE REQUISITOS - GENERADO POR ORIENTA IA
Fecha: ${checklist.fecha}

1. CATEGORÍA DEL RECLAMO:
${checklist.categoria} (Condición: ${checklist.condicionLaboral}, Destinatario: ${checklist.destinatario})

2. DOCUMENTACIÓN GENERAL:
${checklist.docGeneral.map((i) => `[ ] ${i.texto}: ${i.detalle || ''}`).join('\n')}

3. DOCUMENTACIÓN MÉDICA:
${
  checklist.docMedica.length > 0
    ? checklist.docMedica.map((i) => `[ ] ${i.texto}: ${i.detalle || ''}`).join('\n')
    : 'No requerida para este trámite.'
}

4. DOCUMENTACIÓN LABORAL (${checklist.condicionLaboral}):
${checklist.docLaboral.map((i) => `[ ] ${i.texto}: ${i.detalle || ''}`).join('\n')}

5. CANAL OFICIAL DE PRESENTACIÓN:
- Digital: ${checklist.canalPresentacion.tadCodigo} (${checklist.canalPresentacion.tadUrl})
- Presencial: ${checklist.canalPresentacion.presencialDireccion}, ${checklist.canalPresentacion.presencialHorario} (Turno web: ${checklist.canalPresentacion.turnosUrl})
- IMPORTANTE EN TAD: Completar "Datos del Trámite", "Presentación de Reclamos de Beneficiarios" y en "Balance" adjuntar el Formulario de Reclamo firmado.`;

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const imprimir = () => {
    window.print();
  };

  const renderItemSection = (
    titulo: string,
    items: ChecklistItem[],
    subtitulo?: string
  ) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-5 sm:mb-6">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between pb-2 border-b border-[#E2E8F0] mb-3 gap-1">
          <h4 className="text-[13px] sm:text-[14px] font-bold uppercase tracking-wider text-[#0B192C] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2B82C9] inline-block no-print shrink-0" />
            <span className="print-only hidden font-black">■</span>
            <span>{titulo}</span>
          </h4>
          {subtitulo && <span className="text-[11px] sm:text-[12px] text-[#64748B] font-medium">{subtitulo}</span>}
        </div>

        <div className="space-y-2 sm:space-y-2.5">
          {items.map((item) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-3 sm:p-3.5 rounded-[10px] border transition-all duration-200 cursor-pointer flex items-start gap-2.5 sm:gap-3 select-none min-h-[48px] ${
                  isChecked
                    ? 'bg-[#EAF3FA] border-[#7BB6E4] text-[#0B192C]'
                    : 'bg-white border-[#E2E8F0] hover:border-[#7BB6E4] hover:bg-[#F8FAFD]'
                }`}
              >
                {/* Checkbox en pantalla (UI) con área táctil cómoda */}
                <div
                  className={`no-print w-5 h-5 sm:w-5 sm:h-5 rounded-[6px] border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isChecked
                      ? 'bg-[#2B82C9] border-[#2B82C9] text-white'
                      : 'border-[#CBDCEB] bg-white'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                {/* Checkbox limpio para impresión en papel / PDF */}
                <span className="print-only hidden shrink-0 mt-0.5 text-black font-mono text-base leading-none">
                  {isChecked ? '[X]' : '[  ]'}
                </span>

                <div className="flex-1 text-[13px] sm:text-[14px] min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-semibold ${
                        isChecked ? 'text-[#2B82C9] line-through print:no-underline' : 'text-[#0F172A]'
                      }`}
                    >
                      {item.texto}
                    </span>
                    {item.obligatorio && (
                      <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#FEF8E7] text-[#8C650A] border border-[#F4D381]">
                        Obligatorio
                      </span>
                    )}
                  </div>
                  {item.detalle && (
                    <p className="mt-0.5 text-[11px] sm:text-[12px] text-[#475569] leading-relaxed">
                      {item.detalle}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-2.5 sm:px-6 py-4 sm:py-6 w-full">
      {/* Botonera superior destacada para imprimir (no-print) */}
      <div className="no-print mb-4 bg-white border border-[#E2E8F0] rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF3FA] text-[#2B82C9] flex items-center justify-center shrink-0 border border-[#CBDCEB]">
            <Printer className="w-5 h-5 text-[#2B82C9]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#0B192C]">
              Checklist Oficial listo para imprimir o PDF
            </h3>
            <p className="text-[11px] sm:text-xs text-[#64748B]">
              Formato limpio para mesa de entrada o llevar con tus papeles.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={imprimir}
            className="min-h-[44px] px-3 sm:px-4 bg-[#0B192C] hover:bg-[#11223A] text-white font-semibold text-xs sm:text-sm rounded-[10px] shadow-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-colors duration-200 cursor-pointer border border-[#1E3553]"
            title="Imprimir documento oficial en formato limpio"
          >
            <Printer className="w-4 h-4 text-[#E5B842] shrink-0" />
            <span className="truncate">Imprimir</span>
          </button>

          <button
            onClick={copiarAlPortapapeles}
            className="min-h-[44px] px-3 sm:px-4 bg-white hover:bg-[#F4F8FC] text-[#1C68A6] border border-[#CBDCEB] font-semibold text-xs sm:text-sm rounded-[10px] flex items-center justify-center gap-1.5 transition-colors duration-200 cursor-pointer"
            title="Copiar texto para WhatsApp o email"
          >
            {copiado ? <CheckCircle2 className="w-4 h-4 text-[#2B82C9] shrink-0" /> : <Copy className="w-4 h-4 text-[#2B82C9] shrink-0" />}
            <span>{copiado ? '¡Copiado!' : 'Copiar'}</span>
          </button>
        </div>
      </div>

      {/* Contenedor imprimible del documento oficial */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden print-card">
        {/* Cabecera oficial exclusiva para impresión física o PDF */}
        <div className="print-only hidden p-6 pb-4 border-b-2 border-slate-900 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                República Argentina • Poder Ejecutivo Nacional
              </span>
              <h1 className="text-lg font-black text-slate-950 leading-tight">
                SUPERINTENDENCIA DE SERVICIOS DE SALUD
              </h1>
              <p className="text-xs font-semibold text-slate-800">
                Centro de Atención Telefónica (CAT) • Orientación Oficial al Beneficiario
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-600">
              <span className="block font-bold text-slate-900">Checklist Oficial de Requisitos</span>
              <span>Emisión: {checklist.fecha}</span>
            </div>
          </div>
        </div>

        {/* Header en pantalla con el azul marino oscuro oficial */}
        <div className="bg-[#0B192C] text-white p-4 sm:p-7 border-b border-[#1E3553]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-slate-300 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1 flex-wrap">
                <span className="text-[#2B82C9]">República Argentina</span>
                <span>•</span>
                <span className="text-slate-300">SSSalud Oficial</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 flex-wrap">
                Checklist Oficial de Requisitos
                <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E5B842]/20 text-[#E5B842] border border-[#E5B842]/30">
                  ORIENTA IA
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Guía oficial para la presentación de trámites y reclamos ante la SSSalud
              </p>
            </div>

            <div className="no-print grid grid-cols-2 sm:flex items-center gap-2">
              <button
                onClick={imprimir}
                className="min-h-[40px] px-3 bg-white/10 hover:bg-white/20 text-white rounded-[9px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors duration-200 border border-white/20 cursor-pointer"
                title="Imprimir o guardar como PDF"
              >
                <Printer className="w-3.5 h-3.5 text-[#E5B842]" />
                <span>Imprimir</span>
              </button>

              <button
                onClick={copiarAlPortapapeles}
                className="min-h-[40px] px-3 bg-[#2B82C9] hover:bg-[#2170B0] text-white rounded-[9px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors duration-200 shadow-xs cursor-pointer"
                title="Copiar texto para WhatsApp o email"
              >
                {copiado ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiado ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Metadata badges: Responsive grid 1-col on mobile xs, 2-col on mobile, 4-col on tablet/desktop */}
          <div className="mt-4 sm:mt-5 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-[#11223A] rounded-[9px] p-2.5 border border-[#1E3553]">
              <span className="text-slate-400 text-[10px] sm:text-[11px] block">Trámite</span>
              <strong className="text-white truncate block text-xs sm:text-sm">{checklist.categoria}</strong>
            </div>

            <div className="bg-[#11223A] rounded-[9px] p-2.5 border border-[#1E3553]">
              <span className="text-slate-400 text-[10px] sm:text-[11px] block">Condición Titular</span>
              <strong className="text-white truncate block text-xs sm:text-sm">{checklist.condicionLaboral}</strong>
            </div>

            <div className="bg-[#11223A] rounded-[9px] p-2.5 border border-[#1E3553]">
              <span className="text-slate-400 text-[10px] sm:text-[11px] block">Beneficiario</span>
              <strong className="text-white truncate block text-xs sm:text-sm">{checklist.destinatario}</strong>
            </div>

            <div className="bg-[#11223A] rounded-[9px] p-2.5 border border-[#1E3553]">
              <span className="text-slate-400 text-[10px] sm:text-[11px] block">Fecha de emisión</span>
              <strong className="text-white flex items-center gap-1 text-xs sm:text-sm">
                <Calendar className="w-3.5 h-3.5 text-[#2B82C9]" />
                {checklist.fecha}
              </strong>
            </div>
          </div>
        </div>

        {/* Progress bar in UI (hidden in print) */}
        <div className="no-print bg-[#F4F8FC] px-4 sm:px-6 py-2.5 sm:py-3 border-b border-[#E2E8F0] flex flex-col xs:flex-row xs:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0B192C]">
            <span>Progreso:</span>
            <span className="font-bold text-[#2B82C9]">{completados} de {totalItems} requisitos</span>
          </div>

          <div className="flex items-center gap-3 w-full xs:w-auto">
            <div className="flex-1 xs:w-44 sm:w-56 bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#2B82C9] h-full transition-all duration-300 rounded-full"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[#0B192C]">{porcentaje}%</span>
          </div>
        </div>

        {/* Checklist Content */}
        <div className="p-4 sm:p-8">
          {/* Categoría destacada */}
          <div className="bg-[#EAF3FA] border border-[#CBDCEB] rounded-[10px] p-3.5 sm:p-4 mb-5 sm:mb-6 flex items-start gap-2.5 sm:gap-3">
            <Building className="w-5 h-5 text-[#2B82C9] shrink-0 mt-0.5 no-print" />
            <div>
              <h3 className="font-bold text-[#0B192C] text-xs sm:text-sm">
                Trámite: {checklist.categoria}
              </h3>
              <p className="text-[11px] sm:text-xs text-[#475569] mt-0.5 sm:mt-1 leading-relaxed">
                Reclamo para titular en condición de <strong>{checklist.condicionLaboral}</strong> con cobertura para <strong>{checklist.destinatario}</strong>.
              </p>
            </div>
          </div>

          {/* Requisitos Documentales */}
          {renderItemSection('1. Documentación General (Obligatoria para todo trámite)', checklist.docGeneral)}
          {renderItemSection('2. Documentación Médica Específica', checklist.docMedica, 'Emitida por médico tratante')}
          {renderItemSection(`3. Documentación Laboral (${checklist.condicionLaboral})`, checklist.docLaboral, 'Acreditación de aportes')}

          {/* Canales oficiales de presentación: Reorganizados en sola columna vertical en celulares */}
          <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[#E2E8F0]">
            <h4 className="text-[13px] sm:text-[14px] font-bold uppercase tracking-wider text-[#0B192C] mb-3 sm:mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2B82C9] inline-block no-print shrink-0" />
              <span className="print-only hidden font-black">■</span>
              <span>4. Canales Oficiales Habilitados para la Presentación</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {/* Canal Digital TAD */}
              <div className="bg-[#F8FAFD] border border-[#E2E8F0] rounded-[12px] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#1C68A6] bg-[#EAF3FA] border border-[#CBDCEB] px-2 py-0.5 rounded">
                      Digital Recomendado
                    </span>
                    <span className="text-[11px] sm:text-xs font-medium text-[#64748B]">100% online</span>
                  </div>

                  <h5 className="font-bold text-[#0B192C] text-sm">
                    Trámites a Distancia (TAD)
                  </h5>

                  <p className="text-xs font-semibold text-[#2B82C9] mt-1">
                    Código de trámite: {checklist.canalPresentacion.tadCodigo}
                  </p>

                  <p className="text-[11px] sm:text-xs text-[#475569] mt-1 leading-relaxed">
                    {checklist.canalPresentacion.nombre}
                  </p>

                  <div className="mt-3 bg-[#FEF8E7] border border-[#F4D381] rounded-[9px] p-2.5 text-xs text-[#8C650A]">
                    <strong className="block mb-1 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#8C650A] shrink-0 no-print" />
                      Paso crítico en TAD:
                    </strong>
                    <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-[#8C650A]">
                      <li>Completar <em>"Datos del Trámite"</em>.</li>
                      <li>Completar <em>"Presentación de Reclamos"</em>.</li>
                      <li>
                        En <strong>"Balance"</strong>: adjuntar el Formulario firmado.
                      </li>
                    </ol>
                  </div>
                </div>

                {checklist.canalPresentacion.tadUrl && (
                  <a
                    href={checklist.canalPresentacion.tadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-print mt-4 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 bg-[#2B82C9] hover:bg-[#2170B0] text-white rounded-[10px] text-xs sm:text-sm font-semibold transition-colors duration-200 w-full"
                  >
                    <span>Ir a {checklist.canalPresentacion.tadCodigo} en TAD</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                
                <p className="print-only hidden text-xs text-slate-600 mt-2 font-mono">
                  Enlace TAD: {checklist.canalPresentacion.tadUrl}
                </p>
              </div>

              {/* Canal Presencial */}
              <div className="bg-[#F8FAFD] border border-[#E2E8F0] rounded-[12px] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#475569] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded">
                      Atención Presencial
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold text-[#0B192C] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#2B82C9] no-print" /> Turno obligatorio
                    </span>
                  </div>

                  <h5 className="font-bold text-[#0B192C] text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#2B82C9] no-print shrink-0" />
                    Sede Central SSSalud
                  </h5>

                  <p className="text-xs font-medium text-[#0F172A] mt-1">
                    {checklist.canalPresentacion.presencialDireccion}
                  </p>

                  <p className="text-[11px] sm:text-xs text-[#475569] mt-1">
                    Horario de atención: <strong>{checklist.canalPresentacion.presencialHorario}</strong>.
                  </p>

                  <div className="mt-3 bg-white border border-[#E2E8F0] rounded-[9px] p-2.5 text-[11px] sm:text-xs text-[#475569] leading-relaxed">
                    <p>
                      No se reciben reclamos espontáneos sin turno. Presentarse con todos los originales impresos.
                    </p>
                  </div>
                </div>

                <a
                  href={checklist.canalPresentacion.turnosUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-print mt-4 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 bg-white hover:bg-[#F4F8FC] text-[#1C68A6] border border-[#CBDCEB] rounded-[10px] text-xs sm:text-sm font-semibold transition-colors duration-200 w-full"
                >
                  <span>Solicitar Turno en Mi Argentina</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <p className="print-only hidden text-xs text-slate-600 mt-2 font-mono">
                  Turnos Web: {checklist.canalPresentacion.turnosUrl}
                </p>
              </div>
            </div>
          </div>

          {/* Criterios normativos aplicables */}
          {checklist.criteriosAplicables.length > 0 && (
            <div className="mt-5 sm:mt-6 p-3.5 sm:p-4 rounded-[10px] bg-[#EAF3FA] border border-[#CBDCEB]">
              <span className="text-[11px] sm:text-xs font-bold text-[#1C68A6] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Info className="w-4 h-4 text-[#2B82C9] no-print shrink-0" />
                Criterios del Manual CAT aplicables a este caso:
              </span>
              <ul className="space-y-1 sm:space-y-1.5 text-xs text-[#0F172A]">
                {checklist.criteriosAplicables.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-[#2B82C9] font-bold shrink-0">•</span>
                    <span className="leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pie de página institucional */}
          <div className="mt-6 sm:mt-8 pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-[11px] text-[#64748B] gap-2 text-center sm:text-left">
            <span>Superintendencia de Servicios de Salud • CAT</span>
            <span>Manual v1.0 Mariana Ríos Insaurralde • Orientación no vinculante</span>
          </div>
        </div>
      </div>

      {/* Botón inferior adicional para imprimir (no-print) */}
      <div className="no-print mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div className="text-xs text-[#475569] text-center sm:text-left">
          ¿Listo para armar tu carpeta? Imprimí o guardá este checklist en PDF para chequear cada documento.
        </div>
        <button
          onClick={imprimir}
          className="w-full sm:w-auto min-h-[44px] px-5 bg-[#0B192C] hover:bg-[#11223A] text-white rounded-[10px] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors duration-200 cursor-pointer border border-[#1E3553]"
        >
          <Printer className="w-4 h-4 text-[#E5B842]" />
          <span>Imprimir Checklist</span>
        </button>
      </div>
    </div>
  );
};
