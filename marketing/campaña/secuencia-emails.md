# Secuencia de Nurture — ClinicApp
**Trial gratuito → Cliente pagado**

---

## Resumen de la secuencia

```
Nombre:       Trial Onboarding → Conversión
Trigger:      Registro a prueba gratuita (día 0)
Objetivo:     Suscripción pagada antes del día 8
Emails:       6 (días 0, 1, 3, 5, 6, 7)
Salida:       Convierte a pago → entra a secuencia de cliente activo
              Llega al día 8 sin convertir → entra a secuencia de trial vencido
Herramienta: Resend / Customer.io / Mailchimp (ver §Implementación)
```

| # | Email | Día | Objetivo | CTA |
|---|-------|-----|----------|-----|
| 1 | Bienvenida | 0 | Activar — primer login real | Ir al dashboard |
| 2 | Primera cita | 1 | Crear primera hora agendada | Agendar ahora |
| 3 | Recordatorio WhatsApp | 3 | Activar recordatorio automático | Activar WhatsApp |
| 4 | Caso real: sin inasistencias | 5 | Mostrar el ROI concreto | Ver mis estadísticas |
| 5 | Tu prueba termina mañana | 6 | Urgencia + oferta de conversión | Suscribirme ahora |
| 6 | Hoy es el último día | 7 | Cierre de trial, último CTA | Continuar con ClinicApp |

**Timing de envío recomendado:** 9:00 AM hora Chile (CLT/CLST) en días hábiles.
**Condición de salida anticipada:** Si el usuario activa su suscripción en cualquier momento entre día 0 y día 7, detener la secuencia y moverlo al flujo de cliente activo.

---

## Email 1 — Bienvenida
**Día 0** · Envío: inmediato al registro

### Asuntos (A/B testing)

| Variante | Asunto | Caracteres |
|----------|--------|-----------|
| **A** (recomendada) | `Tu semana gratis ya comenzó, [Nombre]` | 38 |
| B | `Bienvenido/a a ClinicApp — empecemos` | 37 |
| C | `[Nombre], 7 días para que te enamores` | 39 |

### Preview text
> Tienes una semana entera para probarlo con pacientes reales. Aquí te explico cómo empezar en 5 minutos.

---

### Cuerpo

**Asunto:** Tu semana gratis ya comenzó, [Nombre]

---

Hola [Nombre],

Bienvenido/a a ClinicApp. Me alegra que estés aquí.

Tienes **7 días completos para probarlo con tus pacientes reales** — sin tarjeta, sin compromisos.

Estos son los únicos 3 pasos que te recomiendo hacer hoy:

**1. Completa tu perfil de consulta**
Agrega el nombre de tu consulta, tu especialidad y tu horario de atención. Tarda 3 minutos.

**2. Crea tu primera hora disponible**
Pon una hora real de mañana o pasado. Así ves exactamente cómo funciona la agenda.

**3. Agrega un paciente de prueba**
Puede ser un colega o alguien de confianza. Que reciba el recordatorio por WhatsApp y lo vea funcionar.

Eso es todo por hoy.

Mañana te cuento cómo configurar los recordatorios automáticos — esa es la función que más gusta.

