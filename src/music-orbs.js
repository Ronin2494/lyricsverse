// A single shared WebGL scene supplies depth and reflections; accessible song links stay in HTML.
let disposeCurrent=()=>{};
export function mountMusicOrbs(root){
 disposeCurrent();disposeCurrent=()=>{};
 if(!root||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const canvas=root.querySelector('.orb-canvas');if(!canvas)return;
 let cancelled=false,frame=0,renderer,geometry,material,scene,camera,observer,resizeObserver;
 const links=[...root.querySelectorAll('.holographic-orb-link')];
 const cleanup=()=>{cancelled=true;cancelAnimationFrame(frame);observer?.disconnect();resizeObserver?.disconnect();links.forEach(link=>link.removeEventListener('pointermove',onMove));geometry?.dispose();material?.dispose();renderer?.dispose();};
 disposeCurrent=cleanup;
 function onMove(e){const rect=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--pointer-x',((e.clientX-rect.left)/rect.width-.5).toFixed(2));e.currentTarget.style.setProperty('--pointer-y',((e.clientY-rect.top)/rect.height-.5).toFixed(2));}
 links.forEach(link=>link.addEventListener('pointermove',onMove));
 const start=async()=>{
  try{
   const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');
   if(cancelled||!root.isConnected)return;
   renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
   renderer.outputColorSpace=THREE.SRGBColorSpace;
   scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(38,1,.1,100);camera.position.z=11;
   scene.add(new THREE.AmbientLight(0x99bfff,1.8));
   const cyan=new THREE.PointLight(0x60e7ff,70);cyan.position.set(-4,4,5);scene.add(cyan);
   const violet=new THREE.PointLight(0x9271ff,85);violet.position.set(5,-2,4);scene.add(violet);
   geometry=new THREE.SphereGeometry(1,48,32);
   material=new THREE.MeshPhysicalMaterial({color:0x83b9ff,metalness:.18,roughness:.08,transmission:.8,thickness:1.5,ior:1.42,transparent:true,opacity:.83,clearcoat:1,clearcoatRoughness:.07,emissive:0x20396c,emissiveIntensity:.18});
   const spheres=links.map((_,i)=>{const group=new THREE.Group();const mesh=new THREE.Mesh(geometry,material);group.add(mesh);const ring=new THREE.Mesh(new THREE.TorusGeometry(1.22,.012,8,96),new THREE.MeshBasicMaterial({color:i%2?0xa69aff:0x6ee6ff,transparent:true,opacity:.7}));ring.rotation.x=.8;group.add(ring);scene.add(group);return group;});
   const resize=()=>{const r=root.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();};
   resizeObserver=new ResizeObserver(resize);resizeObserver.observe(root);resize();
   let visible=true;observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;});observer.observe(root);
   const animate=t=>{if(cancelled)return;frame=requestAnimationFrame(animate);if(!visible)return;const bounds=root.getBoundingClientRect();const narrow=bounds.width<650;links.forEach((link,i)=>{const b=link.getBoundingClientRect();const x=(b.left+b.width/2-bounds.left)/bounds.width;const y=(b.top+b.height/2-bounds.top)/bounds.height;const v=new THREE.Vector3((x-.5)*2,(.5-y)*2,.3).unproject(camera);const dir=v.sub(camera.position).normalize();const point=camera.position.clone().add(dir.multiplyScalar((0-camera.position.z)/dir.z));const group=spheres[i];group.position.lerp(point,.13);const size=narrow?.43:.75;group.scale.setScalar(size);group.rotation.y=t*.00012+i*.6;group.rotation.z=Math.sin(t*.0003+i)*.12;});renderer.render(scene,camera);};
   frame=requestAnimationFrame(animate);
  }catch{root.classList.add('orb-webgl-unavailable');}
 };
 void start();
}
