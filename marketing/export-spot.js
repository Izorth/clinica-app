/**
 * export-spot.js
 *
 * Graba el spot reproducido en localhost:3000/spot.html en TRES aspect ratios
 * nativos y produce 3 MP4 listos para publicar:
 *
 *   marketing/output/spot-16x9.mp4   (1920x1080, landing / YouTube)
 *   marketing/output/spot-9x16.mp4   (1080x1920, Reels / TikTok / Stories)
 *   marketing/output/spot-1x1.mp4    (1080x1080, LinkedIn / Twitter feed)
 *
 * El spot detecta el viewport y cambia de layout solo:
 *   - 16:9  → canvas a full bleed
 *   - 9:16  → header con logo arriba + canvas al centro + footer con caption/CTA
 *   - 1:1   → similar a 9:16 pero más compacto
 *
 * Cómo usar (desde la raíz del proyecto, con `npm run dev` en otra terminal):
 *
 *   node marketing/export-spot.js
 *
 * Si Chromium descargado por Puppeteer falla, exporta CHROME_PATH:
 *   CHROME_PATH=/usr/bin/chromium-browser node marketing/export-spot.js
 *
 * Pre-requisitos:
 *   - ffmpeg en el PATH
 *   - public/music/voz.mp3 y public/music/spot.mp3 existen
 *   - dev server activo en http://localhost:3000
 */

const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ───── Config ───────────────────────────────────────────────────────────
const SPOT_URL    = 'http://localhost:3000/spot.html';
const DURATION_MS = 22500;          // duración del spot + buffer
const FPS         = 30;
const BGM_VOLUME  = 0.22;           // música al 22% bajo la voz
const PROJECT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR  = path.join(__dirname, 'output');
const VOZ         = path.join(PROJECT_DIR, 'public', 'music', 'voz.mp3');
const BGM         = path.join(PROJECT_DIR, 'public', 'music', 'spot.mp3');

const FORMATS = [
  { name: '16x9', width: 1920, height: 1080 },
  { name: '9x16', width: 1080, height: 1920 },
  { name: '1x1',  width: 1080, height: 1080 },
];

// ───── Helpers ──────────────────────────────────────────────────────────
function sh(cmd) {
  console.log('  $ ' + cmd);
  execSync(cmd, { stdio: 'inherit' });
}
function checkFile(p, name) {
  if (!fs.existsSync(p)) {
    console.error(`✗ Falta el archivo: ${name} (${p})`);
    process.exit(1);
  }
}
function checkFfmpeg() {
  try { execSync('ffmpeg -version', { stdio: 'pipe' }); }
  catch { console.error('✗ ffmpeg no está en el PATH. Instálalo con `sudo apt install ffmpeg`.'); process.exit(1); }
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ───── Render & mix un formato ──────────────────────────────────────────
async function renderFormat(fmt, browser) {
  const tag = fmt.name;
  console.log(`\n━━━━━━━ Formato ${tag} (${fmt.width}x${fmt.height}) ━━━━━━━`);

  const tempWebm  = path.join(OUTPUT_DIR, `_raw_${tag}.webm`);
  const videoOnly = path.join(OUTPUT_DIR, `_video_${tag}.mp4`);
  const finalMp4  = path.join(OUTPUT_DIR, `spot-${tag}.mp4`);

  const page = await browser.newPage();
  await page.setViewport({ width: fmt.width, height: fmt.height, deviceScaleFactor: 1 });

  console.log(`▶ Abriendo ${SPOT_URL} …`);
  await page.goto(SPOT_URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluateHandle('document.fonts.ready');
  await sleep(800);

  await page.addStyleTag({ content: '*{cursor:none !important}' });

  console.log(`▶ Grabando (${DURATION_MS / 1000}s @ ${FPS}fps)…`);
  let recorder;
  try {
    recorder = await page.screencast({ path: tempWebm, fps: FPS });
  } catch (e) {
    console.error('✗ `page.screencast` no está disponible. Puppeteer >= 22 requerido.');
    await page.close();
    throw e;
  }

  await page.evaluate(() => {
    const play = document.getElementById('play');
    if (play) play.click();
  });

  await sleep(DURATION_MS);
  await recorder.stop();
  await page.close();

  console.log('▶ WebM → MP4 (video)…');
  sh(`ffmpeg -y -i "${tempWebm}" -c:v libx264 -pix_fmt yuv420p -preset medium -crf 18 -r ${FPS} "${videoOnly}"`);

  console.log('▶ Mezclando voz + música…');
  const filter = `[2:a]volume=${BGM_VOLUME}[bgm];[1:a][bgm]amix=inputs=2:duration=first:dropout_transition=0[a]`;
  sh(`ffmpeg -y -i "${videoOnly}" -i "${VOZ}" -i "${BGM}" -filter_complex "${filter}" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "${finalMp4}"`);

  fs.unlinkSync(tempWebm);
  fs.unlinkSync(videoOnly);

  console.log(`✓ ${finalMp4}`);
  return finalMp4;
}

// ───── Main ─────────────────────────────────────────────────────────────
(async () => {
  console.log('▶ Pre-checks…');
  checkFfmpeg();
  checkFile(VOZ, 'voz.mp3');
  checkFile(BGM, 'spot.mp3');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('▶ Lanzando Chrome headless…');
  const launchOpts = {
    headless: 'new',
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--hide-scrollbars',
      '--mute-audio',
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
  console.log('\nSi un formato se desincroniza, ajusta DURATION_MS arriba.');
})().catch(err => {
  console.error('\n✗ Error:', err && err.message ? err.message : err);
  process.exit(1);
});
