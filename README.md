# Liferay Site Initializer PoCs

### 🇪🇸 Español
Este repositorio contiene un **Liferay Workspace** configurado para desplegar de forma automatizada diferentes elementos que componen un sitio Web de Liferay a través de Site Initializers. Se incluyen empaquetados de dos formas: Client-Extension y módulo OSGi.

### 🇺🇸 English
This repository contains a **Liferay Workspace** configured to automatically deploy different elements that make up a Liferay Website through Site Initializers. These are packaged in two ways: Client-Extension and OSGi module.

---

## 📋 Contenido del Proyecto / Project Content

### 🇪🇸 Español
El workspace está dividido en dos grandes bloques funcionales:
1. **Client Extension (Site Initializer)**: Localizado en `client-extensions/liferay-ib-design-system-site-initializer/`. Crea un sitio automáticamente e importa todos los elementos de ese sitio (fragmentos, páginas, objects, picklists, object entries, contenidos web, documentos, etc.)
2. **OSGi Module (Site Initializer)**: Localizado en `modules/iberdrola-design-system-site-initializer/`. Permite desde la UI de creación de Sitios seleccionar este site initializer para que cree todos los elementos (los mismos que también crea la CX).

### 🇺🇸 English
The workspace is divided into two main functional blocks:
1. **Client Extension (Site Initializer)**: Located in `client-extensions/liferay-ib-design-system-site-initializer/`. It automatically creates a site and imports all its elements (fragments, pages, objects, picklists, object entries, web content, documents, etc.).
2. **OSGi Module (Site Initializer)**: Located in `modules/iberdrola-design-system-site-initializer/`. It allows selecting this site initializer from the Site creation UI to create all the elements (the same ones created by the CX).

---

## 🚀 Instalación Rápida / Quick Installation (Binaries)

### 🇪🇸 Español
Si no deseas compilar el código, utiliza los binarios incluidos en estas rutas:
1. **Descarga**:
   * `client-extensions/liferay-ib-design-system-site-initializer/dist/liferay-ib-design-system-site-initializer.zip`
   * `modules/iberdrola-design-system-site-initializer/build/libs/com.iberdrola.site.initializer-1.0.0.jar`
2. **Despliegue**: Copia ambos archivos en la carpeta `/deploy` de tu instancia de Liferay 7.4+.

### 🇺🇸 English
If you do not wish to compile the code, use the binaries included in these paths:
1. **Download**:
   * `client-extensions/liferay-ib-design-system-site-initializer/dist/liferay-ib-design-system-site-initializer.zip`
   * `modules/iberdrola-design-system-site-initializer/build/libs/com.iberdrola.site.initializer-1.0.0.jar`
2. **Deployment**: Copy both files into the `/deploy` folder of your Liferay 7.4+ instance.

---
