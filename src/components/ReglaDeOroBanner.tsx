import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, HeartHandshake, HelpCircle } from 'lucide-react';

export const ReglaDeOroBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border-y border-[#E2E8F0] px-3 sm:px-6 py-2 sm:py-2.5 shadow-2xs">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="p-2 rounded-xl bg-[#EAF3FA] text-[#2B82C9] shrink-0 mt-0.5 border border-[#D4DFEB]">
            <HeartHandshake className="w-5 h-5 text-[#2B82C9]" />
          </div>

          <div className="flex-1 text-sm text-[#0F172A] min-w-0">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 xs:gap-2">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-[#0B192C] text-[13px] sm:text-[15px] flex items-center gap-1.5 flex-wrap">
                  Acompañamiento SSSalud
                  <span className="text-[11px] sm:text-[12px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF3FA] text-[#1C68A6] border border-[#CBDCEB]">
                    Orientación & Checklist
                  </span>
                </span>
              </div>

              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-semibold text-[#2B82C9] hover:text-[#2170B0] flex items-center gap-1 cursor-pointer transition-colors py-1 xs:py-0 self-start xs:self-auto min-h-[36px] sm:min-h-0"
              >
                {expanded ? 'Ocultar detalles' : '¿Cómo funciona?'}
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="mt-1 text-xs text-[#475569] leading-relaxed">
              <strong className="text-[#0B192C]">Orienta IA está para escucharte y facilitarte las cosas.</strong> Para proteger tu privacidad y asegurar validez legal, no tomamos denuncias por este chat. Nuestra misión es entender tu situación, darte tu <strong className="text-[#0B192C]">checklist exacto de documentación</strong> y dejarte todo preparado para que ingreses tu trámite en los canales oficiales habilitados (TAD o presencial con turno).
            </p>

            {expanded && (
              <div className="mt-3 pt-3 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs text-[#0F172A]">
                <div className="bg-[#F8FAFD] p-3 sm:p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
                  <div className="font-bold text-[#0B192C] flex items-center gap-1.5 mb-1 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#2B82C9] shrink-0" />
                    En qué te ayuda Orienta
                  </div>
                  <ul className="space-y-1 list-disc list-inside text-[#475569] text-[11px] sm:text-xs">
                    <li>Te escucha con empatía en tu propio lenguaje.</li>
                    <li>Revisa tu situación y condición de aportes.</li>
                    <li>Te entrega el checklist listo para imprimir.</li>
                  </ul>
                </div>

                <div className="bg-[#F8FAFD] p-3 sm:p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
                  <div className="font-bold text-[#0B192C] flex items-center gap-1.5 mb-1 text-xs">
                    <HelpCircle className="w-4 h-4 text-[#E5B842] shrink-0" />
                    Para cuidar tu gestión
                  </div>
                  <ul className="space-y-1 list-disc list-inside text-[#475569] text-[11px] sm:text-xs">
                    <li>No te pedirá claves fiscales ni contraseñas.</li>
                    <li>Te evita vueltas o papeles faltantes en la mesa de entrada.</li>
                    <li>Te guía paso a paso con las normas oficiales vigentes.</li>
                  </ul>
                </div>

                <div className="bg-[#F8FAFD] p-3 sm:p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
                  <div className="font-bold text-[#0B192C] flex items-center gap-1.5 mb-1 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#2B82C9] shrink-0" />
                    Siguientes pasos oficiales
                  </div>
                  <ul className="space-y-1 list-disc list-inside text-[#475569] text-[11px] sm:text-xs">
                    <li>Subir tu trámite a Trámites a Distancia (TAD).</li>
                    <li>O presentarte en Bartolomé Mitre 434 con turno.</li>
                    <li>Hacer valer tus derechos con el expediente iniciado.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
