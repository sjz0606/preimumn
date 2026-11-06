// Uch o'lchamli sahna: oltin zarralardan logo, keyin haqiqiy videolar halqasi va qora ko'zgu pol.
import * as THREE from '../vendor/three.module.min.js';

const R = 6, H = 5.2, FLOOR = -2.72;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

/* Do'kon videosidagi haqiqiy logotip kadridan oltin nuqtalar uchun koordinata olinadi. */
async function sampleLogo(count) {
  const img = new Image(); img.src = 'assets/logo-mask.webp';
  await img.decode();
  const W = img.naturalWidth, Hc = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = W; c.height = Hc;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, W, Hc).data;
  const pts = [];
  const text = [];
  for (let py = 0; py < Hc; py++) for (let px = 0; px < W; px++) if (d[(py * W + px) * 4] > 95) (py > Hc * 0.72 ? text : pts).push(px, py);
  const out = new Float32Array(count * 3);
  const k = 4.5 / Hc; // logo balandligi sahna birligida
  for (let i = 0; i < count; i++) {
    const src = i % 3 === 0 ? text : pts;
    const j = Math.floor(Math.random() * (src.length / 2)) * 2;
    out[i * 3] = (src[j] - W / 2 + Math.random()) * k;
    out[i * 3 + 1] = -(src[j + 1] - Hc / 2 + Math.random()) * k;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.09;
  }
  return out;
}

function panelGeometry(arc) {
  const seg = 28;
  const g = new THREE.PlaneGeometry(1, 1, seg, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) + 0.5, v = p.getY(i) + 0.5;
    const a = (u - 0.5) * arc;
    p.setXYZ(i, R * Math.sin(a), (v - 0.5) * H, R * Math.cos(a));
  }
  g.computeBoundingSphere();
  return g;
}

