/**
 * HYDROLOOP 2040 — AI-POWERED CIRCULAR WATER MANAGEMENT CITY
 * Complete Interactive Application Logic
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
   1. NAVIGATION & SCROLL SPY
   ═══════════════════════════════════════════════════════════════ */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Scroll spy
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    links.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-section') === current) {
        link.classList.add('active');
      }
    });
  });

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  links.forEach(link => {
    link.addEventListener('click', () => {
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   2. HERO INTERACTIVE WATER CANVAS
   ═══════════════════════════════════════════════════════════════ */
function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = Math.min(width > 768 ? 70 : 35, 80);

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.5 + 1,
      speedX: (Math.random() - 0.5) * 0.6,
      speedY: -Math.random() * 0.8 - 0.3,
      alpha: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI
    });
  }

  let mouseX = width / 2;
  let mouseY = height / 2;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Subtle water gradient backdrop
    const grad = ctx.createRadialGradient(mouseX, mouseY, 50, width / 2, height / 2, width);
    grad.addColorStop(0, 'rgba(0, 212, 255, 0.08)');
    grad.addColorStop(1, 'rgba(7, 13, 23, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Particle nodes & connections
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.pulse += 0.03;

      if (p.y < -10) p.y = height + 10;
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      const currentRadius = p.radius + Math.sin(p.pulse) * 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00d4ff';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw faint connections
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0, 212, 255, ${0.15 * (1 - dist / 110)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(render);
  }
  render();
}

/* ═══════════════════════════════════════════════════════════════
   3. HERO STATS COUNTER ANIMATION
   ═══════════════════════════════════════════════════════════════ */
function initHeroStats() {
  const statNums = document.querySelectorAll('.stat-num');
  let animated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        statNums.forEach(el => {
          const target = parseInt(el.getAttribute('data-target'), 10);
          const suffix = el.getAttribute('data-suffix') || '';
          const duration = 1800;
          const start = performance.now();

          function updateCount(now) {
            const progress = Math.min((now - start) / duration, 1);
            const easeOutQuad = 1 - (1 - progress) * (1 - progress);
            const val = Math.floor(easeOutQuad * target);
            el.textContent = val.toLocaleString() + suffix;
            if (progress < 1) {
              requestAnimationFrame(updateCount);
            } else {
              el.textContent = target.toLocaleString() + suffix;
            }
          }
          requestAnimationFrame(updateCount);
        });
      }
    });
  }, { threshold: 0.3 });

  const homeSection = document.getElementById('home');
  if (homeSection) observer.observe(homeSection);
}

/* ═══════════════════════════════════════════════════════════════
   4. 3D CITY VISUALIZATION (THREE.JS)
   ═══════════════════════════════════════════════════════════════ */
