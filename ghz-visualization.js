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
