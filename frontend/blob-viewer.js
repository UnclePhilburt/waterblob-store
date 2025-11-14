import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

class BlobViewer {
    constructor() {
        this.container = document.getElementById('canvas-container');

        if (!this.container) {
            console.error('Canvas container not found!');
            return;
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.model = null;
        this.controls = null;
        this.composer = null;
        this.rotationSpeed = 0.006; // Faster for more dramatic showcase
        this.mouseX = 0;
        this.mouseY = 0;

        // Check if running from file:// protocol
        if (window.location.protocol === 'file:') {
            console.warn('Running from file:// protocol. You may need to run a local server for 3D models to load.');
            this.showProtocolWarning();
        }

        this.init();
    }

    showProtocolWarning() {
        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 165, 0, 0.1);
            border: 2px solid orange;
            padding: 20px;
            border-radius: 10px;
            color: orange;
            font-family: system-ui;
            z-index: 100;
            max-width: 500px;
            text-align: center;
        `;
        warningDiv.innerHTML = `
            <strong>⚠️ File Protocol Detected</strong><br>
            <small>Run a local server to view 3D model. Try: <code>python -m http.server 8000</code></small>
        `;
        this.container.appendChild(warningDiv);
    }

    init() {
        console.log('Initializing 3D viewer...');

        // Scene
        this.scene = new THREE.Scene();

        // Camera - closer and more centered
        this.camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1, 6);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Lights
        this.setupLights();

        // Controls (subtle, for mouse interaction)
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = false;
        this.controls.enablePan = false;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 1.5; // Faster rotation for showcase
        this.controls.minPolarAngle = Math.PI / 3;
        this.controls.maxPolarAngle = Math.PI / 1.5;

        // Post-processing
        this.setupPostProcessing();

        // Load model
        this.loadModel();

        // Mouse interaction
        this.setupMouseInteraction();

        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Handle theme changes
        this.updateTheme();
        const observer = new MutationObserver(() => this.updateTheme());
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        // Start animation
        this.animate();
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Main directional light (key light)
        const keyLight = new THREE.DirectionalLight(0x0066FF, 1.5);
        keyLight.position.set(5, 10, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 50;
        this.scene.add(keyLight);

        // Fill light (cyan/blue)
        const fillLight = new THREE.DirectionalLight(0x00E5FF, 0.8);
        fillLight.position.set(-5, 3, -5);
        this.scene.add(fillLight);

        // Rim light (purple)
        const rimLight = new THREE.DirectionalLight(0x7C3AED, 0.6);
        rimLight.position.set(0, -5, -8);
        this.scene.add(rimLight);

        // Point lights for extra sparkle
        const pointLight1 = new THREE.PointLight(0x00E5FF, 1, 20);
        pointLight1.position.set(-3, 2, 3);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xEC4899, 0.8, 20);
        pointLight2.position.set(3, 2, -3);
        this.scene.add(pointLight2);

        // Animated lights
        this.animatedLights = [pointLight1, pointLight2];
    }

    setupPostProcessing() {
        // Render pass
        const renderPass = new RenderPass(this.scene, this.camera);

        // Bloom pass for glow effect
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.7,  // strength
            0.4,  // radius
            0.85  // threshold
        );

        // Composer
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderPass);
        this.composer.addPass(bloomPass);
    }

    loadModel() {
        const loader = new GLTFLoader();

        // Show loading state
        this.container.classList.add('loading');

        console.log('Attempting to load model from: assets/blob.glb');

        loader.load(
            'assets/blob.glb',
            (gltf) => {
                console.log('Model loaded successfully!', gltf);
                // Hide loading state
                this.container.classList.remove('loading');
                this.model = gltf.scene;

                // Center and scale the model
                const box = new THREE.Box3().setFromObject(this.model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());

                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 6.5 / maxDim; // Bigger model
                this.model.scale.setScalar(scale);

                this.model.position.sub(center.multiplyScalar(scale));
                this.model.position.y = 0; // Center vertically

                // Enhanced materials
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;

                        // Make material more reflective and glossy
                        if (child.material) {
                            child.material.metalness = 0.4;
                            child.material.roughness = 0.15;
                            child.material.envMapIntensity = 2.0;

                            // Add emissive glow - enhanced for showcase
                            if (child.material.color) {
                                child.material.emissive = child.material.color.clone();
                                child.material.emissiveIntensity = 0.3;
                            }
                        }
                    }
                });

                this.scene.add(this.model);

                // Initial rotation for best angle
                this.model.rotation.y = Math.PI / 4;
            },
            (progress) => {
                const percent = (progress.loaded / progress.total * 100).toFixed(2);
                console.log('Loading model:', percent + '%');
            },
            (error) => {
                console.error('!!! Error loading model !!!', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack
                });
                this.container.classList.remove('loading');

                // Show error message on screen
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(255, 0, 0, 0.1);
                    border: 2px solid red;
                    padding: 20px;
                    border-radius: 10px;
                    color: red;
                    font-family: monospace;
                    z-index: 100;
                `;
                errorDiv.textContent = 'Error loading 3D model: ' + error.message;
                this.container.appendChild(errorDiv);
            }
        );
    }

    setupMouseInteraction() {
        document.addEventListener('mousemove', (event) => {
            this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });
    }

    updateTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        if (isDark) {
            this.scene.fog = new THREE.Fog(0x000000, 10, 50);
        } else {
            this.scene.fog = new THREE.Fog(0xFAFAFA, 10, 50);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Smooth mouse parallax
        if (this.model) {
            const targetRotationY = this.model.rotation.y + this.rotationSpeed;
            this.model.rotation.y = targetRotationY;

            // Subtle tilt based on mouse position
            this.model.rotation.x = THREE.MathUtils.lerp(
                this.model.rotation.x,
                this.mouseY * 0.1,
                0.05
            );

            // Floating animation - more dramatic for showcase
            this.model.position.y = Math.sin(Date.now() * 0.001) * 0.5;
        }

        // Animate point lights
        const time = Date.now() * 0.001;
        if (this.animatedLights) {
            this.animatedLights[0].position.x = Math.sin(time * 0.7) * 4;
            this.animatedLights[0].position.z = Math.cos(time * 0.7) * 4;

            this.animatedLights[1].position.x = Math.sin(time * 0.5 + Math.PI) * 4;
            this.animatedLights[1].position.z = Math.cos(time * 0.5 + Math.PI) * 4;
        }

        // Update controls
        this.controls.update();

        // Render with post-processing
        this.composer.render();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new BlobViewer());
} else {
    new BlobViewer();
}
