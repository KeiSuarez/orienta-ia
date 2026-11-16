/**
 * Clase Checklist (diagrama de clases).
 * La lista de documentos y pasos que recibe la persona al final de la consulta.
 *
 * Relaciones del diagrama:
 *   Consulta 1 ---> 0..1 Checklist         ("produce")
 *   Checklist  ---> 0..* Requisito         ("incluye aplicables")
 */
import { Tramite } from './Tramite';
import { Requisito } from './Requisito';
import type { CondicionLaboral, TipoEntidad, Beneficiario } from '../data/db/types';
import { CONDICION_LABELS, BENEFICIARIO_LABELS, TIPO_ENTIDAD_LABELS, ENLACES_OFICIALES } from '../data/db/tramitesData';
import type { ChecklistFinal, ChecklistItem } from '../types';
import { descargarChecklistPDF } from '../utils/pdfGenerator';

export class Checklist {
  private id: string;
  private fechaGeneracion: Date;
  private tramite: Tramite;
  private requisitos: Requisito[];
  private pasosASeguir: string[];
  private condicion: CondicionLaboral;
  private tipoEntidad: TipoEntidad;
  private beneficiario: Beneficiario;

  constructor(
    tramite: Tramite,
    condicion: CondicionLaboral,
    tipoEntidad: TipoEntidad,
    beneficiario: Beneficiario,
    pasosASeguir: string[]
  ) {
    this.id = `chk-${tramite.getId()}-${Date.now()}`;
    this.fechaGeneracion = new Date();
    this.tramite = tramite;
    this.condicion = condicion;
    this.tipoEntidad = tipoEntidad;
    this.beneficiario = beneficiario;
    // Solo se incluyen los requisitos que aplican a la condición de la persona.
    this.requisitos = tramite.obtenerRequisitos(condicion);
    this.pasosASeguir = [...pasosASeguir];
  }

  /**
   * Devuelve los datos listos para mostrar en pantalla (vista "Mi checklist").
   * Separa los documentos en comunes, médicos y según la situación laboral.
   */
  mostrar(): ChecklistFinal {
    const aItem = (r: Requisito, seccion: ChecklistItem['seccion']): ChecklistItem => ({
      id: r.getId(),
      texto: r.getNombreDocumento(),
      obligatorio: r.getEsObligatorio(),
      seccion
    });
    const comunes = this.tramite.obtenerRequisitosComunes();
    const deSituacion = this.tramite.obtenerRequisitosDeSituacion(this.condicion);
    const virtual = this.tramite.obtenerCanal('virtual');
    const presencial = this.tramite.obtenerCanal('presencial');
    const codigo = virtual?.obtenerCodigoTad() ?? null;

    return {
      id: this.id,
      fecha: this.fechaGeneracion.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      tramiteId: this.tramite.getId(),
      categoria: this.tramite.getNombre(),
      condicionLaboral: CONDICION_LABELS[this.condicion] ?? 'No informa',
      destinatario: BENEFICIARIO_LABELS[this.beneficiario] ?? 'Titular',
      tipoEntidad: TIPO_ENTIDAD_LABELS[this.tipoEntidad] ?? 'No informa',
      docGeneral: comunes.filter((r) => !r.esDocumentoMedico()).map((r) => aItem(r, 'general')),
      docMedica: comunes.filter((r) => r.esDocumentoMedico()).map((r) => aItem(r, 'medica')),
      docLaboral: deSituacion.map((r) => aItem(r, 'laboral')),
      canalPresentacion: {
        nombre: virtual?.getDescripcion() ?? '',
        tadCodigo: codigo ? `TAD ${codigo}` : undefined,
        tadUrl: codigo ? ENLACES_OFICIALES.tad : undefined,
        presencialDireccion: presencial?.getDescripcion() ?? '',
        presencialHorario: '',
        turnosUrl: ENLACES_OFICIALES.miArgentinaTurnos,
        instruccionesTad: [...this.pasosASeguir]
      },
      criteriosAplicables: this.tramite.getNotas() ? [this.tramite.getNotas()] : [],
      fuente: this.tramite.getFuente()
    };
  }

  /** Genera y descarga el archivo PDF auténtico del checklist. */
  exportarPDF(): void {
    try {
      descargarChecklistPDF(this.mostrar());
    } catch (e) {
      console.warn('Error al exportar PDF:', e);
      if (typeof window !== 'undefined' && window.print) {
        try {
          window.print();
        } catch {
          // ignore
        }
      }
    }
  }

  getId(): string {
    return this.id;
  }
  getRequisitos(): Requisito[] {
    return [...this.requisitos];
  }
  getPasosASeguir(): string[] {
    return [...this.pasosASeguir];
  }
  getTramite(): Tramite {
    return this.tramite;
  }
}
