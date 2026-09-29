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

## Configuración en Railway

Railway detecta `package.json` y corre `npm start`.

1. **Volume** (para no perder las suscripciones ni las llaves en cada despliegue): en el servicio, *Settings → Volumes → Add Volume* con mount path `/data`.
2. **Variables**:
   - `DATA_DIR=/data`
   - `VAPID_SUBJECT=mailto:tu-correo@ejemplo.com` (contacto del remitente de los avisos)
   - Opcional: `VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY`. Si no las pones, el servidor las genera la primera vez, las guarda en el Volume y las muestra en los logs.

Sin Volume, la app sigue funcionando: cada teléfono vuelve a registrar sus avisos al abrir Budgy. Pero entre un despliegue y la siguiente vez que alguien abra la app, no le llegan avisos.

## Notas

- En iPhone, las notificaciones solo funcionan con Budgy instalada en la pantalla de inicio (iOS 16.4 o posterior).
- Para recibir avisos de pagos, el servidor guarda solo el nombre, el día, el monto y si ya se pagó cada pago del mes. El resto de los datos nunca sale del teléfono.
