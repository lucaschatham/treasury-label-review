"""Fresh full-label typography cases. Uses installed fonts; redistributes no fonts."""
import pathlib,json,subprocess,textwrap
root=pathlib.Path('/tmp/treasury-fresh-labels');root.mkdir(exist_ok=True)
warning='(1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.'
labels=[]
for family in ['Arial','Georgia','Trebuchet-MS','Verdana']:
 for size in [28,44]:
  for bold in [False,True]:
   name=f'{family}-{size}-'+('bold' if bold else 'regular');font=family+('-Bold' if bold else '')
   args=['magick','-size','1600x1200','xc:white','-fill','#151515','-font','Helvetica-Bold','-pointsize','60','-annotate','+70+140','FRESH CREEK','-font','Helvetica','-pointsize','36','-annotate','+70+310','Kentucky Straight Bourbon Whiskey','-annotate','+70+390','45% Alc./Vol. (90 Proof)','-annotate','+70+460','750 mL','-pointsize','28','-annotate','+70+550','Produced by Fresh Creek, Portland, OR','-font',font,'-pointsize',str(size),'-annotate','+80+735','GOVERNMENT WARNING:','-font',family,'-pointsize','28']
   for i,line in enumerate(textwrap.wrap(warning,80)): args+=['-annotate',f'+80+{790+i*42}',line]
   args+=['-strip',str(root/(name+'.png'))];subprocess.run(args,check=True)
   labels.append({'id':name,'file':name+'.png','headingBold':bold})
(root/'manifest.json').write_text(json.dumps({'labels':labels}))
