/* ============================================
   REJUVEN — COMPLETE JAVASCRIPT & 3D ENGINE
   ============================================ */

const isMobile = window.innerWidth <= 1024;

// Preloader
window.addEventListener('load', () => {
    const preCount = document.getElementById('preCount');
    const preloader = document.getElementById('preloader');
    let count = 0;
    const timer = setInterval(() => {
        count += Math.floor(Math.random() * 12) + 5;
        if (count >= 100) {
            count = 100;
            clearInterval(timer);
            if (preloader) preloader.classList.add('done');
            if (typeof gsap !== 'undefined') gsap.to('.hero-title .fill', { y: '0%', duration: 1.2, stagger: 0.1, ease: 'power4.out' });
        }
        if (preCount) preCount.textContent = count;
    }, 40);
});
setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (preloader && !preloader.classList.contains('done')) {
        preloader.classList.add('done');
        if (typeof gsap !== 'undefined') gsap.to('.hero-title .fill', { y: '0%', duration: 1 });
    }
}, 2500);

if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

// Cursor
const cDot = document.querySelector('.cursor-dot');
const cRing = document.querySelector('.cursor-ring');
if (!isMobile && cDot && cRing) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        cDot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
    });
    function renderCursor() {
        rx += (mx - rx) * 0.15; ry += (my - ry) * 0.15;
        cRing.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
        requestAnimationFrame(renderCursor);
    }
    renderCursor();
}

// Mobile menu
const burger = document.getElementById('burger');
const menuOverlay = document.getElementById('menuOverlay');
if (burger && menuOverlay) {
    burger.addEventListener('click', () => {
        burger.classList.toggle('open');
        menuOverlay.classList.toggle('open');
        document.body.style.overflow = menuOverlay.classList.contains('open') ? 'hidden' : '';
    });
    document.querySelectorAll('.menu-inner a').forEach(link => link.addEventListener('click', () => {
        burger.classList.remove('open'); menuOverlay.classList.remove('open'); document.body.style.overflow = '';
    }));
}

// Navbar and anchors
const nav = document.getElementById('nav');
if (nav && typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({ start: 'top -80', onEnter: () => nav.classList.add('scrolled'), onLeaveBack: () => nav.classList.remove('scrolled') });
}
document.querySelectorAll('a[href^="#"]').forEach(anchor => anchor.addEventListener('click', function(e) {
    const targetId = this.getAttribute('href');
    if (targetId && targetId.length > 1) {
        e.preventDefault();
        const target = document.querySelector(targetId);
        if (target) window.scrollTo({ top: target.offsetTop - 70, behavior: 'smooth' });
    }
}));

// Hero 3D
(function initHero3D() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas || typeof THREE === 'undefined') return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(isMobile ? 60 : 45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, isMobile ? 1.5 : 0.8, isMobile ? 6 : 5);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    const geo = new THREE.PlaneGeometry(16, 8, isMobile ? 40 : 80, isMobile ? 16 : 30);
    const mat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 } }, vertexShader: `uniform float uTime; varying vec3 vPos; void main(){vec3 p=position;p.z+=sin(p.x*.7+uTime)*1.1+cos(p.y*1.3+uTime*.6)*.7;vPos=p;vec4 m=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*m;gl_PointSize=28./-m.z;}`, fragmentShader: `varying vec3 vPos;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;vec3 c=mix(vec3(.9,.78,.6),vec3(.81,.65,.47),(vPos.x+8.)/16.);gl_FragColor=vec4(c,pow(1.-d*2.,2.));}`, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const points = new THREE.Points(geo, mat);
    const lines = new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color: 0xcfa878, transparent: true, opacity: .15, blending: THREE.AdditiveBlending }));
    const group = new THREE.Group(); group.add(points, lines); group.rotation.x = -Math.PI / 2.2; group.rotation.z = .2; scene.add(group);
    const clock = new THREE.Clock();
    function animate() {
        const t = clock.getElapsedTime(); mat.uniforms.uTime.value = t;
        const pos = lines.geometry.attributes.position, original = geo.attributes.position;
        for (let i = 0; i < original.count; i++) pos.setZ(i, original.getZ(i) + Math.sin(original.getX(i)*.7+t)*1.1 + Math.cos(original.getY(i)*1.3+t*.6)*.7);
        pos.needsUpdate = true; renderer.render(scene, camera); requestAnimationFrame(animate);
    }
    animate();
    window.addEventListener('resize', () => { if (!canvas.clientWidth || !canvas.clientHeight) return; camera.aspect = canvas.clientWidth / canvas.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(canvas.clientWidth, canvas.clientHeight); });
})();

