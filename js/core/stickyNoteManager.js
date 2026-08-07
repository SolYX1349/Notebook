export class StickyNoteManager {
    constructor(notebookManager) {
        this.nbManager = notebookManager;
        this.dispenserContainer = null;
        this.pageContainer = null;
        this.isReadOnly = false;
        
        // Estado para arrastre
        this.activeNote = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        this.bindGlobalEvents();
    }

    init(dispenserContainer, pageContainer, pageIndex = null) {
        this.dispenserContainer = dispenserContainer;
        this.pageContainer = pageContainer;
        this.pageIndex = pageIndex;
        this.spawnDispenserNote();
    }

    bindGlobalEvents() {
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    spawnDispenserNote() {
        if (!this.dispenserContainer || this.isReadOnly) return;
        this.dispenserContainer.innerHTML = '';
        
        const note = document.createElement('div');
        note.className = 'sticky-note dispenser-note';
        note.innerHTML = `
            <div class="sticky-header">
                <!-- Title removed from here -->
            </div>
            <div class="sticky-content" contenteditable="true" spellcheck="false"></div>
        `;

        note.addEventListener('mousedown', (e) => {
            const isSelectTool = document.querySelector('.tool-btn.active')?.dataset.tool === 'select';
            if (!isSelectTool) return;
            
            e.preventDefault(); // Evitar arrastre nativo de texto
            this.startDrag(e, note, true);
        });
        
        this.dispenserContainer.appendChild(note);
    }

    loadNotes(notes, pageIndex = null) {
        if (!this.pageContainer) return;
        this.pageIndex = pageIndex;
        
        // Limpiar notas anteriores de la página (pero no el dispensador)
        const oldNotes = this.pageContainer.querySelectorAll('.sticky-note');
        oldNotes.forEach(n => n.remove());

        if (notes && notes.length > 0) {
            notes.forEach(noteData => this.renderPageNote(noteData));
        }
    }

    renderPageNote(noteData) {
        const note = document.createElement('div');
        note.className = 'sticky-note page-note';
        note.id = noteData.id;
        note.style.position = 'absolute';
        note.style.left = noteData.x + 'px';
        note.style.top = noteData.y + 'px';
        
        note.innerHTML = `
            <div class="sticky-header">
                <button class="delete-note-btn"><i class="ph ph-x"></i></button>
            </div>
            <div class="sticky-content" contenteditable="${!this.isReadOnly}" spellcheck="false">${noteData.text || ''}</div>
        `;

        if (!this.isReadOnly) {
            note.addEventListener('mousedown', (e) => {
                if (e.target.closest('.delete-note-btn')) return;
                
                const isSelectTool = document.querySelector('.tool-btn.active')?.dataset.tool === 'select';
                if (!isSelectTool) return;
                
                e.preventDefault(); // Evitar selección/arrastre de texto nativo al mover
                this.startDrag(e, note, false);
            });

            const content = note.querySelector('.sticky-content');
            content.addEventListener('input', () => {
                this.updateNoteData(noteData.id, { text: content.innerHTML });
            });

            const deleteBtn = note.querySelector('.delete-note-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeNote(noteData.id);
                note.remove();
            });
        }

        this.pageContainer.appendChild(note);
    }

    startDrag(e, noteElement, isFromDispenser) {
        if (this.isReadOnly) return;
        this.activeNote = noteElement;
        this.isDragging = true;
        this.activeNote.isFromDispenser = isFromDispenser;
        this.activeNote.classList.add('is-dragging');
        
        const rect = noteElement.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
        
        if (isFromDispenser) {
            // Mover temporalmente al body para permitir arrastre sin recortes de overflow
            document.body.appendChild(noteElement);
            noteElement.classList.remove('dispenser-note'); // Importante para quitar left:0 !important
            
            // Re-calculate drag offset relative to the body since it was relative to the old position
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            
            noteElement.style.position = 'absolute';
            noteElement.style.left = (e.clientX - this.dragOffset.x) + 'px';
            noteElement.style.top = (e.clientY - this.dragOffset.y) + 'px';
            
            // Generar uno nuevo inmediatamente en el dispensador
            this.spawnDispenserNote();
        }
    }

    onMouseMove(e) {
        if (!this.isDragging || !this.activeNote) return;
        
        let newX = e.clientX - this.dragOffset.x;
        let newY = e.clientY - this.dragOffset.y;
        
        if (!this.activeNote.isFromDispenser) {
            const pageRect = this.pageContainer.getBoundingClientRect();
            newX -= pageRect.left;
            newY -= pageRect.top;
            
            const noteRect = this.activeNote.getBoundingClientRect();
            const margin = 10;
            const maxX = pageRect.width - margin - noteRect.width;
            const maxY = pageRect.height - margin - noteRect.height;
            
            if (newX < margin) newX = margin;
            if (newY < margin) newY = margin;
            if (newX > maxX) newX = maxX;
            if (newY > maxY) newY = maxY;
        }
        
        this.activeNote.style.left = newX + 'px';
        this.activeNote.style.top = newY + 'px';
    }

    onMouseUp(e) {
        if (!this.isDragging || !this.activeNote) return;
        
        this.activeNote.classList.remove('is-dragging');
        const pageRect = this.pageContainer.getBoundingClientRect();
        const noteRect = this.activeNote.getBoundingClientRect();
        
        if (this.activeNote.isFromDispenser) {
            // Verificar si se soltó dentro de pageContainer
            if (e.clientX > pageRect.left && e.clientX < pageRect.right &&
                e.clientY > pageRect.top && e.clientY < pageRect.bottom) {
                
                // Calculate relative position based on the wrapper
                let relativeX = noteRect.left - pageRect.left;
                let relativeY = noteRect.top - pageRect.top;
                
                const margin = 10;
                const maxX = pageRect.width - margin - noteRect.width;
                const maxY = pageRect.height - margin - noteRect.height;
                
                if (relativeX < margin) relativeX = margin;
                if (relativeY < margin) relativeY = margin;
                if (relativeX > maxX) relativeX = maxX;
                if (relativeY > maxY) relativeY = maxY;
                
                const contentHtml = this.activeNote.querySelector('.sticky-content').innerHTML;
                
                const newNote = {
                    id: 'note_' + Date.now(),
                    text: contentHtml,
                    x: relativeX,
                    y: relativeY
                };
                
                // Guardar
                const nb = this.nbManager.getActiveNotebook();
                const indexToUse = this.pageIndex !== null ? this.pageIndex : (nb ? nb.activePageIndex : 0);
                if (nb && nb.pages[indexToUse]) {
                    const activePage = nb.pages[indexToUse];
                    if (!activePage.pageNotes) activePage.pageNotes = [];
                    activePage.pageNotes.push(newNote);
                    this.nbManager.saveNotebooks();
                    
                    // Renderizar en la página
                    this.renderPageNote(newNote);
                }
                // Eliminar el nodo temporal arrastrado ya que se convirtió en una nota de página
                this.activeNote.remove();
            } else {
                // Si se soltó fuera de la libreta, lo devolvemos al dispensador
                this.activeNote.classList.remove('is-dragging');
                this.activeNote.style.left = '';
                this.activeNote.style.top = '';
                this.dispenserContainer.innerHTML = '';
                this.dispenserContainer.appendChild(this.activeNote);
            }
        } else {
            // Se movió una nota existente
            // Calcular nueva posición relativa
            let relativeX = noteRect.left - pageRect.left;
            let relativeY = noteRect.top - pageRect.top;
            
            const margin = 10;
            const maxX = pageRect.width - margin - noteRect.width;
            const maxY = pageRect.height - margin - noteRect.height;
            
            if (relativeX < margin) relativeX = margin;
            if (relativeY < margin) relativeY = margin;
            if (relativeX > maxX) relativeX = maxX;
            if (relativeY > maxY) relativeY = maxY;
            
            this.activeNote.style.left = relativeX + 'px';
            this.activeNote.style.top = relativeY + 'px';
            
            this.updateNoteData(this.activeNote.id, { x: relativeX, y: relativeY });
        }
        
        this.isDragging = false;
        this.activeNote = null;
    }

    updateNoteData(id, updates) {
        const nb = this.nbManager.getActiveNotebook();
        const indexToUse = this.pageIndex !== null ? this.pageIndex : (nb ? nb.activePageIndex : 0);
        if (nb && nb.pages[indexToUse]) {
            const activePage = nb.pages[indexToUse];
            const noteData = activePage.pageNotes?.find(n => n.id === id);
            if (noteData) {
                Object.assign(noteData, updates);
                this.nbManager.saveNotebooks();
            }
        }
    }

    removeNote(id) {
        const nb = this.nbManager.getActiveNotebook();
        const indexToUse = this.pageIndex !== null ? this.pageIndex : (nb ? nb.activePageIndex : 0);
        if (nb && nb.pages[indexToUse]) {
            const activePage = nb.pages[indexToUse];
            if (activePage.pageNotes) {
                activePage.pageNotes = activePage.pageNotes.filter(n => n.id !== id);
                this.nbManager.saveNotebooks();
            }
        }
    }
    
    spawnNoteOnPage() {
        if (this.isReadOnly || !this.pageContainer) return;

        // Try to place it in the center of the page
        const pageRect = this.pageContainer.getBoundingClientRect();
        
        // Typical sticky note width is about 120-150px
        const noteWidth = 120;
        const noteHeight = 120;
        
        // Random offset so they don't stack exactly on top of each other
        const offset = Math.floor(Math.random() * 40) - 20;
        
        const relativeX = (pageRect.width / 2) - (noteWidth / 2) + offset;
        const relativeY = (pageRect.height / 2) - (noteHeight / 2) + offset;
        
        const newNote = {
            id: 'note_' + Date.now(),
            text: '',
            x: relativeX,
            y: relativeY
        };
        
        const nb = this.nbManager.getActiveNotebook();
        const indexToUse = this.pageIndex !== null ? this.pageIndex : (nb ? nb.activePageIndex : 0);
        
        if (nb && nb.pages[indexToUse]) {
            const activePage = nb.pages[indexToUse];
            if (!activePage.pageNotes) activePage.pageNotes = [];
            activePage.pageNotes.push(newNote);
            this.nbManager.saveNotebooks();
            
            // Renderizar en la página
            this.renderPageNote(newNote);
        }
    }
}
