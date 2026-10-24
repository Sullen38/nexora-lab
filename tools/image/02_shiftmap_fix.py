"""
02_shiftmap_fix.py — ЯКІСНІШЕ ЗАПОВНЕННЯ ПРИБРАНИХ МІСЦЬ (крок 2)
Вхід:  room_v2.png (або room_clean.png), orig_scene.png, room_mask.png
Вихід: room_v3.png
Як:    патч-інпейнтинг SHIFTMAP — копіює справжні шматки картинки (стіл, полиці, рослини)
       замість розмиття. Межі області задаються зрізами маски в коді (m[...]).
"""
import cv2, numpy as np
cur=cv2.imread('room_v2.png'); orig=cv2.imread('orig_scene.png'); mask=cv2.imread('room_mask.png',0)
m=np.zeros_like(mask); m[150:368,700:1536]=mask[150:368,700:1536]; m[300:368,30:130]=mask[300:368,30:130]
m=cv2.dilate(m,np.ones((5,5),np.uint8))
src=cur.copy(); src[m>0]=orig[m>0]
lab=cv2.cvtColor(src,cv2.COLOR_BGR2Lab); out=np.zeros_like(lab)
cv2.xphoto.inpaint(lab,255-m,out,cv2.xphoto.INPAINT_SHIFTMAP)
out=cv2.cvtColor(out,cv2.COLOR_Lab2BGR); res=cur.copy(); res[m>0]=out[m>0]
cv2.imwrite('room_v3.png',res)
cv2.imwrite('v3r.png',cv2.resize(res[200:368,900:1536],None,fx=2,fy=2,interpolation=cv2.INTER_NEAREST))
cv2.imwrite('v3l.png',cv2.resize(res[280:368,0:250],None,fx=3,fy=3,interpolation=cv2.INTER_NEAREST))