function init3DCity() {
  const container = document.querySelector('.city3d-container');
  const canvas = document.getElementById('cityCanvas');
  if (!container || !canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060c18);
  scene.fog = new THREE.FogExp2(0x060c18, 0.015);

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  const defaultCameraPos = new THREE.Vector3(42, 38, 55);
  camera.position.copy(defaultCameraPos);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x102038, 1.8);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0x00d4ff, 1.5);
  dirLight.position.set(30, 50, 30);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const hemiLight = new THREE.HemisphereLight(0x00d4ff, 0x07111e, 0.8);
  scene.add(hemiLight);

  // Groups for layer control
  const groupBuildings = new THREE.Group();
  const groupWaterPipes = new THREE.Group();
  const groupSensors = new THREE.Group();
  const groupGreen = new THREE.Group();
  scene.add(groupBuildings);
  scene.add(groupWaterPipes);
  scene.add(groupSensors);
  scene.add(groupGreen);

  // City Ground Grid
  const gridHelper = new THREE.GridHelper(90, 45, 0x00d4ff, 0x11233d);
  gridHelper.position.y = -0.1;
  scene.add(gridHelper);

  const groundGeo = new THREE.PlaneGeometry(120, 120);
  const groundMat = new THREE.MeshBasicMaterial({ color: 0x040812 });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = -0.15;
  scene.add(groundMesh);

  // Interactive Objects Array for Raycasting
  const interactableObjects = [];

  // Building metadata for the popups
  const buildingData = [
    {
      id: 'air2root-hub',
      name: 'AIR2ROOT Tower',
      icon: '❄️',
      desc: 'อาคารสำนักงานอัจฉริยะ ติดตั้งระบบรวบรวมน้ำควบแน่นจากระบบปรับอากาศส่วนกลาง ส่งเข้าท่อกรองความดันต่ำเพื่อกักเก็บใน RAIN BANK',
      stats: { 'Condensate/Day': '340 Liters', 'HVAC Units': '84 Units', 'Status': 'Optimized', 'Saved Energy': '18%' },
      pos: [-16, 0, -12],
      size: [8, 26, 8],
      color: 0x00d4ff
    },
    {
      id: 'rain-bank-main',
      name: 'RAIN BANK Deep Storage',
      icon: '🌧️',
      desc: 'ศูนย์กักเก็บน้ำฝนใต้ดินขนาด 8,500 ลิตร พร้อมระบบบำบัด 3 ชั้น (Bio-filtration, UV Sterilization, Sand Bed) เติมน้ำกลับเข้าสู่วงจรเมือง',
      stats: { 'Total Capacity': '8,500 L', 'Current Level': '72%', 'Filtration Rate': '12 L/min', 'Quality Index': 'A+' },
      pos: [14, 0, -14],
      size: [12, 14, 12],
      color: 0x3b82f6
    },
    {
      id: 'eco-brain-tower',
      name: 'ECO-BRAIN AI Tower',
      icon: '🧠',
      desc: 'ศูนย์กลางประมวลผล AI และ Digital Twin ของเมือง รวบรวมข้อมูลเซนเซอร์ 48 จุด เพื่อคำนวณและสั่งการจัดสรรน้ำแบบเรียลไทม์',
      stats: { 'Active Nodes': '48 IoT', 'AI Confidence': '94%', 'Forecast Horizon': '72 Hrs', 'Latency': '12ms' },
      pos: [0, 0, 0],
      size: [10, 34, 10],
      color: 0xa855f7
    },
    {
      id: 'sponge-park',
      name: 'SPONGE CITY Bio-Zone',
      icon: '🌿',
      desc: 'สวนรับน้ำและพื้นที่ชุ่มน้ำประดิษฐ์ ออกแบบด้วยดินและพืชพรรณดูดซับน้ำฝนสูง ลดน้ำท่วมขังได้ 70% และช่วยเติมความชุ่มชื้นแก่ดิน',
      stats: { 'Permeable Area': '2,400 m²', 'Soil Moisture': '58%', 'Water Infiltrated': '4,200 L', 'Flora Index': 'Healthy' },
      pos: [-14, 0, 16],
      size: [16, 3, 16],
      color: 0x10b981
    },
    {
      id: 'aqua-guard-station',
      name: 'AQUA-GUARD IoT Hub',
      icon: '📡',
      desc: 'สถานีตรวจสอบคุณภาพน้ำ ตรวจวัดค่า pH, ความขุ่น (Turbidity), อุณหภูมิ และระดับสารปนเปื้อนด้วย ESP32 ไมโครคอนโทรลเลอร์',
      stats: { 'pH Level': '7.2', 'Turbidity': '3 NTU', 'Telemetry': 'LoRaWAN', 'Battery Reserve': '99%' },
      pos: [18, 0, 14],
      size: [7, 18, 7],
      color: 0x14b8a6
    }
  ];

  // Helper: create building material with glowing edges
  function createBuildingMaterial(baseColor) {
    return new THREE.MeshPhongMaterial({
      color: 0x0a1628,
      emissive: baseColor,
      emissiveIntensity: 0.18,
      specular: 0x00d4ff,
      shininess: 40,
      flatShading: true
    });
  }

  // Build Interactive Landmark Buildings
  buildingData.forEach(data => {
    const geo = new THREE.BoxGeometry(data.size[0], data.size[1], data.size[2]);
    const mat = createBuildingMaterial(data.color);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(data.pos[0], data.size[1] / 2, data.pos[2]);
    mesh.userData = data;

    // Glowing wireframe outline
    const wireGeo = new THREE.EdgesGeometry(geo);
    const wireMat = new THREE.LineBasicMaterial({ color: data.color, linewidth: 1.5 });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    mesh.add(wireMesh);

    // Glowing roof cap
    const capGeo = new THREE.BoxGeometry(data.size[0] * 0.9, 0.5, data.size[2] * 0.9);
    const capMat = new THREE.MeshBasicMaterial({ color: data.color });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.y = data.size[1] / 2 + 0.3;
    mesh.add(capMesh);

    groupBuildings.add(mesh);
    interactableObjects.push(mesh);
  });

  // Build Ambient City Skyscraper Blocks
  const ambientCoords = [
    [-28, 0, -28], [-28, 0, -10], [-28, 0, 10], [-28, 0, 26],
    [-10, 0, -28], [10, 0, -28], [28, 0, -28], [28, 0, -10],
    [28, 0, 10], [28, 0, 28], [10, 0, 28], [-10, 0, 28]
  ];

  ambientCoords.forEach((coord, i) => {
    const h = 12 + Math.random() * 20;
    const w = 5 + Math.random() * 3;
    const d = 5 + Math.random() * 3;
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x0b1424,
      emissive: 0x002244,
      emissiveIntensity: 0.1,
      flatShading: true
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(coord[0], h / 2, coord[2]);

    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x173153 })
    );
    mesh.add(wire);
    groupBuildings.add(mesh);
  });

  // Green Sponge Biome Zones
  const greenGroundGeo = new THREE.CylinderGeometry(9, 9, 0.4, 24);
  const greenGroundMat = new THREE.MeshLambertMaterial({ color: 0x064e3b });
  const greenZone = new THREE.Mesh(greenGroundGeo, greenGroundMat);
  greenZone.position.set(-14, 0.2, 16);
  groupGreen.add(greenZone);

  // Small trees on green zone
  for (let t = 0; t < 14; t++) {
    const treeGeo = new THREE.ConeGeometry(0.8, 2.2, 5);
    const treeMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const tree = new THREE.Mesh(treeGeo, treeMat);
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 7;
    tree.position.set(-14 + Math.cos(angle) * radius, 1.4, 16 + Math.sin(angle) * radius);
    groupGreen.add(tree);
  }

  // IoT Sensor Tower Nodes
  const sensorPositions = [
    [-16, 26, -12], [14, 14, -14], [0, 34, 0], [-14, 4, 16], [18, 18, 14],
    [-5, 8, -5], [5, 8, 5], [0, 6, -15], [0, 6, 15]
  ];

  const sensorMeshes = [];
  sensorPositions.forEach(pos => {
    const nodeGeo = new THREE.SphereGeometry(0.6, 12, 12);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff });
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.set(pos[0], pos[1] + 1.2, pos[2]);

    // Ring beacon
    const ringGeo = new THREE.RingGeometry(0.8, 1.1, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    node.add(ring);

    groupSensors.add(node);
    sensorMeshes.push({ mesh: node, ring, baseScale: 1 });
  });

  // Animated Water Pipeline Routes (Tubes + Moving Flow Particles)
  const pipeCurves = [
    // Air2Root -> Rain Bank
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-16, 2, -12),
      new THREE.Vector3(-8, 2, -13),
      new THREE.Vector3(0, 3, -14),
      new THREE.Vector3(14, 2, -14)
    ]),
    // Rain Bank -> Eco-Brain
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(14, 2, -14),
      new THREE.Vector3(7, 2.5, -7),
      new THREE.Vector3(0, 3, 0)
    ]),
    // Eco-Brain -> Sponge Park
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 3, 0),
      new THREE.Vector3(-7, 2, 8),
      new THREE.Vector3(-14, 1.5, 16)
    ]),
    // Sponge Park -> Aqua-Guard
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-14, 1.5, 16),
      new THREE.Vector3(2, 2, 15),
      new THREE.Vector3(18, 2, 14)
    ])
  ];

  pipeCurves.forEach(curve => {
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.35, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.35,
      wireframe: true
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    groupWaterPipes.add(tube);
  });

  // Moving Water Drops along curves
  const waterDrops = [];
  pipeCurves.forEach(curve => {
    for (let d = 0; d < 4; d++) {
      const dropGeo = new THREE.SphereGeometry(0.5, 8, 8);
      const dropMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const drop = new THREE.Mesh(dropGeo, dropMat);
      groupWaterPipes.add(drop);
      waterDrops.push({
        mesh: drop,
        curve: curve,
        progress: d * 0.25,
        speed: 0.004 + Math.random() * 0.002
      });
    }
  });

  // Interactive Camera Controls (Mouse Drag & Scroll Zoom)
  let isDragging = false;
  let previousMousePos = { x: 0, y: 0 };
  let spherical = { radius: 78, theta: Math.PI / 4, phi: Math.PI / 3.2 };

  function updateCameraPosition() {
    spherical.phi = Math.max(0.1, Math.min(Math.PI / 2.05, spherical.phi));
    spherical.radius = Math.max(25, Math.min(130, spherical.radius));

    camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    camera.position.y = spherical.radius * Math.cos(spherical.phi);
    camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    camera.lookAt(0, 5, 0);
  }
  updateCameraPosition();

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePos = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - previousMousePos.x;
      const deltaY = e.clientY - previousMousePos.y;
      spherical.theta -= deltaX * 0.007;
      spherical.phi -= deltaY * 0.007;
      updateCameraPosition();
      previousMousePos = { x: e.clientX, y: e.clientY };
    }
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    spherical.radius += e.deltaY * 0.05;
    updateCameraPosition();
  }, { passive: false });

  // Touch controls for mobile
  let touchStartDist = 0;
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      previousMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      touchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && isDragging) {
      const deltaX = e.touches[0].clientX - previousMousePos.x;
      const deltaY = e.touches[0].clientY - previousMousePos.y;
      spherical.theta -= deltaX * 0.008;
      spherical.phi -= deltaY * 0.008;
      updateCameraPosition();
      previousMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = (touchStartDist - dist) * 0.1;
      spherical.radius += factor;
      updateCameraPosition();
      touchStartDist = dist;
    }
  });

  canvas.addEventListener('touchend', () => { isDragging = false; });

  // Raycasting for Building Click
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const overlay = document.getElementById('cityOverlay');
  const overlayIcon = document.getElementById('overlayIcon');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayDesc = document.getElementById('overlayDesc');
  const overlayStats = document.getElementById('overlayStats');
  const overlayClose = document.getElementById('overlayClose');

  if (overlayClose) {
    overlayClose.addEventListener('click', () => {
      overlay.style.display = 'none';
    });
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / canvas.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactableObjects);

    if (intersects.length > 0) {
      const bData = intersects[0].object.userData;
      if (bData && bData.name) {
        overlayIcon.textContent = bData.icon;
        overlayTitle.textContent = bData.name;
        overlayDesc.textContent = bData.desc;

        let statsHtml = '';
        for (const [k, v] of Object.entries(bData.stats)) {
          statsHtml += `<div><span style="color:var(--text-muted)">${k}</span><br/><strong style="color:var(--accent-cyan)">${v}</strong></div>`;
        }
        overlayStats.innerHTML = statsHtml;
        overlay.style.display = 'block';

        // Flash building
        const origColor = intersects[0].object.material.emissive.getHex();
        intersects[0].object.material.emissive.setHex(0x00ffff);
        setTimeout(() => {
          intersects[0].object.material.emissive.setHex(origColor);
        }, 400);
      }
    }
  });

  // Layer toggles
  setupLayerToggle('toggleBuildings', groupBuildings);
  setupLayerToggle('toggleWater', groupWaterPipes);
  setupLayerToggle('toggleSensors', groupSensors);
  setupLayerToggle('toggleGreen', groupGreen);

  function setupLayerToggle(btnId, targetGroup) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      targetGroup.visible = !targetGroup.visible;
      btn.classList.toggle('active', targetGroup.visible);
    });
  }

  // Reset Camera View
  const resetBtn = document.getElementById('resetCamera');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      spherical = { radius: 78, theta: Math.PI / 4, phi: Math.PI / 3.2 };
      updateCameraPosition();
    });
  }

  // Handle Resize
  window.addEventListener('resize', () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // Animation Loop
  let clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    // Idle slow city rotation if not dragging
    if (!isDragging) {
      spherical.theta += 0.0006;
      updateCameraPosition();
    }

    // Move water flow drops
    waterDrops.forEach(drop => {
      drop.progress = (drop.progress + drop.speed) % 1;
      const pt = drop.curve.getPointAt(drop.progress);
      drop.mesh.position.copy(pt);
    });

    // Pulse IoT sensors
    sensorMeshes.forEach((s, idx) => {
      const scale = 1 + Math.sin(elapsed * 4 + idx) * 0.4;
      s.ring.scale.set(scale, scale, 1);
    });

    renderer.render(scene, camera);
  }
  animate();
}