const PANEL_VS = /* glsl */`
  varying vec2 vUv;
  uniform float uPush, uMirror, uFloor;
  void main(){
    vUv = uv;
    vec3 p = position;
    p.xz *= 1.0 + 0.06 * uPush;
    if (uMirror > 0.5) p.y = 2.0 * uFloor - p.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;

const PANEL_FS = /* glsl */`
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform float uFocus, uReveal, uMirror, uHas, uFade;
  uniform vec2 uCrop;
  void main(){
    float wipe = smoothstep(0.0, 0.06, uReveal * 1.06 - abs(vUv.x - 0.5) * 2.0 * 0.5 - (1.0 - vUv.y) * 0.5);
    vec2 uv = vec2(vUv.x, vUv.y);
    vec3 col = vec3(0.035, 0.03, 0.025);
    if (uHas > 0.5) {
      if (uMirror > 0.5) {
        vec3 s = texture2D(uMap, uv).rgb * 0.4;
        s += texture2D(uMap, uv + vec2(0.006, 0.004)).rgb * 0.15;
        s += texture2D(uMap, uv + vec2(-0.006, 0.004)).rgb * 0.15;
        s += texture2D(uMap, uv + vec2(0.0, 0.016)).rgb * 0.3;
        col = s;
      } else col = texture2D(uMap, uv).rgb;
    }
    float g = dot(col, vec3(0.3, 0.59, 0.11));
    float amt = mix(0.3, 1.0, uFocus);
    col = mix(vec3(g), col, mix(0.45, 1.0, uFocus)) * amt;
    float a = wipe * uFade;
    if (uMirror > 0.5) {
      a *= smoothstep(0.34, 0.0, vUv.y) * mix(0.16, 0.42, uFocus);
    } else {
      vec2 e = min(vUv, 1.0 - vUv);
      float line = 1.0 - smoothstep(0.0, 0.0035, min(e.x * 0.5625, e.y));
      col = mix(col, vec3(0.62, 0.47, 0.2), line * mix(0.25, 0.85, uFocus));
      col *= mix(0.93, 1.0, smoothstep(0.0, 0.2, vUv.y));
    }
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }`;

export async function createStage(canvas, looks, onActive) {
  let needsFrame = true;
  const small = Math.min(innerWidth, innerHeight) < 620 || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.setClearColor(0x060504, 1);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 80);

  /* Halqa */
  const N = looks.length, step = Math.PI * 2 / N;
  const arc = (H * 9 / 16) / R;
  const geo = panelGeometry(arc);
  const ring = new THREE.Group(); scene.add(ring);
  const loader = new THREE.TextureLoader();
  const panels = looks.map((l, i) => {
    const uni = {
      uMap: { value: null }, uFocus: { value: 0 }, uPush: { value: 0 }, uReveal: { value: 0 }, uFade: { value: 1 },
      uMirror: { value: 0 }, uHas: { value: 0 }, uFloor: { value: FLOOR }, uCrop: { value: new THREE.Vector2(1, 1) },
    };
    const mat = new THREE.ShaderMaterial({ uniforms: uni, vertexShader: PANEL_VS, fragmentShader: PANEL_FS, transparent: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.y = i * step; mesh.userData.i = i; mesh.frustumCulled = false;
    ring.add(mesh);
    const mUni = { ...uni, uMirror: { value: 1 } };
    const mMat = new THREE.ShaderMaterial({ uniforms: mUni, vertexShader: PANEL_VS, fragmentShader: PANEL_FS, transparent: true, side: THREE.BackSide, depthWrite: false });
    const mirror = new THREE.Mesh(geo, mMat);
    mirror.rotation.y = i * step; mirror.frustumCulled = false; mirror.renderOrder = -1;
    ring.add(mirror);
    const p = { uni, mesh, poster: null, focus: 0 };
    loader.load(l.poster, t => {
      t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
      p.poster = t;
      if (!uni.uMap.value) { uni.uMap.value = t; uni.uHas.value = 1; }
      needsFrame = true;
    });
    return p;
  });

  /* Pol: halqa ostidagi qora ko'zgu ustida nozik iliq nur */
  const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uA: { value: 0 } },
    vertexShader: 'varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 vP;uniform float uA;void main(){float d=length(vP-vec2(0.,-6.));float g=exp(-d*d*.07)*.1;gl_FragColor=vec4(vec3(.72,.53,.25)*g,uA);
#include <colorspace_fragment>
}`,
  }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR; floor.renderOrder = -2; scene.add(floor);

  /* Temir halqalar: zarralar yig'ilgach ko'rinadigan oltin ip */
  const railMat = new THREE.MeshBasicMaterial({ color: 0x9a7a3a, transparent: true, opacity: 0 });
  const railGeo = new THREE.TorusGeometry(R * 1.07, 0.009, 6, 200);
  [H / 2 + 0.13, -H / 2 - 0.02].forEach(y => { const t = new THREE.Mesh(railGeo, railMat); t.rotation.x = Math.PI / 2; t.position.y = y; scene.add(t); });

  /* Oltin zarralar */
  const logoPlane = new THREE.Mesh(new THREE.PlaneGeometry(4.5 * 695 / 735, 4.5), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  logoPlane.position.set(0, 0.42, 8.2); scene.add(logoPlane);
  loader.load('assets/logo-gold.webp', t => { t.colorSpace = THREE.SRGBColorSpace; logoPlane.material.map = t; logoPlane.material.needsUpdate = true; });
  const COUNT = small ? 12000 : 26000;
  const logo = await sampleLogo(COUNT);
  const aS = new Float32Array(COUNT * 3), aR = new Float32Array(COUNT * 3), aSeed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 9, y = (Math.random() - 0.5) * 11;
    aS[i * 3] = Math.cos(a) * r; aS[i * 3 + 1] = y; aS[i * 3 + 2] = Math.sin(a) * r + 5;
    const ang = Math.random() * Math.PI * 2, top = i % 2 ? 1 : 0;
    const ry = top ? H / 2 + 0.13 : -H / 2 - 0.02;
    aR[i * 3] = Math.sin(ang) * R * 1.07 + (Math.random() - 0.5) * 0.05;
    aR[i * 3 + 1] = ry + (Math.random() - 0.5) * 0.05;
    aR[i * 3 + 2] = Math.cos(ang) * R * 1.07 + (Math.random() - 0.5) * 0.05;
    aSeed[i] = Math.random();
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(logo, 3));
  pg.setAttribute('aS', new THREE.BufferAttribute(aS, 3));
  pg.setAttribute('aR', new THREE.BufferAttribute(aR, 3));
  pg.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
  const pu = {
    uForm: { value: 0 }, uMorph: { value: 0 }, uTime: { value: 0 }, uPx: { value: 1 }, uLogo: { value: new THREE.Vector4(0, 0.42, 8.2, 1) },
    uSpin: { value: new THREE.Vector2() },
  };
  const pts = new THREE.Points(pg, new THREE.ShaderMaterial({
    uniforms: pu, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec3 aS; attribute vec3 aR; attribute float aSeed;
      uniform float uForm,uMorph,uTime,uPx; uniform vec4 uLogo; uniform vec2 uSpin;
      varying float vG; varying float vA;
      mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
      mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
      void main(){
        vec3 t = position * uLogo.w;
        t = ry(uSpin.x) * rx(uSpin.y) * t;
        t += uLogo.xyz;
        t += 0.012 * vec3(sin(uTime*1.3+aSeed*40.), cos(uTime*1.1+aSeed*70.), sin(uTime*.9+aSeed*90.));
        float f = smoothstep(aSeed*.55, aSeed*.55+.45, uForm);
        vec3 s = aS + vec3(sin(uTime*.25+aSeed*9.), cos(uTime*.2+aSeed*7.), 0.)*.25;
        vec3 p = mix(s, t, f);
        float m = smoothstep(aSeed*.5, aSeed*.5+.5, uMorph);
        float fl = uTime*.035;
        vec3 r = ry(fl) * aR;
        vec3 mid = mix(p, r, m);
        mid += (1.-abs(m*2.-1.)) * vec3(sin(aSeed*50.),cos(aSeed*31.),sin(aSeed*17.)) * 1.3;
        vec4 mv = modelViewMatrix * vec4(mid,1.);
        float sweep = pow(.5+.5*sin(position.x*1.4+position.y*.9-uTime*1.5), 10.);
        vG = sweep*(1.-m) + aSeed*.22 + (.35+.35*sin(uTime*1.7+aSeed*80.))*m;
        vA = mix(.1+.45*f, .6, m);
        gl_PointSize = uPx * mix(1.15, 1.3, m) * (.72+aSeed*.6) * 7.5 / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying float vG; varying float vA;
      void main(){
        float d = length(gl_PointCoord-.5);
        if (d>.5) discard;
        float a = smoothstep(.5,.12,d);
        vec3 c = mix(vec3(.66,.44,.15), vec3(1.,.89,.56), clamp(vG,0.,1.));
        gl_FragColor = vec4(c, a*vA);
        #include <colorspace_fragment>
      }`,
  }));
  pts.frustumCulled = false; scene.add(pts);

  /* Video bitta element orqali faqat faol panelga beriladi */
  const video = document.createElement('video');
  Object.assign(video, { muted: true, loop: true, playsInline: true, preload: 'auto', crossOrigin: 'anonymous' });
  video.setAttribute('playsinline', ''); video.setAttribute('muted', '');
  const vTex = new THREE.VideoTexture(video);
  vTex.colorSpace = THREE.SRGBColorSpace; vTex.minFilter = THREE.LinearFilter; vTex.generateMipmaps = false;
  let vFor = -1, vWanted = -1, vTimer = 0;
  function toPoster() { if (vFor >= 0) { const p = panels[vFor]; if (p.poster) p.uni.uMap.value = p.poster; vFor = -1; } }
  video.addEventListener('playing', () => {
    if (vWanted < 0) return;
    if (vFor !== vWanted) { toPoster(); vFor = vWanted; panels[vFor].uni.uMap.value = vTex; panels[vFor].uni.uHas.value = 1; }
  });
  function setVideo(i) {
    if (i === vWanted) return;
    vWanted = i; clearTimeout(vTimer);
    toPoster();
    video.pause();
    if (i < 0) return;
    vTimer = setTimeout(() => {
      video.src = looks[i].video; video.load();
      const pr = video.play(); if (pr && pr.catch) pr.catch(() => {});
    }, 260);
  }

  /* Sichqoncha va o'lcham */
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  let portrait = false;
  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w / h; portrait = w / h < 0.8;
    cam.fov = portrait ? 50 : 45;
    cam.updateProjectionMatrix();
    pu.uPx.value = h * renderer.getPixelRatio() / 700;
    // Logo tor ekranga sig'ishi uchun kichrayadi: kamera logodan 5.8 birlik uzoqda
    const vh = 2 * Math.tan(cam.fov * Math.PI / 360) * 5.8;
    pu.uLogo.value.w = Math.min(vh * 0.62 / 4.5, (vh * cam.aspect * 0.8) / (4.5 * 0.945));
    logoPlane.scale.setScalar(pu.uLogo.value.w);
    needsFrame = true;
  }
  addEventListener('resize', resize);

  /* Holat: tashqaridan beriladi */
  const state = { hero: 0, station: 0, outro: 0, visible: true, form: 0 };
  let current = -1, last = performance.now(), running = true;
  const t0 = performance.now();
  resize();

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (!state.visible && !needsFrame) return;
    needsFrame = false;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = (now - t0) / 1000;
    mouse.sx += (mouse.x - mouse.sx) * (1 - Math.exp(-dt * 3));
    mouse.sy += (mouse.y - mouse.sy) * (1 - Math.exp(-dt * 3));

    // Kirish: zarralar 2.6 soniyada yig'iladi
    state.form = smooth(0.15, 2.8, t);
    pu.uForm.value = state.form; pu.uTime.value = t;
    const h = state.hero; // 0 logo, 1 halqa
    pu.uMorph.value = smooth(0.02, 0.8, h);
    pu.uSpin.value.set(mouse.sx * 0.34 + Math.sin(t * 0.35) * 0.09, mouse.sy * 0.16);
    logoPlane.rotation.set(pu.uSpin.value.y, pu.uSpin.value.x, 0, 'YXZ');
    logoPlane.material.opacity = smooth(1.6, 3.4, t) * 0.8 * (1 - smooth(0, 0.14, h));
    logoPlane.visible = h < 0.16;

    const camZ = lerp(14, portrait ? 14.3 : 15, smooth(0, 1, h));
    const camY = lerp(0.1, portrait ? -0.72 : -0.3, smooth(0.15, 1, h));
    const side = cam.aspect > 1.2 ? -1.5 * smooth(0.3, 1, h) * (1 - state.outro) : 0;
    cam.position.set(side + mouse.sx * (0.18 + h * 0.1), camY - mouse.sy * 0.08 + state.outro * 2.6, camZ + state.outro * 1.5);
    cam.lookAt(side + mouse.sx * 0.03, camY - state.outro * 0.7, 0);

    ring.rotation.y = -state.station * step + mouse.sx * 0.03 + (1 - smooth(0.4, 1, h)) * 0.8;
    const reveal = smooth(0.3, 0.95, h);
    floor.material.uniforms.uA.value = reveal;
    railMat.opacity = reveal * 0.62 * (1 - state.outro);
    const active = Math.round(state.station);
    const settled = Math.abs(state.station - active) < 0.2 && h > 0.96 && state.outro < 0.5;
    if (active !== current) { current = active; onActive && onActive(active); }
    setVideo(settled ? active : -1);
    panels.forEach((p, i) => {
      let dist = Math.abs(i - state.station); dist = Math.min(dist, N - dist);
      const target = clamp(1 - dist * 1.6);
      p.focus += (target - p.focus) * (1 - Math.exp(-dt * 7));
      p.uni.uFocus.value = p.focus * 1;
      p.uni.uPush.value = p.focus;
      p.uni.uReveal.value = reveal;
      p.uni.uFade.value = 1 - state.outro;
    });
    renderer.render(scene, cam);
  }
  requestAnimationFrame(frame);

  const ray = new THREE.Raycaster();
  return {
    state,
    pick(cx, cy) {
      const r = canvas.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1), cam);
      const hit = ray.intersectObjects(panels.map(p => p.mesh), false)[0];
      return hit ? hit.object.userData.i : -1;
    },
    pauseVideo(v) { if (v) video.pause(); else if (vFor >= 0) video.play().catch(() => {}); },
    destroy() { running = false; renderer.dispose(); },
  };
}
