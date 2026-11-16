/**
 * Clase Tramite (diagrama de clases).
 * Un trámite ante la SSSalud. Se construye a partir de la base de conocimiento
 * (src/data/db/tramites.json) y agrupa sus Requisitos y CanalesAtencion.
 *
 * Relaciones del diagrama:
 *   Tramite 1 ---> 1..* Requisito      ("requiere")
 *   Tramite 1 ---> 1..* CanalAtencion  ("se realiza por")
 */
import { Requisito } from './Requisito';
import { CanalAtencion } from './CanalAtencion';
import type { Tramite as DatosTramite, CondicionLaboral } from '../data/db/types';
import { CONDICION_LABELS, getTramiteById } from '../data/db/tramitesData';

export class Tramite {
  private id: string;
  private nombre: string;
  private descripcion: string;
  /** Tipo de trámite: denuncia, trámite, trámite online o reclamo especial. */
  private modalidad: string;
  private categoria: string;
  /** Datos que el asistente tiene que preguntar (tipo_entidad, situacion, grupo_familiar). */
  private datosAPreguntar: string[];
  private requisitosComunes: Requisito[];
  private requisitosPorSituacion: Map<CondicionLaboral, Requisito[]>;
  private canales: CanalAtencion[];
  private notas: string;
  private fuente: string;

  private constructor(datos: DatosTramite) {
    this.id = datos.id;
    this.nombre = datos.nombre;
    this.descripcion = datos.descripcion;
    this.modalidad = datos.tipo;
    this.categoria = datos.macro_categoria;
    this.datosAPreguntar = [...datos.datos_a_preguntar];
    this.notas = datos.notas;
    this.fuente = datos.fuente;

    this.requisitosComunes = datos.requisitos.comunes.map((texto, i) =>
      Requisito.desdeTexto(`${datos.id}-com-${i}`, texto, 'Todos los casos')
    );

    this.requisitosPorSituacion = new Map();
    for (const [condicion, textos] of Object.entries(datos.requisitos.por_situacion || {})) {
      const cond = condicion as CondicionLaboral;
      this.requisitosPorSituacion.set(
        cond,
        textos.map((texto, i) => Requisito.desdeTexto(`${datos.id}-${cond}-${i}`, texto, CONDICION_LABELS[cond] ?? cond))
      );
    }

    this.canales = [
      CanalAtencion.desdeTexto(`${datos.id}-virtual`, 'virtual', datos.canal.virtual),
      CanalAtencion.desdeTexto(`${datos.id}-presencial`, 'presencial', datos.canal.presencial),
      CanalAtencion.desdeTexto(`${datos.id}-seguimiento`, 'seguimiento', datos.canal.seguimiento)
    ].filter((c) => c.getDescripcion().trim() !== '');
  }

  /** Crea un Tramite a partir de un registro de tramites.json. */
  static desdeDatos(datos: DatosTramite): Tramite {
    return new Tramite(datos);
  }

  /** Busca un trámite en la base de conocimiento por su id. */
  static buscar(id: string): Tramite | null {
    const datos = getTramiteById(id);
    return datos ? new Tramite(datos) : null;
  }

  /** Resumen legible del trámite. */
  obtenerInformacion(): string {
    return `${this.nombre}: ${this.descripcion}`;
  }

  /**
   * Requisitos que aplican a una persona según su condición laboral:
   * los comunes más los específicos de su situación.
   */
  obtenerRequisitos(condicion?: CondicionLaboral | null): Requisito[] {
    const especificos = condicion ? this.requisitosPorSituacion.get(condicion) ?? [] : [];
    return [...this.requisitosComunes, ...especificos];
  }

  obtenerRequisitosComunes(): Requisito[] {
    return [...this.requisitosComunes];
  }

  obtenerRequisitosDeSituacion(condicion?: CondicionLaboral | null): Requisito[] {
    return condicion ? [...(this.requisitosPorSituacion.get(condicion) ?? [])] : [];
  }

  obtenerCanales(): CanalAtencion[] {
    return [...this.canales];
  }

  obtenerCanal(tipo: 'virtual' | 'presencial' | 'seguimiento'): CanalAtencion | undefined {
    return this.canales.find((c) => c.getTipo() === tipo);
  }

  /** Indica si el asistente tiene que preguntar un dato (tipo_entidad, situacion, grupo_familiar). */
  requiereDato(dato: string): boolean {
    return this.datosAPreguntar.includes(dato);
  }

  getId(): string {
    return this.id;
  }
  getNombre(): string {
    return this.nombre;
  }
  getDescripcion(): string {
    return this.descripcion;
  }
  getModalidad(): string {
    return this.modalidad;
  }
  getCategoria(): string {
    return this.categoria;
  }
  getNotas(): string {
    return this.notas;
  }
  getFuente(): string {
    return this.fuente;
  }
}
