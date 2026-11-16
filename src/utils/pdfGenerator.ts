import { jsPDF } from 'jspdf';
import { ChecklistFinal, ChecklistItem } from '../types';

export function descargarChecklistPDF(checklist: ChecklistFinal): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 0;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 18) {
      doc.addPage();
      currentY = 20;
      renderPageFooter();
    }
  };

  const renderPageFooter = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
      'Orienta IA · Trámites SSSalud · Proyecto académico IFTS 12 · Orientación no vinculante',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  };

  // Header Banner
  doc.setFillColor(11, 25, 44); // #0B192C
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(43, 130, 201); // #2B82C9
  doc.text('ORIENTA IA', margin, 11);

  doc.setTextColor(229, 184, 66); // #E5B842
  doc.text('• TRÁMITES ANTE LA SSSALUD', margin + 28, 11);

  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('CHECKLIST DE REQUISITOS', margin, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 220, 235);
  doc.text(`Fecha de emisión: ${checklist.fecha}`, pageWidth - margin, 20, { align: 'right' });

  currentY = 34;

  // Metadata Card
  doc.setFillColor(244, 248, 252);
  doc.setDrawColor(203, 220, 235);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TRÁMITE:', margin + 4, currentY + 6);
  doc.text('COBERTURA:', margin + 95, currentY + 6);
  doc.text('CONDICIÓN DEL TITULAR:', margin + 4, currentY + 16);
  doc.text('BENEFICIARIO:', margin + 95, currentY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(11, 25, 44);

  const tramiteTruncado = doc.splitTextToSize(checklist.categoria, 85)[0] || checklist.categoria;
  doc.text(tramiteTruncado, margin + 4, currentY + 11);
  doc.text(checklist.tipoEntidad, margin + 95, currentY + 11);
  doc.text(checklist.condicionLaboral, margin + 4, currentY + 21);
  doc.text(checklist.destinatario, margin + 95, currentY + 21);

  currentY += 30;

  // Helper to render a section
  const renderSection = (title: string, items: ChecklistItem[]) => {
    if (!items || items.length === 0) return;

    checkPageBreak(14);

    // Section title
    doc.setFillColor(234, 243, 250);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(11, 25, 44);
    doc.text(title.toUpperCase(), margin + 3, currentY + 5);

    currentY += 10;

    items.forEach((item) => {
      const textLines = doc.splitTextToSize(item.texto, contentWidth - 12);
      const detailLines = item.detalle ? doc.splitTextToSize(item.detalle, contentWidth - 12) : [];
      const itemHeight = textLines.length * 4.5 + (detailLines.length > 0 ? detailLines.length * 3.8 + 2 : 0) + 3;

      checkPageBreak(itemHeight);

      // Checkbox
      doc.setDrawColor(43, 130, 201);
      doc.setLineWidth(0.35);
      doc.roundedRect(margin + 1, currentY - 3, 3.8, 3.8, 0.8, 0.8, 'S');

      // Item text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(textLines, margin + 8, currentY);

      currentY += textLines.length * 4.5;

      // Item detail if present
      if (detailLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(detailLines, margin + 8, currentY - 0.5);
        currentY += detailLines.length * 3.8;
      }

      currentY += 2;
    });

    currentY += 3;
  };

  renderSection('Documentación común obligatoria', checklist.docGeneral);
  renderSection('Documentación médica', checklist.docMedica);
  renderSection(`Documentación según situación laboral (${checklist.condicionLaboral})`, checklist.docLaboral);

  // Pasos a seguir
  if (checklist.canalPresentacion.instruccionesTad && checklist.canalPresentacion.instruccionesTad.length > 0) {
    checkPageBreak(20);
    doc.setFillColor(254, 248, 231);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(140, 101, 10);
    doc.text('PASOS A SEGUIR PARA LA PRESENTACIÓN', margin + 3, currentY + 5);

    currentY += 10;

    checklist.canalPresentacion.instruccionesTad.forEach((paso, idx) => {
      const pasoLines = doc.splitTextToSize(`${idx + 1}. ${paso}`, contentWidth - 4);
      const pasoHeight = pasoLines.length * 4.5 + 2;

      checkPageBreak(pasoHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(pasoLines, margin + 2, currentY);

      currentY += pasoHeight;
    });

    currentY += 3;
  }

  // Canales oficiales
  checkPageBreak(25);
  doc.setFillColor(248, 250, 253);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 22, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(43, 130, 201);
  doc.text('DÓNDE SE PRESENTA:', margin + 3, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const canalVirtual = checklist.canalPresentacion.nombre || 'Trámites a Distancia (TAD)';
  const canalPresencial = checklist.canalPresentacion.presencialDireccion || 'Atención presencial SSSalud (con turno)';
  doc.text(`• Virtual: ${canalVirtual}`, margin + 3, currentY + 11);
  doc.text(`• Presencial: ${canalPresencial}`, margin + 3, currentY + 16);

  renderPageFooter();

  // Direct download to phone / computer storage (without opening share menu)
  const sanitize = checklist.categoria.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_');
  const fileName = `Checklist_SSSalud_${sanitize}.pdf`;

  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 2500);
  } catch (err) {
    console.warn('Fallback direct doc.save:', err);
    doc.save(fileName);
  }
}