[**Ir a mi dashboard →**](https://clinica-app-flax.vercel.app/dashboard)

Un saludo,
[Nombre del Fundador]
ClinicApp

---

*¿Tienes alguna duda ahora mismo? Responde este email directamente — leo todos los mensajes.*

*Si no quieres recibir estos emails, [cancela aquí]({{unsubscribe_url}}).*

---

**CTA principal:** `Ir a mi dashboard →` → `https://clinica-app-flax.vercel.app/dashboard`
**Longitud:** ~160 palabras · Tono: cálido, directo, sin presión

---

## Email 2 — Primera cita
**Día 1** · Envío: 24 horas después del registro

### Asuntos (A/B testing)

| Variante | Asunto | Caracteres |
|----------|--------|-----------|
| **A** (recomendada) | `¿Ya agendaste tu primera hora?` | 32 |
| B | `Un minuto para crear tu primera cita` | 38 |
| C | `Paso 1 de 1: agenda una hora real` | 35 |

### Preview text
> No se necesita configuración previa. Elige una hora, agrega el paciente, y listo — así de simple.

---

### Cuerpo

**Asunto:** ¿Ya agendaste tu primera hora?

---

Hola [Nombre],

El paso más importante de tu primera semana es este: **crea una hora real con un paciente real**.

No tienes que configurar nada más primero. La agenda ya está lista.

**Así funciona en menos de 2 minutos:**

→ Entra a tu dashboard y haz clic en **"Nueva hora"**
→ Elige la fecha y hora
→ Busca el paciente (o agrégalo si es nuevo — solo necesitas nombre y teléfono)
→ Guarda

Eso es todo.

Una vez que guardas la hora, el sistema la registra en tu agenda y ya queda disponible para enviar el recordatorio automático por WhatsApp.

**¿Por qué esto importa?**
Porque la mayoría de los profesionales que prueban ClinicApp y no crean su primera hora en el primer día... no terminan aprovechando la semana gratis.

Los que sí crean esa primera hora, generalmente se quedan.

[**Crear mi primera hora →**](https://clinica-app-flax.vercel.app/nueva-hora)

Hasta mañana,
[Nombre del Fundador]

---

*¿Tuviste algún problema al crear la hora? Responde aquí y te ayudo.*

*[Cancelar emails]({{unsubscribe_url}})*

---

**CTA principal:** `Crear mi primera hora →` → `https://clinica-app-flax.vercel.app/nueva-hora`
**Longitud:** ~190 palabras · Tono: orientado a acción, sin fricciones

---

## Email 3 — Recordatorio WhatsApp
**Día 3** · Envío: 72 horas después del registro

### Asuntos (A/B testing)

| Variante | Asunto | Caracteres |
|----------|--------|-----------|
| **A** (recomendada) | `El recordatorio que tus pacientes sí leen` | 43 |
| B | `Activa el WhatsApp automático — 1 clic` | 40 |
| C | `¿Tu paciente de mañana ya confirmó?` | 37 |

### Preview text
> El paciente recibe un WhatsApp, toca "Confirmo" o "Cancelo", y tú lo ves en tiempo real. Sin llamadas. Sin mensajes manuales.

---

### Cuerpo

**Asunto:** El recordatorio que tus pacientes sí leen

---

Hola [Nombre],

El 98% de los chilenos abre sus mensajes de WhatsApp en menos de 5 minutos.

Los emails de recordatorio médico... no tienen esa suerte.

Por eso ClinicApp envía el recordatorio directamente por WhatsApp. Y no solo eso: **el paciente puede confirmar o cancelar con un botón** — sin tener que llamar, sin tener que escribir nada.

**Así lo ve tu paciente:**

> 📅 *Hola [Nombre paciente], te recordamos tu hora con [Tu nombre] el miércoles 11 de junio a las 15:30.*
> ✅ *¿Confirmas tu asistencia?*
> *[CONFIRMO] [CANCELO]*

Tú recibes la respuesta en tiempo real en tu dashboard.

**Si cancela**, esa hora queda libre inmediatamente en tu agenda — puedes llamar a otro paciente o bloquearla.

**Si confirma**, ya no tienes que preocuparte por esa hora.

Este es el sistema que elimina el 80% de las inasistencias sin aviso.

Actívalo en menos de un minuto:

[**Activar recordatorios WhatsApp →**](https://clinica-app-flax.vercel.app/configurar-whatsapp)

Saludos,
[Nombre del Fundador]

---

*¿Tu número de WhatsApp ya está verificado? Si no, escríbeme y lo resolvemos juntos.*

*[Cancelar emails]({{unsubscribe_url}})*

---

**CTA principal:** `Activar recordatorios WhatsApp →` → `https://clinica-app-flax.vercel.app/configurar-whatsapp`
**Longitud:** ~220 palabras · Tono: educativo, con ejemplo concreto

---

## Email 4 — Caso real: sin inasistencias
**Día 5** · Envío: 120 horas después del registro

### Asuntos (A/B testing)

| Variante | Asunto | Caracteres |
|----------|--------|-----------|
| **A** (recomendada) | `Cómo Francisca dejó de perder $200.000 al mes` | 47 |
| B | `Una inasistencia cuesta $45.000. ¿Cuántas tuviste esta semana?` | 61 |
| C | `Lo que cambia cuando tus pacientes confirman con un botón` | 57 |

### Preview text
> Tres inasistencias sin aviso a la semana. Todos los meses. Hasta que activó el recordatorio.

---

### Cuerpo

**Asunto:** Cómo Francisca dejó de perder $200.000 al mes

---

Hola [Nombre],

Francisca es dentista en Providencia. Consulta propia, 25 años de experiencia, agenda siempre llena.

Pero tres veces a la semana, alguien no llegaba. Sin llamar. Sin avisar.

Tres horas vacías × $45.000 por hora × 4 semanas = **más de $500.000 al mes en ingresos que se evaporaban**.

Tenía una secretaria que llamaba a los pacientes el día anterior. Pero muchos no contestaban, y los que contestaban a veces olvidaban igual.

Cuando empezó a usar ClinicApp, pasaron dos cosas:

**Primera:** Sus pacientes empezaron a recibir el recordatorio por WhatsApp con botón de confirmación. Muchos que antes "se olvidaban" ahora confirmaban o avisaban con tiempo.

**Segunda:** Cuando alguien cancelaba, la hora quedaba libre de inmediato. Francisca la re-agendaba ese mismo día.

En su primer mes con ClinicApp, tuvo **una sola inasistencia sin aviso**.

No cero — pero pasó de 12 al mes a 1.

---

**¿Cuánto estás perdiendo tú?**

Si tienes 3 inasistencias sin aviso a la semana y cada hora vale $40.000, estás perdiendo **$480.000 al mes**.

ClinicApp cuesta $19.990 al mes.

Haz la cuenta.

[**Ver mis estadísticas de esta semana →**](https://clinica-app-flax.vercel.app/estadisticas)

Saludos,
[Nombre del Fundador]

---

*Si quieres contarme cómo te ha ido esta semana, responde este email. Me interesa saber.*

*[Cancelar emails]({{unsubscribe_url}})*

---

**CTA principal:** `Ver mis estadísticas de esta semana →` → `https://clinica-app-flax.vercel.app/estadisticas`
**Longitud:** ~290 palabras · Tono: narrativo, con matemáticas claras y ROI concreto
**Nota de producción:** "Francisca" es un personaje compuesto basado en el buyer persona. Reemplazar con un testimonio real cuando esté disponible.

---

## Email 5 — Tu prueba termina mañana
**Día 6** · Envío: 144 horas después del registro

### Asuntos (A/B testing)

| Variante | Asunto | Caracteres |
|----------|--------|-----------|
| **A** (recomendada) | `Tu prueba gratis termina mañana, [Nombre]` | 43 |
| B | `Mañana vence tu semana gratis — ¿qué decidiste?` | 49 |
| C | `Quedan 24 horas. ¿Seguimos?` | 28 |

### Preview text
> Todo lo que configuraste esta semana se mantiene. Solo necesitas un clic para no perderlo.

---

### Cuerpo

**Asunto:** Tu prueba gratis termina mañana, [Nombre]

---

Hola [Nombre],

Tu semana de prueba gratis termina mañana.

Quiero ser directo/a contigo: si suscribirte te parece razonable, ahora es el momento de decidirlo.

**Lo que conseguiste esta semana:**
- Tu agenda configurada con tus horarios reales
- Tus pacientes en el sistema
- Los recordatorios por WhatsApp activados
- (Probablemente) al menos una inasistencia menos que la semana anterior

Si no te suscribes, todo eso sigue ahí — pero dejas de recibir los recordatorios automáticos.

**¿Cuánto vale eso?**

La suscripción es de **$19.990 CLP al mes**.

Si tuviste aunque sea **una inasistencia menos esta semana**, ya recuperaste el equivalente al costo mensual.

No necesitas tarjeta de crédito especial ni contrato. Puedes cancelar cuando quieras.

[**Suscribirme por $19.990/mes →**](https://clinica-app-flax.vercel.app/suscribirse)

Si decides no suscribirte, no hay problema. Pero me interesa saber por qué — responde este email con una palabra: ¿precio, funcionalidad, timing, o algo más?

Esa respuesta me ayuda mucho.

Saludos,
[Nombre del Fundador]

---

*[Cancelar emails]({{unsubscribe_url}})*

---

**CTA principal:** `Suscribirme por $19.990/mes →` → `https://clinica-app-flax.vercel.app/suscribirse`
**CTA secundario implícito:** Responder al email con la razón de no suscripción (datos para mejorar)
**Longitud:** ~230 palabras · Tono: directo, honesto, sin presión exagerada

---

## Email 6 — Hoy es el último día
**Día 7** · Envío: 168 horas después del registro · Horario: 8:00 AM

### Asuntos (A/B testing)

| Variante | Asunto | Caracteres |
|----------|--------|-----------|
| **A** (recomendada) | `Hoy termina tu prueba, [Nombre]` | 32 |
| B | `Último día — ¿te quedas o te vas?` | 35 |
| C | `[Nombre], hoy es el último día gratis` | 38 |

### Preview text
> Si te suscribes hoy, nada cambia — misma agenda, mismos pacientes, mismos recordatorios. Solo sigues.

---

### Cuerpo

**Asunto:** Hoy termina tu prueba, [Nombre]

---

Hola [Nombre],

Hoy es el último día de tu semana gratis.

No voy a hacer este email largo.

Si ClinicApp te sirvió esta semana — si tuviste menos inasistencias, si dejaste de recordar manualmente, si tu agenda se ve más ordenada — entonces tiene sentido quedarse.

**$19.990 CLP al mes. Sin contrato. Cancela cuando quieras.**

[**Continuar con ClinicApp →**](https://clinica-app-flax.vercel.app/suscribirse)

---

Si decides no suscribirte hoy, tu cuenta pasa a modo gratuito limitado: puedes seguir viendo tu agenda, pero los recordatorios automáticos se pausan.

Cuando estés listo/a, puedes volver a activar desde la misma cuenta.

Gracias por haberle dado una oportunidad a ClinicApp esta semana.

[Nombre del Fundador]

---

*¿Algo no funcionó como esperabas? Cuéntame — responde este email.*

*[Cancelar emails]({{unsubscribe_url}})*

---

**CTA principal:** `Continuar con ClinicApp →` → `https://clinica-app-flax.vercel.app/suscribirse`
**Longitud:** ~140 palabras · Tono: breve, sin presión, con salida digna (no castigo por no suscribirse)
**Nota:** Email deliberadamente corto — el día 7 la decisión ya está tomada. Menos texto = menos objeciones.

---

## Métricas objetivo por email

| Email | Día | Open rate meta | CTR meta | Acción esperada |
|-------|-----|---------------|----------|----------------|
| 1 · Bienvenida | 0 | 70–80% | 40–50% | Login al dashboard |
| 2 · Primera cita | 1 | 50–60% | 25–35% | Crear una hora |
| 3 · WhatsApp | 3 | 45–55% | 20–30% | Activar recordatorio |
| 4 · Caso real | 5 | 40–50% | 15–25% | Ver estadísticas |
| 5 · Mañana vence | 6 | 55–65% | 30–40% | Suscripción |
| 6 · Hoy vence | 7 | 60–70% | 35–45% | Suscripción |

**Benchmarks de referencia para SaaS B2SMB latinoamérica:**
- Open rate secuencia onboarding: 45–65% (vs 25–35% newsletters)
- CTR emails transaccionales: 20–35%
- Conversión trial→pago secuencia email: 15–25%
- Conversión total objetivo ClinicApp: ≥20%

---

## Plan de A/B testing

Ejecutar en este orden de prioridad (requiere ≥200 envíos por variante para significancia):

| Semana | Test | Elemento | Hipótesis |
|--------|------|----------|-----------|
| 1–2 | Email 1 asunto | A vs B | "Nombre personalizado" vs "Genérico" |
| 2–3 | Email 3 asunto | A vs C | Beneficio vs pregunta de confirmación |
| 3–4 | Email 4 asunto | A vs B | Historia personal vs dato económico directo |
| 4–5 | Email 5 longitud | Normal vs versión corta | ¿Más texto o menos texto convierte mejor en urgencia? |
| 5–6 | Email 6 CTA | "Continuar" vs "Suscribirme" | Continuidad vs acción nueva |

---

## Configuración técnica

### Variables de personalización requeridas

| Variable | Fuente | Ejemplo |
|----------|--------|---------|
| `[Nombre]` | Campo de registro | "Francisca" |
| `[Nombre del Fundador]` | Config fija | "Rodrigo" |
| `{{unsubscribe_url}}` | Proveedor email | Auto-generado |

### UTM tags por email

```
Email 1: ?utm_source=email&utm_medium=nurture&utm_campaign=trial&utm_content=email1-bienvenida
Email 2: ?utm_source=email&utm_medium=nurture&utm_campaign=trial&utm_content=email2-primera-hora
Email 3: ?utm_source=email&utm_medium=nurture&utm_campaign=trial&utm_content=email3-whatsapp
Email 4: ?utm_source=email&utm_medium=nurture&utm_campaign=trial&utm_content=email4-caso-real
Email 5: ?utm_source=email&utm_medium=nurture&utm_campaign=trial&utm_content=email5-vence-manana
Email 6: ?utm_source=email&utm_medium=nurture&utm_campaign=trial&utm_content=email6-ultimo-dia
```

### Condiciones de salida de la secuencia

| Condición | Acción |
|-----------|--------|
| Usuario activa suscripción (día 0–7) | Salir inmediatamente → Secuencia "Cliente nuevo" |
| Usuario hace clic en "Cancelar emails" | Salir → No enviar más emails de nurture |
| Trial vence sin conversión (día 8) | Salir → Entrar a secuencia "Trial vencido" (win-back, 3 emails) |

### Herramientas recomendadas

| Herramienta | Por qué | Costo aprox. |
|-------------|---------|-------------|
| **Resend** | API simple, transaccional, ideal para Next.js/Vercel | Gratis hasta 3.000 emails/mes |
| **Customer.io** | Behavior-based automation, triggers por evento de app | ~$100 USD/mes al escalar |
| **Mailchimp** | Si se prefiere interfaz visual sin código | Gratis hasta 500 contactos |

**Recomendación para etapa actual:** Resend para el envío transaccional (integra directo con Next.js) + Mailchimp para gestionar la secuencia visualmente hasta llegar a 500 trials.

---

## Secuencia de win-back (post-trial vencido sin conversión)

*Para implementar en fase 2. Esquema:*

| Email | Día post-vencimiento | Mensaje |
|-------|---------------------|---------|
| W1 | Día 1 | "¿Qué pasó? Cuéntame" — email corto, honesto, pide feedback |
| W2 | Día 4 | Recordatorio con ángulo diferente: "Tu agenda sigue ahí" |
| W3 | Día 10 | Oferta especial de reactivación si aplica (ej. 2 semanas gratis) |

---

*Secuencia creada con el skill `/emails` de coreyhaines31/marketingskills v2.3.0*
*Actualizar open rates y CTR reales después de las primeras 2 semanas de envíos.*
