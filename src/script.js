import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Scene setup
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);

// Responsive resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Particle system setup
const numParticles = 100000;
const numOrbits = 60;
const maxStarsPerOrbit = Math.ceil(numParticles / numOrbits);

// Create geometry
const geometry = new THREE.BufferGeometry();

// Ellipse Code:
class Star {
    constructor(ellipseMajor, ellipseMinor, XRot, YRot, ZRot) {
        this.ellipseMajor = ellipseMajor;
        this.ellipseMinor = ellipseMinor;
        this.XRot = XRot;
        this.YRot = YRot;
        this.ZRot = ZRot;
    }

    sample(SampleDegree) {
        const rad = SampleDegree * (Math.PI / 180);
        const x = this.ellipseMajor * Math.cos(rad);
        const y = this.ellipseMinor * Math.sin(rad);
        const z = 0;

        const x1 = x * Math.cos(this.ZRot) - y * Math.sin(this.ZRot);
        const y1 = x * Math.sin(this.ZRot) + y * Math.cos(this.ZRot);

        const z1 = z * Math.cos(this.YRot) - x1 * Math.sin(this.YRot);
        const x2 = x1 * Math.cos(this.YRot) + z * Math.sin(this.YRot);

        const x3 = x2;
        const y2 = y1 * Math.cos(this.XRot) - z1 * Math.sin(this.XRot);
        const z2 = y1 * Math.sin(this.XRot) + z1 * Math.cos(this.XRot);

        return new THREE.Vector3(x3, y2, z2);
    }
}

const stars = [];
const positions = new Float32Array(numParticles * 3);
const colors = new Float32Array(numParticles * 3);
const sizes = new Float32Array(numParticles);

const startColor = new THREE.Color("#ff5cab");
const endColor = new THREE.Color("#2974ff");

let particleIndex = 0;

for (let orbit = 0; orbit < numOrbits; orbit++) {
    const distance = (orbit / numOrbits) * 50; // Max distance of 50
    const rotationFactor = Math.sin((orbit / numOrbits) * Math.PI);
    const orbitZRot = orbit * 0.1; // Smaller rotation step

    const starsPerOrbit = Math.floor(Math.sin((orbit / numOrbits) * Math.PI) * maxStarsPerOrbit * rotationFactor);
    for (let i = 0; i < starsPerOrbit && particleIndex < numParticles; i++) {
        const angleVariation = Math.sin((orbit / numOrbits) * Math.PI) * 20;
        const randomXRot = (Math.random() * angleVariation - angleVariation / 2) * (Math.PI / 180);
        const randomYRot = (Math.random() * angleVariation - angleVariation / 2) * (Math.PI / 180);

        const randomZRot = orbitZRot + (Math.random() * 0.2 - 0.1);

        const ellipseMajor = distance + Math.random() * 0.5 - 0.25;
        const ellipseMinor = distance * 0.6 + Math.random() * 0.3 - 0.15;

        let VAR_X = 3;
        stars.push(new Star(ellipseMajor/VAR_X, ellipseMinor, randomXRot, randomYRot, randomZRot));

   // Interpolate color between #ff5cab and #82abf7
   const t = distance / 50;
   const color = startColor.clone().lerp(endColor, t);

   colors[particleIndex * 3] = color.r;
   colors[particleIndex * 3 + 1] = color.g;
   colors[particleIndex * 3 + 2] = color.b;

   sizes[particleIndex] = 0.1 + (1 - distance / 50) * 0.2;

   particleIndex++;
    }
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const material = new THREE.PointsMaterial({
    vertexColors: true,
    size: 0.1,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

function Tick() {
    requestAnimationFrame(Tick);

    const positionAttribute = geometry.attributes.position;
    const array = positionAttribute.array;
    const time = Date.now() * 0.001;

    for (let i = 0; i < stars.length; i++) {
        const speed = (1 - stars[i].ellipseMajor / 50)/1.7; // Adjust speed based on distance
        const pos = stars[i].sample(time * 360 * -speed);
        array[i * 3] = pos.x;
        array[i * 3 + 1] = pos.y;
        array[i * 3 + 2] = pos.z;
    }

    positionAttribute.needsUpdate = true;
    controls.update();
    renderer.render(scene, camera);
}

Tick();
