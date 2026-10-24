"""
03_cut_chairs.py — ВИРІЗАТИ КРІСЛА В ОКРЕМІ СПРАЙТИ (крок 3)
Вхід:  room_v3.png
Вихід: assets/chair1.png, assets/chair2.png (з прозорістю) + room_v4.png (фон без крісел)
Як:    контур кожного крісла задано вручну полігонами (P = {...}) -> маска -> RGBA-спрайт;
       місце за кріслом заповнюється SHIFTMAP-інпейнтингом.
Для 2× роздільності: множити координати полігонів на 2 і різати з картинки ×2.
"""
import cv2, numpy as np
im=cv2.imread('room_v3.png'); H,W=im.shape[:2]
P={'chair1':{'box':(383,252,472,342),'polys':[[(427,257),(436,255),(462,257),(468,264),(462,306),(460,313),(456,319),(388,317),(385,309),(391,303),(422,300),(424,270)],
        [(426,316),(435,316),(435,330),(426,330)],[(394,329),(453,329),(456,339),(391,339)]]},
   'chair2':{'box':(588,262,660,336),'polys':[[(627,267),(648,269),(651,276),(646,300),(648,307),(611,307),(610,295),(619,290),(624,283)],
        [(618,305),(627,305),(627,321),(618,321)],[(593,319),(641,319),(643,332),(591,332)]]}}
full=np.zeros((H,W),np.uint8)
for n,d in P.items():
    m=np.zeros((H,W),np.uint8)
    for pl in d['polys']: cv2.fillPoly(m,[np.array(pl,np.int32)],255)
    full|=m; x0,y0,x1,y1=d['box']
    rgba=cv2.cvtColor(im,cv2.COLOR_BGR2BGRA); rgba[...,3]=m
    cv2.imwrite(f'nexora-lab/assets/{n}.png',rgba[y0:y1,x0:x1])
    chk=np.full((y1-y0,x1-x0,3),(60,200,60),np.uint8); a=m[y0:y1,x0:x1,None]/255.0
    cv2.imwrite(f'{n}_cut.png',cv2.resize((im[y0:y1,x0:x1]*a+chk*(1-a)).astype(np.uint8),None,fx=4,fy=4,interpolation=cv2.INTER_NEAREST))
dm=cv2.dilate(full,np.ones((5,5),np.uint8))
lab=cv2.cvtColor(im,cv2.COLOR_BGR2Lab); o=np.zeros_like(lab)
cv2.xphoto.inpaint(lab,255-dm,o,cv2.xphoto.INPAINT_SHIFTMAP)
o=cv2.cvtColor(o,cv2.COLOR_Lab2BGR); res=im.copy(); res[dm>0]=o[dm>0]
cv2.imwrite('room_v4.png',res)
cv2.imwrite('v4c.png',cv2.resize(res[240:350,370:670],None,fx=3,fy=3,interpolation=cv2.INTER_NEAREST))
