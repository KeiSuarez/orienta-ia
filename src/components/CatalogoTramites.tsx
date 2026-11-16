/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ExternalLink,
  CheckCircle2,
  FileCheck2,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { TRAMITES_DATA, ENLACES_OFICIALES, CONDICION_LABELS } from '../data/tramitesData';
import { Tramite } from '../types';

interface CatalogoTramitesProps {
  onSelectTramite: (tramiteId: string) => void;
  onOpenChecklist: (tramiteId: string) => void;
}

export const CatalogoTramites: React.FC<CatalogoTramitesProps> = ({
  onSelectTramite,
  onOpenChecklist
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [activeModalTramite, setActiveModalTramite] = useState<Tramite | null>(null);

  const categories = [
    'Todas',
    'Afiliación',
    'Cobertura',
    'Discapacidad',
    'Cuota',
    'IVE',
    'Aportes',
    'Padrón',
    'Opción de cambio'
  ];

  const filteredTramites = TRAMITES_DATA.filter((t) => {
    const matchesSearch =
      t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ejemplos_usuario.some((e) => e.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'Todas' || t.macro_categoria === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-[#2BB5A0] text-xs font-bold uppercase tracking-wider font-['Montserrat']">
          <BookOpen className="w-4 h-4" />
          <span>Base de conocimiento oficial</span>
        </div>
        <h2 className="text-2xl font-bold text-[#1F3A5F] font-['Montserrat'] mt-1">
          Los 11 trámites ante la Superintendencia de Servicios de Salud
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
          Catálogo basado en la guía de trámites y denuncias ante la SSSalud (octubre 2026).
        </p>
      </div>

      {/* Strict knowledge base notice */}
      <div className="bg-[#E4F6F3] border border-[#2BB5A0]/40 rounded-xl p-3.5 mb-6 text-xs text-[#1F3A5F] flex items-center space-x-2.5">
        <Info className="w-4 h-4 text-[#2BB5A0] flex-shrink-0" />
        <span>
          <strong>Regla de exactitud:</strong> Si un requisito o plazo no se encuentra en esta base, el asistente responderá: <em>"No tengo ese dato confirmado; consultalo en el canal oficial"</em>.
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mb-6 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por trámite, estudio, medicamento o palabra clave..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-[#1F3A5F] focus:outline-none focus:ring-2 focus:ring-[#2BB5A0]"
          />
        </div>

        {/* Categories Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#1F3A5F] text-white font-semibold'
                  : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Trámites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTramites.map((tramite) => (
          <div
            key={tramite.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-[#2BB5A0] hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#E4F6F3] text-[#1F3A5F] border border-[#2BB5A0]/30">
                  {tramite.macro_categoria}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {tramite.tipo === 'denuncia' ? 'Denuncia' : 'Trámite'}
                </span>
              </div>

              <h3 className="font-bold text-[#1F3A5F] font-['Montserrat'] text-base mb-2 leading-snug">
                {tramite.nombre}
              </h3>

              <p className="text-xs text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                {tramite.descripcion}
              </p>

              {/* Canal tag */}
              <div className="text-[11px] text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-4">
                <span className="font-semibold text-[#1F3A5F] block mb-0.5">Canal de presentación:</span>
                <span className="line-clamp-2">{tramite.canal.virtual}</span>
              </div>
            </div>

            {/* Card actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => setActiveModalTramite(tramite)}
                className="text-xs font-semibold text-[#1F3A5F] hover:text-[#2BB5A0] transition-colors"
              >
                Ver ficha completa
              </button>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => onOpenChecklist(tramite.id)}
                  title="Abrir checklist"
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#E4F6F3] text-[#1F3A5F] hover:text-[#2BB5A0] transition-colors"
                >
                  <FileCheck2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSelectTramite(tramite.id)}
                  title="Consultar al asistente"
                  className="flex items-center space-x-1 text-xs font-bold bg-[#2BB5A0] text-[#1F3A5F] px-2.5 py-1.5 rounded-lg hover:bg-[#25a18e] transition-colors"
                >
                  <span>Consultar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTramites.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-gray-500 text-xs">
          No se encontraron trámites con esa búsqueda. Podés consultar al asistente directamente.
        </div>
      )}

      {/* Full Detail Modal */}
      {activeModalTramite && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <span className="text-xs font-bold bg-[#E4F6F3] text-[#1F3A5F] px-2 py-0.5 rounded">
                  {activeModalTramite.macro_categoria}
                </span>
                <h3 className="text-lg font-bold text-[#1F3A5F] font-['Montserrat'] mt-1">
                  {activeModalTramite.nombre}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalTramite(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-4">
              {activeModalTramite.descripcion}
            </p>

            {/* Canal oficial */}
            <div className="bg-[#1F3A5F] text-white rounded-xl p-4 mb-4 text-xs">
              <h4 className="font-bold text-[#2BB5A0] font-['Montserrat'] mb-1">
                Canal Oficial de Presentación:
              </h4>
              <p className="text-gray-100 mb-1">{activeModalTramite.canal.virtual}</p>
              <p className="text-gray-300">Presencial: {activeModalTramite.canal.presencial}</p>
              <p className="text-gray-400 mt-1">Seguimiento: {activeModalTramite.canal.seguimiento}</p>
            </div>

            {/* Requisitos comunes */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider mb-2 font-['Montserrat']">
                Requisitos comunes ({activeModalTramite.requisitos.comunes.length}):
              </h4>
              <ul className="space-y-1 text-xs text-gray-700 pl-4 list-disc">
                {activeModalTramite.requisitos.comunes.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Requisitos por situación */}
            {activeModalTramite.requisitos.por_situacion &&
              Object.keys(activeModalTramite.requisitos.por_situacion).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider mb-2 font-['Montserrat']">
                    Requisitos específicos según situación laboral:
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(activeModalTramite.requisitos.por_situacion).map(([key, docs]) => (
                      <div key={key} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                        <strong className="text-[#1F3A5F] block mb-1">
                          {CONDICION_LABELS[key as keyof typeof CONDICION_LABELS] || key}:
                        </strong>
                        <ul className="pl-4 list-circle text-gray-600 space-y-0.5">
                          {docs.map((d, di) => (
                            <li key={di}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Notas oficiales */}
            {activeModalTramite.notas && (
              <div className="bg-[#FFF4DC] border-l-4 border-[#E0AE3B] p-3 rounded-r-lg text-xs text-[#1F3A5F] mb-4">
                <strong>Nota oficial:</strong> {activeModalTramite.notas}
              </div>
            )}

            {/* Fuente */}
            <p className="text-[10px] text-gray-400 border-t border-slate-100 pt-2 mb-4">
              Fuente oficial: {activeModalTramite.fuente}
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  const id = activeModalTramite.id;
                  setActiveModalTramite(null);
                  onOpenChecklist(id);
                }}
                className="bg-slate-100 text-[#1F3A5F] hover:bg-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Abrir Revisor
              </button>
              <button
                onClick={() => {
                  const id = activeModalTramite.id;
                  setActiveModalTramite(null);
                  onSelectTramite(id);
                }}
                className="bg-[#2BB5A0] text-[#1F3A5F] hover:bg-[#25a18e] text-xs font-bold px-4 py-2 rounded-xl transition-colors"
              >
                Iniciar en el Asistente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
