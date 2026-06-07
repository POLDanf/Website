const COUNT = 10;

const PALETTES = [
  ['#1a1a2e', '#e94560'],
  ['#2d1b69', '#e8c547'],
  ['#0d3b2e', '#f5a623'],
  ['#1c0a00', '#c0392b'],
  ['#0a1628', '#00b4d8'],
  ['#2c1a4a', '#f72585'],
  ['#0f2027', '#43e97b'],
  ['#1a0533', '#fd7e14'],
  ['#021014', '#48cae4'],
  ['#1b2838', '#ff6b6b'],
];

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function lighten(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgb(
    ${clamp((n >> 16) + amt, 0, 255)},
    ${clamp(((n >> 8) & 0xff) + amt, 0, 255)},
    ${clamp((n & 0xff) + amt, 0, 255)}
  )`;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(' ');
  let line = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line.trim(), x, y);
}

function makeTexture(index, repo) {
  const W = 512, H = 900;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const [bg, accent] = PALETTES[index];

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, bg);
  grad.addColorStop(1, lighten(bg, 25));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const id = ctx.getImageData(0, 0, W, H);
  for (let p = 0; p < id.data.length; p += 4) {
    const n = (Math.random() - 0.5) * 22;
    id.data[p]     = clamp(id.data[p]     + n, 0, 255);
    id.data[p + 1] = clamp(id.data[p + 1] + n, 0, 255);
    id.data[p + 2] = clamp(id.data[p + 2] + n, 0, 255);
  }
  ctx.putImageData(id, 0, 0);

  ctx.globalAlpha = 0.5;
  const rad = ctx.createRadialGradient(W * 0.5, H * 0.38, 0, W * 0.5, H * 0.38, W * 0.7);
  rad.addColorStop(0, accent);
  rad.addColorStop(1, 'transparent');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 4, H);

  const title = repo?.name ? repo.name.toUpperCase() : `PROJECT ${String(index + 1).padStart(2, '0')}`;
  const description = repo?.description || 'No description available for this public repo.';
  const isPublic = repo && repo.private === false;

  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = "bold 26px 'Courier New'";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, 30, 30);

  ctx.font = "16px 'Courier New'";
  wrapText(ctx, description, 30, 80, W - 60, 24);

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = "bold 14px 'Courier New'";
  ctx.fillText(isPublic ? 'Public repository' : 'Private / hidden', 30, H - 90);
  ctx.fillText('Click to open repo', 30, H - 60);

  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${H * 0.52}px 'Courier New'`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(index + 1).padStart(2, '0'), W / 2, H * 0.45);
  ctx.globalAlpha = 1;

  return new THREE.CanvasTexture(c);
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF);
scene.fog = new THREE.FogExp2(0x080808, 0.05);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 11);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));

const pointLight = new THREE.PointLight(0xffffff, 1.2, 100);
pointLight.position.set(0, 10, 0);
scene.add(pointLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(0,10,0);
scene.add(dirLight);

const topLight = new THREE.DirectionalLight(0xfff0dd, 1.5);
topLight.position.set(0, 14, 2);
scene.add(topLight);

const R       = 5.0;
const PANEL_W = 2.4;
const PANEL_H = 3.8;
const GAP_W   = 0.18;
const SEG_W   = 28;
const SEG_H   = 1;

const arcPanel = PANEL_W / R;
const arcGap   = GAP_W   / R;
const arcStep  = arcPanel + arcGap;
const totalArc = arcStep * COUNT;

const cylinderGroup = new THREE.Group();
scene.add(cylinderGroup);

const res = await fetch("https://api.github.com/users/POLDanf/repos");
const data = await res.json();
const publicRepos = Array.isArray(data) ? data.filter(repo => repo.private === false) : [];
const repoCount = publicRepos.length;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

for (let i = 0; i < COUNT; i++) {
  const repo = repoCount > 0
    ? publicRepos[i % repoCount]
    : {
        name: `PROJECT ${String(i + 1).padStart(2, '0')}`,
        description: 'No public repository available.',
        private: true,
        html_url: null,
      };
  const texture = makeTexture(i, repo);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const centerAngle = i * arcStep;
  const geometry = new THREE.BufferGeometry();
  const positions = [], uvs = [], indices = [];

  for (let row = 0; row <= SEG_H; row++) {
    const v = row / SEG_H;
    const y = (0.5 - v) * PANEL_H;
    for (let col = 0; col <= SEG_W; col++) {
      const u     = col / SEG_W;
      const angle = centerAngle - arcPanel / 2 + u * arcPanel;
      positions.push(R * Math.sin(angle), y, R * Math.cos(angle));
      uvs.push(u, 1 - v);
    }
  }

  for (let row = 0; row < SEG_H; row++) {
    for (let col = 0; col < SEG_W; col++) {
      const a = row * (SEG_W + 1) + col;
      const b = a + SEG_W + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.FrontSide,
    roughness: 0.9,
    metalness: 0.0,
  }));
  mesh.userData.repo = repo;
  cylinderGroup.add(mesh);
}

renderer.domElement.addEventListener('click', e => {
  if (isDragging) return;
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(cylinderGroup.children, true);
  if (!intersects.length) return;

  const repo = intersects[0].object.userData.repo;
  if (repo?.html_url) {
    window.open(repo.html_url, '_blank');
  }
});

let targetRot  = 0;
let currentRot = 0;

function setTarget(r) {
  targetRot = r;
}

window.addEventListener('wheel', e => {
  e.preventDefault();
  setTarget(targetRot + (e.deltaY + e.deltaX) * 0.0015);
}, { passive: false });

let isDragging = false, dragStartX = 0, dragStartRot = 0;
renderer.domElement.addEventListener('mousedown', e => {
  isDragging    = true;
  dragStartX    = e.clientX;
  dragStartRot  = targetRot;
  renderer.domElement.style.cursor = 'grabbing';
});
window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const delta = (dragStartX - e.clientX) / innerWidth;
  setTarget(dragStartRot + delta * totalArc * 0.8);
});
window.addEventListener('mouseup', () => {
  isDragging = false;
  renderer.domElement.style.cursor = 'grab';
});
renderer.domElement.style.cursor = 'grab';

let tStartX = 0, tStartRot = 0;
renderer.domElement.addEventListener('touchstart', e => {
  tStartX   = e.touches[0].clientX;
  tStartRot = targetRot;
}, { passive: true });
renderer.domElement.addEventListener('touchmove', e => {
  setTarget(tStartRot + (tStartX - e.touches[0].clientX) / innerWidth * totalArc * 0.8);
}, { passive: true });

let last = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;

  currentRot += (targetRot - currentRot) * Math.min(1, dt * 9);
  cylinderGroup.rotation.y = -currentRot;
  cylinderGroup.position.y = Math.sin(now * 0.0005) * 0.04;

  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});