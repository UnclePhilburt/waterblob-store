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
        this.rotationSpeed = 0.002; // Gentle rotation to avoid motion sickness
        this.mouseX = 0;
        this.mouseY = 0;

        // Interactive states
        this.isHovering = false;
        this.clickTime = 0;
        this.squishAmount = 0;
        this.hoverIntensity = 0;
        this.particles = [];
        this.waterDroplets = []; // Pouring water particles
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.baseScale = 1;
        this.lastHoverCheck = 0;
        this.hoverCheckInterval = 100; // Check hover every 100ms instead of every frame
        this.lastWaterSpawn = 0;
        this.waterSpawnInterval = 100; // Spawn water droplets every 100ms

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
        // Disable shadows for better performance
        this.renderer.shadowMap.enabled = false;
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
        this.controls.autoRotateSpeed = 0.5; // Gentle rotation
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
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        // Main directional light (key light) - no shadows for performance
        const keyLight = new THREE.DirectionalLight(0x0066FF, 1.2);
        keyLight.position.set(5, 10, 5);
        this.scene.add(keyLight);

        // Fill light (cyan/blue)
        const fillLight = new THREE.DirectionalLight(0x00E5FF, 0.7);
        fillLight.position.set(-5, 3, -5);
        this.scene.add(fillLight);

        // Point lights for extra sparkle (reduced count)
        const pointLight1 = new THREE.PointLight(0x00E5FF, 0.8, 20);
        pointLight1.position.set(-3, 2, 3);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xEC4899, 0.6, 20);
        pointLight2.position.set(3, 2, -3);
        this.scene.add(pointLight2);

        // Animated lights
        this.animatedLights = [pointLight1, pointLight2];
    }

    setupPostProcessing() {
        // Render pass
        const renderPass = new RenderPass(this.scene, this.camera);

        // Bloom pass for glow effect - reduced for performance
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.4,  // strength - reduced from 0.7
            0.3,  // radius - reduced from 0.4
            0.9   // threshold - increased from 0.85
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
                this.baseScale = scale;
                this.model.scale.setScalar(scale);

                this.model.position.sub(center.multiplyScalar(scale));
                this.model.position.y = 0; // Center vertically

                // Enhanced materials (optimized)
                this.model.traverse((child) => {
                    if (child.isMesh && child.material) {
                        // Make material more reflective and glossy
                        child.material.metalness = 0.3;
                        child.material.roughness = 0.2;
                        child.material.envMapIntensity = 1.5;

                        // Add emissive glow
                        if (child.material.color) {
                            child.material.emissive = child.material.color.clone();
                            child.material.emissiveIntensity = 0.25;
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
        // Track mouse position for parallax
        document.addEventListener('mousemove', (event) => {
            this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

            // Update mouse position for raycasting (throttled in animate loop)
            this.mouse.x = this.mouseX;
            this.mouse.y = this.mouseY;
        });

        // Click to make blob squish and splash
        this.renderer.domElement.addEventListener('click', (event) => {
            this.onClick(event);
        });

        // Change cursor on hover
        this.renderer.domElement.style.cursor = 'pointer';
    }

    checkHover() {
        if (!this.model) return;

        // Throttled hover check for performance
        const now = Date.now();
        if (now - this.lastHoverCheck < this.hoverCheckInterval) {
            return;
        }
        this.lastHoverCheck = now;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.model, true);

        this.isHovering = intersects.length > 0;
    }

    onClick(event) {
        if (!this.model || !this.isHovering) return;

        // Trigger squish animation
        this.clickTime = Date.now();
        this.squishAmount = 1;

        // Create particle splash
        this.createSplash(event);

        // Make blob glow briefly (optimized - less intense)
        this.model.traverse((child) => {
            if (child.isMesh && child.material && child.material.emissive) {
                const originalIntensity = child.material.emissiveIntensity || 0.25;
                child.material.emissiveIntensity = 0.6;

                setTimeout(() => {
                    child.material.emissiveIntensity = originalIntensity;
                }, 250);
            }
        });
    }

    createSplash(event) {
        // Limit particles to reduce lag
        const particleCount = 15; // Reduced from 30

        // Simpler geometry for better performance
        const geometry = new THREE.SphereGeometry(0.06, 4, 4); // Reduced segments
        const material = new THREE.MeshBasicMaterial({
            color: 0x00E5FF,
            transparent: true,
            opacity: 0.8
        });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material.clone());

            // Position near the model
            const angle = (Math.PI * 2 * i) / particleCount;
            const radius = 2 + Math.random() * 1.5;
            particle.position.set(
                Math.cos(angle) * radius,
                Math.random() * 1.5 - 0.5,
                Math.sin(angle) * radius
            );

            // Random velocity
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.25,
                Math.random() * 0.25 + 0.15,
                (Math.random() - 0.5) * 0.25
            );

            particle.life = 1.0;
            particle.decay = 0.03 + Math.random() * 0.02; // Faster decay

            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            // Update position
            particle.position.add(particle.velocity);

            // Apply gravity
            particle.velocity.y -= 0.01;

            // Fade out
            particle.life -= particle.decay;
            particle.material.opacity = particle.life;

            // Remove dead particles
            if (particle.life <= 0) {
                this.scene.remove(particle);
                particle.geometry.dispose();
                particle.material.dispose();
                this.particles.splice(i, 1);
            }
        }
    }

    spawnWaterDroplets() {
        const now = Date.now();
        if (now - this.lastWaterSpawn < this.waterSpawnInterval) {
            return;
        }
        this.lastWaterSpawn = now;

        // Spawn 3-5 droplets per interval
        const count = 3 + Math.floor(Math.random() * 3);

        for (let i = 0; i < count; i++) {
            const geometry = new THREE.SphereGeometry(0.08, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00E5FF,
                transparent: true,
                opacity: 0.7
            });

            const droplet = new THREE.Mesh(geometry, material);

            // Start from above, scattered around
            const spread = 3;
            droplet.position.set(
                (Math.random() - 0.5) * spread,
                8 + Math.random() * 2,
                (Math.random() - 0.5) * spread
            );

            // Downward velocity with slight variation
            droplet.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                -0.15 - Math.random() * 0.1,
                (Math.random() - 0.5) * 0.05
            );

            droplet.life = 1.0;

            this.scene.add(droplet);
            this.waterDroplets.push(droplet);
        }
    }

    updateWaterDroplets() {
        for (let i = this.waterDroplets.length - 1; i >= 0; i--) {
            const droplet = this.waterDroplets[i];

            // Update position
            droplet.position.add(droplet.velocity);

            // Gravity
            droplet.velocity.y -= 0.015;

            // Stretch droplets as they fall (tear drop shape)
            const speed = Math.abs(droplet.velocity.y);
            droplet.scale.y = 1 + speed * 0.5;
            droplet.scale.x = 1 - speed * 0.1;
            droplet.scale.z = 1 - speed * 0.1;

            // Check if droplet hit the blob or fell too far
            const distanceFromCenter = Math.sqrt(
                droplet.position.x * droplet.position.x +
                droplet.position.z * droplet.position.z
            );

            // Simple collision detection
            if (droplet.position.y < 0 && distanceFromCenter < 3) {
                // Hit the blob - create small splash
                this.createMiniSplash(droplet.position);

                // Remove droplet
                this.scene.remove(droplet);
                droplet.geometry.dispose();
                droplet.material.dispose();
                this.waterDroplets.splice(i, 1);
            } else if (droplet.position.y < -5) {
                // Fell off screen
                this.scene.remove(droplet);
                droplet.geometry.dispose();
                droplet.material.dispose();
                this.waterDroplets.splice(i, 1);
            }
        }
    }

    createMiniSplash(position) {
        // Create small splash particles when water hits
        const splashCount = 4;
        const geometry = new THREE.SphereGeometry(0.04, 3, 3);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00E5FF,
            transparent: true,
            opacity: 0.6
        });

        for (let i = 0; i < splashCount; i++) {
            const particle = new THREE.Mesh(geometry, material.clone());

            particle.position.copy(position);

            // Splash outward
            const angle = (Math.PI * 2 * i) / splashCount;
            particle.velocity = new THREE.Vector3(
                Math.cos(angle) * 0.15,
                Math.random() * 0.1 + 0.05,
                Math.sin(angle) * 0.15
            );

            particle.life = 1.0;
            particle.decay = 0.04;

            this.scene.add(particle);
            this.particles.push(particle);
        }
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

        const time = Date.now() * 0.001;

        // Check hover (throttled)
        this.checkHover();

        // Spawn and update water pouring effect
        this.spawnWaterDroplets();
        this.updateWaterDroplets();

        // Update particles
        this.updateParticles();

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
            const baseY = Math.sin(time) * 0.5;
            this.model.position.y = baseY;

            // Squish animation on click
            if (this.squishAmount > 0) {
                const timeSinceClick = (Date.now() - this.clickTime) / 1000;
                const squishDuration = 0.4; // Slightly faster

                if (timeSinceClick < squishDuration) {
                    // Squish and bounce back
                    const progress = timeSinceClick / squishDuration;
                    const easeOut = 1 - Math.pow(1 - progress, 3);
                    const squish = Math.sin(progress * Math.PI * 2) * (1 - easeOut);

                    this.model.scale.y = this.baseScale * (1 - squish * 0.25);
                    this.model.scale.x = this.baseScale * (1 + squish * 0.125);
                    this.model.scale.z = this.baseScale * (1 + squish * 0.125);
                } else {
                    // Reset scale
                    this.model.scale.setScalar(this.baseScale);
                    this.squishAmount = 0;
                }
            }

            // Hover glow effect
            const targetHoverIntensity = this.isHovering ? 1 : 0;
            this.hoverIntensity = THREE.MathUtils.lerp(
                this.hoverIntensity,
                targetHoverIntensity,
                0.1
            );

            // Wobble on hover (simplified - no material updates every frame)
            if (this.isHovering) {
                const wobble = Math.sin(time * 3) * 0.015; // Reduced wobble
                this.model.rotation.z = wobble;
            } else {
                this.model.rotation.z = THREE.MathUtils.lerp(this.model.rotation.z, 0, 0.1);
            }
        }

        // Animate point lights (simplified)
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
