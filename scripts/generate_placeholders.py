"""Original, deterministic temporary art/audio. Not part of the JS build.
Requires Python 3, Pillow and NumPy only when regenerating these checked-in assets.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import math, random, wave
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/temporary'
W,H=960,540
FOREST=(23,37,34); TEAL=(69,108,104); PLUM=(119,113,122)
AMBER=(180,139,98); CREAM=(232,223,203)
def blend(a,b,t):return tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))
def layer():return Image.new('RGBA',(W,H),(0,0,0,0))
def save(im,name):im.save(OUT/(name+'.png'),optimize=True)
def texture(im,points,color,tones,seed,density=.12):
    d=ImageDraw.Draw(im);d.polygon(points,fill=color)
    mask=Image.new('1',(W,H));ImageDraw.Draw(mask).polygon(points,fill=1)
    r=random.Random(seed)
    xmin=max(0,min(p[0] for p in points));xmax=min(W-1,max(p[0] for p in points))
    ymin=max(0,min(p[1] for p in points));ymax=min(H-1,max(p[1] for p in points))
    for _ in range(int((xmax-xmin)*(ymax-ymin)*density)):
        x,y=r.randint(xmin,xmax),r.randint(ymin,ymax)
        if mask.getpixel((x,y)):
            col=r.choice(tones)
            for xx in range(x,min(W,x+r.randint(1,4))):
                if mask.getpixel((xx,y)):d.point((xx,y),fill=col)
def hillpoints(base,amp,phase=0):
    pts=[]
    for x in range(-10,W+11,3):
        y=base+math.sin(x*.008+phase)*amp+math.sin(x*.021+phase*.7)*amp*.3+math.sin(x*.073)*1.7
        pts.append((x,int(y)))
    return pts
def tree(im,x,y,h,seed=1,far=False):
    r=random.Random(seed);d=ImageDraw.Draw(im)
    trunk=blend(FOREST,AMBER,.24);base=blend(FOREST,TEAL,.1 if not far else .25)
    light=blend(base,AMBER,.28 if not far else .18)
    d.rectangle((x-max(1,h//62),y-h,x+max(1,h//62),y),fill=trunk)
    for i in range(11):
        yy=int(y-h+i*h*.075); half=int((i+1)*h*.018+r.randint(0,max(1,h//70)))
        yy+=r.randint(-2,2)
        pts=[(x,yy-6),(x-half//2,yy+4),(x-half+2,yy+8),(x-half+5,yy+9),(x-half-2,yy+12),(x-half//2,yy+12),(x-half//2-3,yy+14),(x+half,yy+13),(x+half-4,yy+9),(x+half//2,yy+5)]
        d.polygon(pts,fill=base)
        d.line((x+half//2,yy+5,x+half-4,yy+9,x+half,yy+13),fill=light)
        for _ in range(10):
            xx=x+r.randint(-half,half);ty=yy+r.randint(6,14)
            if r.random()<.65:d.line((xx,ty,xx+r.randint(1,3),ty),fill=blend(base,TEAL,r.uniform(.1,.4)))

def generate():
    OUT.mkdir(parents=True,exist_ok=True)
    sky=layer();d=ImageDraw.Draw(sky);r=random.Random(61)
    # A controlled shade ramp from the five anchors, with visible dither transitions.
    for y in range(H):
        t=min(1,y/300);t=round(t*30)/30
        col=blend(blend(FOREST,TEAL,.54),blend(PLUM,AMBER,.67),t)
        d.line((0,y,W,y),fill=col)
        if y%9<2:
            for x in range(y%2,W,3):d.point((x,y),fill=blend(col,AMBER,.06))
    # Warm horizon only; the world keeps a quiet earth-toned palette.
    for y in range(130,310):
        intensity=max(0,1-abs(y-219)/100)*.28
        for x in range(515,W):
            if (x+y)%3==0:
                orig=sky.getpixel((x,y))[:3]
                d.point((x,y),fill=blend(orig,AMBER,intensity*(x-515)/(W-515)))
    d.ellipse((772,156,837,221),fill=blend(AMBER,CREAM,.48))
    for yy in [192,207,217]:d.rectangle((766,yy,843,yy+2),fill=blend(PLUM,AMBER,.65))
    save(sky,'sky')

    clouds=layer();d=ImageDraw.Draw(clouds)
    for cx,cy,cw in [(50,133,155),(270,184,211),(519,161,143),(731,131,192),(880,198,147)]:
        pts=[]
        for xx in range(cx-cw//2,cx+cw//2,4):
            yy=cy-int((math.sin(xx*.07)+math.sin(xx*.13))**2*3)-r.randint(0,3)
            pts.append((xx,yy))
        pts += [(cx+cw//2,cy+7),(cx-cw//2,cy+7)]
        d.polygon(pts,fill=blend(PLUM,FOREST,.28)+(200,))
        for _ in range(26):
            xx=r.randint(cx-cw//2,cx+cw//2);yy=cy+r.randint(5,9)
            d.line((xx,yy,xx+r.randint(3,22),yy),fill=blend(AMBER,PLUM,.3)+(155,))
    for x,y,l in [(265,91,117),(400,111,93),(550,147,86),(92,189,106)]:
        d.line((x,y,x+l,y),fill=blend(AMBER,CREAM,.15)+(190,))
        d.line((x+12,y+2,x+l-26,y+2),fill=AMBER+(165,))
    save(clouds,'clouds')

    distant=layer()
    pts=hillpoints(263,17,2)
    texture(distant,pts+[(W,H),(0,H)],blend(TEAL,PLUM,.53),[blend(TEAL,PLUM,.45),blend(TEAL,CREAM,.21)],2,.07)
    d=ImageDraw.Draw(distant)
    for x,y in pts[::2]:d.line((x,y,x+2,y),fill=blend(PLUM,CREAM,.18))
    save(distant,'distant-ridges')

    bay=layer();d=ImageDraw.Draw(bay)
    d.rectangle((0,276,W,H),fill=blend(TEAL,PLUM,.12))
    for y in range(277,H):
        if y%3==0:d.line((0,y,W,y),fill=blend(TEAL,FOREST,.12))
    for _ in range(5200):
        x=r.randrange(W);y=r.randrange(278,H)
        col=blend(TEAL,CREAM,r.uniform(.04,.26))
        d.line((x,y,x+r.randint(1,max(2,(y-270)//10)),y),fill=col)
    for y in range(278,H,2):
        center=802-(y-278)*.18;spread=(y-278)*.32+6
        for _ in range(4):
            x=int(center+r.uniform(-spread,spread));d.line((x,y,x+r.randint(2,15),y),fill=blend(AMBER,CREAM,r.uniform(.05,.38)))
    save(bay,'bay')

    city=layer();d=ImageDraw.Draw(city)
    col=blend(FOREST,TEAL,.24);line=blend(TEAL,AMBER,.4)
    x=661
    while x<900:
        bw=r.randint(6,14);bh=r.randint(8,29)
        d.rectangle((x,278-bh,x+bw,280),fill=col)
        d.line((x,278-bh,x+bw,278-bh),fill=line)
        for xx in range(x+2,x+bw,3):
            for yy in range(280-bh,278,4):
                if r.random()<.6:d.point((xx,yy),fill=AMBER)
        x+=bw+r.randint(1,3)
    d.rounded_rectangle((790,223,802,278),radius=4,fill=col)
    d.line((792,229,792,275),fill=line)
    for yy in range(231,277,4):d.line((795,yy,800,yy),fill=blend(TEAL,AMBER,.2))
    d.polygon([(736,237),(727,279),(747,279)],fill=col);d.line((736,234,736,238),fill=line)
    d.line((736,238,728,277),fill=line)
    for yy in range(247,278,5):d.line((734-(yy-247)//6,yy,738+(yy-247)//6,yy),fill=blend(TEAL,AMBER,.25))
    # Small Bay Bridge silhouette; geographical compression is deliberate.
    d.line((487,281,661,281),fill=blend(FOREST,TEAL,.35),width=2)
    for xx in [535,605]:
        d.rectangle((xx,253,xx+4,295),fill=col);d.rectangle((xx+1,255,xx+2,267),fill=line)
    for start,end in [(490,537),(537,607),(607,660)]:
        for xx in range(start,end):
            yy=int(254+21*math.sin((xx-start)/(end-start)*math.pi))
            d.point((xx,yy),fill=line)
            if xx%7==0:d.line((xx,yy,xx,280),fill=blend(TEAL,FOREST,.1))
    save(city,'distant-city')

    hills=layer()
    p1=hillpoints(333,27,1.7)
    # Separate peninsula geometry keeps open water in the right half.
    p1=[p for p in p1 if p[0]<665]+[(735,381),(960,410),(960,540),(0,540)]
    texture(hills,p1,blend(FOREST,TEAL,.45),[blend(FOREST,TEAL,.53),blend(FOREST,PLUM,.28)],6,.12)
    for i in range(95):
        x=r.randrange(0,655);y=int(333+math.sin(x*.008+1.7)*27+math.sin(x*.021+1.19)*8)
        tree(hills,x,y+3,r.randint(7,18),i,True)
    # an understated ribbon of trail lights in the valley
    d=ImageDraw.Draw(hills)
    for x in range(410,950,5):
        yy=int(378+math.sin(x*.014)*16+(x-410)*.04)
        if x%15:d.point((x,yy),fill=blend(AMBER,CREAM,.12))
    save(hills,'wooded-hills')

    trees=layer()
    for i in range(170):
        x=r.randrange(W);y=int(420+math.sin(x*.012+2)*24)
        if x<210 or x>465:tree(trees,x,y,r.randint(14,48),i)
    for x,y,hh,seed in [(36,467,249,9),(91,447,163,12),(144,456,120,15),(935,532,227,20),(881,492,158,22),(755,515,90,25)]:tree(trees,x,y,hh,seed)
    save(trees,'near-trees')

    ridge=layer();d=ImageDraw.Draw(ridge)
    outline=[(-10,405),(38,393),(93,391),(141,399),(187,396),(226,405),(262,414),(296,425),(335,438),(370,454),(416,466),(457,491),(514,501),(550,495),(605,512),(652,517),(714,528),(777,530),(832,522),(890,531),(960,537)]
    texture(ridge,outline+[(960,540),(0,540)],blend(FOREST,PLUM,.17),[blend(FOREST,TEAL,.15),blend(FOREST,AMBER,.14),blend(FOREST,PLUM,.24)],16,.3)
    d.line(outline,fill=blend(AMBER,FOREST,.25),width=2)
    for i in range(24):
        xx=r.randrange(600);yy=int(436+xx*.13)+r.randint(0,30)
        poly=[(xx,yy),(xx+10,yy-7),(xx+35,yy-4),(xx+45,yy+8),(xx+19,yy+17),(xx-4,yy+9)]
        d.polygon(poly,fill=blend(FOREST,PLUM,r.uniform(.2,.35)))
        d.line(poly[:4],fill=blend(AMBER,FOREST,.45))
        d.line((xx+35,yy-4,xx+19,yy+17),fill=blend(FOREST,PLUM,.05))
    for _ in range(1300):
        xx=r.randrange(W);yy=r.randrange(412,540)
        # texture vegetation mostly at the foot of the rocks
        if (xx<200 and yy>432) or yy>510 or xx>750:
            color=r.choice([blend(FOREST,TEAL,.4),blend(AMBER,FOREST,.4),blend(FOREST,AMBER,.17)])
            d.line((xx,yy,xx+r.randint(-4,4),yy-r.randint(1,10)),fill=color)
            if r.random()<.12:d.point((xx,yy-r.randint(4,11)),fill=AMBER)
    save(ridge,'overlook-ridge')

    for pose in ['neutral','blink','jump']:
        im=Image.new('RGBA',(48,80),(0,0,0,0));d=ImageDraw.Draw(im)
        dark=blend(FOREST,PLUM,.03);hair=blend(FOREST,PLUM,.11);skin=AMBER;light=blend(AMBER,CREAM,.3)
        # full-body front-facing character, intentionally provisional
        d.polygon([(17,57),(16,74),(21,75),(24,62),(27,75),(33,75),(31,57)],fill=blend(FOREST,PLUM,.19))
        d.rectangle((15,74,21,77),fill=blend(FOREST,AMBER,.35));d.rectangle((27,74,34,77),fill=blend(FOREST,AMBER,.35))
        d.polygon([(15,41),(10,47),(12,62),(19,62),(22,45),(26,45),(29,62),(35,62),(37,47),(31,41)],fill=TEAL)
        d.polygon([(21,42),(26,42),(29,61),(19,61)],fill=CREAM)
        d.line((16,45,15,60),fill=blend(FOREST,TEAL,.48));d.line((31,45,32,60),fill=blend(FOREST,TEAL,.48))
        if pose=='jump':
            d.polygon([(12,46),(7,40),(4,32),(1,34),(4,44),(10,53)],fill=TEAL)
            d.polygon([(35,46),(41,40),(43,32),(46,34),(43,45),(37,53)],fill=TEAL)
            d.rectangle((0,28,4,34),fill=skin);d.rectangle((43,28,47,34),fill=skin)
        else:
            d.rectangle((10,49,13,63),fill=TEAL);d.rectangle((34,49,37,63),fill=TEAL)
            d.rectangle((10,61,13,66),fill=skin);d.rectangle((34,61,37,66),fill=skin)
        d.rectangle((21,35,27,43),fill=skin)
        # hair is visibly long, with loose asymmetrical clusters
        d.polygon([(12,9),(17,5),(29,4),(36,9),(39,19),(38,35),(41,44),(35,49),(31,42),(15,43),(12,49),(8,46),(10,33),(8,22),(9,14)],fill=dark)
        d.polygon([(15,14),(20,10),(30,12),(35,18),(35,30),(30,37),(22,39),(15,33),(12,25)],fill=skin)
        d.polygon([(20,12),(30,13),(34,18),(34,27),(31,32),(29,35),(22,36),(16,31),(14,23)],fill=light)
        d.polygon([(12,18),(13,11),(21,7),(31,9),(36,16),(31,14),(25,13),(20,17),(15,20),(13,27)],fill=hair)
        d.line((11,18,12,30,11,40),fill=blend(FOREST,AMBER,.19),width=1)
        d.line((34,14,36,24,35,38,37,43),fill=blend(FOREST,AMBER,.3))
        if pose=='blink':
            d.line((16,25,20,25),fill=dark);d.line((27,25,31,25),fill=dark)
        else:
            d.rectangle((16,22,21,27),fill=CREAM);d.rectangle((27,22,32,27),fill=CREAM)
            d.rectangle((18,23,20,27),fill=dark);d.rectangle((28,23,30,27),fill=dark)
            d.point((18,23),fill=CREAM);d.point((28,23),fill=CREAM)
            d.line((16,21,20,20),fill=dark);d.line((28,20,32,21),fill=dark)
        d.point((24,29),fill=AMBER);d.line((23,33,27,33),fill=blend(FOREST,AMBER,.4))
        d.point((27,32),fill=blend(FOREST,AMBER,.4))
        save(im,'character-'+pose)

    poster=sky.copy()
    for item in [clouds,distant,bay,city,hills,trees,ridge]:poster.alpha_composite(item)
    save(poster,'poster')
    print('Created eight independent scene layers, three front-facing poses and a fallback poster.')

def audio():
    sr=22050;secs=8;n=sr*secs;t=np.arange(n)/sr;r=np.random.default_rng(18)
    # periodic filtered noise: quiet wind, no commercial or third-party recording
    control=r.uniform(-1,1,129);control[-1]=control[0]
    wind=np.interp(t,np.linspace(0,secs,129),control)*.065
    pad=sum(np.sin(2*np.pi*f*t+p)*.015 for f,p in [(110,0),(146.75,.6),(164.875,.2),(220,.8)])
    pad*=.7+.3*np.sin(2*np.pi*t/8)**2
    samples=(np.clip(wind+pad,-.8,.8)*32767).astype('<i2')
    adir=ROOT/'public/audio';adir.mkdir(exist_ok=True)
    with wave.open(str(adir/'temporary-mountain-ambient.wav'),'wb') as out:
        out.setnchannels(1);out.setsampwidth(2);out.setframerate(sr);out.writeframes(samples.tobytes())
    t=np.arange(int(sr*.22))/sr
    pop=np.sin(2*np.pi*(350*t+700*t*t))*np.exp(-t*25)*np.sin(np.minimum(1,t/.015)*np.pi/2)*.13
    with wave.open(str(adir/'temporary-jump.wav'),'wb') as out:
        out.setnchannels(1);out.setsampwidth(2);out.setframerate(sr);out.writeframes((pop*32767).astype('<i2').tobytes())
    print('Created original temporary ambient loop and soft jump cue.')

if __name__=='__main__':generate();audio()
