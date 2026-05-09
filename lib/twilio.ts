import twilio from "twilio";

export function normalizarTelefono(telefono: string): string {
  const limpio = telefono.replace(/\s+/g, "").replace(/-/g, "");
  if (limpio.startsWith("+56")) return limpio;
  if (limpio.startsWith("56") && limpio.length >= 11) return `+${limpio}`;
  return `+56${limpio}`;
}

export async function enviarRecordatorioTemplate(
  telefono: string,
  fecha: Date
): Promise<{ ok: boolean; sid?: string; error?: string }> {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    return { ok: false, error: "Twilio no configurado" };
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const fechaStr = fecha.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  });
  const horaStr = fecha.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Santiago",
  });

  const to = `whatsapp:${normalizarTelefono(telefono)}`;

  try {
    const msg = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      contentSid: process.env.TWILIO_CONTENT_SID,
      contentVariables: JSON.stringify({ "1": fechaStr, "2": horaStr }),
      to,
    });
    return { ok: true, sid: msg.sid };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
