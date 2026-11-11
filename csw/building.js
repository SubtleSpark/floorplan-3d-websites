import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
// Metre model. Top-left of original plan = (0,0). Published dimension chains, not target-area scaling.
export const METRICS={width:12.8,depth:8,story:2.8,x:[0,3.8,6.6,9.6,12.8]};
export const ROOMS=[
{id:'living',name:'客餐厅',area:25.14,x:1.9,z:3.6,rect:[.1,.1,3.7,6.65]},
{id:'kitchen',name:'厨房',area:6.75,x:5.05,z:1.4,rect:[3.9,.1,6.2,2.6]},
{id:'bath',name:'客卫',area:4.72,x:7.15,z:1.4,rect:[6.4,.1,7.9,2.6]},
{id:'northbed',name:'次卧',area:8.25,x:9.5,z:1.4,rect:[8.1,.1,10.9,2.6]},
{id:'ensuite',name:'主卫',area:4.81,x:11.9,z:1.4,rect:[11.1,.1,12.7,2.6]},
{id:'hall',name:'走廊',area:7.11,x:6.65,z:3.3,rect:[3.9,2.8,9.5,3.8]},
{id:'study',name:'开放起居区',area:7.69,x:5.2,z:5.3,rect:[3.9,4,6.5,6.6]},
{id:'southbed',name:'次卧',area:11.95,x:8.1,z:5.9,rect:[6.7,4,9.5,7.9]},
{id:'master',name:'主卧',area:17.06,x:11.2,z:5.4,rect:[9.7,2.8,12.7,7.9]},
{id:'balcony',name:'阳台',area:8.91,x:3.3,z:7.4,rect:[.1,6.8,6.5,7.9]}];
export function createBuilding(scene,textures){
 const architecture=new THREE.Group(),furnishings=new THREE.Group(),annotations=new THREE.Group();scene.add(architecture,furnishings,annotations);annotations.visible=false;
 const clip=new THREE.Plane(new THREE.Vector3(0,-1,0),.9),archMats=[],sectionCaps=[];
 const material=(color,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const archMat=(color,r=.8,metal=0)=>{const m=material(color,r,metal);m.clippingPlanes=[clip];m.clipShadows=true;archMats.push(m);return m};
 const white=material('#f4f1e8',.48),ivory=material('#e2dfcf',.95),bronze=material('#8b7859',.3,.7),black=material('#333934',.45),metal=material('#aab6ae',.22,.9);
 const wall=archMat('#eeece3'),frame=archMat('#5d5b54',.34,.7),trim=archMat('#c9c0ac',.6),doorWood=archMat('#b99c76',.65);
 const wood=material('#e6cda8',.6);wood.map=textures.woodColor;wood.normalMap=textures.woodNormal;wood.normalScale=new THREE.Vector2(.32,.32);wood.roughnessMap=textures.woodRough;
 const oak=wood.clone();oak.color.set('#a58c6c');oak.normalScale.set(.18,.18);
 const glass=new THREE.MeshPhysicalMaterial({color:'#cbdde0',metalness:.1,roughness:.08,transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide});glass.clippingPlanes=[clip];archMats.push(glass);
 const ceramic=material('#fbfcf5',.2),sinkSteel=material('#7d8881',.26,.8);
 function surfaceTexture(type) {
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
  if(type==='stone') {ctx.fillStyle='#dad7ca';ctx.fillRect(0,0,512,512);for(let i=0;i<7000;i++){const v=Math.floor(Math.random()*20+205);ctx.fillStyle=`rgba(${v},${v-2},${v-10},.14)`;ctx.fillRect(Math.random()*512,Math.random()*512,Math.random()*3+1,.6)}ctx.strokeStyle='#bcbcae';ctx.lineWidth=1;ctx.strokeRect(0,0,512,512)}
  else if(type==='cloth'){ctx.fillStyle='#e2dece';ctx.fillRect(0,0,512,512);for(let i=0;i<512;i+=3){ctx.strokeStyle=i%2?'#cac5b6':'#ede8da';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,512);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.stroke()}}
  else {ctx.fillStyle='#e2e3d6';ctx.fillRect(0,0,512,512);for(let i=0;i<12000;i++){ctx.fillStyle=`rgba(90,102,81,${Math.random()*.06})`;ctx.fillRect(Math.random()*512,Math.random()*512,1,1)}}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
 }
 const stone=material('#f3eee0',.48);stone.map=surfaceTexture('stone');stone.map.repeat.set(1/.9,1/.9);stone.bumpMap=stone.map;stone.bumpScale=.006;
 const wetTile=stone.clone();wetTile.color.set('#c3c9bb');wetTile.roughness=.35;
 const clothBase=surfaceTexture('cloth');clothBase.repeat.set(2,2);
 function fabric(color){const m=material(color,.95);m.map=clothBase;m.bumpMap=clothBase;m.bumpScale=.007;return m}
 const linen=fabric('#f8f3e4'),taupe=fabric('#b8ad91'),sage=fabric('#8c987f'),cream=fabric('#dedbca'),carpet=fabric('#d7cdb6');
 const marble=material('#ebe7db',.3);marble.map=surfaceTexture('plaster');marble.bumpMap=marble.map;marble.bumpScale=.004;
 const leaf=material('#536c39',.88);leaf.side=THREE.DoubleSide;
 const mesh=(geo,mat,parent=architecture)=>{const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
 function box(x,y,z,w,h,d,mat,parent=architecture,r=0){let g=r?new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/3,h/3,d/3)):new THREE.BoxGeometry(w,h,d);const m=mesh(g,mat,parent);m.position.set(x,y,z);return m}
 function cyl(x,y,z,r,h,mat,parent=furnishings,rt=r){const m=mesh(new THREE.CylinderGeometry(rt,r,h,40),mat,parent);m.position.set(x,y,z);return m}
 function sphere(x,y,z,sx,sy,sz,mat,parent=furnishings){const m=mesh(new THREE.SphereGeometry(1,16,10),mat,parent);m.scale.set(sx,sy,sz);m.position.set(x,y,z);return m}
 function line3(a,b,mat,parent=furnishings,r=.012){const v=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),m=mesh(new THREE.CylinderGeometry(r,r,v.length(),8),mat,parent);m.position.copy(new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m}
 function poly(points,mat,y=0,depth=.08,parent=architecture){const s=new THREE.Shape();points.forEach((p,i)=>i?s.lineTo(p[0],-p[1]):s.moveTo(p[0],-p[1]));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false});g.rotateX(-Math.PI/2);const m=mesh(g,mat,parent);m.position.y=y-depth;return m}
 function floorRect(x1,z1,x2,z2,mat){return poly([[x1,z1],[x2,z1],[x2,z2],[x1,z2]],mat,.015,.06)}
 function arcPoints(cx,cz,r,start,end,n=16){return Array.from({length:n+1},(_,i)=>{let a=start+(end-start)*i/n;return[cx+Math.cos(a)*r,cz+Math.sin(a)*r]})}
 function wallSeg(x1,z1,x2,z2,height=2.8,thickness=.18,mat=wall,parent=architecture,bottom=0){const len=Math.hypot(x2-x1,z2-z1),m=box((x1+x2)/2,bottom+height/2,(z1+z2)/2,len,height,thickness,mat,parent);m.rotation.y=-Math.atan2(z2-z1,x2-x1);if(bottom<.9&&bottom+height>.9){const cap=box((x1+x2)/2,.901,(z1+z2)/2,len,.006,thickness,white,parent);cap.rotation.y=m.rotation.y;sectionCaps.push(cap)}return m}
 function baseboard(x1,z1,x2,z2,parent=architecture){wallSeg(x1,z1,x2,z2,.075,.21,trim,parent)}
 function solid(x1,z1,x2,z2,t=.18,mat=wall,parent=architecture){wallSeg(x1,z1,x2,z2,2.8,t,mat,parent);baseboard(x1,z1,x2,z2,parent)}
 function doorway(x1,z1,x2,z2,flip=false){
  const len=Math.hypot(x2-x1,z2-z1),ang=-Math.atan2(z2-z1,x2-x1);
  wallSeg(x1,z1,x2,z2,.62,.18,wall,architecture,2.18);
  const g=new THREE.Group();g.position.set(x1,0,z1);g.rotation.y=ang;architecture.add(g);
  box(.025,1.08,0,.05,2.16,.22,doorWood,g);box(len-.025,1.08,0,.05,2.16,.22,doorWood,g);box(len/2,2.15,0,len,.065,.22,doorWood,g);
  const pivot=new THREE.Group();pivot.position.x=.045;g.add(pivot);pivot.rotation.y=flip?-Math.PI*.38:Math.PI*.38;
  box((len-.09)/2,1.055,0,len-.09,2.11,.045,doorWood,pivot,.012);box(len-.22,1.0,.055,.13,.018,.025,bronze,pivot,.006);
 }
 function glazing(x1,z1,x2,z2,sill=.26,top=2.65,parent=architecture){
  const len=Math.hypot(x2-x1,z2-z1),ang=-Math.atan2(z2-z1,x2-x1),g=new THREE.Group();g.position.set(x1,0,z1);g.rotation.y=ang;parent.add(g);
  if(sill>0)box(len/2,sill/2,0,len,sill,.15,wall,g);
  box(len/2,sill+(top-sill)/2,0,len,top-sill,.018,glass,g);
  for(let i=0;i<=Math.ceil(len/1.25);i++)box(i*len/Math.ceil(len/1.25),(sill+top)/2,0,.038,top-sill,.065,frame,g);
  box(len/2,sill,0,len,.045,.07,frame,g);box(len/2,top,0,len,.045,.07,frame,g);
  box(len/2,(top+2.8)/2,0,len,2.8-top,.16,wall,g);
 }

 // Envelope dimension axes: 12.800 × 8.000 m; 0.20 m walls inferred from the image.
 floorRect(0,0,12.8,8,stone).position.y-=.025;box(6.4,-.14,4,12.95,.28,8.15,material('#b6b2a7',.85));
 for(const r of ROOMS){let [a,b,c,d]=r.rect;floorRect(a,b,c,d,['northbed','southbed','master'].includes(r.id)?wood:['bath','ensuite'].includes(r.id)?wetTile:stone)}
 for(const t of [textures.woodColor,textures.woodNormal,textures.woodRough])t.repeat.set(1/1.7,1/1.7);
 // External walls, windows and entry are traced from THIS drawing. Window heights are assumptions.
 solid(0,0,2.55,0,.22);doorway(2.55,0,3.55,0,false);solid(3.55,0,5.0,0,.22);glazing(5,0,5.8,0,1.0,2.35);solid(5.8,0,7.0,0,.22);glazing(7,0,7.75,0,1.25,2.35);solid(7.75,0,8.45,0,.22);glazing(8.45,0,10.55,0,.75,2.35);solid(10.55,0,11.25,0,.22);glazing(11.25,0,12,0,1.25,2.35);solid(12,0,12.8,0,.22);
 solid(0,0,0,8,.22);solid(12.8,0,12.8,8,.22);
 solid(0,8,.45,8,.22);glazing(.45,8,6.1,8,.55,2.35);solid(6.1,8,6.75,8,.22);glazing(6.75,8,9.4,8,.65,2.35);solid(9.4,8,9.8,8,.22);glazing(9.8,8,12.5,8,.65,2.35);solid(12.5,8,12.8,8,.22);
 // Kitchen western sliding access and L-shaped worktop; bath and bedroom openings.
 solid(3.8,0,3.8,.8,.16);glazing(3.8,.8,3.8,2.35,.02,2.2);solid(3.8,2.35,3.8,2.7,.16);
 solid(6.3,0,6.3,2.7,.16);solid(8,0,8,2.7,.18);solid(11,0,11,2.7,.18);
 solid(3.8,2.7,7,2.7,.18);doorway(7,2.7,7.9,2.7);solid(7.9,2.7,8.4,2.7,.18);doorway(8.4,2.7,9.3,2.7);solid(9.3,2.7,11.1,2.7,.18);doorway(11.1,2.7,12,2.7);solid(12,2.7,12.8,2.7,.18);
 solid(6.6,3.9,6.65,3.9,.18);doorway(6.65,3.9,7.55,3.9,true);solid(7.55,3.9,9.6,3.9,.18);
 solid(6.6,3.9,6.6,8,.18);
 doorway(9.6,2.7,9.6,3.8,false);solid(9.6,3.8,9.6,8,.18);
 solid(3.8,6.7,4.05,6.7,.16);glazing(4.05,6.7,6.35,6.7,.65,2.35);solid(6.35,6.7,6.6,6.7,.16);
 // Living-to-balcony open/sliding threshold, with the plan's broad opening.
 solid(0,6.7,.17,6.7,.2);solid(3.56,6.7,3.8,6.7,.2);box(1.86,.025,6.7,3.38,.04,.08,frame);wallSeg(.17,6.7,3.56,6.7,.6,.16,wall,architecture,2.2);
 function detailBox(x,y,z,w,h,d,mat,parent,r=0){const m=box(x,y,z,w,h,d,mat,parent,r);m.castShadow=false;return m}
 function localGroup(x,z,angle=0,parent=furnishings){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;parent.add(g);return g}
 function bed(x,z,width=1.55,angle=0,cover=sage){
  const g=localGroup(x,z,angle);g.userData.bed={width};box(0,.19,0,width+.1,.3,2.13,oak,g,.04);box(0,.43,0,width,.22,2.05,linen,g,.085);
  box(0,.59,.13,width+.015,.16,1.72,linen,g,.075);box(0,.695,.59,width+.035,.07,.85,cover,g,.035);box(0,.53,.995,width+.035,.25,.08,cover,g,.035);
  box(0,.69,-1.08,width+.2,1.22,.12,cream,g,.06);box(0,.065,0,width-.15,.12,1.8,black,g);
  // A softly folded duvet edge and inset headboard panel add detail without changing the bed's footprint.
  detailBox(0,.735,.18,width-.04,.025,.12,cream,g,.012);
  detailBox(0,.72,-1.012,width-.08,.91,.012,linen,g,.025);
  for(const side of [-1,1]){const p=box(side*width*.245,.67,-.66,width*.41,.19,.42,linen,g,.09);p.rotation.y=side*.07;const pp=box(side*width*.245,.6,-.85,width*.42,.17,.43,taupe,g,.07);pp.rotation.x=-.16;box(side*(width/2+.29),.24,-.78,.42,.44,.44,oak,g,.025);box(side*(width/2+.29),.477,-.78,.44,.025,.46,marble,g,.01);detailBox(side*(width/2+.29),.30,-.55,.34,.012,.012,bronze,g,.004)}
  return g;
 }
 function wardrobe(x,z,w,d,angle=0){const g=localGroup(x,z,angle);g.userData.wardrobe={width:w,depth:d};box(0,1.18,0,w,2.36,d,oak,g,.02);for(let i=0;i<Math.round(w/.5);i++){const span=w/Math.round(w/.5);box(-w/2+span*(i+.5),1.2,d/2+.01,span-.012,2.28,.025,cream,g,.009);box(-w/2+span*(i+.5)+span/2-.06,1.15,d/2+.04,.012,.35,.02,bronze,g,.005)}}
 function chair(x,z,angle){const g=localGroup(x,z,angle);g.userData.asset="dining-chair";box(0,.46,0,.45,.1,.44,cream,g,.07);box(0,.68,-.2,.47,.42,.09,cream,g,.06);detailBox(0,.69,-.148,.36,.29,.012,linen,g,.025);for(let a of [-.16,.16])for(let b of [-.15,.15])line3([a,.43,b],[a*1.2,.04,b*1.2],oak,g,.023)}
 function cabinet(x,z,w,d,angle=0){const g=localGroup(x,z,angle);box(0,.43,0,w,.82,d,oak,g,.012);box(0,.875,0,w+.035,.065,d+.04,marble,g,.012);detailBox(0,.075,d/2+.018,w-.04,.10,.018,black,g,.004);const count=Math.ceil(w/.6);for(let i=0;i<count;i++){let a=-w/2+w/count*(i+.5);box(a,.46,d/2+.008,w/count-.012,.72,.025,cream,g,.005);detailBox(a,.73,d/2+.03,w/count*.5,.012,.02,bronze,g)}return g}
 function toilet(x,z,angle=0){const g=localGroup(x,z,angle);sphere(0,.2,0,.19,.22,.27,ceramic,g);sphere(0,.41,.055,.23,.08,.32,ceramic,g);sphere(0,.46,.07,.17,.012,.25,material('#c0c9c0',.23),g);box(0,.55,-.27,.39,.48,.17,ceramic,g,.05);box(0,.79,-.27,.4,.03,.18,ceramic,g,.02);cyl(0,.81,-.27,.025,.008,metal,g)}
 function vanity(x,z,w,angle=0){const g=localGroup(x,z,angle);box(0,.52,0,w,.52,.45,oak,g,.025);detailBox(0,.54,.23,w-.05,.012,.012,bronze,g,.003);detailBox(0,.62,.235,w*.35,.012,.012,bronze,g,.003);box(0,.8,0,w+.04,.07,.49,marble,g,.02);sphere(0,.85,0,w*.31,.04,.17,ceramic,g);sphere(0,.88,0,w*.25,.015,.12,material('#b6bfb1',.2),g);cyl(0,.897,.03,.018,.004,metal,g);line3([0,.84,-.16],[0,1.0,-.16],metal,g,.012);line3([0,1,-.16],[0,1,-.05],metal,g,.012);box(0,1.45,-.24,w*.85,.85,.025,material('#9baca2',.12,.9),g,.04)}
 function shower(x,z,w,d,angle=0){const g=localGroup(x,z,angle);box(0,.055,0,w,.08,d,ceramic,g,.015);box(0,1.04,d/2,w,2,.012,glass,g);box(w/2,1.04,0,.012,2,d,glass,g);line3([0,.9,-d/2+.1],[0,2.1,-d/2+.1],metal,g,.015);line3([0,2.1,-d/2+.1],[0,2.1,-d/2+.35],metal,g,.015);cyl(0,2.08,-d/2+.35,.09,.02,metal,g)}
 function plant(x,z,size=1){const g=localGroup(x,z);cyl(0,.22*size,0,.2*size,.44*size,material('#c7bca2',.92),g,.16*size);cyl(0,.45*size,0,.16*size,.01,material('#4a4636',1),g);for(let i=0;i<13;i++){let a=i*2.4,h=(.55+i*.065)*size,r=(.2+Math.sin(i)*.08)*size;const end=[Math.cos(a)*r,h,Math.sin(a)*r];line3([0,.4*size,0],end,leaf,g,.008*size);const m=sphere(end[0],h+.1*size,end[2],.115*size,.26*size,.027*size,leaf,g);m.rotation.set(.4*Math.cos(a),a,.5*Math.sin(a))}return g}

 // Furniture follows reference placement, with a warm oak / stone / linen design proposal.
 bed(9.825,.85,1.2,-Math.PI/2,taupe);
 bed(8.425,6.25,1.5,-Math.PI/2,sage);bed(11.605,6.2,1.8,-Math.PI/2,cream);
 wardrobe(8.5,4.3,1.9,.6);wardrobe(12.38,3.75,1.8,.6,-Math.PI/2);wardrobe(10.2,2.36,1.2,.44,Math.PI);
 // Usable bedroom layouts: headboards east against solid walls; clear foot and wardrobe circulation.
 // North bedroom: compact 1.20 m bed, one primary access side, shallow folded-clothes storage.
 for(const [x,z]of[[9.28,7.32],[12.46,7.42]]){box(x,.29,z,.4,.5,.38,oak,furnishings,.025);box(x,.55,z,.42,.035,.4,marble,furnishings,.012);cyl(x,.62,z,.055,.1,ceramic)}
 // Requested removal: study west and north partitions opened to living and corridor.
 // The east shared bedroom wall and south balcony boundary stay; structural feasibility is not established.
 box(6.28,.44,5.3,.42,.86,2.05,oak,furnishings,.025);box(6.28,.895,5.3,.44,.035,2.08,marble,furnishings,.01);
 // Living room sofa east, television west, dining area north, as drawn.
 box(3.3,.035,5.2,4.5,.04,2.38,carpet,furnishings,.045);
 const sofa=localGroup(4.9,5.2);sofa.userData.asset='sofa';box(0,.24,0,.87,.35,2.2,taupe,sofa,.1);box(.35,.61,0,.18,.65,2.3,cream,sofa,.08);
 for(let k=-1;k<=1;k++){box(-.02,.48,k*.68,.8,.19,.65,linen,sofa,.07);box(.23,.73,k*.68,.22,.5,.64,linen,sofa,.07)}
 for(let z of [-1.1,1.1])box(0,.54,z,.9,.39,.17,linen,sofa,.06);
 for(let z of [-.6,.6]){let p=box(-.05,.7,z,.33,.34,.15,z<0?sage:taupe,sofa,.06);p.rotation.z=.2;p.rotation.y=Math.PI/2}
 box(.34,.25,5.2,.4,.4,2.4,oak,furnishings,.025);box(.23,1.12,5.2,.06,.88,1.58,black,furnishings,.015);box(.266,1.12,5.2,.009,.8,1.5,material('#21322f',.12),furnishings);
 const coffee=localGroup(3.25,5.1);coffee.userData.asset="coffee-table";cyl(0,.31,0,.53,.06,marble,coffee);cyl(0,.15,0,.28,.28,oak,coffee);cyl(3.8,.23,5.6,.33,.04,oak);cyl(3.8,.11,5.6,.18,.2,black);
 box(3.25,.41,5.1,.23,.035,.3,sage,furnishings,.003);cyl(3.45,.47,5.13,.055,.1,ceramic);
 box(1.8,.76,2.3,1.65,.08,.88,oak,furnishings,.12);for(let x of [1.22,2.38])box(x,.37,2.3,.1,.72,.56,oak,furnishings,.025);
 for(let x of [1.27,2.31]){chair(x,1.57,0);chair(x,3.03,Math.PI)}
 cyl(1.8,.84,2.3,.14,.08,ceramic);plant(1.8,2.3,.16).position.y=.84;
 // Entrance storage intentionally low in the cutaway.
 box(1.3,1.05,.38,2.2,2.1,.52,cream,furnishings,.02);for(let x of [.58,1.3,2.02])box(x,1.05,.65,.69,2.02,.025,oak,furnishings,.008);
 cabinet(4.97,.4,2.15,.6);cabinet(5.93,1.55,1.7,.6,-Math.PI/2);
 box(5.05,.915,.4,.66,.018,.42,sinkSteel,furnishings,.04);box(5.05,.925,.4,.52,.009,.29,black,furnishings,.035);line3([5.05,.9,.19],[5.05,1.2,.19],metal);line3([5.05,1.2,.19],[5.05,1.2,.38],metal);
 box(5.93,.916,1.55,.42,.02,.65,black,furnishings,.02);for(let z of [1.38,1.72])cyl(5.93,.934,z,.12,.01,black);
 box(5.93,1.9,1.55,.48,.12,.68,metal,furnishings,.03);box(6.11,2.23,1.55,.2,.54,.3,metal,furnishings,.01);
 box(4.25,1.0,2.28,.65,1.95,.6,material('#babcb3',.38,.4),furnishings,.03);
 vanity(6.7,2.24,.65,Math.PI/2);toilet(6.85,1.52,Math.PI/2);shower(7.15,.65,1.3,.9);
 vanity(12.35,2.2,.65,-Math.PI/2);toilet(11.55,1.52,Math.PI/2);shower(11.9,.65,1.4,.9);
 // Utility cabinet and seating on broad south balcony.
 cabinet(6.19,7.35,.8,.6,-Math.PI/2);box(6.2,.45,7.35,.6,.84,.65,white,furnishings,.025);const drum=cyl(5.88,.45,7.35,.19,.02,black);drum.rotation.z=Math.PI/2;
 plant(.46,7.4,.85);plant(2.25,6.15,.7);
 const lounge=localGroup(3.05,7.35,-Math.PI/2);lounge.userData.asset='armchair';box(0,.29,0,.75,.25,.7,taupe,lounge,.1);box(0,.65,-.28,.75,.6,.15,linen,lounge,.08);for(let x of [-.3,.3])box(x,.45,0,.15,.35,.68,linen,lounge,.06);cyl(4,.28,7.3,.31,.04,oak);cyl(4,.13,7.3,.06,.25,bronze);
 const curtain=fabric('#e8e1cf');curtain.transparent=true;curtain.opacity=.75;curtain.side=THREE.DoubleSide;curtain.clippingPlanes=[clip];
 for(let [x,z]of[[6.9,7.82],[9.25,7.82],[10,7.82],[12.35,7.82]])for(let i=0;i<6;i++){let m=box(x+i*.045,1.45,z+(i%2)*.035,.06,2.55,.04,curtain,furnishings,.01);m.castShadow=false}
 box(9.5,2.18,.12,2.15,.35,.018,curtain,furnishings);
 const dims=[];
 return {architecture,furnishings,annotations,dims,clip,rooms:ROOMS,materials:{wood,stone,glass},setFullWalls(full){clip.constant=full?3:.9;sectionCaps.forEach(c=>c.visible=!full)}};
}
