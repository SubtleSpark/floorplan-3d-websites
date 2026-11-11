import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Coordinates in metres. Origin: leftmost bottom dimension axis / uppermost height axis.
// X: [0,3.1,8.1,11.1,14.6]. Z: [0,2.75,4.25,7.65,13.05].
// Intermediate wall faces, openings and curves are traced estimates, not measured dimensions.
export const METRICS = { width:14.6, depth:13.05, story:3, x:[0,3.1,8.1,11.1,14.6], z:[0,2.75,4.25,7.65,13.05] };
export const ROOMS = [
 {id:'hall',name:'电梯厅',area:9.3,x:3.35,z:1.65,description:'独立电梯厅。位于图纸上方，与玄关相连；9.3 m² 单列，不计入图中 118.1 m² 地毯总面积。'},
 {id:'entry',name:'玄关',area:3.0,x:4.05,z:4.05,description:'电梯厅下方入户，左侧邻公共前室，右侧为厨房，向下通往餐客厅。'},
 {id:'kitchen',name:'厨房',area:6.1,x:6.8,z:3.95,description:'位于餐厅上方。按图保留 L 形操作台，右侧通向生活阳台。'},
 {id:'balcony',name:'生活阳台',area:5.9,x:10.5,z:3.42,description:'位于厨房右侧，横向连接生活功能。右端保留设备平台。'},
 {id:'north-bedroom',name:'卧室',area:9.3,x:11.25,z:5.95,description:'位于生活阳台下方，公卫与主卫之间；标注轴线开间 3.00 m，进深 3.40 m。'},
 {id:'public-bath',name:'公卫',area:4.0,x:8.95,z:6.15,description:'位于厨房下方、上方卧室左侧，通过横向过道进入。'},
 {id:'master-bath',name:'主卫',area:5.3,x:13.7,z:5.95,description:'位于户型右上方，保留右上角圆弧外墙，通过主卧一侧进入。'},
 {id:'living',name:'客餐厅',area:37.8,x:5.45,z:9.5,description:'餐厅在图纸上方，客厅在下方。标注轴线开间 5.00 m；家具位置为便于通行的示意方案。'},
 {id:'corridor',name:'过道',area:3.3,x:9.55,z:8.22,description:'连接客餐厅、两间卧室与公卫。过道宽度和具体门洞按图比例描摹。'},
 {id:'suite-bath',name:'套卫',area:2.8,x:1.05,z:8.65,description:'位于左下套卧的左上角。空间紧凑，洁具布置仅为示意，需结合实测尺寸和门型复核。'},
 {id:'suite',name:'套卧',area:11.0,x:1.55,z:11.3,description:'位于客厅左侧。标注轴线开间 3.10 m，卧室下段进深 3.50 m。'},
 {id:'south-bedroom',name:'卧室',area:11.5,x:9.6,z:11.25,description:'位于客厅与主卧之间。标注轴线开间 3.00 m，门开向上方过道。'},
 {id:'master',name:'主卧',area:17.1,x:12.85,z:11.15,description:'位于右下方，入口段兼衣帽空间，保留右下圆角落地窗。标注轴线开间 3.50 m，整体进深 5.40 m。'}
];

