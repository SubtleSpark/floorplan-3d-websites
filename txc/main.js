import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createBuilding, METRICS } from './building.js';
import { initPlan } from './plan.js';
import { LIVING_VIEWPOINT, initLivingPanorama } from './viewpoint.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const panorama=initLivingPanorama();
const assetURL=name=>window.HOME_ASSETS?.[name]||'assets/'+name;
const icons={sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',cloud:'<path d="M6 18a4 4 0 0 1-.8-7.9 6 6 0 0 1 11.5-1.4A4.7 4.7 0 0 1 18 18H6Z"/>',rain:'<path d="M6 14a4 4 0 0 1-.8-7.1 5 5 0 0 1 9.6-1.2A4 4 0 0 1 18 14M7 17l-1 3m6-3-1 3m6-3-1 3"/>',plan:'<path d="M3 3h18v18H3zM3 10h7V3m0 7v6m0 5v-2m0-6h11M16 3v5"/>',reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',plus:'<path d="M5 12h14M12 5v14"/>',minus:'<path d="M5 12h14"/>',rotate:'<path d="M4 9c-1 1-2 2-2 3 0 3 4.5 5 10 5s10-2 10-5c0-1-1-2-2-3M12 6v6m-4-2 4 3 4-3M6 21l-4-4 4-4"/>',expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5"/>',mouse:'<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 6v4"/>',sliders:'<path d="M4 6h6m4 0h6M4 12h10m4 0h2M4 18h3m4 0h9"/><circle cx="12" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>'};
$$('[data-icon]').forEach(el=>el.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[el.dataset.icon]||''}</svg>`);
const modal=$('#reference-modal');function showReference(){modal.showModal()}$('#reference').onclick=showReference;$('#accuracy-link').onclick=showReference;$('#close-reference').onclick=()=>modal.close();modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close()}});
$$('[data-plan]').forEach(b=>b.onclick=()=>{$$('[data-plan]').forEach(x=>x.classList.toggle('active',x===b));const f=b.dataset.plan;$('#plan-image').src=assetURL(f==='facade'?'facade-reference.png':`plan-${f}.jpg`);$('#plan-image').alt=f==='facade'?'用户补充的落地玻璃与圆弧转角实拍':'用户提供的户型图'});
$('#mobile-settings').onclick=()=>$('.weather-panel').classList.toggle('open');
let toastTimeout;function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('show'),2600)}

function togglePlanUI(show,unavailable=false){
 document.body.classList.toggle('plan-mode',show);$('#flat-plan').hidden=!show;
 $$('button[data-weather]').forEach(b=>{b.disabled=show;b.title=show?'天气效果仅在 3D 视图中显示':''});
 $('#walls').disabled=show;$('#rotate').disabled=show;
 $('#weather-note').textContent=show?(unavailable?'当前设备 3D 受限 · 二维可操作':'二维平面 · 天气仅在 3D 显示'):$('#weather-note').textContent;
 $('.interaction-hint').lastElementChild.innerHTML=show?'拖动平移 <b>·</b> 滚轮或双指缩放':'拖动旋转 <b>·</b> 滚轮缩放 <b>·</b> 右键平移';
 $('#orientation-arrow').style.transform=show?'rotate(0deg)':'';
}
function showFlatFallback(){
 let selected=null;const plan=initPlan($('#flat-plan'),{onViewpoint:trigger=>panorama.open(trigger),onRoom:r=>{if(!r)return;selected=r;$('#room-name').textContent=r.name;$('#room-area').textContent=r.area.toFixed(1);$('#room-description').textContent=r.description;$('#room-card').hidden=false}});
 togglePlanUI(true,true);document.body.dataset.renderMode='2d-fallback';
 $$('button[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view==='top');b.setAttribute('aria-pressed',String(b.dataset.view==='top'));b.onclick=()=>{if(b.dataset.view==='top')plan.reset();else toast('此浏览器无法启动 WebGL 2，二维平面仍可查看')}});
 $('#loading').classList.add('hidden');$('#reset').onclick=()=>{plan.reset();$('#room-card').hidden=true};$('.brand').onclick=e=>{e.preventDefault();$('#reset').click()};
 $('#zoom-in').onclick=()=>plan.zoom(1.2);$('#zoom-out').onclick=()=>plan.zoom(1/1.2);
 $('#furniture').onchange=e=>plan.setFurniture(e.target.checked);$('#room-labels').onchange=e=>plan.setLabels(e.target.checked);$('#dimensions').onchange=e=>plan.setDimensions(e.target.checked);$('#common').onchange=e=>plan.setCommon(e.target.checked);
 $('#close-room').onclick=()=>{$('#room-card').hidden=true;selected=null};$('#focus-room').disabled=true;$('#focus-room').title='靠近查看需要 3D 支持';
 $('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{toast('当前浏览器不支持全屏')}};
 window.addEventListener('keydown',e=>{if(!modal.open&&!panorama.isOpen()&&e.target.tagName!=='INPUT'&&e.key.toLowerCase()==='r')$('#reset').click()});
 toast('当前设备无法启动 3D，已切换可操作的二维平面');
}
async function start(){
 const canvas=$('#scene'),scene=new THREE.Scene();
 const context=canvas.getContext('webgl2',{antialias:true,powerPreference:'high-performance',alpha:false});if(!context){showFlatFallback();return}
 const renderer=new THREE.WebGLRenderer({canvas,context,antialias:true,powerPreference:'high-performance',alpha:false});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.07;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.localClippingEnabled=true;
 scene.background=new THREE.Color('#e2e7dd');scene.fog=new THREE.Fog('#e2e7dd',48,115);
 const perspective=new THREE.PerspectiveCamera(36,innerWidth/innerHeight,.1,200),ortho=new THREE.OrthographicCamera(-12,12,12,-12,.1,200);let camera=perspective;
 const center=new THREE.Vector3(7.3,.35,7.0);const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=4;controls.maxDistance=65;controls.minPolarAngle=.03;controls.maxPolarAngle=Math.PI*.485;controls.autoRotateSpeed=.55;controls.target.copy(center);controls.screenSpacePanning=true;
 const renderPass=new RenderPass(scene,camera),composer=new EffectComposer(renderer);composer.addPass(renderPass);
 const ao=new SSAOPass(scene,camera,innerWidth,innerHeight,12);ao.kernelRadius=.32;ao.minDistance=.001;ao.maxDistance=.18;ao.enabled=innerWidth>700;composer.addPass(ao);composer.addPass(new OutputPass());
 const hemi=new THREE.HemisphereLight('#dce9f8','#b8aa8b',1.35);scene.add(hemi);
 const sun=new THREE.DirectionalLight('#fff0d5',3.1);sun.position.set(-7,19,19);sun.target.position.set(7,0,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:.5,far:70});sun.shadow.normalBias=.027;sun.shadow.bias=-.0002;sun.shadow.radius=3;scene.add(sun,sun.target);
 const fill=new THREE.DirectionalLight('#e3eaf8',.45);fill.position.set(12,10,-5);scene.add(fill);
 const groundMat=new THREE.MeshStandardMaterial({color:'#c9d0c2',roughness:.94,metalness:0});
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(500,500),groundMat);ground.rotation.x=-Math.PI/2;ground.position.set(7,-.36,7);ground.receiveShadow=true;scene.add(ground);
 const manager=new THREE.LoadingManager();let failed=[];manager.onError=url=>failed.push(url);
 const textureLoader=new THREE.TextureLoader(manager);
 const tex=async file=>{const t=await textureLoader.loadAsync(assetURL(file));t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t};
 const gl=new GLTFLoader(manager);
 const loaded=await Promise.allSettled([tex('bedroom_oak_color.jpg'),tex('bedroom_oak_normal.jpg'),tex('bedroom_oak_rough.jpg'),new RGBELoader(manager).loadAsync(assetURL('sky.hdr')),gl.loadAsync(assetURL('mirror-wardrobe.glb')),gl.loadAsync(assetURL('dining_chair_02.glb')),gl.loadAsync(assetURL('modern_coffee_table_01.glb')),gl.loadAsync(assetURL('grey-sectional-sofa.glb')),gl.loadAsync(assetURL('modern-bed.glb')),tex('wall_stucco_color.jpg'),tex('wall_stucco_normal.jpg'),tex('wall_stucco_rough.jpg'),tex('stone_marble_color.jpg'),tex('stone_marble_normal.jpg'),tex('stone_marble_rough.jpg'),tex('wet_ceramic_color.jpg'),tex('wet_ceramic_normal.jpg'),tex('wet_ceramic_rough.jpg')]);
 const get=i=>loaded[i].status==='fulfilled'?loaded[i].value:null;
 const textures={woodColor:get(0),woodNormal:get(1),woodRough:get(2),wallColor:get(9),wallNormal:get(10),wallRough:get(11),stoneColor:get(12),stoneNormal:get(13),stoneRough:get(14),tileColor:get(15),tileNormal:get(16),tileRough:get(17)};
 // Texture failure keeps the geometry interactive instead of leaving a loading screen.
 for(const key of ['woodColor','woodNormal','woodRough'])if(!textures[key]){const t=new THREE.DataTexture(new Uint8Array(key==='woodNormal'?[128,128,255,255]:[195,171,132,255]),1,1,THREE.RGBAFormat);t.needsUpdate=true;textures[key]=t}
 for(const key of ['woodColor','wallColor','stoneColor','tileColor'])if(textures[key])textures[key].colorSpace=THREE.SRGBColorSpace;
 if(get(3)){const hdri=get(3);hdri.mapping=THREE.EquirectangularReflectionMapping;const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(hdri).texture;scene.environmentIntensity=.55;pmrem.dispose();hdri.dispose()}
 const building=createBuilding(scene,textures);const flatPlan=initPlan($('#flat-plan'),{building,onRoom:selectRoom,onViewpoint:trigger=>panorama.open(trigger)});ao.normalMaterial.clippingPlanes=[building.clip];
 // The licensed wardrobe is originally modelled in millimetres. Fit modules within
 // the existing furniture footprints, leaving the procedural version as fallback.
 if(get(4)){
  const source=get(4).scene;source.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(source),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  if(size.x>0&&size.y>0&&size.z>0){
   building.furnishings.children.filter(g=>g.userData.wardrobe).forEach(group=>{
    const {width,depth}=group.userData.wardrobe,count=Math.max(1,Math.round(width/1.2)),moduleWidth=width/count;
    group.children.forEach(child=>child.visible=false);
    for(let i=0;i<count;i++){
     const item=source.clone(true),sx=moduleWidth/size.x,sy=2.01/size.y,sz=depth/size.z;
     item.scale.set(sx,sy,sz);item.position.set(-width/2+moduleWidth*(i+.5)-center.x*sx,-bounds.min.y*sy,-center.z*sz);
     item.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});group.add(item);
    }
   });
  }
 }


 // Model replacements are fitted to the existing placeholders, and are only
 // swapped in after a usable model has loaded. Procedural furniture remains
 // available if a download or bounds check fails.
 function fitModel(source,w,h,d){
  const item=source.clone(true);item.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(item),size=bounds.getSize(new THREE.Vector3()),mid=bounds.getCenter(new THREE.Vector3());
  if(![size.x,size.y,size.z].every(n=>Number.isFinite(n)&&n>0))return null;
  item.scale.set(w/size.x,h/size.y,d/size.z);
  item.position.set(-mid.x*item.scale.x,-bounds.min.y*item.scale.y,-mid.z*item.scale.z);
  item.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return item;
 }
 function replaceAsset(group,source,w,h,d,angle=0){
  if(!group||!source)return;
  const item=fitModel(source,w,h,d);if(!item)return;
  const holder=new THREE.Group();holder.rotation.y=angle;holder.add(item);
  group.children.forEach(o=>o.visible=false);group.add(holder);
 }
 if(get(5))for(const g of building.furnishings.children.filter(g=>g.userData.asset==='dining-chair'))replaceAsset(g,get(5).scene,.43,.92,.55);
 if(get(6))replaceAsset(building.furnishings.children.find(g=>g.userData.asset==='coffee-table'),get(6).scene,.6,.39,1.2);
 if(get(7))replaceAsset(building.furnishings.children.find(g=>g.userData.asset==='sofa'),get(7).scene,2.35,.88,1.59,-Math.PI/2);
 if(get(8))for(const group of building.furnishings.children.filter(g=>g.userData.bed)){
  const item=fitModel(get(8).scene,group.userData.bed.width+.1,1.1,2.15);
  if(item){const fallback=group.children.find(o=>o.userData.bedFallback);if(fallback)fallback.visible=false;group.add(item)}
 }

 // Ground-only rain, outside the enclosed apartment and common circulation.
 const rainCount=2200,positions=new Float32Array(rainCount*6),velocity=new Float32Array(rainCount),rainPositions=[];
 function outside(x,z){return x<-6.7||x>14.85||z<-.4||z>13.4||(x<-.3&&z>8.1)}
 function newDrop(){let x,z;do{x=Math.random()*65-23;z=Math.random()*65-23}while(!outside(x,z));return {x,z,y:Math.random()*22+.2}}
 for(let i=0;i<rainCount;i++){rainPositions.push(newDrop());velocity[i]=6+Math.random()*6}
 const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));const rainMat=new THREE.LineBasicMaterial({color:'#c6dde2',transparent:true,opacity:.4,depthWrite:false});const rain=new THREE.LineSegments(rainGeo,rainMat);rain.visible=false;rain.frustumCulled=false;scene.add(rain);
 const splashGeo=new THREE.RingGeometry(.05,.059,16);splashGeo.rotateX(-Math.PI/2);const splashMat=new THREE.MeshBasicMaterial({color:'#cbdcda',transparent:true,opacity:.18,depthWrite:false});const splashes=new THREE.InstancedMesh(splashGeo,splashMat,160);splashes.visible=false;splashes.frustumCulled=false;scene.add(splashes);const splashData=Array.from({length:160},()=>({...newDrop(),phase:Math.random()}));const dummy=new THREE.Object3D();
 const weatherPresets={sunny:{sun:3.1,hemi:1.35,fill:.45,env:.55,exposure:1.07,bg:'#e2e7dd',ground:'#c9d0c2',light:'#fff0d5',rough:.94,note:'暖阳入室 · 清晰的光影'},cloudy:{sun:.35,hemi:1.7,fill:.25,env:.75,exposure:1.05,bg:'#d2dadd',ground:'#b6c3bd',light:'#e5eef5',rough:.78,note:'漫射天光 · 柔和的明暗'},rainy:{sun:.12,hemi:.78,fill:.2,env:.3,exposure:.95,bg:'#8d9fa5',ground:'#7e9391',light:'#b9cfdf',rough:.17,note:'窗外细雨 · 清冷的天光'}};
 let weather='sunny',targetWeather=weatherPresets.sunny;
 function setWeather(key){weather=key;targetWeather=weatherPresets[key];rain.visible=splashes.visible=key==='rainy';$$('[data-weather]').forEach(b=>{let active=b.dataset.weather===key;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});$('#weather-note').textContent=targetWeather.note;$('#weather-dot').style.background=key==='sunny'?'#bea66c':key==='cloudy'?'#9baea9':'#7ca5b2';}
 $$('[data-weather]').forEach(b=>b.onclick=()=>setWeather(b.dataset.weather));
 let mode='orbit',selected=null,tween=null,showLabels=true,frameCount=0,lastTime=performance.now(),modelReady=false;
 const labelRoot=$('#labels'),labelVector=new THREE.Vector3();const labels=building.rooms.map(room=>{const el=document.createElement('button');el.className='room-label';el.innerHTML=`${room.name}<small>${room.area.toFixed(1)} m²</small>`;el.setAttribute('aria-label',`${room.name}，图示面积 ${room.area} 平方米`);el.onclick=e=>{e.stopPropagation();selectRoom(room)};labelRoot.append(el);return{room,el}});
 const dimLabels=building.dims.map(d=>{const el=document.createElement('div');el.className='dim-label';el.textContent=d.label;el.hidden=true;labelRoot.append(el);return{...d,el}});
 function updateProjection(){
  const w=innerWidth,h=innerHeight,aspect=w/h,shift=w>700?125:0;
  perspective.aspect=aspect;perspective.setViewOffset(w,h,-shift,0,w,h);perspective.updateProjectionMatrix();
  const halfHeight=aspect<1?10/aspect:9.5;ortho.left=-halfHeight*aspect-shift/w*2*halfHeight*aspect;ortho.right=halfHeight*aspect-shift/w*2*halfHeight*aspect;ortho.top=halfHeight;ortho.bottom=-halfHeight;ortho.updateProjectionMatrix();
  renderer.setSize(w,h);composer.setSize(w,h);ao.enabled=w>700;
 }
 function homePosition(){const aspect=innerWidth/innerHeight,dist=aspect<1?33/aspect*.76:32;return center.clone().add(new THREE.Vector3(.52,.98,1.15).normalize().multiplyScalar(dist))}
 function animateCamera(position,target,duration=950){tween={from:camera.position.clone(),to:position.clone(),fromTarget:controls.target.clone(),target:target.clone(),time:performance.now(),duration};controls.autoRotate=false;$('#rotate').classList.remove('active');$('#rotate').setAttribute('aria-pressed','false')}
 function setView(next){mode=next;togglePlanUI(mode==='top');if(mode==='top')flatPlan.reset();else setWeather(weather);controls.enabled=mode!=='top';document.body.dataset.renderMode=mode==='top'?'2d':'3d';camera=mode==='top'?ortho:perspective;controls.object=camera;renderPass.camera=camera;ao.camera=camera;controls.enableRotate=mode!=='top';controls.autoRotate=false;$('#rotate').classList.remove('active');$('#rotate').setAttribute('aria-pressed','false');tween=null;
  if(mode==='top'){camera.up.set(0,0,-1);camera.position.set(7.3,35,6.675);camera.zoom=1;controls.target.set(7.3,0,6.675);camera.lookAt(controls.target);building.setFullWalls(false)}else{camera.up.set(0,1,0);camera.position.copy(homePosition());controls.target.copy(center);building.setFullWalls($('#walls').checked)}
  for(const m of [ao.ssaoMaterial,ao.depthRenderMaterial]){m.defines.PERSPECTIVE_CAMERA=mode==='top'?0:1;m.needsUpdate=true}
  controls.update();updateProjection();$$('button[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===mode);b.setAttribute('aria-pressed',String(b.dataset.view===mode))});
 }
 function reset(){selected=null;$('#room-card').hidden=true;labels.forEach(x=>x.el.classList.remove('selected'));if(mode==='top'){setView('top')}else animateCamera(homePosition(),center);}
 $$('button[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('#reset').onclick=reset;$('.brand').onclick=e=>{e.preventDefault();reset()};
 function zoom(ratio){if(mode==='top'){flatPlan.zoom(ratio)}else{let offset=camera.position.clone().sub(controls.target);offset.multiplyScalar(1/ratio);offset.clampLength(4,65);animateCamera(controls.target.clone().add(offset),controls.target,280)}}
 $('#zoom-in').onclick=()=>zoom(1.2);$('#zoom-out').onclick=()=>zoom(1/1.2);$('#rotate').onclick=()=>{if(mode==='top')setView('orbit');controls.autoRotate=!controls.autoRotate;$('#rotate').classList.toggle('active',controls.autoRotate);$('#rotate').setAttribute('aria-pressed',String(controls.autoRotate))};
 $('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{toast('当前浏览器不支持全屏，可使用浏览器全屏模式')}};
 $('#walls').onchange=e=>{building.setFullWalls(mode==='top'?false:e.target.checked);if(mode==='top'&&e.target.checked)toast('俯视模式保留剖切，切回空间漫览查看完整墙体')};
 $('#furniture').onchange=e=>{building.furnishings.visible=e.target.checked;flatPlan.setFurniture(e.target.checked)};$('#room-labels').onchange=e=>{showLabels=e.target.checked;flatPlan.setLabels(showLabels);labels.forEach(x=>x.el.hidden=!showLabels)};$('#dimensions').onchange=e=>{building.annotations.visible=e.target.checked;flatPlan.setDimensions(e.target.checked);dimLabels.forEach(x=>x.el.hidden=!e.target.checked)};
 $('#common').onchange=e=>{building.common.visible=e.target.checked;flatPlan.setCommon(e.target.checked);if(e.target.checked){if(mode==='orbit')animateCamera(new THREE.Vector3(19,29,34),new THREE.Vector3(4.4,.2,6.6));else{controls.target.set(4.4,0,6.675);camera.position.set(4.4,35,6.675);camera.zoom=.8;camera.updateProjectionMatrix()}}else reset()};
 function selectRoom(room){selected=room;$('#room-name').textContent=room.name;$('#room-area').textContent=room.area.toFixed(1);$('#room-description').textContent=room.description;$('#room-card').hidden=false;labels.forEach(x=>x.el.classList.toggle('selected',x.room===room))}
 $('#close-room').onclick=()=>{$('#room-card').hidden=true;selected=null;labels.forEach(x=>x.el.classList.remove('selected'))};
 $('#focus-room').onclick=()=>{if(!selected)return;const r=selected;if(mode==='top')setView('orbit');animateCamera(new THREE.Vector3(r.x+3.9,8.7,r.z+6.0),new THREE.Vector3(r.x,.3,r.z));};
 controls.addEventListener('start',()=>{tween=null});controls.addEventListener('end',()=>{if(mode==='orbit'&&controls.getPolarAngle()<.14)setView('top')});window.addEventListener('resize',updateProjection);
 const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),pick=new THREE.Vector3();let pointerStart;
 canvas.addEventListener('pointerdown',e=>pointerStart=[e.clientX,e.clientY]);canvas.addEventListener('dblclick',e=>{mouse.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(mouse,camera);if(raycaster.ray.intersectPlane(groundPlane,pick)){let nearest=building.rooms.map(r=>({r,d:Math.hypot(r.x-pick.x,r.z-pick.z)})).sort((a,b)=>a.d-b.d)[0];if(nearest.d<2.2){selectRoom(nearest.r);$('#focus-room').click()}}});
 window.addEventListener('keydown',e=>{if(modal.open||panorama.isOpen()||e.target.tagName==='INPUT')return;if(e.key==='r'||e.key==='R')reset();if(mode!=='top'&&e.key==='1')setWeather('sunny');if(mode!=='top'&&e.key==='2')setWeather('cloudy');if(mode!=='top'&&e.key==='3')setWeather('rainy')});
 function updateLabels(){
  // Screen-space UI attached to the existing model's exact floor coordinate.
  // It is independent of furniture/room-label visibility, not a new mesh.
  labelVector.set(LIVING_VIEWPOINT.x,LIVING_VIEWPOINT.floorHeight,LIVING_VIEWPOINT.z).project(camera);
  const px=(labelVector.x*.5+.5)*innerWidth,py=(-labelVector.y*.5+.5)*innerHeight;
  const pointVisible=mode!=='top'&&labelVector.z>-1&&labelVector.z<1&&px>24&&px<innerWidth-24&&py>125&&py<innerHeight-110;
  panorama.button.hidden=!pointVisible;
  panorama.button.style.transform=`translate(${px}px,${py}px) translate(-50%,-100%)`;
  const avoid=pointVisible?[{x:px-42,y:py-65,w:84,h:56}]:[];
  for(const l of labels){if(!showLabels){l.el.hidden=true;continue}labelVector.set(l.room.x,mode==='top'?.1:.85,l.room.z).project(camera);const x=(labelVector.x*.5+.5)*innerWidth,y=(-labelVector.y*.5+.5)*innerHeight;let visible=labelVector.z<1&&labelVector.z>-1&&x>10&&x<innerWidth-10&&y>105&&y<innerHeight-115;
   if(innerWidth>700&&x<300&&y<650)visible=false;
   const rect={x:x-42,y:y-12,w:84,h:24};if(visible&&avoid.some(r=>Math.abs(r.x-rect.x)<80&&Math.abs(r.y-rect.y)<25))visible=false;
   l.el.hidden=!visible;if(visible){avoid.push(rect);l.el.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`}
  }
  if(building.annotations.visible)for(const d of dimLabels){labelVector.set(d.x,d.y,d.z).project(camera);d.el.hidden=labelVector.z>1;d.el.style.transform=`translate(${(labelVector.x*.5+.5)*innerWidth}px,${(-labelVector.y*.5+.5)*innerHeight}px) translate(-50%,-50%)`}
  const angle=Math.atan2(camera.position.x-controls.target.x,camera.position.z-controls.target.z);$('#orientation-arrow').style.transform=`rotate(${mode==='top'?0:-angle*180/Math.PI}deg)`;
 }
 const bgTarget=new THREE.Color(),groundTarget=new THREE.Color(),lightTarget=new THREE.Color();
 function frame(time){requestAnimationFrame(frame);const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;frameCount++;if(mode==='top'||panorama.isOpen())return;
  if(tween){const t=Math.min((time-tween.time)/tween.duration,1),ease=1-Math.pow(1-t,3);camera.position.lerpVectors(tween.from,tween.to,ease);controls.target.lerpVectors(tween.fromTarget,tween.target,ease);if(t===1)tween=null}
  controls.update();const a=1-Math.exp(-dt*3.5),p=targetWeather;sun.intensity=THREE.MathUtils.lerp(sun.intensity,p.sun,a);hemi.intensity=THREE.MathUtils.lerp(hemi.intensity,p.hemi,a);fill.intensity=THREE.MathUtils.lerp(fill.intensity,p.fill,a);scene.environmentIntensity=THREE.MathUtils.lerp(scene.environmentIntensity,p.env,a);renderer.toneMappingExposure=THREE.MathUtils.lerp(renderer.toneMappingExposure,p.exposure,a);scene.background.lerp(bgTarget.set(p.bg),a);scene.fog.color.copy(scene.background);groundMat.color.lerp(groundTarget.set(p.ground),a);groundMat.roughness=THREE.MathUtils.lerp(groundMat.roughness,p.rough,a);sun.color.lerp(lightTarget.set(p.light),a);
  if(weather==='rainy'){for(let i=0;i<rainCount;i++){let d=rainPositions[i];d.y-=dt*velocity[i];if(d.y<-.3){d.y=18+Math.random()*4}const j=i*6;positions[j]=d.x;positions[j+1]=d.y;positions[j+2]=d.z;positions[j+3]=d.x-.04;positions[j+4]=d.y+.25+velocity[i]*.018;positions[j+5]=d.z-.03}rainGeo.attributes.position.needsUpdate=true;for(let i=0;i<splashData.length;i++){const d=splashData[i],f=(time*.0006+d.phase)%1;dummy.position.set(d.x,-.348,d.z);dummy.scale.setScalar(.3+f*4);dummy.updateMatrix();splashes.setMatrixAt(i,dummy.matrix)}splashes.instanceMatrix.needsUpdate=true}
  ao.ssaoMaterial.uniforms.cameraProjectionMatrix.value.copy(camera.projectionMatrix);ao.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(camera.projectionMatrixInverse);
  updateLabels();composer.render();if(!modelReady){modelReady=true;$('#loading').classList.add('hidden');if(failed.length)toast('部分素材加载失败，已使用备用模型或基础材质')}
 }
 setView('orbit');requestAnimationFrame(frame);
 // Read-only, user-visible state values for diagnostics, also useful when reporting a rendering problem.
 canvas.dataset.modelWidth=String(METRICS.width);canvas.dataset.modelDepth=String(METRICS.depth);canvas.dataset.storyHeight=String(METRICS.story);canvas.dataset.units='metres';canvas.dataset.roomCount=String(building.rooms.length);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();setView('top');togglePlanUI(true,true);toast('3D 图形已暂停，已切换二维平面；刷新可重试')});
}
start().catch(error=>{console.error(error);try{showFlatFallback()}catch(planError){console.error(planError);$('#loading-message').textContent='页面未能加载，请刷新重试。';$('#loading strong').textContent='暂时无法显示户型';}});
