import fitz, re, json, os
from collections import defaultdict, Counter
d=fitz.open('hsv.pdf')
toc=d.get_toc(); boek=[]
for t in toc:
    m=re.match(r'\s*Boek (\d+)\b',t[1])
    if m: boek.append((int(m.group(1)),t[2]))
boek.sort()
ranges=[]
for i,(n,sp) in enumerate(boek):
    ep=(boek[i+1][1]-1) if i+1<len(boek) else d.page_count
    ranges.append((n,sp,ep))

def clean(text):
    text=re.sub(r'Pagina\s*\d+',' ',text)
    text=re.sub(r'Herziene Statenvertaling Versie',' ',text)
    text=re.sub(r'Index[^\n]*',' ',text)
    text=re.sub(r'Boek\s+\d+\b[^\n]*',' ',text)
    text=re.sub(r'-\s*\n\s*','',text)
    text=text.replace('\n',' ')
    text=re.sub(r'[ \t]+',' ',text)
    return text

CH_RE=re.compile(r'Hoofdstuk\s+(\d+)')
V_RE=re.compile(r'(?:(?<!\d)\d+:\s*|(?<![A-Za-z\d])v)(\d+):?(?=\s)')

def split_merged(d2):
    out=dict(d2); 
    if not out: return out
    maxv=max(out); changed=True
    while changed:
        changed=False
        for m in range(2,maxv+1):
            if m not in out and (m-1) in out:
                txt=out[m-1]; mt=list(re.finditer(r'(?<!\d)'+str(m)+r'(?!\d)',txt))
                if mt:
                    sp=mt[-1]; out[m-1]=txt[:sp.start()].strip(); out[m]=txt[sp.end():].strip(); changed=True; break
    return out

rows=[]
for n,sp,ep in ranges:
    text=clean(' '.join(d[p].get_text() for p in range(sp-1,ep)))
    chs=list(CH_RE.finditer(text))
    for ci,cm in enumerate(chs):
        cnum=int(cm.group(1)); cstart=cm.end()
        cend=chs[ci+1].start() if ci+1<len(chs) else len(text)
        block=text[cstart:cend]
        vs=list(V_RE.finditer(block))
        ordered=[]
        for vi,vm in enumerate(vs):
            p=int(vm.group(1)); vend=vs[vi+1].start() if vi+1<len(vs) else len(block)
            ordered.append((p, block[vm.end():vend].strip()))
        # greedy renumber by sequential order (fixes mislabeled markers)
        expected=1; out={}
        for p,t in ordered:
            v=expected if (p<=expected) else p
            if v in out: out[v]=out[v]+' '+t
            else: out[v]=t
            expected=v+1
        fixed=split_merged(out)
        for v in sorted(fixed): rows.append({'b':n,'c':cnum,'v':v,'t':fixed[v]})

expected_ch=[50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22]
chap=defaultdict(set)
for r in rows: chap[r['b']].add(r['c'])
dup=Counter((r['b'],r['c'],r['v']) for r in rows); dups=[k for k,x in dup.items() if x>1]
ch=defaultdict(list)
for r in rows: ch[(r['b'],r['c'])].append(r['v'])
anom=[(k,sorted(v)[0],sorted(v)[-1],len(v)) for k,v in ch.items() if sorted(v)!=list(range(1,len(v)+1))]
empty=[ (r['b'],r['c'],r['v']) for r in rows if not r['t'].strip()]
print('total verses:', len(rows),'chapters:',sum(len(chap[n]) for n in range(1,67)))
print('chapter mismatch:', sum(1 for n in range(1,67) if sorted(chap[n])!=list(range(1,expected_ch[n-1]+1))))
print('duplicates:', len(dups), dups[:10])
print('non-contiguous:', len(anom), anom[:20])
print('empty texts:', len(empty), empty[:10])
json.dump(rows, open('hsv.json','w'), ensure_ascii=False)
print('json MB %.2f'%(os.path.getsize('hsv.json')/1e6))
