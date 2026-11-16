/**
 * Clase Ciudadano (diagrama de clases).
 * La persona que usa el asistente. Es ANÓNIMA: no inicia sesión ni da nombre,
 * DNI o mail. Se la identifica solo con un idSesion aleatorio que vive en su
 * navegador mientras la pestaña está abierta.
 *
 * Relación del diagrama:  Ciudadano 1 ---> 0..* Consulta  ("realiza")
 */
import { Consulta } from './Consulta';
import { Checklist } from './Checklist';
import type { CondicionLaboral } from '../data/db/types';

function obtenerIdSesion(): string {
  const CLAVE = 'orienta_id_sesion';
  try {
    const guardado = sessionStorage.getItem(CLAVE);
    if (guardado) return guardado;
  } catch {
    // Sin acceso al almacenamiento: se genera uno nuevo.
  }
  const nuevo =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  try {
    sessionStorage.setItem(CLAVE, nuevo);
  } catch {
    // ignorar
  }
  return nuevo;
}

export class Ciudadano {
  private idSesion: string;
  private condicionLaboral: CondicionLaboral | null;
  private poseeCUD: boolean;
  private consultaActual: Consulta | null;

  constructor() {
    this.idSesion = obtenerIdSesion();
    this.condicionLaboral = null;
    this.poseeCUD = false;
    this.consultaActual = null;
  }

  /**
   * Registra un mensaje de la persona. Si no hay una consulta en curso
   * (o la anterior ya terminó), empieza una nueva.
   */
  ingresarConsulta(texto: string): Consulta {
    if (!this.consultaActual || this.consultaActual.estaTerminada()) {
      this.consultaActual = new Consulta(this.idSesion);
    }
    this.consultaActual.agregarMensaje(texto);
    return this.consultaActual;
  }

  /** Empieza una consulta nueva desde cero (botón "reiniciar"). */
  nuevaConsulta(): Consulta {
    this.consultaActual = new Consulta(this.idSesion);
    return this.consultaActual;
  }

  obtenerConsultaActual(): Consulta {
    return this.consultaActual ?? this.nuevaConsulta();
  }

  /** Actualiza los datos del caso a partir de lo que detectó el asistente. */
  actualizarDatos(consulta: Consulta): void {
    const estado = consulta.getEstado();
    if (estado.condicion) this.condicionLaboral = estado.condicion;
    if (estado.beneficiario === 'persona_cud' || estado.tramiteId === 'discapacidad') this.poseeCUD = true;
  }

  /** Imprime o guarda en PDF el checklist. */
  descargarChecklist(checklist: Checklist): void {
    checklist.exportarPDF();
  }

  getIdSesion(): string {
    return this.idSesion;
  }
  getCondicionLaboral(): CondicionLaboral | null {
    return this.condicionLaboral;
  }
  getPoseeCUD(): boolean {
    return this.poseeCUD;
  }
}
