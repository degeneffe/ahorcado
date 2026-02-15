# El Ahorcado - Juego de Palabras en Español

Juego del ahorcado como Progressive Web App (PWA) que obtiene palabras en español desde una API pública. Funciona en web, móvil y desktop Linux.

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior (para el servidor local)

## Web (navegador)

La forma más rápida de ejecutar el juego:

```bash
# Instalar servidor estático (solo la primera vez)
npm install -g serve

# Ejecutar
serve ./ahorcado
```

Abre `http://localhost:3000` en cualquier navegador.

> También puedes usar cualquier otro servidor estático como `python3 -m http.server 3000` desde el directorio del proyecto, `npx http-server`, o servir los archivos desde Apache/Nginx.

## Móvil (Android / iOS)

Al ser una PWA, se instala directamente desde el navegador sin necesidad de tiendas de aplicaciones.

### Opción A: Red local (recomendado para desarrollo)

1. Conecta el móvil y el PC a la **misma red WiFi**.
2. Averigua la IP local del PC:

   ```bash
   hostname -I | awk '{print $1}'
   ```

3. Inicia el servidor:

   ```bash
   serve ./ahorcado --listen 0.0.0.0:3000
   ```

4. En el móvil, abre el navegador y visita `http://<IP_DEL_PC>:3000`.
5. Instalar como app:
   - **Android (Chrome):** Menú (⋮) → *"Añadir a pantalla de inicio"* o *"Instalar app"*.
   - **iOS (Safari):** Botón compartir (↑) → *"Añadir a pantalla de inicio"*.

### Opción B: Despliegue público

Despliega en cualquier hosting estático gratuito para acceder desde cualquier lugar:

**GitHub Pages:**

```bash
cd ahorcado
git init
git add .
git commit -m "Juego del ahorcado"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/ahorcado.git
git push -u origin main
```

Luego activa GitHub Pages en Settings → Pages → Branch: main.

**Netlify (alternativa rápida):**

```bash
npm install -g netlify-cli
cd ahorcado
netlify deploy --prod --dir .
```

**Vercel:**

```bash
npm install -g vercel
cd ahorcado
vercel --prod
```

Una vez desplegado, accede desde el móvil a la URL pública e instálalo como app.

> **Nota:** La instalación como PWA requiere HTTPS. Los servicios anteriores lo proporcionan automáticamente. En red local, Chrome permite la instalación de PWAs en `localhost` pero no en IPs sin HTTPS.

## Desktop Linux

### Opción A: Como PWA desde el navegador (más simple)

1. Inicia el servidor local:

   ```bash
   serve ./ahorcado
   ```

2. Abre `http://localhost:3000` en **Google Chrome** o **Microsoft Edge**.
3. Haz clic en el icono de instalar (⊕) en la barra de direcciones, o ve a Menú → *"Instalar El Ahorcado"*.
4. La app aparecerá como aplicación independiente en tu sistema.

### Opción B: Empaquetado con Electron (app nativa)

Si prefieres un ejecutable nativo sin depender del navegador:

1. Inicializa el proyecto e instala Electron:

   ```bash
   cd ahorcado
   npm init -y
   npm install --save-dev electron
   ```

2. Crea el archivo `main.js`:

   ```javascript
   const { app, BrowserWindow } = require('electron');
   const path = require('path');

   function createWindow() {
     const win = new BrowserWindow({
       width: 520,
       height: 850,
       icon: path.join(__dirname, 'icons', 'icon-512.png'),
       autoHideMenuBar: true,
       webPreferences: {
         contextIsolation: true
       }
     });
     win.loadFile('index.html');
   }

   app.whenReady().then(createWindow);
   app.on('window-all-closed', () => app.quit());
   ```

3. Edita `package.json` y añade el script de inicio:

   ```json
   {
     "main": "main.js",
     "scripts": {
       "start": "electron ."
     }
   }
   ```

4. Ejecuta:

   ```bash
   npm start
   ```

#### Generar ejecutable distribuible (opcional)

```bash
npm install --save-dev electron-builder
npx electron-builder --linux AppImage
```

El ejecutable `.AppImage` se generará en la carpeta `dist/`. Es portable y no requiere instalación.

## Estructura del proyecto

```
ahorcado/
├── index.html       → HTML principal
├── style.css        → Estilos responsive con tema claro/oscuro
├── app.js           → Lógica del juego
├── api.js           → Obtención de palabras (API + fallback local)
├── canvas.js        → Dibujo del ahorcado en canvas
├── manifest.json    → Configuración PWA
├── sw.js            → Service Worker (cache offline)
└── icons/
    ├── icon-192.png → Icono 192x192
    └── icon-512.png → Icono 512x512
```

## API de palabras

El juego usa un sistema de fallback para obtener palabras en español:

1. **API Greenborn** (principal): `https://clientes.api.greenborn.com.ar/public-random-word` — corpus de ~40,000 palabras en español, sin autenticación.
2. **Random Word API** (respaldo): `https://random-word-api.herokuapp.com/word?lang=es` — soporte multi-idioma.
3. **Diccionario local** (offline): ~100 palabras embebidas en el código para funcionar sin conexión.
