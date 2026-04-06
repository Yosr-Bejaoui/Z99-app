import os 
import re 
for root, _, files in os.walk('src'): 
    for f in files: 
        if f.endswith('.tsx'): 
            p = os.path.join(root, f) 
            with open(p, 'rb') as fp: b = fp.read() 
            s = b.decode('utf-8', errors='ignore') 
            orig = s 
            if s != orig: 
                with open(p, 'wb') as fp: fp.write(s.encode('utf-8')) 
                print('Fixed', p) 
