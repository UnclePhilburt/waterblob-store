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
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.baseScale = 1;
        this.lastHoverCheck = 0;
        this.hoverCheckInterval = 100; // Check hover every 100ms instead of every frame
        this.waterPool = null;
        this.isMobile = window.innerWidth <= 768;
        this.isLowEnd = window.innerWidth <= 480;
        this.lightRays = null;
        this.atmosphericParticles = [];
        this.waterShadow = null;
        this.frameCount = 0;
        this.fps = 60;
        this.lastFrameTime = performance.now();
        this.adaptiveQuality = 1.0;

        // Check if running from file:// protocol
        if (window.location.protocol === 'file:') {
            console.warn('Running from file:// protocol. You may need to run a local server for 3D models to load.');
            this.showProtocolWarning();
        }

        // Lazy load - only initialize when in viewport
        this.setupLazyLoading();
    }

    setupLazyLoading() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.initialized) {
                    this.initialized = true;
                    observer.disconnect();
                    console.log('3D scene entering viewport, initializing...');
                    this.init();
                }
            });
        }, {
            rootMargin: '50px' // Start loading slightly before it's visible
        });

        observer.observe(this.container);
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

        // Camera - responsive positioning
        const isMobile = window.innerWidth <= 768;
        const fov = isMobile ? 60 : 50; // Wider FOV on mobile
        const cameraDistance = isMobile ? 8 : 6; // Further back on mobile

        this.camera = new THREE.PerspectiveCamera(
            fov,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1, cameraDistance);

        // Renderer - optimized for mobile
        this.renderer = new THREE.WebGLRenderer({
            antialias: !this.isMobile, // Disable antialiasing on mobile
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // Lower pixel ratio on mobile for better performance
        const pixelRatio = this.isMobile ? 1 : Math.min(window.devicePixelRatio, 2);
        this.renderer.setPixelRatio(pixelRatio);
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

        // Create water pool
        this.createWaterPool();

        // Create volumetric light rays
        if (!this.isMobile) {
            this.createVolumetricLightRays();
        }

        // Create atmospheric particles
        this.createAtmosphericParticles();

        // Load model
        this.loadModel();

        // Mouse interaction
        this.setupMouseInteraction();

        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Handle orientation change on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.onWindowResize(), 100);
        });

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
        // Lower ambient light for darker scene
        const ambientLight = new THREE.AmbientLight(0xffffff, this.isMobile ? 0.3 : 0.2);
        this.scene.add(ambientLight);

        // Bright spotlight on blob from above
        const spotlight = new THREE.SpotLight(0xffffff, this.isMobile ? 2.5 : 3.5);
        spotlight.position.set(0, 8, 3);
        spotlight.angle = Math.PI / 6; // 30 degree cone
        spotlight.penumbra = 0.3; // Soft edges
        spotlight.decay = 1.5;
        spotlight.distance = 25;
        spotlight.target.position.set(0, 0, 0);
        this.scene.add(spotlight);
        this.scene.add(spotlight.target);

        // Rim light from behind for depth
        const rimLight = new THREE.DirectionalLight(0x00E5FF, this.isMobile ? 0.6 : 1.0);
        rimLight.position.set(0, 3, -8);
        this.scene.add(rimLight);

        // Subtle blue fill from side
        if (!this.isLowEnd) {
            const fillLight = new THREE.DirectionalLight(0x0066FF, 0.4);
            fillLight.position.set(-6, 2, 2);
            this.scene.add(fillLight);
        }

        // Store spotlight for potential animation
        this.spotlight = spotlight;
        this.animatedLights = [];
    }

    setupPostProcessing() {
        // Render pass
        const renderPass = new RenderPass(this.scene, this.camera);

        // Composer
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderPass);

        // Enhanced bloom pass for dramatic glow - disabled on mobile for performance
        if (!this.isMobile) {
            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.8,  // strength - increased for more dramatic glow
                0.5,  // radius - increased for wider glow
                0.7   // threshold - lowered to bloom more elements
            );
            this.composer.addPass(bloomPass);
            this.bloomPass = bloomPass;
        }
    }

    createWaterPool() {
        // Create a realistic water surface below the blob
        // Reduce geometry complexity on mobile for better performance
        const segments = this.isLowEnd ? 32 : (this.isMobile ? 64 : 128);
        const waterGeometry = new THREE.PlaneGeometry(30, 30, segments, segments);

        // Create vertices array for wave animation
        this.waterVertices = waterGeometry.attributes.position.array;

        // Create procedural water normal map for texture with realistic patterns
        // Reduce texture size on mobile for better performance
        const texSize = this.isLowEnd ? 256 : (this.isMobile ? 384 : 512);
        const canvas = document.createElement('canvas');
        canvas.width = texSize;
        canvas.height = texSize;
        const ctx = canvas.getContext('2d');

        // Fill with base blue-gray color
        ctx.fillStyle = '#7799BB';
        ctx.fillRect(0, 0, texSize, texSize);

        // Create realistic water ripple patterns using Perlin-like noise simulation
        // Reduce pattern complexity on mobile
        const patternCount1 = this.isLowEnd ? 30 : (this.isMobile ? 60 : 100);
        // Layer 1: Large wave patterns
        for (let i = 0; i < patternCount1; i++) {
            const x = Math.random() * texSize;
            const y = Math.random() * texSize;
            const radius = Math.random() * 50 + 30;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(150, 180, 220, 0.4)');
            gradient.addColorStop(0.5, 'rgba(100, 140, 180, 0.2)');
            gradient.addColorStop(1, 'rgba(70, 110, 150, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Layer 2: Medium ripples for detail
        const patternCount2 = this.isLowEnd ? 50 : (this.isMobile ? 100 : 150);
        ctx.globalCompositeOperation = 'overlay';
        for (let i = 0; i < patternCount2; i++) {
            const x = Math.random() * texSize;
            const y = Math.random() * texSize;
            const radius = Math.random() * 20 + 8;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(200, 220, 255, 0.5)');
            gradient.addColorStop(0.6, 'rgba(100, 150, 200, 0.2)');
            gradient.addColorStop(1, 'rgba(50, 100, 150, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Layer 3: Fine detail noise - skip on low-end mobile
        if (!this.isLowEnd) {
            ctx.globalCompositeOperation = 'soft-light';
            const imageData = ctx.getImageData(0, 0, texSize, texSize);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const noise = (Math.random() - 0.5) * 30;
                data[i] += noise;     // R
                data[i + 1] += noise; // G
                data[i + 2] += noise; // B
            }
            ctx.putImageData(imageData, 0, 0);
        }

        // Layer 4: Flowing water streaks - reduced on mobile
        const patternCount4 = this.isLowEnd ? 15 : (this.isMobile ? 25 : 40);
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = 'rgba(180, 210, 255, 0.15)';
        for (let i = 0; i < patternCount4; i++) {
            ctx.lineWidth = Math.random() * 3 + 1;
            ctx.beginPath();
            const startX = Math.random() * texSize;
            const startY = Math.random() * texSize;
            const angle = Math.random() * Math.PI * 2;
            const length = Math.random() * 80 + 40;
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(
                startX + Math.cos(angle) * length * 0.5 + (Math.random() - 0.5) * 20,
                startY + Math.sin(angle) * length * 0.5 + (Math.random() - 0.5) * 20,
                startX + Math.cos(angle) * length,
                startY + Math.sin(angle) * length
            );
            ctx.stroke();
        }

        const normalTexture = new THREE.CanvasTexture(canvas);
        normalTexture.wrapS = THREE.RepeatWrapping;
        normalTexture.wrapT = THREE.RepeatWrapping;
        normalTexture.repeat.set(4, 4);

        // Create caustics texture for animated light patterns
        const causticsCanvas = document.createElement('canvas');
        causticsCanvas.width = 512;
        causticsCanvas.height = 512;
        const causticsCtx = causticsCanvas.getContext('2d');

        // Generate caustics pattern
        causticsCtx.fillStyle = '#000000';
        causticsCtx.fillRect(0, 0, 512, 512);

        // Create wavy caustic light patterns
        for (let i = 0; i < 40; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = 30 + Math.random() * 80;

            const gradient = causticsCtx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(200, 240, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
            causticsCtx.fillStyle = gradient;
            causticsCtx.fillRect(0, 0, 512, 512);
        }

        const causticsTexture = new THREE.CanvasTexture(causticsCanvas);
        causticsTexture.wrapS = THREE.RepeatWrapping;
        causticsTexture.wrapT = THREE.RepeatWrapping;
        causticsTexture.repeat.set(2, 2);

        // Water material with realistic properties, enhanced normal map, and caustics
        const waterMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x0077BE,
            metalness: 0.1,
            roughness: 0.05,
            transparent: true,
            opacity: 0.8,
            transmission: 0.7,
            thickness: 0.8,
            envMapIntensity: 2.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.03,
            normalMap: normalTexture,
            normalScale: new THREE.Vector2(1.2, 1.2), // Increased for more visible texture
            emissiveMap: causticsTexture, // Add caustics as emissive
            emissive: 0xffffff,
            emissiveIntensity: 0.15,
            side: THREE.DoubleSide,
            ior: 1.333 // Water's index of refraction
        });

        this.waterPool = new THREE.Mesh(waterGeometry, waterMaterial);

        // Store caustics texture for animation
        this.causticsTexture = causticsTexture;

        // Position the water below the blob
        this.waterPool.rotation.x = -Math.PI / 2; // Make it horizontal
        this.waterPool.position.y = -0.8;

        this.scene.add(this.waterPool);
    }

    createVolumetricLightRays() {
        // Create god rays/volumetric light effect
        const rayGeometry = new THREE.ConeGeometry(0.05, 12, 8, 1, true);
        const rayMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.06,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        // Create multiple light rays for fuller effect
        const rayCount = 8;
        for (let i = 0; i < rayCount; i++) {
            const ray = new THREE.Mesh(rayGeometry, rayMaterial.clone());
            ray.position.set(0, 6, 3);
            ray.rotation.x = Math.PI;

            // Slight offset for each ray
            const angle = (Math.PI * 2 * i) / rayCount;
            ray.position.x += Math.cos(angle) * 0.5;
            ray.position.z += 3 + Math.sin(angle) * 0.5;

            // Store for animation
            ray.userData.baseOpacity = 0.06 + Math.random() * 0.02;
            ray.userData.phase = Math.random() * Math.PI * 2;

            this.scene.add(ray);

            if (!this.lightRays) this.lightRays = [];
            this.lightRays.push(ray);
        }
    }

    createAtmosphericParticles() {
        // Create dust motes floating in the light
        const particleCount = this.isLowEnd ? 15 : (this.isMobile ? 25 : 50);
        const particleGeometry = new THREE.SphereGeometry(0.02, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());

            // Position in light cone area
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 3;
            const height = Math.random() * 10;

            particle.position.set(
                Math.cos(angle) * radius,
                height - 2,
                Math.sin(angle) * radius + 3
            );

            // Store animation data
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                Math.random() * 0.01 + 0.005,
                (Math.random() - 0.5) * 0.02
            );
            particle.userData.startY = particle.position.y;
            particle.userData.range = 4 + Math.random() * 6;
            particle.userData.baseOpacity = 0.2 + Math.random() * 0.3;

            this.scene.add(particle);
            this.atmosphericParticles.push(particle);
        }
    }

    createWaterShadow() {
        // Create shadow plane under blob
        const shadowGeometry = new THREE.PlaneGeometry(4, 4);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.3,
            blending: THREE.MultiplyBlending,
            depthWrite: false
        });

        this.waterShadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        this.waterShadow.rotation.x = -Math.PI / 2;
        this.waterShadow.position.y = -0.75;

        this.scene.add(this.waterShadow);
    }

    addReflectedLight() {
        // Add upward-facing cyan light to simulate water reflection
        const reflectedLight = new THREE.PointLight(0x00AAFF, this.isMobile ? 0.8 : 1.2, 8);
        reflectedLight.position.set(0, -0.5, 0);
        this.scene.add(reflectedLight);
        this.reflectedLight = reflectedLight;
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

                // Responsive scaling based on screen size
                const isMobile = window.innerWidth <= 768;
                const isSmallMobile = window.innerWidth <= 480;
                let scaleMultiplier;

                if (isSmallMobile) {
                    scaleMultiplier = 3.5; // Much smaller for small phones
                } else if (isMobile) {
                    scaleMultiplier = 4.5; // Smaller for tablets/large phones
                } else {
                    scaleMultiplier = 6.5; // Original size for desktop
                }

                const scale = scaleMultiplier / maxDim;
                this.baseScale = scale;
                this.model.scale.setScalar(scale);

                this.model.position.sub(center.multiplyScalar(scale));
                this.model.position.y = 0; // Center vertically

                // Enhanced materials with brighter, more dramatic lighting response
                this.model.traverse((child) => {
                    if (child.isMesh && child.material) {
                        // Make material highly reflective and glossy for spotlight
                        child.material.metalness = 0.5;
                        child.material.roughness = 0.1;
                        child.material.envMapIntensity = 2.5;

                        // Brighter emissive glow under spotlight
                        if (child.material.color) {
                            child.material.emissive = child.material.color.clone();
                            child.material.emissiveIntensity = 0.4;
                        }
                    }
                });

                this.scene.add(this.model);

                // Create water shadow now that model is loaded
                this.createWaterShadow();

                // Add reflected light from water bouncing onto blob
                this.addReflectedLight();

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
        // Limit particles to reduce lag - even less on mobile
        const particleCount = this.isLowEnd ? 5 : (this.isMobile ? 10 : 15);

        // Simpler geometry for better performance
        const segments = this.isMobile ? 3 : 4;
        const geometry = new THREE.SphereGeometry(0.06, segments, segments);
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

    updateTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        if (isDark) {
            this.scene.fog = new THREE.Fog(0x000000, 10, 50);
            // Darker water for dark theme
            if (this.waterPool) {
                this.waterPool.material.color.setHex(0x004466);
            }
        } else {
            this.scene.fog = new THREE.Fog(0xFAFAFA, 10, 50);
            // Brighter water for light theme
            if (this.waterPool) {
                this.waterPool.material.color.setHex(0x0099DD);
            }
        }
    }

    onWindowResize() {
        // Get actual viewport dimensions
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Update mobile flags
        this.isMobile = width <= 768;
        this.isLowEnd = width <= 480;

        // Update camera aspect ratio
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // Adjust camera FOV and position for mobile
        const isMobile = this.isMobile;
        const isSmallMobile = this.isLowEnd;

        this.camera.fov = isMobile ? 60 : 50;
        this.camera.position.z = isMobile ? 8 : 6;
        this.camera.updateProjectionMatrix();

        // Rescale model based on screen size
        if (this.model) {
            const box = new THREE.Box3().setFromObject(this.model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            let scaleMultiplier;
            if (isSmallMobile) {
                scaleMultiplier = 3.5;
            } else if (isMobile) {
                scaleMultiplier = 4.5;
            } else {
                scaleMultiplier = 6.5;
            }

            const newScale = scaleMultiplier / maxDim;
            this.baseScale = newScale;

            // Only update if scale actually changed
            if (Math.abs(this.model.scale.x - newScale) > 0.01) {
                this.model.scale.setScalar(newScale);
            }
        }

        // Update renderer size
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);

        // Force canvas to fit container on mobile
        const canvas = this.renderer.domElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;

        // Check hover (throttled)
        this.checkHover();

        // Update particles
        this.updateParticles();

        // Adaptive quality - measure frame rate
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime >= this.lastFrameTime + 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFrameTime = currentTime;

            // Adjust quality based on FPS
            if (this.fps < 30 && this.adaptiveQuality > 0.5) {
                this.adaptiveQuality -= 0.1;
                console.log('Reducing quality, FPS:', this.fps);
            } else if (this.fps > 55 && this.adaptiveQuality < 1.0) {
                this.adaptiveQuality += 0.05;
            }
        }

        // Animate volumetric light rays
        if (this.lightRays) {
            this.lightRays.forEach((ray, i) => {
                const pulse = Math.sin(time * 0.5 + ray.userData.phase) * 0.5 + 0.5;
                ray.material.opacity = ray.userData.baseOpacity * (0.7 + pulse * 0.3);

                // Subtle rotation
                ray.rotation.y = time * 0.1 + i * 0.5;
            });
        }

        // Animate atmospheric particles
        this.atmosphericParticles.forEach(particle => {
            // Float upward and drift
            particle.position.add(particle.userData.velocity);

            // Reset when too high
            if (particle.position.y > particle.userData.startY + particle.userData.range) {
                particle.position.y = particle.userData.startY;
            }

            // Twinkle effect
            const twinkle = Math.sin(time * 2 + particle.position.x) * 0.5 + 0.5;
            particle.material.opacity = particle.userData.baseOpacity * twinkle;
        });

        // Spotlight breathing animation
        if (this.spotlight) {
            const breath = Math.sin(time * 0.4) * 0.15;
            this.spotlight.intensity = (this.isMobile ? 2.5 : 3.5) * (1 + breath);
        }

        // Animate caustics texture
        if (this.causticsTexture) {
            this.causticsTexture.offset.x = time * 0.03;
            this.causticsTexture.offset.y = time * 0.02;
        }

        // Update water shadow position and size based on blob
        if (this.waterShadow && this.model) {
            this.waterShadow.position.x = this.model.position.x;
            this.waterShadow.position.z = this.model.position.z;

            // Shadow gets smaller/lighter when blob is higher
            const shadowScale = 1 - (this.model.position.y * 0.15);
            this.waterShadow.scale.set(shadowScale, shadowScale, 1);
            this.waterShadow.material.opacity = 0.2 + (this.model.position.y * 0.05);
        }

        // Animate water pool with realistic waves
        if (this.waterPool && this.waterVertices) {
            const positions = this.waterPool.geometry.attributes.position;

            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i);

                // Blob interaction ripple - emanates from blob position
                let blobRipple = 0;
                if (this.model) {
                    const blobX = this.model.position.x;
                    const blobZ = this.model.position.z;
                    const distToBlob = Math.sqrt((x - blobX) * (x - blobX) + (y - blobZ) * (y - blobZ));

                    // Ripple under blob synced to floating motion
                    if (distToBlob < 3) {
                        blobRipple = Math.sin(distToBlob * 2 - time * 2) * (1 - distToBlob / 3) * 0.3;
                    }
                }

                // Simplified wave calculation on mobile
                if (this.isMobile) {
                    // Just 4 wave layers on mobile for performance
                    const wave1 = Math.sin(x * 0.4 + time * 0.5) * 0.25;
                    const wave2 = Math.sin(y * 0.35 + time * 0.6) * 0.2;
                    const wave3 = Math.sin((x + y) * 0.6 + time * 0.8) * 0.15;
                    const dist = Math.sqrt(x * x + y * y);
                    const ripple1 = Math.sin(dist * 0.4 - time * 1.2) * 0.18;

                    positions.setZ(i, wave1 + wave2 + wave3 + ripple1 + blobRipple);
                } else {
                    // Full wave layers on desktop
                    const dist = Math.sqrt(x * x + y * y);

                    // Large slow waves
                    const wave1 = Math.sin(x * 0.4 + time * 0.5) * 0.25;
                    const wave2 = Math.sin(y * 0.35 + time * 0.6) * 0.2;

                    // Medium frequency waves at different angles
                    const wave3 = Math.sin((x + y) * 0.6 + time * 0.8) * 0.15;
                    const wave4 = Math.sin((x - y) * 0.5 + time * 0.7) * 0.12;

                    // Radial ripples from center
                    const ripple1 = Math.sin(dist * 0.4 - time * 1.2) * 0.18;
                    const ripple2 = Math.sin(dist * 0.6 - time * 0.9) * 0.1;

                    // High frequency detail waves
                    const detail1 = Math.sin(x * 1.2 + y * 0.8 + time * 1.5) * 0.08;
                    const detail2 = Math.sin(x * 0.9 - y * 1.1 + time * 1.3) * 0.06;

                    // Circular interference pattern
                    const interference = Math.sin((x * x + y * y) * 0.05 + time * 0.4) * 0.1;

                    // Combine all waves including blob interaction
                    const height = wave1 + wave2 + wave3 + wave4 +
                                  ripple1 + ripple2 + detail1 + detail2 + interference + blobRipple;

                    positions.setZ(i, height);
                }
            }

            positions.needsUpdate = true;
            this.waterPool.geometry.computeVertexNormals();

            // Animate normal map for flowing water texture effect with dual-direction flow
            if (this.waterPool.material.normalMap) {
                this.waterPool.material.normalMap.offset.x = time * 0.025;
                this.waterPool.material.normalMap.offset.y = time * 0.018;
            }
        }

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

        // Animate point lights (simplified) - skip on low-end mobile
        if (!this.isLowEnd && this.animatedLights && this.animatedLights.length > 0) {
            this.animatedLights[0].position.x = Math.sin(time * 0.7) * 4;
            this.animatedLights[0].position.z = Math.cos(time * 0.7) * 4;

            if (this.animatedLights[1]) {
                this.animatedLights[1].position.x = Math.sin(time * 0.5 + Math.PI) * 4;
                this.animatedLights[1].position.z = Math.cos(time * 0.5 + Math.PI) * 4;
            }
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
