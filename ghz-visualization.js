// ============================================
// BIG BANG / WAVE COLLAPSE SYSTEM
// ============================================
class BigBangSystem {
    constructor(scene, qubits, connections) {
        this.scene = scene;
        this.qubits = qubits;
        this.connections = connections;
        
        // Big Bang state
        this.isActive = false;
        this.progress = 0.0; // 0.0 to 1.0
        this.duration = 2000; // 2 seconds for full expansion
        this.startTime = 0;
        
        // Golden ratio for expansion
        this.goldenRatio = 1.618033988749895;
        this.k = 3.0; // Expansion rate constant
        
        // Store original positions
        this.originalPositions = qubits.map(q => q.userData.basePosition.clone());
    }
    
    // Calculate expansion scale using golden ratio (from STEADYWATCH)
    calculateExpansionScale(progress) {
        const expansionDuration = 0.15; // 15% of animation
        const collapsedSize = 0.5; // Start at 50% size
        const expandedSize = 1.0; // End at 100% size
        
        if (progress < expansionDuration) {
            const expansionProgress = progress / expansionDuration; // 0.0 to 1.0
            
            // Golden ratio exponential expansion: φ^(-k * progress)
            const goldenExponent = -this.k * expansionProgress;
            const goldenExpansion = 1.0 - Math.pow(this.goldenRatio, goldenExponent);
            
            // Normalize to ensure we reach exactly 1.0 at progress = 1.0
            const maxExponent = -this.k * 1.0;
            const maxGoldenExpansion = 1.0 - Math.pow(this.goldenRatio, maxExponent);
            const normalizedExpansion = goldenExpansion / maxGoldenExpansion;
            
            return collapsedSize + (expandedSize - collapsedSize) * normalizedExpansion;
        } else {
            return expandedSize;
        }
    }
    
    // Trigger Big Bang
    trigger() {
        this.isActive = true;
        this.progress = 0.0;
        this.startTime = Date.now();
        
        // Collapse all qubits to center (singularity)
        this.qubits.forEach(qubit => {
            qubit.userData.bigBangStartPos = qubit.userData.basePosition.clone();
            qubit.userData.bigBangProgress = 0.0;
        });
    }
    
    // Update Big Bang animation
    update() {
        if (!this.isActive) return;
        
        const elapsed = Date.now() - this.startTime;
        this.progress = Math.min(1.0, elapsed / this.duration);
        
        // Calculate expansion scale using golden ratio
        const expansionScale = this.calculateExpansionScale(this.progress);
        
        // Animate qubits from center outward
        this.qubits.forEach((qubit, index) => {
            const basePos = qubit.userData.basePosition;
            const startPos = qubit.userData.bigBangStartPos || basePos;
            
            // Phase 1: Collapse to center (0.0 to 0.2 progress)
            if (this.progress < 0.2) {
                const collapseProgress = this.progress / 0.2; // 0.0 to 1.0
                const collapseFactor = 1.0 - collapseProgress;
                qubit.position.lerp(new THREE.Vector3(0, 0, 0), collapseFactor);
                qubit.scale.set(0.2, 0.2, 0.2); // Shrink to 20% during collapse
            }
            // Phase 2: Expand from center (0.2 to 1.0 progress)
            else {
                const expansionProgress = (this.progress - 0.2) / 0.8; // 0.0 to 1.0
                
                // Use golden ratio expansion
                const goldenExponent = -this.k * expansionProgress;
                const goldenExpansion = 1.0 - Math.pow(this.goldenRatio, goldenExponent);
                const maxExponent = -this.k * 1.0;
                const maxGoldenExpansion = 1.0 - Math.pow(this.goldenRatio, maxExponent);
                const normalizedExpansion = goldenExpansion / maxGoldenExpansion;
                
                // Interpolate from center to base position
                const targetPos = basePos.clone();
                const currentPos = new THREE.Vector3(0, 0, 0).lerp(targetPos, normalizedExpansion);
                qubit.position.copy(currentPos);
                
                // Scale from 0.2 to 1.0 using expansion scale
                const scale = 0.2 + (1.0 - 0.2) * normalizedExpansion;
                qubit.scale.set(scale, scale, scale);
            }
        });
        
        // Animate connections (fade in as qubits expand)
        const connectionOpacity = Math.max(0, (this.progress - 0.2) * 1.25); // Fade in from 0.2
        this.connections.forEach(connection => {
            if (connection.material) {
                connection.material.opacity = 0.3 * connectionOpacity;
            }
        });
        
        // Complete animation
        if (this.progress >= 1.0) {
            this.isActive = false;
            // Ensure qubits are at final positions
            this.qubits.forEach(qubit => {
                qubit.position.copy(qubit.userData.basePosition);
                qubit.scale.set(1.0, 1.0, 1.0);
            });
            this.connections.forEach(connection => {
                if (connection.material) {
                    connection.material.opacity = 0.3;
                }
            });
        }
    }
}


