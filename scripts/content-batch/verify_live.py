"""Verify current content, language metadata and images over HTTP."""
import concurrent.futures,datetime,hashlib,html.parser,json,pathlib,sys,time,urllib.request,urllib.error,urllib.parse,re

class Page(html.parser.HTMLParser):
 def __init__(self):super().__init__();self.lang=None;self.canonical=[];self.alternates={};self.text=[];self.skip=0;self.og=[];self.image_sources=[];self.robots=[]
 def handle_starttag(self,t,a):
  a=dict(a)
  if t in ['script','style']:self.skip+=1
  if t=='html':self.lang=a.get('lang')
  if t=='img' and a.get('src'):self.image_sources.append(a['src'])
  if t=='link' and a.get('rel')=='canonical':self.canonical.append(a.get('href'))
  if t=='link' and a.get('rel')=='alternate' and a.get('hreflang'):self.alternates[a['hreflang']]=a.get('href')
  if t=='meta' and a.get('property')=='og:image':self.og.append(a.get('content'))
  if t=='meta' and a.get('name','').lower() in ['robots','googlebot']:self.robots.append(a.get('content',''))
 def handle_endtag(self,t):
  if t in ['script','style'] and self.skip:self.skip-=1
 def handle_data(self,d):
  if not self.skip:self.text.append(d)
def norm(s):return re.sub(r'\s+',' ',s or '').strip()
def request(origin,path):
 for attempt in range(3):
  try:
   with urllib.request.urlopen(urllib.request.Request(origin+path,headers={'User-Agent':'Namefi-authorized-release-verification/1.0'}),timeout=50) as r:return r.status,r.url,r.headers,r.read()
  except (urllib.error.URLError,TimeoutError) as e:
   if attempt==2:raise
   time.sleep(1+attempt)
def pagecheck(p,origin,label):
 out={'path':p['path'],'locale':p['locale']};issues=[]
 try:
  status,url,headers,raw=request(origin,p['path']);parser=Page();parser.feed(raw.decode());text=norm(''.join(parser.text));out.update(status=status,final_url=url,html_lang=parser.lang,canonical=parser.canonical,alternates=parser.alternates,og_images=parser.og,image_sources=parser.image_sources,robots=parser.robots)
  if status!=200:issues.append('non-200')
  if urllib.parse.urlparse(url).path.rstrip('/')!=p['path']:issues.append('unexpected redirect')
  if parser.lang!=p['locale']:issues.append('html language mismatch')
  if len(parser.canonical)!=1 or urllib.parse.urlparse(parser.canonical[0]).path.rstrip('/')!=p['path']:issues.append('self canonical mismatch')
  if label=='production' and (not parser.canonical or urllib.parse.urlparse(parser.canonical[0]).netloc!=urllib.parse.urlparse(origin).netloc or urllib.parse.urlparse(parser.canonical[0]).scheme!='https'):issues.append('canonical origin mismatch')
  if label=='production' and any(urllib.parse.urlparse(v).netloc!=urllib.parse.urlparse(origin).netloc or urllib.parse.urlparse(v).scheme!='https' for v in parser.alternates.values()):issues.append('alternate origin mismatch')
  got={k:urllib.parse.urlparse(v).path.rstrip('/') for k,v in parser.alternates.items()}
  if got!=p['alternates']:issues.append('reciprocal alternates mismatch')
  if norm(p['title']) not in text:issues.append('current title absent')
  out['current_body_marker_present']=norm(p['marker']) in text
  if not out['current_body_marker_present']:issues.append('current body marker absent')
  if not parser.og:issues.append('OG image absent')
  if label=='production' and any('noindex' in value.lower() for value in parser.robots+[headers.get('X-Robots-Tag','')]):issues.append('production noindex directive')
 except Exception as e:issues.append(type(e).__name__+': '+str(e))
 out['issues']=issues;return out
def assetcheck(a,origin):
 out={'path':a['path']};issues=[]
 try:
  status,url,headers,data=request(origin,a['path']);digest=hashlib.sha256(data).hexdigest();out.update(status=status,sha256=digest,bytes=len(data),content_type=headers.get('Content-Type'))
  if status!=200:issues.append('non-200')
  if a.get('sha256') and digest!=a['sha256']:issues.append('published image differs from committed image')
  if not headers.get('Content-Type','').startswith('image/'):issues.append('image content type mismatch')
 except Exception as e:issues.append(type(e).__name__+': '+str(e))
 out['issues']=issues;return out
def verify(manifest, origin, label):
 origin=origin.rstrip('/')
 if not origin.startswith('https://') or not manifest.get('pages'):
  raise ValueError('A live manifest requires HTTPS and at least one page')
 for row in manifest['pages'] + manifest.get('assets',[]):
  if not row['path'].startswith('/r/') or row['path'].startswith('//'):
   raise ValueError('Live checks must use Resources paths')
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
  pages=list(pool.map(lambda p: pagecheck(p,origin,label),manifest['pages']))
  assets=list(pool.map(lambda a: assetcheck(a,origin),manifest.get('assets',[])))
  known={a['path'] for a in manifest.get('assets',[])};other=set()
  for p in pages:
   for raw in p.get('og_images',[])+p.get('image_sources',[]):
    parsed=urllib.parse.urlparse(raw);target=urllib.parse.parse_qs(parsed.query).get('url',[raw])[0];media=urllib.parse.urlparse(target).path
    if ('blog-assets/' in media or '/opengraph-image' in media) and media not in known:other.add(media)
  additional_media=list(pool.map(lambda a: assetcheck(a,origin),[{'path':path} for path in sorted(other)]))
 return {'captured_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'origin':origin,'environment':label,'pages':pages,'assets':assets,'page_count':len(pages),'asset_count':len(assets),'additional_media':additional_media,'additional_media_count':len(additional_media),'issues':[{'path':x['path'],'issues':x['issues']} for x in pages+assets+additional_media if x['issues']]}
