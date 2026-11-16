import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Copy,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { auditarDocumentoConIA, redactarCartaReclamoConIA } from '../services/chatService';

interface AiToolsModalProps {
  categoriaActual?: string | null;
}

export const AiToolsModal: React.FC<AiToolsModalProps> = ({ categoriaActual }) => {
  const [activeSubTab, setActiveSubTab] = useState<'auditor' | 'redactor'>('auditor');

  // Auditor state
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [docText, setDocText] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    tipoDocumento: string;
    estado: string;
    observacionesPositivas: string[];
    elementosFaltantes: string[];
    recomendacionCiudadana: string;
  } | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Redactor state
  const [titularNombre, setTitularNombre] = useState('');
  const [obraSocialNombre, setObraSocialNombre] = useState('');
  const [motivoReclamo, setMotivoReclamo] = useState('');
  const [detallesMedicos, setDetallesMedicos] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftedLetter, setDraftedLetter] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocFile(file);

      const reader = new FileReader();
      reader.onload = () => {
        setDocPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const ejecutarAuditoria = async () => {
    if (!docPreview && !docText.trim()) return;

    setIsAuditing(true);
    setAuditError(null);
    setAuditResult(null);

    try {
      const res = await auditarDocumentoConIA({
        documentBase64: docPreview || undefined,
        mimeType: docFile?.type || 'image/jpeg',
        documentText: docText.trim() || undefined,
        tipoTramite: categoriaActual || 'Problema Prestacional / Cobertura',
      });
      setAuditResult(res);
    } catch (err: any) {
      console.error(err);
      setAuditError(err.message || 'No se pudo auditar el documento');
    } finally {
      setIsAuditing(false);
    }
  };

  const ejecutarRedaccion = async () => {
    if (!motivoReclamo.trim()) return;

    setIsDrafting(true);
    setDraftedLetter(null);

    try {
      const res = await redactarCartaReclamoConIA({
        nombreTitular: titularNombre.trim() || undefined,
        obraSocial: obraSocialNombre.trim() || undefined,
        motivo: motivoReclamo.trim(),
        detallesMedicos: detallesMedicos.trim() || undefined,
        tipoTramite: categoriaActual || 'Problemática Prestacional / Cobertura',
      });
      setDraftedLetter(res.letter);
    } catch (err: any) {
      console.error(err);
      alert('Hubo un error al generar la nota formal con IA. Intentalo de nuevo.');
    } finally {
      setIsDrafting(false);
    }
  };

  const copiarCarta = () => {
    if (!draftedLetter) return;
    navigator.clipboard.writeText(draftedLetter);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-2.5 sm:px-6 py-4 sm:py-6 w-full">
      {/* Banner con azul marino oficial */}
      <div className="bg-[#0B192C] text-white rounded-2xl p-4 sm:p-7 mb-5 sm:mb-6 border border-[#1E3553] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-300 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1 flex-wrap">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E5B842] shrink-0" />
              <span className="text-[#2B82C9]">Inteligencia Artificial Gemini</span>
              <span>•</span>
              <span className="text-slate-300">SSSalud Oficial</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2 flex-wrap">
              Herramientas de <span className="text-[#E5B842]">IA</span> para el Ciudadano
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Verificá si tu receta o historia clínica cumple los requisitos de la SSSalud antes de subirla a TAD, o redactá una nota formal de intimación a tu obra social.
            </p>
          </div>

          {/* Subtab toggle: Grid on mobile with 44px min-height */}
          <div className="grid grid-cols-2 sm:flex items-center gap-1.5 bg-[#11223A] p-1.5 rounded-[12px] border border-[#1E3553] w-full sm:w-auto shrink-0">
            <button
              onClick={() => setActiveSubTab('auditor')}
              className={`min-h-[44px] sm:h-[36px] px-2.5 sm:px-3.5 rounded-[9px] text-[11px] sm:text-xs font-semibold transition-all duration-200 cursor-pointer text-center flex items-center justify-center ${
                activeSubTab === 'auditor'
                  ? 'bg-[#2B82C9] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Auditor de Recetas
            </button>
            <button
              onClick={() => setActiveSubTab('redactor')}
              className={`min-h-[44px] sm:h-[36px] px-2.5 sm:px-3.5 rounded-[9px] text-[11px] sm:text-xs font-semibold transition-all duration-200 cursor-pointer text-center flex items-center justify-center ${
                activeSubTab === 'redactor'
                  ? 'bg-[#2B82C9] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Redactor de Nota
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: AUDITOR DE DOCUMENTOS CON GEMINI MULTIMODAL */}
      {activeSubTab === 'auditor' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="w-5 h-5 text-[#2B82C9] shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-[#0B192C]">
                Auditoría Inteligente de Documentación (Visión con IA)
              </h3>
            </div>
            <p className="text-xs text-[#475569] mb-4 leading-relaxed">
              Subí una foto o captura de tu <strong>receta médica, historia clínica o comprobante</strong>. La IA verificará si cuenta con firma, sello con matrícula, diagnóstico legible y justificativo para evitar rechazos en TAD.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload image box with comfortable touch area */}
              <div className="border-2 border-dashed border-[#CBDCEB] hover:border-[#2B82C9] rounded-2xl p-4 sm:p-5 text-center transition-colors flex flex-col items-center justify-center bg-[#F8FAFD] min-h-[160px]">
                {docPreview ? (
                  <div className="w-full">
                    <img
                      src={docPreview}
                      alt="Documento cargado"
                      className="max-h-44 sm:max-h-48 rounded-lg mx-auto object-contain border border-[#E2E8F0] shadow-xs mb-3"
                    />
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-[#0F172A] truncate max-w-[180px]">
                        {docFile?.name}
                      </span>
                      <button
                        onClick={() => {
                          setDocFile(null);
                          setDocPreview(null);
                        }}
                        className="min-h-[36px] px-2 text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center w-full py-2">
                    <Upload className="w-8 h-8 text-[#2B82C9] mb-2" />
                    <span className="text-xs font-bold text-[#0B192C]">
                      Toca para subir foto o documento
                    </span>
                    <span className="text-[11px] text-[#64748B] mt-1">
                      Formatos: JPG, PNG, WEBP (hasta 10MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Or paste text */}
              <div className="flex flex-col justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-[#0B192C] block mb-1">
                    O pegá el texto transcripto del documento:
                  </label>
                  <textarea
                    rows={4}
                    value={docText}
                    onChange={(e) => setDocText(e.target.value)}
                    placeholder="Ejemplo: 'Receto Leche medicamentosa Nutrilón Pepti por sospecha de APLV. Paciente de 3 meses... Dr. Gómez Mat. Nac. 123456'"
                    className="w-full text-base sm:text-xs p-3 bg-[#F8FAFD] border border-[#E2E8F0] rounded-[10px] focus:outline-none focus:border-[#2B82C9]"
                  />
                </div>

                <button
                  onClick={ejecutarAuditoria}
                  disabled={(!docPreview && !docText.trim()) || isAuditing}
                  className={`w-full min-h-[44px] rounded-[10px] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-xs ${
                    (docPreview || docText.trim()) && !isAuditing
                      ? 'bg-[#2B82C9] hover:bg-[#2170B0] text-white cursor-pointer'
                      : 'bg-[#F4F8FC] text-[#94A3B8] cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#E5B842]" />
                  <span>{isAuditing ? 'Auditando con Gemini...' : 'Auditar Documento con IA'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audit Results */}
          {auditResult && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-xs animate-fadeIn">
              <div className="flex flex-col xs:flex-row xs:items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4 gap-2">
                <div>
                  <span className="text-[11px] text-[#64748B] font-medium block">
                    Documento analizado:
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-[#0B192C]">
                    {auditResult.tipoDocumento}
                  </h4>
                </div>

                <div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 self-start ${
                      auditResult.estado.includes('Aprobado')
                        ? 'bg-[#EAF3FA] text-[#1C68A6] border border-[#CBDCEB]'
                        : 'bg-[#FEF8E7] text-[#8C650A] border border-[#F4D381]'
                    }`}
                  >
                    {auditResult.estado.includes('Aprobado') ? (
                      <CheckCircle2 className="w-4 h-4 text-[#2B82C9] shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-[#E5B842] shrink-0" />
                    )}
                    <span>{auditResult.estado}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 mb-4">
                {/* Positives */}
                <div className="bg-[#EAF3FA] border border-[#CBDCEB] rounded-[10px] p-3.5 sm:p-4">
                  <span className="text-[11px] sm:text-xs font-bold text-[#1C68A6] uppercase tracking-wider block mb-2">
                    ✓ Requisitos reglamentarios cumplidos:
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#0F172A]">
                    {auditResult.observacionesPositivas.map((obs, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#2B82C9] font-bold shrink-0">•</span>
                        <span className="leading-relaxed">{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing */}
                <div className="bg-[#FEF8E7] border border-[#F4D381] rounded-[10px] p-3.5 sm:p-4">
                  <span className="text-[11px] sm:text-xs font-bold text-[#8C650A] uppercase tracking-wider block mb-2">
                    ⚠️ Elementos que podrían causar rechazo en TAD:
                  </span>
                  {auditResult.elementosFaltantes.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-[#8C650A]">
                      {auditResult.elementosFaltantes.map((falta, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#8C650A] font-bold shrink-0">•</span>
                          <span className="leading-relaxed">{falta}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-[#1C68A6] font-medium">
                      No se detectaron faltantes críticos para este tipo de documento.
                    </p>
                  )}
                </div>
              </div>

              {/* Citizen recommendation */}
              <div className="bg-[#F8FAFD] border border-[#E2E8F0] rounded-[10px] p-3.5 sm:p-4 text-xs text-[#0F172A]">
                <strong className="block font-bold text-[#0B192C] mb-1">
                  Recomendación de Orienta IA para tu presentación:
                </strong>
                <p className="leading-relaxed text-[#334155]">{auditResult.recomendacionCiudadana}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: REDACTOR DE INTIMACIÓN / PRONTO DESPACHO */}
      {activeSubTab === 'redactor' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-[#2B82C9] shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-[#0B192C]">
                Redactor de Intimación Previa y Pronto Despacho (con IA)
              </h3>
            </div>
            <p className="text-xs text-[#475569] mb-4 leading-relaxed">
              Antes de presentar el reclamo formal ante la SSSalud o en simultáneo, es muy conveniente enviar una <strong>nota de intimación o carta documento</strong> a tu Obra Social o Prepaga. La IA fundamentará la nota con las leyes de salud de la República Argentina.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-xs">
              <div>
                <label className="font-bold text-[#0B192C] block mb-1">
                  Nombre del Titular o Beneficiario:
                </label>
                <input
                  type="text"
                  value={titularNombre}
                  onChange={(e) => setTitularNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full p-2.5 bg-[#F8FAFD] border border-[#E2E8F0] rounded-[10px] focus:outline-none focus:border-[#2B82C9] text-base sm:text-sm text-[#0F172A] min-h-[44px]"
                />
              </div>

              <div>
                <label className="font-bold text-[#0B192C] block mb-1">
                  Nombre de la Obra Social o Prepaga:
                </label>
                <input
                  type="text"
                  value={obraSocialNombre}
                  onChange={(e) => setObraSocialNombre(e.target.value)}
                  placeholder="Ej: OSDE / OSECAC / Swiss Medical / IOMA"
                  className="w-full p-2.5 bg-[#F8FAFD] border border-[#E2E8F0] rounded-[10px] focus:outline-none focus:border-[#2B82C9] text-base sm:text-sm text-[#0F172A] min-h-[44px]"
                />
              </div>
            </div>

            <div className="mb-3 text-xs">
              <label className="font-bold text-[#0B192C] block mb-1">
                Motivo concreto del reclamo o prestación rechazada: *
              </label>
              <input
                type="text"
                value={motivoReclamo}
                onChange={(e) => setMotivoReclamo(e.target.value)}
                placeholder="Ej: Falta de entrega de medicación oncológica recetada desde hace 20 días sin respuesta"
                className="w-full p-2.5 bg-[#F8FAFD] border border-[#E2E8F0] rounded-[10px] focus:outline-none focus:border-[#2B82C9] text-base sm:text-sm text-[#0F172A] min-h-[44px]"
              />
            </div>

            <div className="mb-4 text-xs">
              <label className="font-bold text-[#0B192C] block mb-1">
                Detalles médicos o antecedentes (opcional):
              </label>
              <textarea
                rows={2}
                value={detallesMedicos}
                onChange={(e) => setDetallesMedicos(e.target.value)}
                placeholder="Ej: Prescripción médica emitida el 15/09 por el Dr. Romero, diagnóstico Cáncer de Colon, número de trámite interno ante la prepaga 98741."
                className="w-full p-2.5 bg-[#F8FAFD] border border-[#E2E8F0] rounded-[10px] focus:outline-none focus:border-[#2B82C9] text-base sm:text-sm text-[#0F172A]"
              />
            </div>

            <button
              onClick={ejecutarRedaccion}
              disabled={!motivoReclamo.trim() || isDrafting}
              className={`w-full min-h-[44px] rounded-[10px] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-xs ${
                motivoReclamo.trim() && !isDrafting
                  ? 'bg-[#2B82C9] hover:bg-[#2170B0] text-white cursor-pointer'
                  : 'bg-[#F4F8FC] text-[#94A3B8] cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#E5B842]" />
              <span>{isDrafting ? 'Redactando nota formal con Gemini...' : 'Generar Nota de Intimación con IA'}</span>
            </button>
          </div>

          {/* Drafted letter preview */}
          {draftedLetter && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-xs animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4 gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0B192C]">
                  Modelo de Nota Formal Generado
                </span>

                <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={copiarCarta}
                    className="min-h-[44px] px-3.5 bg-white hover:bg-[#F4F8FC] text-[#1C68A6] border border-[#CBDCEB] rounded-[10px] text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors duration-200 cursor-pointer"
                  >
                    {copiado ? <CheckCircle2 className="w-4 h-4 text-[#2B82C9] shrink-0" /> : <Copy className="w-4 h-4 text-[#2B82C9] shrink-0" />}
                    <span>{copiado ? '¡Copiado!' : 'Copiar'}</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="min-h-[44px] px-3.5 bg-[#0B192C] hover:bg-[#11223A] text-white rounded-[10px] text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors duration-200 cursor-pointer border border-[#1E3553]"
                  >
                    <Printer className="w-4 h-4 text-[#E5B842] shrink-0" />
                    <span>Imprimir</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#F8FAFD] border border-[#E2E8F0] rounded-[10px] p-3.5 sm:p-5 overflow-x-auto">
                <pre className="text-xs sm:text-sm text-[#0F172A] font-mono whitespace-pre-wrap leading-relaxed">
                  {draftedLetter}
                </pre>
              </div>

              <p className="mt-2.5 text-[10px] sm:text-[11px] text-[#64748B] italic leading-snug">
                * Completá los campos entre corchetes con tus datos personales antes de presentarla en mesa de entradas o enviarla por correo/carta documento.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
