/**
 * export-spot.js
 *
 * Graba la app real (localhost:3000/dashboard/agenda) con sesión autenticada
 * en TRES aspect ratios y produce 3 MP4 listos para publicar:
 *
 *   marketing/output/spot-16x9.mp4   (1920×1080, landing / YouTube)
 *   marketing/output/spot-9x16.mp4   (1080×1920, Reels / TikTok / Stories)
 *   marketing/output/spot-1x1.mp4    (1080×1080, LinkedIn / Twitter feed)
 *
 * Cómo usar (desde la raíz del proyecto, con `npm run dev` en otra terminal):
 *
 *   node marketing/export-spot.js
 *
 * Credenciales configurables con env vars:
 *   SPOT_EMAIL=admin@clinica.cl SPOT_PASSWORD=admin123 node marketing/export-spot.js
 *
 * Si Chromium descargado por Puppeteer falla, exporta CHROME_PATH:
 *   CHROME_PATH=/usr/bin/chromium-browser node marketing/export-spot.js
 *
 * Pre-requisitos:
 *   - ffmpeg en el PATH
 *   - dev server activo en http://localhost:3000
 *   - Usuario con acceso al dashboard (audio opcional)
 */

const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ───── Config ───────────────────────────────────────────────────────────
const SPOT_URL  = 'http://localhost:3000/dashboard';
const LOGIN_URL = 'http://localhost:3000/login';
const CREDENTIALS = {
  email:    process.env.SPOT_EMAIL    || 'admin@clinica.cl',
  password: process.env.SPOT_PASSWORD || 'admin123',
};

const DURATION_MS  = 22300; // 4s dashboard + 5s agenda + 4s pacientes + 1.5s form + 5s typing + 2.5s form lleno ≈ 22s
const FPS          = 30;
const CAPTURE_FPS  = 15;  // fps de captura screenshot (más lento pero confiable)
const BGM_VOLUME  = 0.22;
const PROJECT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR  = path.join(__dirname, 'output');
const VOZ         = path.join(PROJECT_DIR, 'public', 'music', 'voz.mp3');
const BGM         = path.join(PROJECT_DIR, 'public', 'music', 'spot.mp3');

// captureWidth/captureHeight = viewport de grabación
// outputWidth/outputHeight   = resolución final del MP4
const FORMATS = [
  { name: '16x9', captureWidth: 1920, captureHeight: 1080, outputWidth: 1920, outputHeight: 1080 },
  { name: '9x16', captureWidth: 390,  captureHeight: 844,  outputWidth: 1080, outputHeight: 1920 },
  { name: '1x1',  captureWidth: 600,  captureHeight: 600,  outputWidth: 1080, outputHeight: 1080 },
];