// Laser 3D
(function initLaser3D() {
    const canvas = document.getElementById('laserCanvas');
    if (!canvas || typeof THREE === 'undefined') return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, .1, 100); camera.position.z = isMobile ? 8 : 6;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); renderer.setPixelRatio(isMobile ? 1 : Math.min(devicePixelRatio, 2)); renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    const rings = [];
    for (let i = 0; i < (isMobile ? 5 : 8); i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5+i*.25,.012,16,80), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(.08,.7,.5), transparent: true, opacity: .7-i*.07, blending: THREE.AdditiveBlending })); ring.rotation.x = Math.PI/2; ring.userData = { off:i*.2, spd:.4+i*.1 }; scene.add(ring); rings.push(ring); }
    const clock = new THREE.Clock();
    function animate(){ const t=clock.getElapsedTime(); rings.forEach(r=>{r.rotation.z=t*r.userData.spd;r.rotation.y=Math.sin(t*.5+r.userData.off)*.3;r.rotation.x=Math.PI/2+Math.cos(t*.4+r.userData.off)*.2;});renderer.render(scene,camera);requestAnimationFrame(animate); } animate();
    window.addEventListener('resize',()=>{if(!canvas.clientWidth||!canvas.clientHeight)return;camera.aspect=canvas.clientWidth/canvas.clientHeight;camera.updateProjectionMatrix();renderer.setSize(canvas.clientWidth,canvas.clientHeight);});
})();

/* SHOWCASE 3D — GOLDEN SPINE / VERTEBRAL SCULPTURE */
(function initShowcaseSpine3D() {
    const original = document.getElementById('showcaseCanvas');
    if (!original || typeof THREE === 'undefined') return;
    const canvas = original;
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, .1, 100);
    camera.position.set(isMobile ? 0 : .25, isMobile ? .1 : 0, isMobile ? 8.5 : 5.8);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2)); renderer.setSize(width, height);
    scene.add(new THREE.AmbientLight(0xffead0, 1.5));
    const key = new THREE.PointLight(0xffc77d, 4.5, 14); key.position.set(3, 4, 5); scene.add(key);
    const rim = new THREE.PointLight(0x8b5b35, 3, 12); rim.position.set(-3, -2, 2); scene.add(rim);
    const gold = new THREE.MeshStandardMaterial({ color: 0xb77a3c, metalness: .92, roughness: .2 });
    const brightGold = new THREE.MeshStandardMaterial({ color: 0xf0c17b, metalness: .88, roughness: .16, emissive: 0x3b1c08, emissiveIntensity: .35 });
    const darkGold = new THREE.MeshStandardMaterial({ color: 0x5a3520, metalness: .9, roughness: .25 });
    const group = new THREE.Group();
    const count = isMobile ? 8 : 10;
    for (let i=0;i<count;i++) {
        const vertebra = new THREE.Group();
        const body = new THREE.Mesh(new THREE.SphereGeometry(.48, 28, 20), brightGold); body.scale.set(1.05,.42,.72); vertebra.add(body);
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.16,32), darkGold); disc.rotation.z = Math.PI/2; disc.position.y = -.34; vertebra.add(disc);
        const left = new THREE.Mesh(new THREE.SphereGeometry(.16,18,12), gold); left.scale.set(1.8,.65,1); left.position.set(-.48,-.02,0); vertebra.add(left);
        const right = left.clone(); right.position.x = .48; vertebra.add(right);
        vertebra.position.y = (count-1)*.45/2-i*.45;
        vertebra.rotation.z = Math.sin(i*.8)*.12; vertebra.rotation.x = Math.cos(i*.65)*.09;
        group.add(vertebra);
    }
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,count*.48,20), new THREE.MeshStandardMaterial({color:0xffd99b,emissive:0xffa94f,emissiveIntensity:1.5,metalness:.3,roughness:.2})); group.add(cord);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(2.25,.018,12,96), new THREE.MeshBasicMaterial({color:0xd49a58,transparent:true,opacity:.7})); halo.rotation.x=.45; halo.rotation.z=-.3; group.add(halo);
    group.rotation.z = isMobile ? -.12 : -.2; group.position.x = isMobile ? .65 : .8; group.scale.setScalar(isMobile ? 1.18 : 1.35); scene.add(group);
    let scrollProgress=0;
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.create({trigger:'.showcase',start:'top top',end:'bottom bottom',scrub:1,onUpdate:self=>{scrollProgress=self.progress;const idx=scrollProgress>.66?2:scrollProgress>.33?1:0;document.querySelectorAll('.sc-panel').forEach((p,i)=>p.classList.toggle('active',i===idx));}});
    const clock = new THREE.Clock();
    function animate(){const t=clock.getElapsedTime();group.rotation.y=t*.22+scrollProgress*Math.PI*2;group.rotation.x=Math.sin(t*.25)*.08+scrollProgress*.25;halo.rotation.y=-t*.18;renderer.render(scene,camera);requestAnimationFrame(animate);} animate();
    function resize(){const w=canvas.clientWidth||window.innerWidth,h=canvas.clientHeight||window.innerHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);} window.addEventListener('resize',resize);
})();

