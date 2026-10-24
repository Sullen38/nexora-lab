"""
04_upscale_edsr.py — ЗБІЛЬШЕННЯ КАРТИНКИ НЕЙРОМЕРЕЖЕЮ ×2 (крок 4)
Модель: EDSR_x2.pb з https://github.com/Saafke/EDSR_Tensorflow (папка models) -> sr/edsr/models/
Вхід:  room_v4.png (1536×368) -> Вихід: room_x2.png (3072×736); плиточна обробка 256 px.
Після: легке підвищення різкості (unsharp: 1.35·img − 0.35·blur(σ=1)) -> room_x2s.png
"""
import cv2, time, sys
from cv2 import dnn_superres
sr=dnn_superres.DnnSuperResImpl_create(); sr.readModel('sr/edsr/models/EDSR_x2.pb'); sr.setModel('edsr',2)
for src,dst in [('room_v4.png','room_x2.png'),('room_v3.png','room_v3_x2.png')]:
    t=time.time(); im=cv2.imread(src); tiles=[]
    H,W=im.shape[:2]; out=None; import numpy as np; out=np.zeros((H*2,W*2,3),np.uint8); T=256; pad=8
    for y in range(0,H,T):
        for x in range(0,W,T):
            y0,x0=max(0,y-pad),max(0,x-pad); y1,x1=min(H,y+T+pad),min(W,x+T+pad)
            r=sr.upsample(im[y0:y1,x0:x1])
            out[y*2:min(H,y+T)*2, x*2:min(W,x+T)*2]=r[(y-y0)*2:(y-y0)*2+(min(H,y+T)-y)*2,(x-x0)*2:(x-x0)*2+(min(W,x+T)-x)*2]
    cv2.imwrite(dst,out); print(dst,time.time()-t,flush=True)
