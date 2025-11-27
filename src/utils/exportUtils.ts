import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';

export interface AuditExportOptions {
  startDate?: string;
  endDate?: string;
  includeOnlyCritical?: boolean;
  exportedBy?: string;
}

export class ExportUtils {
  // Exportar a Excel
  static exportToExcel(data: any[], filename: string, sheetName: string = 'Data') {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  // Exportar auditoría completa a Excel sin límites
  static exportAuditToExcel(
    eventos: any[],
    filename: string = 'audit-report',
    options: AuditExportOptions = {}
  ) {
    const wb = XLSX.utils.book_new();

    const summary = this.generateAuditSummary(eventos);
    const summarySheet = XLSX.utils.json_to_sheet([summary]);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen');

    const eventosPorTipo = this.groupEventosByType(eventos);
    for (const [tipo, tipoEventos] of Object.entries(eventosPorTipo)) {
      const processedData = tipoEventos.map(e => this.flattenEventoForExcel(e));
      const ws = XLSX.utils.json_to_sheet(processedData);
      XLSX.utils.book_append_sheet(wb, ws, `${tipo.substring(0, 30)}`);
    }

    const eventosPorUsuario = this.groupEventosByUser(eventos);
    for (const [usuario, usuarioEventos] of Object.entries(eventosPorUsuario)) {
      const processedData = usuarioEventos.map(e => this.flattenEventoForExcel(e));
      const ws = XLSX.utils.json_to_sheet(processedData);
      const sheetName = `User-${usuario.substring(0, 20)}`;
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    const criticEventos = eventos.filter(e => e.severidad === 'critical' || e.severidad === 'error');
    if (criticEventos.length > 0) {
      const criticData = criticEventos.map(e => this.flattenEventoForExcel(e));
      const ws = XLSX.utils.json_to_sheet(criticData);
      XLSX.utils.book_append_sheet(wb, ws, 'Críticos');
    }

    const allEventosFlat = eventos.map(e => this.flattenEventoForExcel(e));
    const ws = XLSX.utils.json_to_sheet(allEventosFlat);
    XLSX.utils.book_append_sheet(wb, ws, 'Todos');

    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  // Exportar auditoría completa a PDF sin límites
  static async exportAuditToPDF(
    eventos: any[],
    filename: string = 'audit-report',
    options: AuditExportOptions = {}
  ) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 15;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE AUDITORÍA', pageWidth / 2, currentY, { align: 'center' });

    currentY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 15, currentY);

    if (options.exportedBy) {
      currentY += 5;
      doc.text(`Exportado por: ${options.exportedBy}`, 15, currentY);
    }

    if (options.startDate || options.endDate) {
      currentY += 5;
      const dateRange = `${options.startDate || 'Inicio'} - ${options.endDate || 'Fin'}`;
      doc.text(`Período: ${dateRange}`, 15, currentY);
    }

    currentY += 10;

    const summary = this.generateAuditSummary(eventos);
    const summaryText = [
      `Total de eventos: ${summary.total_events}`,
      `Eventos críticos: ${summary.critical_events}`,
      `Eventos de error: ${summary.error_events}`,
      `Rango de fechas: ${summary.date_range_start} a ${summary.date_range_end}`
    ];

    summaryText.forEach((text, index) => {
      doc.setFontSize(10);
      doc.text(text, 15, currentY + (index * 5));
    });

    currentY += 25;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Eventos por Tipo', 15, currentY);

    const eventosPorTipo = this.groupEventosByType(eventos);
    const typeData: any[] = [];
    for (const [tipo, tipoEventos] of Object.entries(eventosPorTipo)) {
      typeData.push([tipo, tipoEventos.length]);
    }

    currentY += 7;
    (doc as any).autoTable({
      startY: currentY,
      head: [['Tipo', 'Cantidad']],
      body: typeData,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 15, right: 15 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    if (currentY > pageHeight - 30) {
      doc.addPage();
      currentY = 15;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Listado Detallado de Eventos', 15, currentY);

    currentY += 7;

    const columns = [
      'Fecha',
      'Tipo',
      'Usuario',
      'Módulo',
      'Acción',
      'Descripción',
      'Severidad'
    ];

    const tableData = eventos.map(e => [
      new Date(e.created_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      e.tipo || '',
      e.usuario || 'Sistema',
      e.modulo || '',
      e.accion || '',
      (e.descripcion || '').substring(0, 50),
      e.severidad || 'info'
    ]);

    (doc as any).autoTable({
      startY: currentY,
      head: [columns],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 15, right: 15 },
      didDrawPage: (data: any) => {
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.getHeight();
        const pageWidth = pageSize.getWidth();

        doc.setFontSize(10);
        doc.text(
          `Página ${data.pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
    });

    doc.save(`${filename}.pdf`);
  }

  private static generateAuditSummary(eventos: any[]) {
    const criticalCount = eventos.filter(e => e.severidad === 'critical').length;
    const errorCount = eventos.filter(e => e.severidad === 'error').length;
    const dates = eventos.map(e => new Date(e.created_at));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    return {
      total_events: eventos.length,
      critical_events: criticalCount,
      error_events: errorCount,
      warning_events: eventos.filter(e => e.severidad === 'warning').length,
      info_events: eventos.filter(e => e.severidad === 'info').length,
      date_range_start: minDate.toLocaleDateString('es-ES'),
      date_range_end: maxDate.toLocaleDateString('es-ES')
    };
  }

  private static groupEventosByType(eventos: any[]) {
    return eventos.reduce((acc, evento) => {
      const tipo = evento.tipo || 'Otros';
      if (!acc[tipo]) acc[tipo] = [];
      acc[tipo].push(evento);
      return acc;
    }, {} as Record<string, any[]>);
  }

  private static groupEventosByUser(eventos: any[]) {
    return eventos.reduce((acc, evento) => {
      const usuario = evento.usuario || 'Sistema';
      if (!acc[usuario]) acc[usuario] = [];
      acc[usuario].push(evento);
      return acc;
    }, {} as Record<string, any[]>);
  }

  private static flattenEventoForExcel(evento: any) {
    return {
      'Fecha': new Date(evento.created_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      'Tipo': evento.tipo || '',
      'Usuario': evento.usuario || 'Sistema',
      'Módulo': evento.modulo || '',
      'Acción': evento.accion || '',
      'Descripción': evento.descripcion || '',
      'Severidad': evento.severidad || 'info',
      'Entidad ID': evento.entidad_id || '',
      'Entidad Tipo': evento.entidad_tipo || '',
      'Entidad Nombre': evento.entidad_nombre || '',
      'Valor Anterior': evento.valor_anterior ? JSON.stringify(evento.valor_anterior) : '',
      'Valor Nuevo': evento.valor_nuevo ? JSON.stringify(evento.valor_nuevo) : '',
      'Descripción Anterior': evento.estado_anterior_texto || '',
      'Descripción Nuevo': evento.estado_nuevo_texto || ''
    };
  }

  // Exportar a PDF
  static async exportToPDF(data: any[], columns: string[], filename: string, title: string) {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 105, 20, { align: 'center' });
    
    // Fecha actual
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 30);
    
    // Tabla
    (doc as any).autoTable({
      startY: 40,
      head: [columns],
      body: data.map(item => columns.map(col => item[col] || '')),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    
    doc.save(`${filename}.pdf`);
  }

  // Generar boleta de venta en PDF
  static async generateSalePDF(venta: any, usuario: any, detalles: any[], anticipo?: { monto: number; metodo_pago: string; fecha_anticipo: string; observaciones?: string }) {
    const doc = new jsPDF();
    
    try {
      // Encabezado de la empresa
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('HILOS ANCESTRALES', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('RUC: 10897612560', 105, 28, { align: 'center' });
      doc.text('Av. la Capitana 190 - Lurigancho Huachipa', 105, 34, { align: 'center' });
      
      // Título de boleta
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('BOLETA ELECTRÓNICA', 105, 45, { align: 'center' });
      
      // Línea separadora
      doc.line(20, 50, 190, 50);
      
      // Datos del cliente
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Cliente: ${usuario.nombre}`, 20, 60);
      doc.text(`DNI: ${usuario.dni}`, 20, 66);
      if (venta.numero_guia) {
        doc.text(`N° de Guía: ${venta.numero_guia}`, 20, 72);
      }
      doc.text(`Fecha: ${new Date(venta.fecha_venta).toLocaleDateString('es-ES')}`, 120, 60);
      doc.text(`Vendedor: ${venta.vendedor}`, 120, 66);
      
      // Tabla de productos
      const tieneDescuentoVenta = venta.descuento_total && venta.descuento_total > 0;

      const tableData = detalles.map(detalle => [
        detalle.producto?.nombre || '',
        detalle.cantidad.toString(),
        `S/ ${detalle.precio_unitario.toFixed(2)}`,
        `S/ ${detalle.subtotal.toFixed(2)}`
      ]);

      const footRows = [];
      const subtotalTotal = detalles.reduce((sum, d) => sum + d.subtotal, 0);

      footRows.push(['', '', 'SUBTOTAL:', `S/ ${subtotalTotal.toFixed(2)}`]);

      if (tieneDescuentoVenta) {
        footRows.push(['', '', 'DESCUENTO:', `- S/ ${venta.descuento_total.toFixed(2)}`]);
        const totalAPagar = subtotalTotal - venta.descuento_total;
        footRows.push(['', '', 'TOTAL A PAGAR:', `S/ ${totalAPagar.toFixed(2)}`]);
      } else {
        footRows.push(['', '', 'TOTAL A PAGAR:', `S/ ${subtotalTotal.toFixed(2)}`]);
      }

      if (anticipo && anticipo.monto > 0) {
        footRows.push(['', '', '', '']);
        footRows.push(['', '', 'ANTICIPO PAGADO:', `- S/ ${anticipo.monto.toFixed(2)}`]);
        const totalConDescuento = tieneDescuentoVenta ? (subtotalTotal - venta.descuento_total) : subtotalTotal;
        const saldoPendiente = venta.saldo_pendiente !== undefined ? venta.saldo_pendiente : (totalConDescuento - anticipo.monto);
        footRows.push(['', '', 'SALDO PENDIENTE:', `S/ ${saldoPendiente.toFixed(2)}`]);
      }

      (doc as any).autoTable({
        startY: venta.numero_guia ? 80 : 75,
        head: [['Producto', 'Cant.', 'P. Unit.', 'Subtotal']],
        body: tableData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [52, 152, 219] },
        foot: footRows,
        footStyles: { fillColor: [52, 152, 219], fontStyle: 'bold' },
      });

      let yPosition = (doc as any).lastAutoTable.finalY + 10;

      if (anticipo && anticipo.monto > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Detalles del Anticipo:', 20, yPosition);

        doc.setFont('helvetica', 'normal');
        yPosition += 6;
        doc.text(`Método de pago: ${anticipo.metodo_pago.charAt(0).toUpperCase() + anticipo.metodo_pago.slice(1)}`, 20, yPosition);
        yPosition += 5;
        doc.text(`Fecha: ${new Date(anticipo.fecha_anticipo).toLocaleDateString('es-ES')}`, 20, yPosition);

        if (anticipo.observaciones) {
          yPosition += 5;
          doc.text(`Observaciones: ${anticipo.observaciones}`, 20, yPosition);
        }

        yPosition += 10;
      }

      const totalConDescuento = tieneDescuentoVenta ? (subtotalTotal - venta.descuento_total) : subtotalTotal;
      const totalFinal = anticipo
        ? (venta.saldo_pendiente !== undefined ? venta.saldo_pendiente : (totalConDescuento - anticipo.monto))
        : totalConDescuento;
      const totalEnLetras = this.numeroALetras(totalFinal);
      
      doc.setFont('helvetica', 'bold');
      doc.text(anticipo ? 'Saldo Pendiente:' : 'Total:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(totalEnLetras, 20, yPosition + 6);
      
      // Generar código QR
      if (venta.codigo_qr) {
        const qrDataUrl = await QRCode.toDataURL(venta.codigo_qr);
        doc.addImage(qrDataUrl, 'PNG', 150, yPosition, 30, 30);
      }
      
      // Pie de página
      const footerY = yPosition + 40;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Representación impresa de la boleta de venta electrónica', 105, footerY, { align: 'center' });
      doc.text('Gracias por la Compra.', 105, footerY + 6, { align: 'center' });
      
      doc.save(`boleta-${venta.id}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
    }
  }

  // Convertir número a letras
  private static numeroALetras(num: number): string {
    const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
    
    if (num === 0) return 'CERO SOLES';
    
    const entero = Math.floor(num);
    const decimal = Math.round((num - entero) * 100);
    
    let resultado = '';
    
    if (entero >= 1000) {
      const miles = Math.floor(entero / 1000);
      resultado += this.convertirCentenas(miles) + ' MIL ';
      resultado += this.convertirCentenas(entero % 1000);
    } else {
      resultado = this.convertirCentenas(entero);
    }
    
    resultado += entero === 1 ? ' SOL' : ' SOLES';
    
    if (decimal > 0) {
      resultado += ` CON ${decimal.toString().padStart(2, '0')}/100`;
    }
    
    return resultado.trim();
  }

  private static convertirCentenas(num: number): string {
    if (num === 0) return '';
    
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
    const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    
    let resultado = '';
    
    const c = Math.floor(num / 100);
    const d = Math.floor((num % 100) / 10);
    const u = num % 10;
    
    if (c > 0) {
      if (num === 100) {
        resultado += 'CIEN';
      } else {
        resultado += centenas[c];
      }
    }
    
    if (d > 0) {
      if (d === 1 && u > 0) {
        resultado += ' ' + especiales[u];
      } else {
        resultado += ' ' + decenas[d];
        if (u > 0) {
          if (d === 2) {
            resultado += u === 1 ? 'UN' : unidades[u];
          } else {
            resultado += ' Y ' + unidades[u];
          }
        }
      }
    } else if (u > 0) {
      resultado += ' ' + unidades[u];
    }
    
    return resultado.trim();
  }

  // Generar plantilla Excel para carga masiva
  static generateProductTemplate() {
    const template = [
      {
        nombre: 'Hilo Algodón',
        color: 'Rojo',
        descripcion: 'Hilo de algodón 100%',
        estado: 'En Cono',
        precio_base: 10.50,
        precio_uni: 12.00,
        stock: 100
      },
      {
        nombre: 'Hilo Poliéster',
        color: 'Azul',
        descripcion: 'Hilo sintético resistente',
        estado: 'Sin Cono',
        precio_base: 8.75,
        precio_uni: 10.00,
        stock: 75
      }
    ];
    
    this.exportToExcel(template, 'plantilla-productos', 'Productos');
  }

  static generateUserTemplate() {
    const template = [
      {
        nombre: 'Juan Pérez',
        telefono: '987654321',
        dni: '12345678'
      },
      {
        nombre: 'María González',
        telefono: '876543210',
        dni: '87654321'
      }
    ];
    
    this.exportToExcel(template, 'plantilla-usuarios', 'Usuarios');
  }
}