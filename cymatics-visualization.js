/**
 * Cymatics Visualization — SteadyWatch / Quantum V^
 *
 * Hurwitz quaternion nodes crystallize from a black/white checkerboard
 * like Chladni figures forming on a vibrating plate.
 *
 * Sequence: VAULT (p=5, 144 nodes, 144 Hz)
 *        → VIPER (p=13, 336 nodes, 336 Hz)
 *        → HORDE (p=17, 432 nodes, 432 Hz)
 *        → loops
 *
 * Node projection: (a, b) quaternion components → (x, z) world plane.
 * Nodes sharing (a,b) but differing in (c,d) stack via AdditiveBlending,
 * naturally producing density maps — the mathematical Chladni figure.
 */

const CYM_SHELLS = [
    { name: 'VAULT™', prime: 5,  color: 0xFFD700, css: '#FFD700', hz: 144, count: 144, rippleHz: 1.0  },
    { name: 'VIPER',  prime: 13, color: 0x00E5FF, css: '#00E5FF', hz: 336, count: 336, rippleHz: 2.33 },
    { name: 'HORDE',  prime: 17, color: 0xa855f7, css: '#a855f7', hz: 432, count: 432, rippleHz: 3.0  }
];

const CYM = {
    SCALE:      1.6,   // quaternion coord units → world units
    MAX_R:      8.5,   // wave expands to this radius
    BUILD_T:    7.0,   // seconds to crystallize full pattern
    HOLD_T:     5.0,   // seconds holding stable pattern
    DISSOLVE_T: 2.5,   // seconds to dissolve
    PAUSE_T:    1.2    // pause before first shell
};


// ── Hurwitz node generation ─────────────────────────────────────────────────
// Generates all Hurwitz quaternions q = (a,b,c,d) with |q|² = p.
// Includes both integer and half-integer (n+½) quaternions.
// Formula: 24 × (p+1) nodes total (p prime).
function cymGenerateHurwitz(p) {
    const nodes = [], seen = new Set();
    const lim = Math.ceil(Math.sqrt(p)) + 1;

    const push = (a, b, c, d) => {
        const k = a + '|' + b + '|' + c + '|' + d;
        if (!seen.has(k)) { seen.add(k); nodes.push([a, b, c, d]); }
    };

    // Integer quaternions: a² + b² + c² + d² = p
    for (let a = -lim; a <= lim; a++)
    for (let b = -lim; b <= lim; b++)
    for (let c = -lim; c <= lim; c++) {
        const dSq = p - a*a - b*b - c*c;
        if (dSq < 0) continue;
        const d = Math.round(Math.sqrt(dSq));
        if (d * d !== dSq) continue;
        push(a, b, c, d);
        if (d > 0) push(a, b, c, -d);
    }

    // Half-integer quaternions: (a+½)² + (b+½)² + (c+½)² + (d+½)² = p
    for (let a = -lim; a <= lim; a++)
    for (let b = -lim; b <= lim; b++)
    for (let c = -lim; c <= lim; c++) {
        const ah = a + 0.5, bh = b + 0.5, ch = c + 0.5;
        const rem = p - ah*ah - bh*bh - ch*ch;
        if (rem <= 0) continue;
        const n  = Math.round(Math.sqrt(rem) - 0.5);
        const dh = n + 0.5;
        if (Math.abs(dh * dh - rem) > 0.001) continue;
        push(ah, bh, ch,  dh);
        push(ah, bh, ch, -dh);
    }

    return nodes;
}

// ── Main init ───────────────────────────────────────────────────────────────
function initCymaticsVisualization(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const W = el.clientWidth, H = el.clientHeight || 650;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 200);
    camera.position.set(24.45, 23.84, 24.45);
    camera.lookAt(0, 0, 0);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping  = true;
    controls.dampingFactor  = 0.06;
    controls.minDistance    = 8;
    controls.maxDistance    = 42;
    controls.minPolarAngle  = 0.05;
    controls.maxPolarAngle  = Math.PI * 0.47;

    controls.addEventListener('change', function() {
    var p = camera.position;
    var t = controls.target;
    console.log("camera.position.set(" + p.x.toFixed(2) + ", " + p.y.toFixed(2) + ", " + p.z.toFixed(2) + ");  target:'" + t.x.toFixed(2) + "''" + t.y.toFixed(2) + "''" + t.z.toFixed(2) + "'");
});


