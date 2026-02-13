// ============================================
// 144 SATELLITES VISUALIZATION
// Hurwitz Quaternion Satellite Architecture
// Prime p=5 → 144 Satellites
// ============================================

// ============================================
// UNIFIED STYLING SYSTEM
// Shared math for all satellites - Perlin Noise + ECHO Shadowing + Tesla Patterns
// ============================================

class UnifiedQubitStyling {
    constructor() {
        // Perlin Noise state (from STEADYWATCH™ HANDHELD)
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
    // PERLIN NOISE (from STEADYWATCH™ HANDHELD AtomicClockView.swift)
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
        // 5th order polynomial smoothstep (from STEADYWATCH™ HANDHELD)
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
        // Multiple octaves for organic, natural variation (from STEADYWATCH™ HANDHELD)
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
        // Time-based exponential smoothing (from STEADYWATCH™ HANDHELD)
        const deltaTime = currentTime - lastUpdateTime;
        const alpha = Math.min(1.0, deltaTime / timeConstant);
        return alpha * rawNoise + (1.0 - alpha) * previousSmoothed;
    }

    // ============================================
    // ECHO BILATERAL SHADOWING (45-degree light)
    // ============================================

    calculateLightingFactor(rotationAngle) {
        // Cosine-based lighting (from STEADYWATCH™ HANDHELD)
        // Cosine(0°) = 1.0 (facing user): maximum glow, shadow, sharpness
        // Cosine(180°) = -1.0 (away from user): minimum glow, shadow, sharpness
        // Normalize cosine from [-1, 1] to [0, 1] for lighting factor
        return (Math.cos(rotationAngle) + 1.0) / 2.0;
    }

    calculateBilateralShadowOffset(waveYOffset, lightAngleDegrees = 45.0) {
        // Bilateral shadow calculation (from STEADYWATCH™ HANDHELD)
        // For 45°: tan(45°) = 1.0, so shadow extends equally in X and Y
        const lightAngleRadians = lightAngleDegrees * Math.PI / 180.0;
        return Math.abs(waveYOffset) * Math.tan(lightAngleRadians);
    }

    // ============================================
    // TESLA 3-6-9 PATTERN APPLICATION
    // ============================================

    applyTeslaPattern(value, satelliteIndex) {
        // Tesla 3-6-9 pattern: Apply harmonic multipliers based on satellite index
        const teslaGroup = satelliteIndex % 3;
        let multiplier = this.teslaMultipliers.base;
        
        if (teslaGroup === 0) {
            // Group 0: Base frequency (3, 6, 9, 12, ...)
            multiplier = this.teslaMultipliers.base;
        } else if (teslaGroup === 1) {
            // Group 1: 1/3 harmonic (1, 4, 7, 10, ...)
            multiplier = this.teslaMultipliers.harmonic3;
        } else {
            // Group 2: 1/6 harmonic (2, 5, 8, 11, ...)
            multiplier = this.teslaMultipliers.harmonic6;
        }
        
        return value * multiplier;
    }

    // ============================================
    // UNIFIED STYLING CALCULATION
    // All satellites share the same math
    // ============================================

    calculateUnifiedStyle(satelliteIndex, time, rotationAngle, basePosition) {
        // 1. Generate Perlin noise (organic variation)
        const noiseFrequency = 0.25; // 4 second cycle (from STEADYWATCH™ HANDHELD)
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
        
        // 3. Apply noise factor (±5% variation from STEADYWATCH™ HANDHELD)
        const noiseFactor = 1.0 + (smoothedNoise * 0.05);
        
        // 4. Calculate lighting factor (rotation-based)
        const lightingFactor = this.calculateLightingFactor(rotationAngle);
        
        // 5. Calculate ECHO shadow parameters
        const waveYOffset = basePosition.y; // Use satellite's Y position as wave offset
        const bilateralShadowXOffset = this.calculateBilateralShadowOffset(waveYOffset);
        
        // 6. Apply Tesla pattern to frequency/phase
        const teslaPhase = this.applyTeslaPattern(rotationAngle, satelliteIndex);
        
        // 7. Calculate unified glow intensity (from STEADYWATCH™ HANDHELD formula)
        const glowIntensity = (this.shadowParams.baseGlowIntensity + 
                              (lightingFactor * this.shadowParams.glowIntensityRange)) * noiseFactor;
        
        // 8. Calculate unified shadow radius
        const shadowRadius = ((this.shadowParams.baseShadowRadius + 
                              (lightingFactor * this.shadowParams.shadowRadiusRange)) * 
                              (this.shadowParams.shadowTightnessFactor || 1.0)) * noiseFactor;
        
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
            teslaMultiplier: this.applyTeslaPattern(1.0, satelliteIndex)
        };
    }
}

