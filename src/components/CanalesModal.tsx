import React from 'react';
import {
  OFFICIAL_LINKS,
  CAT_INFO,
} from '../data/canalesContacto';
import {
  ExternalLink,
  Laptop,
  MapPin,
  Clock,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const CanalesModal: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-2.5 sm:px-6 py-4 sm:py-6 w-full">
      {/* Title */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#1C68A6] bg-[#EAF3FA] px-2.5 py-1 rounded-[6px] border border-[#CBDCEB]">
            Canales oficiales de la SSSalud
          </span>
          <h2 className="text-lg sm:text-2xl font-bold text-[#0B192C] mt-2">
            Canales de contacto
          </h2>
          <p className="text-xs sm:text-sm text-[#475569] mt-1 leading-relaxed">
            Dónde presentar tu trámite, sacar turno o hacer el seguimiento una vez que tengas la documentación del checklist. Orienta IA no toma reclamos: estos son los canales de la SSSalud.
          </p>
        </div>
      </div>

      {/* Cards: TAD vs Presencial (1-col on mobile, 2-col on md+) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* TAD */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#1C68A6] bg-[#EAF3FA] px-2.5 py-1 rounded-[6px] border border-[#CBDCEB]">
                100% Digital y Gratuito
              </span>
              <Laptop className="w-5 h-5 text-[#2B82C9]" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[#0B192C]">
              Trámites a Distancia (TAD)
            </h3>
            <p className="text-xs text-[#475569] mt-1 leading-relaxed">
              Permite ingresar denuncias y reclamos desde cualquier punto del país sin concurrir a oficinas.
            </p>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="bg-[#F8FAFD] p-3 sm:p-3.5 rounded-xl border border-[#E2E8F0]">
                <strong className="text-[#0B192C] block font-bold text-xs sm:text-sm">
                  Trámite TAD 6020 - Reclamos por Afiliación
                </strong>
                <span className="text-[#475569] block mt-0.5 text-[11px] sm:text-xs">
                  Falta de alta, rechazo de opción, negativa a incorporar familiares.
                </span>
                <a
                  href={OFFICIAL_LINKS.tad6020}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1 font-semibold text-[#2B82C9] hover:text-[#2170B0] min-h-[36px]"
                >
                  <span>Acceder a TAD 6020</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="bg-[#F8FAFD] p-3 sm:p-3.5 rounded-xl border border-[#E2E8F0]">
                <strong className="text-[#0B192C] block font-bold text-xs sm:text-sm">
                  Trámite TAD 2723 - Reclamos Prestacionales
                </strong>
                <span className="text-[#475569] block mt-0.5 text-[11px] sm:text-xs">
                  Falta de medicamentos, prótesis, turnos médicos, tratamientos, discapacidad.
                </span>
                <a
                  href={OFFICIAL_LINKS.tad2723}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1 font-semibold text-[#2B82C9] hover:text-[#2170B0] min-h-[36px]"
                >
                  <span>Acceder a TAD 2723</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Crucial TAD section explanation */}
            <div className="mt-4 bg-[#FEF8E7] border border-[#F4D381] rounded-xl p-3 sm:p-3.5 text-xs text-[#8C650A]">
              <strong className="flex items-center gap-1.5 font-bold text-[#8C650A] mb-1">
                <AlertCircle className="w-4 h-4 text-[#8C650A] shrink-0" />
                Regla Operativa TAD (Sección 13.2 y 13.3):
              </strong>
              <p className="leading-snug text-[11px] sm:text-xs">
                En TAD debés completar 3 apartados obligatorios:
              </p>
              <ul className="list-disc list-inside mt-1.5 space-y-1 text-[11px] sm:text-xs">
                <li>1. <strong>Datos del Trámite</strong>.</li>
                <li>2. <strong>Presentación de Reclamos de Beneficiarios</strong>.</li>
                <li>
                  3. <strong className="underline">Balance</strong>: Adjuntar el Formulario de Reclamo Oficial firmado en este apartado para que el trámite sea admitido.
                </li>
              </ul>
            </div>
          </div>

          <a
            href={OFFICIAL_LINKS.tadInicio}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 w-full min-h-[44px] bg-[#2B82C9] hover:bg-[#2170B0] text-white rounded-[10px] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200"
          >
            <span>Ingresar al Portal General de TAD</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Presencial con Turno */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#475569] bg-[#F4F8FC] px-2.5 py-1 rounded-[6px] border border-[#E2E8F0]">
                Atención Presencial
              </span>
              <MapPin className="w-5 h-5 text-[#2B82C9]" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[#0B192C]">
              Sede Central Presencial SSSalud
            </h3>
            <p className="text-xs text-[#475569] mt-1 leading-relaxed">
              Atención presencial en oficinas de la SSSalud en la Ciudad Autónoma de Buenos Aires.
            </p>

            <div className="mt-4 bg-[#F8FAFD] p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] space-y-2.5 text-xs text-[#0F172A]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#2B82C9] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[#0B192C]">Dirección:</strong>
                  <span className="text-[11px] sm:text-xs">{CAT_INFO.sedePresencial}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#2B82C9] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[#0B192C]">Horario de atención:</strong>
                  <span className="text-[11px] sm:text-xs">{CAT_INFO.horarioAtencion}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-[#EAF3FA] border border-[#CBDCEB] rounded-xl p-3 sm:p-3.5 text-xs text-[#0B192C]">
              <strong className="block font-bold mb-1 text-[#1C68A6]">
                IMPORTANTE: Turno previo indispensable
              </strong>
              <p className="text-[#334155] leading-relaxed text-[11px] sm:text-xs">
                Por disposición operativa de la SSSalud, no se reciben reclamos de manera espontánea sin turno previo asignado por Mi Argentina.
              </p>
            </div>
          </div>

          <a
            href={OFFICIAL_LINKS.turnos}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 w-full min-h-[44px] bg-white hover:bg-[#F4F8FC] text-[#1C68A6] border border-[#CBDCEB] rounded-[10px] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200"
          >
            <span>Solicitar Turno en Mi Argentina</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Enlaces de Consulta y Seguimiento (1-col on mobile, 3-col on sm+) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-xs">
        <h4 className="text-xs sm:text-sm font-bold text-[#0B192C] uppercase tracking-wider mb-3">
          Herramientas y Enlaces Oficiales de Consulta
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
          <a
            href={OFFICIAL_LINKS.cav}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#F8FAFD] p-3 rounded-xl border border-[#E2E8F0] hover:border-[#7BB6E4] hover:bg-[#EAF3FA] transition-all flex items-center justify-between min-h-[48px]"
          >
            <div>
              <strong className="text-[#0B192C] block font-bold text-xs sm:text-sm">CAV SSSalud</strong>
              <span className="text-[#64748B] text-[11px]">Centro de Atención Virtual</span>
            </div>
            <ExternalLink className="w-4 h-4 text-[#2B82C9] shrink-0" />
          </a>

          <a
            href={OFFICIAL_LINKS.listadoMonotributo}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#F8FAFD] p-3 rounded-xl border border-[#E2E8F0] hover:border-[#7BB6E4] hover:bg-[#EAF3FA] transition-all flex items-center justify-between min-h-[48px]"
          >
            <div>
              <strong className="text-[#0B192C] block font-bold text-xs sm:text-sm">Listado Monotributistas</strong>
              <span className="text-[#64748B] text-[11px]">Obras sociales que aceptan</span>
            </div>
            <ExternalLink className="w-4 h-4 text-[#2B82C9] shrink-0" />
          </a>

          <a
            href={OFFICIAL_LINKS.sssalud}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#F8FAFD] p-3 rounded-xl border border-[#E2E8F0] hover:border-[#7BB6E4] hover:bg-[#EAF3FA] transition-all flex items-center justify-between min-h-[48px]"
          >
            <div>
              <strong className="text-[#0B192C] block font-bold text-xs sm:text-sm">Portal SSSalud</strong>
              <span className="text-[#64748B] text-[11px]">Sitio institucional general</span>
            </div>
            <ExternalLink className="w-4 h-4 text-[#2B82C9] shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
};
