export class ExportUtils {
    static exportCanvasToImage(canvas, fileName = 'page.png') {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
    }

    static async exportNotebookToPDF(notebook, currentCanvas, coverElement) {
        if (!window.jspdf || !window.html2canvas) {
            alert("Las bibliotecas de exportación a PDF no están cargadas.");
            return;
        }

        const { jsPDF } = window.jspdf;
        
        // El cover es más vertical, así que creamos un documento portrait (vertical) A4
        const pdf = new jsPDF('portrait', 'pt', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // 1. CAPTURAR Y AÑADIR LA PORTADA (Página 1)
        // Guardamos el estado original del elemento para restaurarlo
        const originalTransform = coverElement.style.transform;
        const originalBoxShadow = coverElement.style.boxShadow;
        
        // Removemos efectos 3D temporales para la captura 2D
        coverElement.style.transform = 'none';
        coverElement.style.boxShadow = 'none';

        try {
            const coverCanvas = await window.html2canvas(coverElement, {
                scale: 2,
                backgroundColor: null,
                useCORS: true
            });
            
            const coverImgData = coverCanvas.toDataURL('image/jpeg', 0.95);
            
            // Centrar portada en la página A4
            const coverRatio = coverCanvas.width / coverCanvas.height;
            const targetRatio = pdfWidth / pdfHeight;
            let finalW = pdfWidth;
            let finalH = pdfHeight;
            
            if (coverRatio > targetRatio) {
                finalH = pdfWidth / coverRatio;
            } else {
                finalW = pdfHeight * coverRatio;
            }
            
            // Agregar un poco de margen a la portada
            const margin = 40;
            finalW -= margin * 2;
            finalH = finalW / coverRatio;
            const xOff = (pdfWidth - finalW) / 2;
            const yOff = (pdfHeight - finalH) / 2;
            
            pdf.addImage(coverImgData, 'JPEG', xOff, yOff, finalW, finalH);
            
        } catch (e) {
            console.error("Error capturando portada", e);
        } finally {
            // Restaurar estilos
            coverElement.style.transform = originalTransform;
            coverElement.style.boxShadow = originalBoxShadow;
        }

        // 2. CAPTURAR Y AÑADIR LA HOJA DIBUJADA (Página 2)
        pdf.addPage('a4', 'landscape'); // La hoja interna suele ser apaisada en el visor
        
        const landWidth = pdf.internal.pageSize.getWidth();
        const landHeight = pdf.internal.pageSize.getHeight();

        const pageContentElement = document.getElementById('pageContent');
        
        try {
            const pageCanvas = await window.html2canvas(pageContentElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                onclone: function(clonedDoc) {
                    // Asegurar que la vista abierta sea visible en el clon para poder capturarla
                    const clonedOpenView = clonedDoc.getElementById('openView');
                    if (clonedOpenView) {
                        clonedOpenView.classList.remove('hidden');
                        clonedOpenView.style.display = 'block';
                    }
                }
            });

            const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
            
            const canvasRatio = pageCanvas.width / pageCanvas.height;
            const landRatio = landWidth / landHeight;
            
            let cFinalW = landWidth;
            let cFinalH = landHeight;
            
            if (canvasRatio > landRatio) {
                cFinalH = landWidth / canvasRatio;
            } else {
                cFinalW = landHeight * canvasRatio;
            }
            
            const cXOff = (landWidth - cFinalW) / 2;
            const cYOff = (landHeight - cFinalH) / 2;

            pdf.addImage(pageImgData, 'JPEG', cXOff, cYOff, cFinalW, cFinalH);
        } catch(e) {
            console.error("Error capturando la hoja:", e);
        }
        
        // Guardar el archivo final
        pdf.save(`${notebook.name || 'Libreta'}.pdf`);
    }
}
