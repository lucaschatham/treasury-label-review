"""Synthetic-only experiment. Credentials stay in environment or Wrangler's local file."""
import os,json,time,pathlib,base64,urllib.request,urllib.error,concurrent.futures,tomllib
account=os.environ.get('CLOUDFLARE_ACCOUNT_ID','01ebc0c856dca30271b72bd37e8d9934')
token=os.environ.get('CLOUDFLARE_API_TOKEN')
if not token:
    token=tomllib.loads((pathlib.Path.home()/'Library/Preferences/.wrangler/config/default.toml').read_text())['oauth_token']
models=['@cf/qwen/qwen3.8-27b','@cf/google/gemma-4-26b-a4b-it']
prompt='Is the GOVERNMENT WARNING heading printed in bold or regular font weight? Do not confuse capital letters or larger size with bold strokes. Return only BOLD, REGULAR, or UNCERTAIN.'
report={'scope':'Full synthetic labels, OCR-derived heading boxes; not browser or deployed evidence.','models':models,'prompt':prompt,'deadlineSeconds':4,'results':[]}
def query(model,image):
    payload={'options':{'rejectIfBusy':True},'messages':[{'role':'user','content':[{'type':'text','text':prompt},{'type':'image_url','image_url':{'url':'data:image/png;base64,'+base64.b64encode(image).decode()}}]}],'temperature':0,'max_completion_tokens':32,'chat_template_kwargs':{'enable_thinking':False}}
    req=urllib.request.Request(f'https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{model}',data=json.dumps(payload).encode(),headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
    start=time.monotonic()
    try:
        response=urllib.request.urlopen(req,timeout=4);status=response.status;result=json.load(response)
    except urllib.error.HTTPError as error:
        status=error.code;result=json.loads(error.read())
    except Exception as error:
        status=None;result={'error':str(error)}
    content=result.get('result',{}).get('choices',[{}])[0].get('message',{}).get('content','').strip()
    return {'model':model,'observed':content if content in ['BOLD','REGULAR','UNCERTAIN'] else 'UNCERTAIN','httpStatus':status,'milliseconds':round((time.monotonic()-start)*1000),'result':result}
for record in json.loads(pathlib.Path('/tmp/treasury-heading-probe/manifest.json').read_text()):
    image=pathlib.Path(record['file']).read_bytes();start=time.monotonic()
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: results=list(pool.map(lambda model:query(model,image),models))
    answers=[r['observed'] for r in results]
    answer='REGULAR' if 'REGULAR' in answers else 'BOLD' if answers==['BOLD','BOLD'] else 'UNCERTAIN'
    report['results'].append({**record,'observed':answer,'guardedObserved':('UNCERTAIN' if answer=='BOLD' and not record.get('stroke',{}).get('supportsBold') else answer),'milliseconds':round((time.monotonic()-start)*1000),'responses':results})
    pathlib.Path(os.environ.get('PROBE_OUTPUT','evidence/vision-full-label-probe.json')).write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'id':record['id'],'expected':record['expected'],'observed':answer,'guardedObserved':('UNCERTAIN' if answer=='BOLD' and not record.get('stroke',{}).get('supportsBold') else answer),'milliseconds':report['results'][-1]['milliseconds'],'status':[r['httpStatus'] for r in results]}),flush=True)
    if any(r['httpStatus'] in [401,403,429] for r in results): break