// Refined existing spine section
(function initSpine3D(){
    const canvas=document.getElementById('spineCanvas'); if(!canvas||typeof THREE==='undefined')return;
    const parent=canvas.parentElement,w=parent?parent.clientWidth:500,h=parent?parent.clientHeight:500;
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,w/h,.1,100);camera.position.set(0,0,isMobile?8:6.5);
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(isMobile?1:Math.min(devicePixelRatio,2));renderer.setSize(w,h);
    scene.add(new THREE.AmbientLight(0xffffff,.6));const light=new THREE.PointLight(0xcfa878,3,10);light.position.set(2,3,4);scene.add(light);
    const group=new THREE.Group(),discs=[],outer=new THREE.CylinderGeometry(.7,.7,.18,32),inner=new THREE.CylinderGeometry(.65,.65,.16,32);
    const outerMat=new THREE.MeshBasicMaterial({color:0xcfa878,wireframe:true,transparent:true,opacity:.6}),innerMat=new THREE.MeshBasicMaterial({color:0xe0c8aa,transparent:true,opacity:.35,blending:THREE.AdditiveBlending});
    for(let i=0;i<8;i++){const d=new THREE.Group();d.add(new THREE.Mesh(outer,outerMat),new THREE.Mesh(inner,innerMat));d.position.y=(4-i)*.55;d.userData={x:(Math.random()-.5)*.6,z:(Math.random()-.5)*.6,idx:i};d.rotation.x=d.userData.x;d.rotation.z=d.userData.z;group.add(d);discs.push(d);}
    group.add(new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,4.8,16),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.7,blending:THREE.AdditiveBlending})));scene.add(group);
    let progress=0;if(typeof ScrollTrigger!=='undefined')ScrollTrigger.create({trigger:'.spine-chapter',start:'top 80%',end:'bottom 20%',scrub:1,onUpdate:s=>progress=s.progress});
    const clock=new THREE.Clock();function animate(){const t=clock.getElapsedTime();discs.forEach(d=>{const f=1-Math.min(1,progress*1.2);d.rotation.x=d.userData.x*f;d.rotation.z=d.userData.z*f;d.rotation.y=Math.sin(t*1.5+d.userData.idx*.3)*.1;});group.rotation.y=t*.25;renderer.render(scene,camera);requestAnimationFrame(animate);}animate();
    window.addEventListener('resize',()=>{if(!parent)return;const nw=parent.clientWidth,nh=parent.clientHeight;camera.aspect=nw/nh;camera.updateProjectionMatrix();renderer.setSize(nw,nh);});
})();

// Mobile-safe hero scroll control and current copyright
(function polishMobileAndFooter(){
    const scroll=document.querySelector('.hero-scroll');
    if(scroll){scroll.style.maxWidth='100%';scroll.style.boxSizing='border-box';scroll.style.whiteSpace='nowrap';if(isMobile){scroll.style.fontSize='11px';scroll.style.right='16px';scroll.style.bottom='18px';}}
    document.querySelectorAll('.foot-base span').forEach(el=>{if(el.textContent.includes('©')||el.textContent.includes('&copy;')||el.textContent.includes('2024'))el.textContent=el.textContent.replace(/2024/g,'2026');});
})();

console.log('%c REJUVEN CLINIC — 3D System Ready ', 'background:#0a0a0a;color:#cfa878;font-size:14px;padding:8px 16px;');