// ───── Helpers ──────────────────────────────────────────────────────────
function sh(cmd) {
  console.log('  $ ' + cmd);
  execSync(cmd, { stdio: 'inherit' });
}
function checkFfmpeg() {
  try { execSync('ffmpeg -version', { stdio: 'pipe' }); }
  catch {
    console.error('✗ ffmpeg no está en el PATH. Instálalo con `sudo apt install ffmpeg`.');
    process.exit(1);
  }
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function hasAudio() {
  return fs.existsSync(VOZ) && fs.existsSync(BGM);
}

// ───── Autenticación ────────────────────────────────────────────────────
async function loginIfNeeded(page) {
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle0', timeout: 30000 });

  // NextAuth redirige al dashboard si ya hay sesión activa
  if (page.url().includes('/dashboard')) {
    console.log('  ✓ Sesión activa.');
    return;
  }

  console.log('  ▶ Iniciando sesión…');
  await page.type('input[name="email"]', CREDENTIALS.email);
  await page.type('input[name="password"]', CREDENTIALS.password);
  await page.click('button[type="submit"]');

  // Next.js usa router.push() — esperar cambio de URL en vez de navegación HTTP
  await page.waitForFunction(
    () => window.location.pathname.includes('/dashboard'),
    { timeout: 15000 },
  );

  if (!page.url().includes('/dashboard')) {
    throw new Error(`Login falló — URL actual: ${page.url()}`);
  }
  console.log('  ✓ Login exitoso.');
}

// ───── Render & mix un formato ──────────────────────────────────────────
async function renderFormat(fmt, browser) {
  const tag = fmt.name;
  console.log(`\n━━━━━━━ Formato ${tag} (${fmt.outputWidth}x${fmt.outputHeight}) ━━━━━━━`);

  const tempMp4raw = path.join(OUTPUT_DIR, `_raw_${tag}.mp4`);
  const tempWebm   = path.join(OUTPUT_DIR, `_raw_${tag}.webm`);
  const tempFixed  = path.join(OUTPUT_DIR, `_fixed_${tag}.mp4`);
  const videoOnly  = path.join(OUTPUT_DIR, `_video_${tag}.mp4`);
  const finalMp4   = path.join(OUTPUT_DIR, `spot-${tag}.mp4`);

  const page = await browser.newPage();
  await page.setViewport({ width: fmt.captureWidth, height: fmt.captureHeight, deviceScaleFactor: 1 });

  await loginIfNeeded(page);

  // CSS global para ocultar cursor
  async function goTo(url) {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.addStyleTag({ content: '* { cursor: none !important; } select { display: none !important; }' });
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  // Escribe en un campo letra por letra (efecto "humano")
  async function typeField(selector, text) {
    await page.focus(selector);
    for (const char of text) {
      await page.type(selector, char, { delay: 60 });
    }
  }

  // ── Flujo demostrativo ──────────────────────────────────────────────────
  // Escena 1: Dashboard (~4.5s)
  console.log('  ▶ Escena 1: Dashboard');
  await goTo('http://localhost:3000/dashboard');
  await sleep(500);

  // ── Captura frame-by-frame (page.screencast es inestable en Linux headless) ──
  const frameDir = path.join(OUTPUT_DIR, `_frames_${tag}`);
  fs.mkdirSync(frameDir, { recursive: true });
  const frameIntervalMs = 1000 / CAPTURE_FPS;
  let frameIdx = 0;

  async function captureFrames(durationMs, label) {
    const count = Math.ceil(durationMs / frameIntervalMs);
    process.stdout.write(`  ${label}: `);
    for (let i = 0; i < count; i++) {
      const framePath = path.join(frameDir, `frame_${String(frameIdx).padStart(6, '0')}.png`);
      await page.screenshot({ path: framePath, type: 'png' });
      frameIdx++;
      if (i % 10 === 0) process.stdout.write('.');
      await sleep(frameIntervalMs);
    }
    process.stdout.write(` ${count}f\n`);
  }

  // Escena 1: Dashboard (4s)
  await captureFrames(4000, 'Dashboard');

  // Escena 2: Agenda (5s) — clic en "Agenda" en sidebar
  console.log('  ▶ Escena 2: Agenda');
  await page.click('a[href="/dashboard/agenda"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await page.addStyleTag({ content: '* { cursor: none !important; }' });
  await sleep(300);
  await captureFrames(5000, 'Agenda');

  // Escena 3: Pacientes (4s) — clic en "Pacientes" en sidebar
  console.log('  ▶ Escena 3: Pacientes');
  await page.click('a[href="/dashboard/pacientes"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await page.addStyleTag({ content: '* { cursor: none !important; }' });
  await sleep(300);
  await captureFrames(4000, 'Pacientes');

  // Escena 4: Nuevo paciente form — clic en "+ Nuevo paciente"
  console.log('  ▶ Escena 4: Nuevo paciente');
  await page.click('a[href="/dashboard/pacientes/nuevo"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await page.addStyleTag({ content: '* { cursor: none !important; }' });
  await sleep(300);

  // Mostrar el form vacío (1.5s)
  await captureFrames(1500, 'Form vacío');

  // Escribir datos mientras se graba
  const typingPromise = (async () => {
    await typeField('input[name="nombre"]', 'María');
    await typeField('input[name="apellido"]', 'González');
    await typeField('input[name="rut"]', '12.345.678-9');
    await typeField('input[name="telefono"]', '+56 9 8765 4321');
  })();
  await captureFrames(5000, 'Llenando form');
  await typingPromise.catch(() => {}); // asegura que terminó

  // Mostrar form lleno (2.5s)
  await captureFrames(2500, 'Form lleno');

  console.log(`\n  ✓ ${frameIdx} frames capturados en total.`);
  await page.close();

  // ── Frames → H.264, escalando si hace falta ──────────────────────────────
  const needsScale = fmt.captureWidth !== fmt.outputWidth || fmt.captureHeight !== fmt.outputHeight;
  const scaleFlag = needsScale
    ? `-vf "scale=${fmt.outputWidth}:${fmt.outputHeight}:force_original_aspect_ratio=decrease,pad=${fmt.outputWidth}:${fmt.outputHeight}:(ow-iw)/2:(oh-ih)/2"`
    : '';

  console.log(`▶ Frames → MP4${needsScale ? ' (escala)' : ''}…`);
  sh(`ffmpeg -y -framerate ${CAPTURE_FPS} -start_number 0 -i "${frameDir}/frame_%06d.png" -c:v libx264 -pix_fmt yuv420p -preset medium -crf 18 -r ${FPS} ${scaleFlag} "${videoOnly}"`);

  // Limpiar frames
  fs.readdirSync(frameDir).forEach(f => fs.unlinkSync(path.join(frameDir, f)));
  fs.rmdirSync(frameDir);

  const videoInput = videoOnly;

  // ── Audio (condicional: solo si existen voz.mp3 y spot.mp3) ────────────
  if (hasAudio()) {
    console.log('▶ Mezclando voz + música…');
    const filter = `[2:a]volume=${BGM_VOLUME}[bgm];[1:a][bgm]amix=inputs=2:duration=first:dropout_transition=0[a]`;
    sh(`ffmpeg -y -i "${videoInput}" -i "${VOZ}" -i "${BGM}" -filter_complex "${filter}" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "${finalMp4}"`);
  } else {
    console.log('▶ Sin audio (voz.mp3 / spot.mp3 no encontrados), copiando solo video…');
    sh(`ffmpeg -y -i "${videoInput}" -c:v copy "${finalMp4}"`);
  }

  if (fs.existsSync(videoOnly)) fs.unlinkSync(videoOnly);

  console.log(`✓ ${finalMp4}`);
  return finalMp4;
}

// ───── Main ─────────────────────────────────────────────────────────────
(async () => {
  console.log('▶ Pre-checks…');
  checkFfmpeg();
  if (!hasAudio()) {
    console.log('  ⚠ Audio no disponible — se generará video sin audio.');
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('▶ Lanzando Chrome headless…');
  const launchOpts = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--hide-scrollbars',
      '--mute-audio',
      '--use-gl=swiftshader',
      '--enable-accelerated-2d-canvas',
      '--enable-webgl',
      '--disable-dev-shm-usage',
    ],
  };
  if (process.env.CHROME_PATH) {
    console.log(`  usando CHROME_PATH=${process.env.CHROME_PATH}`);
    launchOpts.executablePath = process.env.CHROME_PATH;
  }
  const browser = await puppeteer.launch(launchOpts);

  const results = [];
  for (const fmt of FORMATS) {
    results.push(await renderFormat(fmt, browser));
  }

  await browser.close();

  console.log('\n✓ Listo. Archivos generados:');
  results.forEach(r => console.log(`   ${r}`));
})().catch(err => {
  console.error('\n✗ Error:', err && err.message ? err.message : err);
  process.exit(1);
});
