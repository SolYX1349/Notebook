import { NotebookManager } from './core/notebookManager.js';
import { CanvasManager } from './core/canvasManager.js';
import { ImageManager } from './core/imageManager.js';
import { StickyNoteManager } from './core/stickyNoteManager.js';
import { UIController } from './ui/uiController.js';

document.addEventListener('DOMContentLoaded', () => {
    const nbManager = new NotebookManager();
    
    const managers = {
        left: {
            canvas: new CanvasManager('drawingCanvasLeft'),
            image: new ImageManager(nbManager),
            sticky: new StickyNoteManager(nbManager)
        },
        right: {
            canvas: new CanvasManager('drawingCanvasRight'),
            image: new ImageManager(nbManager),
            sticky: new StickyNoteManager(nbManager)
        }
    };
    
    const uiController = new UIController(nbManager, managers);

    uiController.init();
    nbManager.init(uiController);
    
    managers.left.image.init(document.getElementById('imageLayerLeft'));
    managers.right.image.init(document.getElementById('imageLayerRight'));
    
    managers.left.sticky.init(document.getElementById('stickyDispenser'), document.getElementById('pageContentLeft'));
    managers.right.sticky.init(document.getElementById('stickyDispenser'), document.getElementById('pageContentRight'));
});
