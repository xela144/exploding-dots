import * as THREE from "three";

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  window.innerHeight / -2,
  0.1,
  10,
);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const numCircles = 100;
const radius = 3;

for (let i = 0; i < numCircles; i++) {
  const geometry = new THREE.CircleGeometry(radius, 32);
  const baseColors = {
    red: new THREE.Color(1.0, 0, 0),
    blue: new THREE.Color(0, 0, 1.0),
    yellow: new THREE.Color(1.0, 1.0, 0),
  };
  const keys = Object.keys(baseColors);
  const choice = keys[Math.floor(Math.random() * keys.length)];
  const color = baseColors[choice];

  // Convert to HSL
  const hsl = {};
  color.getHSL(hsl);

  // Slightly tweak hue and/or saturation
  hsl.h = (hsl.h + (Math.random() * 0.05 - 0.05) + 1) % 1; // ±0.1 hue shift
  hsl.s = THREE.MathUtils.clamp(hsl.s + (Math.random() * 0.2 - 0.1), 0, 1);

  // Convert back to color
  color.setHSL(hsl.h, hsl.s, hsl.l);

  // Then apply brightness shading like you had
  const shade = THREE.MathUtils.lerp(0.4, 1.0, Math.random());
  color.multiplyScalar(shade);

  const material = new THREE.MeshBasicMaterial({ color });
  material.transparent = true;
  material.opacity = 0;

  const circle = new THREE.Mesh(geometry, material);

  circle.userData = {
    startPos: circle.position.clone(),
    velocity: getRandomVelocity(),
    elapsed: 0,
    maxLifetime: 3.0,
  };

  scene.add(circle);
}

// Helper
function getRandomVelocity() {
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * 3.5 + 0.5;
  return new THREE.Vector2(Math.cos(angle), Math.sin(angle)).multiplyScalar(
    speed * 220,
  );
}

window.addEventListener("resize", () => {
  camera.left = window.innerWidth / -2;
  camera.right = window.innerWidth / 2;
  camera.top = window.innerHeight / 2;
  camera.bottom = window.innerHeight / -2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation logic
let clock = new THREE.Clock();
let elapsed = 0;
let currentOrigin = new THREE.Vector2(0, 0); // start in center

let state = "animating";
let delayTimer = 0;
const delayTime = 1.5; // seconds between explosions

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  elapsed += delta;

  if (state === "waiting") {
    delayTimer += delta;
    if (delayTimer >= delayTime) {
      state = "animating";
      delayTimer = 0;
    }
  }

  if (state === "animating") {
    let needsNewOrigin = false;

    let allExpired = true;

    scene.traverse((obj) => {
      if (obj.isMesh && obj.geometry.type === "CircleGeometry") {
        const mat = obj.material;
        const data = obj.userData;

        data.elapsed += delta;
        const t = data.elapsed / data.maxLifetime;

        if (t < 1.0) {
          allExpired = false;
          obj.position.x = data.startPos.x + data.velocity.x * t;
          obj.position.y = data.startPos.y + data.velocity.y * t;
          mat.opacity = 1.0 - Math.abs(2 * t - 1); // Triangle wave fade
        } else {
          mat.opacity = 0;
        }
      }
    });

    if (allExpired) {
      state = "waiting";
      currentOrigin = new THREE.Vector2(
        (Math.random() - 0.5) * window.innerWidth,
        (Math.random() - 0.5) * window.innerHeight,
      );

      scene.traverse((obj) => {
        if (obj.isMesh && obj.geometry.type === "CircleGeometry") {
          const data = obj.userData;
          obj.position.set(currentOrigin.x, currentOrigin.y, 0);
          data.startPos.set(currentOrigin.x, currentOrigin.y);
          data.velocity = getRandomVelocity();
          data.elapsed = 0;
        }
      });
    }

    // After the traversal loop:
    if (needsNewOrigin) {
      currentOrigin = new THREE.Vector2(
        (Math.random() - 0.5) * window.innerWidth,
        (Math.random() - 0.5) * window.innerHeight,
      );

      scene.traverse((obj) => {
        if (obj.isMesh && obj.geometry.type === "CircleGeometry") {
          const data = obj.userData;
          obj.position.set(currentOrigin.x, currentOrigin.y, 0);
          data.startPos.set(currentOrigin.x, currentOrigin.y);
          data.velocity = getRandomVelocity();
          data.elapsed = 0;
        }
      });
    }
  }

  renderer.render(scene, camera);
}

animate();
