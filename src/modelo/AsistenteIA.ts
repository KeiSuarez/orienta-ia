/**
 * Clase AsistenteIA (diagrama de clases).
 * Interpreta lo que escribe la persona, identifica el trámite, pregunta los
 * datos que faltan y genera el checklist.
 *
 * Cómo "interpreta": con un motor de reglas (palabras clave + preguntas guiadas)
 * sobre la base de conocimiento de trámites. No usa un modelo de lenguaje para
 * esta parte, así las respuestas son predecibles y nunca inventa requisitos.
 * La lógica de reglas está en services/orientaEngine.ts y utils/decisionEngine.ts.
 *
 * Relaciones del diagrama:
 *   AsistenteIA ..> Consulta   ("procesa")
 *   AsistenteIA ..> Tramite    ("consulta")
 *   AsistenteIA ..> Checklist  ("genera")
 */
import { Consulta } from './Consulta';
import { Checklist } from './Checklist';
import { Tramite } from './Tramite';
import { procesarMensaje, resultadoDesdeDatos, ResultadoMotor } from '../services/orientaEngine';

export interface RespuestaAsistente extends ResultadoMotor {
  /** Checklist generado en este paso, si la consulta se completó. */
  checklist?: Checklist;
  /** Datos que todavía faltan para poder armar el checklist. */
  faltantes: string[];
}

export class AsistenteIA {
  private version: string;
  private baseDeConocimiento: string;

  constructor() {
    this.version = 'Motor de reglas 1.0';
    this.baseDeConocimiento = 'src/data/db/tramites.json';
  }

  /**
   * Procesa un mensaje de la persona dentro de su consulta:
   * detecta datos personales, identifica el trámite, pregunta lo que falta
   * y, cuando tiene todo, genera el checklist.
   */
  async interpretarConsulta(consulta: Consulta, texto: string): Promise<RespuestaAsistente> {
    const respuesta = await procesarMensaje(texto, consulta.getEstado());
    consulta.actualizarEstado(respuesta.nextState);

    return {
      ...respuesta,
      checklist: respuesta.tramiteResult ? this.generarChecklist(consulta, respuesta.tramiteResult.pasos) : undefined,
      faltantes: this.identificarFaltantes(consulta)
    };
  }

  /** Lista los datos que el trámite necesita y la persona todavía no dio. */
  identificarFaltantes(consulta: Consulta): string[] {
    const tramite = consulta.obtenerTramite();
    if (!tramite) return ['Trámite'];
    const estado = consulta.getEstado();
    const faltan: string[] = [];
    if (tramite.requiereDato('tipo_entidad') && !estado.tipoEntidad) faltan.push('Tipo de cobertura');
    if (tramite.requiereDato('situacion') && !estado.condicion) faltan.push('Condición laboral');
    if (tramite.requiereDato('grupo_familiar') && !estado.beneficiario) faltan.push('Beneficiario');
    return faltan;
  }

  /**
   * Arma el checklist con los requisitos del trámite que aplican a la condición
   * de la persona. Los datos que no se preguntaron toman un valor por defecto.
   */
  generarChecklist(consulta: Consulta, pasos?: string[]): Checklist | undefined {
    const tramite: Tramite | null = consulta.obtenerTramite();
    if (!tramite) return undefined;
    const estado = consulta.getEstado();
    const pasosASeguir = pasos ?? resultadoDesdeDatos(estado).tramiteResult?.pasos ?? [];
    return new Checklist(
      tramite,
      estado.condicion ?? 'relacion_dependencia',
      estado.tipoEntidad ?? 'obra_social',
      estado.beneficiario ?? 'titular',
      pasosASeguir
    );
  }

  getVersion(): string {
    return this.version;
  }
  getBaseDeConocimiento(): string {
    return this.baseDeConocimiento;
  }
}