// ============================================
// UNIFIED STYLING SYSTEM
// Shared math for all qubits - Perlin Noise + ECHO Shadowing + Tesla Patterns
// ============================================

class UnifiedQubitStyling {
    constructor() {
        // Perlin Noise state (from SteadyWatch)
        this.noiseState = {
            lastNoiseUpdateTime: 0,
            smoothedNoiseValue: 0,
            noiseSmoothingTimeConstant: 0.5 // seconds
        };
        
        // ECHO Shadowing parameters
        this.shadowParams = {
            lightAngle: 45.0, // degrees
            baseGlowIntensity: 0.15,
            glowIntensityRange: 0.12,
            baseShadowRadius: 2.0,
            shadowRadiusRange: 2.0,
            baseShadowIntensity: 0.55,
            shadowIntensityRange: 0.25
        };
        
        // Tesla 3-6-9 pattern multipliers
        this.teslaMultipliers = {
            base: 1.0,
            harmonic3: 1.0 / 3.0,
            harmonic6: 1.0 / 6.0,
            harmonic9: 1.0 / 9.0
        };
    }

    // ============================================
    // PERLIN NOISE (from SteadyWatch AtomicClockView.swift)
    // ============================================

        hash(x) {
        // Simple hash function for pseudo-random gradients
        const wrapped = x % 2147483647; // Large prime
        let hash = Math.abs(wrapped);
        hash = ((hash * 1103515245) + 12345) & 0x7fffffff;
        hash = ((hash * 1103515245) + 12345) & 0x7fffffff;
        // Convert to range [-1.0, 1.0]
        return (hash % 2000000000) / 1000000000.0 - 1.0;
    }

        smoothstep(t) {
        // 5th order polynomial smoothstep (from SteadyWatch)
        const clamped = Math.max(0.0, Math.min(1.0, t));
        // 6t^5 - 15t^4 + 10t^3
        return clamped * clamped * clamped * (clamped * (clamped * 6.0 - 15.0) + 10.0);
    }

        lerp(a, b, t) {
        return a + (b - a) * t;
    }

        gradient(x, t) {
        const grad = this.hash(x);
        const dist = t - x;
        return grad * dist;
    }

     perlin1D(x) {
        // Handle large values by wrapping
        const wrappedX = x % 1000000.0;
        
        // Find grid points
        const x0 = Math.floor(wrappedX);
        const x1 = x0 + 1;
        
        // Calculate fractional part for interpolation
        const fx = wrappedX - x0;
        
        // Get gradients at grid points
        const g0 = this.gradient(x0, wrappedX);
        const g1 = this.gradient(x1, wrappedX);
        
        // Smooth interpolation between gradients
        const t = this.smoothstep(fx);
        return this.lerp(g0, g1, t);
    }

