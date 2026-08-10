/**
 * demo-video.js — graba un recorrido real de la app para LinkedIn.
 *
 * Uso (con el server de PRODUCCIÓN corriendo en otra terminal):
 *   npm run build && npm run start
 *   node marketing/demo-video.js
 *
 * Produce marketing/output/_raw.webm + marketing/output/marcas.json
 * (las marcas de tiempo que usa post-video.sh para colocar los overlays).
 *
 * Se graba contra el build de producción a propósito: en `next dev` salen el
 * badge de devtools de Next y el botón flotante de React Query Devtools.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.DEMO_URL || "http://localhost:3000";
const CRED = { email: "admin@clinica.cl", password: "admin123" };
const OUT = path.join(__dirname, "output");

// Paciente que se crea en cámara. RUT 44.444.444-4: DV válido (si no, el
// formulario lo rechaza grabando), pero fuera del rango asignado a personas
// naturales en Chile. El overlay "datos ficticios" es la protección real.
const NUEVO = {
  rut: "44.444.444-4",
  telefono: "+56 9 6543 2109",
  nombre: "Amanda",
  apellido: "Sobrevilla",
  email: "amanda.sobrevilla@ejemplo.cl",
  fechaNac: "1991-03-14",
};

// Multiplicador global de pausas: subir si el video queda corto.
const PACE = Number(process.env.DEMO_PACE || 1);
const pausa = (ms) => new Promise((r) => setTimeout(r, ms * PACE));

let t0 = 0;
const marcas = {};
function marcar(nombre) {
  marcas[nombre] = Math.round((Date.now() - t0) / 100) / 10;
  console.log(`  ⏱  ${nombre.padEnd(22)} ${marcas[nombre]}s`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // Borra el paciente de la toma anterior para que el script sea repetible
  // (rut es unique: sin esto la segunda corrida falla con P2002 en cámara).
  require("dotenv").config();
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const borrados = await prisma.paciente.deleteMany({ where: { rut: NUEVO.rut } });
  if (borrados.count) console.log(`· Limpieza previa: ${borrados.count} paciente(s) ${NUEVO.rut}`);
  await prisma.$disconnect();

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    // Sin `size` el video se escalaría para caber en 800x800.
    // Sin `showActions`: el cursor nativo de Playwright viene acompañado de una
    // caja azul de resaltado y un punto rojo sobre cada elemento, que se ven a
    // herramienta de depuración. Acá se inyecta un cursor propio (ver abajo).
    recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
    locale: "es-CL",
    timezoneId: "America/Santiago",
    deviceScaleFactor: 1,
  });

  // Cursor visible: Playwright no dibuja el puntero en el video. Sin esto, los
  // clics de navegación se ven como saltos de pantalla sin causa. Se registra
  // con addInitScript para que sobreviva a cada navegación.
  await context.addInitScript(() => {
    const montar = () => {
      if (document.getElementById("__cursor")) return;
      const c = document.createElement("div");
      c.id = "__cursor";
      c.style.cssText =
        "position:fixed;left:0;top:0;width:24px;height:24px;z-index:2147483647;" +
        "pointer-events:none;transform:translate(-200px,-200px);will-change:transform;" +
        "filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))";
      c.innerHTML =
        '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M5 2l14 8.6-6.3 1.3 3.3 6.8-2.9 1.4-3.3-6.8L5 18.4z" fill="#18181b" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
      document.body.appendChild(c);

      document.addEventListener(
        "mousemove",
        (e) => { c.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; },
        true
      );

      // Onda al hacer clic, para que el clic se lea aunque la página no cambie.
      document.addEventListener(
        "mousedown",
        (e) => {
          const o = document.createElement("div");
          o.style.cssText =
            `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:14px;height:14px;` +
            "margin:-7px 0 0 -7px;border-radius:50%;border:2px solid #18181b;" +
            "z-index:2147483646;pointer-events:none;opacity:.9;transition:all .45s ease-out";
          document.body.appendChild(o);
          requestAnimationFrame(() => {
            o.style.transform = "scale(3.2)";
            o.style.opacity = "0";
          });
          setTimeout(() => o.remove(), 500);
        },
        true
      );
    };
    if (document.body) montar();
    else document.addEventListener("DOMContentLoaded", montar);
  });

  const page = await context.newPage();
  t0 = Date.now();

  // Posición del puntero: hay que recordarla para poder reponer el cursor
  // después de cada navegación (el elemento se recrea y no hay mousemove).
  const raton = { x: 960, y: 540 };
  async function mover(x, y, steps = 24) {
    await page.mouse.move(x, y, { steps });
    raton.x = x;
    raton.y = y;
  }
  async function reponerCursor() {
    await page.mouse.move(raton.x + 1, raton.y);
    await page.mouse.move(raton.x, raton.y);
  }
  // Mueve el puntero hasta el elemento, deja verlo, y recién ahí hace clic.
  async function clic(locator, espera = 420) {
    await locator.scrollIntoViewIfNeeded();
    const caja = await locator.boundingBox();
    if (!caja) throw new Error("elemento sin boundingBox: " + locator);
    await mover(caja.x + caja.width / 2, caja.y + caja.height / 2);
    await pausa(espera);
    await locator.click();
  }

  // ── 1. Login (se recorta después; solo sirve para llegar autenticado) ────
  console.log("· Login");
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await pausa(800);
  await page.locator('input[name="email"]').fill(CRED.email);
  await pausa(400);
  await page.locator('input[name="password"]').fill(CRED.password);
  await pausa(600);
  await clic(page.locator('button[type="submit"]'));
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  await page.waitForLoadState("networkidle");
  await reponerCursor();
  await pausa(1500);
  marcar("dashboard");

  // ── 2. Dashboard, 3 segundos ────────────────────────────────────────────
  console.log("· Dashboard");
  await pausa(3000);
  await page.mouse.wheel(0, 400);
  await pausa(2000);
  await page.mouse.wheel(0, -400);
  await pausa(1500);

  // ── 3. Pacientes, 2 segundos ────────────────────────────────────────────
  console.log("· Pacientes");
  await clic(page.getByRole("link", { name: "Pacientes" }));
  await page.waitForURL(/\/dashboard\/pacientes$/, { timeout: 30000 });
  await page.waitForLoadState("networkidle");
  await reponerCursor();
  marcar("pacientes");
  await pausa(2500);
  await page.mouse.wheel(0, 300);
  await pausa(1800);
  await page.mouse.wheel(0, -300);
  await pausa(1200);

  // ── 4. Crear paciente, campo por campo y lento ──────────────────────────
  console.log("· Nuevo paciente");
  await clic(page.getByRole("link", { name: "+ Nuevo paciente" }));
  await page.waitForURL(/\/pacientes\/nuevo/, { timeout: 30000 });
  await page.waitForLoadState("networkidle");
  await reponerCursor();
  marcar("crear");
  await pausa(1500);

  const escribir = async (name, texto, delay = 110) => {
    const campo = page.locator(`input[name="${name}"]`);
    await clic(campo, 320);
    await pausa(350);
    await campo.pressSequentially(texto, { delay });
    await pausa(1100);
  };

  await escribir("rut", NUEVO.rut, 130);
  await escribir("telefono", NUEVO.telefono, 90);
  await escribir("nombre", NUEVO.nombre, 130);
  await escribir("apellido", NUEVO.apellido, 110);
  await escribir("email", NUEVO.email, 65);
  await page.locator('input[name="fechaNac"]').fill(NUEVO.fechaNac);
  await pausa(1500);

  console.log("· Guardar");
  await clic(page.locator('button[type="submit"]'), 700);
  await page.waitForURL(/\/dashboard\/pacientes$/, { timeout: 30000 });
  await page.waitForLoadState("networkidle");
  await reponerCursor();
  await pausa(1000);

  // ── 5. El paciente recién creado aparece en el listado ───────────────────
  const fila = page.getByRole("row", { name: new RegExp(NUEVO.apellido) });
  await fila.waitFor({ timeout: 15000 });
  marcar("listado");
  await pausa(3500);

  // ── 6. Buscador ─────────────────────────────────────────────────────────
  console.log("· Buscador");
  const buscador = page.getByPlaceholder("Buscar por nombre o RUT");
  await clic(buscador);
  await pausa(600);
  await buscador.pressSequentially(NUEVO.apellido, { delay: 150 });
  marcar("buscador");
  await pausa(3500);
  await buscador.fill("");
  await pausa(2000);

  // ── 7. Vuelta al dashboard ──────────────────────────────────────────────
  console.log("· Vuelta al dashboard");
  await clic(page.getByRole("link", { name: "Dashboard", exact: true }));
  await page.waitForURL(/\/dashboard$/, { timeout: 30000 });
  await page.waitForLoadState("networkidle");
  await reponerCursor();
  marcar("cierre");
  await pausa(4500);

  marcar("fin");

  // El video se escribe al cerrar el contexto; la ruta solo existe después.
  const video = page.video();
  await context.close();
  await browser.close();

  const crudo = await video.path();
  const destino = path.join(OUT, "_raw.webm");
  fs.renameSync(crudo, destino);
  fs.writeFileSync(path.join(OUT, "marcas.json"), JSON.stringify(marcas, null, 2));

  console.log(`\n✓ ${destino}`);
  console.log(`✓ marcas.json`);
  console.log(`  duración grabada: ${marcas.fin}s | tras recortar login: ~${(marcas.fin - marcas.dashboard).toFixed(1)}s`);
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
