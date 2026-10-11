import json
import os
D=os.path.dirname(os.path.abspath(__file__))+'/'
h=open(D+'shell.html').read();g=open(D+'game.js').read().replace('/*IMGS*/{}',open(D+'imgs.json').read())
import base64 as _b
MS=json.dumps(['data:image/webp;base64,'+_b.b64encode(open(D+f,'rb').read()).decode() for f in ['m_pelican.webp','m_kangaroo.webp','m_hummer.webp','m_bolt.webp']])
ui=open(D+'detail.js').read()+'\n'+open(D+'ui_part.js').read().replace('/*ICONS*/',json.dumps(json.load(open(D+'icons.json'))['icons']))+'\n'+open(D+'ui2.js').read().replace('/*MASCOTS*/',MS)
css=open(D+'ui_assets.css').read()+open(D+'ui_skin.css').read()+open(D+'ui2.css').read()+open(D+'phone2.css').read()
i=g.rindex('})();');g=g[:i]+ui+'\n'+g[i:]
h=h.replace('</style>',css+'\n</style>',1).replace('/*GAME*/',g)
import base64
h=h.replace('__LOGO__','data:image/png;base64,'+base64.b64encode(open(D+'logo_s.png','rb').read()).decode())
open(D+'index.html','w').write(h);print(len(h)//1024,'KB')
