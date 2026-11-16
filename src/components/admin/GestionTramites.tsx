import React, { useMemo, useState } from 'react';
import { Plus, Save, Trash2, Download, RotateCcw, Info, CheckCircle2, BookOpen } from 'lucide-react';
import { Tramite, CondicionLaboral } from '../../data/db/types';
import {
  TRAMITES_DATA,
  CONDICION_LABELS,
  saveTramitesOverride,
  resetTramitesOverride,
  exportTramitesJson,
  hasAdminOverride
} from '../../data/db/tramitesData';

const TIPOS = [
  { value: 'denuncia', label: 'Denuncia' },
  { value: 'tramite', label: 'Trámite' },
  { value: 'tramite_online', label: 'Trámite online' },
  { value: 'reclamo_especial', label: 'Reclamo especial' }
];

const DATOS_PREGUNTABLES = [
  { value: 'tipo_entidad', label: 'Tipo de cobertura (obra social / prepaga)' },
  { value: 'situacion', label: 'Condición laboral' },
  { value: 'grupo_familiar', label: 'Beneficiario (titular o familiar)' }
];

const CONDICIONES = (Object.keys(CONDICION_LABELS) as CondicionLaboral[]).filter((c) => c !== 'no_informa');

const aLineas = (lista: string[]) => lista.join('\n');
const deLineas = (texto: string) =>
  texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

function slug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
}

function tramiteVacio(): Tramite {
  return {
    id: `nuevo_tramite_${Date.now().toString().slice(-5)}`,
    nombre: 'Nuevo trámite',
    tipo: 'tramite',
    macro_categoria: '',
    en_mvp: true,
    descripcion: '',
    ejemplos_usuario: [],
    datos_a_preguntar: ['situacion'],
    requisitos: { comunes: [], por_situacion: {} },
    canal: { virtual: '', presencial: 'Con turno previo (turnos SSSalud en Mi Argentina)', seguimiento: 'CAV / TAD' },
    notas: '',
    fuente: ''
  };
}

const inputCls =
  'w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFD] px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-[#2B82C9] focus:ring-1 focus:ring-[#2B82C9]';
const labelCls = 'block text-xs font-bold text-[#0B192C] mb-1';

