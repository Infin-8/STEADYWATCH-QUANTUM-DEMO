// ============================================
// EAVESDROPPER DETECTION SYSTEM
// ============================================
class EavesdropperDetector {
    constructor(scene, qubits, camera, renderer, connections) {
        console.log('🔍 EavesdropperDetector: Constructor called');
        this.scene = scene;
        this.qubits = qubits;
        this.camera = camera;
        this.renderer = renderer;
        this.connections = connections;
        this.laserBeam = null;
        this.isFiring = false;
        this.detectionCount = 0;
        this.originalQubitStates = [];
        
        console.log('🔍 Qubits count:', this.qubits.length);
        console.log('🔍 Connections count:', this.connections.length);
        
        // Store original qubit states for reset
        this.qubits.forEach(qubit => {
            this.originalQubitStates.push({
                position: qubit.position.clone(),
                materialColor: qubit.material.color.clone()
            });
        });
        
        this.setupLaser();
        this.setupButton();
    }
    
    setupLaser() {
        console.log('🔍 Setting up laser...');
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
        console.log('🔍 Laser beam created and added to scene');
    }
    
    setupButton() {
        console.log('🔍 Setting up button...');
        const btn = document.getElementById('eavesdropperBtn');
        console.log('🔍 Button element:', btn);
        
        if (!btn) {
            console.error('❌ Button with id "eavesdropperBtn" not found!');
            console.log('💡 Make sure you have this in your HTML:');
            console.log('   <button id="eavesdropperBtn" class="control-btn eavesdropper-btn">🔍 Fire Eavesdropper Laser</button>');
            return;
        }
        
        console.log('✅ Button found!');
        btn.addEventListener('click', (e) => {
            console.log('🔍 Button clicked!', e);
            if (this.isFiring) {
                console.log('⚠️ Already firing, ignoring click');
                return;
            }
            console.log('🔍 Calling fireLaser()...');
            this.fireLaser();
        });
        console.log('✅ Event listener attached');
    }
    
    fireLaser() {
        console.log('🔍 fireLaser() called');
        if (this.isFiring) {
            console.log('⚠️ Already firing');
            return;
        }
        this.isFiring = true;
        console.log('🔍 isFiring set to true');
        
        const btn = document.getElementById('eavesdropperBtn');
        const statusDiv = document.getElementById('detectionStatus');
        
        if (btn) {
            btn.disabled = true;
            console.log('🔍 Button disabled');
        }
        
        const targetQubitIndex = Math.floor(Math.random() * this.qubits.length);
        const targetQubit = this.qubits[targetQubitIndex];
        console.log('🔍 Target qubit index:', targetQubitIndex);
        
        const targetPosition = targetQubit.position.clone();
        this.laserBeam.position.copy(targetPosition);
        this.laserBeam.position.y = -10;
        this.laserBeam.visible = true;
        console.log('🔍 Laser beam positioned and made visible');
        
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
                console.log('🔍 Laser reached target, detecting eavesdropper...');
                this.detectEavesdropper(targetQubit, targetQubitIndex);
            }
        };
        
        animateLaser();
    }
    
    detectEavesdropper(targetQubit, qubitIndex) {
        console.log('🔍 detectEavesdropper() called');
        const statusDiv = document.getElementById('detectionStatus');
        
        this.laserBeam.visible = false;
        
        if (statusDiv) {
            statusDiv.textContent = '🚨 EAVESDROPPER DETECTED! 🚨';
            statusDiv.className = 'detection-status show detected';
            console.log('🔍 Detection status updated');
            
            setTimeout(() => {
                statusDiv.className = 'detection-status';
            }, 2000);
        } else {
            console.warn('⚠️ Detection status div not found');
        }
        
        // Visualize state collapse - all qubits turn red and stop animating
        this.qubits.forEach((qubit) => {
            qubit.material.color.setHex(0xff4757);
            qubit.material.emissive.setHex(0xff4757);
            if (qubit.userData) {
                qubit.userData.originalRotationSpeed = qubit.userData.rotationSpeed || 0.01;
                qubit.userData.rotationSpeed = 0;
            }
        });
        console.log('🔍 All qubits turned red');
        
        // Flash all connections red
        this.connections.forEach(connection => {
            connection.material.color.setHex(0xff4757);
            connection.material.opacity = 1;
        });
        console.log('🔍 All connections turned red');
        
        this.detectionCount++;
        
        setTimeout(() => {
            console.log('🔍 Resetting state...');
            this.resetState();
        }, 3000);
    }
    
    resetState() {
        console.log('🔍 resetState() called');
        const btn = document.getElementById('eavesdropperBtn');
        
        // Reset qubit colors
        this.qubits.forEach((qubit, index) => {
            const original = this.originalQubitStates[index];
            if (original && qubit.material) {
                qubit.material.color.copy(original.materialColor);
                qubit.material.emissive.setHSL((index / this.qubits.length) % 1, 0.7, 0.3);
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
        console.log('🔍 State reset complete');
    }
}




function initGHZVisualization(containerId) {
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

    // Initial connection update
    updateConnections();

    // ============================================
    // INITIALIZE EAVESDROPPER DETECTION
    // ============================================
    console.log('🔍 Initializing eavesdropper detector...');
    console.log('🔍 Scene:', scene);
    console.log('🔍 Qubits:', qubits);
    console.log('🔍 Connections:', connections);
    
    let eavesdropperDetector;
    eavesdropperDetector = new EavesdropperDetector(scene, qubits, camera, renderer, connections);
    
    console.log('🔍 Eavesdropper detector initialized:', eavesdropperDetector);
    // ============================================

    // Start animation
    animate();

    function animate() {
        requestAnimationFrame(animate);
        time += 0.02;

        if (animationRunning) {
            // Animate qubits with quantum state fluctuations
            // Keep them orbiting around their base positions in a spherical pattern
            qubits.forEach((qubit, index) => {
                const basePos = qubit.userData.basePosition;
                const phase = (index / qubitCount) * Math.PI * 2;
                const amplitude = 0.3;
                
                // Spherical oscillation - maintain spherical shape while animating
                const radialOffset = Math.sin(time + phase) * amplitude;
                const thetaOffset = Math.cos(time * 1.5 + phase) * amplitude;
                const phiOffset = Math.sin(time * 0.8 + phase) * amplitude;
                
                // Apply offsets while maintaining spherical structure
                qubit.position.x = basePos.x + radialOffset * Math.cos(phase);
                qubit.position.y = basePos.y + thetaOffset;
                qubit.position.z = basePos.z + radialOffset * Math.sin(phase);

                // Pulse effect
                const scale = 1 + Math.sin(time * 2 + phase) * 0.1;
                qubit.scale.set(scale, scale, scale);

                // Color variation based on quantum state
                const hue = (time * 0.1 + index * 0.1) % 1;
                qubit.material.color.setHSL(hue, 0.7, 0.6);
                qubit.material.emissive.setHSL(hue, 0.7, 0.3);
            });

            // Animate connections
            connections.forEach((connection, index) => {
                const opacity = 0.2 + Math.sin(time + index * 0.1) * 0.2;
                connection.material.opacity = Math.max(0.1, opacity);
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

    // Start animation
    animate();

    // Return controls for external use
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
