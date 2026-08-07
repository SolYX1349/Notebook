export class DrawingTools {
    constructor(ctx) {
        this.ctx = ctx;
    }

    applyToolSettings(toolName, color, customWidth = null) {
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Reset composite operation
        this.ctx.globalCompositeOperation = 'source-over';

        switch (toolName) {
            case 'pen': // Plumón (Marcador suave)
                this.ctx.lineWidth = customWidth || 6;
                this.ctx.globalAlpha = 0.8;
                break;
            case 'pencil': // Lápiz (Fino y nítido)
                this.ctx.lineWidth = customWidth || 2;
                this.ctx.globalAlpha = 0.9;
                break;
            case 'crayon': // Crayola (Texturizado)
                this.ctx.lineWidth = customWidth || 15;
                this.ctx.globalAlpha = 1.0;
                break;
            case 'eraser': // Borrador
                this.ctx.globalCompositeOperation = 'destination-out';
                this.ctx.lineWidth = customWidth || 20;
                this.ctx.globalAlpha = 1.0;
                break;
            case 'fill': // Relleno
                this.ctx.lineWidth = 1; // Not used for fill
                this.ctx.globalAlpha = 1.0;
                break;
            default:
                this.ctx.lineWidth = customWidth || 3;
                this.ctx.globalAlpha = 1.0;
        }
    }

    // Efecto de crayón dispersando puntos
    drawCrayon(x, y, color, customWidth = null) {
        const radius = (customWidth || 15) / 2;
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.4; // Capas semitransparentes

        // Simular textura dibujando varios círculos pequeños desplazados
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.random() - 0.5) * radius;
            const offsetY = (Math.random() - 0.5) * radius;
            this.ctx.beginPath();
            this.ctx.arc(x + offsetX, y + offsetY, radius * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}
