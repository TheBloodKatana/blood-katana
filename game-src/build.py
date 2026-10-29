import pathlib,base64,subprocess,json,re,io,tempfile
# Joins the game's modules into one HTML file and copies it into the Android app (www/index.html).
# Run from anywhere: python3 game-src/build.py   (pyftsubset from fonttools is optional; it shrinks the Japanese font)
HERE=pathlib.Path(__file__).resolve().parent;S=HERE/'src';A=HERE/'fonts';TMP=pathlib.Path(tempfile.gettempdir())
ORDER=['00_lang.js','01_core.js','01b_music.js','02_data.js','02b_content.js','02c_cosmetics.js','03_sprites.js','03b_sprites.js','04_world.js','05_combat.js','05b_weapons.js','05c_skills.js','05d_foes.js','05e_bosses.js','06_run.js','06c_hub.js','06b_tree.js','06d_app.js','06e_shop.js','06h_preview.js','06i_gift.js','06j_prologue.js','06k_thirst.js','06l_elements.js','06f_modes.js','06g_feats.js','07_main.js']
js='\n'.join((S/f).read_text() for f in ORDER if (S/f).exists())
js=js.replace("'__PLAYER_B64__'","'"+(S/'player_sheet.b64').read_text().strip()+"'")
js=js.replace('__CHAR_B64__',(S/'char_sheets.json').read_text().strip())
js=js.replace('__LANG_JSON__',(S/'lang.json').read_text().strip())
js='(function(){"use strict";\n'+js+'\n})();'
(TMP/'bk.js').write_text(js)
page=(S/'page.html').read_text()
# ---- fonts: embedded, and the Japanese face cut down to the characters the game actually uses ----
def b64(path):return base64.b64encode(pathlib.Path(path).read_bytes()).decode()
used=sorted(set(ch for ch in (js+page) if ord(ch)>0x2000))
jp=A/'dotgothic16-japanese-400-normal.woff2';sub=TMP/'dg16-sub.woff2'
txt=TMP/'dg16-chars.txt';txt.write_text(''.join(used))
try:
  subprocess.run(['pyftsubset',str(jp),f'--text-file={txt}','--flavor=woff2',f'--output-file={sub}','--layout-features=*'],check=True,capture_output=True)
except Exception as e:print('subset failed',e)
def face(fam,path,weight=400,rng=None):
  r=f'unicode-range:{rng};' if rng else ''
  return f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{weight};font-display:block;src:url(data:font/woff2;base64,{b64(path)}) format('woff2');{r}}}\n"
LAT='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
EXT='U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'
css=face('Silkscreen',A/'silkscreen-latin-400-normal.woff2',400,LAT)+face('Silkscreen',A/'silkscreen-latin-ext-400-normal.woff2',400,EXT)
css+=face('DotGothic16',A/'dotgothic16-latin-400-normal.woff2',400,LAT)+face('DotGothic16',A/'dotgothic16-latin-ext-400-normal.woff2',400,EXT)
if sub.exists():css+=face('DotGothic16',sub,400)
CYR='U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'
css+=face('DotGothic16',A/'dotgothic16-cyrillic-400-normal.woff2',400,CYR)+face('JetBrains Mono',A/'jetbrains-mono-cyrillic-400-normal.woff2',400,CYR)
css+=face('JetBrains Mono',A/'jetbrains-mono-latin-400-normal.woff2',400)+face('JetBrains Mono',A/'jetbrains-mono-latin-500-normal.woff2',500)
page=page.replace('/*__FONTS__*/',css)
assert '/*__SCRIPT__*/' in page
out=page.replace('/*__SCRIPT__*/',js)
(HERE/'blood-katana.html').write_text(out)
www=HERE.parent/'www'
if www.exists():(www/'index.html').write_text(out)
print(len(out),'bytes ·',len(used),'special characters')
