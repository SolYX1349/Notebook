import { ExportUtils } from '../utils/exportUtils.js';
import { CodeHighlighter } from '../utils/codeHighlighter.js';

export class UIController {
    constructor(notebookManager, managers) {
        this.nbManager = notebookManager;
        this.managers = managers;
        this.isTwoPageView = false;

        const isDark = localStorage.getItem('glass_theme') !== 'light';
        const defaultColor = isDark ? '#ffffff' : '#222222';

        this.textColor = defaultColor;
        this.brushColor = defaultColor;

        this.backupWarningShown = false;
        this.isAutoPaging = false;
        this.savedTextRange = null;

        this.notebookListEl = document.getElementById('notebookList');

        this.coverView = document.getElementById('coverView');
        this.openView = document.getElementById('openView');

        this.activeNotebookCover = document.getElementById('activeNotebookCover');
        this.activeNotebookTitle = document.getElementById('activeNotebookTitle');
        this.changeCoverBtn = document.getElementById('changeCoverBtn');
        this.coverImageInput = document.getElementById('coverImageInput');
        this.titleColorInput = document.getElementById('titleColorInput');
        this.coverColorInput = document.getElementById('coverColorInput');
        this.titleFontSelect = document.getElementById('titleFontSelect');

        this.toolBtns = document.querySelectorAll('.tool-btn[data-tool]');
        this.colorPicker = document.getElementById('colorPicker');
        this.closeNotebookBtn = document.getElementById('closeNotebookBtn');
        this.pageTextareaLeft = document.getElementById('pageTextareaLeft');
        this.pageTextareaRight = document.getElementById('pageTextareaRight');

        this.canvasContainerLeft = document.getElementById('canvasContainerLeft');
        this.canvasContainerRight = document.getElementById('canvasContainerRight');
        this.twoPageWrapper = document.getElementById('twoPageWrapper');
        this.toggleViewModeBtn = document.getElementById('toggleViewModeBtn');
        this.rotatePageBtn = document.getElementById('rotatePageBtn');
        this.insertImageBtn = document.getElementById('insertImageBtn');
        this.insertImageInput = document.getElementById('insertImageInput');
        this.addStickyNoteBtn = document.getElementById('addStickyNoteBtn');
        this.toggleHandwritingBtn = document.getElementById('toggleHandwritingBtn');

        this.pageIndicator = document.getElementById('pageIndicator');
        this.prevPageBtn = document.getElementById('prevPageBtn');
        this.nextPageBtn = document.getElementById('nextPageBtn');
        this.addPageBtn = document.getElementById('addPageBtn');
        this.deletePageBtn = document.getElementById('deletePageBtn');
        this.pageIndicator = document.getElementById('pageIndicator');

        this.colorPicker = document.getElementById('colorPicker');
        if (this.colorPicker) {
            this.colorPicker.value = this.textColor;
        }
        this.lineWidthSlider = document.getElementById('lineWidthSlider');

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

        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.sidebar = document.querySelector('.sidebar');
    }

    init() {
        this.loadTheme();
        this.bindEvents();
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('glass_theme');
        const isDark = savedTheme !== 'light';
        if (!isDark) {
            document.body.classList.remove('dark-theme');
            document.documentElement.setAttribute('data-bs-theme', 'light');
            if (this.themeToggleBtn) this.themeToggleBtn.innerHTML = '<i class="ph ph-moon"></i>';
            this.textColor = '#1e293b';
            this.brushColor = '#1e293b';
            if (this.colorPicker) this.colorPicker.value = '#1e293b';
        } else {
            document.body.classList.add('dark-theme');
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            if (this.themeToggleBtn) this.themeToggleBtn.innerHTML = '<i class="ph ph-sun"></i>';
            localStorage.setItem('glass_theme', 'dark');
            this.textColor = '#ffffff';
            this.brushColor = '#ffffff';
            if (this.colorPicker) this.colorPicker.value = '#ffffff';
        }
    }

