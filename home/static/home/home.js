const form = document.getElementById("contactForm");
const status = document.getElementById("formStatus");

const FIELDS = ["name", "email", "subject", "message"];

function getFieldValues() {
  return Object.fromEntries(
    FIELDS.map(id => [id, document.getElementById(id).value.trim()])
  );
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.style.color = isError ? "#ef4444" : "#10b981";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const values = getFieldValues();
  const missing = FIELDS.filter(key => !values[key]);

  if (missing.length) {
    setStatus("Please complete all fields.", true);
    return;
  }

  if (!isValidEmail(values.email)) {
    setStatus("Please enter a valid email address.", true);
    return;
  }

  setStatus("Message ready to send.");
  console.log(values);
  form.addEventListener("submit", function (e) {
  e.preventDefault();

  const values = getFieldValues();
  const missing = FIELDS.filter(key => !values[key]);

  if (missing.length) {
    setStatus("Please complete all fields.", true);
    return;
  }

  if (!isValidEmail(values.email)) {
    setStatus("Please enter a valid email address.", true);
    return;
  }

  setStatus("Sending message...");

  // --- CONNECTING TO DJANGO backend ---
  // We extract the Django CSRF token cookie dynamically
  const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

  fetch("/contact/submit/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken // Required by Django for security
    },
    body: JSON.stringify(values)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      setStatus("Message sent successfully!");
      form.reset();
    } else {
      setStatus("Error sending message: " + data.error, true);
    }
  })
  .catch(error => {
    console.error("Error:", error);
    setStatus("Server error. Please try again later.", true);
  });
});
  form.reset();
});


const PALETTES = [
  ["#1a1a2e", "#e94560"],
  ["#2d1b69", "#e8c547"],
  ["#0d3b2e", "#f5a623"],
  ["#1c0a00", "#c0392b"],
  ["#0a1628", "#00b4d8"],
];

const MAX_PROJECTS = 5;
const GITHUB_USER = "POLDanf";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function lighten(hex, amt) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = clamp((n >> 16) + amt, 0, 255);
  const g = clamp(((n >> 8) & 0xff) + amt, 0, 255);
  const b = clamp((n & 0xff) + amt, 0, 255);
  return `rgb(${r},${g},${b})`;
}

/**
 * Build display data for a single project card.
 * @param {number} index  
 * @param {object|null} repo 
 */
function makeProjectData(index, repo = null) {
  const [bg, accent] = PALETTES[index % PALETTES.length];
  return {
    bgStart: bg,
    bgEnd: lighten(bg, 25),
    accent,
    title: repo?.name ?? `PROJECT ${String(index + 1).padStart(2, "0")}`,
    description: repo?.description ?? "No description available.",
    isPublic: repo ? !repo.private : false,
    url: repo?.html_url ?? null,
  };
}


function createProjectCard(data) {
  const card = document.createElement("div");
  card.className = "project";
  card.style.cssText = `
background-image: linear-gradient(135deg, ${data.bgStart}, ${data.bgEnd});
cursor: ${data.url ? "pointer" : "default"};
position: relative;
display: flex;
align-items: stretch;
overflow: hidden;
`;

  const titleStrip = document.createElement("div");
  titleStrip.className = "project-title-strip";
  titleStrip.style.cssText = `
display: flex;
align-items: center;
justify-content: center;
min-width: 2.5rem;
padding: 1rem 0;
border-right: 2px solid ${data.accent}44;
flex-shrink: 0;
`;

  const titleEl = document.createElement("span");
  titleEl.className = "project-title";
  titleEl.textContent = data.title.toUpperCase();
  titleEl.style.cssText = `
writing-mode: vertical-rl;
text-orientation: mixed;
transform: rotate(180deg);
white-space: nowrap;
color: ${data.accent};
font-weight: 700;
font-size: 0.75rem;
letter-spacing: 0.12em;
`;

  titleStrip.appendChild(titleEl);

  const content = document.createElement("div");
  content.className = "project-content";
  content.style.cssText = `
flex: 1;
display: flex;
flex-direction: column;
justify-content: space-between;
padding: 1rem;
`;

  const desc = document.createElement("p");
  desc.className = "project-description";
  desc.textContent = data.description;

  const badge = document.createElement("span");
  badge.className = "project-status";
  badge.textContent = data.isPublic ? "Public" : "Private";
  badge.style.cssText = `
align-self: flex-start;
font-size: 0.7rem;
padding: 0.2em 0.6em;
border-radius: 999px;
background: ${data.accent}33;
color: ${data.accent};
font-weight: 600;
letter-spacing: 0.05em;
margin-top: 0.5rem;
`;

  content.append(desc, badge);
  card.append(titleStrip, content);

  if (data.url) {
    card.addEventListener("click", () => window.open(data.url, "_blank"));
  }

  return card;
}

async function populateProjects() {
  const projectList = document.querySelector(".project_list");
  if (!projectList) return;

  projectList.innerHTML = '<p style="opacity:.5">Loading projects…</p>';

  let publicRepos = [];

  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`);
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const data = await res.json();
    publicRepos = Array.isArray(data)
      ? data.filter(r => !r.private).slice(0, MAX_PROJECTS)
      : [];
  } catch (err) {
    console.warn("Could not fetch repos:", err);
  }

  projectList.innerHTML = "";

  for (let i = 0; i < MAX_PROJECTS; i++) {
    const data = makeProjectData(i, publicRepos[i] ?? null);
    projectList.appendChild(createProjectCard(data));
  }
}

populateProjects();

function scrollToId(id, offset = 80) {
  const element = document.getElementById(id);
  if (element) {
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const canvas = document.getElementById('intro_canvas');
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true
});
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputEncoding = THREE.sRGBEncoding;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);

camera.position.set(3, 3, 3);
camera.lookAt(0, 1, 0);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new THREE.RGBELoader()
  .setDataType(THREE.UnsignedByteType)
  .load(
    '/static/home/models/light.hdr',
    (texture) => {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;

      texture.dispose();
      pmremGenerator.dispose();
    },
    undefined,
    (error) => {
      console.error('Error loading HDR environment:', error);
    }
  );


let model;
const loader = new THREE.GLTFLoader();

loader.load(
  '/static/home/models/room.glb',
  (gltf) => {
    model = gltf.scene;
    scene.add(model);
  },
  undefined,
  (error) => {
    console.error('Error loading GLTF model:', error);
  }
);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

scene.background = new THREE.Color(0xFFFFFF);
const maxRotation = THREE.MathUtils.degToRad(10); 

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  const elapsedTime = clock.getElapsedTime();
  const speed = 2; 
  if (model) {
    model.rotation.y = Math.sin(elapsedTime * speed) * maxRotation;
  }
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

