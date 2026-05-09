// CONFIGURACIÓN EN TWILIO:
// 1. Ir a console.twilio.com → Messaging → Sandbox settings
// 2. En "When a message comes in" poner:
//    https://TU-DOMINIO.vercel.app/api/webhooks/twilio
//    (en desarrollo usar ngrok: https://xxxx.ngrok.io/api/webhooks/twilio)
// 3. Método: HTTP POST
// 4. Guardar

// DESARROLLO LOCAL:
// npm install -g ngrok
// ngrok http 3000
// Copiar la URL https://xxxx.ngrok.io y pegarla en Twilio Sandbox settings

import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TWIML_EMPTY = "<Response></Response>";

export async function POST(request: NextRequest) {
  const twilioSignature = request.headers.get("x-twilio-signature");
  if (!twilioSignature) {
    console.log("Webhook recibido sin firma válida");
  }

  const body = await request.formData();
  const buttonText = body.get("ButtonText") as string | null;
  const from = body.get("From") as string | null;

  console.log("Webhook Twilio:", { buttonText, from, telefonoLimpio: from?.replace("whatsapp:", "") });

  if (!buttonText || !from) {
    return new Response(TWIML_EMPTY, { headers: { "Content-Type": "text/xml" } });
  }

  const telefonoLimpio = from.replace("whatsapp:", "");
  const ultimos9 = telefonoLimpio.slice(-9);

  const paciente = await prisma.paciente.findFirst({
    where: { telefono: { contains: ultimos9 } },
    select: { id: true },
  });

  if (!paciente) {
    return new Response(TWIML_EMPTY, { headers: { "Content-Type": "text/xml" } });
  }

  if (buttonText === "Confirm" || buttonText === "Cancel") {
    const nuevoEstado = buttonText === "Confirm" ? "CONFIRMADA" : "CANCELADA";

    const hora = await prisma.hora.findFirst({
      where: {
        pacienteId: paciente.id,
        estado: "PENDIENTE",
        fecha: { gte: new Date() },
      },
      orderBy: { fecha: "asc" },
      select: { id: true },
    });

    if (hora) {
      await prisma.hora.update({
        where: { id: hora.id },
        data: { estado: nuevoEstado },
      });
      console.log(`Hora ${hora.id} → ${nuevoEstado} (paciente ${paciente.id})`);
    }
  }

  return new Response(TWIML_EMPTY, { headers: { "Content-Type": "text/xml" } });
}
