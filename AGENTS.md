# Instrucciones para agentes de IA (Silver-VS.github.io)

Este repositorio publica https://silver-vs.github.io/ con GitHub Pages, desde la rama `main` y la carpeta raíz.
Aquí conviven **dos proyectos independientes**. Varios agentes (Claude, ChatGPT/Codex u otros) trabajan en
él en momentos distintos: lee este archivo antes de cambiar algo y respeta las zonas.

## Zonas

| Ruta | Proyecto | Qué puedes hacer |
|---|---|---|
| `/index.html`, `/src/**` | Portafolio personal de Víctor Serrano | Rediseñarlo libremente, respetando los **bloques protegidos** (abajo). |
| `/upiita/**` | Herramientas IPN-tools (Horarios y Electivas UPIITA). Se **generan** en el repositorio [Silver-VS/IPN-tools](https://github.com/Silver-VS/IPN-tools) y se copian aquí con `tools/publicar.sh`. | **No editar, mover, renombrar ni borrar.** Los cambios se hacen en IPN-tools y se vuelven a publicar. |
| `/googlebd435cdd0b631f3c.html` | Verificación de Google Search Console | **No tocar.** Si se borra, se pierde la verificación del dominio. |
| `/AGENTS.md`, `/CLAUDE.md` | Estas instrucciones | Actualízalas si cambian las zonas; no las borres. |

Archivos nuevos del portafolio: van en la raíz (páginas) o en `/src/` (estilos, scripts e imágenes), nunca dentro de `/upiita/`.

## Bloques protegidos

Están marcados con comentarios `<!-- PROTEGIDO:… inicio -->` y `<!-- PROTEGIDO:… fin -->`. Al rediseñar o
reescribir una página, **copia el bloque tal cual** al `<head>` de la nueva versión.

- `/index.html` › `<head>`: verificación de Google Search Console.

  ```html
  <!-- PROTEGIDO:verificacion inicio (ver AGENTS.md: no borrar ni modificar al rediseñar) -->
  <meta name="google-site-verification" content="MWQ_mbJcTRsosUPcybbAe8W9cJBamz-kz9SlY7iPtNs" />
  <!-- PROTEGIDO:verificacion fin -->
  ```

## Direcciones que deben seguir funcionando

Están registradas en Microsoft Entra ID (URI de redirección), en Google Cloud (origen autorizado y páginas
de marca) y en marcadores que los alumnos ya guardaron en sus navegadores:

- `https://silver-vs.github.io/upiita/` y sus archivos: `horarios.html`, `electivas.html`, `auth.html`,
  `privacidad.html`, `condiciones.html`, `revision.html`, `lector.js`, `captura.js`, `assets/**`.
- El dominio `silver-vs.github.io`. No agregues un archivo `CNAME` (dominio propio) sin actualizar antes
  esos registros.

## Cambios de infraestructura

- Si el portafolio pasa a usar un generador o un *framework* (Vite, Astro, Next, etc.) y se publica con
  GitHub Actions, el sitio publicado **debe seguir incluyendo** `/upiita/**` y `/googlebd435cdd0b631f3c.html`
  sin modificaciones (cópialos al directorio de salida). Un despliegue por Actions reemplaza todo el sitio.
- No agregues configuración de Jekyll (`_config.yml` con `exclude`, `include` o plugins) que afecte a
  `/upiita/`.

## Antes de terminar

1. El bloque protegido sigue en el `<head>` de `/index.html`: `grep -n google-site-verification index.html`.
2. `/googlebd435cdd0b631f3c.html` existe y no cambió.
3. `/upiita/` no tiene cambios tuyos: `git status -- upiita` y `git diff --stat -- upiita` sin resultados.
4. Haz commits separados por zona. Los mensajes de las publicaciones de IPN-tools empiezan con «Publica» o
   describen el cambio de la herramienta.
