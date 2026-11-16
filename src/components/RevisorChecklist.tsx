/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Printer,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  FileText,
  Building2,
  ExternalLink,
  Briefcase
} from 'lucide-react';
import { TRAMITES_DATA, CONDICION_LABELS, ENLACES_OFICIALES } from '../data/tramitesData';
import { CondicionLaboral } from '../types';

interface RevisorChecklistProps {
  initialTramiteId?: string;
  onNavigateToRedactor?: (tramiteId: string) => void;
}

export const RevisorChecklist: React.FC<RevisorChecklistProps> = ({
  initialTramiteId,
  onNavigateToRedactor
}) => {
  const [selectedTramiteId, setSelectedTramiteId] = useState<string>(
    initialTramiteId || 'cobertura_prestacional'
  );
  const [selectedCondicion, setSelectedCondicion] = useState<CondicionLaboral>('relacion_dependencia');
  const [tildes, setTildes] = useState<Record<string, boolean>>({});

  // Sync selected trámite if navigated from catalog with a specific ID
  useEffect(() => {
    if (initialTramiteId) {
      setSelectedTramiteId(initialTramiteId);
      setTildes({});
    }
  }, [initialTramiteId]);

  const tramite = TRAMITES_DATA.find((t) => t.id === selectedTramiteId) || TRAMITES_DATA[0];

  // Requirements lists
  const comunes = tramite.requisitos.comunes || [];
  const porSituacion = (tramite.requisitos.por_situacion && tramite.requisitos.por_situacion[selectedCondicion]) || [];
  const allDocs = [...comunes, ...porSituacion];

  const toggleItem = (doc: string) => {
    setTildes((prev) => ({
      ...prev,
      [doc]: !prev[doc]
    }));
  };

  const listos = allDocs.filter((d) => tildes[d]);
  const faltantes = allDocs.filter((d) => !tildes[d]);
  const porcentaje = allDocs.length > 0 ? Math.round((listos.length / allDocs.length) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Title & Tool Notice */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-[#2BB5A0] text-xs font-bold uppercase tracking-wider font-['Montserrat']">
          <CheckSquare className="w-4 h-4" />
          <span>Herramienta de autogestión</span>
        </div>
        <h2 className="text-2xl font-bold text-[#1F3A5F] font-['Montserrat'] mt-1">
          Revisor de checklist de documentación
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
          Tildá los documentos que ya tenés reunidos y la aplicación te mostrará qué te falta antes de iniciar el trámite formal ante la SSSalud o en TAD.
        </p>
      </div>

      {/* Mandatory Privacy Notice (No fotos ni historias médicas) */}
      <div className="bg-[#FFF4DC] border-l-4 border-[#E0AE3B] rounded-r-xl p-3.5 mb-6 text-xs text-[#1F3A5F]">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-[#E0AE3B] flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-amber-950 font-['Montserrat']">
              Sin carga de archivos personales ni médicos:
            </strong>{' '}
            Para resguardar tu privacidad, en Orienta IA <strong>no se suben fotos, recetas ni historias clínicas</strong>.
            Solo tildás las casillas para saber si tenés la carpeta completa.
          </div>
        </div>
      </div>

      {/* Selectors and Condition Question */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs mb-6">
        {/* Trámite selector */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-[#1F3A5F] uppercase tracking-wider font-['Montserrat']">
              1. Trámite seleccionado:
            </label>
            <span className="text-[11px] bg-[#E4F6F3] text-[#1F3A5F] font-semibold px-2 py-0.5 rounded border border-[#2BB5A0]/30">
              {tramite.macro_categoria}
            </span>
          </div>
          <select
            value={selectedTramiteId}
            onChange={(e) => {
              setSelectedTramiteId(e.target.value);
              setTildes({});
            }}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1F3A5F] focus:outline-none focus:ring-2 focus:ring-[#2BB5A0]"
          >
            {TRAMITES_DATA.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} ({t.macro_categoria})
              </option>
            ))}
          </select>
        </div>

        {/* Condition question with quick clickable buttons */}
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-[#1F3A5F] uppercase tracking-wider mb-2 font-['Montserrat'] flex items-center space-x-1.5">
            <Briefcase className="w-4 h-4 text-[#2BB5A0]" />
            <span>2. ¿Cuál es tu condición laboral actual? (Elegí tu situación para cargar los comprobantes exactos):</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CONDICION_LABELS)
              .filter(([k]) => k !== 'no_informa')
              .map(([key, label]) => {
                const isSelected = selectedCondicion === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedCondicion(key as CondicionLaboral);
                      setTildes({});
                    }}
                    className={`text-xs px-3 py-2 rounded-xl font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-[#1F3A5F] text-white font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                    }`}
                  >
                    <span>{label}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#2BB5A0]" />}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Trámite overview bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-gray-500">Canal de presentación: </span>
            <strong className="text-[#1F3A5F]">{tramite.canal.virtual}</strong>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">Seguimiento:</span>
            <span className="bg-[#E4F6F3] text-[#1F3A5F] px-2 py-0.5 rounded font-semibold text-[11px]">
              {tramite.canal.seguimiento}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F] font-['Montserrat']">
            Progreso de documentación
          </span>
          <span className="text-sm font-extrabold text-[#2BB5A0]">
            {listos.length} de {allDocs.length} documentos ({porcentaje}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
          <div
            className={`h-full transition-all duration-300 ${
              porcentaje === 100 ? 'bg-emerald-500' : 'bg-[#2BB5A0]'
            }`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>

        {porcentaje === 100 ? (
          <div className="mt-3 flex items-center space-x-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              ¡Excelente! Tenés todos los requisitos listos para presentar tu trámite en los canales oficiales.
            </span>
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-500">
            Marcá con un tilde los documentos que ya tenés a mano o emitidos para ver qué te queda pendiente.
          </p>
        )}
      </div>

      {/* Interactive List of Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Documentos Comunes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F] font-['Montserrat'] mb-3 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1F3A5F]" />
            <span>Requisitos comunes ({comunes.length})</span>
          </h3>

          <div className="space-y-2">
            {comunes.map((doc, idx) => {
              const isChecked = !!tildes[doc];
              return (
                <label
                  key={idx}
                  className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors text-xs ${
                    isChecked
                      ? 'bg-[#E4F6F3] border-[#2BB5A0]/40 text-[#1F3A5F]'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleItem(doc)}
                    className="mt-0.5 rounded text-[#2BB5A0] focus:ring-[#2BB5A0] w-4 h-4 cursor-pointer"
                  />
                  <span className={isChecked ? 'line-through text-gray-500 font-normal' : 'font-medium'}>
                    {doc}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Documentos por situación */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F] font-['Montserrat'] mb-3 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E0AE3B]" />
            <span>
              Requisitos por situación: {CONDICION_LABELS[selectedCondicion]} ({porSituacion.length})
            </span>
          </h3>

          {porSituacion.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-gray-500">
              Para este trámite no se exigen requisitos adicionales específicos para tu situación laboral; solo se presentan los comunes.
            </div>
          ) : (
            <div className="space-y-2">
              {porSituacion.map((doc, idx) => {
                const isChecked = !!tildes[doc];
                return (
                  <label
                    key={idx}
                    className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors text-xs ${
                      isChecked
                        ? 'bg-[#E4F6F3] border-[#2BB5A0]/40 text-[#1F3A5F]'
                        : 'bg-amber-50/40 border-amber-200/60 hover:bg-amber-50 text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(doc)}
                      className="mt-0.5 rounded text-[#2BB5A0] focus:ring-[#2BB5A0] w-4 h-4 cursor-pointer"
                    />
                    <span className={isChecked ? 'line-through text-gray-500 font-normal' : 'font-medium'}>
                      {doc}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary Box: What is missing & where to get it */}
      {faltantes.length > 0 && (
        <div className="mt-6 bg-[#F6F8FA] border border-slate-200 rounded-2xl p-4 sm:p-5">
          <h3 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider mb-2 font-['Montserrat'] flex items-center space-x-1.5">
            <HelpCircle className="w-4 h-4 text-[#2BB5A0]" />
            <span>Documentos pendientes ({faltantes.length}) y dónde gestionarlos:</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-gray-700 pl-4 list-disc">
            {faltantes.map((f, i) => (
              <li key={i}>
                <strong>{f}</strong>
                {f.toLowerCase().includes('recibo') && (
                  <span className="text-gray-500"> — Pedilo a tu empleador o desde tu portal de haberes.</span>
                )}
                {f.toLowerCase().includes('formulario') && (
                  <span className="text-gray-500"> — Descargable desde ARCA o TAD al iniciar la presentación.</span>
                )}
                {f.toLowerCase().includes('historia clinica') && (
                  <span className="text-gray-500"> — Solicitásela a tu médico/a tratante con firma y matrícula.</span>
                )}
                {f.toLowerCase().includes('cud') && (
                  <span className="text-gray-500"> — Debe estar vigente emitido por la Agencia Nacional de Discapacidad (ANDIS).</span>
                )}
                {f.toLowerCase().includes('anses') && (
                  <span className="text-gray-500"> — Descargable con CUIL y Clave de la Seguridad Social desde Mi ANSES.</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-[#1F3A5F] hover:bg-[#162a45] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir checklist</span>
          </button>

          {onNavigateToRedactor && (
            <button
              onClick={() => onNavigateToRedactor(selectedTramiteId)}
              className="flex items-center space-x-1.5 bg-[#2BB5A0] hover:bg-[#25a18e] text-[#1F3A5F] text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Redactar nota para este trámite</span>
            </button>
          )}
        </div>

        <a
          href={tramite.id === 'opcion_cambio' ? ENLACES_OFICIALES.miSssalud : ENLACES_OFICIALES.tad}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-xs text-[#1F3A5F] hover:text-[#2BB5A0] font-semibold"
        >
          <span>Ir a la plataforma oficial</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
