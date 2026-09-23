"""Freeze untouched full-label font pairs before guard calibration. No fonts redistributed."""
import pathlib,json,subprocess,textwrap,hashlib
root=pathlib.Path('test/fixtures/generated/appearance-holdout');root.mkdir(parents=True,exist_ok=True)
pairs=[('Avenir-Next','Avenir-Next-Regular','Avenir-Next-Bold'),('Baskerville','Baskerville','Baskerville-Bold'),('Gill-Sans','Gill-Sans','Gill-Sans-Bold'),('Optima','Optima-Regular','Optima-Bold'),('Tahoma','Tahoma','Tahoma-Bold'),('Lucida-Grande','Lucida-Grande','Lucida-Grande-Bold'),('AvantGarde','AvantGarde-Book','AvantGarde-Demi'),('Bookman','Bookman-Light','Bookman-Demi')]
warning='(1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.'
labels=[]
for family,regular,bold in pairs:
 for variant,(size,x,y) in enumerate([(28,110,640),(32,560,680),(36,160,740),(40,500,700),(44,230,800)]):
  for is_bold in [False,True]:
   name=f'{family}-{variant}-'+('bold' if is_bold else 'regular');font=bold if is_bold else regular
   args=['magick','-size','1600x1200','xc:white','-fill','#151515','-font','Helvetica-Bold','-pointsize','60','-annotate','+110+130','HOLDOUT RIDGE','-font','Helvetica','-pointsize','34','-annotate','+110+235','Kentucky Straight Bourbon Whiskey','-annotate','+830+335','45% Alc./Vol. (90 Proof)','-annotate','+110+335','750 mL','-pointsize','28','-annotate','+110+440','Produced by Holdout Ridge, Portland, OR','-font',font,'-pointsize',str(size),'-annotate',f'+{x}+{y}','GOVERNMENT WARNING:','-font','Helvetica','-pointsize','26']
   for i,line in enumerate(textwrap.wrap(warning,76)):args+=['-annotate',f'+110+{y+60+i*38}',line]
   file=root/(name+'.png');subprocess.run(args+['-strip',str(file)],check=True)
   labels.append({'id':name,'file':file.name,'family':family,'font':font,'size':size,'layout':variant,'headingBold':is_bold,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
manifest={'scope':'Frozen before revised guard implementation; 40 bold and 40 paired non-bold full labels. Font families absent from preceding project vision experiments. Five new arrangements. No universal accuracy claim.','labels':labels}
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
pathlib.Path('evidence/appearance-holdout-frozen.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Frozen {len(labels)} labels')
