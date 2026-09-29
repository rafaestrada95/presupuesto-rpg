# Budgy

Asistente de presupuesto personal: cuánto puedes gastar hoy, tus deudas, tus metas y un personaje que crece con tus hábitos financieros. El sistema de diseño está en [`DESIGN.md`](DESIGN.md).

## Cómo está hecho

- `index.html`: toda la app (React por CDN). Los datos viven en el teléfono de cada persona (`localStorage`).
- `sw.js` y `manifest.webmanifest`: Budgy se instala como app, funciona sin internet y recibe notificaciones.
- `server.js`: servidor pequeño en Node. Sirve la app y manda los avisos:
  - Recordatorio diario a la hora que elige cada persona. Se salta si ya anotó ese día.
  - Aviso un día antes, a las 9 a. m., de pagos que vencen (deudas y pagos fijos).

## Correr localmente

```bash
npm install
npm start          # http://localhost:3000
```

## Dónde vive

- **La app** se publica en GitHub Pages desde `main`: `https://rafaestrada95.github.io/presupuesto-rpg/`.
- **El servidor de avisos** (`server.js`) corre en Railway. La app le habla por medio de `BUDGY_SERVER` en `index.html`. Mientras esté vacío, Budgy ofrece el recordatorio por calendario.

## Configuración en Railway (servidor de avisos)

1. *New → Deploy from GitHub repo →* `presupuesto-rpg`. Railway detecta `package.json` y corre `npm start`.
2. *Settings → Networking → Generate Domain*. Esa dirección va en `BUDGY_SERVER` dentro de `index.html`.
3. *Volume* con mount path `/data`, para no perder las suscripciones ni las llaves en cada despliegue.
4. *Variables*:
   - `DATA_DIR=/data`
   - `VAPID_SUBJECT=mailto:tu-correo@ejemplo.com`
   - Opcional: `ALLOWED_ORIGINS`, los sitios que pueden usar la API. Default: `https://rafaestrada95.github.io`.
   - Opcional: `VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY`. Si faltan, se generan, se guardan en el Volume y aparecen en los logs.

## Notas

- En iPhone, las notificaciones solo funcionan con Budgy instalada en la pantalla de inicio (iOS 16.4 o posterior).
- Para recibir avisos de pagos, el servidor guarda solo el nombre, el día, el monto y si ya se pagó cada pago del mes. El resto de los datos nunca sale del teléfono.