export const GestionTramites: React.FC = () => {
  const [lista, setLista] = useState<Tramite[]>(() => JSON.parse(JSON.stringify(TRAMITES_DATA)));
  const [seleccionado, setSeleccionado] = useState<string>(lista[0]?.id ?? '');
  const [sinGuardar, setSinGuardar] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [conEdiciones, setConEdiciones] = useState(hasAdminOverride());

  const actual = useMemo(() => lista.find((t) => t.id === seleccionado), [lista, seleccionado]);

  const avisar = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(null), 3500);
  };

  const actualizar = (cambios: Partial<Tramite>) => {
    if (!actual) return;
    setLista((prev) => prev.map((t) => (t.id === actual.id ? { ...t, ...cambios } : t)));
    setSinGuardar(true);
  };

  const cambiarId = (nuevoNombre: string) => {
    // Los trámites nuevos toman su id del nombre; los existentes conservan el id
    // porque el motor de reglas y las estadísticas lo usan.
    if (!actual) return;
    const esNuevo = actual.id.startsWith('nuevo_tramite_') || actual.id.startsWith('tr_');
    if (esNuevo && nuevoNombre.trim()) {
      let nuevoId = `tr_${slug(nuevoNombre)}`;
      if (lista.some((t) => t.id === nuevoId && t.id !== actual.id)) nuevoId += `_${Date.now().toString().slice(-3)}`;
      setLista((prev) => prev.map((t) => (t.id === actual.id ? { ...t, id: nuevoId, nombre: nuevoNombre } : t)));
      setSeleccionado(nuevoId);
      setSinGuardar(true);
    } else {
      actualizar({ nombre: nuevoNombre });
    }
  };

  const guardar = () => {
    saveTramitesOverride(lista);
    setSinGuardar(false);
    setConEdiciones(true);
    avisar('Cambios guardados en este navegador. El asistente ya usa la versión editada.');
  };

  const agregar = () => {
    const nuevo = tramiteVacio();
    setLista((prev) => [...prev, nuevo]);
    setSeleccionado(nuevo.id);
    setSinGuardar(true);
  };

  const eliminar = () => {
    if (!actual) return;
    if (!window.confirm(`¿Eliminar "${actual.nombre}"? Se quita de la lista; para que quede así tenés que guardar.`)) return;
    const resto = lista.filter((t) => t.id !== actual.id);
    setLista(resto);
    setSeleccionado(resto[0]?.id ?? '');
    setSinGuardar(true);
  };

  const descargar = () => {
    const blob = new Blob([exportTramitesJson(lista)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tramites.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const restablecer = () => {
    if (!window.confirm('¿Descartar todas las ediciones y volver a la base original (tramites.json)?')) return;
    resetTramitesOverride();
    const base = JSON.parse(JSON.stringify(TRAMITES_DATA)) as Tramite[];
    setLista(base);
    setSeleccionado(base[0]?.id ?? '');
    setSinGuardar(false);
    setConEdiciones(false);
    avisar('Se restableció la base original.');
  };

  return (
    <div className="max-w-6xl mx-auto px-2.5 sm:px-6 py-4 sm:py-6 w-full">
      <div className="bg-[#0B192C] text-white rounded-2xl p-4 sm:p-6 mb-4 border border-[#1E3553]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#2B82C9]">
              <BookOpen className="w-4 h-4" /> Base de conocimiento
            </div>
            <h2 className="text-lg sm:text-2xl font-bold mt-1">Gestión de trámites</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Creá trámites y actualizá sus requisitos y canales. El asistente arma los checklists únicamente con esta información.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2">
            <button onClick={guardar} disabled={!sinGuardar} className={`min-h-[40px] px-3 rounded-[9px] text-xs font-semibold flex items-center justify-center gap-1.5 ${sinGuardar ? 'bg-[#2B82C9] hover:bg-[#2170B0] text-white cursor-pointer' : 'bg-white/10 text-slate-400 cursor-not-allowed'}`}>
              <Save className="w-4 h-4" /> Guardar
            </button>
            <button onClick={descargar} className="min-h-[40px] px-3 rounded-[9px] text-xs font-semibold flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 cursor-pointer">
              <Download className="w-4 h-4 text-[#E5B842]" /> Descargar JSON
            </button>
            <button onClick={restablecer} className="col-span-2 sm:col-span-1 min-h-[40px] px-3 rounded-[9px] text-xs font-semibold flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 cursor-pointer">
              <RotateCcw className="w-4 h-4" /> Restablecer original
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-[12px] border border-[#CBDCEB] bg-[#EAF3FA] p-3 text-xs text-[#0B192C] leading-relaxed">
        <Info className="w-4 h-4 text-[#2B82C9] shrink-0 mt-0.5" />
        <span>
          Los cambios se guardan <strong>en este navegador</strong>. Para que los vean todos los usuarios, descargá el JSON y reemplazá el archivo <code className="font-mono">src/data/db/tramites.json</code> del proyecto.
          {conEdiciones && <strong className="block mt-1 text-[#8C650A]">Estás usando una versión editada de la base.</strong>}
        </span>
      </div>

      {mensaje && (
        <div className="mb-4 flex items-center gap-2 rounded-[12px] border border-[#9FD3B5] bg-[#ECF8F1] p-3 text-xs font-semibold text-[#1D6B40]">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {mensaje}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <aside className="bg-white rounded-2xl border border-[#E2E8F0] p-3 h-fit">
          <div className="flex items-center justify-between px-1 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">{lista.length} trámites</span>
            <button onClick={agregar} className="min-h-[34px] px-2.5 rounded-[8px] text-xs font-semibold flex items-center gap-1 bg-[#F4F8FC] hover:bg-[#EAF3FA] text-[#1C68A6] border border-[#CBDCEB] cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>
          <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
            {lista.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setSeleccionado(t.id)}
                  className={`w-full text-left px-3 py-2 rounded-[9px] text-xs sm:text-[13px] cursor-pointer transition-colors ${
                    t.id === seleccionado ? 'bg-[#0B192C] text-white font-semibold' : 'hover:bg-[#F4F8FC] text-[#0F172A]'
                  }`}
                >
                  {t.nombre}
                  <span className={`block text-[10px] font-mono ${t.id === seleccionado ? 'text-slate-300' : 'text-[#94A3B8]'}`}>{t.id}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {actual ? (
          <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nombre</label>
                <input className={inputCls} value={actual.nombre} onChange={(e) => cambiarId(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Categoría</label>
                <input className={inputCls} value={actual.macro_categoria} onChange={(e) => actualizar({ macro_categoria: e.target.value })} placeholder="Ej.: Afiliación, Cobertura, Aportes" />
              </div>
              <div>
                <label className={labelCls}>Tipo</label>
                <select className={inputCls} value={actual.tipo} onChange={(e) => actualizar({ tipo: e.target.value })}>
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Descripción</label>
              <textarea className={inputCls} rows={2} value={actual.descripcion} onChange={(e) => actualizar({ descripcion: e.target.value })} />
            </div>

            <div>
              <label className={labelCls}>Ejemplos de cómo lo cuenta la gente (uno por línea)</label>
              <textarea className={inputCls} rows={2} value={aLineas(actual.ejemplos_usuario)} onChange={(e) => actualizar({ ejemplos_usuario: deLineas(e.target.value) })} />
              <p className="text-[11px] text-[#64748B] mt-1">La IA usa estos ejemplos para reconocer el trámite cuando la persona escribe con sus palabras.</p>
            </div>

            <div>
              <span className={labelCls}>Datos que el asistente pregunta</span>
              <div className="flex flex-wrap gap-3">
                {DATOS_PREGUNTABLES.map((d) => (
                  <label key={d.value} className="flex items-center gap-1.5 text-xs text-[#0F172A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actual.datos_a_preguntar.includes(d.value)}
                      onChange={(e) =>
                        actualizar({
                          datos_a_preguntar: e.target.checked
                            ? [...actual.datos_a_preguntar, d.value]
                            : actual.datos_a_preguntar.filter((x) => x !== d.value)
                        })
                      }
                    />
                    {d.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Requisitos comunes (uno por línea)</label>
              <textarea
                className={inputCls}
                rows={6}
                value={aLineas(actual.requisitos.comunes)}
                onChange={(e) => actualizar({ requisitos: { ...actual.requisitos, comunes: deLineas(e.target.value) } })}
              />
            </div>

            <details className="rounded-[12px] border border-[#E2E8F0] p-3">
              <summary className="text-xs font-bold text-[#0B192C] cursor-pointer">Requisitos adicionales según la condición laboral</summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {CONDICIONES.map((c) => (
                  <div key={c}>
                    <label className="block text-[11px] font-semibold text-[#475569] mb-1">{CONDICION_LABELS[c]}</label>
                    <textarea
                      className={inputCls}
                      rows={2}
                      value={aLineas(actual.requisitos.por_situacion[c] ?? [])}
                      onChange={(e) => {
                        const lineas = deLineas(e.target.value);
                        const por = { ...actual.requisitos.por_situacion };
                        if (lineas.length) por[c] = lineas;
                        else delete por[c];
                        actualizar({ requisitos: { ...actual.requisitos, por_situacion: por } });
                      }}
                    />
                  </div>
                ))}
              </div>
            </details>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Canal virtual</label>
                <textarea className={inputCls} rows={2} value={actual.canal.virtual} onChange={(e) => actualizar({ canal: { ...actual.canal, virtual: e.target.value } })} />
              </div>
              <div>
                <label className={labelCls}>Canal presencial</label>
                <textarea className={inputCls} rows={2} value={actual.canal.presencial} onChange={(e) => actualizar({ canal: { ...actual.canal, presencial: e.target.value } })} />
              </div>
              <div>
                <label className={labelCls}>Seguimiento</label>
                <textarea className={inputCls} rows={2} value={actual.canal.seguimiento} onChange={(e) => actualizar({ canal: { ...actual.canal, seguimiento: e.target.value } })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Notas para el ciudadano</label>
                <textarea className={inputCls} rows={2} value={actual.notas} onChange={(e) => actualizar({ notas: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Fuente</label>
                <textarea className={inputCls} rows={2} value={actual.fuente} onChange={(e) => actualizar({ fuente: e.target.value })} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-2 pt-3 border-t border-[#E2E8F0]">
              <button onClick={eliminar} className="min-h-[40px] px-3 rounded-[9px] text-xs font-semibold flex items-center justify-center gap-1.5 text-rose-700 border border-rose-200 hover:bg-rose-50 cursor-pointer">
                <Trash2 className="w-4 h-4" /> Eliminar trámite
              </button>
              <button onClick={guardar} disabled={!sinGuardar} className={`min-h-[40px] px-4 rounded-[9px] text-xs font-semibold flex items-center justify-center gap-1.5 ${sinGuardar ? 'bg-[#2B82C9] hover:bg-[#2170B0] text-white cursor-pointer' : 'bg-[#F4F8FC] text-[#94A3B8] cursor-not-allowed'}`}>
                <Save className="w-4 h-4" /> {sinGuardar ? 'Guardar cambios' : 'Sin cambios pendientes'}
              </button>
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-sm text-[#475569]">No hay trámites. Agregá uno nuevo.</section>
        )}
      </div>
    </div>
  );
};
