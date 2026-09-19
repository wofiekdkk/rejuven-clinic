/* ============================================
   REJUVEN — COMPLETE JAVASCRIPT & 3D ENGINE
   ============================================ */

// Fail-safe Preloader & Initialization
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
            
            // Hero Title Entrance
            if (typeof gsap !== 'undefined') {
                gsap.to('.hero-title .fill', {
                    y: '0%',
                    duration: 1.2,
                    stagger: 0.1,
                    ease: 'power4.out'
                });
            }
        }
        if (preCount) preCount.textContent = count;
    }, 40);
});

// Fallback safety if window load hangs
setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (preloader && !preloader.classList.contains('done')) {
        preloader.classList.add('done');
        if (typeof gsap !== 'undefined') {
            gsap.to('.hero-title .fill', { y: '0%', duration: 1 });
        }
    }
}, 2500);

// Initialize GSAP ScrollTrigger if available
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

// Custom Cursor (Desktop Only)
const isMobile = window.innerWidth <= 1024;
const cDot = document.querySelector('.cursor-dot');
const cRing = document.querySelector('.cursor-ring');

if (!isMobile && cDot && cRing) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        cDot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
    });
    function renderCursor() {
        rx += (mx - rx) * 0.15;
        ry += (my - ry) * 0.15;
        cRing.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
        requestAnimationFrame(renderCursor);
    }
    renderCursor();
}

// Mobile Menu Navigation
const burger = document.getElementById('burger');
const menuOverlay = document.getElementById('menuOverlay');
if (burger && menuOverlay) {
    burger.addEventListener('click', () => {
        burger.classList.toggle('open');
        menuOverlay.classList.toggle('open');
        document.body.style.overflow = menuOverlay.classList.contains('open') ? 'hidden' : '';
    });
    document.querySelectorAll('.menu-inner a').forEach(link => {
        link.addEventListener('click', () => {
            burger.classList.remove('open');
            menuOverlay.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}

// Navbar Scroll Effect
const nav = document.getElementById('nav');
if (nav && typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
        start: 'top -80',
        onEnter: () => nav.classList.add('scrolled'),
        onLeaveBack: () => nav.classList.remove('scrolled')
    });
}

// Smooth Anchor Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId.length > 1) {
            e.preventDefault();
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                const navHeight = 70;
                window.scrollTo({
                    top: targetEl.offsetTop - navHeight,
                    behavior: 'smooth'
                });
            }
        }
    });
});

/* =========================================================================
   1. HERO 3D — KINETIC PARTICLE WAVE
   ========================================================================= */
(function initHero3D() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(isMobile ? 60 : 45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, isMobile ? 1.5 : 0.8, isMobile ? 6 : 5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    const xCount = isMobile ? 40 : 80;
    const zCount = isMobile ? 16 : 30;
    const geo = new THREE.PlaneGeometry(16, 8, xCount, zCount);

    const matPoints = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
            uniform float uTime;
            varying vec3 vPos;
            void main() {
                vec3 pos = position;
                pos.z += sin(pos.x * 0.7 + uTime) * 1.1 + cos(pos.y * 1.3 + uTime * 0.6) * 0.7;
                vPos = pos;
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = (28.0 / -mvPosition.z);
            }
        `,
        fragmentShader: `
            varying vec3 vPos;
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if(dist > 0.5) discard;
                vec3 color = mix(vec3(0.9, 0.78, 0.6), vec3(0.81, 0.65, 0.47), (vPos.x + 8.0) / 16.0);
                gl_FragColor = vec4(color, pow(1.0 - dist * 2.0, 2.0));
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const matLines = new THREE.LineBasicMaterial({
        color: 0xcfa878,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geo, matPoints);
    const lines = new THREE.LineSegments(new THREE.WireframeGeometry(geo), matLines);

    const waveGroup = new THREE.Group();
    waveGroup.add(points);
    waveGroup.add(lines);
    waveGroup.rotation.x = -Math.PI / 2.2;
    waveGroup.rotation.z = 0.2;
    scene.add(waveGroup);

    const clock = new THREE.Clock();
    function animateHero() {
        const t = clock.getElapsedTime();
        matPoints.uniforms.uTime.value = t;

        const posAttr = lines.geometry.attributes.position;
        const origAttr = geo.attributes.position;
        for(let i = 0; i < origAttr.count; i++) {
            const x = origAttr.getX(i);
            const y = origAttr.getY(i);
            const z = origAttr.getZ(i);
            const nz = z + Math.sin(x * 0.7 + t) * 1.1 + Math.cos(y * 1.3 + t * 0.6) * 0.7;
            posAttr.setZ(i, nz);
        }
        lines.geometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
        requestAnimationFrame(animateHero);
    }
    animateHero();

    window.addEventListener('resize', () => {
        if (!canvas.clientWidth || !canvas.clientHeight) return;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    });
})();

/* =========================================================================
   2. LASER 3D — GLOW RINGS
   ========================================================================= */
(function initLaser3D() {
    const canvas = document.getElementById('laserCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.z = isMobile ? 8 : 6;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    const rings = [];
    const count = isMobile ? 5 : 8;
    for(let i = 0; i < count; i++) {
        const rGeo = new THREE.TorusGeometry(1.5 + i * 0.25, 0.012, 16, 80);
        const rMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.08, 0.7, 0.5),
            transparent: true,
            opacity: 0.7 - i * 0.07,
            blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(rGeo, rMat);
        ring.rotation.x = Math.PI / 2;
        ring.userData = { off: i * 0.2, spd: 0.4 + i * 0.1 };
        scene.add(ring);
        rings.push(ring);
    }

    const clock = new THREE.Clock();
    function animateLaser() {
        const t = clock.getElapsedTime();
        rings.forEach(r => {
            r.rotation.z = t * r.userData.spd;
            r.rotation.y = Math.sin(t * 0.5 + r.userData.off) * 0.3;
            r.rotation.x = Math.PI / 2 + Math.cos(t * 0.4 + r.userData.off) * 0.2;
        });
        renderer.render(scene, camera);
        requestAnimationFrame(animateLaser);
    }
    animateLaser();

    window.addEventListener('resize', () => {
        if (!canvas.clientWidth || !canvas.clientHeight) return;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    });
})();

/* =========================================================================
   3. SHOWCASE 3D — LIQUID KNOT
   ========================================================================= */
(function initShowcase3D() {
    const canvas = document.getElementById('showcaseCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.z = isMobile ? 6 : 4.5;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    const aLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(aLight);
    const pLight1 = new THREE.PointLight(0xcfa878, 3, 10);
    pLight1.position.set(2, 3, 4);
    scene.add(pLight1);

    const geo = new THREE.TorusKnotGeometry(1.1, 0.35, isMobile ? 100 : 160, 32);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xe0c8aa,
        metalness: 0.9,
        roughness: 0.2
    });
    const mesh = new THREE.Mesh(geo, mat);
    if (isMobile) mesh.position.y = 1.0;
    scene.add(mesh);

    let scrollProgress = 0;
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.create({
            trigger: '.showcase', start: 'top top', end: 'bottom bottom', scrub: 1,
            onUpdate: self => {
                scrollProgress = self.progress;
                const idx = scrollProgress > 0.66 ? 2 : (scrollProgress > 0.33 ? 1 : 0);
                document.querySelectorAll('.sc-panel').forEach((p, i) => {
                    p.classList.toggle('active', i === idx);
                });
            }
        });
    }

    const clock = new THREE.Clock();
    function animateShowcase() {
        const t = clock.getElapsedTime();
        mesh.rotation.x = t * 0.2 + scrollProgress * Math.PI * 2;
        mesh.rotation.y = t * 0.1 + scrollProgress * Math.PI;
        renderer.render(scene, camera);
        requestAnimationFrame(animateShowcase);
    }
    animateShowcase();

    window.addEventListener('resize', () => {
        if (!canvas.clientWidth || !canvas.clientHeight) return;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    });
})();

