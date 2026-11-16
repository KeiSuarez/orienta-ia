/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Users,
  CheckCircle,
  HelpCircle,
  Building,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  Lock
} from 'lucide-react';
import {
  EventoConsulta,
  ResultadoConsulta
} from '../../data/db/types';
import {
  loadAllConsultas,
  computeDashboardMetrics,
  exportAggregatedDashboardCsv,
  TableroFiltros,
  K_MINIMO
} from '../../data/db/simulatedData';
import { TRAMITES_DATA } from '../../data/db/tramitesData';

export const PanelOrganismo: React.FC = () => {
  const [allEvents, setAllEvents] = useState<EventoConsulta[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filters, setFilters] = useState<TableroFiltros>({
    mes: 'Todos',
    provincia: 'Todas',
    tipoEntidad: 'Todos',
    tramite: 'Todos'
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await loadAllConsultas();
      setAllEvents(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Compute metrics with K-Anonymity (k=10)
  const metricas = useMemo(() => {
    return computeDashboardMetrics(allEvents, filters);
  }, [allEvents, filters]);

  // Months available
  const availableMonths = useMemo(() => {
    const setM = new Set<string>();
    allEvents.forEach((e) => {
      if (e.mes) setM.add(e.mes);
    });
    return Array.from(setM).sort();
  }, [allEvents]);

  // Provinces available
  const availableProvincias = useMemo(() => {
    const setP = new Set<string>();
    allEvents.forEach((e) => {
      if (e.provincia) setP.add(e.provincia);
    });
    return Array.from(setP).sort();
  }, [allEvents]);

  const handleExportCsv = () => {
    const csvContent = exportAggregatedDashboardCsv(metricas);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tablero_agregado_orienta_ia_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setFilters({
      mes: 'Todos',
      provincia: 'Todas',
      tipoEntidad: 'Todos',
      tramite: 'Todos'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans">
      {/* 4.2 Mandatory Fixed Header Notice */}
      <div className="bg-[#0B192C] text-white rounded-2xl p-4 sm:p-5 mb-6 shadow-sm border border-[#2B82C9]/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-[#2B82C9] text-[#0B192C] text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Panel de Monitoreo
              </span>
              <span className="text-gray-300 text-xs">Para SSSalud y Agentes del Seguro</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Montserrat'] mt-1 text-white">
              Datos simulados · anónimos y agregados · entidades con nombres ficticios
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-3xl leading-relaxed">
              Monitoreo analítico basado en 2.000 consultas simuladas de referencia más los eventos numéricos anónimos registrados en esta sesión de navegación.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 bg-[#2B82C9] hover:bg-[#25a18e] text-[#0B192C] text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Descargar tablero (Excel/CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4.3 Privacy Rules Banner (k-anonymity) */}
      <div className="bg-[#FFF4DC] border-l-4 border-[#E5B842] rounded-r-xl p-3.5 mb-6 text-xs text-[#0B192C] flex items-start space-x-2.5">
        <Lock className="w-4 h-4 text-[#E5B842] flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-amber-950 font-['Montserrat']">
            Regla de privacidad estricta (k-anonymity, k = {K_MINIMO}):
          </strong>{' '}
          Cualquier grupo o cruce con menos de {K_MINIMO} consultas se oculta visualmente como <strong>"—"</strong> y se suprime al exportar.
          No se muestran ni exportan eventos individuales sueltos ni textos de conversación. Las obras sociales y prepagas se identifican como "Obra social A... F" y "Prepaga A... D" con nombres ficticios.
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mb-6">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#0B192C] uppercase tracking-wider font-['Montserrat']">
            <Filter className="w-4 h-4 text-[#2B82C9]" />
            <span>Filtros analíticos</span>
          </div>
          {(filters.mes !== 'Todos' || filters.provincia !== 'Todas' || filters.tipoEntidad !== 'Todos' || filters.tramite !== 'Todos') && (
            <button
              onClick={resetFilters}
              className="text-xs text-[#2B82C9] hover:text-[#0B192C] font-semibold flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Mes */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1 font-['Montserrat']">
              Mes de consulta:
            </label>
            <select
              value={filters.mes}
              onChange={(e) => setFilters({ ...filters, mes: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-[#2B82C9]"
            >
              <option value="Todos">Todos los meses (mayo - oct 2026)</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Provincia */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1 font-['Montserrat']">
              Provincia:
            </label>
            <select
              value={filters.provincia}
              onChange={(e) => setFilters({ ...filters, provincia: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-[#2B82C9]"
            >
              <option value="Todas">Todas las provincias</option>
              {availableProvincias.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de entidad */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1 font-['Montserrat']">
              Tipo de entidad:
            </label>
            <select
              value={filters.tipoEntidad}
              onChange={(e) => setFilters({ ...filters, tipoEntidad: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-[#2B82C9]"
            >
              <option value="Todos">Todas las entidades</option>
              <option value="Obra social">Obra social</option>
              <option value="Prepaga">Prepaga</option>
              <option value="No informa">No informa</option>
            </select>
          </div>

          {/* Trámite */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1 font-['Montserrat']">
              Trámite específico:
            </label>
            <select
              value={filters.tramite}
              onChange={(e) => setFilters({ ...filters, tramite: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-[#2B82C9]"
            >
              <option value="Todos">Todos los trámites</option>
              {TRAMITES_DATA.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
              <option value="(sin clasificar)">Sin clasificar / Fuera de alcance</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4.2 Indicadores KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <span className="text-gray-500 text-xs font-medium block mb-1">Total de consultas analizadas</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] font-['Montserrat']">
            {metricas.totalConsultas.toLocaleString('es-AR')}
          </div>
          <span className="text-[11px] text-[#2B82C9] font-semibold mt-1 block">
            {allEvents.length - 2000 > 0 ? `+${allEvents.length - 2000} nuevas en esta sesión` : '2.000 simuladas'}
          </span>
        </div>

        {/* Respondidas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <span className="text-gray-500 text-xs font-medium block mb-1">% Respondidas con trámite</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-['Montserrat']">
            {metricas.respondidasPct}%
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">
            {metricas.respondidasCount.toLocaleString('es-AR')} consultas orientadas
          </span>
        </div>

        {/* Derivadas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <span className="text-gray-500 text-xs font-medium block mb-1">% Derivadas al canal oficial</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#E5B842] font-['Montserrat']">
            {metricas.derivadasPct}%
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">
            {metricas.derivadasCount.toLocaleString('es-AR')} al Centro de Atención Virtual
          </span>
        </div>

        {/* Fuera de alcance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <span className="text-gray-500 text-xs font-medium block mb-1">% Aclaró su alcance</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-500 font-['Montserrat']">
            {metricas.fueraAlcancePct}%
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">
            {metricas.fueraAlcanceCount.toLocaleString('es-AR')} temas ajenos a salud
          </span>
        </div>
      </div>

      {/* Main Charts & Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* 1. Trámites con más consultas */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-[#0B192C] font-['Montserrat'] text-sm sm:text-base flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#2B82C9]" />
              <span>Trámites con más consultas registradas</span>
            </h3>
            <span className="text-[10px] bg-slate-100 text-gray-500 px-2 py-0.5 rounded font-mono">
              k ≥ {K_MINIMO}
            </span>
          </div>

          <div className="space-y-2.5">
            {metricas.tramitesRanking.map((t) => {
              const maxVal = metricas.tramitesRanking[0]?.count || 1;
              const widthPct = t.count !== null ? Math.round((t.count / maxVal) * 100) : 0;

              return (
                <div key={t.id} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-800 line-clamp-1 max-w-[70%]">
                      {t.nombre}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        t.count === null ? 'text-gray-400 italic' : 'text-[#0B192C]'
                      }`}
                    >
                      {t.display}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#0B192C] to-[#2B82C9] h-full rounded-full transition-all"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Quién consulta (Condición laboral) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-[#0B192C] font-['Montserrat'] text-sm sm:text-base flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#2B82C9]" />
              <span>Quién consulta (Condición laboral)</span>
            </h3>
            <span className="text-[10px] bg-slate-100 text-gray-500 px-2 py-0.5 rounded font-mono">
              k ≥ {K_MINIMO}
            </span>
          </div>

          <div className="space-y-3">
            {metricas.condicionDistribucion.map((c) => (
              <div key={c.condicion} className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-800">{c.condicion}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">{c.pct}%</span>
                    <span className="font-mono font-bold text-[#0B192C]">{c.display}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#2B82C9] h-full rounded-full"
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Entidades en denuncias & Mes evolución */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* 3. Consultas por entidad para trámites de denuncia */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-[#0B192C] font-['Montserrat'] text-sm sm:text-base flex items-center space-x-2">
              <Building className="w-4 h-4 text-[#2B82C9]" />
              <span>Consultas por entidad en trámites de denuncia</span>
            </h3>
            <span className="text-[10px] bg-slate-100 text-gray-500 px-2 py-0.5 rounded font-mono">
              k ≥ {K_MINIMO}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mb-4">
            Denuncias de cobertura, negativa de afiliación, aumento por edad y discapacidad. Entidades ficticias.
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {metricas.entidadesDenuncia.map((ent) => (
              <div
                key={ent.entidad}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-[#0B192C] block">{ent.entidad}</span>
                  <span className="text-[10px] text-gray-500">{ent.tipo}</span>
                </div>
                <span
                  className={`font-mono font-bold text-sm ${
                    ent.count === null ? 'text-gray-400 italic' : 'text-[#0B192C]'
                  }`}
                >
                  {ent.display}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Consultas por mes y resultado */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-[#0B192C] font-['Montserrat'] text-sm sm:text-base flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#2B82C9]" />
              <span>Consultas por mes y resultado</span>
            </h3>
            <span className="text-[10px] bg-slate-100 text-gray-500 px-2 py-0.5 rounded font-mono">
              k ≥ {K_MINIMO}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-gray-500 font-bold uppercase text-[10px]">
                  <th className="py-2">Mes</th>
                  <th className="py-2 text-center text-emerald-700">Respondida</th>
                  <th className="py-2 text-center text-amber-700">Derivada</th>
                  <th className="py-2 text-center text-slate-600">Alcance</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {metricas.mesEvolucion.map((row) => (
                  <tr key={row.mes} className="hover:bg-slate-50">
                    <td className="py-2 font-sans font-medium text-slate-800">{row.mes}</td>
                    <td className="py-2 text-center text-emerald-700 font-bold">
                      {row.respondidas !== null ? row.respondidas : '—'}
                    </td>
                    <td className="py-2 text-center text-amber-700 font-bold">
                      {row.derivadas !== null ? row.derivadas : '—'}
                    </td>
                    <td className="py-2 text-center text-slate-600 font-bold">
                      {row.fueraAlcance !== null ? row.fueraAlcance : '—'}
                    </td>
                    <td className="py-2 text-right font-extrabold text-[#0B192C]">
                      {row.total !== null ? row.total : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 3: Provincia y Rango de Edad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Provincia */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-[#0B192C] font-['Montserrat'] text-sm sm:text-base flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-[#2B82C9]" />
              <span>Distribución por provincia</span>
            </h3>
            <span className="text-[10px] bg-slate-100 text-gray-500 px-2 py-0.5 rounded font-mono">
              k ≥ {K_MINIMO}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {metricas.provinciaDistribucion.map((p) => (
              <div key={p.provincia} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="font-medium text-slate-800">{p.provincia}</span>
                <span className="font-mono font-bold text-[#0B192C]">{p.display}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rango de edad */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-[#0B192C] font-['Montserrat'] text-sm sm:text-base flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#2B82C9]" />
              <span>Distribución por rango de edad</span>
            </h3>
            <span className="text-[10px] bg-slate-100 text-gray-500 px-2 py-0.5 rounded font-mono">
              k ≥ {K_MINIMO}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {metricas.edadDistribucion.map((ed) => (
              <div key={ed.rango} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="font-medium text-slate-800">
                  {ed.rango === 'No informa' ? 'Sin informar' : `${ed.rango} años`}
                </span>
                <span className="font-mono font-bold text-[#0B192C]">{ed.display}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