/* ═══════════════════════════════════════════════════════════════
   5. AI CONTROL CENTER — GAUGES
   ═══════════════════════════════════════════════════════════════ */
function initDashboardGauges() {
  drawGauge('gaugeWater', 72, 100, '#00d4ff');
  drawGauge('gaugePH', 7.2, 14, '#10b981');
  drawGauge('gaugeTurbidity', 3, 10, '#a855f7');
  drawGauge('gaugeSoil', 58, 100, '#14b8a6');
}

function drawGauge(canvasId, value, maxVal, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const center = w / 2;
  const radius = center - 16;
  const startAngle = Math.PI * 0.75;
  const endAngle = Math.PI * 2.25;
  const pct = Math.min(value / maxVal, 1);
  const currentAngle = startAngle + (endAngle - startAngle) * pct;

  ctx.clearRect(0, 0, w, h);

  // Background track
  ctx.beginPath();
  ctx.arc(center, center, radius, startAngle, endAngle);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Active value track
  ctx.beginPath();
  ctx.arc(center, center, radius, startAngle, currentAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

/* ═══════════════════════════════════════════════════════════════
   6. AI CONTROL CENTER — CHARTS
   ═══════════════════════════════════════════════════════════════ */
let collectionChartInstance = null;
let sourceChartInstance = null;

function initDashboardCharts() {
  if (typeof Chart === 'undefined') return;

  // Chart styling defaults
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.font.family = 'Inter';

  // 1. Water Collection Trend
  const colCtx = document.getElementById('collectionChart');
  if (colCtx) {
    collectionChartInstance = new Chart(colCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Collected Water (L)',
            data: [9200, 11400, 8500, 7800, 13200, 12000, 10800],
            borderColor: '#00d4ff',
            backgroundColor: 'rgba(0, 212, 255, 0.12)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#00d4ff'
          },
          {
            label: 'Recycled Usage (L)',
            data: [8100, 9500, 8000, 7200, 10800, 11200, 9600],
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            tension: 0.4,
            borderWidth: 2,
            borderDash: [4, 4],
            pointBackgroundColor: '#10b981'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12 } }
        },
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
          y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
        }
      }
    });
  }

  // 2. Water Source Distribution Pie
  const pieCtx = document.getElementById('sourceChart');
  if (pieCtx) {
    sourceChartInstance = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: ['RAIN BANK', 'AIR2ROOT', 'SPONGE CITY'],
        datasets: [{
          data: [48, 32, 20],
          backgroundColor: ['#00d4ff', '#38bdf8', '#10b981'],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12 } }
        },
        cutout: '70%'
      }
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   7. AI INSIGHTS ENGINE
   ═══════════════════════════════════════════════════════════════ */
