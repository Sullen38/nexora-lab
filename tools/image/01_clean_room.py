"""
01_clean_room.py — ЧИСТКА КАРТИНКИ ВІД РОБОТІВ ЗІ ЗРАЗКА (крок 1)
Вхід:  orig_scene.png — смуга кімнати з концепту (assets/src/concept.webp, рядки 72..440):
       python3 -c "from PIL import Image;Image.open('assets/src/concept.webp').convert('RGB').crop((0,72,1536,440)).save('orig_scene.png')"
Вихід: room_clean.png (без ботів, бабла, синього кота), room_mask.png (що прибрано)
Як:    силуети ботів за кольором -> маска -> OpenCV xphoto FSR-інпейнтинг; диван дзеркалиться.
"""
import cv2, numpy as np
from scipy import ndimage as ndi
sc=cv2.imread('orig_scene.png')
H,W=sc.shape[:2]
hsv=cv2.cvtColor(sc,cv2.COLOR_BGR2HSV);S=hsv[...,1].astype(int);V=hsv[...,2].astype(int)
b,g,r=[sc[...,i].astype(int) for i in range(3)]
white=((V>135)&(S<95));cyan=((g>170)&(b>190)&(r<140))
def silhouette(x0,y0,x1,y1,grow=5):
    box=np.zeros((H,W),bool);box[y0:y1,x0:x1]=True
    m=((white|cyan)&box).astype(np.uint8)
    m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((9,9),np.uint8));m=ndi.binary_fill_holes(m).astype(np.uint8)
    return cv2.dilate(m,np.ones((grow,grow),np.uint8))>0
# 1) sofa: remove zzz on backrest, then mirror right half of sofa onto the left half
zz=np.zeros((H,W),np.uint8);cv2.rectangle(zz,(755,270),(795,300),255,-1)
sc=cv2.inpaint(sc,zz,3,cv2.INPAINT_TELEA)
cx=774;y0,y1=262,368
for x in range(680,cx):
    mx=2*cx-x
    sc[y0:y1,x]=sc[y0:y1,mx]
# soften seam
seam=np.zeros((H,W),np.uint8);seam[y0:y1,cx-1:cx+1]=255;sc=cv2.inpaint(sc,seam,2,cv2.INPAINT_TELEA)
# 2) other bots + bubble + garbled sign + blue cat
mask=np.zeros((H,W),bool)
for bx in [(143,215,207,297),(390,235,445,297),(488,298,528,347),(580,245,627,307),(978,258,1032,324),(1176,260,1225,314),(1363,270,1420,337)]:
    mask|=silhouette(*bx)
mask[185:256,210:346]=True          # concept speech bubble
cat=np.zeros((H,W),np.uint8);cv2.ellipse(cat,(80,336),(25,19),0,0,360,1,-1);mask|=cat>0
valid=np.where(mask,0,255).astype(np.uint8)
out=np.zeros_like(sc);cv2.xphoto.inpaint(sc,valid,out,cv2.xphoto.INPAINT_FSR_FAST)
cv2.imwrite('room_clean.png',out);cv2.imwrite('room_mask.png',mask.astype(np.uint8)*255)
cv2.imwrite('room_prev.png',cv2.resize(out,None,fx=1,fy=1))
