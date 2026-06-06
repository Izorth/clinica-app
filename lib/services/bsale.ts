const BASE_URL = "https://api.bsale.cl";
const ACCESS_TOKEN = process.env.BSALE_ACCESS_TOKEN ?? "";

// Document type 39 = Boleta de Ventas y Servicios (electronic, valid for SII)
const DOCUMENT_TYPE_ID = Number(process.env.BSALE_DOCUMENT_TYPE_ID ?? "39");
const PRICE_LIST_ID = Number(process.env.BSALE_PRICE_LIST_ID ?? "1");

async function bsaleFetch(path: string, method: string, body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "access_token": ACCESS_TOKEN,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bsale error ${res.status}: ${text}`);
  }
  return res.json();
}

export type BsaleDocumentResult = {
  id: number;
  number: number;
  totalAmount: number;
  urlPdf: string;
  state: number; // 0=active, 1=inactive (annulled)
};

export type EmitirBoletaParams = {
  monto: number;
  descripcion: string;
  rutCliente: string;
  nombreCliente: string;
  emailCliente?: string;
};

export async function emitirBoleta(params: EmitirBoletaParams): Promise<BsaleDocumentResult> {
  const montoNeto = Math.round(params.monto / 1.19); // strip 19% IVA
  const montoIva = params.monto - montoNeto;

  const payload = {
    documentTypeId: DOCUMENT_TYPE_ID,
    priceListId: PRICE_LIST_ID,
    emissionDate: Math.floor(Date.now() / 1000),
    expirationDate: Math.floor(Date.now() / 1000),
    declare: 1,
    client: {
      code: params.rutCliente,
      company: params.nombreCliente,
      email: params.emailCliente ?? "",
      activity: "Particular",
    },
    details: [
      {
        comment: params.descripcion,
        quantity: 1,
        unitValue: montoNeto,
        discount: 0,
        taxId: "[1]",
      },
    ],
    payments: [
      {
        paymentTypeId: 1,
        amount: params.monto,
        recordDate: Math.floor(Date.now() / 1000),
      },
    ],
  };

  const data = await bsaleFetch("/v1/documents.json", "POST", payload);
  return {
    id: data.id as number,
    number: data.number as number,
    totalAmount: data.totalAmount as number,
    urlPdf: data.urlPdf as string,
    state: data.state as number,
  };
}

export async function obtenerBoleta(id: number): Promise<BsaleDocumentResult> {
  const data = await bsaleFetch(`/v1/documents/${id}.json`, "GET");
  return {
    id: data.id as number,
    number: data.number as number,
    totalAmount: data.totalAmount as number,
    urlPdf: data.urlPdf as string,
    state: data.state as number,
  };
}
