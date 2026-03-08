/**
 * Echo Phases Visualization
 * Six phases: Cold open (0), Full (1), Echo (2), GHZ (3), Superimpose (4), Out (5).
 * Single scene; phase changes toggle group visibility.
 */

function generateSatellitePositions(count, radius) {
    const positions = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const radius_at_y = Math.sqrt(1 - y * y);
        const theta = goldenAngle * i;
        const x = Math.cos(theta) * radius_at_y;
        const z = Math.sin(theta) * radius_at_y;
        positions.push({
            x: x * radius,
            y: y * radius * 0.8,
            z: z * radius,
            index: i,
            phase: (i * 2 * Math.PI) / count
        });
    }
    return positions;
}

function getSatelliteColor(index, total) {
    const hue = (index / total) * 360;
    return new THREE.Color().setHSL(hue / 360, 0.8, 0.6);
}

var PHASE_CAPTIONS = [
    'One prime. One seed.',
    'The full structure. 144 keys from one seed.',
    'The echo. Same structure, reduced. Ready to match.',
    'The path. One chain. Five nodes.',
    'The full Hurwitz structure, the Echo (lightweight copy), the GHZ path, and their super-position.',
    'One prime. Recoverable from any key.'
];

function initEchoVisualization(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

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

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 15;
    controls.maxDistance = 80;

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

    // ---- centerGroup (prime seed) ----
    const centerGroup = new THREE.Group();
    const seedGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const seedMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.5,
        shininess: 100,
        transparent: true,
        opacity: 0.95
    });
    const seed = new THREE.Mesh(seedGeometry, seedMaterial);
    seed.position.set(0, 0, 0);
    centerGroup.add(seed);
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
    centerGroup.add(seedGlow);
    scene.add(centerGroup);

    // ---- fullStarGroup (144 satellites + lines) ----
    const fullStarGroup = new THREE.Group();
    const satelliteCount = 144;
    const baseRadius = 12;
    const satellitePositions = generateSatellitePositions(satelliteCount, baseRadius);
    const satelliteGeometry = new THREE.SphereGeometry(0.3, 16, 16);

    satellitePositions.forEach(function (pos, index) {
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
        fullStarGroup.add(satellite);
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
        fullStarGroup.add(glow);
    });

    satellitePositions.forEach(function (pos, index) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array([0, 0, 0, pos.x, pos.y, pos.z]);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const color = getSatelliteColor(index, satelliteCount);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.2
        });
        fullStarGroup.add(new THREE.Line(geometry, lineMaterial));
    });
    scene.add(fullStarGroup);

    // ---- echoGroup (full 3D ring + optional blobs) ----
    const echoGroup = new THREE.Group();
    const torusRadius = 12;
    const tubeRadius = 0.8;
    const torusGeometry = new THREE.TorusGeometry(torusRadius, tubeRadius, 16, 64);
    const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0x667eea,
        emissive: 0x667eea,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.5
    });
    const ring = new THREE.Mesh(torusGeometry, ringMaterial);
    echoGroup.add(ring);
    // A few blob spheres at subset of positions
    const blobIndices = [0, 24, 48, 72, 96, 120];
    const blobGeometry = new THREE.SphereGeometry(1.2, 24, 24);
    blobIndices.forEach(function (i) {
        const pos = satellitePositions[i];
        const color = getSatelliteColor(i, satelliteCount);
        const blobMaterial = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.6
        });
        const blob = new THREE.Mesh(blobGeometry, blobMaterial);
        blob.position.set(pos.x, pos.y, pos.z);
        echoGroup.add(blob);
    });
    scene.add(echoGroup);

    // ---- ghzPathGroup (5 nodes, 4 segments) ----
    const ghzPathGroup = new THREE.Group();
    const step = 6;
    const nodePositions = [
        new THREE.Vector3(-12, 0, 0),
        new THREE.Vector3(-6, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(6, 0, 0),
        new THREE.Vector3(12, 0, 0)
    ];
    const nodeGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const nodeMaterial = new THREE.MeshPhongMaterial({
        color: 0x22aa44,
        emissive: 0x22aa44,
        emissiveIntensity: 0.3,
        shininess: 100
    });
    nodePositions.forEach(function (p) {
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.copy(p);
        ghzPathGroup.add(node);
    });
    for (let i = 0; i < nodePositions.length - 1; i++) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
            nodePositions[i].x, nodePositions[i].y, nodePositions[i].z,
            nodePositions[i + 1].x, nodePositions[i + 1].y, nodePositions[i + 1].z
        ]), 3));
        ghzPathGroup.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x22aa44, linewidth: 2 })));
    }
    scene.add(ghzPathGroup);

    // ---- Phase state ----
    var currentPhase = 0;

    function applyVisibility() {
        centerGroup.visible = (currentPhase === 0 || currentPhase === 1 || currentPhase === 2 || currentPhase === 4 || currentPhase === 5);
        fullStarGroup.visible = (currentPhase === 1);
        echoGroup.visible = (currentPhase === 2 || currentPhase === 4);
        ghzPathGroup.visible = (currentPhase === 3 || currentPhase === 4);
    }

    function setPhase(phase) {
        currentPhase = Math.max(0, Math.min(5, Math.floor(phase)));
        applyVisibility();
        var captionEl = document.getElementById('echo-caption');
        if (captionEl) captionEl.textContent = PHASE_CAPTIONS[currentPhase];
        document.querySelectorAll('.phase-btn').forEach(function (btn) {
            btn.classList.toggle('active', parseInt(btn.getAttribute('data-phase'), 10) === currentPhase);
        });
    }

    applyVisibility();

    // ---- Animation loop ----
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // ---- Resize ----
    window.addEventListener('resize', function () {
        var w = container.clientWidth;
        var h = container.clientHeight || 600;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    // ---- Play (auto-advance) ----
    var playIntervalId = null;
    var PLAY_DURATION_MS = 5000;

    function stopPlay() {
        if (playIntervalId) {
            clearInterval(playIntervalId);
            playIntervalId = null;
        }
        var playBtn = document.getElementById('echo-play-btn');
        if (playBtn) playBtn.textContent = 'Play';
    }

    function startPlay() {
        if (playIntervalId) {
            stopPlay();
            return;
        }
        var playBtn = document.getElementById('echo-play-btn');
        if (playBtn) playBtn.textContent = 'Stop';
        playIntervalId = setInterval(function () {
            var next = currentPhase + 1;
            if (next > 5) {
                stopPlay();
                return;
            }
            setPhase(next);
        }, PLAY_DURATION_MS);
    }

    // ---- UI wiring ----
    setPhase(0);
    document.querySelectorAll('.phase-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            stopPlay();
            setPhase(parseInt(btn.getAttribute('data-phase'), 10));
        });
    });
    var playBtn = document.getElementById('echo-play-btn');
    if (playBtn) playBtn.addEventListener('click', startPlay);

    return {
        setPhase: setPhase,
        stopPlay: stopPlay
    };
}

if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        initEchoVisualization('echo-visualization');
    });
} else {
    initEchoVisualization('echo-visualization');
}
