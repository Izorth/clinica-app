import { createHmac } from "crypto";

const BASE_URL = process.env.FLOW_BASE_URL ?? "https://sandbox.flow.cl/api";
const API_KEY = process.env.FLOW_API_KEY ?? "";
const SECRET = process.env.FLOW_SECRET_KEY ?? "";

function sign(params: Record<string, string>): Record<string, string> {
  const sorted = Object.keys(params).sort();
  const toSign = sorted.map((k) => `${k}${params[k]}`).join("");
  const s = createHmac("sha256", SECRET).update(toSign).digest("hex");
  return { ...params, s };
}

async function post(endpoint: string, params: Record<string, string>) {
  const signed = sign({ apiKey: API_KEY, ...params });
  const body = new URLSearchParams(signed);
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Flow error ${res.status}: ${text}`);
  }
  return res.json();
}

export type FlowCreateResult = {
  url: string;
  token: string;
  flowOrder: number;
};

export async function crearOrdenFlow(params: {
  commerceOrder: string;
  subject: string;
  amount: number;
  email: string;
  urlReturn: string;
  urlConfirmation: string;
}): Promise<FlowCreateResult> {
  const data = await post("/payment/create", {
    commerceOrder: params.commerceOrder,
    subject: params.subject,
    currency: "CLP",
    amount: String(params.amount),
    email: params.email,
    urlReturn: params.urlReturn,
    urlConfirmation: params.urlConfirmation,
  });
  return data as FlowCreateResult;
}

export type FlowPaymentStatus = {
  flowOrder: number;
  commerceOrder: string;
  requestDate: string;
  status: number; // 1=pending, 2=paid, 3=rejected, 4=cancelled
  subject: string;
  currency: string;
  amount: number;
  payer: string;
  paymentData?: {
    date: string;
    media: string;
    conversionDate: string;
    conversionRate: number;
    amount: number;
    currency: string;
    fee: number;
    balance: number;
    transferCode: number;
  };
};

export async function obtenerEstadoPago(token: string): Promise<FlowPaymentStatus> {
  const data = await post("/payment/getStatus", { token });
  return data as FlowPaymentStatus;
}

export function urlPagoFlow(url: string, token: string): string {
  return `${url}?token=${token}`;
}

// Flow status codes: 1=pending, 2=paid, 3=rejected, 4=cancelled
export function flowStatusToEstadoPago(status: number): "PENDIENTE" | "PAGADO" | "FALLIDO" {
  if (status === 2) return "PAGADO";
  if (status === 3 || status === 4) return "FALLIDO";
  return "PENDIENTE";
}