    bindEvents() {
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
                this.showModal(this.saveNotebookModal);
            });
        }

        if (this.importFromPcBtn) {
            this.importFromPcBtn.addEventListener('click', async () => {
                await this.nbManager.importDatabaseFromPC();
            });
        }

        if (this.cancelSaveNotebookBtn) {
            this.cancelSaveNotebookBtn.addEventListener('click', () => {
                this.hideModal(this.saveNotebookModal);
            });
        }

        if (this.confirmSaveNotebookBtn) {
            this.confirmSaveNotebookBtn.addEventListener('click', async () => {
                this.hideModal(this.saveNotebookModal);
                await this.nbManager.exportDatabaseToPC();
            });
        }

        if (this.closeBackupWarningBtn) {
            this.closeBackupWarningBtn.addEventListener('click', () => {
                this.backupWarningModal.classList.add('hidden');
            });
        }

        this.cancelNewNotebookBtn.addEventListener('click', () => this.hideModal(this.newNotebookModal));
        this.confirmNewNotebookBtn.addEventListener('click', () => {
            const name = this.newNotebookNameInput.value.trim() || 'Nueva Libreta';
            const color = this.newNotebookColorInput.value;
            this.nbManager.createNotebook(name, color);

            const customNotebooksCount = this.nbManager.notebooks.filter(n => !n.isReadOnly).length;
            if (customNotebooksCount === 1) {
                this.checkAndShowBackupWarning();
            }

            this.hideModal(this.newNotebookModal);
        });

        this.newNotebookNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.confirmNewNotebookBtn.click();
            }
        });

        this.cancelDeletePageBtn.addEventListener('click', () => {
            this.hideModal(this.deletePageModal);
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
                this.hideModal(this.deletePageModal);
                this.pageToDeleteNotebookId = null;
            }
        });

        this.cancelDeleteNotebookBtn.addEventListener('click', () => {
            this.hideModal(this.deleteNotebookModal);
            this.notebookToDeleteId = null;
        });

        this.confirmDeleteNotebookBtn.addEventListener('click', () => {
            if (this.notebookToDeleteId) {
                this.nbManager.deleteNotebook(this.notebookToDeleteId);
                this.lastNotebookDeletionTime = Date.now();
                this.hideModal(this.deleteNotebookModal);
                this.notebookToDeleteId = null;
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal(this.newNotebookModal);
                this.hideModal(this.saveNotebookModal);
                this.hideModal(this.deleteNotebookModal);
                this.notebookToDeleteId = null;
                this.hideModal(this.deletePageModal);
                this.pageToDeleteNotebookId = null;
                if (!this.openView.classList.contains('hidden')) {
                    this.closeNotebook();
                }
            }
        });

        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => {
                const isDark = document.body.classList.toggle('dark-theme');
                localStorage.setItem('glass_theme', isDark ? 'dark' : 'light');
                document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
                this.themeToggleBtn.innerHTML = isDark ? '<i class="ph ph-sun"></i>' : '<i class="ph ph-moon"></i>';

                const newBaseColor = isDark ? '#ffffff' : '#1e293b';
                this.textColor = newBaseColor;
                this.brushColor = newBaseColor;
                if (this.colorPicker) this.colorPicker.value = newBaseColor;
                if (this.managers.left && this.managers.left.canvas) this.managers.left.canvas.setColor(newBaseColor);
                if (this.managers.right && this.managers.right.canvas) this.managers.right.canvas.setColor(newBaseColor);

                this.pageTextareaLeft.style.color = '';
                this.pageTextareaRight.style.color = '';

                this.adaptActiveNotebookTextColors(isDark);
            });
        }

        const toggleSidebar = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (window.bootstrap && window.bootstrap.Offcanvas) {
                const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(this.sidebar);
                offcanvas.toggle();
            } else {
                this.sidebar.classList.toggle('show');
            }
        };

        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', toggleSidebar);
        }

        const mobileMenuOpenBtn = document.getElementById('mobileMenuOpenBtn');
        if (mobileMenuOpenBtn) {
            mobileMenuOpenBtn.addEventListener('click', toggleSidebar);
        }

        const collapseSidebarBtn = document.getElementById('collapseSidebarBtn');
        if (collapseSidebarBtn) {
            collapseSidebarBtn.addEventListener('click', (e) => {
                if (e) e.stopPropagation();
                this.closeMobileSidebar();
            });
        }

        window.addEventListener('beforeunload', () => {
            const isNotebookOpen = this.openView && !this.openView.classList.contains('hidden');
            if (isNotebookOpen) {
                this.saveCurrentOpenPage();
            }
        });

        this.activeNotebookCover.addEventListener('click', (e) => {
            if (e.target.closest('.top-corner-actions') || e.target.closest('.cover-title')) {
                return;
            }
            this.openNotebook();
        });
        this.closeNotebookBtn.addEventListener('click', () => this.closeNotebook());

        this.changeCoverBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.coverImageInput.click();
        });

        this.coverImageInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        this.titleColorInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        this.titleFontSelect.addEventListener('click', (e) => {
            e.stopPropagation();
        });

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

        this.coverColorInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        this.coverColorInput.addEventListener('input', (e) => {
            const color = e.target.value;
            this.activeNotebookCover.style.setProperty('--cover-color', color);

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

        this.activeNotebookTitle.setAttribute('contenteditable', 'true');
        this.activeNotebookTitle.title = "Haz clic para editar el nombre";

        this.activeNotebookTitle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.activeNotebookTitle.blur();
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

        this.toolBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.toolBtns.forEach(b => b.classList.remove('active'));

                const targetBtn = e.currentTarget;
                targetBtn.classList.add('active');

                const toolName = targetBtn.dataset.tool;
                this.managers.left.canvas.setTool(toolName);
                this.managers.right.canvas.setTool(toolName);

                const toolDefaults = { pen: 6, pencil: 2, crayon: 15, eraser: 20 };
                if (this.lineWidthSlider && toolDefaults[toolName]) {
                    this.lineWidthSlider.value = toolDefaults[toolName];
                    this.managers.left.canvas.setLineWidth(toolDefaults[toolName]);
                    this.managers.right.canvas.setLineWidth(toolDefaults[toolName]);
                    const lineWidthVal = document.getElementById('lineWidthValue');
                    if (lineWidthVal) {
                        lineWidthVal.textContent = `${toolDefaults[toolName]}px`;
                    }
                }

                if (this.colorPicker) {
                    this.colorPicker.value = (toolName === 'text') ? this.textColor : this.brushColor;
                }

                if (toolName === 'text' || toolName === 'select') {
                    this.pageTextareaLeft.classList.add('active');
                    this.pageTextareaRight.classList.add('active');
                    const targetArea = (this.isTwoPageView && document.activeElement === this.pageTextareaLeft)
                        ? this.pageTextareaLeft
                        : this.pageTextareaRight;
                    targetArea.focus();

                    if (toolName === 'select') {
                        const range = document.createRange();
                        range.selectNodeContents(targetArea);
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                } else {
                    this.pageTextareaLeft.classList.remove('active');
                    this.pageTextareaRight.classList.remove('active');
                }
            });
        });

        if (this.toggleViewModeBtn) {
            this.toggleViewModeBtn.addEventListener('click', () => {
                this.isTwoPageView = !this.isTwoPageView;

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

        if (this.rotatePageBtn) {
            this.rotatePageBtn.addEventListener('click', () => {
                if (this.isTwoPageView) return;

                this.canvasContainerRight.classList.toggle('landscape-mode');

                setTimeout(() => {
                    this.managers.right.canvas.resizeCanvas();
                }, 50);
            });
        }

        this.insertImageBtn.addEventListener('click', () => {
            this.insertImageInput.click();
        });

        this.insertImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImageFile(file);
                this.insertImageInput.value = '';
            }
        });

        document.addEventListener('paste', (e) => {
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

                if (imagePasted) {
                    e.preventDefault();
                    const selectBtn = document.querySelector('.tool-btn[data-tool="select"]');
                    if (selectBtn) {
                        selectBtn.click();
                    }
                } else {
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
                this.managers.right.sticky.spawnNoteOnPage();

                const selectBtn = document.querySelector('.tool-btn[data-tool="select"]');
                if (selectBtn) selectBtn.click();
            });
        }

        this.pageTextareaLeft.addEventListener('input', (e) => {
            if (!this.nbManager.activeNotebookId) return;
            const nb = this.nbManager.getActiveNotebook();
            if (!nb) return;
            const leftIndex = this.isTwoPageView ? Math.floor(nb.activePageIndex / 2) * 2 : nb.activePageIndex;
            this.nbManager.updatePageText(nb.id, e.target.innerHTML, leftIndex);
            this.checkAndHandleTextOverflow(this.pageTextareaLeft, true);
        });

        this.pageTextareaRight.addEventListener('input', (e) => {
            if (!this.nbManager.activeNotebookId) return;
            const nb = this.nbManager.getActiveNotebook();
            if (!nb) return;
            const leftIndex = this.isTwoPageView ? Math.floor(nb.activePageIndex / 2) * 2 : nb.activePageIndex;
            const rightIndex = this.isTwoPageView ? leftIndex + 1 : leftIndex;
            this.nbManager.updatePageText(nb.id, e.target.innerHTML, rightIndex);
            this.checkAndHandleTextOverflow(this.pageTextareaRight, false);
        });

        const formatBtn = (id, command, value = null) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                });

                btn.addEventListener('click', (e) => {
                    e.stopPropagation();

                    this.pageTextareaLeft.classList.add('active');
                    this.pageTextareaRight.classList.add('active');

                    const textToolBtn = document.querySelector('.tool-btn[data-tool="text"]');
                    if (textToolBtn && !textToolBtn.classList.contains('active')) {
                        this.toolBtns.forEach(b => b.classList.remove('active'));
                        textToolBtn.classList.add('active');
                        this.managers.left.canvas.setTool('text');
                        this.managers.right.canvas.setTool('text');
                    }

                    document.execCommand(command, false, value);

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

                    if (this.isTwoPageView && document.activeElement === this.pageTextareaLeft) {
                        this.pageTextareaLeft.focus();
                    } else {
                        this.pageTextareaRight.focus();
                    }
                });
            }
        };

        formatBtn('formatTitleBtn', 'formatBlock', 'H1');
        formatBtn('formatSubBtn', 'formatBlock', 'H2');
        formatBtn('formatNormalBtn', 'formatBlock', 'P');

        formatBtn('formatBoldBtn', 'bold');
        formatBtn('formatItalicBtn', 'italic');
        formatBtn('formatUnderlineBtn', 'underline');

        const formatCodeBtn = document.getElementById('formatCodeBtn');
        if (formatCodeBtn) {
            formatCodeBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
            });

            formatCodeBtn.addEventListener('click', (e) => {
                e.stopPropagation();

                this.pageTextareaLeft.classList.add('active');
                this.pageTextareaRight.classList.add('active');

                const textToolBtn = document.querySelector('.tool-btn[data-tool="text"]');
                if (textToolBtn && !textToolBtn.classList.contains('active')) {
                    this.toolBtns.forEach(b => b.classList.remove('active'));
                    textToolBtn.classList.add('active');
                    this.managers.left.canvas.setTool('text');
                    this.managers.right.canvas.setTool('text');
                }

                const sel = window.getSelection();
                let range = null;

                if (sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed) {
                    const candidateRange = sel.getRangeAt(0);
                    const container = candidateRange.commonAncestorContainer;
                    if ((this.pageTextareaRight && this.pageTextareaRight.contains(container)) ||
                        (this.pageTextareaLeft && this.pageTextareaLeft.contains(container))) {
                        range = candidateRange;
                    }
                }

                if (!range && this.savedTextRange && !this.savedTextRange.collapsed) {
                    const container = this.savedTextRange.commonAncestorContainer;
                    if ((this.pageTextareaRight && this.pageTextareaRight.contains(container)) ||
                        (this.pageTextareaLeft && this.pageTextareaLeft.contains(container))) {
                        range = this.savedTextRange;
                    }
                }

                if (!range) return;

                const selectedText = range.toString();
                if (!selectedText || selectedText.trim().length === 0) return;

                sel.removeAllRanges();
                sel.addRange(range);

                const highlightedHtml = CodeHighlighter.formatSelectionInline(selectedText, 'auto');
                const htmlToInsert = `${highlightedHtml}&#8203;`;

                let inserted = false;
                try {
                    inserted = document.execCommand('insertHTML', false, htmlToInsert);
                } catch (err) {
                    inserted = false;
                }

                if (!inserted) {
                    range.deleteContents();
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlToInsert;
                    const frag = document.createDocumentFragment();
                    let node;
                    let lastNode;
                    while ((node = tempDiv.firstChild)) {
                        lastNode = node;
                        frag.appendChild(node);
                    }
                    range.insertNode(frag);
                    if (lastNode) {
                        range.setStartAfter(lastNode);
                        range.setEndAfter(lastNode);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                }

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

                this.savedTextRange = null;

                if (this.isTwoPageView && document.activeElement === this.pageTextareaLeft) {
                    this.pageTextareaLeft.focus();
                } else {
                    this.pageTextareaRight.focus();
                }
            });
        }

        formatBtn('justifyLeftBtn', 'justifyLeft');
        formatBtn('justifyCenterBtn', 'justifyCenter');
        formatBtn('justifyRightBtn', 'justifyRight');
        formatBtn('justifyFullBtn', 'justifyFull');

        formatBtn('listBulletedBtn', 'insertUnorderedList');
        formatBtn('listNumberedBtn', 'insertOrderedList');

        const pageContentRight = document.getElementById('pageContentRight');
        if (pageContentRight) {
            pageContentRight.addEventListener('click', (e) => {
                if (e.target !== this.pageTextareaRight && !e.target.closest('.sticky-note') && !e.target.closest('.image-widget') && !e.target.closest('.widget-controls')) {
                    const currentTool = this.managers.right.canvas.currentTool;
                    if (currentTool === 'text' || !currentTool) {
                        this.pageTextareaRight.classList.add('active');
                        this.pageTextareaRight.focus();
                    }
                }
            });
        }

        const pageContentLeft = document.getElementById('pageContentLeft');
        if (pageContentLeft) {
            pageContentLeft.addEventListener('click', (e) => {
                if (e.target !== this.pageTextareaLeft && !e.target.closest('.sticky-note') && !e.target.closest('.image-widget') && !e.target.closest('.widget-controls')) {
                    const currentTool = this.managers.left.canvas.currentTool;
                    if (currentTool === 'text' || !currentTool) {
                        this.pageTextareaLeft.classList.add('active');
                        this.pageTextareaLeft.focus();
                    }
                }
            });
        }

        if (this.toggleHandwritingBtn) {
            this.toggleHandwritingBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleHandwritingBtn.classList.toggle('active');

                if (this.twoPageWrapper) {
                    this.twoPageWrapper.classList.toggle('handwritten-mode');
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'z') {
                if (document.activeElement !== this.pageTextareaLeft && document.activeElement !== this.pageTextareaRight) {
                    e.preventDefault();
                    this.managers.right.canvas.undo();
                    if (this.isTwoPageView) this.managers.left.canvas.undo();
                }
            }
        });

        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.managers.right.canvas.undo();
                if (this.isTwoPageView) this.managers.left.canvas.undo();
            });
        }

        const clearCanvasBtn = document.getElementById('clearCanvasBtn');
        if (clearCanvasBtn) {
            clearCanvasBtn.addEventListener('click', () => {
                const confirmed = window.confirm('¿Deseas limpiar todos los trazos de esta página?');
                if (confirmed) {
                    this.managers.right.canvas.clearCanvas();
                    if (this.isTwoPageView) this.managers.left.canvas.clearCanvas();
                }
            });
        }

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

        const trackTextSelection = () => {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                if (!range.collapsed) {
                    const container = range.commonAncestorContainer;
                    if ((this.pageTextareaRight && this.pageTextareaRight.contains(container)) ||
                        (this.pageTextareaLeft && this.pageTextareaLeft.contains(container))) {
                        this.savedTextRange = range.cloneRange();
                    }
                }
            }
        };

        document.addEventListener('selectionchange', trackTextSelection);

        if (this.colorPicker) {
            this.colorPicker.addEventListener('mousedown', trackTextSelection);
            this.colorPicker.addEventListener('touchstart', trackTextSelection, { passive: true });

            const handleColorPickerChange = (e) => {
                const color = e.target.value;
                const currentTool = this.managers.left.canvas.currentTool;

                if (currentTool === 'text' || currentTool === 'select') {
                    this.textColor = color;

                    let hasAppliedToSelection = false;
                    const sel = window.getSelection();

                    if (this.savedTextRange && !this.savedTextRange.collapsed) {
                        sel.removeAllRanges();
                        sel.addRange(this.savedTextRange);
                        document.execCommand('styleWithCSS', false, true);
                        document.execCommand('foreColor', false, color);
                        hasAppliedToSelection = true;
                    } else if (sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed) {
                        document.execCommand('styleWithCSS', false, true);
                        document.execCommand('foreColor', false, color);
                        hasAppliedToSelection = true;
                    }

                    if (hasAppliedToSelection) {
                        if (!this.nbManager.activeNotebookId) return;
                        const nb = this.nbManager.getActiveNotebook();
                        if (nb && !nb.isReadOnly) {
                            const leftIndex = this.isTwoPageView ? Math.floor(nb.activePageIndex / 2) * 2 : nb.activePageIndex;
                            const rightIndex = this.isTwoPageView ? leftIndex + 1 : leftIndex;
                            if (this.pageTextareaRight) {
                                this.nbManager.updatePageText(nb.id, this.pageTextareaRight.innerHTML, rightIndex);
                            }
                            if (this.isTwoPageView && this.pageTextareaLeft) {
                                this.nbManager.updatePageText(nb.id, this.pageTextareaLeft.innerHTML, leftIndex);
                            }
                        }
                    } else {
                        document.execCommand('styleWithCSS', false, true);
                        document.execCommand('foreColor', false, color);
                    }
                } else {
                    this.brushColor = color;
                    this.managers.left.canvas.setColor(color);
                    this.managers.right.canvas.setColor(color);
                }
            };

            this.colorPicker.addEventListener('input', handleColorPickerChange);
            this.colorPicker.addEventListener('change', handleColorPickerChange);
        }

        if (this.lineWidthSlider) {
            const lineWidthVal = document.getElementById('lineWidthValue');
            if (lineWidthVal) {
                lineWidthVal.textContent = `${this.lineWidthSlider.value}px`;
            }
            this.lineWidthSlider.addEventListener('input', (e) => {
                const width = parseInt(e.target.value);
                this.managers.left.canvas.setLineWidth(width);
                this.managers.right.canvas.setLineWidth(width);
                if (lineWidthVal) {
                    lineWidthVal.textContent = `${width}px`;
                }
            });
        }

        const colorPresets = document.querySelectorAll('.color-preset-btn');
        colorPresets.forEach(presetBtn => {
            presetBtn.addEventListener('click', (e) => {
                const color = e.currentTarget.dataset.color;
                if (this.colorPicker) {
                    this.colorPicker.value = color;
                    this.colorPicker.dispatchEvent(new Event('input', { bubbles: true }));
                    this.colorPicker.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });

        const toggleToolbarBtn = document.getElementById('toggleToolbarBtn');
        const secondaryToolbar = document.getElementById('secondaryToolbar');
        if (toggleToolbarBtn && secondaryToolbar) {
            const isCollapsed = localStorage.getItem('toolbar_secondary_collapsed') === 'true';
            if (isCollapsed) {
                secondaryToolbar.classList.add('collapsed');
                toggleToolbarBtn.classList.remove('active');
                toggleToolbarBtn.setAttribute('title', 'Desplegar barra secundaria');
                toggleToolbarBtn.setAttribute('aria-expanded', 'false');
            } else {
                secondaryToolbar.classList.remove('collapsed');
                toggleToolbarBtn.classList.add('active');
                toggleToolbarBtn.setAttribute('title', 'Plegar barra secundaria');
                toggleToolbarBtn.setAttribute('aria-expanded', 'true');
            }

            toggleToolbarBtn.addEventListener('click', () => {
                const collapsed = secondaryToolbar.classList.toggle('collapsed');
                toggleToolbarBtn.classList.toggle('active', !collapsed);
                toggleToolbarBtn.setAttribute('title', collapsed ? 'Desplegar barra secundaria' : 'Plegar barra secundaria');
                toggleToolbarBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
                localStorage.setItem('toolbar_secondary_collapsed', collapsed ? 'true' : 'false');
            });
        }

        const exportPageBtn = document.getElementById('exportPageBtn');
        if (exportPageBtn) {
            exportPageBtn.addEventListener('click', () => {
                const activeCanvas = this.managers.right.canvas.getCanvasElement();
                if (activeCanvas) {
                    const nb = this.nbManager.getActiveNotebook();
                    const pageNum = nb ? nb.activePageIndex + 1 : 1;
                    const safeName = (nb ? nb.name : 'Libreta').replace(/[^a-zA-Z0-9_\-]/g, '_');
                    ExportUtils.exportCanvasToImage(activeCanvas, `${safeName}_pagina_${pageNum}.png`);
                }
            });
        }

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
            if (!nb || nb.isReadOnly) return;
            this.nbManager.addPage(nb.id);
            this.loadCurrentPage();
        });

        this.deletePageBtn.addEventListener('click', () => {
            const nb = this.nbManager.getActiveNotebook();
            if (!nb || nb.isReadOnly) return;
            if (nb.pages.length > 1) {
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
                    this.showModal(this.deletePageModal);
                }
            } else if (nb.pages.length === 1) {
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
                        this.showModal(this.deleteNotebookModal);
                    }
                    return;
                }

                const isNotebookOpen = this.openView && !this.openView.classList.contains('hidden');

                if (isNotebookOpen) {
                    if (this.nbManager.activeNotebookId === nb.id) {
                        this.closeMobileSidebar();
                        return;
                    }

                    this.saveCurrentOpenPage();
                    this.nbManager.setActiveNotebook(nb.id);
                    this.openNotebook();
                } else {
                    this.nbManager.setActiveNotebook(nb.id);

                    if (nb.name === 'MANUAL') {
                        this.openNotebook();
                    }
                }

                this.closeMobileSidebar();
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
        } else {
            this.activeNotebookCover.classList.remove('manual-mode');
            this.activeNotebookTitle.style.display = 'block';
            const topActions = this.activeNotebookCover.querySelector('.top-corner-actions');
            if (topActions) topActions.style.display = isReadonly ? 'none' : 'flex';
            if (manualIcons) {
                manualIcons.remove();
            }
        }

        this.activeNotebookTitle.setAttribute('contenteditable', isReadonly ? 'false' : 'true');
        this.changeCoverBtn.style.display = isReadonly ? 'none' : 'block';
        const topActions = document.querySelector('.top-corner-actions');
        if (topActions) topActions.style.display = isReadonly ? 'none' : 'flex';
    }

    openNotebook() {
        this.coverView.classList.add('hidden');
        this.openView.classList.remove('hidden');

        const activeBadge = document.getElementById('activeNotebookBadge');
        if (activeBadge) {
            const nb = this.nbManager.getActiveNotebook();
            activeBadge.textContent = nb ? nb.name : 'Libreta';
        }

        if (window.innerWidth < 992 && window.bootstrap && window.bootstrap.Offcanvas) {
            const offcanvas = bootstrap.Offcanvas.getInstance(this.sidebar);
            if (offcanvas) offcanvas.hide();
        }

        this.updateViewMode();
        this.loadCurrentPage();

        setTimeout(() => {
            this.managers.left.canvas.resizeCanvas();
            this.managers.right.canvas.resizeCanvas();
        }, 50);

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

            if (this.rotatePageBtn) this.rotatePageBtn.style.display = 'none';
            if (this.canvasContainerRight.classList.contains('landscape-mode')) {
                this.canvasContainerRight.classList.remove('landscape-mode');
                setTimeout(() => this.managers.right.canvas.resizeCanvas(), 50);
            }
        } else {
            this.twoPageWrapper.classList.add('single-page-mode');
            if (this.toggleViewModeBtn) this.toggleViewModeBtn.classList.remove('active');

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
                leftIndex = Math.floor(nb.activePageIndex / 2) * 2;
                rightIndex = leftIndex + 1;
            }

            const leftPage = nb.pages[leftIndex];
            const rightPage = nb.pages[rightIndex];

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
                this.canvasContainerLeft.style.visibility = 'visible';
            }

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

            if (!this.isTwoPageView && this.canvasContainerRight) {
                this.canvasContainerRight.style.visibility = 'visible';
            }

            if (this.isTwoPageView) {
                const rightStr = rightIndex < nb.pages.length ? rightIndex + 1 : '-';
                this.pageIndicator.textContent = `${leftIndex + 1}-${rightStr} / ${nb.pages.length}`;
            } else {
                this.pageIndicator.textContent = `${nb.activePageIndex + 1} / ${nb.pages.length}`;
            }

            this.prevPageBtn.disabled = this.isTwoPageView ? leftIndex === 0 : nb.activePageIndex === 0;
            this.nextPageBtn.disabled = this.isTwoPageView ? rightIndex >= nb.pages.length - 1 : nb.activePageIndex === nb.pages.length - 1;
            this.prevPageBtn.style.opacity = this.prevPageBtn.disabled ? '0.5' : '1';
            this.nextPageBtn.style.opacity = this.nextPageBtn.disabled ? '0.5' : '1';

            if (this.addPageBtn) {
                this.addPageBtn.classList.toggle('hidden', isReadonly);
                this.addPageBtn.style.display = isReadonly ? 'none' : '';
            }
            if (this.deletePageBtn) {
                this.deletePageBtn.classList.toggle('hidden', isReadonly);
                this.deletePageBtn.style.display = isReadonly ? 'none' : '';
            }
        } else {
            this.pageTextareaLeft.innerHTML = '';
            this.pageTextareaRight.innerHTML = '';
            this.managers.left.canvas.clearCanvas(true);
            this.managers.right.canvas.clearCanvas(true);
            this.managers.left.image.loadImages([]);
            this.managers.right.image.loadImages([]);
            this.pageIndicator.textContent = '1 / 1';
            if (this.addPageBtn) this.addPageBtn.classList.add('hidden');
            if (this.deletePageBtn) this.deletePageBtn.classList.add('hidden');
        }

        this.pageTextareaLeft.setAttribute('contenteditable', isReadonly ? 'false' : 'true');
        this.pageTextareaRight.setAttribute('contenteditable', isReadonly ? 'false' : 'true');

        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            toolbar.classList.toggle('read-only', isReadonly);
        }

        const dispenserWrapper = document.getElementById('stickyDispenserWrapper');
        if (dispenserWrapper) {
            dispenserWrapper.style.display = isReadonly ? 'none' : 'flex';
        }

        if (this.closeNotebookBtn) {
            this.closeNotebookBtn.style.display = 'inline-flex';
        }

        this.managers.left.canvas.isReadOnly = isReadonly;
        this.managers.right.canvas.isReadOnly = isReadonly;
        this.managers.left.image.isReadOnly = isReadonly;
        this.managers.right.image.isReadOnly = isReadonly;
        this.managers.left.sticky.isReadOnly = isReadonly;
        this.managers.right.sticky.isReadOnly = isReadonly;
    }

    saveCurrentOpenPage() {
        if (!this.nbManager.activeNotebookId) return;
        const nb = this.nbManager.getActiveNotebook();
        if (!nb || nb.isReadOnly) return;

        const leftIndex = this.isTwoPageView ? Math.floor(nb.activePageIndex / 2) * 2 : nb.activePageIndex;
        const rightIndex = this.isTwoPageView ? leftIndex + 1 : leftIndex;

        if (this.pageTextareaRight) {
            this.nbManager.updatePageText(nb.id, this.pageTextareaRight.innerHTML, rightIndex);
        }
        if (this.isTwoPageView && this.pageTextareaLeft) {
            this.nbManager.updatePageText(nb.id, this.pageTextareaLeft.innerHTML, leftIndex);
        }

        if (this.managers.right && this.managers.right.canvas) {
            const rightData = this.managers.right.canvas.getCanvasElement().toDataURL();
            this.nbManager.updatePageDrawing(nb.id, rightData, rightIndex);
        }
        if (this.isTwoPageView && this.managers.left && this.managers.left.canvas) {
            const leftData = this.managers.left.canvas.getCanvasElement().toDataURL();
            this.nbManager.updatePageDrawing(nb.id, leftData, leftIndex);
        }

        this.nbManager.saveNotebooks();
    }

    closeMobileSidebar() {
        if (this.sidebar && this.sidebar.classList.contains('show')) {
            this.sidebar.classList.remove('show');
        }
        if (window.bootstrap && window.bootstrap.Offcanvas) {
            const offcanvas = bootstrap.Offcanvas.getInstance(this.sidebar);
            if (offcanvas) offcanvas.hide();
        }
    }

    closeNotebook() {
        this.saveCurrentOpenPage();
        const nb = this.nbManager.getActiveNotebook();
        if (nb && nb.isReadOnly) {
            const firstNormal = this.nbManager.notebooks.find(n => !n.isReadOnly);
            if (firstNormal) {
                this.nbManager.setActiveNotebook(firstNormal.id);
            }
        }
        this.openView.classList.add('hidden');
        this.coverView.classList.remove('hidden');
    }

    showModal(modalEl = this.newNotebookModal) {
        if (!modalEl) return;
        if (modalEl === this.newNotebookModal) {
            this.newNotebookNameInput.value = '';
        }
        if (window.bootstrap && window.bootstrap.Modal) {
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        } else {
            modalEl.classList.remove('hidden');
        }
        if (modalEl === this.newNotebookModal) {
            setTimeout(() => this.newNotebookNameInput.focus(), 200);
        }
    }

    hideModal(modalEl = this.newNotebookModal) {
        if (!modalEl) return;
        if (window.bootstrap && window.bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) {
                modal.hide();
            } else {
                modalEl.classList.add('hidden');
            }
        } else {
            modalEl.classList.add('hidden');
        }
    }

    handleImageFile(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            this.managers.right.image.addImage(event.target.result);
        };
        reader.readAsDataURL(file);
    }

    setCaretToEnd(el) {
        if (!el) return;
        el.focus();
        try {
            let targetNode = el;
            while (targetNode.lastChild) {
                targetNode = targetNode.lastChild;
            }

            const range = document.createRange();
            if (targetNode.nodeType === Node.TEXT_NODE) {
                const offset = targetNode.textContent.length;
                range.setStart(targetNode, offset);
                range.setEnd(targetNode, offset);
            } else {
                range.selectNodeContents(targetNode);
                range.collapse(false);
            }

            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } catch (e) {
            console.warn('Error setting caret to end:', e);
        }
    }

    splitTextNodeAtBoundary(textNode, boundaryBottom) {
        const text = textNode.textContent || '';
        if (!text) return null;

        const range = document.createRange();
        let low = 0;
        let high = text.length;
        let best = -1;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            try {
                if (textNode.nodeType === Node.TEXT_NODE) {
                    range.setStart(textNode, 0);
                    range.setEnd(textNode, mid);
                } else if (textNode.firstChild && textNode.firstChild.nodeType === Node.TEXT_NODE) {
                    range.setStart(textNode.firstChild, 0);
                    range.setEnd(textNode.firstChild, mid);
                } else {
                    break;
                }
                const rects = range.getClientRects();
                if (rects.length > 0) {
                    const lastRect = rects[rects.length - 1];
                    if (lastRect.bottom <= boundaryBottom) {
                        best = mid;
                        low = mid + 1;
                    } else {
                        high = mid - 1;
                    }
                } else {
                    low = mid + 1;
                }
            } catch (err) {
                break;
            }
        }

        if (best <= 0) {
            return { stayText: '', moveText: text };
        }

        let finalSplit = best;
        const lastSpace = text.lastIndexOf(' ', best);
        if (lastSpace > 0 && best - lastSpace < 30) {
            finalSplit = lastSpace + 1;
        }

        return {
            stayText: text.slice(0, finalSplit),
            moveText: text.slice(finalSplit)
        };
    }

    checkAndHandleTextOverflow(textarea, isLeftPage = false, depth = 0) {
        if (depth > 20) return;
        if (this.isAutoPaging && depth === 0) return;
        if (!this.nbManager.activeNotebookId) return;
        const nb = this.nbManager.getActiveNotebook();
        if (!nb || nb.isReadOnly) return;

        const tolerance = 2;
        if (textarea.scrollHeight - textarea.clientHeight <= tolerance) {
            return;
        }

        if (depth === 0) {
            this.isAutoPaging = true;
        }

        try {
            const containerRect = textarea.getBoundingClientRect();
            const containerBottom = containerRect.bottom - tolerance;

            const overflowFragment = document.createDocumentFragment();
            const childNodes = Array.from(textarea.childNodes);

            if (childNodes.length === 0) return;

            for (let i = 0; i < childNodes.length; i++) {
                const child = childNodes[i];
                let childTop = 0;
                let childBottom = 0;

                if (child.nodeType === Node.ELEMENT_NODE) {
                    const r = child.getBoundingClientRect();
                    childTop = r.top;
                    childBottom = r.bottom;
                } else if (child.nodeType === Node.TEXT_NODE) {
                    const range = document.createRange();
                    range.selectNodeContents(child);
                    const r = range.getBoundingClientRect();
                    childTop = r.top;
                    childBottom = r.bottom;
                }

                if (childBottom <= containerBottom) {
                    continue;
                }

                if (childTop >= containerBottom - 4) {
                    for (let j = i; j < childNodes.length; j++) {
                        overflowFragment.appendChild(childNodes[j]);
                    }
                    break;
                }

                if (child.nodeType === Node.ELEMENT_NODE && child.textContent.length > 0) {
                    const textNode = child.firstChild;
                    if (textNode && textNode.nodeType === Node.TEXT_NODE && child.childNodes.length === 1) {
                        const splitData = this.splitTextNodeAtBoundary(textNode, containerBottom);
                        if (splitData && splitData.moveText) {
                            child.textContent = splitData.stayText.trimEnd();
                            if (!splitData.stayText.trim()) {
                                child.remove();
                            }
                            const nextElem = document.createElement(child.tagName);
                            nextElem.className = child.className;
                            nextElem.textContent = splitData.moveText.trimStart();
                            overflowFragment.appendChild(nextElem);

                            for (let j = i + 1; j < childNodes.length; j++) {
                                overflowFragment.appendChild(childNodes[j]);
                            }
                            break;
                        }
                    }
                }

                for (let j = i; j < childNodes.length; j++) {
                    overflowFragment.appendChild(childNodes[j]);
                }
                break;
            }

            while (textarea.childNodes.length > 1 && textarea.scrollHeight - textarea.clientHeight > tolerance) {
                const last = textarea.lastChild;
                overflowFragment.insertBefore(last, overflowFragment.firstChild);
            }

            if (textarea.childNodes.length === 1 && textarea.scrollHeight - textarea.clientHeight > tolerance) {
                const onlyChild = textarea.firstChild;
                if (onlyChild.nodeType === Node.ELEMENT_NODE && onlyChild.textContent) {
                    const splitData = this.splitTextNodeAtBoundary(onlyChild, containerBottom);
                    if (splitData && splitData.moveText) {
                        onlyChild.textContent = splitData.stayText.trimEnd();
                        const nextElem = document.createElement(onlyChild.tagName);
                        nextElem.className = onlyChild.className;
                        nextElem.textContent = splitData.moveText.trimStart();
                        overflowFragment.insertBefore(nextElem, overflowFragment.firstChild);
                    }
                }
            }

            const tempDiv = document.createElement('div');
            tempDiv.appendChild(overflowFragment);
            let overflowHtml = tempDiv.innerHTML.trim();

            if (!overflowHtml) {
                overflowHtml = '<p><br></p>';
            }

            this.transferOverflowToNextPage(nb, textarea, overflowHtml, isLeftPage, depth);

        } catch (err) {
            console.error('Error during auto page overflow:', err);
        } finally {
            if (depth === 0) {
                this.isAutoPaging = false;
            }
        }
    }

    transferOverflowToNextPage(nb, currentTextarea, overflowHtml, isLeftPage, depth = 0) {
        if (this.isTwoPageView) {
            const leftIndex = Math.floor(nb.activePageIndex / 2) * 2;
            const rightIndex = leftIndex + 1;

            if (isLeftPage) {
                this.nbManager.updatePageText(nb.id, currentTextarea.innerHTML, leftIndex);

                if (rightIndex >= nb.pages.length) {
                    nb.pages.push({
                        pageText: '',
                        pageDrawing: null,
                        pageImages: [],
                        pageNotes: []
                    });
                }

                const existingRightText = nb.pages[rightIndex].pageText || '';
                const combinedText = existingRightText ? (overflowHtml + '<br>' + existingRightText) : overflowHtml;
                nb.pages[rightIndex].pageText = combinedText;
                this.nbManager.saveNotebooks();

                this.pageTextareaRight.innerHTML = combinedText;
                if (this.canvasContainerRight) {
                    this.canvasContainerRight.style.visibility = 'visible';
                }
                this.updateViewMode();
                this.pageIndicator.textContent = `${leftIndex + 1}-${rightIndex + 1} / ${nb.pages.length}`;
                this.nextPageBtn.disabled = rightIndex >= nb.pages.length - 1;
                this.nextPageBtn.style.opacity = this.nextPageBtn.disabled ? '0.5' : '1';

                this.pageTextareaRight.classList.add('active');
                this.setCaretToEnd(this.pageTextareaRight);
                setTimeout(() => {
                    this.setCaretToEnd(this.pageTextareaRight);
                }, 10);

                if (this.pageTextareaRight.scrollHeight - this.pageTextareaRight.clientHeight > 2 && depth < 20) {
                    this.checkAndHandleTextOverflow(this.pageTextareaRight, false, depth + 1);
                }
            } else {
                this.saveCurrentOpenPage();

                const newLeftIndex = rightIndex + 1;
                if (newLeftIndex >= nb.pages.length) {
                    this.nbManager.addPage(nb.id);
                } else {
                    nb.pages.splice(newLeftIndex, 0, {
                        pageText: '',
                        pageDrawing: null,
                        pageImages: [],
                        pageNotes: []
                    });
                    nb.activePageIndex = newLeftIndex;
                }

                nb.pages[newLeftIndex].pageText = overflowHtml;
                nb.activePageIndex = newLeftIndex;
                this.nbManager.saveNotebooks();

                this.loadCurrentPage();
                this.pageTextareaLeft.classList.add('active');
                this.setCaretToEnd(this.pageTextareaLeft);
                setTimeout(() => {
                    this.setCaretToEnd(this.pageTextareaLeft);
                }, 10);

                if (this.pageTextareaLeft.scrollHeight - this.pageTextareaLeft.clientHeight > 2 && depth < 20) {
                    this.checkAndHandleTextOverflow(this.pageTextareaLeft, true, depth + 1);
                }
            }
        } else {
            this.saveCurrentOpenPage();

            const currentIndex = nb.activePageIndex;
            const nextIndex = currentIndex + 1;
            if (nextIndex >= nb.pages.length) {
                this.nbManager.addPage(nb.id);
            } else {
                nb.pages.splice(nextIndex, 0, {
                    pageText: '',
                    pageDrawing: null,
                    pageImages: [],
                    pageNotes: []
                });
                nb.activePageIndex = nextIndex;
            }

            nb.pages[nextIndex].pageText = overflowHtml;
            nb.activePageIndex = nextIndex;
            this.nbManager.saveNotebooks();

            this.loadCurrentPage();
            this.pageTextareaRight.classList.add('active');
            this.setCaretToEnd(this.pageTextareaRight);
            setTimeout(() => {
                this.setCaretToEnd(this.pageTextareaRight);
            }, 10);

            if (this.pageTextareaRight.scrollHeight - this.pageTextareaRight.clientHeight > 2 && depth < 20) {
                this.checkAndHandleTextOverflow(this.pageTextareaRight, false, depth + 1);
            }
        }
    }

    adaptActiveNotebookTextColors(isDark) {
        if (!this.nbManager.activeNotebookId) return;
        const nb = this.nbManager.getActiveNotebook();
        if (!nb) return;

        const darkBases = [
            'rgb(255, 255, 255)', '#ffffff', '#fff',
            'rgb(248, 250, 252)', '#f8fafc',
            'rgb(240, 243, 250)', '#f0f3fa'
        ];
        const lightBases = [
            'rgb(30, 41, 59)', '#1e293b',
            'rgb(34, 34, 34)', '#222222',
            'rgb(0, 0, 0)', '#000000', '#000',
            'rgb(75, 100, 140)', '#4b648c'
        ];

        const targetOldBases = isDark ? lightBases : darkBases;
        const newBase = isDark ? '#f8fafc' : '#1e293b';

        const adaptHtml = (html) => {
            if (!html) return html;
            const div = document.createElement('div');
            div.innerHTML = html;

            const colored = div.querySelectorAll('[style*="color"], font[color]');
            colored.forEach(el => {
                if (el.tagName === 'FONT' && el.getAttribute('color')) {
                    const c = el.getAttribute('color').toLowerCase().trim();
                    if (targetOldBases.includes(c)) {
                        el.setAttribute('color', newBase);
                    }
                }
                if (el.style && el.style.color) {
                    const c = el.style.color.toLowerCase().trim();
                    if (targetOldBases.some(base => base.toLowerCase() === c || c === base.toLowerCase())) {
                        el.style.color = newBase;
                    }
                }
            });
            return div.innerHTML;
        };

        if (this.pageTextareaRight) {
            this.pageTextareaRight.innerHTML = adaptHtml(this.pageTextareaRight.innerHTML);
        }
        if (this.isTwoPageView && this.pageTextareaLeft) {
            this.pageTextareaLeft.innerHTML = adaptHtml(this.pageTextareaLeft.innerHTML);
        }

        if (!nb.isReadOnly) {
            nb.pages.forEach(p => {
                if (p.pageText) {
                    p.pageText = adaptHtml(p.pageText);
                }
            });
            this.nbManager.saveNotebooks();
        }
    }
}