/**
 * 4D-to-3D Projection for Hurwitz Quaternions
 * Projects 4D coordinates (a, b, c, d) to 3D (x, y, z)
 */
function project4Dto3D(a, b, c, d, radius = 10) {
    // Option 1: Stereographic projection
    // Map 4D point to 3D using stereographic projection
    const w = d; // 4th dimension
    const scale = radius / (1 + Math.abs(w) * 0.1); // Scale factor
    
    return {
        x: a * scale,
        y: b * scale,
        z: c * scale,
        w: w // Store w for color mapping
    };
}

/**
 * Generate 144 satellite positions using golden angle spiral
 * (Fallback method - ensures even distribution)
 */
function generateSatellitePositions(count = 144, radius = 10) {
    const positions = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle in radians
    
    for (let i = 0; i < count; i++) {
        // Use golden angle spiral for even distribution on sphere
        const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
        const radius_at_y = Math.sqrt(1 - y * y); // radius at y
        
        const theta = goldenAngle * i; // Golden angle rotation
        
        const x = Math.cos(theta) * radius_at_y;
        const z = Math.sin(theta) * radius_at_y;
        
        // Scale to desired radius
        const finalX = x * radius;
        const finalY = y * radius * 0.8; // Slightly flatten vertical axis
        const finalZ = z * radius;
        
        positions.push({
            x: finalX,
            y: finalY,
            z: finalZ,
            index: i,
            phase: (i * 2 * Math.PI) / count // Satellite-specific phase
        });
    }
    
    return positions;
}

/**
 * Map satellite index to color
 */
function getSatelliteColor(index, total = 144) {
    const hue = (index / total) * 360; // Full color spectrum
    return new THREE.Color().setHSL(hue / 360, 0.8, 0.6);
}

/**
 * Initialize 144 Satellites Visualization
 */
