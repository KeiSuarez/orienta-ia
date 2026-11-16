import React from 'react';
import { Check, HelpCircle, Briefcase, User, Layers } from 'lucide-react';
import { DatosMinimos, TramiteCategoria, CondicionLaboral, DestinatarioReclamo } from '../types';

interface TrackingPillsProps {
  datos: DatosMinimos;
  onUpdateDatos: (nuevosDatos: DatosMinimos) => void;
}

export const TrackingPills: React.FC<TrackingPillsProps> = ({ datos, onUpdateDatos }) => {
  const categorias: TramiteCategoria[] = [
    'Afiliación',
    'Problema Prestacional / Cobertura',
    'Opción de Cambio',
    'Discapacidad',
    'Unificación de Aportes',
  ];

  const condiciones: CondicionLaboral[] = [
    'Relación de dependencia',
    'Monotributo',
    'Monotributo Social',
    'Casas particulares / Servicio doméstico',
    'Jubilado / Pensionado',
    'Seguro de desempleo',
    'Usuario directo de Prepaga / Adherente',
  ];

  const destinatarios: DestinatarioReclamo[] = [
    'Titular',
    'Familiar (Cónyuge / Conviviente)',
    'Hijo/a menor de 21 años',
    'Hijo/a estudiante (21 a 25 años)',
    'Persona con CUD (Discapacidad)',
  ];

  const completos = Boolean(datos.categoria && datos.condicionLaboral && datos.destinatario);

  return (
    <div className="bg-white border-b border-[#E2E8F0] px-3 sm:px-6 py-2.5 sm:py-2.5 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
        {/* Status header */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#475569]">
            Datos Mínimos del Caso:
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
              value={datos.categoria || ''}
              onChange={(e) =>
                onUpdateDatos({
                  ...datos,
                  categoria: (e.target.value as TramiteCategoria) || null,
                })
              }
              aria-label="Seleccionar categoría de trámite"
              className="bg-transparent font-semibold text-[#0B192C] focus:outline-none cursor-pointer flex-1 sm:flex-none text-[13px] sm:text-xs min-w-0"
            >
              <option value="">Pendiente...</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Condición Laboral */}
          <div className="flex items-center gap-2 bg-[#F4F8FC] border border-[#E2E8F0] rounded-[10px] px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-[34px] focus-within:border-[#2B82C9] focus-within:ring-1 focus-within:ring-[#2B82C9] transition-all w-full sm:w-auto">
            <Briefcase className="w-4 h-4 text-[#2B82C9] shrink-0" />
            <span className="text-[#475569] font-medium shrink-0">Condición:</span>
            <select
              value={datos.condicionLaboral || ''}
              onChange={(e) =>
                onUpdateDatos({
                  ...datos,
                  condicionLaboral: (e.target.value as CondicionLaboral) || null,
                })
              }
              aria-label="Seleccionar condición laboral"
              className="bg-transparent font-semibold text-[#0B192C] focus:outline-none cursor-pointer flex-1 sm:flex-none text-[13px] sm:text-xs min-w-0 sm:max-w-[160px] truncate"
            >
              <option value="">Pendiente...</option>
              {condiciones.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Destinatario */}
          <div className="flex items-center gap-2 bg-[#F4F8FC] border border-[#E2E8F0] rounded-[10px] px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-[34px] focus-within:border-[#2B82C9] focus-within:ring-1 focus-within:ring-[#2B82C9] transition-all w-full sm:w-auto">
            <User className="w-4 h-4 text-[#2B82C9] shrink-0" />
            <span className="text-[#475569] font-medium shrink-0">Beneficiario:</span>
            <select
              value={datos.destinatario || ''}
              onChange={(e) =>
                onUpdateDatos({
                  ...datos,
                  destinatario: (e.target.value as DestinatarioReclamo) || null,
                })
              }
              aria-label="Seleccionar destinatario o beneficiario"
              className="bg-transparent font-semibold text-[#0B192C] focus:outline-none cursor-pointer flex-1 sm:flex-none text-[13px] sm:text-xs min-w-0 sm:max-w-[150px] truncate"
            >
              <option value="">Pendiente...</option>
              {destinatarios.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
