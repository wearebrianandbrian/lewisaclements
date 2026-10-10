#!/bin/zsh
# Builds web-ready media for the trailer site from the source folders.
# Uses only built-in macOS tools (avconvert, qlmanage, sips). Re-run safe: skips outputs that already exist.
set -u
cd "${0:A:h}"
SRC="../TRAILERS"
BB="$HOME/Documents/B&B/site/media"
TMP=$(mktemp -d)

# vid <source> <dest.mp4> [poster-at-fraction]
vid() {
  local src="$1" out="$2" at="${3:-0.35}"
  mkdir -p "${out:h}"
  [[ -f "$out" ]] || avconvert -s "$src" -p Preset1920x1080 -o "$out" --replace >/dev/null 2>&1 || echo "FAILED $src"
  local poster="${out:r}.poster.jpg"
  if [[ ! -f "$poster" ]]; then
    local d=$(mdls -raw -name kMDItemDurationSeconds "$src")   # source is already indexed; the new file may not be
    local t=$(python3 -c "print(round($d*$at,2))")
    avconvert -s "$out" -p Preset1920x1080 -o "$TMP/p.mp4" --start $t --duration 0.4 --replace >/dev/null 2>&1
    rm -f "$TMP/p.mp4.png"; perl -e 'alarm 60; exec @ARGV' qlmanage -t -s 1920 -o "$TMP" "$TMP/p.mp4" >/dev/null 2>&1
    sips -s format jpeg -s formatOptions 82 "$TMP/p.mp4.png" --out "$poster" >/dev/null
  fi
}
# preview <source.mp4> <dest.mp4> <start> [seconds]
preview() {
  [[ -f "$2" ]] || avconvert -s "$1" -p Preset960x540 -o "$2" --start "$3" --duration "${4:-8}" --replace >/dev/null 2>&1
}
cpy() { mkdir -p "${2:h}"; [[ -f "$2" ]] || cp "$1" "$2"; }

# Dexter
vid "$SRC/DEXTER/Dexter_60s.mp4" media/dexter/dexter-60.mp4 0.4
vid "$SRC/DEXTER/DEXTER_YT_SHORTS_9x16_15_ONLINE.mov" media/dexter/youtube-shorts.mp4 0.4
vid "$SRC/DEXTER/DEXTER_OCT_METAREELS_9x16_15_FINAL.mp4" media/dexter/meta-reels.mp4 0.4
vid "$SRC/DEXTER/DEXTER_OCT_SNAPCHAT_CLIPS_9x16_15_FINAL.mp4" media/dexter/snapchat.mp4 0.4
vid "$SRC/DEXTER/Dexter_Conceptual_October_TIKTOK_9x16_20_Final.mp4" media/dexter/tiktok.mp4 0.4
preview media/dexter/dexter-60.mp4 media/dexter/preview.mp4 18
cpy "$SRC/DEXTER/WhatsApp Image 2026-10-02 at 17.17.45.jpeg" media/dexter/killing-it-at-work.jpg

# The Girl from Plainville
vid "$SRC/THE GIRL FROM PLAINVILLE/PLAINVILLE.mp4" media/plainville/plainville.mp4 0.3
preview media/plainville/plainville.mp4 media/plainville/preview.mp4 8

# Film4 seasons
vid "$SRC/TOM CRUISE WEEK/F4_Tom Cruise Week_40A_V02.mov" media/film4/tom-cruise-week.mp4 0.45
vid "$SRC/FILM FEAR/C4S24C4T44002A.mp4" media/film4/film-fear-1.mp4 0.4
vid "$SRC/FILM FEAR/C4S24F4T42006I.mov" media/film4/film-fear-2.mp4 0.4
preview media/film4/tom-cruise-week.mp4 media/film4/preview.mp4 6
i=0; for f in "$SRC/FILM FEAR/"*.jpg; do i=$((i+1)); [[ -f media/film4/film-fear-art-$i.jpg ]] || sips -Z 1800 -s format jpeg -s formatOptions 82 "$f" --out media/film4/film-fear-art-$i.jpg >/dev/null; done

# All4 Fright Night
vid "$SRC/ALL4 FRIGHT NIGHT/all4_-_fright_night_(halloween_collection)_v1 (1080p).mp4" media/fright-night/fright-night.mp4 0.4
preview media/fright-night/fright-night.mp4 media/fright-night/preview.mp4 6

# Freaks (Film4)
vid "$SRC/FREAKS/film4_-_freaks (1080p).mp4" media/film4/freaks.mp4 0.4
preview media/film4/freaks.mp4 media/film4/preview-freaks.mp4 6

# Reused from the Brian & Brian site (already web-ready)
for f in bake-off-linkedin teaser-nigella teaser-paul teaser-alison teaser-noel preview; do
  cpy "$BB/bake-off/$f.mp4" media/bake-off/$f.mp4; [[ -f "$BB/bake-off/$f.poster.jpg" ]] && cpy "$BB/bake-off/$f.poster.jpg" media/bake-off/$f.poster.jpg; done
cpy "$BB/bake-off/billboard-02-mockup-0-jpg-copy.jpg" media/bake-off/cover.jpg
for f in mafsuk-mts-60 clips-promo mafswk3posters1-raild-230925 mafswk3posters2-raild-230925 mafswk4poster-raild-231002q-111753 mafswk5poster-raild-231005-111755; do
  cpy "$BB/mafs/$f.mp4" media/mafs/$f.mp4; cpy "$BB/mafs/$f.poster.jpg" media/mafs/$f.poster.jpg; done
cpy "$BB/mafs/preview-mts60.mp4" media/mafs/preview.mp4
cpy "$BB/mafs/mafs-uk-thumbnail-1.jpg" media/mafs/cover.jpg
for f in c4-celebritygogglebox-goggleheads celebritygogglebox-singlescene-tiktok-9x16-15 c4-celebrity-gogglebox-snapchat-stories-9x16-raw-cinemagraph preview; do
  cpy "$BB/celebrity-gogglebox/$f.mp4" media/gogglebox/$f.mp4; [[ -f "$BB/celebrity-gogglebox/$f.poster.jpg" ]] && cpy "$BB/celebrity-gogglebox/$f.poster.jpg" media/gogglebox/$f.poster.jpg; done
cpy "$BB/celebrity-gogglebox/gogglebox-website-thumbnail-2.jpg" media/gogglebox/cover.jpg
for f in gogglebox-website-thumbnail-2 celeb-gogglebox-individual-images4 celeb-gogglebox-individual-images5 celeb-gogglebox-individual-images6; do cpy "$BB/celebrity-gogglebox/$f.jpg" media/gogglebox/$f.jpg; done

for d in joe-wicks criminally-funny; do mkdir -p media/$d; for f in "$BB/$d"/*; do cpy "$f" "media/$d/${f:t}"; done; done
rm -f media/joe-wicks/wicks-4x5-deadlift.jpg media/criminally-funny/c4-comedy-tapandhold-jpegdamage.*

# About + logo
mkdir -p media/about
[[ -f media/about/lewis.jpg ]] || sips -Z 1200 -s format jpeg -s formatOptions 82 "../LOGO + IMAGE/IMG_0005.JPG" --out media/about/lewis.jpg >/dev/null
[[ -f media/about/logo.png ]] || sips -Z 900 "../LOGO + IMAGE/Lewis-Clements-Logo-Design-V2-6.png" --out media/about/logo.png >/dev/null

rm -rf "$TMP"
echo done