        generateNoise(time, frequency = 1.0) {
        // Multiple octaves for organic, natural variation (from SteadyWatch)
        // Base octave: Primary variation (slow, large-scale)
        const baseOctave = this.perlin1D(time * frequency * 0.5) * 0.6;
        
        // Detail octave: Fine detail (medium frequency)
        const detailOctave = this.perlin1D(time * frequency * 2.0) * 0.25;
        
        // Micro octave: Subtle texture (high frequency)
        const microOctave = this.perlin1D(time * frequency * 4.0) * 0.15;
        
        // Combine octaves for layered complexity
        const combined = baseOctave + detailOctave + microOctave;
        
        // Clamp to ±1.0 range
        return Math.max(-1.0, Math.min(1.0, combined));
    }

        smoothNoiseWithTime(rawNoise, currentTime, lastUpdateTime, previousSmoothed, timeConstant) {
        // Time-based exponential smoothing (from SteadyWatch)
        const deltaTime = currentTime - lastUpdateTime;
        const alpha = Math.min(1.0, deltaTime / timeConstant);
        return alpha * rawNoise + (1.0 - alpha) * previousSmoothed;
    }

    // ============================================
    // ECHO BILATERAL SHADOWING (45-degree light)
    // ============================================

        calculateLightingFactor(rotationAngle) {
        // Cosine-based lighting (from SteadyWatch)
        // Cosine(0°) = 1.0 (facing user): maximum glow, shadow, sharpness
        // Cosine(180°) = -1.0 (away from user): minimum glow, shadow, sharpness
        // Normalize cosine from [-1, 1] to [0, 1] for lighting factor
        return (Math.cos(rotationAngle) + 1.0) / 2.0;
    }

        calculateBilateralShadowOffset(waveYOffset, lightAngleDegrees = 45.0) {
        // Bilateral shadow calculation (from SteadyWatch)
        // For 45°: tan(45°) = 1.0, so shadow extends equally in X and Y
        const lightAngleRadians = lightAngleDegrees * Math.PI / 180.0;
        return Math.abs(waveYOffset) * Math.tan(lightAngleRadians);
    }

    // ============================================
    // TESLA 3-6-9 PATTERN APPLICATION
    // ============================================

        applyTeslaPattern(value, qubitIndex) {
        // Tesla 3-6-9 pattern: Apply harmonic multipliers based on qubit index
        const teslaGroup = qubitIndex % 3;
        let multiplier = this.teslaMultipliers.base;
        
        if (teslaGroup === 0) {
            // Group 0: Base frequency (3, 6, 9, 12)
            multiplier = this.teslaMultipliers.base;
        } else if (teslaGroup === 1) {
            // Group 1: 1/3 harmonic (1, 4, 7, 10)
            multiplier = this.teslaMultipliers.harmonic3;
        } else {
            // Group 2: 1/6 harmonic (2, 5, 8, 11)
            multiplier = this.teslaMultipliers.harmonic6;
        }
        
        return value * multiplier;
    }

    // ============================================
    // UNIFIED STYLING CALCULATION
    // All qubits share the same math
    // ============================================