// ── Checkerboard ground (GLSL shader) ─────────────────────────────────
const BOARD_SZ = 32;
const boardMat = new THREE.ShaderMaterial({
    uniforms: {
        uWave:       { value: 0.0 },
        uColor:      { value: new THREE.Color(0xFFD700) },
        uFadeRadius: { value: 2 },       // ← NEW: tweak this (2.0 = tight fade, 5.0 = wider)
        uBlastOffset: { value: 0.0 },     // shift blast vs wave (negative = lag)
        uFadeWidth:   { value: 3.0 },
    },
    vertexShader: `
        varying vec2 vUV;
        void main() {
            vUV = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
fragmentShader: `
    uniform float uWave;
    uniform vec3  uColor;
    varying vec2  vUV;

    void main() {
        // Recover world-space XZ (adjust BOARD_SZ if your scale is different)
        vec2 xz    = (vUV - 0.5) * 32.0;   // ← match your BOARD_SZ
        vec2 tile  = floor(xz / 1.4);
        float check = mod(tile.x + tile.y, 2.0);
        vec3  col   = vec3(check * 0.85 + 0.15);  // softer black/white if you prefer

        // Soft ring glow at the wave front
        float dist = length(xz);
        float ring = smoothstep(uWave - 2.0, uWave, dist)
                   * smoothstep(uWave + 0.7, uWave, dist);
        col += uColor * ring * 0.28;

    // ── DYNAMIC BLAST RADIUS FADE ────────────────────────────────────────

  
    // Core cleared zone (grows with wave)
    float blastRadius = uWave;               // or uWave - offset if you want lag
    float innerFadeWidth = 3.0;              // how soft the inner transition is

    float innerAlpha = smoothstep(blastRadius, blastRadius + innerFadeWidth, dist);

    // NEW: Outer fade near board edges to prevent hard chop
    // Approximate board half-size (BOARD_SZ/2); adjust if your plane scale differs
    
    const float boardHalf = 16.0;            // 32 / 2 = 16
    float edgeDist = boardHalf - dist;       // distance to nearest edge (approx radial)
    float outerFadeWidth = 14.0;              // wider = gentler vanish at rim

    // outerAlpha = 1 inside, ramps down to 0 near/outside edge
    float outerAlpha = smoothstep(0.0, outerFadeWidth, edgeDist);

    // Final alpha: cleared inside blast, but also faded at outer rim
    float alpha = innerAlpha * outerAlpha;

    // Optional: prevent total disappearance too early — minimum visibility
    alpha = max(alpha, 0.08);                // faint ghost if you want subtle trail

     gl_FragColor = vec4(clamp(col, 0.0, 1.0), alpha);
    }
`,
    side: THREE.DoubleSide,
    transparent: true   // ← IMPORTANT: enables alpha blending
});
    const board = new THREE.Mesh(new THREE.PlaneGeometry(BOARD_SZ, BOARD_SZ), boardMat);
    board.rotation.x = -Math.PI / 2;
    scene.add(board);

    // ── Ripple ring pool ──────────────────────────────────────────────────
    const N_RINGS = 28;
    const RING_SPEED = (CYM.MAX_R / CYM.BUILD_T) * 1.18;

    const rings = Array.from({ length: N_RINGS }, () => {
        const m = new THREE.Mesh(
            new THREE.TorusGeometry(1, 0.04, 6, 80),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
        );
        m.rotation.x = -Math.PI / 2;
        m.visible = false;
        scene.add(m);
        return { mesh: m, r: 0, active: false };
    });

    function emitRing(color) {
        const slot = rings.find(r => !r.active);
        if (!slot) return;
        slot.r = 0.05;
        slot.active = true;
        slot.mesh.material.color.setHex(color);
        slot.mesh.material.opacity = 0.88;
        slot.mesh.visible = true;
    }

    // ── Node group ────────────────────────────────────────────────────────
    const nodeGeo   = new THREE.SphereGeometry(0.11, 7, 7);
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    let nodeData = [], waveR = 0, lastRippleT = 0;

    function clearNodes() {
        for (let i = nodeGroup.children.length - 1; i >= 0; i--) {
            const m = nodeGroup.children[i];
            if (m.material) m.material.dispose();
            nodeGroup.remove(m);
        }
        nodeData = [];
    }

    function loadShell(idx) {
        clearNodes();
        rings.forEach(r => {
            r.active = false;
            r.mesh.visible = false;
            r.mesh.material.opacity = 0;
        });

        const sh = CYM_SHELLS[idx];
        boardMat.uniforms.uColor.value.setHex(sh.color);
        boardMat.uniforms.uWave.value = 0;

        const qs = cymGenerateHurwitz(sh.prime);
        console.log('Cymatics [' + sh.name + ']: ' + qs.length + ' nodes (expected ' + sh.count + ')');

        for (var i = 0; i < qs.length; i++) {
            var q = qs[i];
            var x = q[0] * CYM.SCALE;
            var z = q[1] * CYM.SCALE;
            var mat = new THREE.MeshBasicMaterial({
                color:    sh.color,
                transparent: true,
                opacity:  0,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            var mesh = new THREE.Mesh(nodeGeo, mat);
            mesh.position.set(x, 0.18, z);
            mesh.scale.setScalar(0);
            nodeGroup.add(mesh);
            nodeData.push({ mesh: mesh, d: Math.sqrt(x*x + z*z), crystallized: false, crystT: 0 });
        }

        waveR = 0;
        lastRippleT = 0;
    }

    // ── Caption DOM ───────────────────────────────────────────────────────
    var elShell = document.getElementById('cym-shell');
    var elHz    = document.getElementById('cym-hz');
    var elNodes = document.getElementById('cym-nodes');
    var elPhase = document.getElementById('cym-phase');
    var elPrime = document.getElementById('cym-prime');
    var elDots  = [
        document.getElementById('cym-dot-0'),
        document.getElementById('cym-dot-1'),
        document.getElementById('cym-dot-2')
    ];

    function setCaption(idx, phaseTxt) {
        var sh = CYM_SHELLS[idx];
        if (elShell) { elShell.textContent = sh.name; elShell.style.color = sh.css; }
        if (elHz)    elHz.textContent    = sh.hz + ' Hz';
        if (elNodes) elNodes.textContent = sh.count + ' nodes';
        if (elPhase) elPhase.textContent = phaseTxt;
        if (elPrime) elPrime.textContent = 'p = ' + sh.prime;
        elDots.forEach(function(d, i) {
            if (!d) return;
            d.style.background  = (i === idx) ? sh.css : 'rgba(255,255,255,0.18)';
            d.style.boxShadow   = (i === idx) ? '0 0 8px ' + sh.css : 'none';
            d.style.transform   = (i === idx) ? 'scale(1.3)' : 'scale(1.0)';
        });
    }

    // ── State machine ─────────────────────────────────────────────────────
    var shellIdx = 0, phase = 'pause', phaseT = 0;
    loadShell(0);
    setCaption(0, '');

    var PHASE_DUR = {
        pause:     CYM.PAUSE_T,
        building:  CYM.BUILD_T,
        holding:   CYM.HOLD_T,
        dissolving: CYM.DISSOLVE_T
    };

    function nextPhase() {
        phaseT = 0;
        if (phase === 'pause') {
            phase = 'building';
            setCaption(shellIdx, 'crystallizing...');
        } else if (phase === 'building') {
            phase = 'holding';
            setCaption(shellIdx, 'pattern stable');
        } else if (phase === 'holding') {
            phase = 'dissolving';
            setCaption(shellIdx, 'dissolving...');
        } else if (phase === 'dissolving') {
            shellIdx = (shellIdx + 1) % CYM_SHELLS.length;
            loadShell(shellIdx);
            phase = 'building';
            setCaption(shellIdx, 'crystallizing...');
        }
    }

    // ── Animation loop ─────────────────────────────────────────────────────
    var prevT = performance.now() / 1000;
    var globalT = 0;

    function animate() {
        requestAnimationFrame(animate);

        var now = performance.now() / 1000;
        var dt  = Math.min(now - prevT, 0.05);
        prevT  = now;
        globalT += dt;

        controls.update();

        phaseT += dt;
        if (phaseT >= PHASE_DUR[phase]) nextPhase();

        var sh = CYM_SHELLS[shellIdx];

        // Wave expansion + node crystallization
        if (phase === 'building') {
            waveR = (phaseT / CYM.BUILD_T) * CYM.MAX_R;
            boardMat.uniforms.uWave.value = waveR;

            var rippleInterval = 1.0 / sh.rippleHz;
            if (now - lastRippleT >= rippleInterval) {
                emitRing(sh.color);
                lastRippleT = now;
            }

            for (var i = 0; i < nodeData.length; i++) {
                var nd = nodeData[i];
                if (!nd.crystallized && nd.d <= waveR) {
                    nd.crystallized = true;
                    nd.crystT = now;
                }
            }
        } else {
            boardMat.uniforms.uWave.value = CYM.MAX_R + 2;
        }

        // Node scale/opacity animation
        var CRYST_DUR = 0.42;
        for (var i = 0; i < nodeData.length; i++) {
            var nd = nodeData[i];
            if (!nd.crystallized) continue;

            var ct = now - nd.crystT;
            var sc, op;

            if (phase === 'dissolving') {
                var dt2 = phaseT / CYM.DISSOLVE_T;
                // Outer nodes fade first — like a wave collapsing inward
                op = Math.max(0, 1.0 - dt2 * 1.6 - (nd.d / CYM.MAX_R) * 0.35);
                sc = Math.max(0.01, 1.0 - dt2 * 0.45);
            } else if (ct < CRYST_DUR) {
                // Crystallization bounce
                var t = ct / CRYST_DUR;
                sc = t < 0.65 ? (t / 0.65) * 1.32 : 1.32 - ((t - 0.65) / 0.35) * 0.32;
                op = Math.min(t * 3.2, 1.0);
            } else {
                // Gentle breathe in building/holding
                sc = 1.0 + Math.sin(globalT * 1.3 + nd.d * 0.5) * 0.07;
                op = 0.90 + Math.sin(globalT * 1.1 + nd.d * 0.3) * 0.06;
            }

            nd.mesh.scale.setScalar(Math.max(sc, 0));
            nd.mesh.material.opacity = Math.max(op, 0);
        }

        // Ripple ring expansion
        for (var i = 0; i < rings.length; i++) {
            var r = rings[i];
            if (!r.active) continue;
            r.r += RING_SPEED * dt;
            r.mesh.scale.setScalar(r.r);
            r.mesh.material.opacity = Math.max(0, (1 - r.r / CYM.MAX_R) * 0.72);
            if (r.r >= CYM.MAX_R) {
                r.active = false;
                r.mesh.visible = false;
            }
        }

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', function() {
        var w = el.clientWidth, h = el.clientHeight || 650;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}
