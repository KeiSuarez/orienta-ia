/**
 * Clase Consulta (diagrama de clases).
 * Una conversación de un ciudadano con el asistente, desde que cuenta su
 * problema hasta que recibe el checklist o es derivado.
 *
 * Privacidad: el texto que escribe la persona queda solo en memoria mientras
 * dura la conversación (y con los datos personales enmascarados). Al servidor
 * se envía únicamente el registro anónimo de aRegistroAnonimo().
 */
import { Tramite } from './Tramite';
import type { DecisionState } from '../utils/decisionEngine';
import type { ResultadoConsulta } from '../data/db/types';
import { CONDICION_LABELS, TIPO_ENTIDAD_LABELS } from '../data/db/tramitesData';
import { sanitizeText } from '../utils/privacyGuard';

export interface RegistroAnonimo {
  tramite_detectado: string;
  resultado: ResultadoConsulta;
  condicion?: string;
  tipo_entidad?: string;
}

export class Consulta {
  private id: string;
  private idSesion: string;
  private textoLibre: string[];
  private fechaHora: Date;
  private categoriaDetectada: string | null;
  private tramite: Tramite | null;
  /** Estado de la conversación: en qué paso está y qué datos del caso ya se conocen. */
  private estado: DecisionState;

  constructor(idSesion: string) {
    this.id = `consulta-${Date.now()}`;
    this.idSesion = idSesion;
    this.textoLibre = [];
    this.fechaHora = new Date();
    this.categoriaDetectada = null;
    this.tramite = null;
    this.estado = { step: 'init' };
  }

  /** Guarda en memoria lo que escribió la persona, con los datos personales tapados. */
  agregarMensaje(texto: string): void {
    this.textoLibre.push(sanitizeText(texto));
  }

  /** Asocia la consulta con el trámite que identificó el asistente. */
  asignarTramite(tramite: Tramite): void {
    this.tramite = tramite;
    this.categoriaDetectada = tramite.getCategoria();
  }

  obtenerTramite(): Tramite | null {
    return this.tramite;
  }

  /** Actualiza el estado de la conversación y, si cambió el trámite, lo asigna. */
  actualizarEstado(nuevo: DecisionState): void {
    this.estado = nuevo;
    if (nuevo.tramiteId && nuevo.tramiteId !== this.tramite?.getId()) {
      const tramite = Tramite.buscar(nuevo.tramiteId);
      if (tramite) this.asignarTramite(tramite);
    }
  }

  getEstado(): DecisionState {
    return this.estado;
  }

  /** La consulta terminó: se entregó el checklist, se derivó o estaba fuera de alcance. */
  estaTerminada(): boolean {
    return ['complete', 'derived', 'out_of_scope'].includes(this.estado.step);
  }

  /**
   * Registro anónimo para las estadísticas: trámite, resultado y datos generales.
   * Nunca incluye el texto de la conversación.
   */
  aRegistroAnonimo(resultado: ResultadoConsulta, tramiteDetectado?: string): RegistroAnonimo {
    return {
      tramite_detectado: tramiteDetectado || this.tramite?.getId() || '(sin clasificar)',
      resultado,
      condicion: this.estado.condicion ? CONDICION_LABELS[this.estado.condicion] : undefined,
      tipo_entidad: this.estado.tipoEntidad ? TIPO_ENTIDAD_LABELS[this.estado.tipoEntidad] : undefined
    };
  }

  getId(): string {
    return this.id;
  }
  getIdSesion(): string {
    return this.idSesion;
  }
  getFechaHora(): Date {
    return this.fechaHora;
  }
  getCategoriaDetectada(): string | null {
    return this.categoriaDetectada;
  }
  getCantidadMensajes(): number {
    return this.textoLibre.length;
  }
}
