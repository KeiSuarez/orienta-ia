import React from 'react';
import { Check, HelpCircle, Briefcase, User, Layers } from 'lucide-react';
import { DatosMinimos } from '../types';
import { CondicionLaboral, Beneficiario } from '../data/db/types';
import { TRAMITES_DATA, CONDICION_LABELS, BENEFICIARIO_LABELS } from '../data/db/tramitesData';

interface TrackingPillsProps {
  datos: DatosMinimos;
  onUpdateDatos: (nuevosDatos: DatosMinimos) => void;
}

export const TrackingPills: React.FC<TrackingPillsProps> = ({ datos, onUpdateDatos }) => {
  const condiciones = (Object.keys(CONDICION_LABELS) as CondicionLaboral[]).filter((c) => c !== 'no_informa');
  const beneficiarios = (Object.keys(BENEFICIARIO_LABELS) as Beneficiario[]).filter((b) => b !== 'no_informa');

  const completos = Boolean(datos.tramiteId && datos.condicion && datos.beneficiario);

  return (
    <div className="bg-white border-b border-[#E2E8F0] px-3 sm:px-6 py-2.5 sm:py-2.5 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
        {/* Status header */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#475569]">
            Datos mínimos del caso:
          </span>
          {completos ? (
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-[12px] font-semibold bg-[#EAF3FA] text-[#1C68A6] px-2.5 py-0.5 rounded-full border border-[#CBDCEB]">
              <Check className="w-3.5 h-3.5 text-[#2B82C9]" /> Datos completos
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-[12px] font-semibold bg-[#FEF8E7] text-[#8C650A] px-2.5 py-0.5 rounded-full border border-[#F4D381]">
              <HelpCircle className="w-3.5 h-3.5 text-[#E5B842]" /> Relevando información
            </span>
          )}
        </div>

        {/* 3 Select Pills: Vertical stack on mobile with 44px touch targets, horizontal on desktop */}
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 text-xs w-full md:w-auto">
          {/* 1. Categoría */}
          <div className="flex items-center gap-2 bg-[#F4F8FC] border border-[#E2E8F0] rounded-[10px] px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-[34px] focus-within:border-[#2B82C9] focus-within:ring-1 focus-within:ring-[#2B82C9] transition-all w-full sm:w-auto">
            <Layers className="w-4 h-4 text-[#2B82C9] shrink-0" />
            <span className="text-[#475569] font-medium shrink-0">Trámite:</span>
            <select
              value={datos.tramiteId || ''}
              onChange={(e) =>
                onUpdateDatos({
                  ...datos,
                  tramiteId: e.target.value || null,
                })
              }
              aria-label="Seleccionar categoría de trámite"
              className="bg-transparent font-semibold text-[#0B192C] focus:outline-none cursor-pointer flex-1 sm:flex-none text-[13px] sm:text-xs min-w-0 sm:max-w-[190px] truncate"
            >
              <option value="">Pendiente...</option>
              {TRAMITES_DATA.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Condición Laboral */}
          <div className="flex items-center gap-2 bg-[#F4F8FC] border border-[#E2E8F0] rounded-[10px] px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-[34px] focus-within:border-[#2B82C9] focus-within:ring-1 focus-within:ring-[#2B82C9] transition-all w-full sm:w-auto">
            <Briefcase className="w-4 h-4 text-[#2B82C9] shrink-0" />
            <span className="text-[#475569] font-medium shrink-0">Condición:</span>
            <select
              value={datos.condicion || ''}
              onChange={(e) =>
                onUpdateDatos({
                  ...datos,
                  condicion: (e.target.value as CondicionLaboral) || null,
                })
              }
              aria-label="Seleccionar condición laboral"
              className="bg-transparent font-semibold text-[#0B192C] focus:outline-none cursor-pointer flex-1 sm:flex-none text-[13px] sm:text-xs min-w-0 sm:max-w-[160px] truncate"
            >
              <option value="">Pendiente...</option>
              {condiciones.map((cond) => (
                <option key={cond} value={cond}>
                  {CONDICION_LABELS[cond]}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Destinatario */}
          <div className="flex items-center gap-2 bg-[#F4F8FC] border border-[#E2E8F0] rounded-[10px] px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-[34px] focus-within:border-[#2B82C9] focus-within:ring-1 focus-within:ring-[#2B82C9] transition-all w-full sm:w-auto">
            <User className="w-4 h-4 text-[#2B82C9] shrink-0" />
            <span className="text-[#475569] font-medium shrink-0">Beneficiario:</span>
            <select
              value={datos.beneficiario || ''}
              onChange={(e) =>
                onUpdateDatos({
                  ...datos,
                  beneficiario: (e.target.value as Beneficiario) || null,
                })
              }
              aria-label="Seleccionar destinatario o beneficiario"
              className="bg-transparent font-semibold text-[#0B192C] focus:outline-none cursor-pointer flex-1 sm:flex-none text-[13px] sm:text-xs min-w-0 sm:max-w-[150px] truncate"
            >
              <option value="">Pendiente...</option>
              {beneficiarios.map((b) => (
                <option key={b} value={b}>
                  {BENEFICIARIO_LABELS[b]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
