# Budgy — Sistema de diseño

Budgy (personal budget assistant) debe sentirse como una app de consumo hecha por un equipo fuerte de producto. No debe parecer un dashboard generado por IA, un panel de administración, un SaaS ni un portal bancario. La persona debe **querer** abrirla.

## Personalidad

Moderna · amigable · confiable con el dinero · colorida pero sofisticada · ligeramente juguetona · premium · accesible para todas las edades · motiva, no juzga.

## Tipografía

- **Manrope** como tipografía principal. No usar Inter, Roboto, Arial ni fuentes genéricas de sistema salvo como respaldo técnico.
- 700–800 para saldos y cifras importantes.
- 700 para títulos de pantalla.
- 600 para botones, pestañas y etiquetas importantes.
- 400–500 para texto corrido.
- La cifra domina; la etiqueta explicativa es secundaria. Poco texto, nada de descripciones largas.

## Color

| Rol | Color | HEX | Uso |
|---|---|---|---|
| Principal | Índigo | `#4F46E5` | Botones, navegación, marca |
| Éxito / Ahorro | Esmeralda | `#10B981` | Ahorro, metas, dinero positivo |
| Energía / Retos | Coral | `#FF6B5E` | Retos, rachas, energía |
| Recompensa | Mango | `#FBBF24` | Monedas, logros, avisos intermedios |
| Juego | Violeta | `#8B5CF6` | XP, niveles, elementos de juego |
| Información | Azul cielo | `#38BDF8` | Tips, gráficas, info |
| Fondo | Blanco cálido | `#F7F7F5` | Fondo general |
| Texto | Azul carbón | `#18212F` | Texto y números |
| Alerta | Rojo | `#D92D20` | Solo alertas reales |

Reglas:

- No hacer todo colorido. Usar mucho espacio neutro y meter color fuerte a propósito para dar jerarquía.
- **El rojo nunca se usa solo porque la persona gastó.** Se reserva para alertas reales: pagos vencidos, presupuesto rebasado, fondos insuficientes y alertas críticas.
- Esmeralda, coral y violeta se usan tal cual en rellenos, barras e íconos. Cuando van como **texto** sobre fondo claro se usa un tono más oscuro del mismo color para que se lea bien.
- Sobre fondos esmeralda, coral o mango, el texto va en tono oscuro, no blanco.

## Evitar el "look de IA"

No hacer:

- Pantallas hechas solo de tarjetas, ni tarjetas dentro de tarjetas.
- Rectángulos blancos genéricos para cada dato.
- Exceso de contenedores redondeados, sombras o píldoras.
- Degradados morados decorativos.
- Layouts genéricos de dashboard o de panel de administración.
- Grandes espacios vacíos entre componentes.
- Un borde alrededor de cada elemento.
- Cajas para información que puede vivir directo sobre el fondo.
- Grids predecibles de tarjetas idénticas.

**Antes de crear cualquier componente, pregúntate: "¿esta información de verdad necesita una caja?"** Si no, usa tipografía, espacio, color, divisores e íconos.

## Formas

| Elemento | Radio |
|---|---|
| Elementos chicos | 8px |
| Botones | 12px |
| Tarjetas | 16px |
| Contenedores destacados | 20–24px |

Los botones se sienten sólidos, no inflados. Evitar el exceso de píldoras.

## Tarjetas

Solo existen cuando la información realmente va junta: metas de ahorro, presupuestos, retos, insights importantes, mecánicas del juego y productos financieros con datos agrupados. Algunas pueden tener fondo de color sólido.

La preferencia es poner directo sobre el fondo:

```
cifra grande
etiqueta
dato de apoyo
```

## Iconografía

Íconos de línea redondeados, con personalidad y muy fáciles de reconocer. Evitar los íconos de "chispitas" de IA salvo que la función realmente use IA. Ocasionalmente, íconos rellenos de color para categorías importantes.

## Navegación

Barra inferior con **Inicio · Movimientos · [+ Anotar] · Presupuesto · Metas**. Perfil y ajustes se abren desde el avatar. La pantalla principal prioriza la situación financiera, no la navegación.

## Pantalla de inicio

Responde en unos 3 segundos:

1. ¿Cuánto dinero tengo disponible?
2. ¿Cómo voy este mes o quincena?
3. ¿A qué le tengo que poner atención?
4. ¿Cuál es mi siguiente acción útil?

Una sola cifra principal, luego una barra de progreso y solo la información más relevante. No es un dashboard de análisis.

## Anotar gastos

Es la acción más importante del producto. Debe tomar menos de 5 segundos: botón → monto → categoría → guardado, con opción de deshacer. También se puede anotar por voz.

## Gamificación

Racha 🔥 · XP ⭐ · retos 🏆 · metas 🎯 · recompensas 🪙 · niveles 📈.

- Debe sentirse integrada a las finanzas personales, no como un juego infantil.
- Premia hábitos financieros sanos. Nunca incentiva gastar ni el uso compulsivo.
- En modo juego se usan coral, mango y violeta más brillantes.
- El modo normal usa el mismo sistema con menos intensidad.
- El juego se puede apagar desde Perfil.

## Modo simple

La misma app, más fácil de usar, sin una identidad visual separada:

- Letra más grande y más contraste.
- Botones y áreas táctiles más grandes.
- Menos elementos al mismo tiempo y navegación más simple.
- Sin gamificación.
- Lenguaje claro, sin jerga financiera.
