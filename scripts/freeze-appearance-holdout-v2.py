"""Freeze untouched full-label font pairs before guard calibration. No fonts redistributed."""
import pathlib,json,subprocess,textwrap,hashlib
root=pathlib.Path('test/fixtures/generated/appearance-holdout-v2');root.mkdir(parents=True,exist_ok=True)
pairs=[('Helvetica-Narrow','Helvetica-Narrow','Helvetica-Narrow-Bold'),('American-Typewriter','American-Typewriter','American-Typewriter-Bold'),('Arial-Narrow','Arial-Narrow','Arial-Narrow-Bold'),('Charter','Charter-Roman','Charter-Bold'),('Copperplate','Copperplate','Copperplate-Bold'),('Didot','Didot','Didot-Bold'),('Futura','Futura-Medium','Futura-Bold'),('Helvetica-Neue','Helvetica-Neue','Helvetica-Neue-Bold')]
warning='(1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.'
labels=[]
for family,regular,bold in pairs:
 for variant,(size,x,y) in enumerate([(30,180,635),(34,480,685),(38,120,755),(42,600,725),(46,300,825)]):
  for is_bold in [False,True]:
   name=f'{family}-{variant}-'+('bold' if is_bold else 'regular');font=bold if is_bold else regular
   args=['magick','-size','1600x1200','xc:white','-fill','#151515','-font','Helvetica-Bold','-pointsize','60','-annotate','+110+130','HOLDOUT RIDGE','-font','Helvetica','-pointsize','34','-annotate','+110+235','Kentucky Straight Bourbon Whiskey','-annotate','+830+335','45% Alc./Vol. (90 Proof)','-annotate','+110+335','750 mL','-pointsize','28','-annotate','+110+440','Produced by Holdout Ridge, Portland, OR','-font',font,'-pointsize',str(size),'-annotate',f'+{x}+{y}','GOVERNMENT WARNING:','-font','Helvetica','-pointsize','26']
   for i,line in enumerate(textwrap.wrap(warning,76)):args+=['-annotate',f'+110+{y+60+i*38}',line]
   file=root/(name+'.png');subprocess.run(args+['-strip',str(file)],check=True)
   labels.append({'id':name,'file':file.name,'family':family,'font':font,'size':size,'layout':variant,'headingBold':is_bold,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
manifest={'scope':'Fresh holdout frozen before the next heading-localization change; 40 bold and 40 paired regular full labels. Eight previously unused font families, five layouts. No universal accuracy claim.','labels':labels}
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
pathlib.Path('evidence/appearance-holdout-v2-frozen.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Frozen {len(labels)} labels')