        calculateUnifiedStyle(qubitIndex, time, rotationAngle, basePosition) {
        // 1. Generate Perlin noise (organic variation)
        const noiseFrequency = 0.25; // 4 second cycle (from SteadyWatch)
        const rawNoise = this.generateNoise(time, noiseFrequency);
        
        // 2. Smooth noise with time-based exponential smoothing
        const currentTime = time;
        const lastUpdate = this.noiseState.lastNoiseUpdateTime || currentTime;
        const smoothedNoise = this.smoothNoiseWithTime(
            rawNoise,
            currentTime,
            lastUpdate,
            this.noiseState.smoothedNoiseValue,
            this.noiseState.noiseSmoothingTimeConstant
        );
        this.noiseState.smoothedNoiseValue = smoothedNoise;
        this.noiseState.lastNoiseUpdateTime = currentTime;
        
        // 3. Apply noise factor (±5% variation from SteadyWatch)
        const noiseFactor = 1.0 + (smoothedNoise * 0.05);
        
        // 4. Calculate lighting factor (rotation-based)
        const lightingFactor = this.calculateLightingFactor(rotationAngle);
        
        // 5. Calculate ECHO shadow parameters
        const waveYOffset = basePosition.y; // Use qubit's Y position as wave offset
        const bilateralShadowXOffset = this.calculateBilateralShadowOffset(waveYOffset);
        
        // 6. Apply Tesla pattern to frequency/phase
        const teslaPhase = this.applyTeslaPattern(rotationAngle, qubitIndex);
        
        // 7. Calculate unified glow intensity (from SteadyWatch formula)
        const glowIntensity = (this.shadowParams.baseGlowIntensity + 
                              (lightingFactor * this.shadowParams.glowIntensityRange)) * noiseFactor;
        
        // 8. Calculate unified shadow radius
        const shadowRadius = ((this.shadowParams.baseShadowRadius + 
                              (lightingFactor * this.shadowParams.shadowRadiusRange)) * 
                              this.shadowParams.shadowTightnessFactor || 1.0) * noiseFactor;
        
        // 9. Calculate unified shadow intensity
        const shadowIntensity = (this.shadowParams.baseShadowIntensity + 
                               (lightingFactor * this.shadowParams.shadowIntensityRange)) * noiseFactor;
        
        // 10. Calculate blur radius (inverted relationship)
        const blurRadius = (0.3 + ((1.0 - lightingFactor) * 0.9)) / noiseFactor;
        
        // Return unified style object
        return {
            // Perlin noise values
            noiseFactor: noiseFactor,
            smoothedNoise: smoothedNoise,
            
            // ECHO shadowing
            glowIntensity: Math.max(0.12, Math.min(0.3, glowIntensity)),
            shadowRadius: Math.max(1.5, Math.min(5.0, shadowRadius)),
            shadowIntensity: Math.max(0.5, Math.min(0.85, shadowIntensity)),
            blurRadius: Math.max(0.3, Math.min(1.2, blurRadius)),
            bilateralShadowXOffset: bilateralShadowXOffset,
            
            // Lighting
            lightingFactor: lightingFactor,
            
            // Tesla pattern
            teslaPhase: teslaPhase,
            teslaMultiplier: this.applyTeslaPattern(1.0, qubitIndex)
        };
    }
} // end styling class;
    
// ============================================
// EAVESDROPPER DETECTION SYSTEM
// ============================================
class EavesdropperDetector {
    constructor(scene, qubits, camera, renderer, connections) {
        this.scene = scene;
        this.qubits = qubits;
        this.camera = camera;
        this.renderer = renderer;
        this.connections = connections;
        this.laserBeam = null;
        this.isFiring = false;
        this.detectionCount = 0;
        this.originalQubitStates = [];
        // Store original qubit states for reset
        this.qubits.forEach(qubit => {
            this.originalQubitStates.push({
                position: qubit.position.clone(),
                materialColor: qubit.material.color.clone()
            });
        });
        
        this.setupLaser();
        this.setupButton();
        this.setupKeyboard();
        
    }
    
    setupLaser() {
        const laserGeometry = new THREE.BufferGeometry();
        const laserMaterial = new THREE.LineBasicMaterial({
            color: 0xff4757,
            transparent: true,
            opacity: 0.9
        });
        
        const points = [
            new THREE.Vector3(0, -5, 0),
            new THREE.Vector3(0, 5, 0)
        ];
        laserGeometry.setFromPoints(points);
        
        this.laserBeam = new THREE.Line(laserGeometry, laserMaterial);
        this.laserBeam.visible = false;
        this.scene.add(this.laserBeam);
    }
    
    setupButton() {
        const btn = document.getElementById('eavesdropperBtn');
        if (!btn) {
            console.warn('Eavesdropper button not found. Make sure you have: <button id="eavesdropperBtn">');
            return;
        }
        
        btn.addEventListener('click', () => {
            if (this.isFiring) return;
            this.fireLaser();
        });
    }

    setupKeyboard() {
    // Add keyboard event listener for "F" key (easter egg / quick key)
    document.addEventListener('keydown', (event) => {
        // Check if "F" key is pressed (case-insensitive)
        if (event.key.toLowerCase() === 'f' && !this.isFiring) {
            // Prevent default behavior (like browser search)
            event.preventDefault();
            // Fire the eavesdropper detection
            this.fireLaser();
        }
    });
}
    
