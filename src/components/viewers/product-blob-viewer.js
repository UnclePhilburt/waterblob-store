import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class ProductBlobViewer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);

        if (!this.container) {
            return;
        }

        this.options = {
            autoRotate: true,
            enableInteraction: true,
            quality: 'medium', // low, medium, high
            enableColorCustomizer: true, // Enable color picker
            modelPath: 'assets/blob.glb', // Default model path
            showAllParts: true, // Show each node individually for color customization
            customGroups: null, // Custom part groupings
            showAnchorHotspots: false, // Show clickable HTML pins anchored to each anchor mesh
            anchorIndices: null, // Optional override for anchor part indices
            onAnchorClick: null, // Called with (index, partIndex) when a pin is clicked
            ...options
        };

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.model = null;
        this.controls = null;
        this.composer = null;
        this.rotationSpeed = 0.002;
        this.mouseX = 0;
        this.mouseY = 0;
        this.isHovering = false;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.baseScale = 1;
        this.isMobile = window.innerWidth <= 768;
        this.paused = false;
        this.animationId = null;

        // Color customization
        this.colorableParts = []; // Store references to colorable mesh parts
        this.selectedPart = null;
        this.colorPickerUI = null;

        // Store default colors for this model type so getCustomization()
        // can return them even before the 3D model finishes loading.
        this.defaultColors = this._buildDefaultColors();

        // Lazy load - only initialize when in viewport
        this.setupLazyLoading();
    }

    setupLazyLoading() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.initialized) {
                    this.initialized = true;
                    observer.disconnect();
                    this.init();
                }
            });
        }, {
            rootMargin: '100px'
        });

        observer.observe(this.container);
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000510);

        // Camera
        const width = this.container.clientWidth;
        const height = this.container.clientHeight || 400;

        this.camera = new THREE.PerspectiveCamera(
            45,
            width / height,
            0.1,
            1000
        );
        this.camera.position.set(0, 1, 8);
        this.camera.lookAt(0, 0, 0);

        // Renderer with error handling
        try {
            this.renderer = new THREE.WebGLRenderer({
                antialias: !this.isMobile,
                alpha: true,
                powerPreference: "high-performance",
                failIfMajorPerformanceCaveat: false
            });
        } catch (webglError) {
            this.showWebGLFallback();
            return;
        }

        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.container.appendChild(this.renderer.domElement);

        // Lights
        this.setupLights();

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = false;
        this.controls.autoRotate = this.options.autoRotate;
        this.controls.autoRotateSpeed = 1.5;
        this.controls.minPolarAngle = Math.PI / 3;
        this.controls.maxPolarAngle = Math.PI / 1.5;
        this.controls.minDistance = 4;
        this.controls.maxDistance = 12;

        // Post-processing
        this.setupPostProcessing();

        // Load model
        this.loadModel();

        // Mouse interaction
        if (this.options.enableInteraction) {
            this.setupMouseInteraction();
        }

        // Handle resize
        const resizeObserver = new ResizeObserver(() => this.onResize());
        resizeObserver.observe(this.container);

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
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px; opacity: 0.8;">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h4 style="font-size: 16px; margin-bottom: 8px; font-weight: 600;">3D Preview Unavailable</h4>
                <p style="font-size: 13px; opacity: 0.9; line-height: 1.5;">
                    Your device doesn't support 3D graphics
                </p>
            </div>
        `;
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Main spotlight
        const spotlight = new THREE.SpotLight(0xffffff, 4.0);
        spotlight.position.set(0, 10, 2);
        spotlight.angle = Math.PI / 4.5;
        spotlight.penumbra = 0.5;
        spotlight.decay = 1.8;
        spotlight.distance = 35;
        this.scene.add(spotlight);

        // Rim light
        const rimLight = new THREE.DirectionalLight(0xAADDFF, 1.0);
        rimLight.position.set(0, 3, -8);
        this.scene.add(rimLight);

        // Point lights
        const pointLight1 = new THREE.PointLight(0x00CCFF, 1.5, 12);
        pointLight1.position.set(4, 2, 4);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x0088FF, 1.2, 12);
        pointLight2.position.set(-4, 2, -4);
        this.scene.add(pointLight2);

        this.animatedLights = [pointLight1, pointLight2];
    }

    setupPostProcessing() {
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderPass);

        // Bloom based on quality
        const bloomStrength = this.options.quality === 'high' ? 1.0 :
                             this.options.quality === 'medium' ? 0.7 : 0.4;

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.container.clientWidth, this.container.clientHeight || 400),
            bloomStrength,
            0.5,
            0.3
        );
        this.composer.addPass(bloomPass);
    }

    loadModel() {
        const loader = new GLTFLoader();
        this.container.classList.add('loading');

        loader.load(
            this.options.modelPath,
            (gltf) => {
                this.container.classList.remove('loading');
                this.model = gltf.scene;

                // Center and scale
                const box = new THREE.Box3().setFromObject(this.model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 5.0 / maxDim;

                this.baseScale = scale;
                this.model.scale.setScalar(scale);

                // Recalculate bounding box after scaling
                const scaledBox = new THREE.Box3().setFromObject(this.model);
                const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

                // Center the model at origin
                this.model.position.x = -scaledCenter.x;
                this.model.position.y = -scaledCenter.y + (this.options.modelOffsetY || 0);
                this.model.position.z = -scaledCenter.z;

                // Store the base Y position for animation
                this.modelBaseY = this.model.position.y;

                // Clear previous colorable parts
                this.colorableParts = [];

                // Process each mesh - preserve groups and enhance materials
                this.model.traverse((child) => {
                    if (child.isMesh && child.material) {
                        // Get original color from the model (preserve the GLB's colors)
                        const originalMaterial = child.material;
                        const originalColor = originalMaterial.color ?
                            originalMaterial.color.clone() : new THREE.Color(0x00BBFF);

                        // Create enhanced vinyl material while preserving original color
                        const enhancedMaterial = new THREE.MeshPhysicalMaterial({
                            color: originalColor,
                            map: originalMaterial.map,
                            normalMap: originalMaterial.normalMap,
                            metalness: 0.05,
                            roughness: 0.35,
                            envMapIntensity: 1.2,
                            transparent: false,
                            opacity: 1.0,
                            clearcoat: 0.3,
                            clearcoatRoughness: 0.6,
                            emissive: originalColor,
                            emissiveIntensity: 0.15,
                            sheen: 0.3,
                            sheenRoughness: 0.7,
                            sheenColor: new THREE.Color(0xFFFFFF),
                            reflectivity: 0.4
                        });

                        child.material = enhancedMaterial;

                        // Store reference for color customization
                        const partName = child.name || `Part ${this.colorableParts.length + 1}`;
                        this.colorableParts.push({
                            mesh: child,
                            name: partName,
                            originalColor: originalColor.clone(),
                            currentColor: originalColor.clone()
                        });
                    }
                });

                this.scene.add(this.model);
                this.model.rotation.y = Math.PI / 4;

                // Create color customizer UI if enabled and we have parts
                if (this.options.enableColorCustomizer && this.colorableParts.length > 0) {
                    this.createColorCustomizerUI();

                    // Set initial colors based on model type
                    const isWeekender = this.options.modelPath && this.options.modelPath.includes('weekender');
                    const isBlob30 = this.options.modelPath && this.options.modelPath.includes('blob30');

                    if (isWeekender) {
                        // Main Body (index 0): white
                        this.setPartColor(0, '#FFFFFF');
                        // Side Panels (indices 1, 4): blue
                        this.setPartColor(1, '#0044AA');
                        this.setPartColor(4, '#0044AA');
                        // End Caps (indices 2, 3): red
                        this.setPartColor(2, '#E53935');
                        this.setPartColor(3, '#E53935');
                        // Anchor Points (indices 5, 6, 7): white
                        this.setPartColor(5, '#FFFFFF');
                        this.setPartColor(6, '#FFFFFF');
                        this.setPartColor(7, '#FFFFFF');
                    } else if (isBlob30) {
                        // 30ft Blob initial colors - red, white, and blue
                        // End Caps (index 2): white
                        this.setPartColor(2, '#FFFFFF');
                        // Primary (indices 3, 5, 6): blue
                        this.setPartColor(3, '#0044AA');
                        this.setPartColor(5, '#0044AA');
                        this.setPartColor(6, '#0044AA');
                        // Secondary (index 4): red
                        this.setPartColor(4, '#E53935');
                        // Anchor Points (indices 0, 1, 7, 8): white
                        this.setPartColor(0, '#FFFFFF');
                        this.setPartColor(1, '#FFFFFF');
                        this.setPartColor(7, '#FFFFFF');
                        this.setPartColor(8, '#FFFFFF');
                    } else {
                        // Default/40ft Blob initial colors - red, white, and blue
                        // End Caps (indices 0, 3): white
                        this.setPartColor(0, '#FFFFFF');
                        this.setPartColor(3, '#FFFFFF');
                        // Primary (index 1): blue
                        this.setPartColor(1, '#0044AA');
                        // Secondary (index 2): red
                        this.setPartColor(2, '#E53935');
                        // Anchor Points (indices 4, 5, 6, 7): white
                        this.setPartColor(4, '#FFFFFF');
                        this.setPartColor(5, '#FFFFFF');
                        this.setPartColor(6, '#FFFFFF');
                        this.setPartColor(7, '#FFFFFF');
                    }

                    // Highlight the active swatch in the UI for each group's default color
                    this._syncActiveSwatches();

                    // Send initial colors to React so form data is always available
                    if (this.options.onColorChange && this.defaultColors) {
                        this.options.onColorChange({ ...this.defaultColors });
                    }
                }

                if (this.options.showAnchorHotspots) {
                    this.setupAnchorHotspots();
                }

            },
            undefined,
            (error) => {
                this.container.classList.remove('loading');
            }
        );
    }

    createColorCustomizerUI() {
        // Available color swatches
        const colorSwatches = [
            { name: 'Blue', hex: '#0044AA' },
            { name: 'Red', hex: '#E53935' },
            { name: 'Green', hex: '#43A047' },
            { name: 'Yellow', hex: '#FFD600' },
            { name: 'Orange', hex: '#FF9800' },
            { name: 'White', hex: '#FFFFFF' },
            { name: 'Gray', hex: '#757575' }
        ];

        // Check model types
        const isWeekender = this.options.modelPath && this.options.modelPath.includes('weekender');
        const isBlob35 = this.options.modelPath && this.options.modelPath.includes('blob35');
        const isBlob30 = this.options.modelPath && this.options.modelPath.includes('blob30');
        const isSkiTube = this.options.modelPath && this.options.modelPath.includes('skitube');

        // Model-specific groupings
        if (isSkiTube) {
            // Ski tube custom groupings:
            // Nodes 1-3 (indices 0-2): Combined, hidden
            // Node 4 (index 3): Shown as "Top"
            // Node 5 (index 4): Shown as "Bottom"
            // Node 6 (index 5): Hidden, default yellow

            this.partGroups = [
                { name: 'Top', partIndices: [3] },
                { name: 'Bottom', partIndices: [4] },
                { name: 'Handles', partIndices: [5], yellowOnly: true }
            ];

            // Filter groups to only include indices that exist
            this.partGroups = this.partGroups.map(group => ({
                ...group,
                partIndices: group.partIndices.filter(i => i < this.colorableParts.length)
            })).filter(group => group.partIndices.length > 0);
        } else if (this.options.showIndividualParts) {
            // Show each part individually
            this.partGroups = this.colorableParts.map((part, index) => ({
                name: part.name || `Part ${index + 1}`,
                partIndices: [index]
            }));
        } else if (isBlob35) {
            // Custom groupings for 35ft Blob model (0-indexed)
            // Parts 1&4 together, Part 2 alone, Part 3 alone, Parts 5-8 together
            this.partGroups = [
                { name: 'End Caps', partIndices: [0, 3] },
                { name: 'Primary', partIndices: [1] },
                { name: 'Secondary', partIndices: [2] },
                { name: 'Anchor Points', partIndices: [4, 5, 6, 7] }
            ];

            // Filter groups to only include indices that exist
            this.partGroups = this.partGroups.map(group => ({
                ...group,
                partIndices: group.partIndices.filter(i => i < this.colorableParts.length)
            })).filter(group => group.partIndices.length > 0);
        } else if (isBlob30) {
            // Custom groupings for 30ft Blob model (0-indexed)
            this.partGroups = [
                { name: 'End Caps', partIndices: [2] },
                { name: 'Primary', partIndices: [3, 5, 6] },
                { name: 'Secondary', partIndices: [4] },
                { name: 'Anchor Points', partIndices: [0, 1, 7, 8] }
            ];

            // Filter groups to only include indices that exist
            this.partGroups = this.partGroups.map(group => ({
                ...group,
                partIndices: group.partIndices.filter(i => i < this.colorableParts.length)
            })).filter(group => group.partIndices.length > 0);
        } else if (isWeekender) {
            // Custom groupings for Weekender model (0-indexed)
            // Plane 1 alone, Plane 2&5 together, Plane 3&4 together, Plane 6,7,8 together
            this.partGroups = [
                { name: 'Main Body', partIndices: [0] },
                { name: 'Side Panels', partIndices: [1, 4] },
                { name: 'End Caps', partIndices: [2, 3] },
                { name: 'Anchor Points', partIndices: [5, 6, 7] }
            ];

            // Filter groups to only include indices that exist
            this.partGroups = this.partGroups.map(group => ({
                ...group,
                partIndices: group.partIndices.filter(i => i < this.colorableParts.length)
            })).filter(group => group.partIndices.length > 0);
        } else if (this.options.customGroups) {
            // Use custom groups if provided
            this.partGroups = this.options.customGroups;

            // Filter groups to only include indices that exist
            this.partGroups = this.partGroups.map(group => ({
                ...group,
                partIndices: group.partIndices.filter(i => i < this.colorableParts.length)
            })).filter(group => group.partIndices.length > 0);
        } else {
            // Default/40ft blob - same groupings as 35ft
            this.partGroups = [
                { name: 'End Caps', partIndices: [0, 3] },
                { name: 'Primary', partIndices: [1] },
                { name: 'Secondary', partIndices: [2] },
                { name: 'Anchor Points', partIndices: [4, 5, 6, 7] }
            ];

            // Filter groups to only include indices that exist
            this.partGroups = this.partGroups.map(group => ({
                ...group,
                partIndices: group.partIndices.filter(i => i < this.colorableParts.length)
            })).filter(group => group.partIndices.length > 0);
        }

        // Create color customizer panel — horizontal, below the viewer
        const customizer = document.createElement('div');
        customizer.className = 'blob-color-customizer';
        customizer.innerHTML = `
            <div class="customizer-content expanded">
                <span class="customizer-title">Customize Colors</span>
                <div class="color-parts-list"></div>
            </div>
        `;

        this.container.style.position = 'relative';
        // Insert customizer after the viewer's grandparent (viewerArea) so it's not clipped by overflow:hidden
        const viewerArea = this.container.parentElement;
        if (viewerArea && viewerArea.parentElement) {
            viewerArea.parentElement.insertBefore(customizer, viewerArea.nextSibling);
        } else if (viewerArea) {
            viewerArea.appendChild(customizer);
        } else {
            this.container.appendChild(customizer);
        }
        this.colorPickerUI = customizer;

        // Populate with grouped parts
        const partsList = customizer.querySelector('.color-parts-list');

        this.partGroups.forEach((group, groupIndex) => {
            const partItem = document.createElement('div');
            partItem.className = 'color-part-item';

            // Use yellow only swatches if flagged, otherwise all colors
            const swatchesToUse = group.yellowOnly
                ? [{ name: 'Yellow', hex: '#FFD600' }]
                : colorSwatches;

            // Create swatches HTML
            const swatchesHTML = swatchesToUse.map(color => `
                <button class="color-swatch${group.yellowOnly ? ' active' : ''}"
                        data-color="${color.hex}"
                        data-group-index="${groupIndex}"
                        title="${color.name}"
                        style="background-color: ${color.hex};">
                </button>
            `).join('');

            partItem.innerHTML = `
                <label class="part-label">${group.name}</label>
                <div class="swatches-row">${swatchesHTML}</div>
            `;
            partsList.appendChild(partItem);

            // Set yellow immediately for yellowOnly groups
            if (group.yellowOnly) {
                this.setGroupColor(groupIndex, '#FFD600');
            }

            // Add click listeners to swatches
            const swatches = partItem.querySelectorAll('.color-swatch');
            swatches.forEach(swatch => {
                swatch.addEventListener('click', (e) => {
                    const color = e.target.dataset.color;
                    const grpIdx = parseInt(e.target.dataset.groupIndex);
                    this.setGroupColor(grpIdx, color);

                    // Update active state
                    swatches.forEach(s => s.classList.remove('active'));
                    e.target.classList.add('active');
                });
            });
        });

        // Add styles
        this.addCustomizerStyles();
    }

    setGroupColor(groupIndex, hexColor) {
        const group = this.partGroups[groupIndex];
        if (!group) return;

        // Track the selection so getCustomization() always has it
        if (this.defaultColors && group.name) {
            this.defaultColors[group.name] = hexColor.toUpperCase();
        }

        // Apply color to all parts in this group
        group.partIndices.forEach(partIndex => {
            this.setPartColor(partIndex, hexColor);
        });

        // Notify React of the color change
        if (this.options.onColorChange && this.defaultColors) {
            this.options.onColorChange({ ...this.defaultColors });
        }
    }

    _syncActiveSwatches() {
        if (!this.colorPickerUI || !this.partGroups) return;

        this.partGroups.forEach((group, groupIndex) => {
            // Get color from 3D part, or fall back to defaultColors
            const firstPart = this.colorableParts[group.partIndices[0]];
            let currentHex;
            if (firstPart && firstPart.currentColor) {
                currentHex = '#' + firstPart.currentColor.getHexString().toUpperCase();
            } else if (this.defaultColors && this.defaultColors[group.name]) {
                currentHex = this.defaultColors[group.name].toUpperCase();
            } else {
                return;
            }

            const partItems = this.colorPickerUI.querySelectorAll('.color-part-item');
            const partItem = partItems[groupIndex];
            if (!partItem) return;

            const swatches = partItem.querySelectorAll('.color-swatch');
            swatches.forEach(swatch => {
                if (swatch.dataset.color.toUpperCase() === currentHex) {
                    swatch.classList.add('active');
                } else {
                    swatch.classList.remove('active');
                }
            });
        });
    }

    setPartColor(partIndex, hexColor) {
        const part = this.colorableParts[partIndex];
        if (!part) return;

        const color = new THREE.Color(hexColor);
        part.currentColor = color.clone();
        part.mesh.material.color = color;
        part.mesh.material.emissive = color;
        part.mesh.material.needsUpdate = true;
    }

    resetColors() {
        this.colorableParts.forEach((part, index) => {
            const originalHex = '#' + part.originalColor.getHexString();
            this.setPartColor(index, originalHex);
        });
    }

    addCustomizerStyles() {
        if (document.getElementById('blob-customizer-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'blob-customizer-styles';
        styles.textContent = `
            .blob-color-customizer {
                width: 100%;
                max-width: 100%;
                box-sizing: border-box;
                background: rgba(10, 20, 40, 0.95);
                border-radius: 12px;
                border: 1px solid rgba(0, 168, 232, 0.3);
                font-family: system-ui, -apple-system, sans-serif;
                backdrop-filter: blur(10px);
                margin-top: 0.75rem;
                overflow: hidden;
            }

            .customizer-content {
                padding: 12px 16px;
                overflow-x: auto;
            }

            .customizer-title {
                color: #fff;
                font-size: 13px;
                font-weight: 600;
                margin-bottom: 10px;
                display: block;
            }

            .color-parts-list {
                display: flex;
                gap: 1.5rem;
                flex-wrap: wrap;
            }

            .color-part-item {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .part-label {
                color: rgba(255,255,255,0.9);
                font-size: 12px;
                font-weight: 500;
                white-space: nowrap;
            }

            .swatches-row {
                display: flex;
                gap: 5px;
            }

            .color-swatch {
                width: 26px;
                height: 26px;
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.2);
                cursor: pointer;
                transition: all 0.15s ease;
                padding: 0;
            }

            .color-swatch:hover {
                transform: scale(1.15);
                border-color: rgba(255,255,255,0.5);
            }

            .color-swatch[data-color="#FFFFFF"] {
                border-color: rgba(0,0,0,0.2);
            }

            .color-swatch.active {
                border-color: #00A8E8;
                box-shadow: 0 0 0 2px rgba(0, 168, 232, 0.4);
            }

            @media (max-width: 768px) {
                .color-parts-list {
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .swatches-row {
                    flex-wrap: wrap;
                }

                .color-swatch {
                    width: 24px;
                    height: 24px;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    setupMouseInteraction() {
        this.container.addEventListener('mousemove', (event) => {
            const rect = this.container.getBoundingClientRect();
            this.mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            this.mouse.x = this.mouseX;
            this.mouse.y = this.mouseY;
        });

        this.container.style.cursor = 'grab';
        this.container.addEventListener('mousedown', () => {
            this.container.style.cursor = 'grabbing';
        });
        this.container.addEventListener('mouseup', () => {
            this.container.style.cursor = 'grab';
        });
    }

    updateTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (this.scene) {
            this.scene.background = isDark ?
                new THREE.Color(0x000510) :
                new THREE.Color(0x0A1628);
        }
    }

    onResize() {
        if (!this.camera || !this.renderer) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight || 400;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);

        if (this.composer) {
            this.composer.setSize(width, height);
        }
    }

    animate() {
        // Don't animate if renderer failed to initialize
        if (!this.renderer) {
            return;
        }

        this.animationId = requestAnimationFrame(() => this.animate());

        if (this.paused) return;

        const time = Date.now() * 0.001;

        // Animate model
        if (this.model) {
            // Floating animation
            const floatOffset = Math.sin(time * 0.3) * 0.3;
            this.model.position.y = (this.modelBaseY || 0) + floatOffset;

            // Gentle wobble on hover
            if (this.isHovering) {
                const wobble = Math.sin(time * 3) * 0.01;
                this.model.rotation.z = wobble;
            }
        }

        // Animate lights
        if (this.animatedLights && this.animatedLights.length > 0) {
            this.animatedLights[0].position.x = Math.sin(time * 0.7) * 4;
            this.animatedLights[0].position.z = Math.cos(time * 0.7) * 4;

            if (this.animatedLights[1]) {
                this.animatedLights[1].position.x = Math.sin(time * 0.5 + Math.PI) * 4;
                this.animatedLights[1].position.z = Math.cos(time * 0.5 + Math.PI) * 4;
            }
        }

        this.controls.update();
        this.composer.render();
        this.updateHotspotPositions();
    }

    _buildDefaultColors() {
        const mp = this.options.modelPath || '';
        if (mp.includes('skitube')) {
            return { 'Top': '#FFFFFF', 'Bottom': '#FFFFFF', 'Handles': '#FFD600' };
        } else if (mp.includes('weekender')) {
            return { 'Main Body': '#FFFFFF', 'Side Panels': '#0044AA', 'End Caps': '#E53935', 'Anchor Points': '#FFFFFF' };
        } else if (mp.includes('blob30')) {
            return { 'End Caps': '#FFFFFF', 'Primary': '#0044AA', 'Secondary': '#E53935', 'Anchor Points': '#FFFFFF' };
        } else {
            // Default / 35ft / 40ft blob
            return { 'End Caps': '#FFFFFF', 'Primary': '#0044AA', 'Secondary': '#E53935', 'Anchor Points': '#FFFFFF' };
        }
    }

    getCustomization() {
        // Start with defaults so every group is always included
        const customization = this.defaultColors ? { ...this.defaultColors } : {};

        // Overlay live colors from the 3D parts if the model has loaded
        if (this.colorableParts && this.colorableParts.length > 0) {
            const groups = this.partGroups || this.options.customGroups;

            if (groups && groups.length > 0) {
                groups.forEach(group => {
                    const firstPartIndex = group.partIndices[0];
                    const part = this.colorableParts[firstPartIndex];

                    if (part && part.currentColor) {
                        customization[group.name] = '#' + part.currentColor.getHexString().toUpperCase();
                    }
                });
            } else {
                this.colorableParts.forEach((part, index) => {
                    if (part.currentColor) {
                        customization[`Part ${index + 1}`] = '#' + part.currentColor.getHexString().toUpperCase();
                    }
                });
            }
        }

        return Object.keys(customization).length > 0 ? customization : null;
    }

    captureScreenshot(width = 800, height = 600) {
        // Capture current 3D view as a data URL
        if (!this.renderer) {
            return null;
        }

        try {
            // Temporarily resize for better quality screenshot
            const originalWidth = this.renderer.domElement.width;
            const originalHeight = this.renderer.domElement.height;

            // Render at higher resolution
            this.renderer.setSize(width, height);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();

            // Render one frame
            if (this.composer) {
                this.composer.render();
            } else {
                this.renderer.render(this.scene, this.camera);
            }

            // Capture as data URL
            const dataUrl = this.renderer.domElement.toDataURL('image/png');

            // Restore original size
            this.renderer.setSize(originalWidth, originalHeight);
            this.camera.aspect = originalWidth / originalHeight;
            this.camera.updateProjectionMatrix();

            return dataUrl;
        } catch (error) {
            // silently handled
            return null;
        }
    }

    setupAnchorHotspots() {
        if (!this.model || this.colorableParts.length === 0) return;

        const isWeekender = this.options.modelPath && this.options.modelPath.includes('weekender');
        const isBlob30 = this.options.modelPath && this.options.modelPath.includes('blob30');

        let anchorIndices;
        if (Array.isArray(this.options.anchorIndices)) {
            anchorIndices = this.options.anchorIndices;
        } else if (isWeekender) {
            anchorIndices = [5, 6, 7];
        } else if (isBlob30) {
            anchorIndices = [0, 1, 7, 8];
        } else {
            anchorIndices = [4, 5, 6, 7];
        }

        anchorIndices = anchorIndices.filter((i) => i < this.colorableParts.length);

        // Debug: surface what we actually mounted so we can verify in the field
        if (typeof window !== 'undefined') {
            const summary = {
                modelPath: this.options.modelPath,
                totalParts: this.colorableParts.length,
                anchorIndices,
                partNames: this.colorableParts.map((p, idx) => `${idx}: ${p.name}`),
            };
            console.log('[anchor-hotspots]', summary);
        }

        this._injectAnchorPinStyles();

        // Container must be positioned for absolute children to anchor correctly
        if (getComputedStyle(this.container).position === 'static') {
            this.container.style.position = 'relative';
        }

        this.anchorHotspots = anchorIndices.map((partIdx, i) => {
            const mesh = this.colorableParts[partIdx].mesh;

            // Pre-compute the geometry's local centroid so we project the
            // visible center of the mesh (not the mesh's transform origin,
            // which for GLB imports is often at the model root).
            if (mesh.geometry) {
                if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
            }
            const localCenter = mesh.geometry && mesh.geometry.boundingBox
                ? mesh.geometry.boundingBox.getCenter(new THREE.Vector3())
                : new THREE.Vector3();

            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'blob-anchor-pin';
            el.setAttribute('aria-label', `Anchor point ${i + 1}`);
            el.innerHTML = `<span class="blob-anchor-pin__pulse"></span><span class="blob-anchor-pin__label">${i + 1}</span>`;

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setActiveAnchor(i);
                if (typeof this.options.onAnchorClick === 'function') {
                    this.options.onAnchorClick(i, partIdx);
                }
            });

            this.container.appendChild(el);

            return {
                el,
                mesh,
                partIdx,
                index: i,
                _localCenter: localCenter,
                _worldPos: new THREE.Vector3(),
            };
        });
    }

    _injectAnchorPinStyles() {
        if (document.getElementById('blob-anchor-pin-styles')) return;
        const style = document.createElement('style');
        style.id = 'blob-anchor-pin-styles';
        style.textContent = `
            .blob-anchor-pin {
                position: absolute;
                top: 0;
                left: 0;
                width: 36px;
                height: 36px;
                margin: -18px 0 0 -18px;
                padding: 0;
                border: 2px solid #FFD600;
                border-radius: 50%;
                background: rgba(10, 20, 48, 0.9);
                color: #FFD600;
                font: 700 14px/1 "Helvetica Neue", Arial, sans-serif;
                cursor: pointer;
                pointer-events: auto;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 5;
                transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease;
                will-change: transform;
            }
            .blob-anchor-pin__pulse {
                position: absolute;
                inset: -4px;
                border-radius: 50%;
                border: 2px solid rgba(255, 214, 0, 0.6);
                animation: blob-anchor-pulse 2s ease-out infinite;
                pointer-events: none;
            }
            .blob-anchor-pin__label {
                position: relative;
                z-index: 1;
            }
            .blob-anchor-pin:hover {
                transform: scale(1.12);
                background: rgba(255, 214, 0, 0.18);
            }
            .blob-anchor-pin--active {
                background: #FFD600;
                color: #0a1430;
                box-shadow: 0 0 0 3px rgba(255, 214, 0, 0.35);
            }
            .blob-anchor-pin--occluded {
                opacity: 0.35;
            }
            .blob-anchor-pin--hidden {
                display: none;
            }
            @keyframes blob-anchor-pulse {
                0% { transform: scale(1); opacity: 0.9; }
                100% { transform: scale(1.9); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    updateHotspotPositions() {
        if (!this.anchorHotspots || !this.anchorHotspots.length || !this.camera) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        const offsetX = rect.left - containerRect.left;
        const offsetY = rect.top - containerRect.top;
        const w = rect.width;
        const h = rect.height;
        const cameraPos = this.camera.position;

        this.anchorHotspots.forEach((hs) => {
            hs.mesh.updateWorldMatrix(true, false);
            hs._worldPos.copy(hs._localCenter).applyMatrix4(hs.mesh.matrixWorld);
            const projected = hs._worldPos.clone().project(this.camera);

            // Behind the camera or far outside view
            if (projected.z > 1 || projected.z < -1) {
                hs.el.classList.add('blob-anchor-pin--hidden');
                return;
            }

            const x = (projected.x * 0.5 + 0.5) * w + offsetX;
            const y = (-projected.y * 0.5 + 0.5) * h + offsetY;

            // Cull when off-canvas
            if (x < -40 || x > w + 40 || y < -40 || y > h + 40) {
                hs.el.classList.add('blob-anchor-pin--hidden');
                return;
            }
            hs.el.classList.remove('blob-anchor-pin--hidden');
            hs.el.style.transform = `translate(${x}px, ${y}px)`;

            // Occlude pins on the far side of the model (rough back-face dimming)
            const toCamera = cameraPos.clone().sub(hs._worldPos).normalize();
            const modelCenter = new THREE.Vector3(0, this.modelBaseY || 0, 0);
            const outward = hs._worldPos.clone().sub(modelCenter).normalize();
            const facing = outward.dot(toCamera);
            if (facing < -0.05) {
                hs.el.classList.add('blob-anchor-pin--occluded');
            } else {
                hs.el.classList.remove('blob-anchor-pin--occluded');
            }
        });
    }

    setActiveAnchor(index) {
        if (!this.anchorHotspots) return;
        this.activeAnchorIndex = index;
        this.anchorHotspots.forEach((hs) => {
            if (hs.index === index) {
                hs.el.classList.add('blob-anchor-pin--active');
            } else {
                hs.el.classList.remove('blob-anchor-pin--active');
            }
        });
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.anchorHotspots && this.anchorHotspots.length) {
            this.anchorHotspots.forEach(({ el }) => {
                if (el && el.parentNode) el.parentNode.removeChild(el);
            });
            this.anchorHotspots = [];
        }

        // Remove color picker UI
        if (this.colorPickerUI && this.colorPickerUI.parentNode) {
            this.colorPickerUI.parentNode.removeChild(this.colorPickerUI);
            this.colorPickerUI = null;
        }

        // Dispose controls
        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }

        // Dispose composer
        if (this.composer) {
            this.composer.dispose();
            this.composer = null;
        }

        // Dispose scene objects (geometries, materials, textures)
        if (this.scene) {
            this.scene.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach((m) => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
            this.scene = null;
        }

        // Remove canvas and force-release WebGL context
        if (this.renderer) {
            if (this.container && this.renderer.domElement && this.renderer.domElement.parentNode === this.container) {
                this.container.removeChild(this.renderer.domElement);
            }
            this.renderer.forceContextLoss();
            this.renderer.dispose();
            this.renderer = null;
        }

        this.model = null;
        this.camera = null;
    }
}

export default ProductBlobViewer;
