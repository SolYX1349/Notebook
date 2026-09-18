# 📓 VR Notebook

Una aplicación web moderna, interactiva y fluida para el manejo de libretas digitales, lienzo libre de dibujo, notas adhesivas y widgets de imagen, construida con arquitectura modular en JavaScript (ES Modules) y diseño Glassmorphism.

---

## 🏗️ Arquitectura del Proyecto

El proyecto sigue una arquitectura **Modular por Capas (Separation of Concerns)** utilizando nativamente ES6 Modules sin dependencias complejas de empaquetado:

```text
Notebook/
├── index.html                 # Página de inicio / Landing Page (Presentación)
├── desk.html                  # Aplicación Principal (Escritorio de Libretas y Canvas)
├── home.html                  # Vista alternativa de la Landing Page
├── README.md                  # Documentación del proyecto
├── LICENSE                    # Licencia de código abierto MIT
├── css/                       # Hojas de estilo organizadas
│   ├── home.css               # Estilos de la landing page
│   ├── stickyNotes.css        # Estilos visuales de notas adhesivas
│   └── style.css              # Sistema de diseño principal (Glassmorphic / Temas)
└── js/                        # Código Fuente JavaScript Modular (ES Modules)
    ├── app.js                 # Bootstrapper (Inicializador de la aplicación)
    ├── core/                  # Capa de Dominio y Manejo de Negocio
    │   ├── canvasManager.js   # Gestión de lienzo de dibujo 2D (Undo/Redo, trazado)
    │   ├── drawingTools.js    # Herramientas de pincel (Plumón, Lápiz, Crayola, Borrador)
    │   ├── imageManager.js    # Gestión de widgets de imágenes e interactividad
    │   ├── notebookManager.js # Estado global de libretas y persistencia
    │   └── stickyNoteManager.js # Creación y gestión de notas adhesivas
    ├── ui/                    # Capa de Presentación e Interfaz de Usuario
    │   └── uiController.js    # Controlador DOM, vistas y eventos de usuario
    └── utils/                 # Utilidades generales
        └── exportUtils.js     # Exportación a imágenes PNG y documentos PDF
```

---

## ⚡ Módulos y Responsabilidades

### 1. Bootstrapper (`js/app.js`)
Punto de entrada ejecutable. Se encarga de instanciar los gestores del núcleo (`core`), configurar los lienzos duales (página izquierda y derecha) y coordinar el ciclo de vida inicial de la aplicación.

### 2. Capa Core (`js/core/`)
- **`notebookManager.js`**: Mantiene la estructura de datos de las libretas, sincronización con `localStorage` y la API de File System del navegador.
- **`canvasManager.js`**: Administra la API Canvas 2D HTML5, maneja eventos táctiles y de ratón, e implementa el historial deshacer/rehacer.
- **`drawingTools.js`**: Contiene la lógica matemática y estética de los trazos (pincel, lápiz, crayola con dispersión y borrador).
- **`stickyNoteManager.js`**: Controla el ciclo de vida de las notas adhesivas arrastrabiles y editables.
- **`imageManager.js`**: Permite la inserción, escalado, transformación y eliminación de imágenes en las páginas.

### 3. Capa UI (`js/ui/uiController.js`)
Centraliza los manejadores de eventos del DOM, alternancia de modos (vista de 1 o 2 páginas), cambio de tipografías, colores, paneles de herramientas y diálogos modales.

### 4. Capa de Utilidades (`js/utils/exportUtils.js`)
Contiene funciones auxiliares estáticas para generar exportaciones de alta calidad a PDF (mediante `html2canvas` y `jsPDF`) y guardar capturas del lienzo en formato PNG.

---

## 🚀 Inicio Rápido

No se requiere ningún paso de compilación o instalación de `npm`. Simplemente abre la aplicación en tu navegador web preferido:

1. **Aplicación Principal**: Abre `index.html`.
2. **Landing Page**: Abre `home.html`.

Para desarrollo local recomendado, utiliza una extensión como **Live Server** en VS Code.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para obtener más detalles.