    fireLaser() {
        if (this.isFiring) return;
        this.isFiring = true;
        
        const btn = document.getElementById('eavesdropperBtn');
        const statusDiv = document.getElementById('detectionStatus');
        
        if (btn) btn.disabled = true;
        
        const targetQubitIndex = Math.floor(Math.random() * this.qubits.length);
        const targetQubit = this.qubits[targetQubitIndex];
        
        const targetPosition = targetQubit.position.clone();
        this.laserBeam.position.copy(targetPosition);
        this.laserBeam.position.y = -10;
        this.laserBeam.visible = true;
        
        const startY = -10;
        const endY = targetPosition.y;
        const duration = 500;
        const startTime = Date.now();
        
        const animateLaser = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentY = startY + (endY - startY) * eased;
            
            this.laserBeam.position.y = currentY;
            this.laserBeam.position.x = targetPosition.x;
            this.laserBeam.position.z = targetPosition.z;
            
            if (progress < 1) {
                requestAnimationFrame(animateLaser);
            } else {
                this.detectEavesdropper(targetQubit, targetQubitIndex);
            }
        };
        
        animateLaser();
    }
    
    detectEavesdropper(targetQubit, qubitIndex) {
        const statusDiv = document.getElementById('detectionStatus');
        
        this.laserBeam.visible = false;
        
        if (statusDiv) {
            statusDiv.textContent = '🚨 EAVESDROPPER DETECTED! 🚨';
            statusDiv.className = 'detection-status show detected';
            
            setTimeout(() => {
                statusDiv.className = 'detection-status';
            }, 2000);
        }
        
        // Visualize state collapse - all qubits turn red and stop animating
        this.qubits.forEach((qubit) => {
            qubit.material.color.setHex(0xff4757);
            qubit.material.emissive.setHex(0xff4757);
        });
        
        // Flash all connections red
        this.connections.forEach(connection => {
            connection.material.color.setHex(0xff4757);
            connection.material.opacity = 1;
        });
        
        this.detectionCount++;
        
        setTimeout(() => {
            this.resetState();
        }, 3000);
    }
    
    resetState() {
        const btn = document.getElementById('eavesdropperBtn');
        
        // Reset qubit colors
        this.qubits.forEach((qubit, index) => {
            const original = this.originalQubitStates[index];
            if (original && qubit.material) {
                qubit.material.color.copy(original.materialColor);
                // Restore original color variation
                const hue = (Date.now() * 0.0001 + index * 0.1) % 1;
                qubit.material.emissive.setHSL(hue, 0.7, 0.3);
            }
        });
        
        // Reset connection colors
        this.connections.forEach(connection => {
            if (connection.material) {
                connection.material.color.setHex(0x667eea);
                connection.material.opacity = 0.3;
            }
        });
        
        if (btn) btn.disabled = false;
        this.isFiring = false;
    }
}

