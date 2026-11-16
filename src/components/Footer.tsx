/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, ExternalLink, ShieldAlert, Building2 } from 'lucide-react';
import { ENLACES_OFICIALES } from '../data/tramitesData';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1F3A5F] text-white mt-12 border-t border-slate-700/60 font-sans">
      {/* Mandatory Fixed Notice Box */}
      <div className="bg-[#FFF4DC] border-y border-[#E0AE3B]/40 px-4 py-3.5 text-[#1F3A5F]">
        <div className="max-w-6xl mx-auto flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-[#E0AE3B] flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm font-medium leading-relaxed">
            <strong className="font-semibold text-amber-950 font-['Montserrat']">Aviso importante: </strong>
            Orienta IA · Solución desarrollada para la Superintendencia de Servicios de Salud. Versión de demostración: complementa los canales oficiales, no toma reclamos ni brinda asesoramiento legal.
          </p>
        </div>
      </div>

      {/* Footer Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Identity & Scope */}
          <div>
            <div className="flex items-center space-x-2 mb-2.5">
              <Building2 className="w-5 h-5 text-[#2BB5A0]" />
              <h3 className="font-bold text-white font-['Montserrat'] text-base tracking-wide">
                Orienta IA · Para la SSSalud
              </h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Herramienta inteligente de asistencia ciudadana para orientar de manera rápida sobre requisitos, canales y documentación necesaria ante la Superintendencia de Servicios de Salud.
            </p>
            <div className="mt-3 flex items-center space-x-2 text-[11px] text-gray-300">
              <span className="w-2 h-2 rounded-full bg-[#2BB5A0]" />
              <span>Español rioplatense · Versión 2.0 (oct. 2026)</span>
            </div>
          </div>

          {/* Privacy & Ethics */}
          <div>
            <div className="flex items-center space-x-2 mb-2.5">
              <ShieldAlert className="w-5 h-5 text-[#2BB5A0]" />
              <h3 className="font-bold text-white font-['Montserrat'] text-base tracking-wide">
                Privacidad y Protección de Datos
              </h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Nunca te solicitamos ni guardamos nombre, DNI, CUIL, clave fiscal, teléfono, correo ni historias clínicas. No se guarda el texto de las conversaciones; solo se contabilizan eventos numéricos anónimos para el panel de estadísticas.
            </p>
          </div>

          {/* Official Channels Links */}
          <div>
            <h3 className="font-bold text-white font-['Montserrat'] text-base tracking-wide mb-2.5">
              Canales del Estado
            </h3>
            <ul className="space-y-1.5 text-xs text-gray-200">
              <li>
                <a
                  href={ENLACES_OFICIALES.tad}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 hover:text-[#2BB5A0] transition-colors"
                >
                  <span>Trámites a Distancia (TAD)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              </li>
              <li>
                <a
                  href={ENLACES_OFICIALES.cav}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 hover:text-[#2BB5A0] transition-colors"
                >
                  <span>Centro de Atención Virtual (CAV - SSSalud)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              </li>
              <li>
                <a
                  href={ENLACES_OFICIALES.miArgentinaTurnos}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 hover:text-[#2BB5A0] transition-colors"
                >
                  <span>Turnos SSSalud en Mi Argentina</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              </li>
              <li>
                <a
                  href={ENLACES_OFICIALES.monotributoAgentes}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 hover:text-[#2BB5A0] transition-colors"
                >
                  <span>Agentes de Salud para Monotributistas</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-700/60 text-center text-[11px] text-gray-300">
          Orienta IA · Solución desarrollada para la Superintendencia de Servicios de Salud. Base de trámites actualizada a octubre de 2026.
        </div>
      </div>
    </footer>
  );
};
