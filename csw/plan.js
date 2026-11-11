import {ROOMS} from './building.js';
export function initPlan(root,onRoom){
 const line=(x1,y1,x2,y2,color='#737c6b',w=.12)=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="${w}" fill="none"/>`;
 let s=`<svg viewBox="-1 -.85 14.8 10.1" role="img" aria-label="12.8米乘8米户型轴线平面，三间卧室和开放客餐厅"><defs><pattern id="planks" width=".3" height="1.1" patternUnits="userSpaceOnUse"><rect width=".3" height="1.1" fill="#e8dfce"/><path d="M0 0V1.1M0 0H.3" stroke="#d2c9b8" stroke-width=".006"/></pattern></defs><rect x="-.11" y="-.11" width="13.02" height="8.22" fill="#f8f7ef" stroke="#5b6556" stroke-width=".11"/>`;
 for(const r of ROOMS){const [a,b,c,d]=r.rect;const fill=['northbed','southbed','master'].includes(r.id)?'url(#planks)':['bath','ensuite'].includes(r.id)?'#e0e5dd':'#eeeae0';s+=`<rect class="room-hit" data-room="${r.id}" x="${a}" y="${b}" width="${c-a}" height="${d-b}" fill="${fill}"/>`}
 const walls=[[0,0,2.55,0],[3.55,0,5,0],[5.8,0,7,0],[7.75,0,8.45,0],[10.55,0,11.25,0],[12,0,12.8,0],[0,0,0,8],[12.8,0,12.8,8],[0,8,.45,8],[6.1,8,6.75,8],[9.4,8,9.8,8],[12.5,8,12.8,8],[3.8,0,3.8,.8],[3.8,2.35,3.8,2.7],[6.3,0,6.3,2.7],[8,0,8,2.7],[11,0,11,2.7],[3.8,2.7,7,2.7],[7.9,2.7,8.4,2.7],[9.3,2.7,11.1,2.7],[12,2.7,12.8,2.7],[7.55,3.9,9.6,3.9],[6.6,3.9,6.6,8],[9.6,3.8,9.6,8],[3.8,6.7,4.05,6.7],[6.35,6.7,6.6,6.7]];
 for(const w of walls)s+=line(...w,'#626a59',.14);
 for(const w of [[5,0,5.8,0],[7,0,7.75,0],[8.45,0,10.55,0],[11.25,0,12,0],[.45,8,6.1,8],[6.75,8,9.4,8],[9.8,8,12.5,8],[4.05,6.7,6.35,6.7]]){s+=line(...w,'#94b2af',.06);s+=line(w[0],w[1]-.06,w[2],w[3]-.06,'#94b2af',.015)}
 s+=line(3.8,.8,3.8,2.35,'#94b2af',.04);
 const arc=(x,y,w,angle=0)=>`<g transform="translate(${x} ${y}) rotate(${angle})"><path d="M0 0V${-w}M0 ${-w}A${w} ${w} 0 0 1 ${w} 0" stroke="#9da68f" stroke-width=".015" fill="none"/></g>`;
 for(const d of [[2.55,0,1,0],[7,2.7,.9,0],[8.4,2.7,.9,0],[11.1,2.7,.9,0],[7.55,3.9,.9,180],[9.6,2.7,1.1,90]])s+=arc(...d);
 const rect=(x,y,w,h,fill='#c7c6b4',r=.03)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="#a9ad9b" stroke-width=".012"/>`;
 const bed=(x,y,w,h)=>rect(x,y,w,h,'#f6f4eb')+rect(x+.06,y+.07,(w-.17)/2,.34,'#ebe8dc')+rect(x+w/2+.025,y+.07,(w-.17)/2,.34,'#ebe8dc')+rect(x+.03,y+h*.5,w-.06,h*.47,'#cbd1be');
 s+=`<g transform="translate(7.35 7.05) rotate(-90)">${bed(0,0,1.6,2.15)}</g><g transform="translate(10.53 7.15) rotate(-90)">${bed(0,0,1.9,2.15)}</g><g transform="translate(8.75 1.5) rotate(-90)">${bed(0,0,1.3,2.15)}</g>`;

 s+=`<path d="M4.9 4.025H5.695V6.375H4.105V5.7H4.9Z" fill="#c9cbc3" stroke="#a9ad9b" stroke-width=".012"/>`+rect(5.53,4.025,.16,2.35,'#b9bdb4')+rect(.15,4,.42,2.4,'#b5b29b')+rect(2.65,4.8,1.2,.6,'#bebba5',.07)+rect(.975,1.86,1.65,.88,'#d2bfa0',.12);
 for(let x of [1.055,2.095])for(let y of [1.355,2.815])s+=rect(x,y,.42,.42,'#aaa38e',.1);
 s+=rect(3.95,.12,2.2,.6,'#d0c5b0')+rect(5.63,.7,.6,1.75,'#d0c5b0')+rect(3.92,1.98,.65,.6,'#b1b8ad')+rect(6.08,4.3,.38,2.05,'#c7bca7');
 s+=rect(7.55,4.0,1.9,.6,'#c5bca5')+rect(12.08,2.85,.6,1.8,'#c5bca5')+rect(9.6,2.14,1.2,.44,'#c5bca5')+rect(9.08,7.13,.4,.38,'#c5bca5')+rect(12.26,7.23,.4,.38,'#c5bca5')+rect(.2,.14,2.2,.52,'#c7bba3');
 for(let x of [6.42,11.12]){s+=rect(x>10?12.105:x,x>10?1.875:1.93,.5,.65,'#f7f7ec');s+=`<ellipse cx="${x+.28}" cy="1.52" rx=".22" ry=".32" fill="#faf9ef" stroke="#b0b9a9" stroke-width=".02"/>`;s+=rect(x+.1,.2,1.3,.9,'#ccd9d2')}
 s+=rect(5.9,7.05,.59,.65,'#dedfd6')+`<circle cx="6.2" cy="7.37" r=".19" fill="none" stroke="#a7b0a0" stroke-width=".02"/>`;
 for(const r of ROOMS){let z=r.z;if(r.id==='northbed')z=1.36;if(r.id==='living')z=3.35;s+=`<text class="plan-label" x="${r.x}" y="${z}">${r.name}<tspan class="plan-area" x="${r.x}" dy=".24">${r.id==='study'?'原书房':r.area.toFixed(2)+' m²'}</tspan></text>`}
 function dim(a,b,y,label){s+=line(a,y,b,y,'#929a85',.012)+line(a,y-.08,a,y+.08,'#929a85',.012)+line(b,y-.08,b,y+.08,'#929a85',.012)+`<text class="dimension" x="${(a+b)/2}" y="${y-.13}">${label}</text>`}
 [[0,3.8,'3800'],[3.8,6.6,'2800'],[6.6,9.6,'3000'],[9.6,12.8,'3200']].forEach(d=>dim(d[0],d[1],8.45,d[2]));dim(0,12.8,8.95,'12800 mm');
 [[3.8,6.3,'2500'],[6.3,8,'1700'],[8,11,'3000'],[11,12.8,'1800']].forEach(d=>dim(d[0],d[1],-.4,d[2]));
 s+=line(13.2,0,13.2,8,'#929a85',.012)+line(13.1,0,13.3,0,'#929a85',.012)+line(13.1,8,13.3,8,'#929a85',.012)+`<text class="dimension" transform="translate(13.43 4) rotate(90)">8000 mm</text>`;
 s+=`</svg>`;root.innerHTML=s;
 let scale=1,tx=0,ty=0,drag=null,moved=false;const svg=root.querySelector('svg');const apply=()=>{svg.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`;root.dataset.zoom=String(scale)};
 root.addEventListener('wheel',e=>{e.preventDefault();scale=Math.max(.6,Math.min(4,scale*Math.exp(-e.deltaY*.001)));apply()},{passive:false});
 const pointers=new Map();let pinch=null;
 const begin=()=>{if(pointers.size===2){const p=[...pointers.values()];pinch={distance:Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y),scale,cx:(p[0].x+p[1].x)/2,cy:(p[0].y+p[1].y)/2,tx,ty};drag=null;moved=true}else if(pointers.size===1){const p=[...pointers.values()][0];drag={x:p.x,y:p.y,tx,ty};pinch=null}};
 root.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=false;root.setPointerCapture(e.pointerId);begin()});
 root.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&pinch){const p=[...pointers.values()];scale=Math.max(.6,Math.min(4,pinch.scale*Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)/Math.max(1,pinch.distance)));tx=pinch.tx+(p[0].x+p[1].x)/2-pinch.cx;ty=pinch.ty+(p[0].y+p[1].y)/2-pinch.cy;apply()}else if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved=moved||Math.hypot(dx,dy)>5;tx=drag.tx+dx;ty=drag.ty+dy;apply()}});
 root.addEventListener('pointerup',e=>{if(!moved&&pointers.size===1){const el=document.elementFromPoint(e.clientX,e.clientY);if(el?.dataset.room)onRoom(ROOMS.find(r=>r.id===el.dataset.room))}pointers.delete(e.pointerId);drag=pinch=null;begin()});
 root.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);drag=pinch=null;begin()});
 return{reset(){scale=1;tx=ty=0;apply()},zoom(f){scale=Math.max(.6,Math.min(4,scale*f));apply()}};
}
