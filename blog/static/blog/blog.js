const COUNT = 10;
const RADIUS = 8;

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

function makeTexture(index, blog) {
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

  const title = blog?.name ? blog.name.toUpperCase() : `BLOG ${String(index + 1).padStart(2, '0')}`;
  const description = blog?.description || 'No description available for this blog.';
  const isPublic = blog && blog.private === false;

  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = "bold 26px 'Courier New'";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, 30, 30);

  ctx.font = "16px 'Courier New'";
  wrapText(ctx, description, 30, 80, W - 60, 24);

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = "bold 14px 'Courier New'";
  ctx.fillText(isPublic ? 'Blog post' : 'Private blog', 30, H - 90);
  ctx.fillText('Click to open blog', 30, H - 60);

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
camera.position.set(0, 0, 0);
camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const pointLight = new THREE.PointLight(0xffffff, 1.2, 20);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);
const topLight = new THREE.DirectionalLight(0xfff0dd, 1.0);
topLight.position.set(0, 10, 0);
scene.add(topLight);

const PANEL_W = 2.4;
const PANEL_H = 3.8;
const GAP_W   = 0.18;
const SEG_W   = 28;
const SEG_H   = 1;

const arcPanel = PANEL_W / RADIUS;
const arcGap   = GAP_W   / RADIUS;
const arcStep  = arcPanel + arcGap;
const totalArc = arcStep * COUNT;

const cylinderGroup = new THREE.Group();
scene.add(cylinderGroup);

const BLOGS = [
  { name: 'Blog 01', description: 'Description for blog one.', private: false, html_url: null },
  { name: 'Blog 02', description: 'Description for blog two.', private: false, html_url: null },
  { name: 'Blog 03', description: 'Description for blog three.', private: false, html_url: null },
  { name: 'Blog 04', description: 'Description for blog four.', private: false, html_url: null },
  { name: 'Blog 05', description: 'Description for blog five.', private: false, html_url: null },
  { name: 'Blog 06', description: 'Description for blog six.', private: false, html_url: null },
  { name: 'Blog 07', description: 'Description for blog seven.', private: false, html_url: null },
  { name: 'Blog 08', description: 'Description for blog eight.', private: false, html_url: null },
  { name: 'Blog 09', description: 'Description for blog nine.', private: false, html_url: null },
  { name: 'Blog 10', description: 'Description for blog ten.', private: false, html_url: null },
];

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

for (let i = 0; i < COUNT; i++) {
  const blog = BLOGS[i] ?? {
    name: `Blog ${String(i + 1).padStart(2, '0')}`,
    description: 'No description available.',
    private: true,
    html_url: null,
  };

  const texture = makeTexture(i, blog);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const centerAngle = (COUNT - 1 - i) * arcStep;
  const geometry = new THREE.BufferGeometry();
  const positions = [], uvs = [], indices = [];

  for (let row = 0; row <= SEG_H; row++) {
    const v = row / SEG_H;
    const y = (0.5 - v) * PANEL_H;
    for (let col = 0; col <= SEG_W; col++) {
      const u     = col / SEG_W;
      const angle = centerAngle - arcPanel / 2 + u * arcPanel;
      positions.push(RADIUS * Math.sin(angle), y, RADIUS * Math.cos(angle));
      uvs.push(1 - u, 1 - v);
    }
  }

  for (let row = 0; row < SEG_H; row++) {
    for (let col = 0; col < SEG_W; col++) {
      const a = row * (SEG_W + 1) + col;
      const b = a + SEG_W + 1;
      indices.push(a, a + 1, b);
      indices.push(b, a + 1, b + 1);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.FrontSide,
    roughness: 0.85,
    metalness: 0.0,
  }));
  mesh.userData.blog = blog;
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

  const blog = intersects[0].object.userData.blog;
  if (blog?.html_url) {
    window.open(blog.html_url, '_blank');
  }
});

let targetRot  = 0;
let currentRot = 0;

window.addEventListener('wheel', e => {
  e.preventDefault();
  targetRot += (e.deltaY + e.deltaX) * 0.003;
}, { passive: false });

let isDragging = false, dragStartX = 0, dragStartRot = 0;
window.addEventListener('mousedown', e => {
  isDragging   = true;
  dragStartX   = e.clientX;
  dragStartRot = targetRot;
  document.body.style.cursor = 'grabbing';
});
window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const delta = (e.clientX - dragStartX) / innerWidth;
  targetRot = dragStartRot - delta * totalArc;
});
window.addEventListener('mouseup', () => {
  isDragging = false;
  document.body.style.cursor = 'grab';
});
document.body.style.cursor = 'grab';

let tStartX = 0, tStartRot = 0;
window.addEventListener('touchstart', e => {
  tStartX   = e.touches[0].clientX;
  tStartRot = targetRot;
}, { passive: true });
window.addEventListener('touchmove', e => {
  targetRot = tStartRot - (e.touches[0].clientX - tStartX) / innerWidth * totalArc;
}, { passive: true });

let last = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;

  currentRot += (targetRot - currentRot) * Math.min(1, dt * 8);
  cylinderGroup.rotation.y = currentRot;
  cylinderGroup.position.y = Math.sin(now * 0.0004) * 0.06;

  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});