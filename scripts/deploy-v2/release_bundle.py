#!/usr/bin/env python3
"""Versioned release bundle; no credentials, no network, explicit write mode."""
import argparse,gzip,hashlib,io,json,os,pathlib,posixpath,re,tarfile
P=pathlib.Path
LIMIT=512*1024*1024
MAX_FILES=100000
class Invalid(ValueError): pass
def require(ok,msg):
 if not ok:raise Invalid(msg)
def digest(data):return hashlib.sha256(data).hexdigest()
def name_ok(name):
 require(isinstance(name,str) and name and not name.startswith('/') and '\\' not in name and all(x not in ('','.','..') for x in name.split('/')),'unsafe archive path')
 require(not any(ord(c)<32 for c in name),'control character in path')
 return name
def identity(group,revision):
 require(group in ('product','ops','kb'),'unknown component')
 require(re.fullmatch(r'[0-9a-f]{40}-[0-9]+-[0-9]+',revision) is not None,'invalid revision')
def inspect(data,group,revision,expected):
 identity(group,revision);require(len(data)<=LIMIT and digest(data)==expected,'archive digest mismatch')
 files={};total=0
 try:
  with gzip.GzipFile(fileobj=io.BytesIO(data)) as gz:raw=gz.read(LIMIT+1)
  require(len(raw)<=LIMIT,'expanded archive too large')
  with tarfile.open(fileobj=io.BytesIO(raw),mode='r:') as tar:
   for m in tar:
    name=name_ok(m.name);require(name not in files,'duplicate member')
    require(m.isfile() or m.issym(),'unsupported archive member')
    require(not (m.mode & 0o7000),'special mode')
    total+=m.size;require(total<=LIMIT and len(files)<MAX_FILES,'archive too large')
    files[name]={'kind':'link','target':m.linkname} if m.issym() else {'kind':'file','data':tar.extractfile(m).read(),'mode':0o755 if m.mode&0o111 else 0o644}
 except (tarfile.TarError,EOFError) as e:raise Invalid('invalid archive') from e
 require('manifest.json' in files and files['manifest.json']['kind']=='file','missing manifest')
 m=json.loads(files.pop('manifest.json')['data']);require(m.get('version')==2 and m.get('group')==group and m.get('revision')==revision,'manifest identity mismatch')
 require(set(m.get('files',{}))==set(files),'manifest inventory mismatch')
 for name,f in files.items():
  for parent in P(name).parents:
   if str(parent)!='.':require(str(parent) not in files,'member beneath file/link')
  expected_item={'kind':'link','target':f['target']} if f['kind']=='link' else {'kind':'file','sha256':digest(f['data']),'mode':f['mode']}
  require(m['files'][name]==expected_item,'member checksum/mode mismatch')
  if f['kind']=='link':
   target=f['target'];require(target and not target.startswith('/') and '\\' not in target,'unsafe link')
   resolved=posixpath.normpath(posixpath.join(posixpath.dirname(name),target))
   require(resolved!='..' and not resolved.startswith('../'),'escaping link')
   # Resolve chains including directory links, detecting cycles/escapes.
   seen={name}
   for _ in range(64):
    parts=resolved.split('/');found=False
    for i in range(1,len(parts)+1):
     prefix='/'.join(parts[:i]);node=files.get(prefix)
     if node and node['kind']=='link':
      require(prefix not in seen,'link cycle');seen.add(prefix)
      resolved=posixpath.normpath(posixpath.join(posixpath.dirname(prefix),node['target'],*parts[i:]));require(not resolved.startswith('../') and resolved!='..' and not resolved.startswith('/'),'escaping chain');found=True;break
    if not found:break
   else:raise Invalid('link depth exceeded')
   require(resolved in files or any(n.startswith(resolved+'/') for n in files),'dangling link')
 entry={'product':'server.js','ops':'manage.py','kb':'index.html'}[group]
 require(entry in files and files[entry]['kind']=='file','missing entry point')
 require(not any(n.split('/')[0] in ['.venv','.git'] for n in files),'reserved runtime directory')
 require(not any(n=='.env' or '/.env' in n or n.endswith(('.pem','.key','.sqlite3')) for n in files),'sensitive file name rejected')
 return m,files

def bundle(source,group,revision):
 identity(group,revision);source=P(source);require(source.is_dir() and not source.is_symlink(),'invalid source');items={};blobs={}
 for p in sorted(source.rglob('*')):
  n=name_ok(p.relative_to(source).as_posix())
  require(n!='manifest.json','reserved manifest filename')
  if p.is_symlink():items[n]={'kind':'link','target':os.readlink(p)}
  elif p.is_file():
   blobs[n]=p.read_bytes();items[n]={'kind':'file','sha256':digest(blobs[n]),'mode':0o755 if p.stat().st_mode&0o111 else 0o644}
  else:require(p.is_dir(),'unsupported source file')
 m={'version':2,'group':group,'revision':revision,'files':items};out=io.BytesIO()
 with tarfile.open(fileobj=out,mode='w:gz') as tar:
  for n,item in items.items():
   ti=tarfile.TarInfo(n);ti.mode=item.get('mode',0o777)
   if item['kind']=='link':ti.type=tarfile.SYMTYPE;ti.linkname=item['target'];ti.mode=0o777;tar.addfile(ti)
   else:ti.size=len(blobs[n]);tar.addfile(ti,io.BytesIO(blobs[n]))
  raw=json.dumps(m,sort_keys=True).encode();ti=tarfile.TarInfo('manifest.json');ti.size=len(raw);ti.mode=0o644;tar.addfile(ti,io.BytesIO(raw))
 data=out.getvalue();inspect(data,group,revision,digest(data));return data

def main():
 p=argparse.ArgumentParser();p.add_argument('--source',required=True);p.add_argument('--group',required=True);p.add_argument('--revision',required=True);p.add_argument('--output',required=True);g=p.add_mutually_exclusive_group(required=True);g.add_argument('--dry-run',action='store_true');g.add_argument('--apply',action='store_true');a=p.parse_args()
 data=bundle(a.source,a.group,a.revision);out=P(a.output);require(not out.exists(),'output exists')
 if a.apply:
  out.parent.mkdir(parents=True,exist_ok=True)
  with out.open('xb') as f:f.write(data)
 print(json.dumps({'group':a.group,'revision':a.revision,'sha256':digest(data),'bytes':len(data),'dry_run':a.dry_run}))
if __name__=='__main__':main()
