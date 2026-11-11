/* Original equirectangular panorama viewer: WebGL plus tiled, progressive Canvas2D. No runtime dependencies. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('panorama'), container = $('viewer');
  const initial = {yaw: 0, pitch: -8, fov: window.innerWidth < 700 ? 74 : 62};
  const state = {...initial, ready: false};
  const entrance={yaw:-146.5,pitch:-3.7};
  const pointers = new Map();
  const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
  const rad = value => value * Math.PI / 180;
  let gl, program, texture, uniforms, frame = 0, request = 0, controller, disposed = false;
  let imageURL, context2d, sourceImage, pixelWidth, pixelHeight, outputPixels;
  let tileCanvas, tileContext, tiles=[],tileCount=0,tileColumns=0,tileStamp=0;
  let renderRevision=0,qualityFrame=0,qualityTimer=0;
  const tileSize=512;
  const lowMemory=(globalThis.navigator?.deviceMemory||8)<=2;
  const quality={stillPixels:lowMemory?1800000:3200000,activePixels:160000,maxDpr:2.5,maxTiles:lowMemory?16:32};
  let renderMode="webgl";
  const vertexSource = 'attribute vec2 position; varying vec2 screen; void main(){screen=position;gl_Position=vec4(position,0.0,1.0);}';
  const fragmentSource = `precision highp float;
    varying vec2 screen; uniform sampler2D panorama; uniform float yaw,pitch,tanHalfFov,aspect;
    const float PI=3.141592653589793;
    void main(){
      vec3 v=normalize(vec3(screen.x*tanHalfFov*aspect,screen.y*tanHalfFov,1.0));
      v=vec3(v.x,cos(pitch)*v.y+sin(pitch)*v.z,-sin(pitch)*v.y+cos(pitch)*v.z);
      v=vec3(cos(yaw)*v.x+sin(yaw)*v.z,v.y,-sin(yaw)*v.x+cos(yaw)*v.z);
      vec2 uv=vec2(fract(atan(v.x,v.z)/(2.0*PI)+0.5),0.5-asin(clamp(v.y,-1.0,1.0))/PI);
      gl_FragColor=texture2D(panorama,uv);
    }`;
  const setControls = enabled => ['zoom-in','zoom-out','reset'].forEach(id => $(id).disabled=!enabled);
  function feedback(message){ $('view-status').textContent=message; }
  function fail(title,message){
    cancelRefinement();state.ready=false; container.setAttribute('aria-busy','false'); setControls(false);
    $('loading').hidden=true; $('gesture-hint').hidden=true; $('entrance-hotspot').hidden=true; closeEntrance();
    $('error-title').textContent=title; $('error-detail').textContent=message; $('error-panel').hidden=false;
  }
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('shader: '+gl.getShaderInfoLog(s));return s;}
  function initGL(){
    gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:false,depth:false,stencil:false});
    if(!gl){
      context2d=canvas.getContext('2d',{alpha:false,desynchronized:true});
      if(!context2d)throw new Error('webgl');
      renderMode='canvas2d';$('render-mode').textContent='固定站位 · 兼容渲染';return;
    }
    renderMode='webgl';$('render-mode').textContent='固定站位';
    program=gl.createProgram();
    const vs=shader(gl.VERTEX_SHADER,vertexSource),fs=shader(gl.FRAGMENT_SHADER,fragmentSource);
    gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('program: '+gl.getProgramInfoLog(program));
    gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const p=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
    uniforms=Object.fromEntries(['yaw','pitch','tanHalfFov','aspect','panorama'].map(k=>[k,gl.getUniformLocation(program,k)]));
    texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.uniform1i(uniforms.panorama,0);
  }
  function render(){
    frame=0;if(!state.ready||disposed)return;
    let ratio=Math.min(window.devicePixelRatio||1,renderMode==='canvas2d'?quality.maxDpr:2.5);
    if(renderMode==='canvas2d')ratio=Math.min(ratio,Math.sqrt(quality.activePixels/(canvas.clientWidth*canvas.clientHeight)));
    const width=Math.max(1,Math.round(canvas.clientWidth*ratio)),height=Math.max(1,Math.round(canvas.clientHeight*ratio));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    if(renderMode==='canvas2d'){
      try{renderCanvasPreview(width,height);}catch(error){fail('全景绘制暂时失败','浏览器可用资源不足，请关闭其他页面后重试，或打开平面全景图。');return;}
      if(!pointers.size){const revision=renderRevision;qualityTimer=setTimeout(()=>refineCanvas(revision),80);}
    }else{
      gl.viewport(0,0,width,height);
      gl.uniform1f(uniforms.yaw,rad(state.yaw));gl.uniform1f(uniforms.pitch,rad(state.pitch));
      gl.uniform1f(uniforms.tanHalfFov,Math.tan(rad(state.fov)/2));gl.uniform1f(uniforms.aspect,width/height);
      gl.drawArrays(gl.TRIANGLES,0,6);
    }
    $('zoom-value').value=(Math.tan(rad(initial.fov)/2)/Math.tan(rad(state.fov)/2)).toFixed(1)+'×';
    $('zoom-in').disabled=state.fov<=35;$('zoom-out').disabled=state.fov>=95;
    positionEntrance();
  }
  // Decode only the currently needed original-image tiles, not a full duplicated RGBA panorama.
  // A one-pixel gutter makes bilinear interpolation continuous at tile edges and longitude ±180°.
  function sourceTile(x,y){
    const tx=Math.floor(x/tileSize),ty=Math.floor(y/tileSize),key=ty*tileColumns+tx;
    let tile=tiles[key];
    if(!tile){
      const sx=tx*tileSize,sy=ty*tileSize,w=Math.min(tileSize,pixelWidth-sx),h=Math.min(tileSize,pixelHeight-sy);
      tileCanvas.width=w+1;tileCanvas.height=h+1;
      const nextX=(sx+w)%pixelWidth,nextY=Math.min(sy+h,pixelHeight-1);
      tileContext.drawImage(sourceImage,sx,sy,w,h,0,0,w,h);
      tileContext.drawImage(sourceImage,nextX,sy,1,h,w,0,1,h);
      tileContext.drawImage(sourceImage,sx,nextY,w,1,0,h,w,1);
      tileContext.drawImage(sourceImage,nextX,nextY,1,1,w,h,1,1);
      tile={data:tileContext.getImageData(0,0,w+1,h+1).data,stride:(w+1)*4,sx,sy,stamp:tileStamp};
      if(tileCount>=quality.maxTiles){let oldest=-1,stamp=Infinity;for(let i=0;i<tiles.length;i++)if(tiles[i]&&tiles[i].stamp<stamp){oldest=i;stamp=tiles[i].stamp;}if(oldest>=0){tiles[oldest]=undefined;tileCount--;}}
      tiles[key]=tile;tileCount++;
    }
    tile.stamp=++tileStamp;return tile;
  }
  function projection(width,height,view){
    const t=Math.tan(rad(view.fov)/2),aspect=width/height,rays=new Float32Array(width);
    for(let x=0;x<width;x++)rays[x]=(2*(x+.5)/width-1)*t*aspect;
    return {width,height,t,rays,sy:Math.sin(rad(view.yaw)),cy:Math.cos(rad(view.yaw)),sp:Math.sin(rad(view.pitch)),cp:Math.cos(rad(view.pitch))};
  }
  function paintRows(image,projection,start,end){
    const pixels=image.data,{width,height,t,rays,sy,cy,sp,cp}=projection;
    for(let row=start;row<end;row++){
      const ry=(1-2*(row+.5)/height)*t,py=cp*ry+sp,pz=cp-sp*ry,base=1+ry*ry;
      for(let col=0;col<width;col++){
        const rx=rays[col],longitude=Math.atan2(cy*rx+sy*pz,-sy*rx+cy*pz);
        const u=(longitude/(2*Math.PI)+.5)*pixelWidth-.5;
        const v=clamp((.5-Math.asin(clamp(py/Math.sqrt(rx*rx+base),-1,1))/Math.PI)*pixelHeight-.5,0,pixelHeight-1);
        const rawX=Math.floor(u),x0=(rawX+pixelWidth)%pixelWidth,y0=Math.floor(v),fx=u-rawX,fy=v-y0;
        const tile=sourceTile(x0,y0),data=tile.data,a=(y0-tile.sy)*tile.stride+(x0-tile.sx)*4,b=a+4,c=a+tile.stride,d=c+4,o=(row*width+col)*4;
        for(let k=0;k<3;k++)pixels[o+k]=(data[a+k]*(1-fx)+data[b+k]*fx)*(1-fy)+(data[c+k]*(1-fx)+data[d+k]*fx)*fy;
        pixels[o+3]=255;
      }
    }
  }
  function renderCanvasPreview(width,height){
    if(!sourceImage)return;
    if(!outputPixels||outputPixels.width!==width||outputPixels.height!==height)outputPixels=context2d.createImageData(width,height);
    paintRows(outputPixels,projection(width,height,state),0,height);
    context2d.putImageData(outputPixels,0,0);
    container.dataset.renderQuality='interactive';$('render-mode').textContent='固定站位 · 兼容渲染';
  }
  function refineCanvas(revision){
    qualityTimer=0;
    if(revision!==renderRevision||pointers.size||!state.ready||disposed||!sourceImage)return;
    const ratio=Math.min(window.devicePixelRatio||1,quality.maxDpr,Math.sqrt(quality.stillPixels/(canvas.clientWidth*canvas.clientHeight)));
    const width=Math.max(1,Math.round(canvas.clientWidth*ratio)),height=Math.max(1,Math.round(canvas.clientHeight*ratio));
    if(width===canvas.width&&height===canvas.height){container.dataset.renderQuality='high';return;}
    let image;try{image=context2d.createImageData(width,height);}catch(error){refinementLimited(error);return;}
    const parameters=projection(width,height,{...state});let row=0;
    container.dataset.renderQuality='refining';
    function step(){
      qualityFrame=0;
      if(revision!==renderRevision||pointers.size||!state.ready||disposed)return;
      const started=performance.now();
      try{
      do{const end=Math.min(row+8,height);paintRows(image,parameters,row,end);row=end;}while(row<height&&performance.now()-started<8);
      if(row<height){qualityFrame=requestAnimationFrame(step);return;}
      // Replace the low-resolution preview only once the entire sharper view is complete.
      canvas.width=width;canvas.height=height;context2d.putImageData(image,0,0);container.dataset.renderQuality='high';
      }catch(error){refinementLimited(error);}
    }
    qualityFrame=requestAnimationFrame(step);
  }
  function refinementLimited(error){
    container.dataset.renderQuality='limited';$('render-mode').textContent='固定站位 · 资源受限';
    feedback('浏览器资源不足，暂时保留流畅画面；再次调整视角或重新加载可重试清晰重绘。');console.warn('Panorama refinement:',error.message);
  }
  function cancelRefinement(){
    renderRevision++;clearTimeout(qualityTimer);qualityTimer=0;cancelAnimationFrame(qualityFrame);qualityFrame=0;
  }
  function positionEntrance(){
    const y=rad(entrance.yaw),p=rad(entrance.pitch),cameraYaw=rad(state.yaw),cameraPitch=rad(state.pitch);
    const x=Math.sin(y)*Math.cos(p),vertical=Math.sin(p),z=Math.cos(y)*Math.cos(p);
    const cx=Math.cos(cameraYaw)*x-Math.sin(cameraYaw)*z,cz=Math.sin(cameraYaw)*x+Math.cos(cameraYaw)*z;
    const cy=Math.cos(cameraPitch)*vertical-Math.sin(cameraPitch)*cz,depth=Math.sin(cameraPitch)*vertical+Math.cos(cameraPitch)*cz;
    const t=Math.tan(rad(state.fov)/2),aspect=canvas.clientWidth/canvas.clientHeight;
    const nx=cx/(depth*t*aspect),ny=cy/(depth*t);
    const visible=state.ready&&depth>.1&&Math.abs(nx)<.8&&Math.abs(ny)<.8;
    $('entrance-hotspot').hidden=!visible;
    if(visible){$('entrance-hotspot').style.left=((nx+1)/2*100)+'%';$('entrance-hotspot').style.top=((1-ny)/2*100)+'%';}
    else closeEntrance();
  }
  function closeEntrance(){ $('entrance-description').hidden=true;$('entrance-toggle').setAttribute('aria-expanded','false'); }
  function invalidate(){cancelRefinement();if(!frame&&!disposed)frame=requestAnimationFrame(render);}
  function changeView(yaw,pitch,fov){state.yaw=((yaw+180)%360+360)%360-180;state.pitch=clamp(pitch,-85,85);state.fov=clamp(fov,35,95);invalidate();}
  function interacted(){ $('gesture-hint').hidden=true; }
  function zoom(delta){if(!state.ready)return;interacted();changeView(state.yaw,state.pitch,state.fov+delta);}
  function reset(){if(!state.ready)return;interacted();changeView(initial.yaw,initial.pitch,initial.fov);feedback('已回到初始方向与缩放');}
  async function load(){
    const id=++request;if(controller)controller.abort();controller=new AbortController();const activeController=controller;
    cancelRefinement();sourceImage=undefined;tiles=[];tileCount=0;
    state.ready=false;setControls(false);$('error-panel').hidden=true;$('loading').hidden=false;$('gesture-hint').hidden=true;$('entrance-hotspot').hidden=true;closeEntrance();
    $('load-title').textContent='正在载入客厅';$('load-detail').textContent='准备全景图片…';$('load-progress').removeAttribute('value');container.setAttribute('aria-busy','true');
    const timeout=setTimeout(()=>activeController.abort(),45000);
    try{
      if(!gl||gl.isContextLost())initGL();
      const response=await fetch('assets/living-panorama-6k-a9ab597e767e.jpg',{signal:activeController.signal,cache:'default'});
      if(!response.ok)throw new Error('http');
      const total=Number(response.headers.get('Content-Length'));let blob;
      if(response.body?.getReader){
        const reader=response.body.getReader(),parts=[];let loaded=0;
        while(true){const {done,value}=await reader.read();if(done)break;parts.push(value);loaded+=value.length;
          if(id!==request)return;
          if(total>0){$('load-progress').max=total;$('load-progress').value=Math.min(loaded,total);$('load-detail').textContent='图片下载 '+Math.min(100,Math.round(loaded/total*100))+'%';}
          else $('load-detail').textContent='已接收 '+(loaded/1024/1024).toFixed(1)+' MB';
        }
        blob=new Blob(parts,{type:'image/jpeg'});
      }else blob=await response.blob();
      if(id!==request)return;
      $('load-title').textContent='正在展开全景';$('load-detail').textContent='准备交互视野…';
      const url=URL.createObjectURL(blob);imageURL=url;const img=new Image();img.src=url;await img.decode();
      if(id!==request){URL.revokeObjectURL(url);return;}
      if(img.naturalWidth!==img.naturalHeight*2)throw new Error('ratio');
      let input=img;const limit=renderMode==='webgl'?Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE),8192):img.naturalWidth;
      if(img.naturalWidth>limit){input=document.createElement('canvas');input.width=limit;input.height=limit/2;input.getContext('2d').drawImage(img,0,0,input.width,input.height);}
      if(renderMode==='canvas2d'){
        sourceImage=img;pixelWidth=img.naturalWidth;pixelHeight=img.naturalHeight;tileColumns=Math.ceil(pixelWidth/tileSize);
        tileCanvas=document.createElement('canvas');tileContext=tileCanvas.getContext('2d',{willReadFrequently:true});
        if(!tileContext)throw new Error('canvas');tiles=[];tileCount=0;tileStamp=0;outputPixels=undefined;
      }else{
      const textureWidth=input.naturalWidth||input.width,textureHeight=input.naturalHeight||input.height;
      const powerOfTwo=value=>value>0&&(value&(value-1))===0;
      gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,powerOfTwo(textureWidth)&&powerOfTwo(textureHeight)?gl.REPEAT:gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,input);
      if(gl.getError()!==gl.NO_ERROR)throw new Error('texture');
      }
      URL.revokeObjectURL(url);imageURL=undefined;
      delete container.dataset.renderError;state.ready=true;$('loading').hidden=true;$('gesture-hint').hidden=false;container.setAttribute('aria-busy','false');setControls(true);invalidate();feedback(renderMode==='canvas2d'?'客厅全景已使用兼容渲染加载，可以拖动环视':'客厅全景已加载，可以拖动环视');
    }catch(error){
      if(id!==request)return;
      if(imageURL){URL.revokeObjectURL(imageURL);imageURL=undefined;}
      container.dataset.renderError=error.message;console.warn('Panorama viewer:',error.message);
      const graphics=['webgl','shader','program','texture'].some(kind=>error.message.startsWith(kind));
      fail(graphics?'浏览器暂不支持交互环视':'全景图片未能加载',graphics?'可以尝试更新浏览器或启用图形加速，也可以先打开平面全景图。':'请检查网络后重试。若仍无法载入，可打开平面全景图。');
    }finally{clearTimeout(timeout);}
  }
  canvas.addEventListener('pointerdown',event=>{if(!state.ready||event.button>0)return;canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});canvas.classList.add('dragging');cancelRefinement();interacted();});
  canvas.addEventListener('pointermove',event=>{
    if(!pointers.has(event.pointerId)||!state.ready)return;
    const old=pointers.get(event.pointerId),now={x:event.clientX,y:event.clientY};
    if(pointers.size===1){const vfov=state.fov,hfov=2*Math.atan(Math.tan(rad(vfov)/2)*canvas.clientWidth/canvas.clientHeight)*180/Math.PI;changeView(state.yaw-(now.x-old.x)*hfov/canvas.clientWidth,state.pitch+(now.y-old.y)*vfov/canvas.clientHeight,state.fov);}
    else{const other=[...pointers.entries()].find(([key])=>key!==event.pointerId)?.[1];if(other){const before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(now.x-other.x,now.y-other.y);if(before>5&&after>5)changeView(state.yaw,state.pitch,2*Math.atan(Math.tan(rad(state.fov)/2)*before/after)*180/Math.PI);}}
    pointers.set(event.pointerId,now);
  });
  const endPointer=event=>{pointers.delete(event.pointerId);if(!pointers.size){canvas.classList.remove('dragging');invalidate();}};
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>canvas.addEventListener(type,endPointer));
  window.addEventListener('blur',()=>{pointers.clear();canvas.classList.remove('dragging');invalidate();});
  canvas.addEventListener('wheel',event=>{if(!state.ready)return;event.preventDefault();zoom(clamp(event.deltaY*(event.deltaMode===1?1.1:0.04),-12,12));},{passive:false});
  canvas.addEventListener('keydown',event=>{
    if(!state.ready)return;
    const step=event.shiftKey?12:5,keys={ArrowLeft:[-step,0,0],ArrowRight:[step,0,0],ArrowUp:[0,step,0],ArrowDown:[0,-step,0],'+':[0,0,-6],'=':[0,0,-6],'-':[0,0,6],'_':[0,0,6]};
    if(event.key==='Home'||event.key==='0'){event.preventDefault();reset();return;}
    if(keys[event.key]){event.preventDefault();interacted();const [y,p,f]=keys[event.key];changeView(state.yaw+y,state.pitch+p,state.fov+f);}
  });
  canvas.addEventListener('contextmenu',event=>event.preventDefault());
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();request++;controller?.abort();fail('图形显示已暂停','浏览器暂时释放了图形资源。请点“重新加载”恢复，或查看平面全景图。');});
  canvas.addEventListener('webglcontextrestored',()=>{gl=null;load();});
  $('entrance-toggle').addEventListener('click',()=>{interacted();const open=$('entrance-description').hidden;$('entrance-description').hidden=!open;$('entrance-toggle').setAttribute('aria-expanded',String(open));});
  $('entrance-close').addEventListener('click',()=>{closeEntrance();$('entrance-toggle').focus();});
  container.addEventListener('keydown',event=>{if(event.key==='Escape')closeEntrance();});
  $('zoom-in').addEventListener('click',()=>zoom(-8));$('zoom-out').addEventListener('click',()=>zoom(8));$('reset').addEventListener('click',reset);$('retry').addEventListener('click',load);
  new ResizeObserver(invalidate).observe(container);
  window.addEventListener('pagehide',()=>{disposed=true;controller?.abort();cancelAnimationFrame(frame);frame=0;cancelRefinement();});
  window.addEventListener('pageshow',event=>{if(event.persisted){disposed=false;load();}});
  load();
})();
