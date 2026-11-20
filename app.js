/**
 * HYDROLOOP 2040 — AI-POWERED CIRCULAR WATER MANAGEMENT CITY
 * Udon Thani 3D City Map Edition
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initHeroCanvas();
  initHeroStats();
  init3DCity();
  initDashboardGauges();
  initDashboardCharts();
  initAIInsights();
  initSimulation();
  initImpactSection();
});

/* ═══════════════════════════════════════════════════════════════
   NAVBAR & SCROLL SPY
   ═══════════════════════════════════════════════════════════════ */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    let cur = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) cur = s.id; });
    links.forEach(l => l.classList.toggle('active', l.dataset.section === cur));
  });

  navToggle?.addEventListener('click', () => navLinks.classList.toggle('open'));
  links.forEach(l => l.addEventListener('click', () => navLinks.classList.remove('open')));
}

/* ═══════════════════════════════════════════════════════════════
   HERO CANVAS — WATER PARTICLE NETWORK
   ═══════════════════════════════════════════════════════════════ */
function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });

  const N = Math.min(60, W > 768 ? 70 : 35);
  const pts = Array.from({ length: N }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: Math.random() * 2 + 1,
    vx: (Math.random() - 0.5) * 0.6, vy: -Math.random() * 0.7 - 0.2,
    a: Math.random() * 0.5 + 0.2, p: Math.random() * Math.PI * 2
  }));
  let mx = W / 2, my = H / 2;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  (function render() {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(mx, my, 50, W / 2, H / 2, W);
    g.addColorStop(0, 'rgba(0,212,255,0.07)');
    g.addColorStop(1, 'rgba(7,13,23,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    pts.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.p += 0.03;
      if (p.y < -10) p.y = H + 10;
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      const r = Math.max(0.5, p.r + Math.sin(p.p) * 0.5);
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,212,255,${p.a})`; ctx.shadowBlur = 8; ctx.shadowColor = '#00d4ff'; ctx.fill(); ctx.shadowBlur = 0;
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 110) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = `rgba(0,212,255,${0.12 * (1 - d / 110)})`; ctx.lineWidth = 0.6; ctx.stroke(); }
      }
    });
    requestAnimationFrame(render);
  })();
}

/* ═══════════════════════════════════════════════════════════════
   HERO STAT COUNTER
   ═══════════════════════════════════════════════════════════════ */
function initHeroStats() {
  const els = document.querySelectorAll('.stat-num');
  let done = false;
  new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting || done) return;
    done = true;
    els.forEach(el => {
      const target = +el.dataset.target, sfx = el.dataset.suffix || '', t0 = performance.now();
      (function tick(now) {
        const p = Math.min((now - t0) / 1800, 1), ease = 1 - (1 - p) * (1 - p);
        el.textContent = Math.floor(ease * target).toLocaleString() + sfx;
        if (p < 1) requestAnimationFrame(tick); else el.textContent = target.toLocaleString() + sfx;
      })(t0);
    });
  }, { threshold: 0.3 }).observe(document.getElementById('home'));
}

/* ═══════════════════════════════════════════════════════════════
   3D CITY — UDON THANI MAP (THREE.JS)
   Layout reference:
     • หนองประจักษ์ศิลปาคม (Nong Prajak): center, oval lake
     • ถนนมิตรภาพ (Mittraphap Rd): north-south axis (left side)
     • ถนนโพศรี (Phosri Rd): east-west (bottom area)
     • สนามบินอุดรธานี (Airport): top-left
     • ศาลากลาง (City Hall): center-right of park
     • โรงพยาบาลอุดรธานี (Hospital): center
     • สถานีรถไฟ (Train Station): bottom-center
     • Central Plaza / ห้างสรรพสินค้า: NE
     • ตลาดหนองบัว (Nong Bua Market): south-west
   ═══════════════════════════════════════════════════════════════ */
function init3DCity() {
  const container = document.querySelector('.city3d-container');
  const canvas = document.getElementById('cityCanvas');
  if (!container || !canvas || typeof THREE === 'undefined') return;

  /* ── Scene setup ── */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060c18);
  scene.fog = new THREE.FogExp2(0x070e1c, 0.012);

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  /* ── Lights ── */
  scene.add(new THREE.AmbientLight(0x0d1f36, 2.2));
  const sun = new THREE.DirectionalLight(0x88ccff, 1.6);
  sun.position.set(20, 60, 30); sun.castShadow = true; scene.add(sun);
  scene.add(new THREE.HemisphereLight(0x00d4ff, 0x07111e, 0.6));

  /* ── Ground ── */
  const groundGeo = new THREE.PlaneGeometry(160, 160);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x060e1c });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.1;
  scene.add(ground);

  /* ── City street grid (Udon Thani style) ── */
  function addRoad(x1, z1, x2, z2, w) {
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const geo = new THREE.BoxGeometry(w, 0.05, len);
    const mat = new THREE.MeshBasicMaterial({ color: 0x0e1f35 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((x1 + x2) / 2, 0.01, (z1 + z2) / 2);
    mesh.rotation.y = -Math.atan2(dz, dx) + Math.PI / 2;
    scene.add(mesh);
    // white dashes
    const lineGeo = new THREE.BoxGeometry(0.4, 0.06, 1.5);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x1a3550 });
    const steps = Math.floor(len / 5);
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const lx = x1 + dx * t, lz = z1 + dz * t;
      const lm = new THREE.Mesh(lineGeo, lineMat);
      lm.position.set(lx, 0.03, lz);
      lm.rotation.y = -Math.atan2(dz, dx) + Math.PI / 2;
      scene.add(lm);
    }
  }

  // Major roads — Udon Thani grid
  // Mittraphap Rd (NS, left): x≈-28
  addRoad(-28, -65, -28, 65, 3.5);
  // Phosri Rd (EW, south): z≈25
  addRoad(-65, 25, 65, 25, 3);
  // Prajak Rd (EW, north of park): z≈-10
  addRoad(-65, -10, 65, -10, 2.5);
  // Udon-Dutsadi Rd (NS, right): x≈12
  addRoad(12, -65, 12, 65, 2.5);
  // Watnong Rd (diagonal): shortcut
  addRoad(-28, -10, 12, 25, 2);
  // Thesa Rd (EW center-south): z≈42
  addRoad(-65, 42, 65, 42, 2);
  // Airport road (NS far left): x≈-50
  addRoad(-50, -65, -50, 20, 2);
  // Cross streets
  addRoad(-65, -32, 65, -32, 2);
  addRoad(-65, 55, 65, 55, 2);
  addRoad(35, -65, 35, 65, 2);
  addRoad(-15, -65, -15, 65, 2);

  /* ── Nong Prajak Reservoir (หนองประจักษ์) — central lake ── */
  const lakeGeo = new THREE.EllipseGeometry(18, 11, 48);
  const lakeMat = new THREE.MeshBasicMaterial({ color: 0x0d4f8c });
  const lake = new THREE.Mesh(lakeGeo, lakeMat);
  lake.rotation.x = -Math.PI / 2; lake.position.set(-8, 0.08, 7);
  scene.add(lake);

  // Lake glowing ring
  const lakeRingGeo = new THREE.RingGeometry(18.5, 20, 48);
  const lakeRingMat = new THREE.MeshBasicMaterial({ color: 0x005fa3, side: THREE.DoubleSide });
  const lakeRing = new THREE.Mesh(lakeRingGeo, lakeRingMat);
  lakeRing.rotation.x = -Math.PI / 2; lakeRing.position.set(-8, 0.1, 7);
  scene.add(lakeRing);

  // Water shimmer particles above lake
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 15;
    const sg = new THREE.SphereGeometry(0.3, 6, 6);
    const sm = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
    const sp = new THREE.Mesh(sg, sm);
    sp.position.set(-8 + Math.cos(a) * r * 1.5, 0.3 + Math.random() * 0.5, 7 + Math.sin(a) * r * 0.9);
    scene.add(sp);
  }

  /* ── Park around lake ── */
  const groupGreen = new THREE.Group();
  const parkGeo = new THREE.EllipseGeometry(22, 15, 48);
  const parkMat = new THREE.MeshLambertMaterial({ color: 0x0a3d1e });
  const park = new THREE.Mesh(parkGeo, parkMat);
  park.rotation.x = -Math.PI / 2; park.position.set(-8, 0.05, 7);
  groupGreen.add(park);

  // Trees around park
  const treePositions = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const jx = (Math.random() - 0.5) * 6, jz = (Math.random() - 0.5) * 4;
    treePositions.push([-8 + Math.cos(a) * 20 + jx, 7 + Math.sin(a) * 13 + jz]);
  }
  treePositions.forEach(([tx, tz]) => {
    const h = 1.5 + Math.random() * 1.5;
    const tg = new THREE.ConeGeometry(0.9, h, 6);
    const tm = new THREE.MeshLambertMaterial({ color: 0x0f6b3a });
    const t = new THREE.Mesh(tg, tm);
    t.position.set(tx, h / 2, tz);
    groupGreen.add(t);
    // Trunk
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.6, 5), new THREE.MeshBasicMaterial({ color: 0x3d2008 }));
    tr.position.set(tx, 0.3, tz);
    groupGreen.add(tr);
  });
  scene.add(groupGreen);

  /* ── Layer groups ── */
  const groupBuildings = new THREE.Group();
  const groupWaterPipes = new THREE.Group();
  const groupSensors = new THREE.Group();
  scene.add(groupBuildings);
  scene.add(groupWaterPipes);
  scene.add(groupSensors);

  /* ── Helper: glowing building ── */
  function makeBuilding(w, h, d, color, emissive = null) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x0a1628,
      emissive: emissive || 0x001133,
      emissiveIntensity: 0.15,
      flatShading: true
    });
    const mesh = new THREE.Mesh(geo, mat);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: color || 0x1a3a5c })
    );
    mesh.add(edges);
    return mesh;
  }

  function addLandmark(data) {
    const { pos, size, color, userData } = data;
    const mesh = makeBuilding(size[0], size[1], size[2], color);
    mesh.position.set(pos[0], size[1] / 2, pos[1]);
    mesh.userData = userData;

    // Glowing roof cap
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(size[0] * 0.85, 0.5, size[2] * 0.85),
      new THREE.MeshBasicMaterial({ color })
    );
    cap.position.y = size[1] / 2 + 0.3; mesh.add(cap);

    // Vertical beacon beam
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 6, 6),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 })
    );
    beam.position.y = size[1] / 2 + 3.5; mesh.add(beam);

    groupBuildings.add(mesh);
    return mesh;
  }

  /* ── UDON THANI LANDMARKS with HYDROLOOP systems ── */
  const interactableObjects = [];

  // 1. ศาลากลางจังหวัด (City Hall) — ECO-BRAIN AI Center
  interactableObjects.push(addLandmark({
    pos: [18, -5], size: [9, 28, 9], color: 0xa855f7,
    userData: {
      name: 'ศาลากลางจังหวัดอุดรธานี — ECO-BRAIN', icon: '🧠',
      desc: 'ติดตั้ง ECO-BRAIN AI Center ศูนย์กลางประมวลผลข้อมูลน้ำทั้งจังหวัด ควบคุมระบบ HYDROLOOP ทั้งหมดจากจุดเดียว',
      stats: { 'ระบบที่เชื่อมต่อ': '5 ระบบ', 'IoT Nodes': '48 จุด', 'AI Confidence': '94%', 'ความล่าช้า': '12ms' }
    }
  }));

  // 2. โรงพยาบาลอุดรธานี (Hospital) — AIR2ROOT Hub
  interactableObjects.push(addLandmark({
    pos: [-2, -20], size: [10, 20, 10], color: 0x00d4ff,
    userData: {
      name: 'โรงพยาบาลอุดรธานี — AIR2ROOT', icon: '❄️',
      desc: 'ระบบ AIR2ROOT รวบรวมน้ำควบแน่นจากเครื่องปรับอากาศทุกชั้น เฉลี่ย 340 ลิตรต่อวัน ส่งเข้าระบบหมุนเวียนน้ำสำหรับรดน้ำสวนและล้างพื้น',
      stats: { 'น้ำควบแน่น/วัน': '340 ลิตร', 'เครื่องแอร์': '84 เครื่อง', 'ประหยัดพลังงาน': '18%', 'สถานะ': 'Online' }
    }
  }));

  // 3. สนามบินอุดรธานี (Airport) — RAIN BANK Station
  interactableObjects.push(addLandmark({
    pos: [-50, -45], size: [22, 8, 12], color: 0x3b82f6,
    userData: {
      name: 'สนามบินอุดรธานี — RAIN BANK', icon: '🌧️',
      desc: 'ระบบ RAIN BANK ขนาดใหญ่ รวบรวมน้ำฝนจากหลังคาอาคารผู้โดยสารขนาด 15,000 m² กรอง 3 ชั้น กักเก็บในถังใต้ดิน',
      stats: { 'ความจุ': '15,000 ลิตร', 'ระดับน้ำ': '78%', 'อัตรากรอง': '25 L/min', 'คุณภาพน้ำ': 'A+' }
    }
  }));

  // 4. Central Plaza (ห้างสรรพสินค้า) — SPONGE CITY Demo
  interactableObjects.push(addLandmark({
    pos: [35, -20], size: [14, 18, 14], color: 0x10b981,
    userData: {
      name: 'Central Plaza อุดรธานี — SPONGE CITY', icon: '🌿',
      desc: 'ลานจอดรถซึมน้ำได้และสวนหย่อมรับน้ำโดยรอบอาคาร ลดน้ำท่วมขังในบริเวณห้างฯ ได้ 70% และส่งน้ำซึมเข้าสู่ชั้นดิน',
      stats: { 'พื้นที่ซึมน้ำ': '3,200 m²', 'ความชื้นดิน': '62%', 'น้ำซึม/ฝน': '4,500 ลิตร', 'ป้องกันน้ำท่วม': '70%' }
    }
  }));

  // 5. สถานีรถไฟอุดรธานี (Train Station) — AQUA-GUARD Hub
  interactableObjects.push(addLandmark({
    pos: [-5, 50], size: [14, 10, 8], color: 0x14b8a6,
    userData: {
      name: 'สถานีรถไฟอุดรธานี — AQUA-GUARD', icon: '📡',
      desc: 'ศูนย์รวบรวมข้อมูลเซนเซอร์ IoT ครอบคลุมพื้นที่โดยรอบ 5 กม. ตรวจค่า pH ความขุ่น และระดับน้ำในท่อระบายน้ำสาธารณะ',
      stats: { 'pH': '7.2', 'ความขุ่น': '3 NTU', 'รัศมีครอบคลุม': '5 กม.', 'สถานะ': 'Online' }
    }
  }));

  /* ── Ambient city buildings (Udon Thani style: low-rise grid) ── */
  const ambientBlocks = [
    // North area
    { pos: [-40, -50], w: 8, h: 12, d: 8 }, { pos: [-20, -50], w: 7, h: 9, d: 7 },
    { pos: [0, -50], w: 9, h: 15, d: 9 },   { pos: [22, -50], w: 8, h: 10, d: 8 },
    { pos: [42, -50], w: 10, h: 14, d: 10 },
    // South area
    { pos: [-42, 48], w: 7, h: 8, d: 7 },   { pos: [-22, 48], w: 8, h: 11, d: 8 },
    { pos: [22, 48], w: 9, h: 12, d: 9 },   { pos: [42, 48], w: 7, h: 9, d: 7 },
    // East area
    { pos: [52, -40], w: 7, h: 10, d: 7 }, { pos: [52, -15], w: 6, h: 8, d: 6 },
    { pos: [52, 10], w: 8, h: 13, d: 8 },   { pos: [52, 35], w: 7, h: 9, d: 7 },
    // West area (smaller, residential)
    { pos: [-55, -40], w: 6, h: 7, d: 6 }, { pos: [-55, -15], w: 7, h: 8, d: 7 },
    { pos: [-55, 10], w: 6, h: 7, d: 6 },   { pos: [-55, 35], w: 7, h: 9, d: 7 },
    // Mid blocks
    { pos: [-35, -30], w: 6, h: 8, d: 6 },  { pos: [28, -35], w: 7, h: 10, d: 7 },
    { pos: [28, 10], w: 8, h: 12, d: 8 },   { pos: [-35, 38], w: 7, h: 8, d: 7 },
    { pos: [-15, 38], w: 6, h: 7, d: 6 },   { pos: [5, 38], w: 8, h: 10, d: 8 },
    { pos: [-35, -50], w: 6, h: 7, d: 6 },  { pos: [5, -50], w: 7, h: 9, d: 7 },
  ];

  ambientBlocks.forEach(b => {
    const mesh = makeBuilding(b.w, b.h, b.d, 0x152840);
    mesh.position.set(b.pos[0], b.h / 2, b.pos[1]);
    groupBuildings.add(mesh);
  });

  /* ── Nong Bua Market (ตลาดหนองบัว) — small cluster ── */
  [[-38, 30], [-34, 35], [-42, 35], [-38, 42]].forEach(([x, z]) => {
    const mesh = makeBuilding(5, 5, 5, 0xf59e0b);
    mesh.position.set(x, 2.5, z);
    groupBuildings.add(mesh);
  });

  /* ── IoT Sensor Nodes ── */
  const sensorNodes = [];
  const sensorSpots = [
    [18, -5], [-2, -20], [-50, -45], [35, -20], [-5, 50],  // at landmarks
    [-8, 7],             // lake center sensor
    [-20, -30], [5, -30], [28, -50], [-40, 20],             // street sensors
    [0, 25], [25, 25], [-25, 42]                            // zone sensors
  ];

  sensorSpots.forEach(([x, z]) => {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 4, 6),
      new THREE.MeshBasicMaterial({ color: 0x1a3a5c })
    );
    pole.position.set(x, 2, z);
    groupSensors.add(pole);

    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x00d4ff })
    );
    node.position.set(x, 4.3, z);
    groupSensors.add(node);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 1.0, 16),
      new THREE.MeshBasicMaterial({ color: 0x00d4ff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    ring.rotation.x = Math.PI / 2; ring.position.set(x, 4.3, z);
    groupSensors.add(ring);
    sensorNodes.push({ ring, node, ox: x, oz: z });
  });

  /* ── Water pipe network — following Udon Thani roads ── */
  const pipeRoutes = [
    // Hospital AIR2ROOT → lake
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2, 1.5, -20), new THREE.Vector3(-5, 1.5, -5), new THREE.Vector3(-8, 1.5, 7)
    ]),
    // Airport RAIN BANK → lake
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-50, 1.5, -45), new THREE.Vector3(-40, 1.5, -20), new THREE.Vector3(-20, 1.5, 0), new THREE.Vector3(-8, 1.5, 7)
    ]),
    // Lake → City Hall AI
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8, 1.5, 7), new THREE.Vector3(5, 1.5, 0), new THREE.Vector3(18, 1.5, -5)
    ]),
    // City Hall → Central Plaza
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(18, 1.5, -5), new THREE.Vector3(26, 1.5, -12), new THREE.Vector3(35, 1.5, -20)
    ]),
    // Central Plaza → Train Station (reuse)
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(35, 1.5, -20), new THREE.Vector3(20, 1.5, 15), new THREE.Vector3(-5, 1.5, 50)
    ])
  ];

  pipeRoutes.forEach(curve => {
    const tubeGeo = new THREE.TubeGeometry(curve, 40, 0.3, 7, false);
    const tubeMesh = new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({
      color: 0x00d4ff, transparent: true, opacity: 0.3, wireframe: false
    }));
    groupWaterPipes.add(tubeMesh);
  });

  // Animated water drops
  const drops = [];
  pipeRoutes.forEach(curve => {
    for (let d = 0; d < 5; d++) {
      const geo = new THREE.SphereGeometry(0.45, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const mesh = new THREE.Mesh(geo, mat);
      groupWaterPipes.add(mesh);
      drops.push({ mesh, curve, t: d * 0.2, speed: 0.004 + Math.random() * 0.002 });
    }
  });

  /* ── Camera orbit control ── */
  let spherical = { r: 110, theta: 0.9, phi: 0.65 };
  let dragging = false, prev = { x: 0, y: 0 };

  function updateCam() {
    spherical.phi = Math.max(0.12, Math.min(1.4, spherical.phi));
    spherical.r = Math.max(30, Math.min(180, spherical.r));
    camera.position.set(
      spherical.r * Math.sin(spherical.phi) * Math.sin(spherical.theta),
      spherical.r * Math.cos(spherical.phi),
      spherical.r * Math.sin(spherical.phi) * Math.cos(spherical.theta)
    );
    camera.lookAt(0, 3, 0);
  }
  updateCam();

  canvas.addEventListener('mousedown', e => { dragging = true; prev = { x: e.clientX, y: e.clientY }; });
  window.addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('mousemove', e => {
    if (!dragging) return;
    spherical.theta -= (e.clientX - prev.x) * 0.007;
    spherical.phi -= (e.clientY - prev.y) * 0.007;
    updateCam(); prev = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('wheel', e => { e.preventDefault(); spherical.r += e.deltaY * 0.06; updateCam(); }, { passive: false });

  // Touch
  let td0 = 0;
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) { dragging = true; prev = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
    else if (e.touches.length === 2) td0 = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  });
  canvas.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && dragging) {
      spherical.theta -= (e.touches[0].clientX - prev.x) * 0.008;
      spherical.phi -= (e.touches[0].clientY - prev.y) * 0.008;
      updateCam(); prev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      spherical.r += (td0 - d) * 0.1; updateCam(); td0 = d;
    }
  });
  canvas.addEventListener('touchend', () => { dragging = false; });

  /* ── Raycasting: click landmark ── */
  const raycaster = new THREE.Raycaster();
  const mouse2d = new THREE.Vector2();
  const overlay = document.getElementById('cityOverlay');

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    mouse2d.x = ((e.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    mouse2d.y = -((e.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse2d, camera);
    const hits = raycaster.intersectObjects(interactableObjects);
    if (hits.length > 0 && hits[0].object.userData?.name) {
      const d = hits[0].object.userData;
      document.getElementById('overlayIcon').textContent = d.icon;
      document.getElementById('overlayTitle').textContent = d.name;
      document.getElementById('overlayDesc').textContent = d.desc;
      document.getElementById('overlayStats').innerHTML = Object.entries(d.stats)
        .map(([k, v]) => `<div><span style="color:var(--text-muted);font-size:.78rem">${k}</span><br/><strong style="color:var(--accent-cyan)">${v}</strong></div>`).join('');
      overlay.style.display = 'block';
      // Flash
      hits[0].object.material.emissive.setHex(0x00ffff);
      setTimeout(() => hits[0].object.material.emissive.setHex(0x001133), 500);
    }
  });

  document.getElementById('overlayClose')?.addEventListener('click', () => { overlay.style.display = 'none'; });

  /* ── Layer toggles ── */
  document.getElementById('toggleBuildings')?.addEventListener('click', e => { groupBuildings.visible = !groupBuildings.visible; e.currentTarget.classList.toggle('active', groupBuildings.visible); });
  document.getElementById('toggleWater')?.addEventListener('click', e => { groupWaterPipes.visible = !groupWaterPipes.visible; e.currentTarget.classList.toggle('active', groupWaterPipes.visible); });
  document.getElementById('toggleSensors')?.addEventListener('click', e => { groupSensors.visible = !groupSensors.visible; e.currentTarget.classList.toggle('active', groupSensors.visible); });
  document.getElementById('toggleGreen')?.addEventListener('click', e => { groupGreen.visible = !groupGreen.visible; e.currentTarget.classList.toggle('active', groupGreen.visible); });
  document.getElementById('resetCamera')?.addEventListener('click', () => { spherical = { r: 110, theta: 0.9, phi: 0.65 }; updateCam(); });

  /* ── Resize ── */
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  /* ── Animate ── */
  let t0 = performance.now();
  (function animate() {
    requestAnimationFrame(animate);
    const elapsed = (performance.now() - t0) / 1000;

    // Slow auto-rotation when idle
    if (!dragging) { spherical.theta += 0.0005; updateCam(); }

    // Water drops along pipes
    drops.forEach(d => {
      d.t = (d.t + d.speed) % 1;
      d.mesh.position.copy(d.curve.getPointAt(d.t));
    });

    // Sensor pulse
    sensorNodes.forEach((s, i) => {
      const sc = 1 + Math.sin(elapsed * 3 + i * 0.8) * 0.4;
      s.ring.scale.set(sc, sc, 1);
      s.node.material.opacity = 0.6 + Math.sin(elapsed * 2 + i) * 0.4;
    });

    // Lake shimmer
    lakeRing.material.opacity = 0.3 + Math.sin(elapsed * 1.5) * 0.2;

    renderer.render(scene, camera);
  })();
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD GAUGES
   ═══════════════════════════════════════════════════════════════ */
function initDashboardGauges() {
  [['gaugeWater', 72, 100, '#00d4ff'], ['gaugePH', 7.2, 14, '#10b981'],
   ['gaugeTurbidity', 3, 10, '#a855f7'], ['gaugeSoil', 58, 100, '#14b8a6']]
    .forEach(([id, v, mx, c]) => drawGauge(id, v, mx, c));
}

function drawGauge(id, value, max, color) {
  const c = document.getElementById(id); if (!c) return;
  const ctx = c.getContext('2d'), W = c.width, R = W / 2 - 16;
  const s = Math.PI * 0.75, e = Math.PI * 2.25, cur = s + (e - s) * Math.min(value / max, 1);
  ctx.clearRect(0, 0, W, W);
  ctx.beginPath(); ctx.arc(W/2, W/2, R, s, e); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.arc(W/2, W/2, R, s, cur); ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 14; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke(); ctx.shadowBlur = 0;
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD CHARTS
   ═══════════════════════════════════════════════════════════════ */
function initDashboardCharts() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.color = '#94a3b8'; Chart.defaults.font.family = 'Inter';

  const colCtx = document.getElementById('collectionChart');
  if (colCtx) new Chart(colCtx, {
    type: 'line',
    data: {
      labels: ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'],
      datasets: [
        { label: 'รวบรวมน้ำ (L)', data: [9200, 11400, 8500, 7800, 13200, 12000, 10800], borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.1)', fill: true, tension: 0.4, borderWidth: 2, pointBackgroundColor: '#00d4ff' },
        { label: 'นำกลับมาใช้ (L)', data: [8100, 9500, 8000, 7200, 10800, 11200, 9600], borderColor: '#10b981', backgroundColor: 'transparent', tension: 0.4, borderWidth: 2, borderDash: [4, 4], pointBackgroundColor: '#10b981' }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: 'top', labels: { boxWidth: 12 } } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' } } } }
  });

  const pieCtx = document.getElementById('sourceChart');
  if (pieCtx) new Chart(pieCtx, {
    type: 'doughnut',
    data: { labels: ['RAIN BANK', 'AIR2ROOT', 'SPONGE CITY'], datasets: [{ data: [48, 32, 20], backgroundColor: ['#00d4ff', '#38bdf8', '#10b981'], borderWidth: 0, hoverOffset: 6 }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }, cutout: '70%' }
  });
}

/* ═══════════════════════════════════════════════════════════════
   AI INSIGHTS
   ═══════════════════════════════════════════════════════════════ */
function initAIInsights() {
  const box = document.getElementById('aiInsightBox');
  const recs = document.getElementById('aiRecommendations');
  const pool = [
    {
      text: '⚡ คาดฝนตกหนักอีก 14 ชม. (82%) — แนะนำระบาย RAIN BANK ล่วงหน้า 18% เพื่อเตรียมรองรับน้ำฝนรอบใหม่',
      actions: ['เปิดวาล์ว V-03 ระบาย 350 ลิตรไปรดสวนหนองประจักษ์', 'ตั้ง SPONGE CITY เป็นโหมด Retention Buffer', 'แจ้งเตือน IoT บริเวณพื้นที่ลุ่มต่ำทั่วอุดรธานี']
    },
    {
      text: '☀️ ความชื้นดินในสวนหนองประจักษ์ลดเหลือ 42% — ผันน้ำควบแน่นจากแอร์โรงพยาบาล (AIR2ROOT) มารดน้ำทันที',
      actions: ['ผันน้ำ AIR2ROOT 240 ลิตร → ระบบรากต้นไม้ (Sub-irrigation)', 'ประหยัดน้ำประปาได้ 100% สำหรับรอบบ่าย', 'เซนเซอร์คาดความชื้นฟื้นสู่ 60% ใน 2 ชั่วโมง']
    },
    {
      text: '🔬 คุณภาพน้ำฝนล่าสุด 2.8 NTU — ระดับ A+ ข้ามขั้นตอนบำบัดรอง ประหยัดพลังงานปั๊ม 14%',
      actions: ['เติมถังดับเพลิงสำรองสถานีรถไฟอุดรธานีครบ 100%', 'บันทึกคุณภาพน้ำลง Digital Twin', 'แจ้ง AI ปรับลดรอบกรองน้ำสัปดาห์หน้า']
    }
  ];
  let idx = 0;
  function update() {
    const c = pool[idx]; idx = (idx + 1) % pool.length;
    if (box) box.innerHTML = `<div style="color:var(--text-main)"><span style="color:var(--accent-cyan);font-weight:700">AQUA-PREDICT:</span><br/>${c.text}</div>`;
    if (recs) recs.innerHTML = c.actions.map(a => `<div class="ai-rec-item">✓ ${a}</div>`).join('');
  }
  update();
  document.getElementById('refreshInsight')?.addEventListener('click', () => {
    if (box) box.innerHTML = `<div class="ai-thinking"><div class="ai-pulse"></div><span>AI กำลังวิเคราะห์...</span></div>`;
    setTimeout(update, 700);
  });
}

/* ═══════════════════════════════════════════════════════════════
   SIMULATION
   ═══════════════════════════════════════════════════════════════ */
function initSimulation() {
  const screen = document.getElementById('simScreen');
  const metrics = document.getElementById('simMetrics');
  const allocPanel = document.getElementById('allocationPanel');

  const data = {
    'heavy-rain': { title: '⛈️ ฝนตกหนัก', desc: 'ฝน 85 มม./ชม. ระบบ Sponge City + Rain Bank ทำงานเต็มกำลัง', actions: ['SPONGE CITY กักน้ำ 4,200 L/ชม.', 'RAIN BANK เปิดดักน้ำ 84 จุดทั่วอุดรธานี', 'AI ลดน้ำท่วมขังบนถนนสายหลักลง 88%'], water: ['95%','95%'], ai: ['98%','Instant 0.4s'], flood: ['12%','12% (ปลอดภัย)'] },
    'drought': { title: '☀️ ภัยแล้ง', desc: 'ไม่มีฝน 21 วัน อุณหภูมิ 36°C ระบบเปลี่ยนสู่โหมดอนุรักษ์น้ำ', actions: ['AIR2ROOT รวบรวมน้ำแอร์ 420 L/วัน ชดเชยการขาดแคลน', 'AI จ่ายน้ำระบบหยดใต้ดินเฉพาะจุดวิกฤต', 'สำรองน้ำพอใช้อีก 45 วัน ไม่ต้องพึ่งน้ำประปา'], water: ['42%','42%'], ai: ['90%','Eco-Mode 1.2s'], flood: ['2%','0% (ไม่มี)'] },
    'low-soil': { title: '🏜️ ความชื้นดินต่ำ', desc: 'เซนเซอร์ตรวจพบความชื้นดินต่ำกว่า 30% ในสวนหนองประจักษ์', actions: ['AQUA-GUARD ส่งสัญญาณเตือนไปยัง ECO-BRAIN', 'AI วิเคราะห์ไม่มีฝน 48 ชม. จ่ายน้ำสำรอง 650 L ทันที', 'ความชื้นดินฟื้นสู่ 60% ใน 30 นาที'], water: ['68%','68%'], ai: ['95%','Auto 0.8s'], flood: ['4%','4% (ปลอดภัย)'] },
    'full-tank': { title: '🛢️ ถังน้ำเต็ม', desc: 'RAIN BANK ระดับน้ำ 92% พร้อมพยากรณ์ฝนตกพรุ่งนี้', actions: ['AI ผันน้ำส่วนเกิน 1,200 L ลงสู่ชั้นน้ำใต้ดิน', 'แบ่งน้ำล้างถนนและทำความสะอาดพื้นที่สาธารณะ', 'ถังว่างพอรองรับน้ำฝนรอบใหม่ ไม่มีน้ำสูญเสีย'], water: ['98%','98%'], ai: ['96%','Optimized 0.5s'], flood: ['18%','18% (ควบคุม)'] },
    'allocation': { title: '⚖️ จัดสรรน้ำ', desc: 'ปรับสัดส่วนการจ่ายน้ำสำรองให้แต่ละภาคส่วน', actions: ['ใช้แถบเลื่อนด้านล่างปรับสัดส่วน', 'AI คำนวณผลกระทบและแจ้งเตือนหากไม่สมดุล'], water: ['72%','72%'], ai: ['85%','User-Driven'], flood: ['8%','8% (ปกติ)'] }
  };

  document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sc = data[btn.dataset.scenario]; if (!sc) return;

      screen.innerHTML = `<div class="sim-active-card">
        <h3 class="sim-active-title">${sc.title}</h3>
        <p class="sim-active-desc">${sc.desc}</p>
        <div class="sim-actions-list">
          <div class="sim-actions-title">🤖 AI ACTIONS:</div>
          <ul>${sc.actions.map(a => `<li>▸ ${a}</li>`).join('')}</ul>
        </div>
      </div>`;

      metrics.style.display = 'flex';
      document.getElementById('simWaterBar').style.width = sc.water[0];
      document.getElementById('simWaterVal').textContent = sc.water[0];
      document.getElementById('simAIBar').style.width = sc.ai[0];
      document.getElementById('simAIVal').textContent = sc.ai[1];
      document.getElementById('simFloodBar').style.width = sc.flood[0];
      document.getElementById('simFloodVal').textContent = sc.flood[1];

      allocPanel.style.display = btn.dataset.scenario === 'allocation' ? 'block' : 'none';
      if (btn.dataset.scenario === 'allocation') initAllocationSliders();
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   ALLOCATION SLIDERS
   ═══════════════════════════════════════════════════════════════ */
let allocChart = null;
function initAllocationSliders() {
  const ids = ['Green', 'Office', 'Home', 'Clean', 'Fire'];
  function update() {
    const vals = ids.map(id => parseInt(document.getElementById('alloc' + id)?.value || 0));
    ids.forEach((id, i) => { const el = document.getElementById('alloc' + id + 'Pct'); if (el) el.textContent = vals[i] + '%'; });
    const sum = vals.reduce((a, b) => a + b, 0);
    const tot = document.getElementById('allocTotal');
    if (tot) { tot.textContent = sum + '%'; tot.classList.toggle('over', sum > 100); }
    if (allocChart) { allocChart.data.datasets[0].data = vals; allocChart.update(); }
  }
  ids.forEach(id => document.getElementById('alloc' + id)?.addEventListener('input', update));

  if (!allocChart && document.getElementById('allocChart') && typeof Chart !== 'undefined') {
    allocChart = new Chart(document.getElementById('allocChart'), {
      type: 'bar',
      data: { labels: ['สีเขียว', 'สำนักงาน', 'ที่พัก', 'ล้างทำความสะอาด', 'ดับเพลิง'], datasets: [{ label: '%', data: [30, 25, 20, 15, 10], backgroundColor: ['#10b981', '#00d4ff', '#3b82f6', '#f59e0b', '#ef4444'], borderRadius: 6 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { max: 70, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   IMPACT SECTION
   ═══════════════════════════════════════════════════════════════ */
let impactChart = null;
function initImpactSection() {
  const before = { bars: ['2%','100%','4%','90%','0%','0%'], texts: ['2%','100%','500 m²','90%','0 L','0%'] };
  const after  = { bars: ['85%','40%','100%','25%','100%','94%'], texts: ['85%','40%','12,000 m²','25%','12,000 L','94%'] };

  function setMode(mode) {
    const isAfter = mode === 'after';
    document.getElementById('showBefore')?.classList.toggle('active', !isAfter);
    document.getElementById('showAfter')?.classList.toggle('active', isAfter);
    const src = isAfter ? after : before;
    document.querySelectorAll('.impact-card').forEach((card, i) => {
      const fill = card.querySelector('.impact-bar-fill'), pct = card.querySelector('.impact-pct');
      if (fill) fill.style.width = src.bars[i]; if (pct) pct.textContent = src.texts[i];
    });
    if (impactChart) {
      impactChart.data.datasets[0].data = isAfter ? [85, 40, 100, 25, 94] : [2, 100, 4, 90, 0];
      impactChart.data.datasets[0].label = isAfter ? 'HYDROLOOP (หลัง)' : 'แบบเดิม (ก่อน)';
      impactChart.data.datasets[0].backgroundColor = isAfter ? 'rgba(0,212,255,0.4)' : 'rgba(239,68,68,0.4)';
      impactChart.data.datasets[0].borderColor = isAfter ? '#00d4ff' : '#ef4444';
      impactChart.update();
    }
  }

  document.getElementById('showBefore')?.addEventListener('click', () => setMode('before'));
  document.getElementById('showAfter')?.addEventListener('click', () => setMode('after'));

  const ctx = document.getElementById('impactChart');
  if (ctx && typeof Chart !== 'undefined') {
    impactChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['นำน้ำกลับใช้ (%)','น้ำประปา (%)','พื้นที่สีเขียว','น้ำไหลบ่า (%)','AI แม่นยำ (%)'],
        datasets: [{ label: 'แบบเดิม (ก่อน)', data: [2, 100, 4, 90, 0], backgroundColor: 'rgba(239,68,68,0.5)', borderColor: '#ef4444', borderWidth: 2, borderRadius: 6 }]
      },
      options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { max: 100, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }
    });
  }
}
