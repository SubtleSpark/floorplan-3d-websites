import * as THREE from 'three';
import { LIVING_VIEWPOINT } from './viewpoint.js';
import { createBuilding, ROOMS, METRICS } from './building.js';

// A true 2D drawing generated from this apartment's geometry. No colleague-plan coordinates.
const num=n=>Number(n.toFixed(4));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const point=(x,z)=>`${num(x)},${num(z)}`;
function hull(points){
 const unique=[...new Map(points.map(p=>[`${p[0].toFixed(4)},${p[1].toFixed(4)}`,p])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 if(unique.length<3)return unique;const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);let lo=[],hi=[];
 for(const p of unique){while(lo.length>=2&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p)}
 for(const p of unique.slice().reverse()){while(hi.length>=2&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p)}
 return lo.slice(0,-1).concat(hi.slice(0,-1));
}
function worldBounds(mesh){mesh.geometry.computeBoundingBox();return mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld)}
function footprint(mesh){const p=mesh.geometry.attributes.position,v=new THREE.Vector3(),points=[];for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);points.push([v.x,v.z])}return hull(points)}
function polygon(points,fill,stroke='#a5afa1',width=.012){return `<polygon points="${points.map(p=>point(...p)).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`}
function line(points,color='#82a4a0',width=.04){return `<polyline points="${points.map(p=>point(...p)).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`}
function material(mesh){return Array.isArray(mesh.material)?mesh.material[0]:mesh.material}
function sectionLines(mesh,height=.95){
 const a=mesh.geometry.attributes.position,index=mesh.geometry.index,out=[],v=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
 const count=index?index.count:a.count;for(let k=0;k<count;k+=3){for(let j=0;j<3;j++)v[j].fromBufferAttribute(a,index?index.getX(k+j):k+j).applyMatrix4(mesh.matrixWorld);const p=[];for(let j=0;j<3;j++){const u=v[j],w=v[(j+1)%3];if((u.y<=height&&w.y>=height)||(u.y>=height&&w.y<=height)){const dy=w.y-u.y;if(Math.abs(dy)<1e-7)continue;const t=(height-u.y)/dy;p.push([u.x+(w.x-u.x)*t,u.z+(w.z-u.z)*t])}}if(p.length===2)out.push(line(p))}return out.join('');
}
function floorMarkup(group){let s='';group.traverse(o=>{if(!o.isMesh||o.geometry.type!=='ExtrudeGeometry')return;const shape=o.geometry.parameters.shapes;const shapes=Array.isArray(shape)?shape:[shape];for(const sh of shapes){const pts=sh.getPoints(32).map(p=>[p.x,-p.y]);const m=material(o),hex=m.color?.getHexString()||'e9e8dc';s+=polygon(pts,m.userData.planFloor==='wood'?'url(#home-plan-wood)':`#${hex}`,'#d5dbcf',.012)}});return s}
function wallMarkup(group){let s='';group.traverse(o=>{if(!o.isMesh||o.geometry.type==='ExtrudeGeometry')return;const b=worldBounds(o);if(b.min.y>.95||b.max.y<.95)return;const m=material(o);if(m.transparent&&m.opacity<.5){s+=sectionLines(o);return}const hex=m.color?.getHexString();const isDoor=hex==='b99c76';s+=polygon(footprint(o),isDoor?'#d4c2a0':'#687467',isDoor?'#a4977f':'#5e6a5b',.012)});return s}
const rect=(x,z,w,d,fill='#ddd6c5',r=.02)=>`<rect x="${num(x)}" y="${num(z)}" width="${num(w)}" height="${num(d)}" rx="${r}" fill="${fill}" stroke="#a8b0a0" stroke-width=".014"/>`;
function groupTransform(g){const m=g.matrixWorld.elements;return `matrix(${num(m[0])} ${num(m[2])} ${num(m[8])} ${num(m[10])} ${num(m[12])} ${num(m[14])})`}
function semanticFurniture(g){
 let s='';if(g.userData.bed){const w=g.userData.bed.width+.1,d=2.15;s=rect(-w/2,-d/2,w,d,'#f4f2e9',.055)+rect(-w/2,-d/2-.015,w,.08,'#c4c4b5')+rect(-w/2+.06,-d/2+.14,w/2-.1,.35,'#eeece2',.06)+rect(.04,-d/2+.14,w/2-.1,.35,'#eeece2',.06)+rect(-w/2+.025,-.12,w-.05,d/2+.095,'#cbd1c0',.025)}
 else if(g.userData.wardrobe){const {width:w,depth:d}=g.userData.wardrobe;s=rect(-w/2,-d/2,w,d,'#cbbda2');for(let x=-w/2+w/Math.max(2,Math.round(w/.6));x<w/2-.02;x+=w/Math.max(2,Math.round(w/.6)))s+=line([[x,-d/2],[x,d/2]],'#a99f87',.012);s+=line([[-w/2+.04,d/2-.04],[w/2-.04,d/2-.04]],'#8f9b8c',.015)}
 else if(g.userData.asset==='sofa'){s=`<g transform="rotate(90)"><path d="M-1.175 -.795H1.175V.25H-.3V.795H-1.175Z" fill="#bfc4ba" stroke="#8c9789" stroke-width=".018"/>${rect(-1.175,-.795,2.35,.17,'#aeb7aa')}${line([[-.3,-.6],[-.3,.77]],'#98a392',.012)}${line([[.43,-.6],[.43,.23]],'#98a392',.012)}</g>`}
 else if(g.userData.asset==='dining-chair'){s=rect(-.215,-.275,.43,.55,'#b7afa0',.07)+rect(-.215,-.275,.43,.07,'#8f9383',.025)}
 else if(g.userData.asset==='coffee-table'){s=rect(-.3,-.6,.6,1.2,'#c7b89b',.04)}
 return s?`<g transform="${groupTransform(g)}">${s}</g>`:'';
}
function furnitureMarkup(group){const entries=[];const collect=o=>{if(o.userData.bed||o.userData.wardrobe||o.userData.asset){const s=semanticFurniture(o);if(s){entries.push({y:1,s});return}}if(o.isMesh){const b=worldBounds(o),m=material(o);if(b.min.y>1.05||b.max.y<.015)return;if(m.transparent){if(m.opacity<.5)entries.push({y:1.1,s:sectionLines(o,.95)});return}const size=b.getSize(new THREE.Vector3());if(size.x*size.z<.002)return;let color=m.color?.getHexString()||'d4d5c7';const pts=footprint(o);entries.push({y:b.max.y,s:polygon(pts,`#${color}`,'#aeb7a4',.01)});return}for(const c of o.children)collect(c)};for(const c of group.children)collect(c);return entries.sort((a,b)=>a.y-b.y).map(e=>e.s).join('')}
function dimMarkup(building){let s='';building.annotations.traverse(o=>{if(!o.isLine)return;const a=o.geometry.attributes.position,pts=[];for(let i=0;i<a.count;i++)pts.push([a.getX(i),a.getZ(i)]);s+=line(pts,'#889c87',.012)});for(const d of building.dims)s+=`<text class="home-plan-dim" x="${d.x}" y="${d.z-.08}">${esc(d.label)}</text>`;return s}
export function buildPlanSVG(building){
 building.architecture.updateWorldMatrix(true,true);building.furnishings.updateWorldMatrix(true,true);building.common.updateWorldMatrix(true,true);
 const defs='<defs><pattern id="home-plan-wood" width=".3" height="1" patternUnits="userSpaceOnUse"><rect width=".3" height="1" fill="#e7dfcb"/><path d="M0 0V1M0 0H.3" stroke="#d1c8b5" stroke-width=".008"/></pattern></defs>';
 const common=`<g class="home-plan-common" style="display:none">${floorMarkup(building.common)}${wallMarkup(building.common)}${furnitureMarkup(building.common)}</g>`;
 const vp=LIVING_VIEWPOINT;
 const angle=Math.atan2(vp.direction.z,vp.direction.x)*180/Math.PI+90;
 const viewpoint=`<g class="home-plan-viewpoint" data-viewpoint-id="${vp.id}" tabindex="0" role="button" aria-label="打开客厅360度全景，唯一观察点" transform="translate(${vp.x} ${vp.z})"><title>客厅 · 360° 环视</title><circle r=".54" fill="transparent" stroke="none"/><circle r=".38" fill="#355e53" stroke="#fffaf1" stroke-width=".045"/><path d="M-.1 -.44L0 -.62 .1 -.44Z" transform="rotate(${angle})" fill="#355e53" stroke="#fffaf1" stroke-width=".02"/><text y=".075" style="font-size:.25px;fill:#fffaf1;font-weight:600">360°</text><rect x="-.64" y=".46" width="1.28" height=".3" rx=".1" fill="#fffaf1" stroke="#9cb09f" stroke-width=".018"/><text y=".685" style="font-size:.25px;fill:#355e53;font-weight:600">客厅环视</text></g>`;
 const labels=building.rooms.map(r=>`<g class="home-plan-room" data-room-id="${esc(r.id)}" tabindex="0" role="button" aria-label="${esc(r.name)}，原图${r.area}平方米" transform="translate(${r.x} ${r.z})"><rect x="-.53" y="-.16" width="1.06" height=".48" rx=".05" fill="#f8faf1" fill-opacity=".85" stroke="none"/><text class="home-plan-name">${esc(r.name)}</text><text class="home-plan-area" y=".2">${r.area.toFixed(1)} m²</text></g>`).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-.8 -.45 18.2 15.7" role="group" aria-label="星宸天奕原户型平面图，14.60米乘13.05米尺寸轴线，四室两厅三卫。圆角与落地玻璃按原模型。">${defs}${common}<g class="home-plan-floors">${floorMarkup(building.architecture)}</g><g class="home-plan-furniture">${furnitureMarkup(building.furnishings)}</g><g class="home-plan-walls">${wallMarkup(building.architecture)}</g><g class="home-plan-labels">${labels}</g><g class="home-plan-dimensions" style="display:none">${dimMarkup(building)}</g>${viewpoint}</svg>`;
}
function createPlanModel(){const scene=new THREE.Scene(),textures={woodColor:new THREE.Texture(),woodNormal:new THREE.Texture(),woodRough:new THREE.Texture()};return createBuilding(scene,textures)}
export function initPlan(root,{building=null,onRoom=()=>{},onViewpoint=()=>{}}={}){
 const model=building||createPlanModel();root.innerHTML=buildPlanSVG(model);const svg=root.querySelector('svg');let scale=1,tx=0,ty=0,drag=null,pinch=null,moved=false;const pointers=new Map();
 const marker=root.querySelector('[data-viewpoint-id]');
 const sizeMarker=()=>{const matrix=svg.getScreenCTM();if(matrix&&matrix.a){const units=44/Math.hypot(matrix.a,matrix.b);marker.setAttribute('transform',`translate(${LIVING_VIEWPOINT.x} ${LIVING_VIEWPOINT.z}) scale(${units})`)}};
 new ResizeObserver(sizeMarker).observe(root);
 const apply=()=>{svg.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`;root.dataset.zoom=String(scale);sizeMarker()};
 const begin=()=>{if(pointers.size===2){const p=[...pointers.values()];pinch={distance:Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y),scale,cx:(p[0].x+p[1].x)/2,cy:(p[0].y+p[1].y)/2,tx,ty};drag=null;moved=true}else if(pointers.size===1){const p=[...pointers.values()][0];drag={x:p.x,y:p.y,tx,ty};pinch=null}};
 root.addEventListener('wheel',e=>{e.preventDefault();scale=Math.max(.5,Math.min(5,scale*Math.exp(-e.deltaY*.001)));apply()},{passive:false});
 root.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=false;root.setPointerCapture(e.pointerId);begin()});
 root.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&pinch){const p=[...pointers.values()];scale=Math.max(.5,Math.min(5,pinch.scale*Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)/Math.max(1,pinch.distance)));tx=pinch.tx+(p[0].x+p[1].x)/2-pinch.cx;ty=pinch.ty+(p[0].y+p[1].y)/2-pinch.cy;apply()}else if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved=moved||Math.hypot(dx,dy)>5;tx=drag.tx+dx;ty=drag.ty+dy;apply()}});
 root.addEventListener('pointerup',e=>{if(!moved&&pointers.size===1){const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-viewpoint-id],[data-room-id]');if(target?.dataset.viewpointId)onViewpoint(target);else if(target)onRoom(ROOMS.find(r=>r.id===target.dataset.roomId))}pointers.delete(e.pointerId);drag=pinch=null;begin()});root.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);drag=pinch=null;begin()});
 root.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){if(e.target.dataset.viewpointId){e.preventDefault();onViewpoint(e.target)}else if(e.target.dataset.roomId){e.preventDefault();onRoom(ROOMS.find(r=>r.id===e.target.dataset.roomId))}}});
 const visible=(selector,show)=>{root.querySelector(selector).style.display=show?'':'none'};
 return {reset(){scale=1;tx=ty=0;apply()},zoom(f){scale=Math.max(.5,Math.min(5,scale*f));apply()},setFurniture(show){visible('.home-plan-furniture',show)},setLabels(show){visible('.home-plan-labels',show)},setDimensions(show){visible('.home-plan-dimensions',show)},setCommon(show){visible('.home-plan-common',show);svg.setAttribute('viewBox',show?'-7.1 -.45 24.5 15.7':'-.8 -.45 18.2 15.7');this.reset()},metrics:METRICS};
}
