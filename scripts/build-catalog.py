"""Offline reproducible GeoNames builder. Never downloads, connects or deploys."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import zipfile

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('source_directory',type=Path)
parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'data/geonames-catalog.json.gz')
args=parser.parse_args()
manifest=json.loads((Path(__file__).resolve().parents[1]/'data/catalog-provenance.json').read_text())
for item in manifest['inputs']:
    data=(args.source_directory/item['file']).read_bytes()
    if hashlib.sha256(data).hexdigest()!=item['sha256']:
        raise ValueError('SOURCE_CHANGED_REVIEW_REQUIRED: '+item['file'])
allowed=set(manifest['counts'])
def divisions(name):
    return {line.split('\t')[0]:line.split('\t')[1]
            for line in (args.source_directory/name).read_text().splitlines()
            if line.split('.')[0] in allowed}
a1,a2=divisions('admin1CodesASCII.txt'),divisions('admin2Codes.txt')
regions=[{'country':k.split('.')[0],'source':k,'name':v,'level':1,'parent':None} for k,v in a1.items()]
regions += [{'country':k.split('.')[0],'source':k,'name':v,'level':2,'parent':'.'.join(k.split('.')[:2])}
            for k,v in a2.items() if '.'.join(k.split('.')[:2]) in a1]
valid={r['source'] for r in regions};localities=[]
for country in sorted(allowed):
    with zipfile.ZipFile(args.source_directory/(country+'.zip')) as archive:
        for line in archive.read(country+'.txt').decode('utf8').splitlines():
            f=line.split('\t')
            if len(f)<19 or f[8]!=country or f[6]!='P' or not f[7].startswith('PPL') or f[7] in {'PPLH','PPLQ','PPLW'}:
                continue
            region=country+'.'+f[10]+'.'+f[11]
            if region not in valid:region=country+'.'+f[10]
            if region not in valid:continue
            localities.append({'country':country,'source':f[0],'name':f[1],'region':region})
payload=json.dumps({'regions':regions,'localities':localities},ensure_ascii=False,separators=(',',':')).encode()
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_bytes(gzip.compress(payload,mtime=0))
print(json.dumps({'regions':len(regions),'localities':len(localities),'sha256':hashlib.sha256(args.output.read_bytes()).hexdigest(),'reviewed':False}))
