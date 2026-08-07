export class UIController {
    constructor(notebookManager, managers) {
        this.nbManager = notebookManager;
        this.managers = managers;
        // Estado inicial de la UI
        this.isTwoPageView = false;

        const isDark = localStorage.getItem('glass_theme') !== 'light';
        const defaultColor = isDark ? '#ffffff' : '#222222';

        this.textColor = defaultColor;
        this.brushColor = defaultColor;

        // Asignar colores por defecto al inicializar
        this.backupWarningShown = false;

        // DOM Elements
        this.notebookListEl = document.getElementById('notebookList');

        // Views
        this.coverView = document.getElementById('coverView');
        this.openView = document.getElementById('openView');

        this.activeNotebookCover = document.getElementById('activeNotebookCover');
        this.activeNotebookTitle = document.getElementById('activeNotebookTitle');
        this.changeCoverBtn = document.getElementById('changeCoverBtn');
        this.coverImageInput = document.getElementById('coverImageInput');
        this.titleColorInput = document.getElementById('titleColorInput');
        this.coverColorInput = document.getElementById('coverColorInput');
        this.titleFontSelect = document.getElementById('titleFontSelect');

        // Toolbar Elements
        this.toolBtns = document.querySelectorAll('.tool-btn[data-tool]');
        this.colorPicker = document.getElementById('colorPicker');
        this.closeNotebookBtn = document.getElementById('closeNotebookBtn');
        this.pageTextareaLeft = document.getElementById('pageTextareaLeft');
        this.pageTextareaRight = document.getElementById('pageTextareaRight');

        // Asignar colores por defecto al inicializar
        this.pageTextareaLeft.style.color = this.textColor;
        this.pageTextareaRight.style.color = this.textColor;

        this.canvasContainerLeft = document.getElementById('canvasContainerLeft');
        this.canvasContainerRight = document.getElementById('canvasContainerRight');
        this.twoPageWrapper = document.getElementById('twoPageWrapper');
        this.toggleViewModeBtn = document.getElementById('toggleViewModeBtn');
        this.rotatePageBtn = document.getElementById('rotatePageBtn');
        this.insertImageBtn = document.getElementById('insertImageBtn');
        this.insertImageInput = document.getElementById('insertImageInput');
        this.addStickyNoteBtn = document.getElementById('addStickyNoteBtn');
        this.toggleHandwritingBtn = document.getElementById('toggleHandwritingBtn');

        // Pagination Elements
        this.pageIndicator = document.getElementById('pageIndicator');
        this.prevPageBtn = document.getElementById('prevPageBtn');
        this.nextPageBtn = document.getElementById('nextPageBtn');
        this.addPageBtn = document.getElementById('addPageBtn');
        this.deletePageBtn = document.getElementById('deletePageBtn');
        this.pageIndicator = document.getElementById('pageIndicator');

        // Elementos de herramientas
        this.colorPicker = document.getElementById('colorPicker');
        if (this.colorPicker) {
            this.colorPicker.value = this.textColor;
        }
        this.lineWidthSlider = document.getElementById('lineWidthSlider');

        // Elementos Modales
        this.addNotebookBtn = document.getElementById('addNotebookBtn');
        this.saveToPcBtn = document.getElementById('saveToPcBtn');
        this.importFromPcBtn = document.getElementById('importFromPcBtn');
        this.newNotebookModal = document.getElementById('newNotebookModal');
        this.cancelNewNotebookBtn = document.getElementById('cancelNewNotebookBtn');
        this.confirmNewNotebookBtn = document.getElementById('confirmNewNotebookBtn');
        this.newNotebookNameInput = document.getElementById('newNotebookName');
        this.newNotebookColorInput = document.getElementById('newNotebookColor');

        this.saveNotebookModal = document.getElementById('saveNotebookModal');
        this.cancelSaveNotebookBtn = document.getElementById('cancelSaveNotebookBtn');
        this.confirmSaveNotebookBtn = document.getElementById('confirmSaveNotebookBtn');

        this.deletePageModal = document.getElementById('deletePageModal');
        this.cancelDeletePageBtn = document.getElementById('cancelDeletePageBtn');
        this.confirmDeletePageBtn = document.getElementById('confirmDeletePageBtn');
        this.pageToDeleteNotebookId = null;
        this.lastDeletionTime = 0;

        this.deleteNotebookModal = document.getElementById('deleteNotebookModal');
        this.cancelDeleteNotebookBtn = document.getElementById('cancelDeleteNotebookBtn');
        this.confirmDeleteNotebookBtn = document.getElementById('confirmDeleteNotebookBtn');
        this.notebookToDeleteId = null;
        this.lastNotebookDeletionTime = 0;

        this.backupWarningModal = document.getElementById('backupWarningModal');
        this.closeBackupWarningBtn = document.getElementById('closeBackupWarningBtn');

        this.themeToggleBtn = document.getElementById('themeToggleBtn');

        // Responsive Mobile Menu
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.sidebar = document.querySelector('.sidebar');
    }

    init() {
        this.loadTheme();
        this.bindEvents();
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('glass_theme');
        if (savedTheme === 'light') {
            document.body.classList.remove('dark-theme');
            if (this.themeToggleBtn) this.themeToggleBtn.innerHTML = '<i class="ph ph-moon"></i>';
        } else {
            document.body.classList.add('dark-theme');
            if (this.themeToggleBtn) this.themeToggleBtn.innerHTML = '<i class="ph ph-sun"></i>';
            localStorage.setItem('glass_theme', 'dark'); // Default to dark
        }
    }

    bindEvents() {
        // Menu de libretas
        this.addNotebookBtn.addEventListener('click', () => this.showModal());

        const addManualBtn = document.getElementById('addManualBtn');
        if (addManualBtn) {
            addManualBtn.addEventListener('click', () => {
                const manual = this.nbManager.createManualNotebook();
                this.nbManager.setActiveNotebook(manual.id);
                this.updateCoverView(manual);
                this.renderNotebookList(this.nbManager.notebooks, manual.id);
                this.openNotebook();
            });
        }

        if (this.saveToPcBtn) {
            this.saveToPcBtn.addEventListener('click', () => {
                this.saveNotebookModal.classList.remove('hidden');
            });
        }

        if (this.importFromPcBtn) {
            this.importFromPcBtn.addEventListener('click', async () => {
                await this.nbManager.importDatabaseFromPC();
            });
        }

        if (this.cancelSaveNotebookBtn) {
            this.cancelSaveNotebookBtn.addEventListener('click', () => {
                this.saveNotebookModal.classList.add('hidden');
            });
        }

        if (this.confirmSaveNotebookBtn) {
            this.confirmSaveNotebookBtn.addEventListener('click', async () => {
                this.saveNotebookModal.classList.add('hidden');
                // Al presionar este botón, se registra el evento del usuario (user gesture),
                // y ya podemos llamar a showDirectoryPicker() de forma segura.
                await this.nbManager.exportDatabaseToPC();
            });
        }

        if (this.closeBackupWarningBtn) {
            this.closeBackupWarningBtn.addEventListener('click', () => {
                this.backupWarningModal.classList.add('hidden');
            });
        }

        this.cancelNewNotebookBtn.addEventListener('click', () => this.hideModal());
        this.confirmNewNotebookBtn.addEventListener('click', () => {
            const name = this.newNotebookNameInput.value.trim() || 'Nueva Libreta';
            const color = this.newNotebookColorInput.value;
            this.nbManager.createNotebook(name, color);

            // Show toast only when creating the very first custom notebook
            const customNotebooksCount = this.nbManager.notebooks.filter(n => !n.isReadOnly).length;
            if (customNotebooksCount === 1) {
                this.checkAndShowBackupWarning();
            }

            this.hideModal();
        });

        this.newNotebookNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.confirmNewNotebookBtn.click();
            }
        });

        this.cancelDeletePageBtn.addEventListener('click', () => {
            this.deletePageModal.classList.add('hidden');
            this.pageToDeleteNotebookId = null;
        });

        this.confirmDeletePageBtn.addEventListener('click', () => {
            if (this.pageToDeleteNotebookId) {
                try {
                    if (this.nbManager.deletePage(this.pageToDeleteNotebookId)) {
                        this.loadCurrentPage();
                        this.lastDeletionTime = Date.now();
                    } else {
                        alert('Error: deletePage devolvió falso.');
                    }
                } catch (err) {
                    console.error('Error in delete page logic:', err);
                    alert('Se produjo un error al eliminar: ' + err.message);
                }
                this.deletePageModal.classList.add('hidden');
                this.pageToDeleteNotebookId = null;
            }
        });

        this.cancelDeleteNotebookBtn.addEventListener('click', () => {
            this.deleteNotebookModal.classList.add('hidden');
            this.notebookToDeleteId = null;
        });

        this.confirmDeleteNotebookBtn.addEventListener('click', () => {
            if (this.notebookToDeleteId) {
                this.nbManager.deleteNotebook(this.notebookToDeleteId);
                this.lastNotebookDeletionTime = Date.now();
                this.deleteNotebookModal.classList.add('hidden');
                this.notebookToDeleteId = null;
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!this.newNotebookModal.classList.contains('hidden')) {
                    this.hideModal();
                } else if (!this.saveNotebookModal.classList.contains('hidden')) {
                    this.saveNotebookModal.classList.add('hidden');
                } else if (!this.deleteNotebookModal.classList.contains('hidden')) {
                    this.deleteNotebookModal.classList.add('hidden');
                    this.notebookToDeleteId = null;
                } else if (!this.deletePageModal.classList.contains('hidden')) {
                    this.deletePageModal.classList.add('hidden');
                    this.pageToDeleteNotebookId = null;
                } else if (!this.openView.classList.contains('hidden')) {
                    this.closeNotebook();
                }
            }
        });

        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => {
                const isDark = document.body.classList.toggle('dark-theme');
                localStorage.setItem('glass_theme', isDark ? 'dark' : 'light');
                this.themeToggleBtn.innerHTML = isDark ? '<i class="ph ph-sun"></i>' : '<i class="ph ph-moon"></i>';
            });
        }

        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => {
                this.sidebar.classList.toggle('show');
            });
        }

        // Alternar vistas
        this.activeNotebookCover.addEventListener('click', (e) => {
            // Evitar abrir si se hace clic en los botones de la esquina o en el título
            if (e.target.closest('.top-corner-actions') || e.target.closest('.cover-title')) {
                return;
            }
            this.openNotebook();
        });
        this.closeNotebookBtn.addEventListener('click', () => this.closeNotebook());

        // Cambiar imagen de portada
        this.changeCoverBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.coverImageInput.click();
        });

        // Botón flotante para cerrar libretas (útil cuando la toolbar está oculta)
        const floatingCloseBtn = document.getElementById('floatingCloseBtn');
        if (floatingCloseBtn) {
            floatingCloseBtn.addEventListener('click', () => {
                const nb = this.nbManager.getActiveNotebook();
                if (nb && nb.name === 'MANUAL') {
                    // Seleccionar la primera libreta normal disponible si es el manual
                    const firstNormal = this.nbManager.notebooks.find(n => n.name !== 'MANUAL');
                    if (firstNormal) {
                        this.nbManager.setActiveNotebook(firstNormal.id);
                    }
                }
                this.closeNotebook();
            });
        }

        // Evitar que el clic programático en el input propague el evento al contenedor de la libreta
        this.coverImageInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Cambiar el color del título
        this.titleColorInput.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar abrir libreta al elegir color
        });

        // Evitar que el select abra la libreta
        this.titleFontSelect.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Cambiar fuente del título
        this.titleFontSelect.addEventListener('change', (e) => {
            const font = e.target.value;
            this.activeNotebookTitle.style.fontFamily = font;
            this.nbManager.updateTitleFont(this.nbManager.activeNotebookId, font);
        });

        this.titleColorInput.addEventListener('input', (e) => {
            const color = e.target.value;
            this.activeNotebookTitle.style.color = color;
            this.nbManager.updateTitleColor(this.nbManager.activeNotebookId, color);
        });

        // Evitar que el clic abra la libreta
        this.coverColorInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Cambiar color de fondo de portada
        this.coverColorInput.addEventListener('input', (e) => {
            const color = e.target.value;
            this.activeNotebookCover.style.setProperty('--cover-color', color);

            // Si hay una imagen, la quitamos para que se pueda ver el color sólido elegido
            if (this.nbManager.getActiveNotebook().coverImage) {
                this.activeNotebookCover.style.backgroundImage = 'none';
                this.nbManager.updateCoverImage(this.nbManager.activeNotebookId, null);
            }

            this.nbManager.updateCoverColor(this.nbManager.activeNotebookId, color);
        });

        this.coverImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target.result;
                    const activeId = this.nbManager.activeNotebookId;
                    this.nbManager.updateCoverImage(activeId, dataUrl);
                };
                reader.readAsDataURL(file);
            }
        });

        // Hacer editable el título de la libreta
        this.activeNotebookTitle.setAttribute('contenteditable', 'true');
        this.activeNotebookTitle.title = "Haz clic para editar el nombre";

        this.activeNotebookTitle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.activeNotebookTitle.blur(); // Quita el foco y lanza el evento blur
            } else {
                const allowKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'];
                if (this.activeNotebookTitle.textContent.length >= 78 && !allowKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                }
            }
        });

        this.activeNotebookTitle.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.originalEvent || e).clipboardData.getData('text/plain');
            const currentText = this.activeNotebookTitle.textContent;
            const remaining = 50 - currentText.length;
            if (remaining > 0) {
                document.execCommand('insertText', false, text.substring(0, remaining));
            }
        });

        this.activeNotebookTitle.addEventListener('blur', (e) => {
            const newName = e.target.textContent.trim() || 'Libreta sin nombre';
            this.nbManager.renameNotebook(this.nbManager.activeNotebookId, newName);
        });

        // Herramientas de dibujo
        this.toolBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remover clase active de todos
                this.toolBtns.forEach(b => b.classList.remove('active'));

                // Agregar clase active al clickeado
                const targetBtn = e.currentTarget;
                targetBtn.classList.add('active');

                // Cambiar herramienta en ambos CanvasManager
                const toolName = targetBtn.dataset.tool;
                this.managers.left.canvas.setTool(toolName);
                this.managers.right.canvas.setTool(toolName);

                // Actualizar slider de grosor según la herramienta
                const toolDefaults = { pen: 6, pencil: 2, crayon: 15, eraser: 20 };
                if (this.lineWidthSlider && toolDefaults[toolName]) {
                    this.lineWidthSlider.value = toolDefaults[toolName];
                    this.managers.left.canvas.setLineWidth(toolDefaults[toolName]);
                    this.managers.right.canvas.setLineWidth(toolDefaults[toolName]);
                }

                // Actualizar color picker
                if (this.colorPicker) {
                    this.colorPicker.value = (toolName === 'text') ? this.textColor : this.brushColor;
                }

                // Activar/desactivar capa de texto
                if (toolName === 'text') {
                    this.pageTextareaLeft.classList.add('active');
                    this.pageTextareaRight.classList.add('active');
                    // Focus depending on mode
                    this.pageTextareaRight.focus();
                } else {
                    this.pageTextareaLeft.classList.remove('active');
                    this.pageTextareaRight.classList.remove('active');
                }
            });
        });

        // Alternar vista de 2 páginas
        if (this.toggleViewModeBtn) {
            this.toggleViewModeBtn.addEventListener('click', () => {
                this.isTwoPageView = !this.isTwoPageView;

                // Align active index to even number if switching to 2-page view
                if (this.isTwoPageView && this.nbManager.activeNotebookId) {
                    const nb = this.nbManager.getActiveNotebook();
                    if (nb.activePageIndex % 2 !== 0) {
                        this.nbManager.setPageIndex(nb.id, nb.activePageIndex - 1);
                    }
                }

                this.updateViewMode();
                this.loadCurrentPage();
            });
        }

        // Rotar página (solo en modo 1 página)
        if (this.rotatePageBtn) {
            this.rotatePageBtn.addEventListener('click', () => {
                if (this.isTwoPageView) return;

                this.canvasContainerRight.classList.toggle('landscape-mode');

                // Dar tiempo al navegador para aplicar los estilos antes de redimensionar
                setTimeout(() => {
                    this.managers.right.canvas.resizeCanvas();
                }, 50);
            });
        }

        // --- Manejo de Imágenes ---
        this.insertImageBtn.addEventListener('click', () => {
            this.insertImageInput.click();
        });

        this.insertImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImageFile(file);
                // Resetear input
                this.insertImageInput.value = '';
            }
        });

        // Pegar imagen (Ctrl+V)
        document.addEventListener('paste', (e) => {
            // Solo actuar si la libreta está abierta
            if (!this.openView.classList.contains('hidden')) {
                const items = (e.clipboardData || e.originalEvent.clipboardData).items;
                let imagePasted = false;

                for (let index in items) {
                    const item = items[index];
                    if (item.kind === 'file' && item.type.includes('image/')) {
                        const blob = item.getAsFile();
                        this.handleImageFile(blob);
                        imagePasted = true;
                    }
                }

                // Si pegamos una imagen, evitamos que se pegue como texto en línea
                // y cambiamos automáticamente a la herramienta de selección para poder moverla.
                if (imagePasted) {
                    e.preventDefault();
                    const selectBtn = document.querySelector('.tool-btn[data-tool="select"]');
                    if (selectBtn) {
                        selectBtn.click();
                    }
                } else {
                    // Si no es imagen, interceptar el pegado de texto en áreas editables
                    // para forzar que sea texto plano y no traiga fondos blancos o estilos.
                    if (document.activeElement && document.activeElement.isContentEditable) {
                        e.preventDefault();
                        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
                        if (text) {
                            document.execCommand('insertText', false, text);
                        }
                    }
                }
            }
        });

        if (this.addStickyNoteBtn) {
            this.addStickyNoteBtn.addEventListener('click', () => {
                if (!this.nbManager.activeNotebookId) return;
                // We add to the right manager by default as it's the main focus
                this.managers.right.sticky.spawnNoteOnPage();

                // Switch to select tool so the user can drag it
                const selectBtn = document.querySelector('.tool-btn[data-tool="select"]');
                if (selectBtn) selectBtn.click();
            });
        }

        // Guardar texto escrito
        this.pageTextareaLeft.addEventListener('input', (e) => {
            if (!this.nbManager.activeNotebookId) return;
            const nb = this.nbManager.getActiveNotebook();
            if (!nb) return;
            const leftIndex = this.isTwoPageView ? Math.floor(nb.activePageIndex / 2) * 2 : nb.activePageIndex;
            this.nbManager.updatePageText(nb.id, e.target.innerHTML, leftIndex);
        });

        this.pageTextareaRight.addEventListener('input', (e) => {
            if (!this.nbManager.activeNotebookId) return;
            const nb = this.nbManager.getActiveNotebook();
            if (!nb) return;
            const leftIndex = this.isTwoPageView ? Math.floor(nb.activePageIndex / 2) * 2 : nb.activePageIndex;
            const rightIndex = this.isTwoPageView ? leftIndex + 1 : leftIndex;
            this.nbManager.updatePageText(nb.id, e.target.innerHTML, rightIndex);
        });

        // Botones de formato de texto
        const formatBtn = (id, command, value = null) => {
            const btn = document.getElementById(id);
            if (btn) {
                // Prevenir que el botón robe el foco y se pierda la selección del texto
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                });

                btn.addEventListener('click', (e) => {
                    e.stopPropagation();

                    document.execCommand(command, false, value);

                    // Actualizar el estado guardado
                    if (this.nbManager.activeNotebookId) {
                        const nb = this.nbManager.getActiveNotebook();
                        if (nb) {
                            const leftIndex = this.isTwoPageView ? Math.floor(nb.activePageIndex / 2) * 2 : nb.activePageIndex;
                            const rightIndex = this.isTwoPageView ? leftIndex + 1 : leftIndex;
                            this.nbManager.updatePageText(nb.id, this.pageTextareaLeft.innerHTML, leftIndex);
                            if (this.isTwoPageView) {
                                this.nbManager.updatePageText(nb.id, this.pageTextareaRight.innerHTML, rightIndex);
                            }
                        }
                    }
                });
            }
        };

        formatBtn('formatTitleBtn', 'formatBlock', 'H1');
        formatBtn('formatSubBtn', 'formatBlock', 'H2');
        formatBtn('formatNormalBtn', 'formatBlock', 'P');

        formatBtn('justifyLeftBtn', 'justifyLeft');
        formatBtn('justifyCenterBtn', 'justifyCenter');
        formatBtn('justifyRightBtn', 'justifyRight');
        formatBtn('justifyFullBtn', 'justifyFull');

        formatBtn('listBulletedBtn', 'insertUnorderedList');
        formatBtn('listNumberedBtn', 'insertOrderedList');

        if (this.toggleHandwritingBtn) {
            this.toggleHandwritingBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleHandwritingBtn.classList.toggle('active');

                // Toggle mode in the container
                if (this.twoPageWrapper) {
                    this.twoPageWrapper.classList.toggle('handwritten-mode');
                }
            });
        }

        // Ctrl + Z para deshacer dibujo
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'z') {
                if (document.activeElement !== this.pageTextareaLeft && document.activeElement !== this.pageTextareaRight) {
                    e.preventDefault();
                    // Attempt to undo on both? For simplicity just right page if 1 page, or both if 2 page
                    this.managers.right.canvas.undo();
                    if (this.isTwoPageView) this.managers.left.canvas.undo();
                }
            }
        });

        // Guardar dibujo cuando cambia
        this.managers.left.canvas.getCanvasElement().addEventListener('drawingChanged', (e) => {
            if (!this.nbManager.activeNotebookId) return;
            const nb = this.nbManager.getActiveNotebook();
            if (nb) {
                const leftIndex = this.isTwoPageView ? Math.floor(nb.activePageIndex / 2) * 2 : nb.activePageIndex;
                this.nbManager.updatePageDrawing(nb.id, e.detail, leftIndex);
            }
        });

        this.managers.right.canvas.getCanvasElement().addEventListener('drawingChanged', (e) => {
            if (!this.nbManager.activeNotebookId) return;
            const nb = this.nbManager.getActiveNotebook();
            if (nb) {
                const leftIndex = this.isTwoPageView ? Math.floor(nb.activePageIndex / 2) * 2 : nb.activePageIndex;
                const rightIndex = this.isTwoPageView ? leftIndex + 1 : leftIndex;
                this.nbManager.updatePageDrawing(nb.id, e.detail, rightIndex);
            }
        });

        // Cambio de color
        this.colorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            const currentTool = this.managers.left.canvas.currentTool;

            if (currentTool === 'text') {
                this.textColor = color;
                this.pageTextareaLeft.style.color = color;
                this.pageTextareaRight.style.color = color;
            } else {
                this.brushColor = color;
                this.managers.left.canvas.setColor(color);
                this.managers.right.canvas.setColor(color);
            }
        });

        // Cambio de grosor
        if (this.lineWidthSlider) {
            this.lineWidthSlider.addEventListener('input', (e) => {
                const width = parseInt(e.target.value);
                this.managers.left.canvas.setLineWidth(width);
                this.managers.right.canvas.setLineWidth(width);
            });
        }

        // Paginación
        this.prevPageBtn.addEventListener('click', () => {
            const nb = this.nbManager.getActiveNotebook();
            const step = this.isTwoPageView ? 2 : 1;
            if (nb && nb.activePageIndex > 0) {
                let target = nb.activePageIndex - step;
                if (target < 0) target = 0;
                this.nbManager.setPageIndex(nb.id, target);
                this.loadCurrentPage();
            }
        });

        this.nextPageBtn.addEventListener('click', () => {
            const nb = this.nbManager.getActiveNotebook();
            const step = this.isTwoPageView ? 2 : 1;
            if (nb && nb.activePageIndex < nb.pages.length - 1) {
                let target = nb.activePageIndex + step;
                if (target > nb.pages.length - 1) target = nb.pages.length - 1;
                this.nbManager.setPageIndex(nb.id, target);
                this.loadCurrentPage();
            }
        });

        this.addPageBtn.addEventListener('click', () => {
            const nb = this.nbManager.getActiveNotebook();
            if (nb && !nb.isReadOnly) {
                this.nbManager.addPage(nb.id);
                this.loadCurrentPage();
            }
        });

        this.deletePageBtn.addEventListener('click', () => {
            const nb = this.nbManager.getActiveNotebook();
            if (nb && !nb.isReadOnly && nb.pages.length > 1) {
                const now = Date.now();
                if (now - this.lastDeletionTime < 5 * 60 * 1000) {
                    try {
                        if (this.nbManager.deletePage(nb.id)) {
                            this.loadCurrentPage();
                            this.lastDeletionTime = Date.now();
                        } else {
                            alert('Error: deletePage devolvió falso.');
                        }
                    } catch (err) {
                        console.error('Error in delete page logic:', err);
                        alert('Se produjo un error al eliminar: ' + err.message);
                    }
                } else {
                    this.pageToDeleteNotebookId = nb.id;
                    this.deletePageModal.classList.remove('hidden');
                }
            } else if (nb && nb.pages.length === 1) {
                alert('No puedes eliminar la única página de la libreta.');
            }
        });



    }

    checkAndShowBackupWarning() {
        if (!this.backupWarningShown && !this.nbManager.syncFileHandle && this.backupWarningModal) {
            const nb = this.nbManager.getActiveNotebook();
            if (nb && !nb.isReadOnly) {
                this.backupWarningShown = true;
                this.backupWarningModal.classList.remove('hidden');
            }
        }
    }

    renderNotebookList(notebooks, activeId) {
        this.notebookListEl.innerHTML = '';

        notebooks.forEach(nb => {
            const el = document.createElement('div');
            el.className = `notebook-item ${nb.id === activeId ? 'active' : ''}`;
            el.dataset.id = nb.id;

            const styleStr = nb.coverImage
                ? `background-image: url(${nb.coverImage})`
                : `background-color: ${nb.color}`;

            const displayName = nb.name.length > 9 ? nb.name.substring(0, 9) + '...' : nb.name;

            el.innerHTML = `
                <div class="notebook-thumb" style="${styleStr}; position: relative;">
                    ${!nb.isReadOnly ? `<button class="delete-notebook-btn" title="Eliminar Libreta" style="position: absolute; top: -8px; left: -8px; width: 22px; height: 22px; border-radius: 50%; background: #ff4757; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; box-shadow: 0 2px 5px rgba(0,0,0,0.3); z-index: 10;"><i class="ph ph-x"></i></button>` : ''}
                </div>
                <span title="${nb.name}">${displayName}</span>
            `;

            el.addEventListener('click', (e) => {
                if (e.target.closest('.delete-notebook-btn')) {
                    e.stopPropagation();
                    const now = Date.now();
                    if (now - this.lastNotebookDeletionTime < 5 * 60 * 1000) {
                        this.nbManager.deleteNotebook(nb.id);
                        this.lastNotebookDeletionTime = Date.now();
                    } else {
                        this.notebookToDeleteId = nb.id;
                        this.deleteNotebookModal.classList.remove('hidden');
                    }
                    return;
                }

                this.nbManager.setActiveNotebook(nb.id);

                // Si es el manual, saltarse la portada y abrirlo directamente
                if (nb.name === 'MANUAL') {
                    this.openNotebook();
                }

                // Cerrar menú en móviles si está abierto
                if (this.sidebar && this.sidebar.classList.contains('show')) {
                    this.sidebar.classList.remove('show');
                }
            });

            this.notebookListEl.appendChild(el);
        });
    }

    updateCoverView(notebook) {
        if (!notebook) return;

        const isReadonly = !!notebook.isReadOnly;
        const isManual = isReadonly && notebook.name === 'MANUAL';

        this.activeNotebookCover.style.setProperty('--cover-color', notebook.color);
        if (notebook.coverImage) {
            this.activeNotebookCover.style.backgroundImage = `url(${notebook.coverImage})`;
        } else {
            this.activeNotebookCover.style.backgroundImage = 'none';
        }

        this.activeNotebookTitle.textContent = notebook.name;
        this.activeNotebookTitle.style.color = notebook.titleColor || '#ffffff';
        this.activeNotebookTitle.style.fontFamily = notebook.titleFont || "'Outfit', sans-serif";
        this.titleColorInput.value = notebook.titleColor || '#ffffff';
        this.coverColorInput.value = notebook.color || '#0b5394';
        this.titleFontSelect.value = notebook.titleFont || "'Outfit', sans-serif";

        let manualIcons = this.activeNotebookCover.querySelector('.manual-cover-premium');
        if (isManual) {
            this.activeNotebookCover.classList.add('manual-mode');
            this.activeNotebookTitle.style.display = 'none';
            const topActions = this.activeNotebookCover.querySelector('.top-corner-actions');
            if (topActions) topActions.style.display = 'none';

            if (!manualIcons) {
                manualIcons = document.createElement('div');
                manualIcons.className = 'manual-cover-premium';
                this.activeNotebookCover.appendChild(manualIcons);
            }
            manualIcons.innerHTML = `<h2 class="manual-empty-text">inicia tus apuntes creando una libreta</h2>`;

            // Si es el manual, saltamos la vista de portada automáticamente
            setTimeout(() => {
                if (this.nbManager.activeNotebookId === notebook.id && !this.openView.classList.contains('hidden') === false) {
                    this.openNotebook();
                }
            }, 50);

        } else {
            this.activeNotebookCover.classList.remove('manual-mode');
            this.activeNotebookTitle.style.display = 'block';
            const topActions = this.activeNotebookCover.querySelector('.top-corner-actions');
            if (topActions) topActions.style.display = isReadonly ? 'none' : 'flex';
            if (manualIcons) {
                manualIcons.remove();
            }
        }

        // Bloquear edición si es read-only
        this.activeNotebookTitle.setAttribute('contenteditable', isReadonly ? 'false' : 'true');
        this.changeCoverBtn.style.display = isReadonly ? 'none' : 'block';
        const topActions = document.querySelector('.top-corner-actions');
        if (topActions) topActions.style.display = isReadonly ? 'none' : 'flex';
    }

    openNotebook() {
        this.coverView.classList.add('hidden');
        this.openView.classList.remove('hidden');

        this.updateViewMode();
        this.loadCurrentPage();

        // Asegurar que el canvas tome el tamaño correcto
        this.managers.left.canvas.resizeCanvas();
        this.managers.right.canvas.resizeCanvas();
        // Seleccionar la herramienta de texto por defecto al entrar
        const textToolBtn = document.querySelector('.tool-btn[data-tool="text"]');
        if (textToolBtn) {
            textToolBtn.click();
        }
    }

    updateViewMode() {
        if (!this.twoPageWrapper) return;
        if (this.isTwoPageView) {
            this.twoPageWrapper.classList.remove('single-page-mode');
            if (this.toggleViewModeBtn) this.toggleViewModeBtn.classList.add('active');

            // Hide rotate button and reset landscape mode in 2-page view
            if (this.rotatePageBtn) this.rotatePageBtn.style.display = 'none';
            if (this.canvasContainerRight.classList.contains('landscape-mode')) {
                this.canvasContainerRight.classList.remove('landscape-mode');
                // Wait for CSS reflow to resize canvas
                setTimeout(() => this.managers.right.canvas.resizeCanvas(), 50);
            }
        } else {
            this.twoPageWrapper.classList.add('single-page-mode');
            if (this.toggleViewModeBtn) this.toggleViewModeBtn.classList.remove('active');

            // Show rotate button in 1-page view
            if (this.rotatePageBtn) this.rotatePageBtn.style.display = 'inline-flex';
        }
    }

    loadCurrentPage() {
        const nb = this.nbManager.getActiveNotebook();
        const isReadonly = nb ? !!nb.isReadOnly : false;

        if (nb) {
            let leftIndex = nb.activePageIndex;
            let rightIndex = nb.activePageIndex;

            if (this.isTwoPageView) {
                // Force leftIndex to be even
                leftIndex = Math.floor(nb.activePageIndex / 2) * 2;
                rightIndex = leftIndex + 1;
            }

            const leftPage = nb.pages[leftIndex];
            const rightPage = nb.pages[rightIndex];

            // Cargar página izquierda (si existe y estamos en modo 2 páginas)
            if (this.isTwoPageView && leftPage) {
                this.pageTextareaLeft.innerHTML = leftPage.pageText || '';
                this.managers.left.canvas.clearCanvas(true);
                if (leftPage.pageDrawing) this.managers.left.canvas.loadDrawing(leftPage.pageDrawing);
                this.managers.left.image.loadImages(leftPage.pageImages || [], leftIndex);
                this.managers.left.sticky.loadNotes(leftPage.pageNotes || [], leftIndex);

                if (this.canvasContainerLeft) {
                    this.canvasContainerLeft.style.visibility = 'visible';
                }
            } else {
                this.pageTextareaLeft.innerHTML = '';
                this.managers.left.canvas.clearCanvas(true);
                this.managers.left.image.loadImages([], leftIndex);
                this.managers.left.sticky.loadNotes([], leftIndex);

                if (this.canvasContainerLeft && this.isTwoPageView) {
                    this.canvasContainerLeft.style.visibility = 'hidden';
                }
            }

            if (!this.isTwoPageView && this.canvasContainerLeft) {
                this.canvasContainerLeft.style.visibility = 'visible'; // En modo 1 página esto se oculta vía CSS igual, pero lo dejamos visible
            }

            // Cargar página derecha (siempre activa, es la única en modo 1 página)
            const targetRightPage = this.isTwoPageView ? rightPage : leftPage;
            const targetRightIndex = this.isTwoPageView ? rightIndex : leftIndex;

            if (targetRightPage) {
                this.pageTextareaRight.innerHTML = targetRightPage.pageText || '';
                this.managers.right.canvas.clearCanvas(true);
                if (targetRightPage.pageDrawing) this.managers.right.canvas.loadDrawing(targetRightPage.pageDrawing);
                this.managers.right.image.loadImages(targetRightPage.pageImages || [], targetRightIndex);
                this.managers.right.sticky.loadNotes(targetRightPage.pageNotes || [], targetRightIndex);

                if (this.canvasContainerRight) {
                    this.canvasContainerRight.style.visibility = 'visible';
                }
            } else {
                this.pageTextareaRight.innerHTML = '';
                this.managers.right.canvas.clearCanvas(true);
                this.managers.right.image.loadImages([], targetRightIndex);
                this.managers.right.sticky.loadNotes([], targetRightIndex);

                if (this.canvasContainerRight && this.isTwoPageView) {
                    this.canvasContainerRight.style.visibility = 'hidden';
                }
            }

            // Ensure visibility is restored if we switch back to single page mode
            if (!this.isTwoPageView && this.canvasContainerRight) {
                this.canvasContainerRight.style.visibility = 'visible';
            }

            // Actualizar indicador de página
            if (this.isTwoPageView) {
                const rightStr = rightIndex < nb.pages.length ? rightIndex + 1 : '-';
                this.pageIndicator.textContent = `${leftIndex + 1}-${rightStr} / ${nb.pages.length}`;
            } else {
                this.pageIndicator.textContent = `${nb.activePageIndex + 1} / ${nb.pages.length}`;
            }

            // Actualizar botones de paginación
            this.prevPageBtn.disabled = this.isTwoPageView ? leftIndex === 0 : nb.activePageIndex === 0;
            this.nextPageBtn.disabled = this.isTwoPageView ? rightIndex >= nb.pages.length - 1 : nb.activePageIndex === nb.pages.length - 1;
            this.prevPageBtn.style.opacity = this.prevPageBtn.disabled ? '0.5' : '1';
            this.nextPageBtn.style.opacity = this.nextPageBtn.disabled ? '0.5' : '1';

            // Add/Delete page disabled for readonly
            this.addPageBtn.style.display = isReadonly ? 'none' : 'inline-block';
            this.deletePageBtn.style.display = isReadonly ? 'none' : 'inline-block';
        } else {
            this.pageTextareaLeft.innerHTML = '';
            this.pageTextareaRight.innerHTML = '';
            this.managers.left.canvas.clearCanvas(true);
            this.managers.right.canvas.clearCanvas(true);
            this.managers.left.image.loadImages([]);
            this.managers.right.image.loadImages([]);
            this.pageIndicator.textContent = '1 / 1';
        }

        this.pageTextareaLeft.setAttribute('contenteditable', isReadonly ? 'false' : 'true');
        this.pageTextareaRight.setAttribute('contenteditable', isReadonly ? 'false' : 'true');

        // Ocultar toolbar e interacciones si es read-only
        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            toolbar.style.display = isReadonly ? 'none' : '';
        }

        // Ocultar dispensador de notas si es de solo lectura
        const dispenserWrapper = document.getElementById('stickyDispenserWrapper');
        if (dispenserWrapper) {
            dispenserWrapper.style.display = isReadonly ? 'none' : 'flex';
        }

        // Ocultar botón de cerrar si es el manual en la toolbar original
        if (this.closeNotebookBtn) {
            this.closeNotebookBtn.style.display = (isReadonly && nb && nb.name === 'MANUAL') ? 'none' : 'flex';
        }

        // Mostrar botón de cerrado flotante solo si la libreta es de solo lectura (y la toolbar normal está oculta)
        const floatingCloseBtn = document.getElementById('floatingCloseBtn');
        if (floatingCloseBtn) {
            if (isReadonly) {
                floatingCloseBtn.classList.remove('hidden');
            } else {
                floatingCloseBtn.classList.add('hidden');
            }
        }

        this.managers.left.canvas.isReadOnly = isReadonly;
        this.managers.right.canvas.isReadOnly = isReadonly;
        this.managers.left.image.isReadOnly = isReadonly;
        this.managers.right.image.isReadOnly = isReadonly;
        this.managers.left.sticky.isReadOnly = isReadonly;
        this.managers.right.sticky.isReadOnly = isReadonly;
    }

    closeNotebook() {
        this.openView.classList.add('hidden');
        this.coverView.classList.remove('hidden');
    }

    showModal() {
        this.newNotebookNameInput.value = '';
        this.newNotebookModal.classList.remove('hidden');
        this.newNotebookNameInput.focus();
    }

    hideModal() {
        this.newNotebookModal.classList.add('hidden');
    }

    // Función auxiliar para procesar el archivo de imagen e insertarlo
    handleImageFile(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            // Aquí podríamos implementar compresión usando un canvas temporal si el archivo es muy grande
            // Para simplificar, lo pasamos directamente
            this.managers.right.image.addImage(event.target.result);
        };
        reader.readAsDataURL(file);
    }
}
