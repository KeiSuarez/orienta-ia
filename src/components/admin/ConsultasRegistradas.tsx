import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, Database, ShieldCheck, AlertTriangle } from 'lucide-react';
import { EventoConsulta } from '../../data/db/types';
import { getSessionConsultas } from '../../data/db/simulatedData';
import { getTramiteById } from '../../data/db/tramitesData';
import { Administrador, SesionVencidaError } from '../../modelo';

interface Props {
  administrador: Administrador;
  onSesionVencida: () => void;
}

function descargarArchivo(contenido: string, nombre: string) {
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Consultas reales registradas por el asistente (anónimas: sin texto ni datos personales).
 * Se guardan en el servidor y el administrador puede descargarlas en CSV.
 */
export const ConsultasRegistradas: React.FC<Props> = ({ administrador, onSesionVencida }) => {
  const [eventos, setEventos] = useState<EventoConsulta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      setEventos(await administrador.obtenerConsultas());
    } catch (err) {
      if (err instanceof SesionVencidaError) {
        onSesionVencida();
        return;
      }
      setError('No se pudieron leer las consultas del servidor. Se muestran las registradas en este navegador.');
      setEventos(getSessionConsultas());
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recientes = [...eventos].reverse().slice(0, 50);
  const hoy = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-6xl mx-auto px-2.5 sm:px-6 py-4 sm:py-6 w-full">
      <div className="bg-[#0B192C] text-white rounded-2xl p-4 sm:p-6 mb-4 border border-[#1E3553]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#2B82C9]">
              <Database className="w-4 h-4" /> Registro anónimo
            </div>
            <h2 className="text-lg sm:text-2xl font-bold mt-1">Consultas registradas</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Cada consulta guarda solo el trámite detectado, el resultado y datos generales. Nunca se guarda lo que escribió la persona.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2">
            <button onClick={cargar} className="min-h-[40px] px-3 rounded-[9px] text-xs font-semibold flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 cursor-pointer">
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} /> Actualizar
            </button>
            <button
              onClick={() => descargarArchivo(administrador.exportarConsultas(eventos), `consultas_orienta_ia_${hoy}.csv`)}
              disabled={eventos.length === 0}
              className={`min-h-[40px] px-3 rounded-[9px] text-xs font-semibold flex items-center justify-center gap-1.5 ${eventos.length ? 'bg-[#2B82C9] hover:bg-[#2170B0] text-white cursor-pointer' : 'bg-white/10 text-slate-400 cursor-not-allowed'}`}
            >
              <Download className="w-4 h-4" /> Descargar CSV
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-[12px] border border-[#F4D381] bg-[#FEF8E7] p-3 text-xs text-[#8C650A]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="mb-4 flex items-start gap-2 rounded-[12px] border border-[#CBDCEB] bg-[#EAF3FA] p-3 text-xs text-[#0B192C]">
        <ShieldCheck className="w-4 h-4 text-[#2B82C9] shrink-0 mt-0.5" />
        <span>
          Total registrado: <strong>{eventos.length}</strong> consultas. Las estadísticas con las 2.000 consultas simuladas están en el <strong>Panel del organismo</strong>.
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#F4F8FC] text-[#475569]">
            <tr>
              {['Fecha', 'Trámite', 'Resultado', 'Condición', 'Cobertura'].map((h) => (
                <th key={h} className="text-left font-bold px-3 py-2.5 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recientes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[#64748B]">
                  {cargando ? 'Cargando…' : 'Todavía no hay consultas registradas. Hacé una consulta en el asistente para probar.'}
                </td>
              </tr>
            ) : (
              recientes.map((e, i) => (
                <tr key={i} className="border-t border-[#EDF2F7]">
                  <td className="px-3 py-2 whitespace-nowrap">{e.fecha}</td>
                  <td className="px-3 py-2">{getTramiteById(e.tramite_detectado)?.nombre ?? e.tramite_detectado}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{e.resultado}</td>
                  <td className="px-3 py-2">{e.condicion}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{e.tipo_entidad}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {eventos.length > 50 && <p className="px-3 py-2 text-[11px] text-[#64748B]">Se muestran las 50 más recientes. El CSV incluye todas.</p>}
      </div>
    </div>
  );
};