function initAIInsights() {
  const insightBox = document.getElementById('aiInsightBox');
  const recommendationsDiv = document.getElementById('aiRecommendations');
  const refreshBtn = document.getElementById('refreshInsight');

  const insightsPool = [
    {
      text: "⚡ คาดการณ์ฝนตกหนักอีก 14 ชั่วโมงข้างหน้า (ความน่าจะเป็น 82%) แนะนำให้ปล่อยน้ำสำรองใน RAIN BANK ลง 18% สู่พื้นที่สีเขียวล่วงหน้า เพื่อเตรียมความจุรองรับน้ำฝนระลอกใหม่ ป้องกันน้ำล้นท่อระบายน้ำ",
      recs: [
        "เปิดวาล์ว V-03 ระบายน้ำรดน้ำสวนรับน้ำล่วงหน้า 350 ลิตร",
        "ปรับโหมด SPONGE CITY สู่ Retention Buffer Mode",
        "ส่งสัญญาณแจ้งเตือน IoT Nodes บริเวณจุดเสี่ยงลุ่มต่ำ"
      ]
    },
    {
      text: "☀️ ความชื้นในดินโซนตะวันออกลดลงสู่ 42% ขณะที่เครื่องปรับอากาศในอาคารสำนักงานปล่อยน้ำควบแน่นสูงสุด (AIR2ROOT +38%) แนะนำผันน้ำแอร์ไปรดน้ำแปลงเกษตรแนวตั้งทันทีโดยไม่ต้องดึงน้ำประปา",
      recs: [
        "ผันน้ำแอร์ 240 ลิตร เข้าสู่รากต้นไม้โดยตรง (Sub-irrigation)",
        "ประหยัดน้ำประปาได้ 100% สำหรับรอบการรดน้ำช่วงบ่าย",
        "เซนเซอร์ความชื้นดินคาดว่าจะฟื้นสู่ 62% ใน 2 ชั่วโมง"
      ]
    },
    {
      text: "🔬 ค่าความขุ่น (Turbidity) ของน้ำฝนรอบล่าสุดอยู่ที่ 2.8 NTU คุณภาพดีเยี่ยมเหนือมาตรฐาน Eco-Urban Grade A แนะนำส่งต่อน้ำสำรองไปยังระบบชะล้างอาคารและระบบดับเพลิงสำรอง",
      recs: [
        "เติมถังดับเพลิงสำรอง Emergency Tank A ครบ 100%",
        "ข้ามขั้นตอนการบำบัดรอง ประหยัดพลังงานปั๊มกรอง 14%",
        "บันทึกค่าคุณภาพน้ำลงใน Digital Twin Data Ledger"
      ]
    }
  ];

  let currentIdx = 0;

  function updateInsight() {
    if (!insightBox) return;
    const current = insightsPool[currentIdx];

    insightBox.innerHTML = `
      <div style="color:var(--text-main); font-weight:500;">
        <span style="color:var(--accent-cyan); font-weight:700;">AQUA-PREDICT ANALYSIS:</span><br/>
        ${current.text}
      </div>
    `;

    if (recommendationsDiv) {
      recommendationsDiv.innerHTML = current.recs.map(r => `
        <div class="ai-rec-item">✓ ${r}</div>
      `).join('');
    }

    currentIdx = (currentIdx + 1) % insightsPool.length;
  }

  updateInsight();

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      insightBox.innerHTML = `
        <div class="ai-thinking">
          <div class="ai-pulse"></div>
          <span>AI กำลังวิเคราะห์ข้อมูลเซนเซอร์แบบเรียลไทม์...</span>
        </div>
      `;
      setTimeout(updateInsight, 700);
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   8. SIMULATION ENGINE
   ═══════════════════════════════════════════════════════════════ */
function initSimulation() {
  const scenarioBtns = document.querySelectorAll('.scenario-btn');
  const simScreen = document.getElementById('simScreen');
  const simMetrics = document.getElementById('simMetrics');
  const simWaterBar = document.getElementById('simWaterBar');
  const simWaterVal = document.getElementById('simWaterVal');
  const simAIBar = document.getElementById('simAIBar');
  const simAIVal = document.getElementById('simAIVal');
  const simFloodBar = document.getElementById('simFloodBar');
  const simFloodVal = document.getElementById('simFloodVal');
  const allocationPanel = document.getElementById('allocationPanel');

  const scenarios = {
    'heavy-rain': {
      title: '⛈️ จำลองสถานการณ์ฝนตกหนัก (Heavy Rain)',
      desc: 'ปริมาณฝนตกสะสม 85 มม./ชม. ระบบ Sponge City และ Rain Bank เริ่มทำงานเต็มกำลังเพื่อหน่วงน้ำและรองรับน้ำไหลบ่า',
      actions: [
        'ระบบ SPONGE CITY กักเก็บและซึมซับน้ำฝนลงสู่ชั้นดิน 4,200 L/ชม.',
        'RAIN BANK เปิดวาล์วดักน้ำฝนหลังคาอาคาร 84 จุด พร้อมระบบกรองตะกอนอัตโนมัติ',
        'AI สั่งการหน่วงน้ำ ลดอัตราน้ำท่วมขังบนผิวถนนลงได้ 88%'
      ],
      waterLevel: '95%',
      waterWidth: '95%',
      aiResp: 'Instant (0.4s)',
      aiWidth: '98%',
      floodRisk: '12% (Safe)',
      floodWidth: '12%'
    },
    'drought': {
      title: '☀️ จำลองสถานการณ์ภัยแล้ง (Drought)',
      desc: 'ไม่มีฝนตกต่อเนื่อง 21 วัน อุณหภูมิเฉลี่ย 36°C ระบบเปลี่ยนสู่โหมดอนุรักษ์น้ำสูงสุดและดึงน้ำควบแน่นจากเครื่องปรับอากาศ',
      actions: [
        'AIR2ROOT รวบรวมน้ำควบแน่นจากแอร์ได้ 420 L/วัน ชดเชยการขาดแคลนฝน',
        'AI สั่งลดการรดน้ำพื้นผิวทั่วไป และใช้ระบบน้ำหยดใต้ดินเฉพาะจุดวิกฤต',
        'สำรองน้ำใน RAIN BANK เพียงพอสำหรับเมืองอีก 45 วัน โดยไม่ต้องพึ่งน้ำประปาภายนอก'
      ],
      waterLevel: '42%',
      waterWidth: '42%',
      aiResp: 'Eco-Mode (1.2s)',
      aiWidth: '90%',
      floodRisk: '0% (None)',
      floodWidth: '2%'
    },
    'low-soil': {
      title: '🏜️ ความชื้นในดินต่ำ (Low Soil Moisture)',
      desc: 'เซนเซอร์ในสวนรับน้ำและพื้นที่สีเขียวตรวจพบความชื้นดินลดลงต่ำกว่า 30% พืชพรรณเริ่มส่งสัญญาณขาดน้ำ',
      actions: [
        'AQUA-GUARD ส่งสัญญาณเตือนความชื้นดินต่ำไปยัง ECO-BRAIN',
        'AI วิเคราะห์สภาพอากาศ พบว่าไม่มีฝนใน 48 ชม. สั่งจ่ายน้ำสำรอง 650 ลิตรทันที',
        'ความชื้นในดินกลับคืนสู่ระดับเหมาะสม 60% ภายใน 30 นาที'
      ],
      waterLevel: '68%',
      waterWidth: '68%',
      aiResp: 'Automated (0.8s)',
      aiWidth: '95%',
      floodRisk: '4% (Safe)',
      floodWidth: '4%'
    },
    'full-tank': {
      title: '🛢️ ถังเก็บน้ำใกล้เต็ม (Full Water Tank)',
      desc: 'ระดับน้ำใน RAIN BANK แตะระดับ 92% ของความจุสูงสุด พร้อมข้อมูลพยากรณ์ว่าจะมีฝนตกเพิ่มในวันพรุ่งนี้',
      actions: [
        'AI คาดการณ์ล่วงหน้าและสั่งปล่อยน้ำส่วนเกิน 1,200 L ไปยังระบบเติมน้ำใต้ดิน (Aquifer Recharge)',
        'แบ่งน้ำบางส่วนไปใช้ล้างถนน ทำความสะอาดพื้นที่สาธารณะ และเติมบ่อนันทนาการ',
        'ถังมีพื้นที่ว่างเพียงพอรองรับน้ำฝนรอบใหม่ ไม่สูญเสียน้ำทิ้งอย่างไร้ประโยชน์'
      ],
      waterLevel: '98%',
      waterWidth: '98%',
      aiResp: 'Optimized (0.5s)',
      aiWidth: '96%',
      floodRisk: '18% (Controlled)',
      floodWidth: '18%'
    },
    'allocation': {
      title: '⚖️ ทดลองจัดสรรน้ำแบบกำหนดเอง (Water Allocation)',
      desc: 'ทดลองปรับสัดส่วนการแจกจ่ายน้ำสำรองให้แก่ 5 ภาคส่วนหลักของเมือง และดูการจำลองผลตอบสนอง',
      actions: [
        'ใช้แถบเลื่อนด้านล่างเพื่อปรับสัดส่วนการจ่ายน้ำ',
        'AI จะตรวจสอบสมดุลและคำนวณผลกระทบต่อความมั่นคงทางน้ำของเมืองแบบเรียลไทม์'
      ],
      waterLevel: '72%',
      waterWidth: '72%',
      aiResp: 'User-Driven',
      aiWidth: '85%',
      floodRisk: '8% (Normal)',
      floodWidth: '8%'
    }
  };

  scenarioBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      scenarioBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const scKey = btn.getAttribute('data-scenario');
      const data = scenarios[scKey];
      if (!data) return;

      // Update Screen
      simScreen.innerHTML = `
        <div class="sim-active-card">
          <div class="sim-active-header">
            <h3 class="sim-active-title">${data.title}</h3>
          </div>
          <p class="sim-active-desc">${data.desc}</p>
          <div class="sim-actions-list">
            <div class="sim-actions-title">🤖 AI & SYSTEM ACTIONS:</div>
            <ul>
              ${data.actions.map(act => `<li>▸ ${act}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;

      // Update Metrics
      simMetrics.style.display = 'flex';
      simWaterBar.style.width = data.waterWidth;
      simWaterVal.textContent = data.waterLevel;
      simAIBar.style.width = data.aiWidth;
      simAIVal.textContent = data.aiResp;
      simFloodBar.style.width = data.floodWidth;
      simFloodVal.textContent = data.floodRisk;

      // Show/hide Allocation Panel
      if (scKey === 'allocation') {
        allocationPanel.style.display = 'block';
        initAllocationSliders();
      } else {
        allocationPanel.style.display = 'none';
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   9. WATER ALLOCATION SLIDERS & DYNAMIC CHART
   ═══════════════════════════════════════════════════════════════ */
let allocChartInstance = null;

function initAllocationSliders() {
  const sliders = {
    green: document.getElementById('allocGreen'),
    office: document.getElementById('allocOffice'),
    home: document.getElementById('allocHome'),
    clean: document.getElementById('allocClean'),
    fire: document.getElementById('allocFire')
  };

  const pcts = {
    green: document.getElementById('allocGreenPct'),
    office: document.getElementById('allocOfficePct'),
    home: document.getElementById('allocHomePct'),
    clean: document.getElementById('allocCleanPct'),
    fire: document.getElementById('allocFirePct')
  };

  const totalNum = document.getElementById('allocTotal');

  function updateAlloc() {
    const vals = {
      green: parseInt(sliders.green.value, 10),
      office: parseInt(sliders.office.value, 10),
      home: parseInt(sliders.home.value, 10),
      clean: parseInt(sliders.clean.value, 10),
      fire: parseInt(sliders.fire.value, 10)
    };

    pcts.green.textContent = vals.green + '%';
    pcts.office.textContent = vals.office + '%';
    pcts.home.textContent = vals.home + '%';
    pcts.clean.textContent = vals.clean + '%';
    pcts.fire.textContent = vals.fire + '%';

    const sum = vals.green + vals.office + vals.home + vals.clean + vals.fire;
    totalNum.textContent = sum + '%';

    if (sum > 100) {
      totalNum.classList.add('over');
    } else {
      totalNum.classList.remove('over');
    }

    if (allocChartInstance) {
      allocChartInstance.data.datasets[0].data = [
        vals.green, vals.office, vals.home, vals.clean, vals.fire
      ];
      allocChartInstance.update();
    }
  }

  Object.values(sliders).forEach(s => {
    if (s) s.addEventListener('input', updateAlloc);
  });

  // Init Mini Bar Chart for Allocation
  const allocCanvas = document.getElementById('allocChart');
  if (allocCanvas && !allocChartInstance && typeof Chart !== 'undefined') {
    allocChartInstance = new Chart(allocCanvas, {
      type: 'bar',
      data: {
        labels: ['พื้นที่สีเขียว', 'อาคารสำนักงาน', 'ที่พักอาศัย', 'ทำความสะอาด', 'ระบบดับเพลิง'],
        datasets: [{
          label: 'สัดส่วนจัดสรรน้ำ (%)',
          data: [30, 25, 20, 15, 10],
          backgroundColor: ['#10b981', '#00d4ff', '#3b82f6', '#f59e0b', '#ef4444'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { max: 60, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   10. ENVIRONMENTAL IMPACT (BEFORE / AFTER COMPARISON)
   ═══════════════════════════════════════════════════════════════ */
let impactChartInstance = null;

function initImpactSection() {
  const showBeforeBtn = document.getElementById('showBefore');
  const showAfterBtn = document.getElementById('showAfter');
  const impactCards = document.querySelectorAll('.impact-card');

  const beforeData = {
    bars: ['2%', '100%', '4%', '90%', '0%', '0%'],
    texts: ['2%', '100%', '500 m²', '90%', '0 L', '0%']
  };

  const afterData = {
    bars: ['85%', '40%', '100%', '25%', '100%', '94%'],
    texts: ['85%', '40%', '12,000 m²', '25%', '12,000 L', '94%']
  };

  function setMode(mode) {
    const isAfter = mode === 'after';
    showBeforeBtn.classList.toggle('active', !isAfter);
    showAfterBtn.classList.toggle('active', isAfter);

    const sourceData = isAfter ? afterData : beforeData;

    impactCards.forEach((card, i) => {
      const barFill = card.querySelector('.impact-bar-fill');
      const pctText = card.querySelector('.impact-pct');
      if (barFill && pctText) {
        barFill.style.width = sourceData.bars[i];
        pctText.textContent = sourceData.texts[i];
      }
    });

    if (impactChartInstance) {
      impactChartInstance.data.datasets[0].data = isAfter
        ? [85, 40, 100, 25, 94]
        : [2, 100, 4, 90, 0];
      impactChartInstance.data.datasets[0].label = isAfter ? 'HYDROLOOP City (After)' : 'Traditional City (Before)';
      impactChartInstance.data.datasets[0].backgroundColor = isAfter
        ? 'rgba(0, 212, 255, 0.4)'
        : 'rgba(239, 68, 68, 0.4)';
      impactChartInstance.data.datasets[0].borderColor = isAfter ? '#00d4ff' : '#ef4444';
      impactChartInstance.update();
    }
  }

  if (showBeforeBtn) showBeforeBtn.addEventListener('click', () => setMode('before'));
  if (showAfterBtn) showAfterBtn.addEventListener('click', () => setMode('after'));

  // Impact Radar/Comparison Chart
  const chartCanvas = document.getElementById('impactChart');
  if (chartCanvas && typeof Chart !== 'undefined') {
    impactChartInstance = new Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels: [
          'น้ำนำกลับมาใช้ใหม่ (%)',
          'การใช้น้ำประปา (%)',
          'พื้นที่สีเขียว (เทียบ 100%)',
          'น้ำไหลบ่าในเมือง (%)',
          'ความแม่นยำ AI (%)'
        ],
        datasets: [{
          label: 'Traditional City (Before)',
          data: [2, 100, 4, 90, 0],
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: '#ef4444',
          borderWidth: 2,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: { max: 100, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }
}
