/**
 * Clase Requisito (diagrama de clases).
 * Un documento que hay que presentar para un trámite.
 */
export class Requisito {
  private id: string;
  private nombreDocumento: string;
  private esObligatorio: boolean;
  /** "Todos los casos" o la condición laboral a la que aplica (por ejemplo "Monotributo"). */
  private condicionAplicable: string;

  constructor(id: string, nombreDocumento: string, esObligatorio: boolean, condicionAplicable: string) {
    this.id = id;
    this.nombreDocumento = nombreDocumento;
    this.esObligatorio = esObligatorio;
    this.condicionAplicable = condicionAplicable;
  }

  /**
   * Crea un requisito a partir del texto guardado en tramites.json.
   * Si el texto dice "si corresponde", "cuando corresponda", etc., se marca como no obligatorio.
   */
  static desdeTexto(id: string, texto: string, condicionAplicable: string): Requisito {
    const opcional = /si corresponde|cuando corresponda|si interviene|si la hubiera|si lo hubiera|si la hubiere|si lo hubiere|opcional|si se trata/i;
    return new Requisito(id, texto, !opcional.test(texto), condicionAplicable);
  }

  /** Cambia el texto del documento (lo usa el administrador al editar un trámite). */
  modificarDetalle(nuevoNombre: string): void {
    this.nombreDocumento = nuevoNombre.trim();
  }

  getId(): string {
    return this.id;
  }
  getNombreDocumento(): string {
    return this.nombreDocumento;
  }
  getEsObligatorio(): boolean {
    return this.esObligatorio;
  }
  getCondicionAplicable(): string {
    return this.condicionAplicable;
  }

  /** Indica si el documento es médico (receta, historia clínica, CUD...). */
  esDocumentoMedico(): boolean {
    return /(m[eé]dic|historia cl[ií]nica|prescripci|receta|diagn[oó]stic|cud|discapacidad)/i.test(this.nombreDocumento);
  }
}
