// ============================================
// 144 SATELLITES VISUALIZATION
// Hurwitz Quaternion Satellite Architecture
// Prime p=5 → 144 Satellites
// ============================================

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
    let showConnections = true;
    let expansionSpeed = 0.01;

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
    // ORBITAL AND PHASE ANIMATION
    // ============================================
    function updateSatelliteAnimation() {
        satellites.forEach((satellite, index) => {
            if (!satellite.userData.expanded) return;

            // Get the expanded position (from expansion animation)
            const expandedPos = satellite.position.clone();
            const phase = satellite.userData.phase;
            
            // Orbital motion (small circular motion around expanded position)
            const orbitRadius = 0.3;
            const orbitSpeed = 0.5;
            const orbitX = Math.cos(time * orbitSpeed + phase) * orbitRadius;
            const orbitY = Math.sin(time * orbitSpeed * 1.3 + phase) * orbitRadius;
            const orbitZ = Math.cos(time * orbitSpeed * 0.7 + phase) * orbitRadius;

            // Apply orbital motion on top of expanded position
            satellite.position.set(
                expandedPos.x + orbitX,
                expandedPos.y + orbitY,
                expandedPos.z + orbitZ
            );

            // Phase-based color pulsing
            const pulseIntensity = 0.3 + Math.sin(time * 2 + phase) * 0.2;
            // Only update if not hovered (hover effect overrides)
            if (hoveredSatellite !== satellite) {
                satellite.material.emissiveIntensity = 0.4 + pulseIntensity * 0.3;
            }
            
            // Update glow position and intensity
            const glow = satelliteGroup.children.find(child => 
                child.userData.satelliteIndex === index && child !== satellite
            );
            if (glow) {
                glow.position.copy(satellite.position);
                glow.material.emissiveIntensity = 0.2 + pulseIntensity * 0.1;
            }
        });

        // Seed pulsing
        const seedPulse = 0.5 + Math.sin(time * 1.5) * 0.2;
        seed.material.emissiveIntensity = 0.5 + seedPulse * 0.3;
        seedGlow.material.emissiveIntensity = 0.3 + seedPulse * 0.2;
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
    if (resetExpansionBtn) {
        resetExpansionBtn.addEventListener('click', () => {
            expansionProgress = 0;
        });
    }

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
