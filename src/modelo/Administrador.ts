/**
 * Clase Administrador (diagrama de clases).
 * Es el ÚNICO usuario que inicia sesión. Gestiona la base de trámites y
 * descarga el registro anónimo de consultas.
 *
 * Seguridad: la contraseña nunca está en el navegador. Se valida en el
 * servidor (server.ts) contra la variable de entorno ADMIN_PASSWORD, que
 * devuelve un token de sesión temporal.
 *
 * Relaciones del diagrama:
 *   Administrador 1 ---> 0..* Tramite   ("gestiona")
 *   Administrador  ..> Consulta         ("exporta")
 */
import type { Tramite as DatosTramite, TramiteCanal, TramiteRequisitos, EventoConsulta } from '../data/db/types';
import { saveTramitesOverride } from '../data/db/tramitesData';

export class SesionVencidaError extends Error {
  constructor() {
    super('La sesión del administrador venció. Volvé a iniciar sesión.');
  }
}

const COLUMNAS_CSV: (keyof EventoConsulta)[] = [
  'fecha',
  'tramite_detectado',
  'resultado',
  'condicion',
  'tipo_entidad',
  'entidad',
  'provincia',
  'rango_edad',
  'mes'
];

export class Administrador {
  private nombre: string;
  private nivelPermiso: string;
  private token: string | null;

  constructor(token: string | null = null, nombre = 'Administrador de contenidos') {
    this.token = token;
    this.nombre = nombre;
    this.nivelPermiso = 'editor';
  }

  /** Envía la contraseña al servidor. Si es correcta, guarda el token de sesión. */
  async iniciarSesion(password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) {
        return { ok: false, error: data.error || 'Contraseña incorrecta, intentá otra vez.' };
      }
      this.token = data.token;
      this.nombre = data.nombre || this.nombre;
      return { ok: true };
    } catch {
      return { ok: false, error: 'No se pudo conectar con el servidor. Probá de nuevo en unos segundos.' };
    }
  }

  /** Comprueba con el servidor que el token siga siendo válido. */
  async verificarSesion(): Promise<boolean> {
    if (!this.token) return false;
    try {
      const res = await fetch('/api/admin/verificar', { headers: this.encabezados() });
      return res.ok;
    } catch {
      return false;
    }
  }

  async cerrarSesion(): Promise<void> {
    if (this.token) {
      await fetch('/api/admin/logout', { method: 'POST', headers: this.encabezados() }).catch(() => undefined);
    }
    this.token = null;
  }

  estaAutenticado(): boolean {
    return this.token !== null;
  }

  /** Crea un trámite nuevo vacío para completar en "Gestión de trámites". */
  crearTramite(): DatosTramite {
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

  /** Devuelve la lista con los requisitos de un trámite actualizados. */
  actualizarRequisitos(lista: DatosTramite[], tramiteId: string, requisitos: TramiteRequisitos): DatosTramite[] {
    return lista.map((t) => (t.id === tramiteId ? { ...t, requisitos } : t));
  }

  /** Devuelve la lista con los canales de un trámite actualizados. */
  actualizarCanal(lista: DatosTramite[], tramiteId: string, canal: TramiteCanal): DatosTramite[] {
    return lista.map((t) => (t.id === tramiteId ? { ...t, canal } : t));
  }

  /** Guarda la base editada (en el navegador del administrador) y la activa en el asistente. */
  guardarTramites(lista: DatosTramite[]): void {
    saveTramitesOverride(lista);
  }

  /** Trae del servidor el registro anónimo de consultas. */
  async obtenerConsultas(): Promise<EventoConsulta[]> {
    const res = await fetch('/api/admin/consultas', { headers: this.encabezados() });
    if (res.status === 401) throw new SesionVencidaError();
    if (!res.ok) throw new Error('No se pudieron leer las consultas del servidor.');
    const data = await res.json();
    return Array.isArray(data.consultas) ? data.consultas : [];
  }

  /**
   * Genera el CSV del registro anónimo, opcionalmente entre dos fechas (AAAA-MM-DD).
   * Se puede abrir con Excel.
   */
  exportarConsultas(consultas: EventoConsulta[], desde?: string, hasta?: string): string {
    const filtradas = consultas.filter((c) => (!desde || c.fecha >= desde) && (!hasta || c.fecha <= hasta));
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const filas = filtradas.map((c) => COLUMNAS_CSV.map((col) => esc(String(c[col] ?? ''))).join(','));
    return '﻿' + [COLUMNAS_CSV.join(','), ...filas].join('\n');
  }

  getNombre(): string {
    return this.nombre;
  }
  getNivelPermiso(): string {
    return this.nivelPermiso;
  }
  getToken(): string | null {
    return this.token;
  }

  private encabezados(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }
}
