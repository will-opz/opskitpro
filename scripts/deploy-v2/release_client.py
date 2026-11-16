#!/usr/bin/env python3
"""Send checked artifact to an already-installed, pinned-host controller."""
import argparse,hashlib,json,os,pathlib,re,shlex,subprocess,tempfile
from release_bundle import inspect,require,digest

def run(group,revision,archive,apply=False):
 data=pathlib.Path(archive).read_bytes();sha=digest(data);inspect(data,group,revision,sha)
 host=os.environ['DEPLOY_HOST'];user=os.environ['DEPLOY_USER'];key=os.environ['DEPLOY_KEY_FILE'];known=os.environ['DEPLOY_KNOWN_HOSTS_FILE']
 require(re.fullmatch(r'[A-Za-z0-9.-]+',host) is not None and not host.startswith('-'),'invalid host')
 require(re.fullmatch(r'[a-z_][a-z0-9_-]*',user) is not None,'invalid user')
 require(pathlib.Path(key).is_file() and pathlib.Path(known).is_file(),'SSH material missing')
 require(pathlib.Path(key).stat().st_mode&0o077==0,'SSH key permissions')
 require(os.environ.get('DEPLOY_TARGET_ID')=='lightsail-debian13-v2','unapproved deployment target')
 base=['ssh','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','IdentitiesOnly=yes','-o','ConnectTimeout=10','-o','UserKnownHostsFile='+known,'-i',key,user+'@'+host]
 remote=['sudo','-n','/usr/local/libexec/opskitpro-deploy-v2/deploy.py',group,'--revision',revision,'--sha256',sha]
 for mode in (['--dry-run','--apply'] if apply else ['--dry-run']):
  r=subprocess.run(base+[shlex.join(remote+[mode])],input=data,capture_output=True,timeout=900)
  require(r.returncode==0,'remote controller failed; inspect protected transaction journal')
  response=json.loads(r.stdout);require(response.get('group')==group and response.get('revision')==revision,'receipt identity mismatch');require(response.get('dry_run') is True if mode=='--dry-run' else response.get('phase')=='accepted','unexpected controller receipt')
  print(json.dumps(response))

def main():
 p=argparse.ArgumentParser();p.add_argument('--group',required=True);p.add_argument('--revision',required=True);p.add_argument('--archive',required=True);g=p.add_mutually_exclusive_group(required=True);g.add_argument('--dry-run',action='store_true');g.add_argument('--apply',action='store_true');a=p.parse_args();run(a.group,a.revision,a.archive,a.apply)
if __name__=='__main__':main()
