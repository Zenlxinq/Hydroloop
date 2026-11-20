/**
 * HYDROLOOP 2040 — AI-POWERED CIRCULAR WATER MANAGEMENT CITY
 * Udon Thani 3D City Map Edition + Interactive Detail Drawer
 */

document.addEventListener('DOMContentLoaded', () => {
  const safeRun = (fn, name) => {
    try {
      fn();
    } catch (err) {
      console.error(`[HYDROLOOP] Error initializing ${name}:`, err);
    }
  };

  safeRun(initNavbar, 'Navbar');
  safeRun(initHeroCanvas, 'HeroCanvas');
  safeRun(initHeroStats, 'HeroStats');
  safeRun(init3DCity, '3DCity');
  safeRun(initDashboardGauges, 'DashboardGauges');
  safeRun(initDashboardCharts, 'DashboardCharts');
  safeRun(initAIInsights, 'AIInsights');
  safeRun(initSimulation, 'Simulation');
  safeRun(initImpactSection, 'ImpactSection');
  safeRun(initDetailDrawer, 'DetailDrawer');
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
  const lakeGeo = new THREE.CircleGeometry(16, 48);
  const lakeMat = new THREE.MeshBasicMaterial({ color: 0x0d4f8c });
  const lake = new THREE.Mesh(lakeGeo, lakeMat);
  lake.scale.set(1.15, 0.7, 1);
  lake.rotation.x = -Math.PI / 2; lake.position.set(-8, 0.08, 7);
  scene.add(lake);

  // Lake glowing ring
  const lakeRingGeo = new THREE.RingGeometry(16, 17.5, 48);
  const lakeRingMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
  const lakeRing = new THREE.Mesh(lakeRingGeo, lakeRingMat);
  lakeRing.scale.set(1.15, 0.7, 1);
  lakeRing.rotation.x = -Math.PI / 2; lakeRing.position.set(-8, 0.1, 7);
  scene.add(lakeRing);

  // Water shimmer particles above lake
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 14;
    const sg = new THREE.SphereGeometry(0.3, 6, 6);
    const sm = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
    const sp = new THREE.Mesh(sg, sm);
    sp.position.set(-8 + Math.cos(a) * r * 1.3, 0.3 + Math.random() * 0.5, 7 + Math.sin(a) * r * 0.8);
    scene.add(sp);
  }

  /* ── Park around lake ── */
  const groupGreen = new THREE.Group();
  const parkGeo = new THREE.CircleGeometry(20, 48);
  const parkMat = new THREE.MeshLambertMaterial({ color: 0x0a3d1e });
  const park = new THREE.Mesh(parkGeo, parkMat);
  park.scale.set(1.15, 0.7, 1);
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

  // Landmark definitions — with detailKey for drawer, pipeIndex, pinPos, and focus camera angles
  const landmarkDefs = [
    {
      id: 'hall',
      pos: [18, -5], size: [9, 28, 9], color: 0xa855f7,
      pinPos: [18, 30, -5],
      userData: {
        name: 'ศาลากลางจังหวัดอุดรธานี', icon: '🧠',
        badge: 'ECO-BRAIN AI Center',
        desc: 'ศูนย์กลางประมวลผล AI รับข้อมูลเซนเซอร์ IoT 48 จุดทั่วเมือง วิเคราะห์และสั่งการจัดสรรน้ำอัตโนมัติแบบเรียลไทม์',
        stats: { 'ระบบที่เชื่อมต่อ': '5 ระบบ', 'IoT Nodes': '48 จุด', 'AI Confidence': '94%', 'Latency': '12ms' },
        detailKey: 'ecobrain', pipeIndex: 2,
        cam: { r: 70, theta: 1.1, phi: 0.55 }
      }
    },
    {
      id: 'hospital',
      pos: [-2, -20], size: [10, 20, 10], color: 0x00d4ff,
      pinPos: [-2, 22, -20],
      userData: {
        name: 'โรงพยาบาลอุดรธานี', icon: '❄️',
        badge: 'AIR2ROOT Hub',
        desc: 'รวบรวมน้ำควบแน่นจากเครื่องปรับอากาศ 84 เครื่อง เฉลี่ย 340 ลิตร/วัน ผ่านตัวกรองและส่งเข้าระบบหมุนเวียนน้ำ',
        stats: { 'น้ำควบแน่น/วัน': '340 L', 'เครื่องแอร์': '84 เครื่อง', 'ประหยัดน้ำ': '100%', 'สถานะ': 'Online' },
        detailKey: 'air2root', pipeIndex: 0,
        cam: { r: 65, theta: 0.45, phi: 0.6 }
      }
    },
    {
      id: 'airport',
      pos: [-50, -45], size: [22, 8, 12], color: 0x3b82f6,
      pinPos: [-50, 11, -45],
      userData: {
        name: 'สนามบินนานาชาติอุดรธานี', icon: '🌧️',
        badge: 'RAIN BANK Station',
        desc: 'รวบรวมน้ำฝนจากหลังคาอาคารผู้โดยสารและลานขนาด 15,000 m² กรอง 3 ชั้น กักเก็บในถังใต้ดินความจุสูง',
        stats: { 'ความจุถัง': '15,000 L', 'ระดับน้ำ': '78%', 'อัตรากรอง': '25 L/min', 'คุณภาพน้ำ': 'เกรด A+' },
        detailKey: 'rainbank', pipeIndex: 1,
        cam: { r: 80, theta: -0.75, phi: 0.65 }
      }
    },
    {
      id: 'central',
      pos: [35, -20], size: [14, 18, 14], color: 0x10b981,
      pinPos: [35, 20, -20],
      userData: {
        name: 'Central Plaza อุดรธานี', icon: '🌿',
        badge: 'SPONGE CITY Demo',
        desc: 'ลานจอดรถซึมน้ำและสวนหย่อมรับน้ำฝน ลดปัญหาน้ำท่วมขังในเขตเมืองได้ 70% และส่งน้ำซึมสู่ชั้นดินอย่างปลอดภัย',
        stats: { 'พื้นที่ซึมน้ำ': '3,200 m²', 'ความชื้นดิน': '62%', 'ปริมาณซึม/ฝน': '4,500 L', 'ลดน้ำท่วม': '70%' },
        detailKey: 'spongecity', pipeIndex: 3,
        cam: { r: 75, theta: 1.85, phi: 0.6 }
      }
    },
    {
      id: 'station',
      pos: [-5, 50], size: [14, 10, 8], color: 0x14b8a6,
      pinPos: [-5, 12, 50],
      userData: {
        name: 'สถานีรถไฟอุดรธานี', icon: '📡',
        badge: 'AQUA-GUARD Hub',
        desc: 'ศูนย์ตรวจวัดและกระจายน้ำรีไซเคิล ตรวจสอบค่า pH ความขุ่น และระดับน้ำในท่อระบายน้ำสาธารณะรัศมี 5 กม.',
        stats: { 'pH': '7.2', 'ความขุ่น': '3 NTU', 'รัศมีครอบคลุม': '5 กม.', 'สถานะ': 'Online' },
        detailKey: 'aquaguard', pipeIndex: 4,
        cam: { r: 70, theta: 3.12, phi: 0.65 }
      }
    },
  ];

  landmarkDefs.forEach(def => {
    const mesh = addLandmark(def);
    def.mesh = mesh;
    interactableObjects.push(mesh);
  });

  // All interactive pins including Nong Prajak Lake
  const allPinDefs = [
    ...landmarkDefs,
    {
      id: 'lake',
      pinPos: [-8, 6, 7],
      userData: {
        name: 'สวนหนองประจักษ์ศิลปาคม', icon: '🌊',
        badge: 'Central Reservoir & Sponge Hub',
        desc: 'แหล่งกักเก็บน้ำธรรมชาติใจกลางเมืองอุดรธานี 120 ไร่ เป็นแก้มลิงรับน้ำฝนและเชื่อมต่อท่อหมุนเวียนน้ำ HYDROLOOP ทั้งหมด',
        stats: { 'พื้นที่': '120 ไร่', 'น้ำกักเก็บ': '95,000 m³', 'คุณภาพน้ำ': 'ระดับ A', 'สถานะ': 'Normal' },
        detailKey: 'spongecity', pipeIndex: 2,
        cam: { r: 85, theta: 0.9, phi: 0.55 }
      }
    }
  ];

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

  const pipeTubeMeshes = [];
  pipeRoutes.forEach(curve => {
    const tubeGeo = new THREE.TubeGeometry(curve, 40, 0.3, 7, false);
    const tubeMesh = new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({
      color: 0x00d4ff, transparent: true, opacity: 0.3, wireframe: false
    }));
    groupWaterPipes.add(tubeMesh);
    pipeTubeMeshes.push(tubeMesh);
  });

  // Highlight specific pipe route
  function highlightPipe(idx) {
    pipeTubeMeshes.forEach((m, i) => {
      if (i === idx) {
        m.material.opacity = 0.95;
        m.material.color.setHex(0x38bdf8);
      } else {
        m.material.opacity = 0.15;
        m.material.color.setHex(0x00d4ff);
      }
    });
    setTimeout(() => {
      pipeTubeMeshes.forEach(m => {
        m.material.opacity = 0.3;
        m.material.color.setHex(0x00d4ff);
      });
    }, 2800);
  }

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

  /* ── Camera orbit & smooth transition control ── */
  let spherical = { r: 110, theta: 0.9, phi: 0.65 };
  let targetSpherical = { r: 110, theta: 0.9, phi: 0.65 };
  let isCamTransitioning = false;
  let dragging = false, prev = { x: 0, y: 0 };
  let totalDragDist = 0;

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

  function smoothFocus(cam) {
    if (!cam) return;
    targetSpherical = { ...cam };
    isCamTransitioning = true;
  }

  canvas.addEventListener('mousedown', e => {
    dragging = true;
    totalDragDist = 0;
    prev = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mouseup', () => {
    dragging = false;
    canvas.style.cursor = 'grab';
  });

  canvas.addEventListener('mousemove', e => {
    if (dragging) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      totalDragDist += Math.abs(dx) + Math.abs(dy);
      spherical.theta -= dx * 0.007;
      spherical.phi -= dy * 0.007;
      isCamTransitioning = false;
      updateCam();
      prev = { x: e.clientX, y: e.clientY };
    } else {
      // Hover check for cursor pointer
      const rect = canvas.getBoundingClientRect();
      mouse2d.x = ((e.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
      mouse2d.y = -((e.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
      raycaster.setFromCamera(mouse2d, camera);
      const hits = raycaster.intersectObjects(interactableObjects);
      canvas.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    }
  });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    spherical.r += e.deltaY * 0.06;
    isCamTransitioning = false;
    updateCam();
  }, { passive: false });

  // Touch
  let td0 = 0;
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      dragging = true;
      totalDragDist = 0;
      prev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      td0 = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }
  });

  canvas.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && dragging) {
      const dx = e.touches[0].clientX - prev.x;
      const dy = e.touches[0].clientY - prev.y;
      totalDragDist += Math.abs(dx) + Math.abs(dy);
      spherical.theta -= dx * 0.008;
      spherical.phi -= dy * 0.008;
      isCamTransitioning = false;
      updateCam();
      prev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      spherical.r += (td0 - d) * 0.1;
      isCamTransitioning = false;
      updateCam();
      td0 = d;
    }
  });

  canvas.addEventListener('touchend', () => { dragging = false; });

  /* ── Selection & Overlay Handler ── */
  const overlay = document.getElementById('cityOverlay');
  let currentDetailKey = 'ecobrain';

  function selectLandmark(d, mesh) {
    if (!d) return;
    currentDetailKey = d.detailKey || 'ecobrain';

    // Update overlay content
    document.getElementById('overlayIcon').textContent = d.icon;
    document.getElementById('overlayTitle').textContent = d.name;
    const badgeEl = document.getElementById('overlayBadge');
    if (badgeEl) {
      badgeEl.textContent = d.badge || 'HYDROLOOP Node';
      badgeEl.style.display = 'inline-block';
    }
    document.getElementById('overlayDesc').textContent = d.desc;
    document.getElementById('overlayStats').innerHTML = Object.entries(d.stats || {})
      .map(([k, v]) => `<div><span style="color:var(--text-muted);font-size:.78rem">${k}</span><br/><strong style="color:var(--accent-cyan)">${v}</strong></div>`).join('');

    const detailBtn = document.getElementById('overlayDetailBtn');
    if (detailBtn) {
      detailBtn.dataset.detail = currentDetailKey;
    }
    overlay.style.display = 'block';

    // Flash landmark mesh
    if (mesh && mesh.material && mesh.material.emissive) {
      mesh.material.emissive.setHex(0x00ffff);
      setTimeout(() => mesh.material.emissive.setHex(0x001133), 600);
    }

    // Highlight pipe route
    if (d.pipeIndex !== undefined) {
      highlightPipe(d.pipeIndex);
    }

    // Smooth camera transition
    if (d.cam) {
      smoothFocus(d.cam);
    }
  }

  // Overlay detail button opens drawer
  document.getElementById('overlayDetailBtn')?.addEventListener('click', () => {
    if (currentDetailKey && typeof openDetail === 'function') {
      openDetail(currentDetailKey);
    }
  });

  document.getElementById('overlayClose')?.addEventListener('click', () => {
    overlay.style.display = 'none';
  });

  /* ── Raycasting: click landmark ── */
  const raycaster = new THREE.Raycaster();
  const mouse2d = new THREE.Vector2();

  canvas.addEventListener('click', e => {
    if (totalDragDist > 10) return; // Ignore drags
    const rect = canvas.getBoundingClientRect();
    mouse2d.x = ((e.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    mouse2d.y = -((e.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse2d, camera);
    const hits = raycaster.intersectObjects(interactableObjects);
    if (hits.length > 0 && hits[0].object.userData?.name) {
      selectLandmark(hits[0].object.userData, hits[0].object);
    }
  });

  // Double click on canvas landmark directly opens detail modal
  canvas.addEventListener('dblclick', e => {
    const rect = canvas.getBoundingClientRect();
    mouse2d.x = ((e.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    mouse2d.y = -((e.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse2d, camera);
    const hits = raycaster.intersectObjects(interactableObjects);
    if (hits.length > 0 && hits[0].object.userData?.detailKey && typeof openDetail === 'function') {
      openDetail(hits[0].object.userData.detailKey);
    }
  });

  /* ── 3D Floating Landmark Labels ── */
  const labelsContainer = document.getElementById('cityLabels');
  const activePins = [];

  if (labelsContainer) {
    labelsContainer.innerHTML = '';
    allPinDefs.forEach(p => {
      const pinEl = document.createElement('div');
      pinEl.className = 'city-pin-label';
      pinEl.innerHTML = `<span class="pin-dot"></span><span class="pin-icon">${p.userData.icon}</span><span>${p.userData.name.split(' ')[0]}</span>`;
      pinEl.addEventListener('click', (e) => {
        e.stopPropagation();
        selectLandmark(p.userData, p.mesh);
      });
      pinEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (p.userData.detailKey && typeof openDetail === 'function') {
          openDetail(p.userData.detailKey);
        }
      });
      labelsContainer.appendChild(pinEl);
      activePins.push({
        el: pinEl,
        worldPos: new THREE.Vector3(p.pinPos[0], p.pinPos[1], p.pinPos[2])
      });
    });
  }

  /* ── Focus Buttons & Controls ── */
  document.querySelectorAll('.focus-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const found = allPinDefs.find(p => p.id === targetId);
      if (found) {
        selectLandmark(found.userData, found.mesh);
      }
    });
  });

  /* ── Layer toggles ── */
  document.getElementById('toggleBuildings')?.addEventListener('click', e => {
    groupBuildings.visible = !groupBuildings.visible;
    e.currentTarget.classList.toggle('active', groupBuildings.visible);
  });
  document.getElementById('toggleWater')?.addEventListener('click', e => {
    groupWaterPipes.visible = !groupWaterPipes.visible;
    e.currentTarget.classList.toggle('active', groupWaterPipes.visible);
  });
  document.getElementById('toggleSensors')?.addEventListener('click', e => {
    groupSensors.visible = !groupSensors.visible;
    e.currentTarget.classList.toggle('active', groupSensors.visible);
  });
  document.getElementById('toggleGreen')?.addEventListener('click', e => {
    groupGreen.visible = !groupGreen.visible;
    e.currentTarget.classList.toggle('active', groupGreen.visible);
  });
  document.getElementById('resetCamera')?.addEventListener('click', () => {
    smoothFocus({ r: 110, theta: 0.9, phi: 0.65 });
  });

  /* ── Resize ── */
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  /* ── Animate ── */
  const projVec = new THREE.Vector3();
  let t0 = performance.now();

  (function animate() {
    requestAnimationFrame(animate);
    const elapsed = (performance.now() - t0) / 1000;

    // Smooth camera transition or slow auto-rotation
    if (isCamTransitioning) {
      spherical.r += (targetSpherical.r - spherical.r) * 0.08;
      spherical.theta += (targetSpherical.theta - spherical.theta) * 0.08;
      spherical.phi += (targetSpherical.phi - spherical.phi) * 0.08;
      updateCam();
      if (Math.abs(spherical.r - targetSpherical.r) < 0.3 &&
          Math.abs(spherical.theta - targetSpherical.theta) < 0.005 &&
          Math.abs(spherical.phi - targetSpherical.phi) < 0.005) {
        spherical.r = targetSpherical.r;
        spherical.theta = targetSpherical.theta;
        spherical.phi = targetSpherical.phi;
        isCamTransitioning = false;
      }
    } else if (!dragging) {
      spherical.theta += 0.0004;
      updateCam();
    }

    // Update 3D Floating Landmark Labels screen positions
    if (activePins.length > 0 && container.clientWidth > 0) {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      activePins.forEach(pin => {
        projVec.copy(pin.worldPos);
        projVec.project(camera);
        if (projVec.z < 1) {
          const sx = (projVec.x * 0.5 + 0.5) * cw;
          const sy = (-(projVec.y * 0.5) + 0.5) * ch;
          pin.el.style.transform = `translate(-50%, -100%) translate(${sx}px, ${sy}px)`;
          pin.el.style.display = 'inline-flex';
        } else {
          pin.el.style.display = 'none';
        }
      });
    }

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


/* ═══════════════════════════════════════════════════════════════
   DETAIL DRAWER — Rich Interactive Explanations
   Opens on click of system cards, flow steps, tech cards,
   and 3D city buildings
   ═══════════════════════════════════════════════════════════════ */

/* ── All Detail Content ── */
const DETAIL_DATA = {

  /* ════ 5 MAIN SYSTEMS ════ */

  'air2root': {
    icon: '❄️',
    name: 'AIR2ROOT System',
    badge: { label: 'ระบบ 01 · รวบรวมน้ำควบแน่น', color: '#00d4ff' },
    tagline: 'ดักน้ำจากเครื่องแอร์ทุกเครื่องในอาคาร — ไม่ให้หยดน้ำสูญเปล่าแม้แต่หยดเดียว',
    path: [
      { icon: '🌡️', label: 'อากาศชื้น\nในห้อง', type: 'source' },
      { icon: '❄️', label: 'คอยล์เย็น\nแอร์ควบแน่น', type: 'process' },
      { icon: '🔧', label: 'ท่อรวบรวม\nน้ำ', type: 'process' },
      { icon: '🔬', label: 'กรอง\nตะกอน', type: 'process' },
      { icon: '🗄️', label: 'ถัง RAIN\nBANK', type: 'dest' },
    ],
    steps: [
      { icon: '🌡️', title: 'ความชื้นในอากาศ → น้ำควบแน่น', desc: 'เมื่อเครื่องแอร์ทำงาน คอยล์เย็นอุณหภูมิ 5–10°C ดึงไอน้ำในอากาศให้กลายเป็นหยดน้ำ เฉลี่ย 4–8 ลิตร/ชม./เครื่อง' },
      { icon: '🔧', title: 'ท่อรวบรวมจากทุกเครื่องในอาคาร', desc: 'ต่อท่อ PVC ขนาดเล็กจากถาดน้ำทิ้งทุกเครื่องแอร์ รวบรวมลงท่อแนวตั้งสู่ถังพักชั้นล่าง โดยไม่ต้องใช้พลังงานเพิ่ม (แรงโน้มถ่วง)' },
      { icon: '🔬', title: 'กรองตะกอนและสิ่งปนเปื้อน', desc: 'ผ่านตะแกรงกรองละเอียด 50 ไมครอน กำจัดฝุ่น ขี้ผึ้ง และตะกอน ก่อนเข้าถังกลาง' },
      { icon: '🗄️', title: 'รวมกับ RAIN BANK', desc: 'น้ำควบแน่นที่กรองแล้วถูกส่งเข้าถัง RAIN BANK กลาง รอคำสั่งจาก ECO-BRAIN AI จัดสรรไปยังพื้นที่ต้องการ' },
      { icon: '🌳', title: 'นำกลับมาใช้ — รดน้ำต้นไม้ & ล้างพื้น', desc: 'AI สั่งจ่ายน้ำตามความชื้นดินเรียลไทม์ ประหยัดน้ำประปาได้ 100% สำหรับงานรดน้ำและทำความสะอาดทั่วไป' },
    ],
    stats: [
      { label: 'น้ำที่ได้ต่อวัน', value: '340 ลิตร' },
      { label: 'เครื่องแอร์', value: '84 เครื่อง' },
      { label: 'ประหยัดน้ำประปา', value: '100%' },
      { label: 'พลังงานที่ใช้', value: '0 W (แรงโน้มถ่วง)' },
    ],
    funfact: '💡 เครื่องแอร์ 1 ตัวสามารถผลิตน้ำควบแน่นได้สูงสุด 192 ลิตร/วัน ในสภาพอากาศชื้นแบบอุดรธานีช่วงมรสุม! ทั้งอาคารรวมกันได้มากกว่าน้ำดื่มสำหรับคนทั้งชั้นเรียน',
  },

  'rainbank': {
    icon: '🌧️',
    name: 'RAIN BANK System',
    badge: { label: 'ระบบ 02 · กักเก็บน้ำฝน', color: '#4dabf7' },
    tagline: 'รวบรวมน้ำฝนจากหลังคาทุกอาคาร — เปลี่ยนฝนที่เคยระบายทิ้งให้กลายเป็นทรัพยากร',
    path: [
      { icon: '🌧️', label: 'ฝนตก\nลงหลังคา', type: 'source' },
      { icon: '🏠', label: 'รางน้ำ\nรวบรวม', type: 'process' },
      { icon: '🧹', label: 'กรองใบไม้\n& สิ่งสกปรก', type: 'process' },
      { icon: '🔬', label: 'กรอง 3 ชั้น\n+ UV ฆ่าเชื้อ', type: 'process' },
      { icon: '🗄️', label: 'ถังใต้ดิน\n8,500 L', type: 'dest' },
    ],
    steps: [
      { icon: '🌧️', title: 'น้ำฝนตกลงหลังคาอาคาร', desc: 'รวบรวมน้ำฝนจากหลังคาพื้นที่ 2,000 m² ผ่านรางน้ำโดยรอบอาคาร ฝนเพียง 1 มม. ให้น้ำได้ 2,000 ลิตร' },
      { icon: '🧹', title: 'กรองขั้นแรก — กำจัดใบไม้และตะกอนใหญ่', desc: 'ตะแกรงสแตนเลสกรองสิ่งสกปรกขนาดใหญ่ก่อนน้ำเข้าท่อ ป้องกันการอุดตัน' },
      { icon: '🏖️', title: 'กรองขั้นที่ 2 — ทรายและกรวด (Sand Bed)', desc: 'ชั้นทรายและกรวดละเอียดดักจับตะกอนขนาดเล็ก ฝุ่น และอนุภาคต่างๆ ออกจากน้ำ' },
      { icon: '🧪', title: 'กรองขั้นที่ 3 — ถ่านกัมมันต์ (Activated Carbon)', desc: 'ดับกลิ่น กำจัดคลอรีน และสารอินทรีย์ในน้ำ ทำให้น้ำใสสะอาด' },
      { icon: '☀️', title: 'UV Sterilization — ฆ่าเชื้อด้วยแสง UV', desc: 'แสง UV ความยาวคลื่น 254nm ทำลาย DNA ของแบคทีเรียและไวรัส 99.9% โดยไม่เพิ่มสารเคมี' },
      { icon: '📦', title: 'กักเก็บในถังใต้ดิน 8,500 ลิตร', desc: 'น้ำที่สะอาดแล้วถูกกักเก็บในถังโพลิเอทิลีนใต้ดิน ป้องกันแสงแดด ไม่ให้สาหร่ายเจริญเติบโต เซนเซอร์ตรวจวัดระดับน้ำตลอด 24 ชม.' },
    ],
    stats: [
      { label: 'ความจุถัง', value: '8,500 L' },
      { label: 'ระดับน้ำปัจจุบัน', value: '72% (6,120 L)' },
      { label: 'ชั้นการกรอง', value: '3 ชั้น + UV' },
      { label: 'คุณภาพน้ำ', value: 'Eco Grade A+' },
    ],
    funfact: '💡 ฝนที่ตกในอุดรธานีเฉลี่ย 1,500 มม./ปี หากรวบรวมจากหลังคา 2,000 m² จะได้น้ำสูงถึง 3,000,000 ลิตรต่อปี — เพียงพอสำหรับรดน้ำสวนสาธารณะโดยไม่ต้องใช้น้ำประปาเลย!',
  },

  'aquaguard': {
    icon: '📡',
    name: 'AQUA-GUARD IoT System',
    badge: { label: 'ระบบ 03 · ตรวจวัดคุณภาพน้ำ', color: '#51cf66' },
    tagline: 'ระบบประสาทดิจิทัลของเมือง — เซนเซอร์ 48 จุดคอยตรวจทุกหยดน้ำในระบบ',
    path: [
      { icon: '💧', label: 'น้ำในระบบ\nทุกจุด', type: 'source' },
      { icon: '🔌', label: 'ESP32\nอ่านเซนเซอร์', type: 'process' },
      { icon: '📶', label: 'ส่งข้อมูล\nผ่าน WiFi', type: 'process' },
      { icon: '🧠', label: 'ECO-BRAIN\nประมวลผล', type: 'process' },
      { icon: '🚨', label: 'แจ้งเตือน\n& สั่งการ', type: 'dest' },
    ],
    steps: [
      { icon: '📏', title: 'วัดระดับน้ำ (Water Level Sensor)', desc: 'เซนเซอร์อัลตราโซนิคและโฟลตสวิตช์วัดระดับน้ำในถังทุก 30 วินาที แจ้งเตือนเมื่อน้ำต่ำกว่า 20% หรือเกิน 95%' },
      { icon: '🧪', title: 'วัดค่า pH (Acidity)', desc: 'วัดความเป็นกรด-ด่างของน้ำทุก 5 นาที น้ำที่จะนำมาใช้ต้องอยู่ในช่วง pH 6.5–8.5 ถ้าออกนอกช่วงระบบแจ้งเตือนและตัดการจ่ายน้ำอัตโนมัติ' },
      { icon: '🌫️', title: 'วัดความขุ่น (Turbidity)', desc: 'ใช้แสง LED Infrared ส่องผ่านน้ำ วัดปริมาณแสงที่กระจาย ถ้าขุ่นเกิน 5 NTU หมายถึงมีตะกอนมาก ระบบหยุดการจ่ายน้ำและเริ่มกรองเพิ่ม' },
      { icon: '🌱', title: 'วัดความชื้นดิน (Soil Moisture)', desc: 'เซนเซอร์ Capacitive ในดินรอบต้นไม้วัดปริมาณน้ำในดิน ถ้าต่ำกว่า 40% ส่งสัญญาณขอน้ำไปยัง AI' },
      { icon: '📡', title: 'ส่งข้อมูลผ่าน ESP32 + WiFi', desc: 'ไมโครคอนโทรลเลอร์ ESP32 รับข้อมูลเซนเซอร์ทุกจุด ส่งผ่าน WiFi/LoRaWAN ไปยัง ECO-BRAIN ทุก 30 วินาที' },
      { icon: '🧠', title: 'ECO-BRAIN วิเคราะห์และตัดสินใจ', desc: 'AI ประมวลผลข้อมูลจากทุกเซนเซอร์ เปรียบเทียบกับพยากรณ์อากาศ แล้วสั่งเปิด/ปิดวาล์วอัตโนมัติ' },
    ],
    stats: [
      { label: 'เซนเซอร์ทั้งหมด', value: '48 จุด' },
      { label: 'อัปเดตข้อมูล', value: 'ทุก 30 วินาที' },
      { label: 'ประเภทเซนเซอร์', value: '4 ประเภท' },
      { label: 'ความแม่นยำ', value: '±2%' },
    ],
    funfact: '💡 เซนเซอร์ทั้ง 48 จุดส่งข้อมูลรวมกันกว่า 5,760 ค่าต่อชั่วโมง ECO-BRAIN ประมวลผลข้อมูลทั้งหมดนี้ใน 12 มิลลิวินาที เร็วกว่าการกระพริบตาของมนุษย์ถึง 7 เท่า!',
  },

  'spongecity': {
    icon: '🌿',
    name: 'SPONGE CITY Network',
    badge: { label: 'ระบบ 04 · เมืองซึมซับน้ำ', color: '#94d82d' },
    tagline: 'ออกแบบให้เมืองดูดซับน้ำเหมือนฟองน้ำ — ไม่มีน้ำท่วม ไม่มีน้ำสูญเสีย',
    path: [
      { icon: '🌧️', label: 'ฝนตก\nในเมือง', type: 'source' },
      { icon: '🛣️', label: 'พื้นถนน\nซึมน้ำ', type: 'process' },
      { icon: '🌱', label: 'สวนรับน้ำ\n& บ่อหน่วง', type: 'process' },
      { icon: '🌍', label: 'ซึมลงสู่\nชั้นดิน', type: 'process' },
      { icon: '💎', label: 'น้ำใต้ดิน\n& RAIN BANK', type: 'dest' },
    ],
    steps: [
      { icon: '🛣️', title: 'พื้นซึมน้ำได้ (Permeable Pavement)', desc: 'แทนที่ถนนคอนกรีตทึบด้วยวัสดุพรุน น้ำฝนซึมลงสู่ชั้นกรวดใต้ดินแทนที่จะไหลนองบนถนน ลดน้ำท่วมขังได้ทันที' },
      { icon: '🌱', title: 'สวนรับน้ำ (Rain Garden)', desc: 'แอ่งดินลึกปลูกพืชดูดน้ำสูงข้างถนน รับน้ำฝนไหลบ่าจากพื้นที่ข้างเคียง กักน้ำไว้ให้ซึมลงดินช้าๆ' },
      { icon: '🏊', title: 'บ่อหน่วงน้ำ (Retention Pond)', desc: 'บ่อขนาดใหญ่เก็บน้ำไว้ชั่วคราวเมื่อฝนตกหนัก ป้องกันน้ำท่วมฉับพลัน ค่อยๆ ระบายออกเมื่อปริมาณน้ำลดลง' },
      { icon: '🌿', title: 'หลังคาสีเขียว (Green Roof)', desc: 'ปลูกพืชบนหลังคาอาคาร ดูดซับน้ำฝน 50–70% ก่อนไหลลงมา ลดภาระของระบบระบายน้ำในเมือง' },
      { icon: '💎', title: 'เติมน้ำใต้ดิน (Aquifer Recharge)', desc: 'น้ำที่ซึมผ่านทุกชั้นเติมกลับสู่ชั้นน้ำบาดาล ช่วยรักษาสมดุลน้ำในระยะยาว และป้องกันการทรุดตัวของพื้นดิน' },
    ],
    stats: [
      { label: 'พื้นที่ซึมน้ำ', value: '2,400 m²' },
      { label: 'ลดน้ำท่วมขัง', value: '70%' },
      { label: 'ความชื้นดิน', value: '58%' },
      { label: 'น้ำซึมสู่ดิน/ฝน', value: '4,200 L' },
    ],
    funfact: '💡 ในช่วงฝนตกหนัก 50 มม./ชม. เมืองแบบเดิมจะมีน้ำไหลบ่า 90% ของน้ำฝนทั้งหมด แต่ SPONGE CITY ลดตัวเลขนี้เหลือเพียง 25% — ลดภาระระบบท่อระบายน้ำได้มหาศาล!',
  },

  'ecobrain': {
    icon: '🧠',
    name: 'ECO-BRAIN & AQUA-PREDICT',
    badge: { label: 'ระบบ 05 · ศูนย์กลาง AI', color: '#cc5de8' },
    tagline: 'สมองกลของเมือง — วิเคราะห์ข้อมูลทุกหยดน้ำ ตัดสินใจก่อนปัญหาจะเกิด',
    path: [
      { icon: '📡', label: 'ข้อมูล\n48 เซนเซอร์', type: 'source' },
      { icon: '🌤️', label: 'พยากรณ์\nอากาศ 72hr', type: 'source' },
      { icon: '🧠', label: 'AI ประมวลผล\n& เรียนรู้', type: 'process' },
      { icon: '📊', label: 'Dashboard\nแสดงผล', type: 'process' },
      { icon: '🚰', label: 'สั่งการ\nวาล์ว+ปั๊ม', type: 'dest' },
    ],
    steps: [
      { icon: '📡', title: 'รวบรวมข้อมูลจากทุกเซนเซอร์ (48 จุด)', desc: 'รับข้อมูล pH ความขุ่น ระดับน้ำ ความชื้นดิน อุณหภูมิ และปริมาณน้ำในท่อ ทุก 30 วินาที รวมกว่า 5,760 ค่า/ชม.' },
      { icon: '🌤️', title: 'เชื่อมต่อ API พยากรณ์อากาศ 72 ชั่วโมง', desc: 'ดึงข้อมูลพยากรณ์อากาศจาก Weather API ได้แก่ ปริมาณฝนที่จะตก อุณหภูมิ ความชื้น และทิศทางลม' },
      { icon: '🤖', title: 'AQUA-PREDICT วิเคราะห์ด้วย Machine Learning', desc: 'AI เรียนรู้จากข้อมูลย้อนหลัง คาดการณ์ความต้องการน้ำล่วงหน้า เสนอแผนการจัดสรรน้ำที่ประหยัดที่สุด' },
      { icon: '📊', title: 'แสดงผลบน ECO-BRAIN Dashboard', desc: 'ผู้ดูแลระบบเห็นสถานะทุกระบบแบบเรียลไทม์ กราฟแนวโน้ม แจ้งเตือนผิดปกติ และ AI Recommendation' },
      { icon: '🚰', title: 'สั่งการวาล์วและปั๊มน้ำอัตโนมัติ', desc: 'AI สั่งเปิด/ปิดวาล์วไปยังพื้นที่ต่างๆ ตามแผนที่คำนวณไว้ โดยไม่ต้องรอคนสั่งงาน ตอบสนองภายใน 0.4 วินาที' },
    ],
    stats: [
      { label: 'ความแม่นยำ AI', value: '94%' },
      { label: 'พยากรณ์ล่วงหน้า', value: '72 ชั่วโมง' },
      { label: 'เวลาตอบสนอง', value: '0.4 วินาที' },
      { label: 'Data Streams', value: '48 ช่องสัญญาณ' },
    ],
    funfact: '💡 ECO-BRAIN ใช้ข้อมูลย้อนหลัง 2 ปีในการฝึก AI ทำให้รู้ว่าช่วงไหนของปีอุดรธานีฝนตกมาก หรือช่วงไหนแล้งที่สุด และเตรียมระบบรับมือล่วงหน้าได้อย่างแม่นยำ',
  },

  /* ════ FLOW STEPS ════ */

  'step-collect': {
    icon: '🪣',
    name: 'ขั้นตอนที่ 1 — COLLECT รวบรวม',
    badge: { label: 'STEP 01 · รวบรวมน้ำ', color: '#00d4ff' },
    tagline: 'ดักจับน้ำทุกรูปแบบก่อนสูญเสียไป — น้ำแอร์ น้ำฝน น้ำในดิน',
    path: [
      { icon: '❄️', label: 'น้ำควบแน่น\nจากแอร์', type: 'source' },
      { icon: '🌧️', label: 'น้ำฝน\nจากหลังคา', type: 'source' },
      { icon: '🌱', label: 'น้ำไหลบ่า\nในสวน', type: 'source' },
      { icon: '🪣', label: 'รวบรวม\nทั้งหมด', type: 'process' },
      { icon: '📦', label: 'ถังพัก\nชั่วคราว', type: 'dest' },
    ],
    steps: [
      { icon: '❄️', title: 'AIR2ROOT — น้ำควบแน่นจากเครื่องแอร์', desc: 'ระบบดักน้ำจากถาดรองน้ำทุกเครื่อง ส่งผ่านท่อโดยใช้แรงโน้มถ่วง ได้ 340 ลิตร/วัน โดยไม่ต้องใช้พลังงานเพิ่ม' },
      { icon: '🌧️', title: 'RAIN BANK — น้ำฝนจากหลังคา', desc: 'รางน้ำโดยรอบหลังคาอาคาร รวบรวมน้ำฝนทั้งหมดส่งลงท่อกลาง ฝน 1 มม. บนหลังคา 2,000 m² ให้น้ำ 2,000 ลิตร' },
      { icon: '🌿', title: 'SPONGE CITY — น้ำไหลบ่าจากพื้นผิว', desc: 'น้ำฝนที่ไหลบ่าบนถนนและพื้นที่สาธารณะถูกนำเข้าสวนรับน้ำและบ่อหน่วงน้ำ แทนที่จะไหลลงท่อระบายทิ้ง' },
    ],
    stats: [
      { label: 'รวมน้ำได้/วัน', value: '~8,000–12,000 L' },
      { label: 'แหล่งน้ำ', value: '3 แหล่ง' },
      { label: 'พลังงานที่ใช้', value: 'ต่ำมาก (แรงโน้มถ่วง)' },
      { label: 'สูญเสียน้ำ', value: '<5%' },
    ],
    funfact: '💡 ก่อน HYDROLOOP น้ำทั้งหมดนี้จะสูญหายไปกับท่อระบายน้ำ โดยไม่ได้ใช้ประโยชน์ใดๆ เลย!',
  },

  'step-filter': {
    icon: '🔬',
    name: 'ขั้นตอนที่ 2 — FILTER กรอง',
    badge: { label: 'STEP 02 · กรองและตรวจสอบ', color: '#3b82f6' },
    tagline: 'ทำให้น้ำทุกหยดสะอาดและปลอดภัย ก่อนนำไปใช้งาน',
    path: [
      { icon: '💧', label: 'น้ำดิบ\nรวบรวมได้', type: 'source' },
      { icon: '🧹', label: 'กรองหยาบ\nใบไม้/ตะกอน', type: 'process' },
      { icon: '🏖️', label: 'กรองละเอียด\nทรายกรวด', type: 'process' },
      { icon: '☀️', title: 'UV ฆ่าเชื้อ', type: 'process' },
      { icon: '✅', label: 'น้ำสะอาด\nพร้อมใช้', type: 'dest' },
    ],
    steps: [
      { icon: '🧹', title: 'ชั้นที่ 1 — กรองหยาบ (Coarse Filter)', desc: 'ตะแกรงสแตนเลสรูเล็ก กำจัดใบไม้ ขยะ และสิ่งสกปรกขนาดใหญ่ ทำความสะอาดได้ง่าย' },
      { icon: '🏖️', title: 'ชั้นที่ 2 — กรองทราย (Sand Filtration)', desc: 'ชั้นทรายและกรวดละเอียดหนา 60 ซม. กรองตะกอนขนาดเล็ก สี และสารแขวนลอยออกจากน้ำ' },
      { icon: '⬛', title: 'ชั้นที่ 3 — ถ่านกัมมันต์ (Activated Carbon)', desc: 'ดูดซับสารอินทรีย์ กลิ่น และสารพิษ ทำให้น้ำใสและไม่มีกลิ่น เหมาะสำหรับนำมารดน้ำต้นไม้' },
      { icon: '☀️', title: 'UV Sterilization — ฆ่าเชื้อด้วยแสง', desc: 'หลอด UV กำลัง 25W ส่องผ่านน้ำ ทำลายเชื้อแบคทีเรีย E.coli และไวรัสได้ 99.9% ภายใน 10 วินาที' },
      { icon: '🧪', title: 'ตรวจสอบคุณภาพ — AQUA-GUARD', desc: 'เซนเซอร์ pH และ Turbidity ตรวจสอบค่าน้ำสุดท้ายก่อนปล่อยเข้าถัง ถ้าไม่ผ่านเกณฑ์จะวนกรองซ้ำ' },
    ],
    stats: [
      { label: 'ชั้นการกรอง', value: '3 ชั้น + UV' },
      { label: 'ประสิทธิภาพ', value: '99.9%' },
      { label: 'เวลากรอง', value: '~15 นาที' },
      { label: 'คุณภาพน้ำออก', value: 'pH 6.8–7.5' },
    ],
    funfact: '💡 น้ำที่ผ่านการกรองแล้วมีความสะอาดเทียบเท่าน้ำที่ใช้ในสวนสาธารณะชั้นดี เหมาะกับการรดน้ำพืชและล้างทำความสะอาดทั่วไป',
  },

  'step-store': {
    icon: '🗄️',
    name: 'ขั้นตอนที่ 3 — STORE กักเก็บ',
    badge: { label: 'STEP 03 · กักเก็บน้ำสำรอง', color: '#10b981' },
    tagline: 'เก็บน้ำสะอาดพร้อมใช้งาน — มีสำรองเสมอแม้ฝนไม่ตก',
    path: [
      { icon: '✅', label: 'น้ำสะอาด\nกรองแล้ว', type: 'source' },
      { icon: '🗄️', label: 'ถังใต้ดิน\n8,500 L', type: 'process' },
      { icon: '📏', label: 'เซนเซอร์\nตรวจระดับ', type: 'process' },
      { icon: '🧠', label: 'AI ติดตาม\nสำรอง', type: 'process' },
      { icon: '🚰', label: 'จ่ายน้ำ\nตามคำสั่ง', type: 'dest' },
    ],
    steps: [
      { icon: '🏗️', title: 'ถังโพลิเอทิลีนใต้ดิน ความจุ 8,500 ลิตร', desc: 'ถังทนสารเคมี ไม่รั่วซึม ติดตั้งใต้ดินป้องกันแสงแดดและความร้อน ป้องกันการเจริญของสาหร่าย' },
      { icon: '📏', title: 'เซนเซอร์ระดับน้ำ Ultrasonic', desc: 'วัดระยะห่างจากเซนเซอร์ถึงผิวน้ำด้วยคลื่นเสียง แม่นยำ ±1 ซม. ส่งข้อมูลทุก 30 วินาที' },
      { icon: '🔴', title: 'แจ้งเตือนอัตโนมัติ 3 ระดับ', desc: 'เต็ม (95%) → AI หาทางระบายน้ำส่วนเกิน | ปกติ (20–95%) → ทำงานปกติ | ต่ำ (20%) → AI ประหยัดน้ำทันที' },
      { icon: '🧠', title: 'AI คำนวณ "สำรองกี่วัน"', desc: 'จากระดับน้ำปัจจุบัน + พยากรณ์ฝน + อัตราใช้น้ำ AI คำนวณว่าน้ำพอใช้ได้กี่วัน และควรประหยัดหรือไม่' },
    ],
    stats: [
      { label: 'ระดับน้ำปัจจุบัน', value: '72% (6,120 L)' },
      { label: 'น้ำสำรองสำหรับ', value: '~18 วัน (ไม่มีฝน)' },
      { label: 'อัตราใช้น้ำเฉลี่ย', value: '340 L/วัน' },
      { label: 'สถานะถัง', value: '🟢 ปกติ' },
    ],
    funfact: '💡 ถัง 8,500 ลิตรนี้เพียงพอสำหรับรดน้ำสวนหนองประจักษ์ทั้งหมดได้นานถึง 25 วันโดยไม่ต้องพึ่งน้ำประปาแม้แต่ลิตรเดียว!',
  },

  'step-monitor': {
    icon: '📡',
    name: 'ขั้นตอนที่ 4 — MONITOR ตรวจวัด',
    badge: { label: 'STEP 04 · ตรวจวัดด้วย IoT', color: '#51cf66' },
    tagline: 'ระบบประสาทดิจิทัล — ไม่มีอะไรเกิดขึ้นโดยที่ AI ไม่รู้',
    path: [
      { icon: '💧', label: 'น้ำในระบบ', type: 'source' },
      { icon: '📡', label: 'เซนเซอร์\nตรวจวัด', type: 'process' },
      { icon: '🔌', label: 'ESP32\nประมวลผล', type: 'process' },
      { icon: '📶', label: 'WiFi/LoRa\nส่งข้อมูล', type: 'process' },
      { icon: '📊', label: 'Dashboard\nแสดงผล', type: 'dest' },
    ],
    steps: [
      { icon: '📏', title: 'วัด 4 ค่าหลักพร้อมกัน', desc: 'ระดับน้ำ (Water Level) · ค่า pH · ความขุ่น (Turbidity NTU) · ความชื้นดิน (Soil Moisture %) ทุก 30 วินาที' },
      { icon: '🔌', title: 'ESP32 ประมวลผลที่ขอบเครือข่าย (Edge)', desc: 'กรองข้อมูลผิดปกติ เปรียบเทียบกับเกณฑ์ และแจ้งเตือนฉุกเฉินทันทีโดยไม่ต้องรอ Cloud' },
      { icon: '📶', title: 'ส่งข้อมูลผ่าน WiFi / LoRaWAN', desc: 'จุดในอาคารใช้ WiFi · จุดกลางแจ้งระยะไกลใช้ LoRaWAN รัศมีสัญญาณ 5 กม. ประหยัดพลังงาน' },
      { icon: '🧠', title: 'ECO-BRAIN รับข้อมูลและวิเคราะห์', desc: 'AI รับข้อมูล 5,760 ค่า/ชม. จากทั้ง 48 จุด เปรียบเทียบกับ Baseline และตรวจจับความผิดปกติ' },
    ],
    stats: [
      { label: 'ตรวจวัดทุก', value: '30 วินาที' },
      { label: 'เซนเซอร์ทั่วเมือง', value: '48 จุด' },
      { label: 'ค่าที่ตรวจ/ชม.', value: '5,760 ค่า' },
      { label: 'รัศมีสัญญาณ', value: '5 กม.' },
    ],
    funfact: '💡 ถ้าค่า pH ในถังน้ำผิดปกติ ระบบสามารถตรวจพบและแจ้งเตือนได้ภายใน 30 วินาที เร็วกว่าที่มนุษย์จะสังเกตเห็นปัญหาเป็นชั่วโมงๆ!',
  },

  'step-predict': {
    icon: '🧠',
    name: 'ขั้นตอนที่ 5 — PREDICT พยากรณ์',
    badge: { label: 'STEP 05 · AI วิเคราะห์', color: '#a855f7' },
    tagline: 'รู้ก่อนเกิด แก้ก่อนสาย — AI วางแผนน้ำล่วงหน้า 72 ชั่วโมง',
    path: [
      { icon: '📡', label: 'ข้อมูล\nเซนเซอร์', type: 'source' },
      { icon: '🌤️', label: 'พยากรณ์\nอากาศ', type: 'source' },
      { icon: '🤖', label: 'Machine\nLearning', type: 'process' },
      { icon: '📊', label: 'แผนจัดสรร\nน้ำ', type: 'process' },
      { icon: '🚰', label: 'สั่งการ\nอัตโนมัติ', type: 'dest' },
    ],
    steps: [
      { icon: '📊', title: 'วิเคราะห์ Trend ย้อนหลัง', desc: 'AI ดูรูปแบบการใช้น้ำ 2 ปีที่ผ่านมา เรียนรู้ว่าช่วงเช้าต้องการน้ำมากกว่าช่วงกลางคืน ฤดูร้อนใช้น้ำมากกว่าฤดูหนาว' },
      { icon: '🌦️', title: 'รวมข้อมูลพยากรณ์อากาศ 72 ชม.', desc: 'ถ้าฝนจะตกพรุ่งนี้ AI จะไม่สั่งรดน้ำวันนี้ และเตรียมถังว่างรองรับน้ำฝน ประหยัดได้ทันที' },
      { icon: '🧮', title: 'คำนวณ "แผนจัดสรรน้ำ" ล่วงหน้า', desc: 'AI คำนวณว่าต้องจ่ายน้ำกี่ลิตรไปยังพื้นที่ไหน เวลาใด เพื่อให้น้ำสำรองเพียงพอและใช้น้ำน้อยที่สุด' },
      { icon: '🚨', title: 'ระบบแจ้งเตือนล่วงหน้า', desc: 'ถ้า AI คาดว่าน้ำจะหมดใน 5 วัน จะแจ้งเตือนทันทีและลดการใช้น้ำอัตโนมัติ โดยไม่ต้องรอมนุษย์สั่ง' },
    ],
    stats: [
      { label: 'พยากรณ์ล่วงหน้า', value: '72 ชั่วโมง' },
      { label: 'ความแม่นยำ', value: '94%' },
      { label: 'ประหยัดน้ำได้', value: '30% เพิ่มเติม' },
      { label: 'Model Type', value: 'LSTM + Random Forest' },
    ],
    funfact: '💡 AQUA-PREDICT เรียนรู้ว่าในอุดรธานีช่วงเดือน ก.ค.–ก.ย. ฝนตกบ่าย 3 โมงเกือบทุกวัน AI จะไม่รดน้ำตั้งแต่เที่ยง เพื่อรอให้ฝนช่วยแทน!',
  },

  'step-reuse': {
    icon: '♻️',
    name: 'ขั้นตอนที่ 6 — REUSE นำกลับมาใช้',
    badge: { label: 'STEP 06 · จัดสรรน้ำ', color: '#10b981' },
    tagline: 'น้ำทุกลิตรที่เก็บไว้ถูกส่งถึงมือผู้ต้องการ — ไม่มีสูญเปล่า',
    path: [
      { icon: '🗄️', label: 'ถัง RAIN\nBANK', type: 'source' },
      { icon: '🧠', label: 'AI สั่งการ\nเปิดวาล์ว', type: 'process' },
      { icon: '🌳', label: 'รดน้ำ\nสวนสาธารณะ', type: 'dest' },
      { icon: '🚿', label: 'ล้างทำ\nความสะอาด', type: 'dest' },
      { icon: '🔥', label: 'สำรอง\nดับเพลิง', type: 'dest' },
    ],
    steps: [
      { icon: '🌳', title: 'รดน้ำต้นไม้และสวนสาธารณะ (40%)', desc: 'จ่ายน้ำเฉพาะเมื่อเซนเซอร์ความชื้นดินต่ำกว่า 50% ผ่านระบบน้ำหยดใต้ดิน ตรงถึงรากต้นไม้ ไม่สูญเสียการระเหย' },
      { icon: '🚿', title: 'ล้างถนน ทำความสะอาดพื้นที่ (25%)', desc: 'ใช้น้ำหมุนเวียนล้างถนน ห้องน้ำสาธารณะ และพื้นที่ส่วนกลาง แทนน้ำประปา ประหยัดได้ทันที' },
      { icon: '🏊', title: 'เติมน้ำสระและบ่อน้ำในสวน (20%)', desc: 'สวนหนองประจักษ์ใช้น้ำหมุนเวียนจาก HYDROLOOP เติมระดับน้ำในบ่อน้ำ รักษาระบบนิเวศน้ำ' },
      { icon: '🏗️', title: 'งานก่อสร้างและล้างยานพาหนะ (10%)', desc: 'จ่ายน้ำสำหรับงานก่อสร้างในเมือง ล้างรถบรรทุกขยะ และยานพาหนะสาธารณะ' },
      { icon: '🔥', title: 'ระบบดับเพลิงสำรอง (5%)', desc: 'กันสำรองน้ำ 5% ไว้สำหรับเหตุฉุกเฉิน ระบบดับเพลิงสามารถดึงน้ำจากถังได้ทันทีโดยไม่ต้องพึ่งระบบประปา' },
    ],
    stats: [
      { label: 'ประหยัดน้ำประปา', value: '8,500 L/วัน' },
      { label: 'ลดค่าน้ำประปา', value: '60%' },
      { label: 'พื้นที่สีเขียวที่ดูแล', value: '12,000 m²' },
      { label: 'CO₂ ที่ลดได้', value: '2.4 ตัน/ปี' },
    ],
    funfact: '💡 การรดน้ำสวนหนองประจักษ์ทั้งหมดด้วยน้ำประปาปกติใช้เงินปีละกว่า 500,000 บาท HYDROLOOP ลดค่าใช้จ่ายนี้เหลือเกือบ 0 บาท!',
  },

  /* ════ TECHNOLOGY CARDS ════ */

  'tech-ai': {
    icon: '🤖',
    name: 'Artificial Intelligence (AI)',
    badge: { label: 'CORE TECHNOLOGY · AI Engine', color: '#a855f7' },
    tagline: 'สมองกลที่เรียนรู้จากข้อมูล เพื่อตัดสินใจแทนมนุษย์ได้ดีกว่า',
    path: [
      { icon: '📊', label: 'ข้อมูล\nเซนเซอร์', type: 'source' },
      { icon: '🤖', label: 'AI Model\nประมวลผล', type: 'process' },
      { icon: '📈', label: 'คาดการณ์\nอนาคต', type: 'process' },
      { icon: '📋', label: 'แผน\nจัดสรรน้ำ', type: 'dest' },
    ],
    steps: [
      { icon: '📚', title: 'Machine Learning — เรียนรู้จากข้อมูลจริง', desc: 'AI ฝึกฝนจากข้อมูลประวัติการใช้น้ำ ปริมาณฝน และสภาพอากาศย้อนหลัง 2 ปี เพื่อสร้าง Model ทำนายที่แม่นยำ' },
      { icon: '🔮', title: 'Time-Series Forecasting (LSTM)', desc: 'ใช้ Neural Network แบบ LSTM ทำนายปริมาณน้ำที่จะรวบรวมได้ในอีก 72 ชม. ข้างหน้า จากรูปแบบอากาศ' },
      { icon: '🎯', title: 'Optimization — หาแผนที่ดีที่สุด', desc: 'AI หาวิธีจัดสรรน้ำที่ประหยัดที่สุด แต่ทุกพื้นที่ยังได้รับน้ำพอ โดยคำนึงถึงความสำคัญของแต่ละพื้นที่' },
      { icon: '🚨', title: 'Anomaly Detection — ตรวจจับความผิดปกติ', desc: 'ถ้าเซนเซอร์ใดส่งค่าผิดปกติ AI จะแยกแยะว่าเป็น Error ของเซนเซอร์ หรือมีปัญหาจริงในระบบน้ำ' },
    ],
    stats: [
      { label: 'Model Accuracy', value: '94%' },
      { label: 'ประเภท AI', value: 'LSTM + XGBoost' },
      { label: 'Training Data', value: '2 ปี' },
      { label: 'Inference Time', value: '<50ms' },
    ],
    funfact: '💡 AI สามารถตรวจจับได้ว่าท่อน้ำมีรอยรั่วเล็กน้อย จากความผิดปกติของข้อมูลเซนเซอร์ ก่อนที่มนุษย์จะรู้สึกว่ามีน้ำรั่วเป็นชั่วโมง!',
  },

  'tech-iot': {
    icon: '📶',
    name: 'Internet of Things (IoT)',
    badge: { label: 'SENSOR NETWORK · 48 Nodes', color: '#06b6d4' },
    tagline: 'ระบบประสาทดิจิทัลของเมือง — ทุกอณูของน้ำถูกติดตาม',
    path: [
      { icon: '💧', label: 'น้ำในระบบ', type: 'source' },
      { icon: '📡', label: 'เซนเซอร์\nตรวจวัด', type: 'process' },
      { icon: '📶', label: 'WiFi/LoRa\nส่งสัญญาณ', type: 'process' },
      { icon: '☁️', label: 'Cloud/Edge\nประมวลผล', type: 'process' },
      { icon: '🧠', label: 'AI\nรับข้อมูล', type: 'dest' },
    ],
    steps: [
      { icon: '🕸️', title: 'เครือข่ายเซนเซอร์ 48 จุดทั่วเมือง', desc: 'ครอบคลุมถัง, ท่อ, สวน, อาคาร และจุดจ่ายน้ำ แต่ละจุดส่งข้อมูลทุก 30 วินาที ตลอด 24 ชั่วโมง' },
      { icon: '📶', title: 'WiFi สำหรับในอาคาร · LoRaWAN สำหรับกลางแจ้ง', desc: 'LoRaWAN ใช้พลังงานต่ำมาก แบตเตอรี่อยู่ได้ 5+ ปี สัญญาณทะลุทะลวงสิ่งกีดขวางได้ดี รัศมี 5 กม.' },
      { icon: '⚡', title: 'Edge Computing — ประมวลผลที่เซนเซอร์', desc: 'ESP32 กรองและประมวลผลเบื้องต้นก่อนส่งขึ้น Cloud ลดปริมาณข้อมูลที่ต้องส่ง 90% ประหยัด Bandwidth' },
    ],
    stats: [
      { label: 'เซนเซอร์', value: '48 จุด' },
      { label: 'โปรโตคอล', value: 'WiFi + LoRaWAN' },
      { label: 'รัศมีสัญญาณ', value: '5 กม.' },
      { label: 'อายุแบตเตอรี่', value: '5+ ปี (LoRa)' },
    ],
    funfact: '💡 LoRaWAN ใช้พลังงานน้อยมาก จนสามารถใช้พลังงานแสงอาทิตย์จากแผงโซลาร์ขนาดเล็กกว่านามบัตร เพื่อให้เซนเซอร์ทำงานได้ตลอดชีพ!',
  },

  'tech-esp32': {
    icon: '🔌',
    name: 'ESP32 Microcontroller',
    badge: { label: 'EDGE COMPUTING · Controller', color: '#f59e0b' },
    tagline: 'ขนาดเท่าฝ่ามือ แต่ควบคุมระบบน้ำทั้งหมดได้',
    path: [
      { icon: '📡', label: 'รับข้อมูล\nเซนเซอร์', type: 'source' },
      { icon: '🔌', label: 'ESP32\nประมวลผล', type: 'process' },
      { icon: '📶', label: 'ส่ง WiFi\nไปยัง Cloud', type: 'process' },
      { icon: '🔧', label: 'ควบคุม\nวาล์ว+ปั๊ม', type: 'dest' },
    ],
    steps: [
      { icon: '🧮', title: 'ประมวลผลเร็ว 240MHz ราคาไม่แพง', desc: 'ESP32 มี CPU 2 Core ความเร็ว 240MHz รองรับ WiFi + Bluetooth พร้อมกัน ราคาเพียง 100–200 บาท เหมาะสำหรับ IoT Scale ใหญ่' },
      { icon: '📡', title: 'รับสัญญาณจากเซนเซอร์หลายตัวพร้อมกัน', desc: 'ADC (Analog) รับค่า pH + Turbidity | I2C รับ Soil Moisture | GPIO รับ Water Level | UART ส่งข้อมูลไปยัง Cloud' },
      { icon: '🔧', title: 'ควบคุมวาล์วน้ำ Solenoid Valve', desc: 'ESP32 ส่งสัญญาณ 5V ผ่าน Relay ไปเปิด/ปิดวาล์วไฟฟ้า สั่งการได้ทั้งจาก AI และจากผู้ดูแล Manual' },
    ],
    stats: [
      { label: 'CPU Speed', value: '240 MHz' },
      { label: 'ราคา/ตัว', value: '~150 บาท' },
      { label: 'ใช้กี่ตัว', value: '48 ตัว' },
      { label: 'รองรับ', value: 'WiFi + BT + LoRa' },
    ],
    funfact: '💡 ESP32 ตัวเดียวสามารถอ่านเซนเซอร์ได้ 10+ ตัว ส่งข้อมูล WiFi ควบคุมวาล์ว และแสดงผลบน OLED พร้อมกัน ด้วยพลังงานเพียง 0.5 วัตต์!',
  },

  'tech-water-level': {
    icon: '📏',
    name: 'Water Level Sensor',
    badge: { label: 'SENSOR · ตรวจระดับน้ำ', color: '#22c55e' },
    tagline: 'รู้ทุกเสี้ยววินาทีว่าถังน้ำมีน้ำเหลือเท่าไหร่',
    path: [
      { icon: '🗄️', label: 'ถังน้ำ', type: 'source' },
      { icon: '📏', label: 'เซนเซอร์\nวัดระดับ', type: 'process' },
      { icon: '🔌', label: 'ESP32\nแปลงค่า', type: 'process' },
      { icon: '📊', label: 'Dashboard\n% น้ำสำรอง', type: 'dest' },
    ],
    steps: [
      { icon: '🔊', title: 'Ultrasonic Sensor — วัดด้วยคลื่นเสียง', desc: 'ส่งคลื่นเสียงความถี่สูงลงไปในถัง วัดเวลาที่คลื่นสะท้อนกลับมา คำนวณเป็นระยะห่าง แม่นยำ ±1 ซม.' },
      { icon: '🔴', title: 'Float Switch — สวิตช์ลูกลอย สำรองฉุกเฉิน', desc: 'ลูกลอยติดตั้งที่ระดับน้ำขั้นต่ำสุด ถ้าน้ำถึงจุดวิกฤตจะตัดสัญญาณฉุกเฉินทันทีโดยไม่ต้องผ่าน Software' },
      { icon: '📊', title: 'แสดงผลเป็น % บน Dashboard', desc: 'แปลงระยะทางเป็น % ของความจุถัง แสดงบนหน้า Dashboard พร้อมกราฟแนวโน้มย้อนหลัง 7 วัน' },
    ],
    stats: [
      { label: 'ความแม่นยำ', value: '±1 ซม.' },
      { label: 'ระยะวัดสูงสุด', value: '400 ซม.' },
      { label: 'วัดทุก', value: '30 วินาที' },
      { label: 'ราคา', value: '~80 บาท/ตัว' },
    ],
    funfact: '💡 เซนเซอร์ Ultrasonic ทำงานเหมือนค้างคาว — ส่งคลื่นเสียงออกไปและฟังเสียงสะท้อนกลับ คำนวณระยะห่างได้แม่นยำระดับมิลลิเมตร!',
  },

  'tech-ph': {
    icon: '🧪',
    name: 'pH Sensor',
    badge: { label: 'SENSOR · ตรวจค่ากรด-ด่าง', color: '#ef4444' },
    tagline: 'ตรวจสอบว่าน้ำปลอดภัยก่อนจ่ายไปใช้งาน',
    path: [
      { icon: '💧', label: 'น้ำในถัง', type: 'source' },
      { icon: '🧪', label: 'pH Electrode\nวัดค่า', type: 'process' },
      { icon: '🔌', label: 'ESP32\nแปลงสัญญาณ', type: 'process' },
      { icon: '✅', label: 'ผ่าน/ไม่ผ่าน\nมาตรฐาน', type: 'dest' },
    ],
    steps: [
      { icon: '⚗️', title: 'วัดความเป็นกรด-ด่าง ช่วง 0–14', desc: 'ใช้ Glass Electrode ที่ไวต่อ H⁺ Ions วัดค่า pH ของน้ำ ค่า 7 = กลาง, น้อยกว่า 7 = กรด, มากกว่า 7 = ด่าง' },
      { icon: '🌱', title: 'มาตรฐานน้ำรดต้นไม้ pH 6.0–7.5', desc: 'ต้นไม้ส่วนใหญ่ชอบน้ำที่เป็นกรดอ่อนๆ ถ้า pH สูงเกิน 7.5 ต้นไม้จะดูดแร่ธาตุได้ยาก ถ้าต่ำกว่า 6.0 อาจเป็นอันตราย' },
      { icon: '🔴', title: 'ตัดการจ่ายน้ำอัตโนมัติถ้าค่าผิดปกติ', desc: 'ถ้า pH ออกนอกช่วง 5.5–8.5 ระบบหยุดจ่ายน้ำทันที เปิดการกรองเพิ่ม และแจ้งเตือนผู้ดูแล' },
    ],
    stats: [
      { label: 'ช่วงวัด', value: 'pH 0–14' },
      { label: 'ความแม่นยำ', value: '±0.1 pH' },
      { label: 'เกณฑ์ปกติ', value: 'pH 6.5–8.5' },
      { label: 'วัดทุก', value: '5 นาที' },
    ],
    funfact: '💡 น้ำฝนตามธรรมชาติมี pH ประมาณ 5.6 (กรดอ่อน) เพราะละลาย CO₂ ในอากาศ ระบบ RAIN BANK จะปรับ pH ด้วยหินปูนเพื่อให้เหมาะกับพืชก่อนใช้งาน',
  },

  'tech-turbidity': {
    icon: '🌫️',
    name: 'Turbidity Sensor',
    badge: { label: 'SENSOR · วัดความขุ่นใส', color: '#8b5cf6' },
    tagline: 'ตรวจสอบความสะอาดของน้ำด้วยแสง — ขุ่น = ต้องกรองเพิ่ม',
    path: [
      { icon: '💧', label: 'น้ำในระบบ', type: 'source' },
      { icon: '💡', label: 'ส่องแสง\nInfrared', type: 'process' },
      { icon: '📸', label: 'วัดแสง\nกระจาย', type: 'process' },
      { icon: '📊', label: 'ค่า NTU\nบน Dashboard', type: 'dest' },
    ],
    steps: [
      { icon: '💡', title: 'ส่งแสง Infrared ผ่านน้ำ', desc: 'LED Infrared ส่องแสงผ่านตัวอย่างน้ำ ถ้าน้ำใส แสงจะผ่านตรง ถ้าน้ำขุ่น ตะกอนจะกระจายแสงออกทุกทิศ' },
      { icon: '📸', title: 'วัดแสงที่กระจายด้วย Photodiode', desc: 'Photodiode ติดตั้งที่มุม 90° วัดปริมาณแสงที่กระจาย ยิ่งกระจายมาก = ยิ่งขุ่น รายงานเป็นหน่วย NTU' },
      { icon: '🎯', title: 'มาตรฐาน WHO สำหรับน้ำสะอาด < 5 NTU', desc: 'น้ำดื่ม WHO < 1 NTU | น้ำอุปโภค < 5 NTU | น้ำรดต้นไม้ < 20 NTU ถ้าขุ่นเกิน ระบบกรองซ้ำก่อนใช้' },
    ],
    stats: [
      { label: 'หน่วยวัด', value: 'NTU' },
      { label: 'ค่าปกติระบบ', value: '< 5 NTU' },
      { label: 'ค่าปัจจุบัน', value: '3 NTU ✅' },
      { label: 'วัดทุก', value: '5 นาที' },
    ],
    funfact: '💡 น้ำที่ NTU = 3 ปัจจุบัน หมายความว่าสะอาดมาก มองเห็นผ่านน้ำได้ลึกกว่า 50 ซม. โดยไม่มีตะกอนให้เห็น เหมาะสำหรับรดน้ำพืชและล้างทำความสะอาด',
  },

  'tech-soil': {
    icon: '🌱',
    name: 'Soil Moisture Sensor',
    badge: { label: 'SENSOR · ความชื้นในดิน', color: '#06b6d4' },
    tagline: 'รดน้ำเฉพาะเมื่อพืชต้องการจริงๆ — ไม่มากเกินไม่น้อยเกิน',
    path: [
      { icon: '🌱', label: 'ดินรอบ\nต้นไม้', type: 'source' },
      { icon: '⚡', label: 'วัดสัญญาณ\nไฟฟ้าในดิน', type: 'process' },
      { icon: '🔌', label: 'ESP32\nแปลงเป็น %', type: 'process' },
      { icon: '🧠', label: 'AI ตัดสิน\nรดน้ำ/ไม่รด', type: 'dest' },
    ],
    steps: [
      { icon: '⚡', title: 'วัดค่าความต้านทานไฟฟ้าในดิน (Capacitive)', desc: 'ส่งสัญญาณไฟฟ้าผ่านดิน น้ำในดินนำไฟฟ้าได้ดีกว่าอากาศ ยิ่งดินชื้น ค่า Capacitance ยิ่งสูง แปลงเป็น % ความชื้น' },
      { icon: '📊', title: 'ช่วงค่าความชื้นดินที่เหมาะสม', desc: '< 30% = แห้งมาก ต้องรดน้ำด่วน | 30–60% = เหมาะสม ต้นไม้สบาย | > 80% = ชื้นเกิน ไม่ต้องรดน้ำ' },
      { icon: '🧠', title: 'AI ตัดสินใจรดน้ำอัตโนมัติ', desc: 'ถ้าความชื้นต่ำกว่า 40% + ไม่มีฝนใน 24 ชม. → AI สั่งรดน้ำทันที ถ้ามีฝนใน 6 ชม. → รอฝนแทน ประหยัดน้ำได้' },
    ],
    stats: [
      { label: 'ติดตั้ง', value: '12 จุดในสวน' },
      { label: 'ความชื้นปัจจุบัน', value: '58%' },
      { label: 'เกณฑ์รดน้ำ', value: '< 40%' },
      { label: 'ประหยัดน้ำ', value: '35% vs รดแบบปกติ' },
    ],
    funfact: '💡 ระบบรดน้ำแบบ Timer ทั่วไปรดน้ำ "ตามเวลา" โดยไม่สนว่าดินชื้นแค่ไหน HYDROLOOP รดน้ำ "ตามความต้องการจริง" ประหยัดน้ำได้ถึง 35%!',
  },

  'tech-weather': {
    icon: '🌤️',
    name: 'Weather Forecasting API',
    badge: { label: 'DATA SOURCE · พยากรณ์อากาศ', color: '#f97316' },
    tagline: 'ล่วงรู้ล่วงหน้า 72 ชั่วโมง — วางแผนน้ำก่อนฝนจะตก',
    path: [
      { icon: '🛰️', label: 'ดาวเทียม\nอุตุนิยมวิทยา', type: 'source' },
      { icon: '🌐', label: 'Weather API\nอุดรธานี', type: 'process' },
      { icon: '🧠', label: 'AI รวม\nข้อมูล', type: 'process' },
      { icon: '📋', label: 'แผนใช้น้ำ\n72 ชั่วโมง', type: 'dest' },
    ],
    steps: [
      { icon: '🛰️', title: 'ข้อมูลจากดาวเทียมอุตุนิยมวิทยา', desc: 'เชื่อมต่อ OpenWeatherMap API รับข้อมูลพยากรณ์อากาศสำหรับอุดรธานี ทุก 1 ชั่วโมง ล่วงหน้า 72 ชั่วโมง' },
      { icon: '🌧️', title: 'ข้อมูลที่ AI นำมาใช้', desc: 'ปริมาณฝนที่จะตก (มม.) · ความชื้นสัมพัทธ์ (%) · อุณหภูมิ (°C) · ทิศทางและความเร็วลม · ดัชนีความร้อน UV' },
      { icon: '🧠', title: 'AI ผสานข้อมูลอากาศกับข้อมูลเซนเซอร์', desc: 'ถ้าฝนจะตก 20 มม. พรุ่งนี้ AI จะไม่รดน้ำวันนี้ และเตรียมถังว่างรองรับน้ำฝน ประหยัดน้ำและเพิ่มการเก็บน้ำพร้อมกัน' },
    ],
    stats: [
      { label: 'พยากรณ์ล่วงหน้า', value: '72 ชั่วโมง' },
      { label: 'อัปเดต', value: 'ทุก 1 ชั่วโมง' },
      { label: 'ความแม่นยำ', value: '85% (24hr)' },
      { label: 'API Provider', value: 'OpenWeatherMap' },
    ],
    funfact: '💡 ในช่วงมรสุมของอุดรธานี (ก.ค.–ต.ค.) ฝนตกเฉลี่ย 15 วันต่อเดือน AI จะ "ประหยัดน้ำ" ล่วงหน้าทุกครั้ง ก่อนฝนตก ให้ถังว่างสูงสุดไว้รองรับ',
  },

  'tech-twin': {
    icon: '🌐',
    name: '3D Digital Twin',
    badge: { label: 'VISUALIZATION · เมืองดิจิทัล', color: '#a855f7' },
    tagline: 'สำเนาดิจิทัลของเมืองจริง — ทดสอบทุกอย่างในโลกเสมือนก่อนทำจริง',
    path: [
      { icon: '🏙️', label: 'เมืองจริง\nอุดรธานี', type: 'source' },
      { icon: '📡', label: 'ข้อมูล\nเซนเซอร์', type: 'process' },
      { icon: '🌐', label: '3D Digital\nTwin Model', type: 'process' },
      { icon: '💻', label: 'มองเห็น\nและวิเคราะห์', type: 'dest' },
    ],
    steps: [
      { icon: '🏗️', title: 'สร้างแบบจำลอง 3D ของเมืองอุดรธานี', desc: 'นำแผนที่จริงและตำแหน่งอาคารมาสร้างเป็นโมเดล 3D ในคอมพิวเตอร์ ครอบคลุมถนนสายหลัก อาคารสำคัญ และสวนหนองประจักษ์' },
      { icon: '📡', title: 'ซิงค์ข้อมูลเซนเซอร์แบบ Real-time', desc: 'โมเดล 3D แสดงสีของท่อน้ำตามปริมาณน้ำที่ไหลจริง อาคารที่มีระบบ AIR2ROOT จะกะพริบสีฟ้า เซนเซอร์ที่ผิดปกติจะแสดงสีแดง' },
      { icon: '🎮', title: 'จำลองสถานการณ์ก่อนทำจริง (Simulation)', desc: 'ทดลอง "ถ้าฝนตก 100 มม. จะเกิดอะไร?" บนโมเดล Digital Twin ก่อน โดยไม่กระทบระบบจริง ป้องกันความผิดพลาด' },
      { icon: '👆', title: 'คลิกดูรายละเอียดแต่ละจุด', desc: 'ผู้ดูแลคลิกอาคารหรือถังน้ำในโมเดล 3D เพื่อดูข้อมูลเซนเซอร์ ประวัติน้ำ และสถานะระบบแบบละเอียด' },
    ],
    stats: [
      { label: 'ความแม่นยำโมเดล', value: '95%' },
      { label: 'อาคารในโมเดล', value: '50+ อาคาร' },
      { label: 'Sync Real-time', value: 'ทุก 30 วินาที' },
      { label: 'Engine', value: 'Three.js WebGL' },
    ],
    funfact: '💡 Digital Twin ของเมืองนี้คือตัวเว็บไซต์ที่คุณกำลังดูอยู่! ส่วน 3D City ที่แสดงอุดรธานีแบบ Interactive คือตัวอย่างแรกของ HYDROLOOP Digital Twin',
  },

  'tech-dashboard': {
    icon: '📊',
    name: 'Real-time Dashboard (ECO-BRAIN UI)',
    badge: { label: 'INTERFACE · หน้าควบคุม', color: '#22c55e' },
    tagline: 'ทุกข้อมูลในที่เดียว — เข้าใจสถานะทั้งเมืองได้ในนาทีเดียว',
    path: [
      { icon: '📡', label: 'ข้อมูล\nทุกเซนเซอร์', type: 'source' },
      { icon: '⚙️', label: 'ประมวลผล\n& รวมข้อมูล', type: 'process' },
      { icon: '📊', label: 'Dashboard\nแสดงผล', type: 'process' },
      { icon: '👤', label: 'ผู้ดูแล\nตัดสินใจ', type: 'dest' },
    ],
    steps: [
      { icon: '📊', title: 'Gauge แสดงสถานะแบบเรียลไทม์', desc: 'วงกลม Gauge แสดงน้ำสำรอง pH ความขุ่น และความชื้นดิน อ่านค่าได้ทันทีโดยไม่ต้องตีความ' },
      { icon: '📈', title: 'กราฟแนวโน้ม 7 วันย้อนหลัง', desc: 'เส้นกราฟแสดงปริมาณน้ำที่รวบรวมได้เทียบกับที่ใช้ไป มองเห็นแนวโน้มและคาดการณ์อนาคต' },
      { icon: '🚨', title: 'ระบบแจ้งเตือนอัตโนมัติ', desc: 'Notification แสดงทันทีเมื่อค่าใดผิดปกติ เรียงตามความเร่งด่วน สีแดง = วิกฤต เหลือง = ระวัง เขียว = ปกติ' },
      { icon: '🧠', title: 'AI Insight แนะนำการดำเนินการ', desc: 'ECO-BRAIN แสดงคำแนะนำ เช่น "ควรเตรียมถังว่างก่อนฝนพรุ่งนี้" หรือ "ความชื้นดินโซน C ต่ำ ควรรดน้ำ"' },
    ],
    stats: [
      { label: 'Panel ทั้งหมด', value: '6 Panel' },
      { label: 'Refresh Rate', value: 'ทุก 30 วินาที' },
      { label: 'ข้อมูลที่แสดง', value: '12+ metrics' },
      { label: 'รองรับ', value: 'Mobile / Desktop' },
    ],
    funfact: '💡 ECO-BRAIN Dashboard ออกแบบให้ผู้ดูแลที่ไม่ใช่นักเทคนิคสามารถเข้าใจสถานะของระบบน้ำทั้งเมืองได้ภายใน 10 วินาที โดยดูเพียงสีของ Gauge',
  },
};

/* ── Render Detail Panel ── */
function openDetail(id) {
  const data = DETAIL_DATA[id];
  if (!data) return;

  const modal = document.getElementById('detailModal');

  // Header
  document.getElementById('detailIcon').textContent = data.icon;
  document.getElementById('detailTitle').textContent = data.name;
  document.getElementById('detailTagline').textContent = data.tagline;

  const badge = document.getElementById('detailBadge');
  badge.textContent = data.badge.label;
  badge.style.background = data.badge.color + '22';
  badge.style.color = data.badge.color;
  badge.style.border = `1px solid ${data.badge.color}55`;

  // Water Path Diagram
  const pathEl = document.getElementById('waterPathDiagram');
  pathEl.innerHTML = data.path.map((node, i) => `
    ${i > 0 ? `<div class="path-arrow">→</div>` : ''}
    <div class="path-node ${node.type}">
      <div class="path-node-icon">${node.icon}</div>
      <div class="path-node-label">${node.label}</div>
    </div>
  `).join('');

  // How It Works Steps
  const hiwEl = document.getElementById('hiwSteps');
  hiwEl.innerHTML = data.steps.map((step, i) => `
    <div class="hiw-step" style="animation-delay:${i * 0.07}s">
      <div class="hiw-step-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="hiw-step-icon">${step.icon}</div>
      <div class="hiw-step-content">
        <div class="hiw-step-title">${step.title}</div>
        <div class="hiw-step-desc">${step.desc}</div>
      </div>
    </div>
  `).join('');

  // Stats
  const statsEl = document.getElementById('detailStatsGrid');
  statsEl.innerHTML = data.stats.map(s => `
    <div class="detail-stat-item">
      <div class="detail-stat-label">${s.label}</div>
      <div class="detail-stat-value">${s.value}</div>
    </div>
  `).join('');

  // Fun fact
  document.getElementById('detailFunfact').textContent = data.funfact;

  // Open
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  const modal = document.getElementById('detailModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}

// Expose to window for global access
window.openDetail = openDetail;
window.closeDetail = closeDetail;

/* ── Wire up all clickable elements ── */
function initDetailDrawer() {
  // Close triggers
  document.getElementById('detailClose')?.addEventListener('click', closeDetail);
  document.getElementById('detailBackdrop')?.addEventListener('click', closeDetail);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetail(); });

  // Delegate clicks on data-detail elements
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-detail]');
    if (el) openDetail(el.dataset.detail);
  });
}