/* =========================================================================
   4. SPINE 3D — REFINED ELEGANT VERTEBRAE MODEL (FIXED FIT)
   ========================================================================= */
(function initSpine3D() {
    const canvas = document.getElementById('spineCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : 500;
    const height = parent ? parent.clientHeight : 500;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, isMobile ? 8 : 6.5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    const spineGroup = new THREE.Group();
    const count = 8;
    const discs = [];

    // Elegant, smooth disc shape instead of raw boxes
    const discGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.18, 32);
    const matDisc = new THREE.MeshBasicMaterial({
        color: 0xcfa878,
        wireframe: true,
        transparent: true,
        opacity: 0.6
    });

    const innerGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.16, 32);
    const matInner = new THREE.MeshBasicMaterial({
        color: 0xe0c8aa,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
    });

    for(let i = 0; i < count; i++) {
        const discContainer = new THREE.Group();
        
        const outerDisc = new THREE.Mesh(discGeo, matDisc);
        const innerDisc = new THREE.Mesh(innerGeo, matInner);
        
        discContainer.add(outerDisc);
        discContainer.add(innerDisc);

        discContainer.position.y = (count / 2 - i) * 0.55;
        discContainer.userData = {
            initRotX: (Math.random() - 0.5) * 0.6,
            initRotZ: (Math.random() - 0.5) * 0.6,
            idx: i
        };

        discContainer.rotation.x = discContainer.userData.initRotX;
        discContainer.rotation.z = discContainer.userData.initRotZ;

        spineGroup.add(discContainer);
        discs.push(discContainer);
    }

    // Glowing Central Nerve Cord
    const cordGeo = new THREE.CylinderGeometry(0.08, 0.08, count * 0.6, 16);
    const cordMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    const cord = new THREE.Mesh(cordGeo, cordMat);
    spineGroup.add(cord);

    scene.add(spineGroup);

    let spineScrollProgress = 0;
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.create({
            trigger: '.spine-chapter', start: 'top 80%', end: 'bottom 20%', scrub: 1,
            onUpdate: self => { spineScrollProgress = self.progress; }
        });
    }

    const clock = new THREE.Clock();
    function animateSpine() {
        const t = clock.getElapsedTime();

        // Discs rotate towards perfect alignment as user scrolls
        discs.forEach(disc => {
            const factor = 1 - Math.min(1, spineScrollProgress * 1.2);
            disc.rotation.x = disc.userData.initRotX * factor;
            disc.rotation.z = disc.userData.initRotZ * factor;
            disc.rotation.y = Math.sin(t * 1.5 + disc.userData.idx * 0.3) * 0.1;
        });

        spineGroup.rotation.y = t * 0.25;

        renderer.render(scene, camera);
        requestAnimationFrame(animateSpine);
    }
    animateSpine();

    function resizeSpine() {
        if (!parent) return;
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }

    window.addEventListener('resize', resizeSpine);
})();

console.log('%c REJUVEN CLINIC — 3D System Ready ', 'background: #0a0a0a; color: #cfa878; font-size: 14px; padding: 8px 16px;');