// ============================================
// GHZ 12-QUBIT ENTANGLEMENT VISUALIZATION
// ============================================
function initGHZVisualization(containerId) {

// ============================================
// INTEGRATION INTO GHZ VISUALIZATION
// ============================================

// Create unified styling instance (shared across all qubits)

const unifiedStyling = new UnifiedQubitStyling();


    const container = document.getElementById(containerId);
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.Fog(0x0a0a1a, 50, 200);

    const width = container.clientWidth;
    const height = container.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 15, 25);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 50;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x667eea, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x667eea, 1, 100);
    pointLight1.position.set(20, 20, 20);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x764ba2, 0.8, 100);
    pointLight2.position.set(-20, 20, -20);
    scene.add(pointLight2);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(0, 30, 0);
    scene.add(directionalLight);

    // Qubit geometry and materials
    const qubitGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const qubitMaterial = new THREE.MeshPhongMaterial({
        color: 0x667eea,
        emissive: 0x667eea,
        emissiveIntensity: 0.3,
        shininess: 100,
        transparent: true,
        opacity: 0.9
    });

    const qubitGlowMaterial = new THREE.MeshPhongMaterial({
        color: 0x764ba2,
        emissive: 0x764ba2,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.3
    });

    // Create 12 qubits in a SPHERICAL arrangement
    const qubits = [];
    const qubitCount = 12;
    const radius = 8;
    const qubitGroup = new THREE.Group();

    // Spherical distribution algorithm (Fibonacci sphere or golden angle)
    // This creates evenly distributed points on a sphere
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle in radians
    
    for (let i = 0; i < qubitCount; i++) {
        // Use golden angle spiral for even distribution
        const y = 1 - (i / (qubitCount - 1)) * 2; // y goes from 1 to -1
        const radius_at_y = Math.sqrt(1 - y * y); // radius at y
        
        const theta = goldenAngle * i; // Golden angle rotation
        
        const x = Math.cos(theta) * radius_at_y;
        const z = Math.sin(theta) * radius_at_y;
        
        // Scale to desired radius
        const finalX = x * radius;
        const finalY = y * radius * 0.8; // Slightly flatten vertical axis
        const finalZ = z * radius;

        // Main qubit sphere
        const qubit = new THREE.Mesh(qubitGeometry, qubitMaterial.clone());
        qubit.position.set(finalX, finalY, finalZ);
        qubit.userData.index = i;
        qubit.userData.basePosition = new THREE.Vector3(finalX, finalY, finalZ);
        qubits.push(qubit);
        qubitGroup.add(qubit);

        // Glow effect
        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 32, 32),
            qubitGlowMaterial.clone()
        );
        glow.position.set(finalX, finalY, finalZ);
        qubitGroup.add(glow);
    }

    scene.add(qubitGroup);

    // Create entanglement connections (all-to-all for GHZ state)
    const connections = [];
    const connectionGroup = new THREE.Group();
    const connectionMaterial = new THREE.LineBasicMaterial({
        color: 0x667eea,
        transparent: true,
        opacity: 0.3
    });

    for (let i = 0; i < qubitCount; i++) {
        for (let j = i + 1; j < qubitCount; j++) {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(6);
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const line = new THREE.Line(geometry, connectionMaterial.clone());
            line.userData.qubit1 = i;
            line.userData.qubit2 = j;
            connections.push(line);
            connectionGroup.add(line);
        }
    }

    scene.add(connectionGroup);

    function updateConnections() {
        connections.forEach(connection => {
            const i = connection.userData.qubit1;
            const j = connection.userData.qubit2;
            const pos1 = qubits[i].position;
            const pos2 = qubits[j].position;
            
            const positions = connection.geometry.attributes.position.array;
            positions[0] = pos1.x;
            positions[1] = pos1.y;
            positions[2] = pos1.z;
            positions[3] = pos2.x;
            positions[4] = pos2.y;
            positions[5] = pos2.z;
            connection.geometry.attributes.position.needsUpdate = true;
        });
    }

    let animationRunning = true;
    let time = 0;

    function animate() {
        requestAnimationFrame(animate);
        time += 0.02;

         if (animationRunning) {
            // Animate qubits with quantum state fluctuations
            // Keep them orbiting around their base positions in a spherical pattern

            qubits.forEach((qubit, index) => {
                const basePos = qubit.userData.basePosition;
                const phase = (index / qubitCount) * Math.PI * 2;
                const rotationAngle = time + phase;
                
                // Calculate unified style (Perlin Noise + ECHO Shadowing + Tesla Patterns)
                const style = unifiedStyling.calculateUnifiedStyle(index, time, rotationAngle, basePos);
                
                // Apply position offsets using Tesla phase and noise factor
                const amplitude = 0.3 * style.noiseFactor;
                const radialOffset = Math.sin(style.teslaPhase) * amplitude;
                const thetaOffset = Math.cos(style.teslaPhase * 1.5) * amplitude;
                
                // Apply bilateral shadow offset for ECHO shadowing effect
                qubit.position.x = basePos.x + radialOffset * Math.cos(phase) + style.bilateralShadowXOffset * 0.1;
                qubit.position.y = basePos.y + thetaOffset;
                qubit.position.z = basePos.z + radialOffset * Math.sin(phase);

                // Pulse effect using glow intensity (inverse relationship - higher glow = larger scale)
                const baseScale = 1.0;
                const scaleVariation = (style.glowIntensity - 0.15) * 2.0; // Map glow [0.12-0.3] to scale variation
                const scale = baseScale + scaleVariation * 0.1;
                qubit.scale.set(scale, scale, scale);

                // Color variation based on lighting factor and glow intensity
                // Use lighting factor to modulate hue, glow intensity for saturation/lightness
                const hue = (time * 0.1 + index * 0.1 + style.lightingFactor * 0.2) % 1;
                const saturation = 0.7 * (0.8 + style.glowIntensity * 0.4); // 0.7 * [0.8-1.0]
                const lightness = 0.6 * (0.9 + style.lightingFactor * 0.2); // 0.6 * [0.9-1.1]
                qubit.material.color.setHSL(hue, saturation, lightness);
                
                // Emissive uses glow intensity directly
                const emissiveHue = (time * 0.1 + index * 0.1) % 1;
                const emissiveSaturation = 0.7;
                const emissiveLightness = style.glowIntensity * 2.0; // Map glow [0.12-0.3] to emissive [0.24-0.6]
                qubit.material.emissive.setHSL(emissiveHue, emissiveSaturation, emissiveLightness);
            });
            
  // Animate connections using unified styling
            connections.forEach((connection, index) => {
                // Calculate unified style for this connection
                // Use connection index and time for styling calculation
                const phase = (index / connections.length) * Math.PI * 2;
                const rotationAngle = time + phase;
                
                // Use average position of the two connected qubits as base position
                const qubit1Index = connection.userData.qubit1;
                const qubit2Index = connection.userData.qubit2;
                const qubit1Pos = qubits[qubit1Index].position;
                const qubit2Pos = qubits[qubit2Index].position;
                const avgPosition = new THREE.Vector3(
                    (qubit1Pos.x + qubit2Pos.x) / 2,
                    (qubit1Pos.y + qubit2Pos.y) / 2,
                    (qubit1Pos.z + qubit2Pos.z) / 2
                );
                
                // Calculate unified style
                const style = unifiedStyling.calculateUnifiedStyle(index, time, rotationAngle, avgPosition);
                
                // Apply opacity using glow intensity (higher glow = more visible connection)
                const baseOpacity = 0.2;
                const opacityVariation = style.glowIntensity * 2.0; // Map glow [0.12-0.3] to opacity variation
                const opacity = Math.max(0.1, Math.min(0.6, baseOpacity + opacityVariation));
                connection.material.opacity = opacity;
                
                // Apply color variation based on lighting factor and Tesla pattern
                const hue = (time * 0.05 + index * 0.05 + style.lightingFactor * 0.1) % 1;
                const saturation = 0.7 * (0.8 + style.glowIntensity * 0.4);
                const lightness = 0.5 * (0.9 + style.lightingFactor * 0.2);
                connection.material.color.setHSL(hue, saturation, lightness);
            });

            updateConnections();
        }

        controls.update();
        renderer.render(scene, camera);
    }

    // Handle window resize
    function handleResize() {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight || 600;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    }

    window.addEventListener('resize', handleResize);

    // Initial connection update
    updateConnections();

    // ============================================
    // INITIALIZE EAVESDROPPER DETECTION
    // ============================================
    let eavesdropperDetector;
    eavesdropperDetector = new EavesdropperDetector(scene, qubits, camera, renderer, connections);
    // ============================================

    // Start animation
    animate();

    Return controls for external use
    return {
        toggleAnimation: () => {
            animationRunning = !animationRunning;
        },
        resetView: () => {
            camera.position.set(0, 15, 25);
            camera.lookAt(0, 0, 0);
            controls.reset();
        }
    };
}

    
}

