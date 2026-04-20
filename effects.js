// ============================================================
// Hero WebGL background — wireframe icosahedron distorted by
// simplex-ish noise, plus a soft particle field. Three.js via
// CDN. Graceful no-op when WebGL or reduced-motion unavailable.
// ============================================================

(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof THREE === 'undefined') return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = () => canvas.clientWidth;
  const h = () => canvas.clientHeight;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power'
  });
  renderer.setPixelRatio(dpr);
  renderer.setSize(w(), h(), false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050608, 0.08);

  const camera = new THREE.PerspectiveCamera(42, w() / h(), 0.1, 60);
  camera.position.set(0, 0, 7);

  // --- Distorted wireframe globe -----------------------------
  const globeGeo = new THREE.IcosahedronGeometry(2.2, 5);
  const globeMat = new THREE.ShaderMaterial({
    transparent: true,
    wireframe: true,
    uniforms: {
      uTime: { value: 0 },
      uAmp:  { value: 0.22 },
      uColorA: { value: new THREE.Color('#d9ff4c') },
      uColorB: { value: new THREE.Color('#4ad8ff') }
    },
    vertexShader: /* glsl */`
      uniform float uTime;
      uniform float uAmp;
      varying float vN;

      // lightweight 3D hash-noise — cheap but looks organic
      vec3 hash3(vec3 p) {
        p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
                 dot(p, vec3(269.5, 183.3, 246.1)),
                 dot(p, vec3(113.5, 271.9, 124.6)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }
      float noise(vec3 p) {
        vec3 i = floor(p); vec3 f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
                  dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
              mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
                  dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
          mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
                  dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
              mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
                  dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y),
          u.z);
      }

      void main() {
        float n = noise(position * 0.9 + uTime * 0.18);
        vec3 displaced = position + normal * n * uAmp;
        vN = n;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying float vN;
      void main() {
        vec3 c = mix(uColorB, uColorA, smoothstep(-0.3, 0.5, vN));
        float a = 0.55 + 0.35 * smoothstep(-0.5, 0.9, vN);
        gl_FragColor = vec4(c, a);
      }
    `
  });
  const globe = new THREE.Mesh(globeGeo, globeMat);
  globe.position.x = 1.2;
  scene.add(globe);

  // --- Particle field ----------------------------------------
  const COUNT = 600;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = 4 + Math.random() * 6;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    positions[i*3+0] = r * Math.sin(p) * Math.cos(t);
    positions[i*3+1] = r * Math.sin(p) * Math.sin(t) * 0.45;
    positions[i*3+2] = r * Math.cos(p);
  }
  const particlesGeo = new THREE.BufferGeometry();
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particlesMat = new THREE.PointsMaterial({
    size: 0.016,
    color: 0xf4f3ee,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
    depthWrite: false
  });
  const particles = new THREE.Points(particlesGeo, particlesMat);
  scene.add(particles);

  // --- Pointer parallax --------------------------------------
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth - 0.5) * 0.6;
    pointer.ty = (e.clientY / window.innerHeight - 0.5) * 0.6;
  });

  // --- Resize ------------------------------------------------
  function resize() {
    renderer.setSize(w(), h(), false);
    camera.aspect = w() / h();
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // --- Render loop (throttled, pauses offscreen) -------------
  let visible = true;
  const io = new IntersectionObserver(
    (entries) => entries.forEach(e => (visible = e.isIntersecting)),
    { threshold: 0 }
  );
  io.observe(canvas);

  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();

    globeMat.uniforms.uTime.value = t;
    globe.rotation.y = t * 0.15;
    globe.rotation.x = Math.sin(t * 0.2) * 0.15;

    particles.rotation.y = t * 0.02;
    particles.rotation.x = Math.sin(t * 0.05) * 0.08;

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    camera.position.x = pointer.x * 0.8;
    camera.position.y = -pointer.y * 0.6;
    camera.lookAt(globe.position);

    renderer.render(scene, camera);
  }
  tick();
})();