export function createBuilding(scene, textures) {
 const architecture = new THREE.Group(), furnishings = new THREE.Group(), common = new THREE.Group(), annotations=new THREE.Group();
 scene.add(architecture,furnishings,common,annotations); common.visible=false; annotations.visible=false;
 const clip=new THREE.Plane(new THREE.Vector3(0,-1,0),1.15);
 const archMats=[],sectionCaps=[]; const material=(color,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const archMat=(color,r=.8,metal=0)=>{const m=material(color,r,metal);m.clippingPlanes=[clip];m.clipShadows=true;archMats.push(m);return m;};
 const white=material('#f6f1e6',.48),ivory=material('#e2dfcf',.95),bronze=material('#897650',.3,.7),black=material('#333934',.45),metal=material('#aab6ae',.22,.9);
 const wall=archMat('#eeece1'), wallTop=archMat('#e8e6db'),frame=archMat('#786d58',.34,.7),trim=archMat('#c1b69c',.6),doorWood=archMat('#b99c76',.65),tileWall=archMat('#d0d0bd',.55);
 wall.name='wall_plaster';
 const wood=material('#f2e9db',.72);wood.name='floor_wood';wood.map=textures.woodColor;wood.normalMap=textures.woodNormal;wood.normalScale=new THREE.Vector2(.18,.18);wood.roughnessMap=textures.woodRough;wood.userData.planFloor='wood';
 // The wall finish spans two metres; wall geometry receives metre-based UVs below.
 if(textures.wallColor){wall.color.set('#f7f5ef');wall.map=textures.wallColor;wall.normalMap=textures.wallNormal;wall.roughnessMap=textures.wallRough;wall.normalScale=new THREE.Vector2(.12,.12);wall.roughness=.9;for(const t of [wall.map,wall.normalMap,wall.roughnessMap])if(t)t.repeat.set(.5,.5)}
 const oak=wood.clone();oak.name='furniture_wood';oak.color.set('#a78a60');oak.normalScale.set(.18,.18);
 const glass=new THREE.MeshPhysicalMaterial({color:'#cbdde0',metalness:.1,roughness:.07,transparent:true,opacity:.19,depthWrite:false,side:THREE.DoubleSide});glass.clippingPlanes=[clip];archMats.push(glass);
 const ceramic=material('#fbfcf5',.2),sinkSteel=material('#7d8881',.26,.8);

 function surfaceTexture(type) {
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
  if(type==='stone') {ctx.fillStyle='#dad7ca';ctx.fillRect(0,0,512,512);for(let i=0;i<7000;i++){const v=Math.floor(Math.random()*20+205);ctx.fillStyle=`rgba(${v},${v-2},${v-10},.14)`;ctx.fillRect(Math.random()*512,Math.random()*512,Math.random()*3+1,.6)}ctx.strokeStyle='#bcbcae';ctx.lineWidth=1;ctx.strokeRect(0,0,512,512)}
  else if(type==='cloth'){ctx.fillStyle='#e2dece';ctx.fillRect(0,0,512,512);for(let i=0;i<512;i+=3){ctx.strokeStyle=i%2?'#cac5b6':'#ede8da';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,512);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.stroke()}}
  else {ctx.fillStyle='#e2e3d6';ctx.fillRect(0,0,512,512);for(let i=0;i<12000;i++){ctx.fillStyle=`rgba(90,102,81,${Math.random()*.06})`;ctx.fillRect(Math.random()*512,Math.random()*512,1,1)}}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
 }
 const stone=material('#f4f0e7',.72);stone.name='floor_stone';stone.userData.planFloor='stone';
 if(textures.stoneColor){stone.map=textures.stoneColor;stone.normalMap=textures.stoneNormal;stone.roughnessMap=textures.stoneRough;stone.normalScale=new THREE.Vector2(.16,.16);for(const t of [stone.map,stone.normalMap,stone.roughnessMap])if(t)t.repeat.set(1/1.5,1/1.5)}
 else {stone.map=surfaceTexture('stone');stone.map.repeat.set(1/.9,1/.9);stone.bumpMap=stone.map;stone.bumpScale=.006}
 const wetTile=material('#e4e7df',.75);wetTile.name='floor_tile';wetTile.userData.planFloor='tile';
 if(textures.tileColor){wetTile.map=textures.tileColor;wetTile.normalMap=textures.tileNormal;wetTile.roughnessMap=textures.tileRough;wetTile.normalScale=new THREE.Vector2(.14,.14);for(const t of [wetTile.map,wetTile.normalMap,wetTile.roughnessMap])if(t)t.repeat.set(1/3.2,1/3.2)}
 else {wetTile.map=stone.map;wetTile.bumpMap=stone.bumpMap;wetTile.bumpScale=.006}
 const clothBase=surfaceTexture('cloth');clothBase.repeat.set(2,2);
 function fabric(color){const m=material(color,.95);m.map=clothBase;m.bumpMap=clothBase;m.bumpScale=.007;return m}
 const linen=fabric('#f8f3e4'),taupe=fabric('#b8ad91'),sage=fabric('#788973'),cream=fabric('#dedbca'),carpet=fabric('#d7cdb6');
 const marble=material('#ebe7db',.3);marble.map=surfaceTexture('plaster');marble.bumpMap=marble.map;marble.bumpScale=.004;
 const leaf=material('#536c39',.88);leaf.side=THREE.DoubleSide;
 const mesh=(geo,mat,parent=architecture)=>{const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
 function box(x,y,z,w,h,d,mat,parent=architecture,r=0){let g=r?new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/3,h/3,d/3)):new THREE.BoxGeometry(w,h,d);
  if(mat===wall&&textures.wallColor){const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){let u,v;if(Math.abs(n.getY(i))>.7){u=p.getX(i)+w/2;v=p.getZ(i)+d/2}else{u=Math.abs(n.getX(i))>.7?p.getZ(i)+d/2:p.getX(i)+w/2;v=p.getY(i)+h/2}uv.setXY(i,u,v)}uv.needsUpdate=true}
  const m=mesh(g,mat,parent);m.position.set(x,y,z);return m}
 function cyl(x,y,z,r,h,mat,parent=furnishings,rt=r){const m=mesh(new THREE.CylinderGeometry(rt,r,h,40),mat,parent);m.position.set(x,y,z);return m}
 function sphere(x,y,z,sx,sy,sz,mat,parent=furnishings){const m=mesh(new THREE.SphereGeometry(1,16,10),mat,parent);m.scale.set(sx,sy,sz);m.position.set(x,y,z);return m}
 function line3(a,b,mat,parent=furnishings,r=.012){const v=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),m=mesh(new THREE.CylinderGeometry(r,r,v.length(),8),mat,parent);m.position.copy(new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m}
 function poly(points,mat,y=0,depth=.08,parent=architecture){const s=new THREE.Shape();points.forEach((p,i)=>i?s.lineTo(p[0],-p[1]):s.moveTo(p[0],-p[1]));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false});g.rotateX(-Math.PI/2);const m=mesh(g,mat,parent);m.position.y=y-depth;return m}
 function floorRect(x1,z1,x2,z2,mat){return poly([[x1,z1],[x2,z1],[x2,z2],[x1,z2]],mat,.015,.06)}
 function arcPoints(cx,cz,r,start,end,n=16){return Array.from({length:n+1},(_,i)=>{let a=start+(end-start)*i/n;return[cx+Math.cos(a)*r,cz+Math.sin(a)*r]})}
 // Continuous slab, including the original stepped perimeter and the two east rounded corners.
 const perimeter=[[0,7.85],[3.1,7.85],[3.1,3.35],[1.65,3.35],[1.65,.3],[5.15,.3],[5.15,2.75],[13.6,2.75],[13.6,4.25],...arcPoints(13.8,5.05,.8,-Math.PI/2,0),[14.6,12.25],...arcPoints(13.8,12.25,.8,0,Math.PI/2),[0,13.05]];
 poly(perimeter,material('#a5ab9e',.68),-.09,.24);
 poly(perimeter,stone,.0,.1);
 floorRect(.12,9.55,3.0,12.94,wood);floorRect(8.2,9.0,11.0,12.94,wood);floorRect(9.9,4.35,12.7,7.54,wood);
 poly([[11.2,7.76],[14.48,7.76],[14.48,12.25],...arcPoints(13.8,12.25,.68,0,Math.PI/2),[11.2,12.93]],wood,.02,.035);
 floorRect(.1,7.96,1.98,9.44,wetTile);floorRect(8.2,5.05,9.7,7.54,wetTile);poly([[12.9,4.35],[13.8,4.35],...arcPoints(13.8,5.05,.7,-Math.PI/2,0),[14.5,7.55],[12.9,7.55]],wetTile,.022,.04);
 floorRect(8.55,2.85,12.7,4.14,wetTile);floorRect(12.9,2.86,13.5,4.14,wetTile);
 // Floors have metre-based UV coordinates; the CC0 wood scan spans 1.7 metres.
 for(const t of [textures.woodColor,textures.woodNormal,textures.woodRough])if(t)t.repeat.set(1/1.9,1/1.9);

 function wallSeg(x1,z1,x2,z2,height=3,thickness=.18,mat=wall,parent=architecture,bottom=0){const len=Math.hypot(x2-x1,z2-z1),m=box((x1+x2)/2,bottom+height/2,(z1+z2)/2,len,height,thickness,mat,parent);m.rotation.y=-Math.atan2(z2-z1,x2-x1);if(bottom<1.15&&bottom+height>1.15){const cap=box((x1+x2)/2,1.151,(z1+z2)/2,len,.006,thickness,white,parent);cap.rotation.y=m.rotation.y;sectionCaps.push(cap)}return m}
 function baseboard(x1,z1,x2,z2,parent=architecture){wallSeg(x1,z1,x2,z2,.075,.21,trim,parent)}
 function solid(x1,z1,x2,z2,t=.18,mat=wall,parent=architecture){wallSeg(x1,z1,x2,z2,3,t,mat,parent);baseboard(x1,z1,x2,z2,parent)}
 function doorway(x1,z1,x2,z2,flip=false){
  const len=Math.hypot(x2-x1,z2-z1),ang=-Math.atan2(z2-z1,x2-x1);
  wallSeg(x1,z1,x2,z2,.82,.18,wall,architecture,2.18);
  const g=new THREE.Group();g.position.set(x1,0,z1);g.rotation.y=ang;architecture.add(g);
  box(.025,1.08,0,.05,2.16,.22,doorWood,g);box(len-.025,1.08,0,.05,2.16,.22,doorWood,g);box(len/2,2.15,0,len,.065,.22,doorWood,g);
  const pivot=new THREE.Group();pivot.position.x=.045;g.add(pivot);pivot.rotation.y=flip?-Math.PI*.38:Math.PI*.38;
  box((len-.09)/2,1.055,0,len-.09,2.11,.045,doorWood,pivot,.012);box(len-.22,1.0,.055,.13,.018,.025,bronze,pivot,.006);
 }
 function glazing(x1,z1,x2,z2,sill=.26,top=2.65,parent=architecture){
  // User's facade photograph confirms full-height glass throughout, with no bay-window sill.
  sill=.04; top=2.72;
  const len=Math.hypot(x2-x1,z2-z1),ang=-Math.atan2(z2-z1,x2-x1),g=new THREE.Group();g.position.set(x1,0,z1);g.rotation.y=ang;parent.add(g);
  if(sill>0)box(len/2,sill/2,0,len,sill,.15,wall,g);
  box(len/2,sill+(top-sill)/2,0,len,top-sill,.018,glass,g);
  for(let i=0;i<=Math.ceil(len/1.25);i++)box(i*len/Math.ceil(len/1.25),(sill+top)/2,0,.038,top-sill,.065,frame,g);
  box(len/2,sill,0,len,.045,.07,frame,g);box(len/2,top,0,len,.045,.07,frame,g);
  box(len/2,(top+3)/2,0,len,3-top,.16,wall,g);
 }
 function curvedGlass(points,sill=.26){
  const vertices=[],indices=[];points.forEach((p,i)=>{vertices.push(p[0],.04,p[1],p[0],2.72,p[1]);if(i<points.length-1){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2)}});
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(geo,glass);
  for(const y of [.04,2.72]){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],y,p[1])));mesh(new THREE.TubeGeometry(path,32,.025,6,false),frame)}
  for(let i=1;i<points.length;i++)wallSeg(...points[i-1],...points[i],.28,.15,wall,architecture,2.72);
 }
 // Main envelope. Geometry is never stretched to fit a target area.
 glazing(1.65,.3,5.15,.3,.95);solid(1.65,.3,1.65,.92,.22);solid(1.65,2.65,1.65,3.35,.22);wallSeg(1.65,.92,1.65,2.65,2.16,.05,metal);wallSeg(1.65,.92,1.65,2.65,.84,.22,wall,architecture,2.16);
 solid(5.15,.3,5.15,2.75,.24);solid(1.65,3.35,3.45,3.35,.24);doorway(3.45,3.35,4.5,3.35,false);solid(4.5,3.35,5.15,3.35,.24);
 solid(3.1,3.35,3.1,7.85,.24);solid(0,7.85,3.1,7.85,.22);
 solid(0,7.85,0,8.9,.24);glazing(0,8.9,0,12.8,.75);solid(0,12.8,0,13.05,.24);
 glazing(.15,13.05,2.85,13.05,.25);solid(2.85,13.05,3.1,13.05,.26);glazing(3.1,13.05,8.1,13.05,.08);glazing(8.1,13.05,10.85,13.05,.25);solid(10.85,13.05,11.45,13.05,.25);glazing(11.45,13.05,13.8,13.05,.08);
 curvedGlass(arcPoints(13.8,12.25,.8,Math.PI/2,0,10),.08);glazing(14.6,12.25,14.6,9.85,.08);solid(14.6,9.85,14.6,7.65,.2);
 solid(14.6,7.65,14.6,6.45,.2);glazing(14.6,6.45,14.6,5.05,.95);curvedGlass(arcPoints(13.8,5.05,.8,0,-Math.PI/2,10),.95);solid(13.8,4.25,13.6,4.25,.18);
 solid(13.6,4.25,13.6,2.75,.18);solid(12.8,2.75,13.6,2.75,.16);glazing(8.45,2.75,12.8,2.75,.85);glazing(5.15,2.75,8.45,2.75,1.0);
 // Inner partitions and opening positions traced from the clearer second plan.
 solid(5.15,2.75,5.15,4.95,.15);solid(8.45,2.75,8.45,3.03,.15);glazing(8.45,3.03,8.45,4.25,.03);solid(8.45,4.25,8.45,4.95,.15);
 solid(8.45,4.25,9.8,4.25,.16);solid(9.8,4.25,10.08,4.25,.16);glazing(10.08,4.25,12.55,4.25,.04);solid(12.55,4.25,12.8,4.25,.16);solid(12.8,2.75,12.8,4.25,.16);solid(12.8,4.25,12.8,7.65,.18);
 solid(8.1,4.95,9.8,4.95,.18);solid(8.1,4.95,8.1,7.65,.22);solid(9.8,4.25,9.8,7.65,.18);
 solid(8.1,7.65,8.85,7.65,.18);doorway(8.85,7.65,9.65,7.65,false);solid(9.65,7.65,9.8,7.65,.18);
 doorway(9.8,7.65,10.7,7.65,false);solid(10.7,7.65,12.8,7.65,.18);
 solid(12.8,7.65,13.65,7.65,.18);doorway(13.65,7.65,14.45,7.65,false);solid(14.45,7.65,14.6,7.65,.18);
 solid(8.1,8.9,8.28,8.9,.18);doorway(8.28,8.9,9.18,8.9,true);solid(9.18,8.9,11.1,8.9,.18);
 solid(8.1,8.9,8.1,13.05,.16);solid(11.1,8.67,11.1,13.05,.17);doorway(11.1,7.76,11.1,8.67,false);solid(11.1,7.65,11.1,7.76,.17);
 solid(3.1,8.95,3.1,13.05,.18);doorway(3.1,7.85,3.1,8.95,true);
 solid(0,9.55,2.0,9.55,.13);solid(2.0,7.85,2.0,8.48,.13);doorway(2.0,8.48,2.0,9.4,true);solid(2.0,9.4,2.0,9.55,.13);
 // Heavy structural piers shown in the reference.
 box(3.0,1.5,12.93,.42,3,.26,wall);box(9.68,1.5,4.58,.36,3,.7,wall);box(8.14,1.5,5.1,.3,3,.36,wall);
 // South sliding window rails at true floor level.
 for(let x of [3.1,8.1])box(x, .035,13.02,.035,.07,.12,frame);

 function localGroup(x,z,angle=0,parent=furnishings){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;parent.add(g);return g}
 // Fine details do not need their own shadow maps; this keeps the furnished view responsive.
 function detailBox(x,y,z,w,h,d,mat,parent,r=0){const m=box(x,y,z,w,h,d,mat,parent,r);m.castShadow=false;return m}
 function bed(x,z,width=1.55,angle=0,cover=sage){
  const g=localGroup(x,z,angle), bedModel=new THREE.Group();g.userData.bed={width};bedModel.userData.bedFallback=true;g.add(bedModel);box(0,.19,0,width+.1,.3,2.13,oak,bedModel,.04);box(0,.43,0,width,.22,2.05,linen,bedModel,.085);
  box(0,.59,.13,width+.015,.16,1.72,linen,bedModel,.075);box(0,.695,.59,width+.035,.07,.85,cover,bedModel,.035);box(0,.53,.995,width+.035,.25,.08,cover,bedModel,.035);
  box(0,.69,-1.08,width+.2,1.22,.12,cream,bedModel,.06);box(0,.065,0,width-.15,.12,1.8,black,bedModel);
  // A softly folded duvet edge and inset headboard panel add detail without changing the bed's footprint.
  detailBox(0,.735,.18,width-.04,.025,.12,cream,bedModel,.012);
  detailBox(0,.72,-1.012,width-.08,.91,.012,linen,bedModel,.025);
  for(const side of [-1,1]){const p=box(side*width*.245,.67,-.66,width*.41,.19,.42,linen,bedModel,.09);p.rotation.y=side*.07;const pp=box(side*width*.245,.6,-.85,width*.42,.17,.43,taupe,bedModel,.07);pp.rotation.x=-.16}
  return g;
 }
 // Beds face into their rooms, with headboards against solid walls and a clear route from each door.
 bed(1.935,11.65,1.35,-Math.PI/2,taupe);bed(10.2,10.065,1.35,0,sage);bed(11.635,5.4,1.35,-Math.PI/2,taupe);bed(12.26,11.55,1.8,Math.PI/2,sage);
 function wardrobe(x,z,w,d,angle=0){const g=localGroup(x,z,angle);g.userData.wardrobe={width:w,depth:d};box(0,1.18,0,w,2.36,d,oak,g,.02);for(let i=0;i<Math.round(w/.5);i++){const span=w/Math.round(w/.5);box(-w/2+span*(i+.5),1.2,d/2+.01,span-.012,2.28,.025,cream,g,.009);box(-w/2+span*(i+.5)+span/2-.06,1.15,d/2+.04,.012,.35,.02,bronze,g,.005)}}
 // Shallow closets face clear approaches rather than door swings or the foot of a bed.
 wardrobe(1.05,9.865,1.7,.5);wardrobe(8.45,11.75,1.6,.5,Math.PI/2);wardrobe(11.75,7.30,1.8,.5,Math.PI);wardrobe(11.455,9.8,1.2,.54,Math.PI/2);wardrobe(12.65,8.02,1.4,.56);
 // Living room, matching the plan: television west, sofa east, chaise toward south.
 box(5.55,.04,11.0,3.8,.045,3.25,carpet,furnishings,.06);
 const sofa=localGroup(7.02,10.9);sofa.userData.asset="sofa";box(0,.24,0,.91,.36,2.5,taupe,sofa,.11);box(.36,.62,0,.22,.68,2.6,cream,sofa,.09);
 for(let k=-1;k<=1;k++){box(-.03,.48,k*.78,.8,.2,.73,linen,sofa,.08);box(.24,.74,k*.78,.23,.55,.69,linen,sofa,.07)}
 box(-.44,.29,1.05,1.72,.43,.83,linen,sofa,.1);box(-.78,.52,1.05,1.05,.16,.78,linen,sofa,.06);box(0,.6,-1.27,.92,.43,.2,linen,sofa,.07);
 for(let k of [-.73,.5]){const p=box(-.08,.72,k,.36,.35,.17,k<0?sage:taupe,sofa,.07);p.rotation.z=.25;p.rotation.y=Math.PI/2}
 // A low shadow gap, subtle cushion piping and slim recessed legs ground the sofa.
 for(let z of [-.78,0,.78])detailBox(-.43,.49,z,.012,.025,.66,cream,sofa,.004);
 for(let x of [-.30,.30])for(let z of [-1.08,1.08])detailBox(x,.055,z,.045,.11,.045,oak,sofa,.008);
 const coffee=localGroup(5.1,10.8);coffee.userData.asset="coffee-table";cyl(0,.357,0,.62,.065,marble,coffee);cyl(0,.178,0,.29,.356,oak,coffee);cyl(.55,.18,.4,.4,.045,oak,coffee);cyl(.55,.09,.4,.18,.16,black,coffee);
 box(3.46,.26,10.95,.44,.42,2.55,oak,furnishings,.025);box(3.47,1.11,10.94,.075,.92,1.61,black,furnishings,.02);box(3.513,1.11,10.94,.01,.86,1.53,material('#172323',.16),furnishings,.005);
 box(3.35,1.01,10.95,.07,1.9,2.9,cream,furnishings,.015);
 function book(x,y,z,w=.23,d=.29,color='#77775d',angle=0){let b=box(x,y,z,w,.04,d,material(color,.9),furnishings,.005);b.rotation.y=angle;return b}
 book(5.04,.41,10.74);book(5.07,.455,10.72,.22,.28,'#c6b58e',.1);cyl(5.34,.45,10.91,.07,.12,ceramic);
 // Dining table and six upholstered chairs.
 box(5.63,.76,6.6,1.95,.08,.94,oak,furnishings,.09);for(let x of [5.0,6.26])box(x,.37,6.6,.1,.73,.6,oak,furnishings,.025);
 function chair(x,z,angle,asset=false){const g=localGroup(x,z,angle);if(asset)g.userData.asset="dining-chair";box(0,.46,0,.45,.1,.44,cream,g,.07);box(0,.68,-.2,.47,.42,.09,cream,g,.06);detailBox(0,.69,-.148,.36,.29,.012,linen,g,.025);for(let a of [-.16,.16])for(let b of [-.15,.15])line3([a,.43,b],[a*1.2,.04,b*1.2],oak,g,.023)}
 for(let x of [5.05,6.21]){chair(x,5.82,0,true);chair(x,7.38,Math.PI,true)}
 cyl(5.7,.82,6.58,.16,.035,ceramic);for(let i=0;i<4;i++)sphere(5.63+i*.05,.87,6.59,.045,.045,.045,material(i%2?'#a6ac60':'#b6944c',.7));
 // Cabinetry: individual doors, worktops, handles, a hob, sink and faucet.
 function cabinet(x,z,w,d,angle=0){const g=localGroup(x,z,angle);box(0,.43,0,w,.82,d,oak,g,.012);box(0,.875,0,w+.035,.065,d+.04,marble,g,.012);detailBox(0,.075,d/2+.018,w-.04,.10,.018,black,g,.004);const count=Math.ceil(w/.6);for(let i=0;i<count;i++){let a=-w/2+w/count*(i+.5);box(a,.46,d/2+.008,w/count-.012,.72,.025,cream,g,.005);detailBox(a,.73,d/2+.03,w/count*.5,.012,.02,bronze,g)}return g}
 cabinet(6.83,3.13,3.0,.57);cabinet(5.54,4.06,1.25,.6,Math.PI/2);
 box(6.8,.915,3.14,.66,.018,.4,sinkSteel,furnishings,.05);box(6.8,.92,3.14,.53,.012,.31,material('#414d45',.3,.6),furnishings,.04);
 const faucet=new THREE.CatmullRomCurve3([new THREE.Vector3(6.79,.93,2.95),new THREE.Vector3(6.79,1.25,2.95),new THREE.Vector3(6.79,1.28,3.11),new THREE.Vector3(6.79,1.14,3.17)]);mesh(new THREE.TubeGeometry(faucet,16,.013,8,false),metal,furnishings);
 box(5.54,.916,4.2,.43,.015,.63,black,furnishings,.015);for(let z of [4.04,4.37])cyl(5.54,.93,z,.12,.012,black);
 box(5.45,1.85,4.18,.48,.15,.65,metal,furnishings,.025);box(5.32,2.25,4.18,.25,.65,.28,metal,furnishings,.02);
 box(7.95,1.0,4.48,.65,1.96,.65,material('#a8afa4',.38,.45),furnishings,.035);box(7.94,1.3,4.82,.012,.65,.025,black,furnishings);
 box(7.78,.48,6.32,.45,.91,2.1,oak,furnishings,.02);box(7.78,.955,6.32,.47,.04,2.15,marble,furnishings,.01);
 // Shoes / entry console against the common corridor wall.
 box(3.45,1.12,4.65,.5,2.23,1.9,cream,furnishings,.02);box(3.73,.42,4.65,.055,.045,1.25,oak,furnishings,.015);
 // Bathrooms. Fixtures use white ceramic with metal fittings.
 function toilet(x,z,angle=0){const g=localGroup(x,z,angle);sphere(0,.2,0,.19,.22,.27,ceramic,g);sphere(0,.41,.055,.23,.08,.32,ceramic,g);sphere(0,.46,.07,.17,.012,.25,material('#c0c9c0',.23),g);box(0,.55,-.27,.39,.48,.17,ceramic,g,.05);box(0,.79,-.27,.4,.03,.18,ceramic,g,.02);cyl(0,.81,-.27,.025,.008,metal,g)}
 function vanity(x,z,w,angle=0){const g=localGroup(x,z,angle);box(0,.52,0,w,.52,.45,oak,g,.025);detailBox(0,.54,.23,w-.05,.012,.012,bronze,g,.003);detailBox(0,.62,.235,w*.35,.012,.012,bronze,g,.003);box(0,.8,0,w+.04,.07,.49,marble,g,.02);sphere(0,.85,0,w*.31,.04,.17,ceramic,g);sphere(0,.88,0,w*.25,.015,.12,material('#b6bfb1',.2),g);cyl(0,.897,.03,.018,.004,metal,g);line3([0,.84,-.16],[0,1.0,-.16],metal,g,.012);line3([0,1,-.16],[0,1,-.05],metal,g,.012);box(0,1.45,-.24,w*.85,.85,.025,material('#9baca2',.12,.9),g,.04)}
 function shower(x,z,w,d,angle=0){const g=localGroup(x,z,angle);box(0,.055,0,w,.08,d,ceramic,g,.015);box(0,1.04,d/2,w,2,.012,glass,g);box(w/2,1.04,0,.012,2,d,glass,g);line3([0,.9,-d/2+.1],[0,2.1,-d/2+.1],metal,g,.015);line3([0,2.1,-d/2+.1],[0,2.1,-d/2+.35],metal,g,.015);cyl(0,2.08,-d/2+.35,.09,.02,metal,g)}
 // Compact illustrative layouts keep fixtures outside the modeled door swings.
 shower(.46,8.335,.66,.75,Math.PI);toilet(1.12,8.31,0);vanity(.94,9.24,.40,Math.PI);
 shower(8.96,5.43,1.40,.75,Math.PI);vanity(8.455,6.07,.48,Math.PI/2);toilet(8.55,6.56,Math.PI/2);
 shower(13.38,4.78,.90,.85,Math.PI);vanity(13.135,5.65,.56,Math.PI/2);toilet(13.24,6.20,Math.PI/2);
 // Utility balcony and equipment bay.
 cabinet(12.33,3.55,.65,.7,-Math.PI/2);box(12.35,.43,3.55,.64,.83,.65,white,furnishings,.03);const drum=cyl(12.0,.45,3.55,.2,.025,black);drum.rotation.z=Math.PI/2;const rim=cyl(11.98,.45,3.55,.145,.03,metal);rim.rotation.z=Math.PI/2;
 box(13.2,.43,3.5,.5,.75,.75,metal,furnishings,.025);for(let z=3.2;z<3.85;z+=.09)box(12.94,.44,z,.018,.55,.025,black,furnishings);
 for(let x of [9,9.65,10.3])box(x,2.5,3.45,.018,.025,.85,metal,furnishings);
 // Curtains, intentionally fine and semi-transparent along the south glazing.
 const curtain=fabric('#e8e1cf');curtain.transparent=true;curtain.opacity=.69;curtain.side=THREE.DoubleSide;curtain.clippingPlanes=[clip];archMats.push(curtain);
 for(const [x,w]of[[.35,.4],[2.68,.4],[3.42,.45],[7.78,.4],[8.4,.4],[10.76,.4],[11.5,.4],[13.63,.34]])for(let i=0;i<7;i++){const p=box(x-w/2+i*w/6,1.37,12.82+(i%2)*.04,w/5,2.5,.035,curtain,furnishings,.008);p.castShadow=false}
 function plant(x,z,size=1){const g=localGroup(x,z);cyl(0,.22*size,0,.2*size,.44*size,material('#c7bca2',.92),g,.16*size);cyl(0,.45*size,0,.16*size,.01,material('#4a4636',1),g);for(let i=0;i<13;i++){let a=i*2.4,h=(.55+i*.065)*size,r=(.2+Math.sin(i)*.08)*size;const end=[Math.cos(a)*r,h,Math.sin(a)*r];line3([0,.4*size,0],end,leaf,g,.008*size);const m=sphere(end[0],h+.1*size,end[2],.115*size,.26*size,.027*size,leaf,g);m.rotation.set(.4*Math.cos(a),a,.5*Math.sin(a))}return g}
 plant(7.67,12.5,1.1);plant(10.65,3.25,.65);plant(4.7,1.1,.8);
 // Small furnishings: woven stool, desk, bedside lights, art, towels.
 // Keep bed and wardrobe approaches clear rather than placing desks, lamps or stools in the circulation paths.
 for(let i=0;i<3;i++)box(7.75,1.01+i*.045,6.75,.2,.04,.3,linen,furnishings,.01);
 // Common circulation matches the first plan and is independently switchable.
 poly([[-4.35,3.35],[1.65,3.35],[3.1,3.35],[3.1,7.85],[-4.35,7.85]],material('#d6d9d1',.85),-.01,.22,common);
 poly([[-2.95,.3],[1.65,.3],[1.65,3.35],[-2.95,3.35]],material('#b9c1b8',.8),-.01,.22,common);
 poly([[-6.45,.3],[-2.95,.3],[-2.95,3.35],[-6.45,3.35]],stone,-.01,.22,common);
 for(let a of [[-6.45,.3,-2.95,.3],[-6.45,.3,-6.45,3.35],[-4.35,3.35,-4.35,7.85],[-4.35,7.85,3.1,7.85],[-2.95,.3,1.65,.3],[-2.95,.3,-2.95,2.65],[-.65,.3,-.65,2.35],[-2.95,2.35,1.65,2.35]])solid(...a,.19,wall,common);
 for(let i=0;i<2;i++){const x=-1.8+i*2.3;box(x,.02,1.32,1.9,.04,1.8,material('#aeb7ac',.75),common);box(x,1.1,2.33,1.65,2.15,.04,metal,common);box(x,1.1,2.35,.014,2.15,.01,black,common)}
 for(let i=0;i<14;i++){box(-3.0+i*.33,(.12+i*.08)/2,5.8,.33,.12+i*.08,1.12,material('#c1c7bb',.78),common);box(1.45-i*.33,(.12+i*.08)/2,7.05,.33,.12+i*.08,1.12,material('#c1c7bb',.78),common)}
 for(let z of [5.18,6.42,7.68]){for(let i=0;i<9;i++)line3([-3+i*.55,0,z],[-3+i*.55,1.0,z],metal,common,.012);line3([-3,1,z],[1.5,1,z],metal,common,.02)}
 const outlines=new THREE.Group();architecture.add(outlines);
 // Dimension lines are true metre geometry; screen labels are attached by the viewer.
 const dims=[];const dimMat=new THREE.LineBasicMaterial({color:'#5d7c67',transparent:true,opacity:.75,depthTest:false});
 function dimension(a,b,label,offset){const va=new THREE.Vector3(a[0],.07,a[1]),vb=new THREE.Vector3(b[0],.07,b[1]);const geo=new THREE.BufferGeometry().setFromPoints([va,vb]);annotations.add(new THREE.Line(geo,dimMat));const dx=(b[0]-a[0]),dz=(b[1]-a[1]),len=Math.hypot(dx,dz);for(let p of [a,b]){const m=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(p[0]-.12*dz/len,.07,p[1]+.12*dx/len),new THREE.Vector3(p[0]+.12*dz/len,.07,p[1]-.12*dx/len)]),dimMat);annotations.add(m)}dims.push({label,x:(a[0]+b[0])/2,z:(a[1]+b[1])/2,y:.1})}
 for(let i=1;i<METRICS.x.length;i++)dimension([METRICS.x[i-1],13.8],[METRICS.x[i],13.8],`${((METRICS.x[i]-METRICS.x[i-1])*1000).toFixed(0)}`);
 dimension([0,14.65],[14.6,14.65],'14600 mm');
 for(let i=1;i<METRICS.z.length;i++)dimension([15.4,METRICS.z[i-1]],[15.4,METRICS.z[i]],`${((METRICS.z[i]-METRICS.z[i-1])*1000).toFixed(0)}`);
 dimension([16.3,0],[16.3,13.05],'13050 mm');
 return {architecture,furnishings,common,annotations,dims,clip,rooms:ROOMS,setFullWalls(full){clip.constant=full?3.2:1.15;sectionCaps.forEach(c=>c.visible=!full)},materials:{wood,stone,glass},perimeter};
}