function init144SatellitesVisualization(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // ============================================
    // CREATE UNIFIED STYLING INSTANCE
    // ============================================
    const unifiedStyling = new UnifiedQubitStyling();

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.Fog(0x0a0a1a, 50, 200);

    const width = container.clientWidth;
    const height = container.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 20, 30);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 15;
    controls.maxDistance = 80;

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

    // ============================================
    // CENTRAL SEED (Prime p=5)
    // ============================================
    const seedGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const seedMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd700, // Gold
        emissive: 0xffd700,
        emissiveIntensity: 0.5,
        shininess: 100,
        transparent: true,
        opacity: 0.95
    });
    const seed = new THREE.Mesh(seedGeometry, seedMaterial);
    seed.position.set(0, 0, 0);
    seed.userData.type = 'seed';
    seed.userData.prime = 5;
    scene.add(seed);

    // Seed glow effect
    const seedGlowGeometry = new THREE.SphereGeometry(1.8, 32, 32);
    const seedGlowMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.3
    });
    const seedGlow = new THREE.Mesh(seedGlowGeometry, seedGlowMaterial);
    seedGlow.position.set(0, 0, 0);
    scene.add(seedGlow);

    // ============================================
    // 144 SATELLITES
    // ============================================
    const satellites = [];
    const satelliteGroup = new THREE.Group();
    const satelliteCount = 144;
    const baseRadius = 12;

    // Generate satellite positions
    const satellitePositions = generateSatellitePositions(satelliteCount, baseRadius);

    // Satellite geometry and materials
    const satelliteGeometry = new THREE.SphereGeometry(0.3, 16, 16);

    satellitePositions.forEach((pos, index) => {
        const color = getSatelliteColor(index, satelliteCount);
        
        const satelliteMaterial = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.4,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });

        const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
        satellite.position.set(pos.x, pos.y, pos.z);
        satellite.userData.index = index;
        satellite.userData.basePosition = new THREE.Vector3(pos.x, pos.y, pos.z);
        satellite.userData.phase = pos.phase;
        satellite.userData.expanded = false;
        satellites.push(satellite);
        satelliteGroup.add(satellite);

        // Glow effect for each satellite
        const glowGeometry = new THREE.SphereGeometry(0.45, 16, 16);
        const glowMaterial = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(pos.x, pos.y, pos.z);
        glow.userData.satelliteIndex = index;
        satelliteGroup.add(glow);
    });

    scene.add(satelliteGroup);

    // ============================================
    // CONNECTIONS (Radial lines from seed to satellites)
    // ============================================
    const connections = [];
    const connectionGroup = new THREE.Group();

    satellitePositions.forEach((pos, index) => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(6); // 2 points * 3 coordinates
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const color = getSatelliteColor(index, satelliteCount);
        const connectionMaterial = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.2
        });

        const line = new THREE.Line(geometry, connectionMaterial);
        line.userData.satelliteIndex = index;
        connections.push(line);
        connectionGroup.add(line);
    });

    scene.add(connectionGroup);

    // Update connection lines (kept for compatibility, but use optimized version in animation)
    function updateConnections() {
        connections.forEach((connection, index) => {
            const satellite = satellites[index];
            const pos1 = seed.position; // Seed at origin
            const pos2 = satellite.position;
            
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

    // ============================================
    // ANIMATION STATE
    // ============================================
    let animationRunning = true;
    let time = 0;
    let expansionProgress = 0; // 0 = collapsed, 1 = fully expanded
    let releaseProgress = 0; // 0 = not released, 1 = fully released
    let showConnections = true;
    let expansionSpeed = 0.01;
    let releaseSpeed = 0.015;
    let releaseDistance = 3.0; // How far satellites move when released

    // ============================================
    // EXPANSION ANIMATION
    // ============================================
    function updateExpansion() {
        if (expansionProgress < 1.0) {
            expansionProgress = Math.min(1.0, expansionProgress + expansionSpeed);
        }

        satellites.forEach((satellite, index) => {
            const basePos = satellite.userData.basePosition;
            const collapsedPos = new THREE.Vector3(0, 0, 0); // Start at seed
            const expandedPos = basePos.clone();

            // Interpolate between collapsed and expanded positions
            satellite.position.lerpVectors(collapsedPos, expandedPos, expansionProgress);
            satellite.userData.expanded = expansionProgress >= 1.0;

            // Update glow position
            const glow = satelliteGroup.children.find(child => 
                child.userData.satelliteIndex === index && child !== satellite
            );
            if (glow) {
                glow.position.copy(satellite.position);
            }
        });
    }

    // ============================================
    // RELEASE ANIMATION (Satellites float away like dandelion seeds)
    // ============================================
    function updateRelease() {
        satellites.forEach((satellite, index) => {
            if (!satellite.userData.expanded) return; // Only release if expanded
            
            // Initialize drift velocity when release starts (one-time setup)
            if (!satellite.userData.driftVelocity && releaseProgress > 0) {
                const basePos = satellite.userData.basePosition;
                const direction = basePos.clone();
                const distance = direction.length();
                
                // Calculate base drift direction (radial outward)
                let baseDirection;
                if (distance > 0.001) {
                    baseDirection = direction.normalize();
                } else {
                    // Random direction if at origin
                    baseDirection = new THREE.Vector3(
                        (Math.random() - 0.5) * 2,
                        (Math.random() - 0.5) * 2,
                        (Math.random() - 0.5) * 2
                    ).normalize();
                }
                
                // Add randomness for natural floating motion (like wind)
                const randomOffset = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.6,
                    (Math.random() - 0.5) * 0.6,
                    (Math.random() - 0.5) * 0.6
                );
                
                // Combine base direction with random offset for natural drift
                const driftDirection = baseDirection.clone().add(randomOffset).normalize();
                
                // Each satellite gets its own drift speed (like different seed weights)
                const driftSpeed = 0.3 + (Math.random() * 0.2); // 0.3 to 0.5 speed
                
                // Store drift velocity vector
                satellite.userData.driftVelocity = driftDirection.multiplyScalar(driftSpeed);
                
                // Store initial release position
                satellite.userData.releaseStartPosition = basePos.clone();
                satellite.userData.releaseStartTime = time; // Track when release started
            }
            
            // If released, continuously update position based on drift
            // Continue floating even if releaseProgress is reset (seeds keep floating)
            if (satellite.userData.driftVelocity && satellite.userData.releaseStartTime !== null && satellite.userData.releaseStartTime !== undefined) {
                // Calculate elapsed time since release started
                const elapsedTime = time - satellite.userData.releaseStartTime;
                
                // Only continue if elapsed time is positive (safety check)
                if (elapsedTime >= 0) {
                    // Calculate drift distance based on elapsed time (continuous floating)
                    const driftDistance = elapsedTime * 0.5; // Continuous drift speed
                    
                    // Add continuous floating motion (like wind currents)
                    const floatTime = time * 0.3; // Slower floating motion
                    const floatX = Math.sin(floatTime + index * 0.1) * 0.2;
                    const floatY = Math.cos(floatTime * 1.3 + index * 0.15) * 0.2;
                    const floatZ = Math.sin(floatTime * 0.7 + index * 0.12) * 0.2;
                    const floatOffset = new THREE.Vector3(floatX, floatY, floatZ);
                    
                    // Calculate release position: start position + continuous drift + floating motion
                    const driftOffset = satellite.userData.driftVelocity.clone().multiplyScalar(driftDistance);
                    const releasePos = satellite.userData.releaseStartPosition.clone()
                        .add(driftOffset)
                        .add(floatOffset);
                    
                    satellite.userData.releasePosition = releasePos;
                    satellite.userData.released = true; // Mark as released once drift is initialized
                }
            }
        });
        
        // Continue release progress (for initial animation, but floating continues after)
        if (releaseProgress < 1.0) {
            releaseProgress = Math.min(1.0, releaseProgress + releaseSpeed);
        }
    }

    // ============================================
    // ORBITAL AND PHASE ANIMATION
    // ============================================
    function updateSatelliteAnimation() {
        satellites.forEach((satellite, index) => {
            if (!satellite.userData.expanded) return;

            // Get the base position for orbital motion
            // If released, use release position; otherwise use expanded position
            const basePos = satellite.userData.basePosition;
            const phase = satellite.userData.phase;
            
            // Calculate target position (expanded or released)
            let targetPos;
            if (satellite.userData.releasePosition) {
                targetPos = satellite.userData.releasePosition.clone();
            } else {
                targetPos = basePos.clone();
            }
            
            // Calculate unified style for satellite
            const rotationAngle = time + phase;
            const style = unifiedStyling.calculateUnifiedStyle(index, time, rotationAngle, basePos);
            
            // Orbital motion (small circular motion around expanded position)
            // Apply Tesla pattern to orbital motion
            const orbitRadius = 0.3 * style.teslaMultiplier;
            const orbitSpeed = 0.5 * style.teslaMultiplier;
            const orbitX = Math.cos(time * orbitSpeed + style.teslaPhase) * orbitRadius;
            const orbitY = Math.sin(time * orbitSpeed * 1.3 + style.teslaPhase) * orbitRadius;
            const orbitZ = Math.cos(time * orbitSpeed * 0.7 + style.teslaPhase) * orbitRadius;

            // Apply orbital motion on top of target position (expanded or released) with noise factor
            satellite.position.set(
                targetPos.x + orbitX * style.noiseFactor,
                targetPos.y + orbitY * style.noiseFactor,
                targetPos.z + orbitZ * style.noiseFactor
            );

            // Apply unified styling to satellite material
            // Only update if not hovered (hover effect overrides)
            if (hoveredSatellite !== satellite) {
                // Use unified glow intensity
                satellite.material.emissiveIntensity = 0.4 + style.glowIntensity * 0.3;
                
                // Apply color variation based on unified style
                const hue = (time * 0.1 + index * 0.1 + style.lightingFactor * 0.2) % 1;
                const saturation = 0.7 * (0.8 + style.glowIntensity * 0.4);
                const lightness = 0.6 * (0.9 + style.lightingFactor * 0.2);
                satellite.material.color.setHSL(hue, saturation, lightness);
                
                // Emissive uses glow intensity directly
                const emissiveHue = (time * 0.1 + index * 0.1) % 1;
                const emissiveSaturation = 0.7;
                const emissiveLightness = style.glowIntensity * 2.0; // Map glow [0.12-0.3] to emissive [0.24-0.6]
                satellite.material.emissive.setHSL(emissiveHue, emissiveSaturation, emissiveLightness);
            }
            
            // Update glow position and intensity
            const glow = satelliteGroup.children.find(child => 
                child.userData.satelliteIndex === index && child !== satellite
            );
            if (glow) {
                glow.position.copy(satellite.position);
                glow.material.emissiveIntensity = 0.2 + style.glowIntensity * 0.1;
            }
        });

        // Seed pulsing with unified styling
        const seedRotationAngle = time * 1.5;
        const seedBasePos = new THREE.Vector3(0, 0, 0);
        const seedStyle = unifiedStyling.calculateUnifiedStyle(0, time, seedRotationAngle, seedBasePos);
        seed.material.emissiveIntensity = 0.5 + seedStyle.glowIntensity * 0.3;
        seedGlow.material.emissiveIntensity = 0.3 + seedStyle.glowIntensity * 0.2;
    }

    // ============================================
    // HOVER EFFECTS AND TOOLTIPS
    // ============================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredSatellite = null;
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
        position: absolute;
        background: rgba(102, 126, 234, 0.95);
        color: white;
        padding: 10px 15px;
        border-radius: 8px;
        pointer-events: none;
        z-index: 1000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: none;
        max-width: 250px;
    `;
    document.body.appendChild(tooltip);

    function onMouseMove(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(satellites, false);

        if (intersects.length > 0) {
            const intersected = intersects[0].object;
            if (hoveredSatellite !== intersected) {
                hoveredSatellite = intersected;
                
                // Highlight satellite
                intersected.material.emissiveIntensity = 1.0;
                intersected.scale.set(1.5, 1.5, 1.5);
                
                // Show tooltip
                const index = intersected.userData.index;
                const phase = intersected.userData.phase;
                tooltip.innerHTML = `
                    <strong>Satellite ${index}</strong><br>
                    Phase: ${(phase * 180 / Math.PI).toFixed(1)}°<br>
                    Position: (${intersected.position.x.toFixed(2)}, ${intersected.position.y.toFixed(2)}, ${intersected.position.z.toFixed(2)})
                `;
                tooltip.style.display = 'block';
                tooltip.style.left = (event.clientX + 10) + 'px';
                tooltip.style.top = (event.clientY - 10) + 'px';
            }
        } else {
            if (hoveredSatellite) {
                // Reset satellite
                hoveredSatellite.material.emissiveIntensity = 0.4;
                hoveredSatellite.scale.set(1, 1, 1);
                hoveredSatellite = null;
                tooltip.style.display = 'none';
            }
        }
    }

    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // ============================================
    // PERFORMANCE OPTIMIZATION
    // ============================================
    // Only update connections for visible satellites
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4();
    
    function updateConnectionsOptimized() {
        matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(matrix);
        
        connections.forEach((connection, index) => {
            const satellite = satellites[index];
            
            // Only update if satellite is in view frustum
            if (frustum.containsPoint(satellite.position)) {
                const pos1 = seed.position;
                const pos2 = satellite.position;
                
                const positions = connection.geometry.attributes.position.array;
                positions[0] = pos1.x;
                positions[1] = pos1.y;
                positions[2] = pos1.z;
                positions[3] = pos2.x;
                positions[4] = pos2.y;
                positions[5] = pos2.z;
                connection.geometry.attributes.position.needsUpdate = true;
                
                // Apply unified styling to connections
                const phase = (index / connections.length) * Math.PI * 2;
                const rotationAngle = time + phase;
                
                // Use average position of seed and satellite as base position
                const avgPosition = new THREE.Vector3(
                    (pos1.x + pos2.x) / 2,
                    (pos1.y + pos2.y) / 2,
                    (pos1.z + pos2.z) / 2
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
            }
        });
    }

    // ============================================
    // ANIMATION LOOP
    // ============================================
    function animate() {
        requestAnimationFrame(animate);
        time += 0.02;

        if (animationRunning) {
            updateExpansion();
            updateRelease();
            updateSatelliteAnimation();
            if (showConnections) {
                // Use optimized connection update
                updateConnectionsOptimized();
            }
        }

        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    // ============================================
    // INTERACTIVE CONTROLS
    // ============================================
    
    // Toggle animation
    const toggleBtn = document.getElementById('toggle-144-animation');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            animationRunning = !animationRunning;
            toggleBtn.textContent = animationRunning ? 'Pause' : 'Play';
        });
    }

    // Reset view
    const resetBtn = document.getElementById('reset-144-view');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            camera.position.set(0, 20, 30);
            camera.lookAt(0, 0, 0);
            controls.reset();
        });
    }

    // Toggle connections
    const toggleConnectionsBtn = document.getElementById('toggle-144-connections');
    if (toggleConnectionsBtn) {
        toggleConnectionsBtn.addEventListener('click', () => {
            showConnections = !showConnections;
            connectionGroup.visible = showConnections;
            toggleConnectionsBtn.textContent = showConnections ? 'Hide Connections' : 'Show Connections';
        });
    }

    // Reset expansion
    const resetExpansionBtn = document.getElementById('reset-144-expansion');
    const resetExpansion = () => {
        expansionProgress = 0;
    };
    
    if (resetExpansionBtn) {
        resetExpansionBtn.addEventListener('click', resetExpansion);
    }
    
    // Release satellites (move away from center)
    const releaseBtn = document.getElementById('release-144-satellites');
    const releaseSatellites = () => {
        // Only release if satellites are expanded
        if (expansionProgress >= 1.0) {
            // Check if any satellite is already released
            const alreadyReleased = satellites.some(s => s.userData.released);
            
            // If already released, reset and restart
            if (alreadyReleased) {
                releaseProgress = 0;
                satellites.forEach(satellite => {
                    satellite.userData.releasePosition = null;
                    satellite.userData.released = false;
                    satellite.userData.driftVelocity = null;
                    satellite.userData.releaseStartPosition = null;
                    satellite.userData.releaseStartTime = null;
                });
            } else {
                // Start release animation (will initialize drift velocities)
                if (releaseProgress === 0) {
                    releaseProgress = 0.001; // Start the release process
                }
            }
        }
    };
    
    if (releaseBtn) {
        releaseBtn.addEventListener('click', releaseSatellites);
    }
    
    // Reset release (bring satellites back)
    const resetReleaseBtn = document.getElementById('reset-144-release');
    const resetRelease = () => {
        releaseProgress = 0;
        // Clear release positions and drift velocities
        satellites.forEach(satellite => {
            satellite.userData.releasePosition = null;
            satellite.userData.released = false;
            satellite.userData.driftVelocity = null;
            satellite.userData.releaseStartPosition = null;
            satellite.userData.releaseStartTime = null;
        });
    };
    
    if (resetReleaseBtn) {
        resetReleaseBtn.addEventListener('click', resetRelease);
    }
    
    // Keyboard shortcut for reset expansion (E key)
    document.addEventListener('keydown', (event) => {
        // Check if "E" key is pressed (case-insensitive)
        if (event.key.toLowerCase() === 'e') {
            // Prevent default behavior
            event.preventDefault();
            // Reset expansion
            resetExpansion();
        }
        // Check if "R" key is pressed for release (but not if it's the resize handler)
        if (event.key.toLowerCase() === 'r' && !event.ctrlKey && !event.metaKey) {
            // Only trigger if not in an input field
            const target = event.target;
            if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                event.preventDefault();
                releaseSatellites();
            }
        }
    });

    // Handle window resize (Ctrl+R or Cmd+R for resize, plain R for release)
    document.addEventListener('keydown', (event) => {
        // Resize handler: Ctrl+R or Cmd+R
        if ((event.ctrlKey || event.metaKey) && (event.key === 'r' || event.key === 'R')) {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight || 600;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight || 600;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });

    // Return visualization object for external control
    return {
        scene,
        camera,
        renderer,
        satellites,
        seed,
        toggleAnimation: () => {
            animationRunning = !animationRunning;
        },
        resetView: () => {
            camera.position.set(0, 20, 30);
            camera.lookAt(0, 0, 0);
            controls.reset();
        },
        resetExpansion: () => {
            expansionProgress = 0;
        },
        releaseSatellites: () => {
            if (expansionProgress >= 1.0) {
                if (releaseProgress >= 1.0) {
                    releaseProgress = 0;
                    satellites.forEach(satellite => {
                        satellite.userData.releasePosition = null;
                        satellite.userData.released = false;
                    });
                }
            }
        },
        resetRelease: () => {
            releaseProgress = 0;
            satellites.forEach(satellite => {
                satellite.userData.releasePosition = null;
                satellite.userData.released = false;
                satellite.userData.driftVelocity = null;
                satellite.userData.releaseStartPosition = null;
                satellite.userData.releaseStartTime = null;
            });
        }
    };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init144SatellitesVisualization('144-satellites-visualization');
    });
} else {
    init144SatellitesVisualization('144-satellites-visualization');
}
