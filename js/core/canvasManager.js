import { DrawingTools } from './drawingTools.js';

export class CanvasManager {
    constructor(canvasElementOrId = 'drawingCanvas') {
        if (typeof canvasElementOrId === 'string') {
            this.canvas = document.getElementById(canvasElementOrId);
        } else {
            this.canvas = canvasElementOrId;
        }
        this.ctx = this.canvas.getContext('2d');

        // Estado para dibujar
        this.isDrawing = false;
        this.currentTool = 'pen'; // pen, pencil, crayon, eraser
        this.currentColor = '#000000';
        this.currentWidth = null; // Default will be used if null

        // Historial de deshacer
        this.undoStack = [];
        this.maxUndoSteps = 20;

        this.drawingTools = new DrawingTools(this.ctx);

        this.setupCanvas();
        this.bindEvents();
    }

    saveState() {
        if (this.undoStack.length >= this.maxUndoSteps) {
            this.undoStack.shift();
        }
        this.undoStack.push(this.canvas.toDataURL());
    }

    undo() {
        if (this.undoStack.length > 0) {
            const dataUrl = this.undoStack.pop();
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
                this.dispatchDrawingChanged();
            };
            img.src = dataUrl;
        }
    }

    dispatchDrawingChanged() {
        const event = new CustomEvent('drawingChanged', { detail: this.canvas.toDataURL() });
        this.canvas.dispatchEvent(event);
    }

    loadDrawing(dataUrl) {
        if (!dataUrl) return;
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            this.undoStack = []; // reset stack
        };
        img.src = dataUrl;
    }

    setupCanvas() {
        // Ajustar el tamaño del canvas al contenedor (resolución HD para mejor calidad)
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        // Estilo inicial
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.currentColor;
    }

    resizeCanvas() {
        // Guardar el contenido actual
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (this.canvas.width > 0 && this.canvas.height > 0) {
            tempCtx.drawImage(this.canvas, 0, 0);
        }

        // Redimensionar
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        // Restaurar contexto y contenido
        this.setTool(this.currentTool);
        this.setColor(this.currentColor);
        if (tempCanvas.width > 0 && tempCanvas.height > 0) {
            this.ctx.drawImage(tempCanvas, 0, 0);
        }
    }

    bindEvents() {
        // Eventos de ratón
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        window.addEventListener('mouseup', this.stopDrawing.bind(this));

        // Eventos del Cursor Personalizado
        this.canvas.addEventListener('mouseenter', this.showCustomCursor.bind(this));
        this.canvas.addEventListener('mousemove', this.updateCustomCursor.bind(this));
        this.canvas.addEventListener('mouseleave', this.hideCustomCursor.bind(this));

        // Eventos táctiles
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => {
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });

        window.addEventListener('resize', () => {
            // Solo redimensionar si el canvas está visible para no corromper la imagen
            if (!document.getElementById('openView').classList.contains('hidden')) {
                this.resizeCanvas();
            }
        });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    startDrawing(e) {
        if (this.isReadOnly) return; // No dibujar si es de solo lectura

        if (!this.isDrawing) {
            this.saveState(); // Guardar estado antes de empezar a dibujar
        }
        if (this.currentTool === 'text') return;

        this.isDrawing = true;
        const pos = this.getMousePos(e);

        if (this.currentTool === 'fill') {
            // Placeholder para herramienta de relleno complejo, por ahora pintará un circulo
            this.drawingTools.applyToolSettings(this.currentTool, this.currentColor, this.currentWidth);
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 50, 0, Math.PI * 2);
            this.ctx.fill();
            this.isDrawing = false; // El relleno es un solo clic
            this.dispatchDrawingChanged();
            return;
        }

        this.drawingTools.applyToolSettings(this.currentTool, this.currentColor, this.currentWidth);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
    }

    draw(e) {
        if (!this.isDrawing) return;
        const pos = this.getMousePos(e);

        if (this.currentTool === 'crayon') {
            this.drawingTools.drawCrayon(pos.x, pos.y, this.currentColor, this.currentWidth);
        } else {
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
        }
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.ctx.beginPath();
        this.dispatchDrawingChanged();
    }

    setTool(toolName) {
        this.currentTool = toolName;
    }

    setColor(colorHex) {
        this.currentColor = colorHex;
    }

    setLineWidth(width) {
        this.currentWidth = width;
        this.updateCursorSize();
    }

    clearCanvas(skipSave = false) {
        if (!skipSave) this.saveState();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (!skipSave) this.dispatchDrawingChanged();
    }
    
    getCanvasElement() {
        return this.canvas;
    }

    // Custom Cursor Methods
    showCustomCursor() {
        if (this.currentTool === 'text' || this.currentTool === 'select') return;
        const cursor = document.getElementById('brushCursor');
        if (cursor) {
            cursor.classList.add('visible');
            this.canvas.classList.add('hide-cursor');
            this.updateCursorSize();
        }
    }

    hideCustomCursor() {
        const cursor = document.getElementById('brushCursor');
        if (cursor) {
            cursor.classList.remove('visible');
            this.canvas.classList.remove('hide-cursor');
        }
    }

    updateCustomCursor(e) {
        if (this.currentTool === 'text' || this.currentTool === 'select') {
            this.hideCustomCursor();
            return;
        }
        const cursor = document.getElementById('brushCursor');
        if (cursor && cursor.classList.contains('visible')) {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        }
    }

    updateCursorSize() {
        const cursor = document.getElementById('brushCursor');
        if (cursor) {
            let size = this.currentWidth || 6;
            if (this.currentTool === 'pencil') size = this.currentWidth || 2;
            if (this.currentTool === 'crayon') size = this.currentWidth || 15;
            if (this.currentTool === 'eraser') size = this.currentWidth || 20;
            
            // Adjust to scale if needed, but since it's screen pixels, it's 1:1
            cursor.style.width = size + 'px';
            cursor.style.height = size + 'px';
        }
    }
}
