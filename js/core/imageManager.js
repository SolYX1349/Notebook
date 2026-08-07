export class ImageManager {
    constructor(notebookManager) {
        this.nbManager = notebookManager;
        this.container = null; // Se asume que será #imageLayer
        this.activeWidget = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };
        this.bindGlobalEvents();
    }

    init(containerElement, pageIndex = null) {
        this.container = containerElement;
        this.pageIndex = pageIndex;
    }

    bindGlobalEvents() {
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        
        // Deseleccionar al hacer clic fuera
        document.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.image-widget') && !e.target.closest('.tool-btn')) {
                this.deselectAll();
            }
        });
    }

    loadImages(images, pageIndex = null) {
        if (!this.container) return;
        this.pageIndex = pageIndex;
        this.container.innerHTML = '';
        if (images && images.length > 0) {
            images.forEach(img => this.renderWidget(img));
        }
    }

    addImage(dataUrl) {
        const newImage = {
            id: 'img_' + Date.now(),
            src: dataUrl,
            x: 100,
            y: 100,
            width: 300,
            height: 'auto', // Auto keeps aspect ratio initially
            mode: 'contain' // 'contain' for scale, 'cover' for crop-like behavior
        };
        
        const nb = this.nbManager.getActiveNotebook();
        const indexToUse = this.pageIndex !== null ? this.pageIndex : (nb ? nb.activePageIndex : 0);
        if (nb && nb.pages[indexToUse]) {
            const activePage = nb.pages[indexToUse];
            if (!activePage.pageImages) activePage.pageImages = [];
            activePage.pageImages.push(newImage);
            this.nbManager.saveNotebooks();
            this.renderWidget(newImage);
        }
    }

    renderWidget(imgData) {
        const widget = document.createElement('div');
        widget.className = 'image-widget';
        widget.id = imgData.id;
        widget.style.left = imgData.x + 'px';
        widget.style.top = imgData.y + 'px';
        widget.style.width = imgData.width + 'px';
        if (imgData.height !== 'auto') {
            widget.style.height = imgData.height + 'px';
        }

        widget.innerHTML = `
            <img src="${imgData.src}" class="widget-img" style="object-fit: ${imgData.mode};">
            <div class="widget-controls">
                <button class="widget-btn toggle-mode-btn" title="Alternar Ajuste/Recorte"><i class="ph ph-crop"></i></button>
                <button class="widget-btn delete-btn" title="Eliminar"><i class="ph ph-trash"></i></button>
            </div>
            <div class="resize-handle"></div>
        `;

        // Eventos
        widget.addEventListener('mousedown', (e) => {
            if (e.target.closest('.widget-controls') || e.target.classList.contains('resize-handle')) return;
            this.startDrag(e, widget);
        });

        const resizeHandle = widget.querySelector('.resize-handle');
        resizeHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startResize(e, widget);
        });

        const deleteBtn = widget.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeImage(imgData.id);
            widget.remove();
        });

        const toggleBtn = widget.querySelector('.toggle-mode-btn');
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const imgEl = widget.querySelector('.widget-img');
            const newMode = imgEl.style.objectFit === 'cover' ? 'contain' : 'cover';
            imgEl.style.objectFit = newMode;
            this.updateImageData(imgData.id, { mode: newMode });
            
            // Icon update
            toggleBtn.innerHTML = newMode === 'cover' ? '<i class="ph ph-arrows-out"></i>' : '<i class="ph ph-crop"></i>';
        });

        this.container.appendChild(widget);
    }

    startDrag(e, widget) {
        if (this.isReadOnly) return; // No permitir interacción si es de solo lectura
        this.deselectAll();
        widget.classList.add('active');
        this.activeWidget = widget;
        this.isDragging = true;
        
        const rect = widget.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        // Offset relative to the widget's top-left corner
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
    }

    startResize(e, widget) {
        if (this.isReadOnly) return; // No permitir interacción si es de solo lectura
        this.deselectAll();
        widget.classList.add('active');
        this.activeWidget = widget;
        this.isResizing = true;
    }

    onMouseMove(e) {
        if (this.isDragging && this.activeWidget) {
            const containerRect = this.container.getBoundingClientRect();
            const widgetRect = this.activeWidget.getBoundingClientRect();
            
            let newX = e.clientX - containerRect.left - this.dragOffset.x;
            let newY = e.clientY - containerRect.top - this.dragOffset.y;
            
            // Limitar dentro del marco de recuadros (25px de margen)
            const margin = 25;
            const maxX = containerRect.width - margin - widgetRect.width;
            const maxY = containerRect.height - margin - widgetRect.height;
            
            if (newX < margin) newX = margin;
            if (newY < margin) newY = margin;
            if (newX > maxX) newX = maxX;
            if (newY > maxY) newY = maxY;
            
            this.activeWidget.style.left = newX + 'px';
            this.activeWidget.style.top = newY + 'px';
        } else if (this.isResizing && this.activeWidget) {
            const containerRect = this.container.getBoundingClientRect();
            
            let currentX = parseInt(this.activeWidget.style.left) || 25;
            let currentY = parseInt(this.activeWidget.style.top) || 25;
            
            let newWidth = (e.clientX - containerRect.left) - currentX;
            let newHeight = (e.clientY - containerRect.top) - currentY;
            
            // Limitar crecimiento para que no se salga del margen
            const margin = 25;
            const maxWidth = containerRect.width - margin - currentX;
            const maxHeight = containerRect.height - margin - currentY;
            
            if (newWidth > maxWidth) newWidth = maxWidth;
            if (newHeight > maxHeight) newHeight = maxHeight;
            
            if (newWidth > 50) this.activeWidget.style.width = newWidth + 'px';
            if (newHeight > 50) this.activeWidget.style.height = newHeight + 'px';
        }
    }

    onMouseUp(e) {
        if ((this.isDragging || this.isResizing) && this.activeWidget) {
            // Guardar el estado
            this.updateImageData(this.activeWidget.id, {
                x: parseInt(this.activeWidget.style.left),
                y: parseInt(this.activeWidget.style.top),
                width: parseInt(this.activeWidget.style.width),
                height: parseInt(this.activeWidget.style.height || this.activeWidget.offsetHeight)
            });
            this.isDragging = false;
            this.isResizing = false;
        }
    }

    deselectAll() {
        if (this.container) {
            const widgets = this.container.querySelectorAll('.image-widget');
            widgets.forEach(w => w.classList.remove('active'));
        }
    }

    updateImageData(id, updates) {
        const nb = this.nbManager.getActiveNotebook();
        const indexToUse = this.pageIndex !== null ? this.pageIndex : (nb ? nb.activePageIndex : 0);
        if (nb && nb.pages[indexToUse]) {
            const activePage = nb.pages[indexToUse];
            const imgData = activePage.pageImages?.find(img => img.id === id);
            if (imgData) {
                Object.assign(imgData, updates);
                this.nbManager.saveNotebooks();
            }
        }
    }

    removeImage(id) {
        const nb = this.nbManager.getActiveNotebook();
        const indexToUse = this.pageIndex !== null ? this.pageIndex : (nb ? nb.activePageIndex : 0);
        if (nb && nb.pages[indexToUse]) {
            const activePage = nb.pages[indexToUse];
            if (activePage.pageImages) {
                activePage.pageImages = activePage.pageImages.filter(img => img.id !== id);
                this.nbManager.saveNotebooks();
            }
        }
    }
}
