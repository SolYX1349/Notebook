export class NotebookManager {
    constructor() {
        this.notebooks = [];
        this.activeNotebookId = null;
        this.uiController = null;
        this.syncFileHandle = null;
        this.autoSaveInterval = null;

        this.loadNotebooks();
    }

    init(uiController) {
        this.uiController = uiController;
        this.uiController.renderNotebookList(this.notebooks, this.activeNotebookId);
        if (this.activeNotebookId) {
            this.uiController.updateCoverView(this.getActiveNotebook());
        }
    }

    loadNotebooks() {
        const stored = localStorage.getItem('glass_notebooks');
        if (stored) {
            this.notebooks = JSON.parse(stored);

            this.notebooks.forEach(nb => {
                if (!nb.pages || nb.pages.length === 0) {
                    nb.pages = [{
                        pageText: nb.pageText || '',
                        pageDrawing: nb.pageDrawing || null,
                        pageImages: nb.pageImages || [],
                        pageNotes: nb.pageNotes || []
                    }];
                } else {
                    nb.pages.forEach(p => {
                        if (!p.pageNotes) p.pageNotes = [];
                    });
                }
                if (nb.activePageIndex === undefined) {
                    nb.activePageIndex = 0;
                }
            });

            this.createManualNotebook();

            const oldDefault = this.notebooks.find(n => n.name === 'My Notebook' && n.isReadOnly);
            if (oldDefault) {
                oldDefault.isReadOnly = false;
                this.saveNotebooks();
            }

            this.activeNotebookId = this.notebooks.length > 0 ? this.notebooks[0].id : null;
        } else {
            this.createManualNotebook();
        }
    }

    createManualNotebook() {
        const manualPageText = `<h1>Guía de Usuario</h1>
<br>
<h2>Atajos de Teclado</h2>
<ul>
    <li><b>Ctrl + Z:</b> Deshacer último trazo</li>
    <li><b>Ctrl + V:</b> Pegar imagen desde el portapapeles</li>
</ul>
<br>
<h2>Funciones Principales</h2>
<ul>
    <li><b>Notas Adhesivas:</b> Arrastra una nota desde el panel izquierdo hacia la hoja.</li>
    <li><b>Paginación:</b> Utiliza la barra inferior para añadir o navegar entre páginas.</li>
    <li><b>Portada:</b> Personaliza colores y tipografía desde la vista exterior.</li>
</ul>
<br>
<h2>Herramientas de Edición</h2>
<ul>
    <li><b>Texto:</b> Estructura tus apuntes con títulos y alineaciones usando la barra lateral.</li>
    <li><b>Dibujo:</b> Traza libremente con el plumón. El borrador solo eliminará los trazos, sin afectar texto o imágenes.</li>
</ul>`;

        let existingManual = this.notebooks.find(n => (n.name === 'MANUAL' || n.name === 'Manual de Uso') && n.isReadOnly);

        if (existingManual) {
            let updated = false;
            if (existingManual.name !== 'MANUAL') {
                existingManual.name = 'MANUAL';
                updated = true;
            }
            if (existingManual.color !== '#0b5394') {
                existingManual.color = '#0b5394';
                updated = true;
            }
            if (existingManual.titleColor !== '#ffffff') {
                existingManual.titleColor = '#ffffff';
                updated = true;
            }
            if (existingManual.titleFont !== "'Outfit', sans-serif") {
                existingManual.titleFont = "'Outfit', sans-serif";
                updated = true;
            }
            if (existingManual.pages[0].pageText !== manualPageText) {
                existingManual.pages[0].pageText = manualPageText;
                updated = true;
            }
            if (updated) {
                this.saveNotebooks();
            }
            return existingManual;
        }

        const manual = this.createNotebook('MANUAL', '#0b5394', true);
        manual.isReadOnly = true;
        manual.titleColor = '#ffffff';
        manual.titleFont = "'Outfit', sans-serif";
        manual.pages[0].pageText = manualPageText;

        this.saveNotebooks();

        if (this.uiController) {
            this.uiController.renderNotebookList(this.notebooks, this.activeNotebookId);
            this.uiController.updateCoverView(manual);
        }

        return manual;
    }

    saveNotebooks() {
        try {
            const notebooksToSave = this.notebooks.filter(n => !n.isReadOnly);
            localStorage.setItem('glass_notebooks', JSON.stringify(notebooksToSave));
        } catch (e) {
            console.error("Error al guardar en localStorage:", e);
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                alert("¡El almacenamiento local está lleno! Por favor, elimina libretas o imágenes grandes.");
            }
        }
    }

    async exportDatabaseToPC() {
        try {
            if (!window.showDirectoryPicker) {
                alert("Tu navegador no soporta la función de guardar carpetas. Por favor, intenta usar Chrome o Edge.");
                return;
            }

            const directoryHandle = await window.showDirectoryPicker({
                id: 'vr-notebook-save',
                mode: 'readwrite',
                startIn: 'documents'
            });

            const vrFolderHandle = await directoryHandle.getDirectoryHandle('vr-notebook-database', { create: true });
            const fileHandle = await vrFolderHandle.getFileHandle('notebooks.json', { create: true });

            this.syncFileHandle = fileHandle;
            this.startAutoSaveToPC();

            const writableStream = await fileHandle.createWritable();
            const notebooksToSave = this.notebooks.filter(n => !n.isReadOnly);
            const contenido = JSON.stringify(notebooksToSave, null, 2);
            await writableStream.write(contenido);
            await writableStream.close();

            alert("Libretas guardadas exitosamente en la carpeta 'vr-notebook-database'.\n\n¡Autoguardado activado! Tus apuntes se sincronizarán en la PC cada 30 segundos mientras no cierres la página.");
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log("El guardado fue cancelado por el usuario.");
            } else {
                console.error("Hubo un error al exportar la base de datos:", error);
                alert("Ocurrió un error inesperado al intentar guardar la información.");
            }
        }
    }

    startAutoSaveToPC() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(async () => {
            if (this.syncFileHandle) {
                try {
                    const writableStream = await this.syncFileHandle.createWritable();
                    const notebooksToSave = this.notebooks.filter(n => !n.isReadOnly);
                    const contenido = JSON.stringify(notebooksToSave, null, 2);
                    await writableStream.write(contenido);
                    await writableStream.close();
                    console.log("Autoguardado silencioso en PC completado a las " + new Date().toLocaleTimeString());
                } catch (error) {
                    console.error("Fallo el autoguardado silencioso. Es posible que los permisos se hayan revocado.", error);
                    clearInterval(this.autoSaveInterval);
                    this.syncFileHandle = null;
                }
            }
        }, 30000);
    }

    async importDatabaseFromPC() {
        try {
            if (!window.showOpenFilePicker) {
                alert("Tu navegador no soporta la función de importar archivos. Por favor, intenta usar Chrome o Edge.");
                return;
            }

            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Base de datos de VR Notebook',
                    accept: {
                        'application/json': ['.json']
                    }
                }],
                multiple: false
            });

            const file = await fileHandle.getFile();
            const contenido = await file.text();

            const importedNotebooks = JSON.parse(contenido);

            if (Array.isArray(importedNotebooks) && importedNotebooks.length > 0) {
                this.notebooks = importedNotebooks;
                this.activeNotebookId = this.notebooks[0].id;
                this.saveNotebooks();

                if (this.uiController) {
                    this.uiController.renderNotebookList(this.notebooks, this.activeNotebookId);
                    this.uiController.updateCoverView(this.getActiveNotebook());
                    this.uiController.closeNotebook();
                }
                alert("Tus libretas se han importado y cargado con éxito.");
            } else {
                alert("El archivo seleccionado no tiene el formato correcto o está vacío.");
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log("La importación fue cancelada por el usuario.");
            } else {
                console.error("Hubo un error al importar la base de datos:", error);
                alert("Ocurrió un error inesperado al intentar importar la información.");
            }
        }
    }

    createNotebook(name, color, skipRender = false) {
        const newNotebook = {
            id: 'nb_' + Date.now(),
            name: name,
            color: color,
            coverImage: null,
            titleColor: '#ffffff',
            titleFont: "'Outfit', sans-serif",
            pages: [{
                pageText: '',
                pageDrawing: null,
                pageImages: [],
                pageNotes: []
            }],
            activePageIndex: 0,
            createdAt: new Date().toISOString()
        };

        this.notebooks.push(newNotebook);
        this.activeNotebookId = newNotebook.id;
        this.saveNotebooks();

        if (!skipRender && this.uiController) {
            this.uiController.renderNotebookList(this.notebooks, this.activeNotebookId);
            this.uiController.updateCoverView(newNotebook);
        }

        return newNotebook;
    }

    setActiveNotebook(id) {
        this.activeNotebookId = id;
        if (this.uiController) {
            this.uiController.renderNotebookList(this.notebooks, this.activeNotebookId);
            this.uiController.updateCoverView(this.getActiveNotebook());
        }
    }

    getActiveNotebook() {
        return this.notebooks.find(nb => nb.id === this.activeNotebookId);
    }

    updateCoverImage(id, imageDataUrl) {
        const nb = this.notebooks.find(n => n.id === id);
        if (nb) {
            nb.coverImage = imageDataUrl;
            this.saveNotebooks();
            if (this.uiController) {
                this.uiController.renderNotebookList(this.notebooks, this.activeNotebookId);
                if (this.activeNotebookId === id) {
                    this.uiController.updateCoverView(nb);
                }
            }
        }
    }

    renameNotebook(id, newName) {
        const nb = this.notebooks.find(n => n.id === id);
        if (nb) {
            nb.name = newName;
            this.saveNotebooks();
            if (this.uiController) {
                this.uiController.renderNotebookList(this.notebooks, this.activeNotebookId);
            }
        }
    }

    updateCoverColor(id, colorHex) {
        const nb = this.notebooks.find(n => n.id === id);
        if (nb) {
            nb.color = colorHex;
            this.saveNotebooks();
            if (this.uiController) {
                this.uiController.renderNotebookList(this.notebooks, this.activeNotebookId);
                if (this.activeNotebookId === id) {
                    this.uiController.updateCoverView(nb);
                }
            }
        }
    }

    updateTitleColor(id, colorHex) {
        const nb = this.notebooks.find(n => n.id === id);
        if (nb) {
            nb.titleColor = colorHex;
            this.saveNotebooks();
            if (this.uiController && this.activeNotebookId === id) {
                this.uiController.updateCoverView(nb);
            }
        }
    }

    updateTitleFont(id, fontName) {
        const nb = this.notebooks.find(n => n.id === id);
        if (nb) {
            nb.titleFont = fontName;
            this.saveNotebooks();
            if (this.uiController && this.activeNotebookId === id) {
                this.uiController.updateCoverView(nb);
            }
        }
    }

    updatePageText(id, text, pageIndex = null) {
        const notebook = this.notebooks.find(n => n.id === id);
        if (notebook) {
            const index = pageIndex !== null ? pageIndex : notebook.activePageIndex;
            if (notebook.pages[index]) {
                notebook.pages[index].pageText = text;
                this.saveNotebooks();
            }
        }
    }

    updatePageDrawing(id, dataUrl, pageIndex = null) {
        const notebook = this.notebooks.find(n => n.id === id);
        if (notebook) {
            const index = pageIndex !== null ? pageIndex : notebook.activePageIndex;
            if (notebook.pages[index]) {
                notebook.pages[index].pageDrawing = dataUrl;
                this.saveNotebooks();
            }
        }
    }

    addPage(id) {
        const notebook = this.notebooks.find(n => n.id === id);
        if (notebook) {
            notebook.pages.push({
                pageText: '',
                pageDrawing: null,
                pageImages: [],
                pageNotes: []
            });
            notebook.activePageIndex = notebook.pages.length - 1;
            this.saveNotebooks();
            return notebook.activePageIndex;
        }
        return -1;
    }

    setPageIndex(id, index) {
        const notebook = this.notebooks.find(n => n.id === id);
        if (notebook && index >= 0 && index < notebook.pages.length) {
            notebook.activePageIndex = index;
            this.saveNotebooks();
            return true;
        }
        return false;
    }

    deletePage(id) {
        const notebook = this.notebooks.find(n => n.id === id);
        if (notebook && notebook.pages.length > 1) {
            notebook.pages.splice(notebook.activePageIndex, 1);
            if (notebook.activePageIndex >= notebook.pages.length) {
                notebook.activePageIndex = notebook.pages.length - 1;
            }
            this.saveNotebooks();
            return true;
        }
        return false;
    }

    deleteNotebook(id) {
        const index = this.notebooks.findIndex(n => n.id === id);
        if (index !== -1) {
            if (this.notebooks[index].isReadOnly) return false;

            this.notebooks.splice(index, 1);

            let activeDeleted = false;
            if (this.activeNotebookId === id) {
                this.activeNotebookId = this.notebooks.length > 0 ? this.notebooks[0].id : null;
                activeDeleted = true;
            }

            if (this.notebooks.length === 0) {
                this.createManualNotebook();
            } else {
                this.saveNotebooks();
                if (this.uiController) {
                    this.uiController.renderNotebookList(this.notebooks, this.activeNotebookId);
                    if (this.activeNotebookId) {
                        this.uiController.updateCoverView(this.getActiveNotebook());
                    }
                    if (activeDeleted && typeof this.uiController.closeNotebook === 'function') {
                        this.uiController.closeNotebook();
                    }
                }
            }
            return true;
        }
        return false;
    }
}
