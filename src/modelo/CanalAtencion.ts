/**
 * Clase CanalAtencion (diagrama de clases).
 * Un canal oficial de la SSSalud donde se presenta o se sigue un trámite.
 */
export type TipoCanal = 'virtual' | 'presencial' | 'seguimiento';

export class CanalAtencion {
  private id: string;
  private tipo: TipoCanal;
  private descripcion: string;
  private requiereClaveFiscal: boolean;

  constructor(id: string, tipo: TipoCanal, descripcion: string, requiereClaveFiscal: boolean) {
    this.id = id;
    this.tipo = tipo;
    this.descripcion = descripcion;
    this.requiereClaveFiscal = requiereClaveFiscal;
  }

  /** Crea el canal a partir del texto de tramites.json. Detecta si menciona Clave Fiscal o TAD. */
  static desdeTexto(id: string, tipo: TipoCanal, descripcion: string): CanalAtencion {
    const pideClave = /clave fiscal|\bTAD\b|tr[aá]mites a distancia|mi sssalud/i.test(descripcion);
    return new CanalAtencion(id, tipo, descripcion, pideClave);
  }

  /** Texto con las instrucciones para la persona. */
  obtenerInstrucciones(): string {
    const prefijo = this.tipo === 'virtual' ? 'Virtual' : this.tipo === 'presencial' ? 'Presencial' : 'Seguimiento';
    const clave = this.requiereClaveFiscal ? ' (necesitás Clave Fiscal o Mi Argentina)' : '';
    return `${prefijo}: ${this.descripcion}${clave}`;
  }

  /** Código de trámite TAD si lo tiene (por ejemplo "2723"), o null. */
  obtenerCodigoTad(): string | null {
    const m = this.descripcion.match(/tr[aá]mite\s*(\d{3,5})/i);
    return m ? m[1] : null;
  }

  getId(): string {
    return this.id;
  }
  getTipo(): TipoCanal {
    return this.tipo;
  }
  getDescripcion(): string {
    return this.descripcion;
  }
  getRequiereClaveFiscal(): boolean {
    return this.requiereClaveFiscal;
  }
}
