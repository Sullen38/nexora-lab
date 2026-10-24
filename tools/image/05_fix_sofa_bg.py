"""
05_fix_sofa_bg.py — СИМЕТРИЧНИЙ ДИВАН НА ФОНІ (крок 5, історичний)
Ліва половина дивану на картинці дзеркалиться з правої (вісь x=774), щоб прибрати
латку й розмитий кущ. Зараз диван — окремий піксель-арт об'єкт (js/objects/sofa.js),
але цей крок лишає фон під ним чистим. Вихід: room_sofa.png -> assets/room.webp (WebP q92).
"""
import cv2, numpy as np
im=cv2.imread('room_x2s.png').astype(np.float32); out=im.copy()
C=774*2   # вісь симетрії дивану (2x)
def mirror(x0,x1,y0,y1,feather=0,vfeather=0):
    # копіює дзеркально праву частину [C, C+(C-x0)) у ліву [x0, C)
    for x in range(x0*2, x1*2):
        sx=2*C-1-x
        a=1.0
        if feather and x < x0*2+feather*2: a=(x-x0*2+1)/(feather*2+1)
        col=np.full((y1*2-y0*2,1),a,np.float32)
        if vfeather: 
            k=np.clip((np.arange(y0*2,y1*2)-y0*2+1)/(vfeather*2+1),0,1)[:,None]; col=col*k
        out[y0*2:y1*2,x]=im[y0*2:y1*2,sx]*col+out[y0*2:y1*2,x]*(1-col)
mirror(679,774,257,357,feather=3)     # диван + бічні зони
mirror(700,727,221,257,feather=3,vfeather=4)     # стіна над лівою спинкою (там був обрізаний розмитий кущ)
o=out.clip(0,255).astype(np.uint8)
cv2.imwrite('room_sofa.png',o)
from PIL import Image
Image.fromarray(cv2.cvtColor(o,cv2.COLOR_BGR2RGB)).crop((1280,380,1800,730)).resize((1040,700),Image.NEAREST).save('sofa_fixed.png')
