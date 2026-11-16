#!/bin/sh
# canvas.html に仕様書（と、任意で注記）を埋め込み、単体で開ける図を作る。
#
#   sh embed.sh <canvas.html> <spec.json> <flow.html> [overlay.json]
#
# canvas.html の最初の /*DESIGN*/null を仕様書に、注記を渡したら最初の /*OVERLAY*/null を注記に置き換える。
# 中身の </ は <\/ に変える（<script> の中で閉じないように）。置き換える所が無ければ、何も書かずに止まる。
# POSIX の sh と標準の道具（grep・sed・head・tail・mktemp）だけを使う。
set -eu

usage() { echo "使い方: sh embed.sh <canvas.html> <spec.json> <flow.html> [overlay.json]" >&2; exit 2; }
[ $# -ge 3 ] && [ $# -le 4 ] || usage
canvas=$1 spec=$2 out=$3 overlay=${4:-}
for f in "$canvas" "$spec" ${overlay:+"$overlay"}; do
  [ -f "$f" ] && [ -r "$f" ] || { echo "embed.sh: 読めない: $f" >&2; exit 1; }
done

# marker の最初の行の番号（無ければ空）
line_of() { grep -n -F -- "$1" "$2" | head -n 1 | cut -d: -f1; }

# put <marker> <中身のファイル> <元> <先>：元の最初の marker を、</ を <\/ に変えた中身で置き換えて先に書く
put() {
  n=$(line_of "$1" "$3")
  [ -n "$n" ] || { echo "embed.sh: $3 に $1 が無い（canvas.html ではないか、もう埋め込んである）" >&2; return 1; }
  l=$(sed -n "${n}p" "$3")
  {
    head -n $((n - 1)) "$3"
    printf '%s' "${l%%"$1"*}"
    LC_ALL=C sed 's#</#<\\/#g' "$2"
    printf '%s\n' "${l#*"$1"}"
    tail -n +$((n + 1)) "$3"
  } > "$4"
}

dir=$(dirname -- "$out")
tmp=$(mktemp "$dir/.embed.XXXXXX")
tmp2=$(mktemp "$dir/.embed.XXXXXX")
trap 'rm -f "$tmp" "$tmp2"' EXIT
# 注記を先に置き換える（仕様書の中に /*OVERLAY*/null の字があっても、それを置き換えない）
if [ -n "$overlay" ]; then
  put '/*OVERLAY*/null' "$overlay" "$canvas" "$tmp2"
  put '/*DESIGN*/null' "$spec" "$tmp2" "$tmp"
else
  put '/*DESIGN*/null' "$spec" "$canvas" "$tmp"
fi
chmod 644 "$tmp"
mv -f "$tmp" "$out"
