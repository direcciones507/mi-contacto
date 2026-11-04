"""Run only against this dedicated acceptance host, with its private code supplied securely."""
import urllib.request, urllib.error, http.cookiejar, json, re, os
from pathlib import Path
origin='https://mi-contacto-acceptance-acceptance.up.railway.app'
private_code=globals().get('PRIVATE_CODE') or os.environ['MC_ACCEPTANCE_PRIVATE_CODE']
phase=globals().get('PHASE','verify')
root=Path(__file__).resolve().parent.parent
out=root/'docs/evidence/railway-live-20261104'
initial=json.loads((out/'initial-live-check.json').read_text())
client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def call(path,method='GET',data=None,headers=None):
 try:
  with client.open(urllib.request.Request(origin+path,data=data,method=method,headers=headers or {}),timeout=30) as r: return r.status,r.read()
 except urllib.error.HTTPError as e: return e.code,e.read()
status,body=call('/acceso-pruebas');assert status==200
challenge=re.search(r'name="challenge" value="([^"]+)"',body.decode()).group(1)
from urllib.parse import urlencode
status,body=call('/acceso-pruebas','POST',urlencode({'challenge':challenge,'code':private_code}).encode(),{'origin':origin,'content-type':'application/x-www-form-urlencoded'});assert status==200
csrf=None
def api(path,method='GET',data=None,status=200):
 headers={} if method=='GET' else {'origin':origin,'x-mc-csrf':csrf,'content-type':'application/json'}
 actual,body=call(path,method,None if data is None else json.dumps(data).encode(),headers)
 assert actual==status,(path,actual,body[:100]);return json.loads(body)
session=api('/api/session');csrf=session['csrf'];assert session['user']['role']=='ADMIN'
report=api('/api/admin/acceptance/status');assert report['migrations']==12 and report['verifiedTls'] and report['backup']['restored'] and report['processUid']==1000
items=api('/api/profiles')['items'];assert len(items)==1 and items[0]['url']==initial['profileUrl'] and items[0]['displayName']=='Prueba técnica temporal','Unexpected owner profile; do not modify'
p=items[0];path=p['url'][len(origin):];assert len(p['photos'])==1
assert call(path)[0]==200 and call(path+'/qr.svg')[0]==200
image=call(p['photos'][0]['url']);assert image[0]==200 and image[1][:4]==b'RIFF'
if phase=='verify':
 assert report['bootCount']>initial['beforeBootCount'] and report['persistenceAfterRestart']
 result={'https':True,'privateAccess':True,'profileAndPhotoPersisted':True,'urlUnchanged':True,'publicCardAndQR':True,'report':report}
 (out/'persistence-verified.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
elif phase=='cleanup':
 removal=api('/api/profiles/'+p['id']+'/removal','POST',{'confirm':True},202)
 deleted=api('/api/admin/removals/'+removal['id']+'/approve','POST',{'confirm':True,'reason':'Retirar exclusivamente la ficha técnica creada para verificar este despliegue'})
 assert deleted['profileDeleted'] and deleted['physicalDeletion'];assert not api('/api/profiles')['items']
 assert call(path)[0]==404 and call(path+'/qr.svg')[0]==404 and call(p['photos'][0]['url'])[0]==404
 result={'technicalProfileErased':True,'technicalPhotoErased':True,'oldQRUnavailable':True,'ownerReadyForOwnProfile':True,'realPaymentsEnabled':False}
 (out/'cleanup-verified.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
else: raise ValueError('Unknown phase')
