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
        this.instancedParticles = null;
        this.particleData = [];
        this.waterShadow = null;
        this.frameCount = 0;
        this.fps = 60;
        this.lastFrameTime = performance.now();
        this.adaptiveQuality = 1.0;
        this.qualityPreset = 'high'; // default
        this.paused = false;

        // Set up quality preset listener
        this.setupQualityPresetSelector();

        // Set up tab visibility pause
        this.setupTabVisibilityPause();

        // Check if running from file:// protocol
        if (window.location.protocol === 'file:') {
            console.warn('Running from file:// protocol. You may need to run a local server for 3D models to load.');
            this.showProtocolWarning();
        }

        // Lazy load - only initialize when in viewport
        this.setupLazyLoading();
    }

    setupLazyLoading() {
        // Check if element is already in viewport (common for hero sections)
        const rect = this.container.getBoundingClientRect();
        const isAlreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (isAlreadyVisible) {
            this.initialized = true;
            this.init();
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.initialized) {
                    this.initialized = true;
                    observer.disconnect();
                    this.init();
                }
            });
        }, {
            rootMargin: '50px' // Start loading slightly before it's visible
        });

        observer.observe(this.container);
    }

    setupQualityPresetSelector() {
        const selector = document.getElementById('quality-preset');
        if (!selector) return;

        // Detect best quality for device
        if (this.isLowEnd) {
            selector.value = 'low';
            this.qualityPreset = 'low';
        } else if (this.isMobile) {
            selector.value = 'medium';
            this.qualityPreset = 'medium';
        }

        selector.addEventListener('change', (e) => {
            this.qualityPreset = e.target.value;
            this.applyQualityPreset();
        });
    }

    applyQualityPreset() {
        const presets = {
            low: {
                waterSegments: 24,
                particleCount: 15,
                lightRays: 3,
                bloomStrength: 0,
                textureSize: 256
            },
            medium: {
                waterSegments: 48,
                particleCount: 40,
                lightRays: 4,
                bloomStrength: 0.4,
                textureSize: 384
            },
            high: {
                waterSegments: 96,
                particleCount: 80,
                lightRays: 6,
                bloomStrength: 0.8,
                textureSize: 384
            },
            ultra: {
                waterSegments: 128,
                particleCount: 120,
                lightRays: 8,
                bloomStrength: 1.2,
                textureSize: 512
            }
        };

        const preset = presets[this.qualityPreset];

        // Apply bloom
        if (this.bloomPass) {
            this.bloomPass.strength = preset.bloomStrength;
        }

        // Note: Some changes like geometry require reload
    }

    setupTabVisibilityPause() {
        // Pause animation when tab is inactive to save resources
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.paused = true;
            } else {
                this.paused = false;
                this.lastFrameTime = performance.now(); // Reset timing
            }
        });
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
        // Scene with dramatic background
        this.scene = new THREE.Scene();
        // Deep space gradient background
        this.scene.background = new THREE.Color(0x000510);

        // Camera - responsive positioning
        const isMobile = window.innerWidth <= 768;
        const fov = isMobile ? 60 : 50; // Wider FOV on mobile
        const cameraDistance = isMobile ? 10 : 8; // Further back to prevent loading inside blob

        // Use container dimensions to prevent overflow on mobile
        const initWidth = this.container.clientWidth || window.innerWidth;
        const initHeight = this.container.clientHeight || window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(
            fov,
            initWidth / initHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1, cameraDistance);
        this.camera.lookAt(0, 0, 0); // Ensure camera looks at center

        // Renderer - optimized for mobile with error handling
        try {
            this.renderer = new THREE.WebGLRenderer({
                antialias: !this.isMobile, // Disable antialiasing on mobile
                alpha: true,
                powerPreference: "high-performance",
                failIfMajorPerformanceCaveat: false // Allow software rendering if needed
            });
        } catch (webglError) {
            // Show fallback message instead of crashing
            this.showWebGLFallback();
            return;
        }

        // Use container dimensions to prevent overflow on mobile
        const containerWidth = this.container.clientWidth || window.innerWidth;
        const containerHeight = this.container.clientHeight || window.innerHeight;
        this.renderer.setSize(containerWidth, containerHeight);
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

        // ENHANCED controls for buttery smooth camera movement
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0, 0); // Explicitly set target to center
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08; // Smoother damping
        this.controls.enableZoom = false;
        this.controls.enablePan = false;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.8; // Slower, more cinematic rotation
        this.controls.minPolarAngle = Math.PI / 3.5;
        this.controls.maxPolarAngle = Math.PI / 1.8;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 15;
        this.controls.rotateSpeed = 0.5; // Slower manual rotation

        // Disable touch rotation on mobile to allow page scrolling
        // Users can still see the autoRotate animation
        if (this.isMobile) {
            this.controls.enableRotate = false;
            // Allow vertical scrolling on the canvas
            this.renderer.domElement.style.touchAction = 'pan-y';
        }

        this.controls.update(); // Apply initial settings

        // Post-processing
        this.setupPostProcessing();

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

    showWebGLFallback() {
        // Show a fallback message when WebGL is not available
        this.container.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                padding: 40px 20px;
                text-align: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                color: white;
            ">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 20px; opacity: 0.8;">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h3 style="font-size: 20px; margin-bottom: 12px; font-weight: 600;">3D Viewer Unavailable</h3>
                <p style="font-size: 14px; opacity: 0.9; max-width: 400px; line-height: 1.6;">
                    Your device doesn't support 3D graphics. You can still browse our products and place orders!
                </p>
                <p style="font-size: 12px; opacity: 0.7; margin-top: 16px;">
                    Try using a different browser or device to see the 3D viewer.
                </p>
            </div>
        `;
    }

    setupLights() {
        // Enhanced ambient light for better base visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, this.isMobile ? 0.5 : 0.6);
        this.scene.add(ambientLight);

        // Main key light from above - soft and natural
        const spotlight = new THREE.SpotLight(0xffffff, this.isMobile ? 4.0 : 5.0);
        spotlight.position.set(0, 10, 2);
        spotlight.angle = Math.PI / 4.5;
        spotlight.penumbra = 0.5;
        spotlight.decay = 1.8;
        spotlight.distance = 35;
        spotlight.target.position.set(0, 0, 0);
        this.scene.add(spotlight);
        this.scene.add(spotlight.target);

        // Add subtle colored rim lights for atmospheric rays
        const rimLight1 = new THREE.DirectionalLight(0x88DDFF, this.isMobile ? 0.8 : 1.2);
        rimLight1.position.set(5, 4, -5);
        this.scene.add(rimLight1);

        const rimLight2 = new THREE.DirectionalLight(0xFF88DD, this.isMobile ? 0.6 : 0.9);
        rimLight2.position.set(-5, 4, -5);
        this.scene.add(rimLight2);

        // Fill light from side for depth
        if (!this.isLowEnd) {
            const fillLight = new THREE.DirectionalLight(0xFFFFFF, 0.7);
            fillLight.position.set(-6, 3, 2);
            this.scene.add(fillLight);
        }

        // Subtle accent lights for ambient glow
        const accentLight1 = new THREE.PointLight(0x00CCFF, this.isMobile ? 1.0 : 1.5, 15);
        accentLight1.position.set(3, -2, 3);
        this.scene.add(accentLight1);

        const accentLight2 = new THREE.PointLight(0xCC00FF, this.isMobile ? 0.8 : 1.2, 15);
        accentLight2.position.set(-3, -2, -3);
        this.scene.add(accentLight2);

        // Store lights for animation
        this.spotlight = spotlight;
        this.rimLight1 = rimLight1;
        this.rimLight2 = rimLight2;
        this.accentLight1 = accentLight1;
        this.accentLight2 = accentLight2;
    }

    setupPostProcessing() {
        // Render pass
        const renderPass = new RenderPass(this.scene, this.camera);

        // Composer
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderPass);

        // STUNNING bloom pass for cinematic glow
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.isMobile ? 1.2 : 1.8,  // strength - MUCH stronger for wow factor
            0.8,  // radius - even wider glow spread
            0.2   // threshold - lower to bloom more
        );
        this.composer.addPass(bloomPass);
        this.bloomPass = bloomPass;

        // Store for dynamic adjustments
        this.baseBloomStrength = this.isMobile ? 1.2 : 1.8;
    }

    createWaterPool() {
        // Create a realistic water surface below the blob
        // Reduce geometry complexity for better performance
        const segments = this.isLowEnd ? 24 : (this.isMobile ? 48 : 96); // Reduced from 32/64/128
        const waterGeometry = new THREE.PlaneGeometry(30, 30, segments, segments);

        // Create vertices array for wave animation
        this.waterVertices = waterGeometry.attributes.position.array;

        // Create procedural water normal map for texture with realistic patterns
        // Reduce texture size for better performance
        const texSize = this.isLowEnd ? 256 : (this.isMobile ? 256 : 384); // Reduced
        const canvas = document.createElement('canvas');
        canvas.width = texSize;
        canvas.height = texSize;
        const ctx = canvas.getContext('2d');

        // Fill with base blue-gray color
        ctx.fillStyle = '#7799BB';
        ctx.fillRect(0, 0, texSize, texSize);

        // Create realistic water ripple patterns using Perlin-like noise simulation
        // Reduce pattern complexity for performance
        const patternCount1 = this.isLowEnd ? 20 : (this.isMobile ? 40 : 60); // Reduced
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
        const patternCount2 = this.isLowEnd ? 30 : (this.isMobile ? 60 : 100); // Reduced
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

        // Layer 4: Flowing water streaks - reduced for performance
        const patternCount4 = this.isLowEnd ? 10 : (this.isMobile ? 15 : 25); // Reduced
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
        const causticsSize = this.isMobile ? 256 : 384; // Reduced size
        causticsCanvas.width = causticsSize;
        causticsCanvas.height = causticsSize;
        const causticsCtx = causticsCanvas.getContext('2d');

        // Generate caustics pattern
        causticsCtx.fillStyle = '#000000';
        causticsCtx.fillRect(0, 0, causticsSize, causticsSize);

        // Create wavy caustic light patterns - reduced count
        const causticsCount = this.isLowEnd ? 15 : (this.isMobile ? 20 : 30);
        for (let i = 0; i < causticsCount; i++) {
            const x = Math.random() * causticsSize;
            const y = Math.random() * causticsSize;
            const size = 30 + Math.random() * 80;

            const gradient = causticsCtx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(200, 240, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
            causticsCtx.fillStyle = gradient;
            causticsCtx.fillRect(0, 0, causticsSize, causticsSize);
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
            opacity: 0.5, // Reduced from 0.8 for more transparency
            transmission: 0.85, // Increased from 0.7 for more see-through effect
            thickness: 0.5, // Reduced from 0.8
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
        this.waterPool.position.y = -1.2; // Lowered from -0.8

        this.scene.add(this.waterPool);
    }


    createAtmosphericParticles() {
        // Use instanced rendering for huge performance boost
        const particleCount = this.isLowEnd ? 30 : (this.isMobile ? 60 : 120); // More particles for wow factor!
        const particleGeometry = new THREE.SphereGeometry(0.03, 6, 6); // Slightly larger
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0x00DDFF, // Cyan glow
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        // Create instanced mesh - single draw call for all particles
        this.instancedParticles = new THREE.InstancedMesh(
            particleGeometry,
            particleMaterial,
            particleCount
        );

        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();

        for (let i = 0; i < particleCount; i++) {
            // Position in expanding sphere around blob
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 6; // Wider spread
            const height = Math.random() * 12; // Taller range

            position.set(
                Math.cos(angle) * radius,
                height - 4,
                Math.sin(angle) * radius
            );

            matrix.setPosition(position);
            this.instancedParticles.setMatrixAt(i, matrix);

            // Store animation data
            this.particleData.push({
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.03, // Faster drift
                    Math.random() * 0.015 + 0.01, // Faster rise
                    (Math.random() - 0.5) * 0.03
                ),
                position: position.clone(),
                startY: position.y,
                range: 6 + Math.random() * 8, // Larger range
                baseOpacity: 0.3 + Math.random() * 0.4 // More visible
            });
        }

        this.instancedParticles.instanceMatrix.needsUpdate = true;
        this.scene.add(this.instancedParticles);
    }

    createWaterShadow() {
        // Create circular shadow under blob
        const shadowGeometry = new THREE.CircleGeometry(2, 32); // Radius 2, 32 segments for smooth circle
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.3,
            blending: THREE.MultiplyBlending,
            depthWrite: false
        });

        this.waterShadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        this.waterShadow.rotation.x = -Math.PI / 2;
        this.waterShadow.position.y = -1.15; // Adjusted to match lowered water level

        this.scene.add(this.waterShadow);
    }

    addReflectedLight() {
        // Add upward-facing cyan light to simulate water reflection
        const reflectedLight = new THREE.PointLight(0x00AAFF, this.isMobile ? 0.8 : 1.2, 8);
        reflectedLight.position.set(0, -0.9, 0); // Adjusted for lowered water level
        this.scene.add(reflectedLight);
        this.reflectedLight = reflectedLight;
    }

    createCausticsProjection() {
        // Create a plane to receive projected caustics from water
        const causticsPlaneGeometry = new THREE.PlaneGeometry(20, 20);

        // Custom shader for animated caustics projection
        const causticsShader = {
            uniforms: {
                time: { value: 0 },
                causticsTexture: { value: this.causticsTexture },
                intensity: { value: this.isMobile ? 0.3 : 0.5 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform sampler2D causticsTexture;
                uniform float intensity;
                varying vec2 vUv;

                void main() {
                    // Sample caustics with animated offset
                    vec2 uv1 = vUv * 2.0 + vec2(time * 0.03, time * 0.02);
                    vec2 uv2 = vUv * 2.5 - vec2(time * 0.02, time * 0.025);

                    vec4 caustics1 = texture2D(causticsTexture, uv1);
                    vec4 caustics2 = texture2D(causticsTexture, uv2);

                    // Combine two layers for depth
                    vec4 caustics = caustics1 * 0.6 + caustics2 * 0.4;

                    // Make it blue-cyan water caustics
                    vec3 causticsColor = vec3(0.5, 0.8, 1.0) * caustics.rgb * intensity;

                    gl_FragColor = vec4(causticsColor, caustics.a * 0.6);
                }
            `
        };

        const causticsMaterial = new THREE.ShaderMaterial({
            uniforms: causticsShader.uniforms,
            vertexShader: causticsShader.vertexShader,
            fragmentShader: causticsShader.fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.causticsPlane = new THREE.Mesh(causticsPlaneGeometry, causticsMaterial);
        this.causticsPlane.rotation.x = -Math.PI / 2;
        this.causticsPlane.position.y = -1.5; // Below water

        this.scene.add(this.causticsPlane);
    }

    loadModel() {
        const loader = new GLTFLoader();

        // Show loading state
        this.container.classList.add('loading');

        // Create beautiful loading overlay with progress bar
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'model-loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading 3D Experience</div>
                <div class="loading-bar">
                    <div class="loading-progress" style="width: 0%"></div>
                </div>
                <div class="loading-percent">0%</div>
            </div>
        `;
        this.container.appendChild(loadingOverlay);

        // Create a placeholder sphere while loading (helps verify rendering works)
        const placeholderGeometry = new THREE.SphereGeometry(2, 32, 32);
        const placeholderMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x00AAFF,
            metalness: 0.1,
            roughness: 0.4,
            transparent: true,
            opacity: 0.3
        });
        this.placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
        this.scene.add(this.placeholder);

        // Try to load the model with better error handling
        const modelPath = 'assets/blob.glb';

        loader.load(
            modelPath,
            (gltf) => {
                // Remove placeholder sphere
                if (this.placeholder) {
                    this.scene.remove(this.placeholder);
                    this.placeholder.geometry.dispose();
                    this.placeholder.material.dispose();
                    this.placeholder = null;
                }

                // Smooth fade out of loading overlay
                loadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    loadingOverlay.remove();
                    this.container.classList.remove('loading');
                }, 600);
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

                // Enhance materials while preserving original colors from the GLB model
                // This preserves the stripe colors defined in the 3D model
                this.model.traverse((child) => {
                    if (child.isMesh && child.material) {
                        const originalMaterial = child.material;
                        // IMPORTANT: Preserve the original color from the GLB file
                        const originalColor = originalMaterial.color ? originalMaterial.color.clone() : new THREE.Color(0x00AAFF);

                        // Create enhanced vinyl material while preserving original color
                        child.material = new THREE.MeshPhysicalMaterial({
                            // Preserve original color and ALL texture maps from the model
                            color: originalColor,
                            map: originalMaterial.map,
                            normalMap: originalMaterial.normalMap,
                            roughnessMap: originalMaterial.roughnessMap,
                            metalnessMap: originalMaterial.metalnessMap,
                            aoMap: originalMaterial.aoMap,
                            emissiveMap: originalMaterial.emissiveMap,
                            alphaMap: originalMaterial.alphaMap,

                            // Enhanced vinyl material properties
                            metalness: 0.05,
                            roughness: 0.4,  // Slightly smoother for better color visibility
                            envMapIntensity: 0.8,

                            // Vinyl is opaque
                            transparent: false,
                            opacity: 1.0,
                            transmission: 0.0,
                            thickness: 0.0,

                            // Subtle clearcoat for vinyl sheen
                            clearcoat: 0.25,
                            clearcoatRoughness: 0.7,

                            // Subtle glow using original color
                            emissive: originalColor,
                            emissiveIntensity: 0.12,

                            // Subtle sheen for vinyl material
                            sheen: 0.25,
                            sheenRoughness: 0.7,
                            sheenColor: new THREE.Color(0xFFFFFF),

                            // Better reflectivity
                            reflectivity: 0.3
                        });
                    }
                });

                this.scene.add(this.model);

                // Initial rotation for best angle
                this.model.rotation.y = Math.PI / 4;
            },
            (progress) => {
                const percent = (progress.loaded / progress.total * 100).toFixed(0);

                // Update progress bar
                const progressBar = this.container.querySelector('.loading-progress');
                const progressText = this.container.querySelector('.loading-percent');
                if (progressBar) progressBar.style.width = percent + '%';
                if (progressText) progressText.textContent = percent + '%';
            },
            (error) => {
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

        // Setup gyroscope tilt for mobile
        this.setupGyroscopeTilt();
    }

    setupGyroscopeTilt() {
        // Only enable on mobile devices
        if (!this.isMobile) return;

        this.gyroX = 0;
        this.gyroY = 0;
        this.targetGyroX = 0;
        this.targetGyroY = 0;

        // Check if device orientation is available
        if (window.DeviceOrientationEvent) {
            // For iOS 13+ we need to request permission
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                // Create a button to request permission (iOS requirement)
                const gyroButton = document.createElement('button');
                gyroButton.className = 'gyro-enable-btn';
                gyroButton.innerHTML = '🎮 Enable Motion';
                gyroButton.setAttribute('aria-label', 'Enable device motion for 3D effect');

                gyroButton.addEventListener('click', async () => {
                    try {
                        const permission = await DeviceOrientationEvent.requestPermission();
                        if (permission === 'granted') {
                            this.enableGyroscope();
                            gyroButton.style.display = 'none';
                        }
                    } catch (error) {
                        // Gyroscope permission denied
                        gyroButton.style.display = 'none';
                    }
                });

                // Add button to hero section
                const hero = document.querySelector('.hero');
                if (hero) {
                    hero.appendChild(gyroButton);
                }
            } else {
                // Android and other devices - just enable directly
                this.enableGyroscope();
            }
        }
    }

    enableGyroscope() {
        this.gyroEnabled = true;

        window.addEventListener('deviceorientation', (event) => {
            if (!this.gyroEnabled) return;

            // beta: front-to-back tilt (-180 to 180)
            // gamma: left-to-right tilt (-90 to 90)
            const beta = event.beta || 0;
            const gamma = event.gamma || 0;

            // Normalize and clamp values for subtle effect
            // Assuming phone is held upright (~45-90 degree beta)
            const normalizedBeta = Math.max(-30, Math.min(30, beta - 45)) / 30;
            const normalizedGamma = Math.max(-30, Math.min(30, gamma)) / 30;

            // Set target values (will be smoothed in animate loop)
            this.targetGyroX = normalizedGamma * 0.15; // Left/right tilt
            this.targetGyroY = normalizedBeta * 0.1;   // Forward/back tilt
        }, { passive: true });

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

        // Trigger gentle squish animation with bounce-back
        this.clickTime = Date.now();
        this.squishAmount = 1.0; // Gentler initial squish
        this.bounceVelocity = 0;
        this.bouncePhase = 0;

        // Create ENHANCED particle splash
        this.createSplash(event);

        // Make blob glow briefly with pulse effect + BLOOM SURGE
        this.model.traverse((child) => {
            if (child.isMesh && child.material && child.material.emissive) {
                const originalIntensity = child.material.emissiveIntensity || 0.08;
                child.material.emissiveIntensity = 1.2; // MUCH brighter flash

                // Smooth fade back
                const startTime = Date.now();
                const fadeInterval = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / 500, 1);
                    child.material.emissiveIntensity = originalIntensity + (1.2 - originalIntensity) * (1 - progress);

                    if (progress >= 1) {
                        clearInterval(fadeInterval);
                    }
                }, 16);
            }
        });

        // Pulse bloom effect on click for MAXIMUM impact
        if (this.bloomPass) {
            const originalBloom = this.baseBloomStrength;
            this.bloomPass.strength = originalBloom * 2.5; // HUGE bloom surge

            const startTime = Date.now();
            const bloomInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / 500, 1);
                const easeOut = 1 - Math.pow(1 - progress, 3);
                this.bloomPass.strength = originalBloom + (originalBloom * 1.5) * (1 - easeOut);

                if (progress >= 1) {
                    this.bloomPass.strength = originalBloom;
                    clearInterval(bloomInterval);
                }
            }, 16);
        }

        // Add subtle camera shake for impact feel
        if (this.camera) {
            const originalY = this.camera.position.y;
            const shakeIntensity = 0.08; // Much gentler shake
            const shakeDuration = 150; // Shorter duration
            const startTime = Date.now();

            const shakeInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / shakeDuration;

                if (progress >= 1) {
                    this.camera.position.y = originalY;
                    clearInterval(shakeInterval);
                } else {
                    const shake = Math.sin(progress * Math.PI * 6) * shakeIntensity * (1 - progress);
                    this.camera.position.y = originalY + shake;
                }
            }, 16);
        }
    }

    createSplash(event) {
        // ENHANCED particle count for wow factor
        const particleCount = this.isLowEnd ? 8 : (this.isMobile ? 15 : 25);

        // Create varied particle sizes for depth
        const sizes = [0.08, 0.12, 0.16];
        const colors = [0x00E5FF, 0x00AAFF, 0x66DDFF]; // Varied blues

        for (let i = 0; i < particleCount; i++) {
            const sizeIndex = Math.floor(Math.random() * sizes.length);
            const colorIndex = Math.floor(Math.random() * colors.length);

            const geometry = new THREE.SphereGeometry(sizes[sizeIndex], 6, 6);
            const material = new THREE.MeshBasicMaterial({
                color: colors[colorIndex],
                transparent: true,
                opacity: 0.9
            });

            const particle = new THREE.Mesh(geometry, material);

            // Position near the model with randomization
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
            const radius = 2 + Math.random() * 2;
            const height = (Math.random() - 0.3) * 2;

            particle.position.set(
                Math.cos(angle) * radius,
                height,
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
            this.scene.background = new THREE.Color(0x000510); // Deep space blue-black
        } else {
            this.scene.background = new THREE.Color(0x0A1628); // Slightly lighter dark blue
        }
    }

    onWindowResize() {
        // Use container dimensions to prevent overflow on mobile
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        // Update mobile flags
        this.isMobile = window.innerWidth <= 768;
        this.isLowEnd = window.innerWidth <= 480;

        // Update camera aspect ratio
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // Adjust camera FOV and position for mobile
        const isMobile = this.isMobile;
        const isSmallMobile = this.isLowEnd;

        this.camera.fov = isMobile ? 60 : 50;
        this.camera.position.z = isMobile ? 10 : 8;
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

        // Update renderer size using container dimensions
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);

        // Force canvas to fit container on mobile
        const canvas = this.renderer.domElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.maxWidth = '100%';
    }

    animate() {
        // Don't animate if renderer failed to initialize
        if (!this.renderer) {
            return;
        }

        requestAnimationFrame(() => this.animate());

        // Pause rendering when tab is inactive
        if (this.paused) {
            return;
        }

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

            // Adjust quality based on FPS - more aggressive
            if (this.fps < 40 && this.adaptiveQuality > 0.4) {
                this.adaptiveQuality -= 0.15;

                // Reduce particle count if struggling
                if (this.fps < 25 && this.atmosphericParticles.length > 10) {
                    for (let i = this.atmosphericParticles.length - 1; i >= this.atmosphericParticles.length / 2; i--) {
                        this.scene.remove(this.atmosphericParticles[i]);
                        this.atmosphericParticles[i].geometry.dispose();
                        this.atmosphericParticles[i].material.dispose();
                        this.atmosphericParticles.pop();
                    }
                }
            } else if (this.fps > 55 && this.adaptiveQuality < 1.0) {
                this.adaptiveQuality += 0.05;
            }
        }


        // Animate instanced atmospheric particles - single update for all
        if (this.instancedParticles && this.particleData.length > 0) {
            const matrix = new THREE.Matrix4();

            for (let i = 0; i < this.particleData.length; i++) {
                const data = this.particleData[i];

                // Float upward and drift
                data.position.add(data.velocity);

                // Reset when too high
                if (data.position.y > data.startY + data.range) {
                    data.position.y = data.startY;
                }

                // Update matrix
                matrix.setPosition(data.position);
                this.instancedParticles.setMatrixAt(i, matrix);
            }

            this.instancedParticles.instanceMatrix.needsUpdate = true;

            // Twinkle effect on material (affects all particles)
            const twinkle = Math.sin(time * 2.5) * 0.25 + 0.55; // More dramatic pulsing
            this.instancedParticles.material.opacity = twinkle;
        }

        // Subtle spotlight breathing animation for natural variation
        if (this.spotlight) {
            const breath = Math.sin(time * 0.3) * 0.15;
            this.spotlight.intensity = (this.isMobile ? 3.5 : 4.5) * (1 + breath);
        }


        // Smooth mouse parallax + gyroscope tilt
        if (this.model) {
            const targetRotationY = this.model.rotation.y + this.rotationSpeed;
            this.model.rotation.y = targetRotationY;

            // Gyroscope tilt on mobile (smooth interpolation)
            if (this.gyroEnabled && this.isMobile) {
                this.gyroX = THREE.MathUtils.lerp(this.gyroX, this.targetGyroX, 0.08);
                this.gyroY = THREE.MathUtils.lerp(this.gyroY, this.targetGyroY, 0.08);

                // Apply gyro-based camera offset for parallax effect
                this.camera.position.x = THREE.MathUtils.lerp(
                    this.camera.position.x,
                    this.gyroX * 2,
                    0.05
                );
                this.camera.position.y = THREE.MathUtils.lerp(
                    this.camera.position.y,
                    1 + this.gyroY * 1.5,
                    0.05
                );
            }

            // Subtle tilt based on mouse position (desktop) or gyro (mobile)
            const tiltTarget = this.gyroEnabled ? this.gyroY : this.mouseY * 0.1;
            this.model.rotation.x = THREE.MathUtils.lerp(
                this.model.rotation.x,
                tiltTarget,
                0.05
            );

            // Floating animation - dramatic slow float
            const baseY = Math.sin(time * 0.3) * 0.8; // Smooth floating motion
            this.model.position.y = baseY;

            // Gentle physics-based squish animation with subtle bounce
            if (this.squishAmount > 0) {
                const timeSinceClick = (Date.now() - this.clickTime) / 1000;
                const squishDuration = 0.6; // Shorter, snappier

                if (timeSinceClick < squishDuration) {
                    const progress = timeSinceClick / squishDuration;

                    // Gentler spring animation
                    const springK = 12; // Reduced stiffness = fewer bounces
                    const damping = 0.8; // More damping = faster settle

                    // Calculate spring force with fewer bounces
                    const wave = Math.exp(-damping * progress * 6) * Math.sin(progress * Math.PI * springK);

                    // Apply gentler squish
                    const squishY = 1 - wave * 0.18; // Less vertical squish
                    const squishXZ = 1 + wave * 0.09; // Less horizontal expansion

                    this.model.scale.y = this.baseScale * squishY;
                    this.model.scale.x = this.baseScale * squishXZ;
                    this.model.scale.z = this.baseScale * squishXZ;

                    // Subtle rotation wobble
                    this.model.rotation.z = wave * 0.05; // Less wobble
                } else {
                    // Reset scale and rotation
                    this.model.scale.setScalar(this.baseScale);
                    this.model.rotation.z = 0;
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

export { BlobViewer };
export default BlobViewer;
