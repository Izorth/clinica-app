#!/usr/bin/env bash
# post-video.sh — recorta el login, agrega los textos en pantalla y exporta
# dos MP4 H.264: 1920x1080 y 1080x1080.
#
# Uso:
#   node marketing/demo-video.js                              # 16:9
#   DEMO_W=1200 DEMO_H=900 node marketing/demo-video.js       # 1:1
#   bash marketing/post-video.sh
#
# Son dos grabaciones distintas a propósito: escalar la captura de 1920 a un
# cuadro de 1080 deja las tablas ilegibles en un feed de celular. El 1:1 se
# graba a 1200x900, se escala a 1080x810 y se rellena arriba/abajo; los textos
# van en la banda inferior, sin tapar la interfaz.
#
# Cada formato lee su propio marcas-<W>x<H>.json, así los textos caen
# sincronizados con el recorrido aunque los tiempos cambien entre corridas.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)/output"
FUENTE=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
CAP="$DIR/_captions"
mkdir -p "$CAP"

printf '%s' "Plataforma de gestión para centros médicos"  > "$CAP/1.txt"
printf '%s' "Módulo de pacientes — datos ficticios"       > "$CAP/2.txt"
printf '%s' "Persistencia contra base de datos real"      > "$CAP/3.txt"
printf '%s' "Next.js 16 · TypeScript · Prisma · Supabase" > "$CAP/4.txt"
printf '%s' "Gonzalo Simpson — Desarrollador Full-Stack"  > "$CAP/5.txt"
printf '%s' "Abierto a nuevas oportunidades"              > "$CAP/6.txt"

# Caja negra semitransparente: legible sobre cualquier color de fondo.
cap() { # 1=archivo 2=inicio 3=fin 4=fontsize 5=y
  printf "drawtext=fontfile=%s:textfile=%s/%s:fontcolor=white:fontsize=%s:box=1:boxcolor=black@0.72:boxborderw=22:x=(w-text_w)/2:y=%s:enable='between(t,%s,%s)'" \
    "$FUENTE" "$CAP" "$1" "$4" "$5" "$2" "$3"
}

procesar() { # 1=nombre 2=WxH grabado 3=filtro de escalado 4=fontsize 5=y-captions 6=WxH salida 7=font cierre
  local nombre="$1" fuente_wh="$2" escala="$3" fs="$4" ycap="$5" salida_wh="$6" fs_cierre="$7"
  local raw="$DIR/_raw-${fuente_wh}.webm" marcas="$DIR/marcas-${fuente_wh}.json"
  [ -f "$raw" ] || { echo "falta $raw — corre antes el script de grabación"; exit 1; }

  local trim fin dur t_pac t_crear t_cierre
  trim=$(node -p "require('$marcas').dashboard")
  fin=$(node -p "require('$marcas').fin")
  dur=$(node -p "Math.round(($fin - $trim)*10)/10")
  t_pac=$(node -p "Math.round((require('$marcas').pacientes - $trim)*10)/10")
  t_crear=$(node -p "Math.round((require('$marcas').crear - $trim)*10)/10")
  t_cierre=$(node -p "Math.round((require('$marcas').cierre - $trim)*10)/10")

  echo "· $nombre — recorte del login ${trim}s, cuerpo ${dur}s, + 5s de cierre"

  local filtros
  filtros="$(cap 1.txt 0.6 5.6 "$fs" "$ycap"),$(cap 2.txt "$t_pac" "$(node -p "$t_pac+5")" "$fs" "$ycap"),$(cap 3.txt "$t_crear" "$(node -p "$t_crear+5.5")" "$fs" "$ycap"),$(cap 4.txt "$t_cierre" "$(node -p "$t_cierre+5.5")" "$fs" "$ycap")"

  ffmpeg -v error -ss "$trim" -i "$raw" -t "$dur" \
    -vf "${escala}${filtros},format=yuv420p" \
    -c:v libx264 -preset slow -crf 20 -r 30 -an "$DIR/_cuerpo-$nombre.mp4" -y

  ffmpeg -v error -f lavfi -i "color=c=0x1c1917:s=${salida_wh}:d=5:r=30" \
    -vf "drawtext=fontfile=${FUENTE}:textfile=${CAP}/5.txt:fontcolor=white:fontsize=${fs_cierre}:x=(w-text_w)/2:y=(h/2)-70,drawtext=fontfile=${FUENTE}:textfile=${CAP}/6.txt:fontcolor=0xa8a29e:fontsize=$((fs_cierre*7/10)):x=(w-text_w)/2:y=(h/2)+15,format=yuv420p" \
    -c:v libx264 -preset slow -crf 20 -an "$DIR/_cierre-$nombre.mp4" -y

  printf "file '%s'\nfile '%s'\n" "$DIR/_cuerpo-$nombre.mp4" "$DIR/_cierre-$nombre.mp4" > "$DIR/_lista-$nombre.txt"
  ffmpeg -v error -f concat -safe 0 -i "$DIR/_lista-$nombre.txt" -c copy "$DIR/demo-$nombre.mp4" -y
  echo "  ✓ $DIR/demo-$nombre.mp4 ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$DIR/demo-$nombre.mp4")s)"
  rm -f "$DIR/_cuerpo-$nombre.mp4" "$DIR/_cierre-$nombre.mp4" "$DIR/_lista-$nombre.txt"
}

procesar 16x9 1920x1080 "" 52 "h-190" 1920x1080 64
# 1200x900 -> 1080x810, centrado en un cuadro de 1080 con bandas de 135px.
procesar 1x1 1200x900 "scale=1080:-2,pad=1080:1080:0:(1080-ih)/2:color=0x1c1917," 38 "h-100" 1080x1080 44

rm -rf "$CAP"
