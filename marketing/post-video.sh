#!/usr/bin/env bash
# post-video.sh — recorta el login, agrega los textos en pantalla y exporta
# dos MP4 H.264: 1920x1080 y 1080x1080.
#
# Uso:  node marketing/demo-video.js  &&  bash marketing/post-video.sh
# Lee marketing/output/_raw.webm + marcas.json (las marcas las escribe el
# script de grabación, así los textos caen sincronizados con el recorrido).
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)/output"
RAW="$DIR/_raw.webm"
MARCAS="$DIR/marcas.json"
FUENTE=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
CAP="$DIR/_captions"

[ -f "$RAW" ] || { echo "falta $RAW — corre antes: node marketing/demo-video.js"; exit 1; }
mkdir -p "$CAP"

leer() { node -p "require('$MARCAS').$1"; }
TRIM=$(leer dashboard)   # el login se recorta hasta acá
FIN=$(leer fin)
rel() { node -p "Math.round(($1 - $TRIM) * 10) / 10"; }

T_PACIENTES=$(rel "$(leer pacientes)")
T_CREAR=$(rel "$(leer crear)")
T_CIERRE=$(rel "$(leer cierre)")
DUR=$(rel "$FIN")

echo "recorte del login: ${TRIM}s | duración del cuerpo: ${DUR}s | + 5s de cierre"

# Los textos van en archivo para no tener que escapar ':' ni acentos.
printf '%s' "Plataforma de gestión para centros médicos" > "$CAP/1.txt"
printf '%s' "Módulo de pacientes — datos ficticios"      > "$CAP/2.txt"
printf '%s' "Persistencia contra base de datos real"     > "$CAP/3.txt"
printf '%s' "Next.js 16 · TypeScript · Prisma · Supabase" > "$CAP/4.txt"
printf '%s' "Gonzalo Simpson — Desarrollador Full-Stack" > "$CAP/5.txt"
printf '%s' "Abierto a nuevas oportunidades"             > "$CAP/6.txt"

# Caja negra semitransparente + borde: legible sobre cualquier color de fondo.
cap() { # $1=archivo $2=inicio $3=fin $4=fontsize $5=y
  echo "drawtext=fontfile=${FUENTE}:textfile=${CAP}/$1:fontcolor=white:fontsize=$4"\
"pxel:box=1:boxcolor=black@0.72:boxborderw=26:x=(w-text_w)/2:y=$5"\
":enable='between(t,$2,$3)'" | sed 's/pxel//'
}

# ─── 1920x1080 ────────────────────────────────────────────────────────────
F169="$(cap 1.txt 0.6 5.6 52 'h-190'),$(cap 2.txt "$T_PACIENTES" "$(node -p "$T_PACIENTES+5")" 52 'h-190'),$(cap 3.txt "$T_CREAR" "$(node -p "$T_CREAR+5.5")" 52 'h-190'),$(cap 4.txt "$T_CIERRE" "$(node -p "$T_CIERRE+5.5")" 52 'h-190')"

echo "· cuerpo 16:9"
ffmpeg -v error -ss "$TRIM" -i "$RAW" -t "$DUR" \
  -vf "$F169,format=yuv420p" -c:v libx264 -preset slow -crf 20 -r 30 -an \
  "$DIR/_cuerpo-16x9.mp4" -y

echo "· cierre 16:9"
ffmpeg -v error -f lavfi -i color=c=0x1c1917:s=1920x1080:d=5:r=30 \
  -vf "drawtext=fontfile=${FUENTE}:textfile=${CAP}/5.txt:fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h/2)-70,drawtext=fontfile=${FUENTE}:textfile=${CAP}/6.txt:fontcolor=0xa8a29e:fontsize=44:x=(w-text_w)/2:y=(h/2)+20,format=yuv420p" \
  -c:v libx264 -preset slow -crf 20 -an "$DIR/_cierre-16x9.mp4" -y

# ─── 1080x1080 ────────────────────────────────────────────────────────────
# La app es apaisada: se escala a 1080 de ancho y se rellena arriba/abajo.
# Los textos van en la banda inferior, así no tapan la interfaz.
ESC="scale=1080:-2,pad=1080:1080:0:(1080-ih)/2:color=0x1c1917"
F11="$(cap 1.txt 0.6 5.6 40 'h-170'),$(cap 2.txt "$T_PACIENTES" "$(node -p "$T_PACIENTES+5")" 40 'h-170'),$(cap 3.txt "$T_CREAR" "$(node -p "$T_CREAR+5.5")" 40 'h-170'),$(cap 4.txt "$T_CIERRE" "$(node -p "$T_CIERRE+5.5")" 36 'h-170')"

echo "· cuerpo 1:1"
ffmpeg -v error -ss "$TRIM" -i "$RAW" -t "$DUR" \
  -vf "$ESC,$F11,format=yuv420p" -c:v libx264 -preset slow -crf 20 -r 30 -an \
  "$DIR/_cuerpo-1x1.mp4" -y

echo "· cierre 1:1"
ffmpeg -v error -f lavfi -i color=c=0x1c1917:s=1080x1080:d=5:r=30 \
  -vf "drawtext=fontfile=${FUENTE}:textfile=${CAP}/5.txt:fontcolor=white:fontsize=44:x=(w-text_w)/2:y=(h/2)-60,drawtext=fontfile=${FUENTE}:textfile=${CAP}/6.txt:fontcolor=0xa8a29e:fontsize=34:x=(w-text_w)/2:y=(h/2)+15,format=yuv420p" \
  -c:v libx264 -preset slow -crf 20 -an "$DIR/_cierre-1x1.mp4" -y

# ─── Unir cuerpo + cierre ─────────────────────────────────────────────────
for R in 16x9 1x1; do
  printf "file '%s'\nfile '%s'\n" "$DIR/_cuerpo-$R.mp4" "$DIR/_cierre-$R.mp4" > "$DIR/_lista-$R.txt"
  ffmpeg -v error -f concat -safe 0 -i "$DIR/_lista-$R.txt" -c copy "$DIR/demo-$R.mp4" -y
  echo "✓ $DIR/demo-$R.mp4  ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$DIR/demo-$R.mp4")s)"
done

rm -f "$DIR"/_cuerpo-*.mp4 "$DIR"/_cierre-*.mp4 "$DIR"/_lista-*.txt
rm -rf "$CAP"
