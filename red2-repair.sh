#!/bin/bash
set -e
python3 -c "
import re,json
s=open('tsconfig.json').read()
open('tsconfig.json','w').write(re.sub(r',(\s*[\]}])', r'\1', s))
json.load(open('tsconfig.json'))
"
python3 -c "
p='src/lib/debug-logger.ts'; s=open(p).read()
i=s.find('export const logger')
j=s.find('export const logger', i+1) if i!=-1 else -1
if j!=-1: s=s[:j].rstrip()+'\n'
open(p,'w').write(s)
"
grep -q 'muted-foreground' src/tailwind.config.mjs || sed -i 's|\("color-7": "#6F0809ff"\)|\1, accent: "#6F0809", border: "rgba(255,255,255,0.12)", input: "#1a1a1a", ring: "#6F0809", muted: "#1a1a1a", "muted-foreground": "#a3a3a3", destructive: "#dc2626", "destructive-foreground": "#ffffff"|' src/tailwind.config.mjs
sed -i 's|url(/public/fonts/|url(/fonts/|g; s|},@font-face|}@font-face|g' src/styles/fonts.css
node -e "JSON.parse(require('fs').readFileSync('tsconfig.json','utf8'));console.log('tsconfig valid      OK')"
echo "logger decls        $(grep -c 'export const logger' src/lib/debug-logger.ts)  (want 1)"
echo "color tokens        $(grep -c 'muted-foreground' src/tailwind.config.mjs)  (want 1)"
echo "font /public/ refs  $(grep -c 'url(/public/fonts/' src/styles/fonts.css)  (want 0)"
echo "font comma bugs     $(grep -o '},@font-face' src/styles/fonts.css | wc -l)  (want 0)"
