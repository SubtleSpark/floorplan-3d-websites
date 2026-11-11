import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as THREE from 'three';
import {createBuilding} from '../building.js';
import {buildPlanSVG} from '../plan.js';
import {LIVING_VIEWPOINT as point} from '../viewpoint.js';

// This is geometry/projection simulation, not a GPU or browser test.
globalThis.document = {createElement:()=>({width:0,height:0,getContext:()=>new Proxy({}, {get:()=>()=>{}})})};
const textures={woodColor:new THREE.Texture(),woodNormal:new THREE.Texture(),woodRough:new THREE.Texture()};
const scene=new THREE.Scene(), model=createBuilding(scene,textures);
scene.updateMatrixWorld(true);
assert.deepEqual([point.x,point.z,point.eyeHeight],[4.65,9.5,1.6]);
assert.ok(point.x>3.2&&point.x<8&&point.z>8.9&&point.z<12.9,'station is in living room');
assert.ok(Math.abs(Math.hypot(point.direction.x,point.direction.z)-1)<1e-9);
const blockers=[];
for(const group of [model.architecture,model.furnishings])group.traverse(o=>{
 if(!o.isMesh)return;
 const b=new THREE.Box3().setFromObject(o);
 if(b.max.y<=.1||b.min.y>1.85)return; // floor/rug and ceilings are not walking obstacles
 if(point.x+.3>b.min.x&&point.x-.3<b.max.x&&point.z+.3>b.min.z&&point.z-.3<b.max.z)blockers.push({min:b.min.toArray(),max:b.max.toArray()});
});
assert.equal(blockers.length,0,`0.6 m standing footprint intersects obstacles: ${JSON.stringify(blockers)}`);
const svg=buildPlanSVG(model);
assert.equal((svg.match(/data-viewpoint-id=/g)||[]).length,1);
assert.ok(svg.includes('translate(4.65 9.5)'));
assert.ok(svg.includes('aria-label="打开客厅360度全景，唯一观察点"'));

const center=new THREE.Vector3(7.3,.35,7), world=new THREE.Vector3(point.x,point.floorHeight,point.z);
const cases=[];
for(const [width,height] of [[1440,900],[1188,760],[390,844],[360,640]]){
 const aspect=width/height, camera=new THREE.PerspectiveCamera(36,aspect,.1,200);
 const dist=aspect<1?33/aspect*.76:32;
 camera.position.copy(center).add(new THREE.Vector3(.52,.98,1.15).normalize().multiplyScalar(dist));
 camera.setViewOffset(width,height,width>700?-125:0,0,width,height);
 camera.lookAt(center);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 const ndc=world.clone().project(camera),x=(ndc.x*.5+.5)*width,y=(-ndc.y*.5+.5)*height;
 assert.ok(ndc.z>-1&&ndc.z<1&&x>24&&x<width-24&&y>125&&y<height-110,'marker in visible frame');
 const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(ndc.x,ndc.y),camera);
 const hit=ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-point.floorHeight),new THREE.Vector3());
 assert.ok(hit.distanceTo(world)<1e-9,'projected marker corresponds to its floor position');
 cases.push({width,height,x:Number(x.toFixed(1)),y:Number(y.toFixed(1))});
}
const root=fs.readFileSync('dist/index.html','utf8'), child=fs.readFileSync('dist/panorama/index.html','utf8');
assert.ok(root.includes('id="living-viewpoint"')&&root.includes('id="panorama-frame"'));
assert.ok(!child.includes('living-panorama-')||child.includes('assets/living-panorama-6k-a9ab597e767e.jpg'));
assert.ok(!child.includes('subtlespark.chatgpt.site'),'no cross-site private dependency');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('dist/panorama/assets/living-panorama-6k-a9ab597e767e.jpg')).digest('hex'),'a9ab597e767ee368ac8ebcfac6235a023ab560068533ba127fa274bfbb3d331e');
console.log(JSON.stringify({checks:'pass',stations:1,standingFootprintMetres:.6,geometryBlockers:blockers.length,projectionSimulation:cases},null,2));
