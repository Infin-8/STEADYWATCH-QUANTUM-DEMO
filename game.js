/**
 * Keyz Game — Minimal voxel: key ore blocks (p=5, p=13), break → key drop orbs.
 * Uses HurwitzKeys, UnifiedQubitStyling. Three.js r128 + OrbitControls.
 */
(function () {
    'use strict';

    var BLOCK = { AIR: 0, GROUND: 1, KEY_ORE_P5: 2, KEY_ORE_P13: 3, PYRAMID_ORE: 4 };
    var BLOCK_SIZE = 1;
    var TOTAL_P5 = 144;
    var TOTAL_P13 = 336;
    var CLUSTER_RADIUS = 0.5 * 0.8;
    var AVOID_NEAR = 0.55;
    var AVOID_FAR = 0.55;
    var BOUNCE_RADIUS = 0.58;
    var BOUNCE_RADIUS_BASE_EXPANDED = 0.72;
    var BOUNCE_BACK_FACTOR = 0.4;
    var SPHERE_COLLISION_RADIUS = 0.08;
    var SPHERE_COLLISION_DAMPING = 0.6;
    var VEL_DAMPING = 0.80;
    var SETTLE_SQ = 1e-6;

    function smoothstep(t) {
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        return t * t * (3 - 2 * t);
    }

    function project4Dto3D(a, b, c, d, radius) {
        var w = d;
        var scale = radius / (1 + Math.abs(w) * 0.1);
        return { x: a * scale, y: b * scale, z: c * scale };
    }

    function getKeyColor(keyIndex, total) {
        if (typeof THREE === 'undefined') return null;
        var hue = (keyIndex / (total || 144)) * 360;
        return new THREE.Color().setHSL(hue / 360, 0.8, 0.6);
    }

    function blockKey(x, y, z) { return x + ',' + y + ',' + z; }

    function hashKeyIndex(x, z, prime) {
        var n = (x * 31 + z * 17) | 0;
        n = n < 0 ? -n : n;
        return prime === 5 ? n % TOTAL_P5 : n % TOTAL_P13;
    }

    function createBlockMesh(blockType, bx, by, bz) {
        var geometry = new THREE.BoxGeometry(BLOCK_SIZE * 0.92, BLOCK_SIZE * 0.92, BLOCK_SIZE * 0.92);
        var material;
        var prime = blockType === BLOCK.KEY_ORE_P5 ? 5 : blockType === BLOCK.KEY_ORE_P13 ? 13 : 0;
        var keyIndex = (blockType === BLOCK.KEY_ORE_P5 || blockType === BLOCK.KEY_ORE_P13)
            ? hashKeyIndex(bx, bz, prime) : 0;

        if (blockType === BLOCK.GROUND) {
            var crystalPosHash = (Math.abs(bx * 7 + bz * 13) % 81) / 81;
            var crystalHue = (0.68 + crystalPosHash * 0.22) % 1;
            material = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color().setHSL(crystalHue, 0.25, 0.88),
                emissive: new THREE.Color().setHSL(crystalHue, 0.6, 0.5),
                emissiveIntensity: 0.0,
                roughness: 0.0,
                metalness: 0.0,
                transmission: 0.90,
                opacity: 1.0,
                transparent: true,
                ior: 1.7,
                thickness: 0.5,
                clearcoat: 0.8,
                clearcoatRoughness: 0.05,
                envMapIntensity: 1.2,
                side: THREE.DoubleSide,
                specularIntensity: 1.0
            });
        } else if (blockType === BLOCK.PYRAMID_ORE) {
            // Pyramid level: by=2→level1, by=3→level2, by=4→level3, by=5→apex
            var pyramidLevel = by - 1; // 1-4
            var levelBright = 0.45 + pyramidLevel * 0.1; // brighter at apex
            material = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color().setHSL(0.14, 0.85, levelBright),
                emissive: new THREE.Color().setHSL(0.14, 1.0, 0.35),
                emissiveIntensity: 0.4 + pyramidLevel * 0.12,
                roughness: 0.1,
                metalness: 0.3,
                transmission: 0.55,
                clearcoat: 1.0,
                clearcoatRoughness: 0.05,
                ior: 1.6,
                envMapIntensity: 1.5,
                transparent: true,
                opacity: 0.48,
                depthWrite: false
            });
        } else {
            var col = getKeyColor(keyIndex, prime === 5 ? TOTAL_P5 : TOTAL_P13);
            material = new THREE.MeshPhongMaterial({
                color: col,
                emissive: col,
                emissiveIntensity: 0.2,
                shininess: 80,
                flatShading: true
            });
        }

        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(bx * BLOCK_SIZE, by * BLOCK_SIZE, bz * BLOCK_SIZE);
        mesh.userData.blockType = blockType;
        mesh.userData.bx = bx;
        mesh.userData.by = by;
        mesh.userData.bz = bz;
        mesh.userData.prime = prime;
        mesh.userData.keyIndex = keyIndex;
        if (blockType === BLOCK.PYRAMID_ORE) {
            mesh.userData.pyramidLevel = by - 1;
        }
        if (blockType === BLOCK.GROUND) {
            var ph = (Math.abs(bx * 7 + bz * 13) % 81) / 81;
            mesh.scale.y = 0.88 + ((Math.abs(bx * 3 + bz * 7) % 15) / 15) * 0.14;
            mesh.userData.crystalPhase = ph * Math.PI * 2;
            mesh.userData.crystalHue = (0.68 + ph * 0.22) % 1;
        }
        return mesh;
    }

        function initGame() {
        var container = document.getElementById('game-container');
        if (!container || typeof THREE === 'undefined' || !window.HurwitzKeys || !window.UnifiedQubitStyling) {
            if (container) container.innerHTML = '<p style="padding:20px;">Load error: Three.js, HurwitzKeys, or UnifiedQubitStyling missing.</p>';
            return;
        }

        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a1a);
        scene.fog = new THREE.Fog(0x0a0a1a, 40, 100);

        var width = container.clientWidth;
        var height = container.clientHeight || 600;

        var camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(1.97, 7.89, -1.94);
        camera.lookAt(0, 5, 0);

        var renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        var controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 4;
        controls.maxDistance = 50;
        controls.target.set(0, 5, 0);
        controls.addEventListener('change', function () {
            var p = camera.position;
            console.log('camera.position.set(' + p.x.toFixed(2) + ', ' + p.y.toFixed(2) + ', ' + p.z.toFixed(2) + ');  target:', controls.target.x.toFixed(2), controls.target.y.toFixed(2), controls.target.z.toFixed(2));
        });

        var ambientLight = new THREE.AmbientLight(0x667eea, 0.4);
        scene.add(ambientLight);
        var pointLight1 = new THREE.PointLight(0x667eea, 1, 80);
        pointLight1.position.set(17, 10, 17);
        scene.add(pointLight1);
        var pointLight2 = new THREE.PointLight(0x764ba2, 0.8, 80);
        pointLight2.position.set(-17, 10, -17);
        scene.add(pointLight2);

        // ── VAULT BEACON (p=5 · gold/white) ─────────────────────────────
        var BEACON_COLOR = 0xffd700;
        var BEACON_HUE   = 0.14;
        var beaconH      = 26;

        var beaconSrc = new THREE.Mesh(
            new THREE.SphereGeometry(0.28, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        beaconSrc.position.set(0, beaconH + 1, 0);
        scene.add(beaconSrc);

        var beaconBeam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.02, beaconH, 8, 1),
            new THREE.MeshBasicMaterial({ color: BEACON_COLOR, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        beaconBeam.position.set(0, beaconH / 2 + 1, 0);
        scene.add(beaconBeam);

        var beaconGlow = new THREE.Mesh(
            new THREE.CylinderGeometry(0.38, 0.08, beaconH, 8, 1),
            new THREE.MeshBasicMaterial({ color: BEACON_COLOR, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        beaconGlow.position.set(0, beaconH / 2 + 1, 0);
        scene.add(beaconGlow);

        var beaconCorona = [
            { r: 0.55, op: 0.20, ph: 0.0 },
            { r: 0.95, op: 0.11, ph: 1.2 },
            { r: 1.50, op: 0.06, ph: 2.4 }
        ].map(function(d) {
            var m = new THREE.Mesh(
                new THREE.SphereGeometry(d.r, 16, 16),
                new THREE.MeshBasicMaterial({ color: BEACON_COLOR, transparent: true, opacity: d.op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide })
            );
            m.position.set(0, beaconH + 1, 0);
            m.userData.phase = d.ph; m.userData.baseOp = d.op;
            scene.add(m); return m;
        });

        var BEACON_RINGS = 5;
        var beaconRings = [];
        for (var bri = 0; bri < BEACON_RINGS; bri++) {
            var brm = new THREE.Mesh(
                new THREE.TorusGeometry(0.25, 0.025, 6, 32),
                new THREE.MeshBasicMaterial({ color: BEACON_COLOR, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
            );
            brm.userData.progress = bri / BEACON_RINGS;
            scene.add(brm); beaconRings.push(brm);
        }

        var beaconFlares = [
            { sc: 3.0, r: 255, g: 215, b: 0,   op: 0.80 },
            { sc: 5.5, r: 255, g: 255, b: 255, op: 0.35 },
            { sc: 8.5, r: 255, g: 215, b: 0,   op: 0.15 }
        ].map(function(d) {
            var cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
            var cx = cv.getContext('2d');
            var grd = cx.createRadialGradient(64,64,0,64,64,64);
            grd.addColorStop(0,'rgba('+d.r+','+d.g+','+d.b+',1)');
            grd.addColorStop(0.3,'rgba('+d.r+','+d.g+','+d.b+',0.4)');
            grd.addColorStop(1,'rgba(0,0,0,0)');
            cx.fillStyle = grd; cx.fillRect(0,0,128,128);
            var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, opacity: d.op, blending: THREE.AdditiveBlending, depthWrite: false }));
            sp.scale.set(d.sc, d.sc, 1); sp.userData.baseOp = d.op;
            sp.position.set(0, beaconH + 1, 0); scene.add(sp); return sp;
        });

        var beaconLight = new THREE.PointLight(BEACON_COLOR, 1.2, 18);
        beaconLight.position.set(0, beaconH + 1, 0);
        scene.add(beaconLight);
        // ── END VAULT BEACON ─────────────────────────────────────────────

        var blocks = {};
        var blockMeshes = [];
        var keyDrops = [];
        var styling = new window.UnifiedQubitStyling();
        var time = 0;
        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();
        var worldPosVortex = new THREE.Vector3();
        var correctedWorldVortex = new THREE.Vector3();
        var bouncePushDir = new THREE.Vector3();
        var velocityVortex = new THREE.Vector3();
        var surfacePointVortex = new THREE.Vector3();
        var groupInvWorld = new THREE.Matrix4();
        var collisionNormal = new THREE.Vector3();
        var tempVec1 = new THREE.Vector3();
        var tempVec2 = new THREE.Vector3();

        function setBlock(bx, by, bz, blockType) {
            var key = blockKey(bx, by, bz);
            if (blocks[key]) {
                scene.remove(blocks[key]);
                blockMeshes.splice(blockMeshes.indexOf(blocks[key]), 1);
            }
            if (blockType === BLOCK.AIR) {
                delete blocks[key];
                return;
            }
            var mesh = createBlockMesh(blockType, bx, by, bz);
            blocks[key] = mesh;
            blockMeshes.push(mesh);
            scene.add(mesh);
        }

        function spawnKeyDrop(wx, wy, wz, prime, keyIndex) {
            var total = prime === 5 ? TOTAL_P5 : TOTAL_P13;
            var col = getKeyColor(keyIndex, total);
            var quats = window.HurwitzKeys.unzipSeed(prime);
            var group = new THREE.Group();
            group.position.set(wx, wy, wz);
            var sharedGeom = new THREE.SphereGeometry(0.06, 8, 8);
            var mat = new THREE.MeshPhongMaterial({
                color: col,
                emissive: col,
                emissiveIntensity: 0.4,
                shininess: 100
            });
            var i, q, pos;
            for (i = 0; i < quats.length; i++) {
                q = quats[i];
                pos = project4Dto3D(q.a, q.b, q.c, q.d, CLUSTER_RADIUS);
                var mesh = new THREE.Mesh(sharedGeom, mat.clone());
                mesh.position.set(0, 0, 0);
                mesh.userData.keyDropIndex = keyDrops.length;
                mesh.userData.baseLocalPosition = new THREE.Vector3(pos.x, pos.y, pos.z);
                mesh.userData.satelliteIndex = i;
                group.add(mesh);
            }
            // Nucleus sphere — compact core protected by the Hurwitz quaternion cluster
            var nucleusMat = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL((keyIndex / total) % 1, 0.6, 0.85),
                emissive: col,
                emissiveIntensity: 0.35,
                shininess: 180,
                transparent: true,
                opacity: 0.45,
                side: THREE.FrontSide,
                depthWrite: false
            });
            var nucleusSphere = new THREE.Mesh(new THREE.SphereGeometry(CLUSTER_RADIUS * 0.22, 32, 32), nucleusMat);
            nucleusSphere.userData.isGlassSphere = true;
            group.add(nucleusSphere);

            // Orbital rings — cesium-style electron orbital paths around the nucleus
            var torusGeom = new THREE.TorusGeometry(CLUSTER_RADIUS * 0.32, CLUSTER_RADIUS * 0.018, 8, 48);
            var ringHue = (keyIndex / total) % 1;
            var ringRotations = [
                { x: Math.PI / 2, y: 0,               z: 0 },
                { x: Math.PI / 2, y: Math.PI / 3,     z: Math.PI / 3 },
                { x: Math.PI / 2, y: Math.PI * 2 / 3, z: -Math.PI / 4 }
            ];
            for (var r = 0; r < ringRotations.length; r++) {
                var ringMat = new THREE.MeshPhongMaterial({
                    color: new THREE.Color().setHSL((ringHue + r * 0.08) % 1, 0.7, 0.75),
                    emissive: new THREE.Color().setHSL((ringHue + r * 0.08) % 1, 0.8, 0.3),
                    emissiveIntensity: 0.4,
                    shininess: 160,
                    transparent: true,
                    opacity: 0.35,
                    depthWrite: false
                });
                var ring = new THREE.Mesh(torusGeom, ringMat);
                ring.rotation.x = ringRotations[r].x;
                ring.rotation.y = ringRotations[r].y;
                ring.rotation.z = ringRotations[r].z;
                ring.userData.isGlassSphere = true;
                ring.userData.orbitalRingIndex = r;
                group.add(ring);
            }

            scene.add(group);
            keyDrops.push({
                group: group,
                material: mat,
                prime: prime,
                keyIndex: keyIndex,
                total: total,
                basePosition: new THREE.Vector3(wx, wy, wz),
                expansionProgress: 0,
                expansionSpeed: 0.03
            });
        }

        function spawnPyramidDrop(wx, wy, wz, pyramidLevel, keyIndex) {
            var PYRAMID_HUE = 0.14; // warm gold
            var col = new THREE.Color().setHSL(PYRAMID_HUE + pyramidLevel * 0.02, 0.95, 0.65);
            var quats = window.HurwitzKeys.unzipSeed(5); // p=5 quaternion structure
            var group = new THREE.Group();
            group.position.set(wx, wy, wz);
            var sharedGeom = new THREE.SphereGeometry(0.06, 8, 8);
            var mat = new THREE.MeshPhongMaterial({
                color: col,
                emissive: col,
                emissiveIntensity: 0.5,
                shininess: 140
            });
            var i, q, pos;
            for (i = 0; i < quats.length; i++) {
                q = quats[i];
                pos = project4Dto3D(q.a, q.b, q.c, q.d, CLUSTER_RADIUS);
                var mesh = new THREE.Mesh(sharedGeom, mat.clone());
                mesh.position.set(0, 0, 0);
                mesh.userData.keyDropIndex = keyDrops.length;
                mesh.userData.baseLocalPosition = new THREE.Vector3(pos.x, pos.y, pos.z);
                mesh.userData.satelliteIndex = i;
                group.add(mesh);
            }
            var nucleusMat = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(PYRAMID_HUE, 0.9, 0.85),
                emissive: col,
                emissiveIntensity: 0.5,
                shininess: 220,
                transparent: true,
                opacity: 0.55,
                side: THREE.FrontSide,
                depthWrite: false
            });
            var nucleusSphere = new THREE.Mesh(new THREE.SphereGeometry(CLUSTER_RADIUS * 0.22, 32, 32), nucleusMat);
            nucleusSphere.userData.isGlassSphere = true;
            group.add(nucleusSphere);
            var torusGeom = new THREE.TorusGeometry(CLUSTER_RADIUS * 0.32, CLUSTER_RADIUS * 0.018, 8, 48);
            var ringRotations = [
                { x: Math.PI / 2, y: 0,               z: 0 },
                { x: Math.PI / 2, y: Math.PI / 3,     z: Math.PI / 3 },
                { x: Math.PI / 2, y: Math.PI * 2 / 3, z: -Math.PI / 4 }
            ];
            for (var r = 0; r < ringRotations.length; r++) {
                var ringMat = new THREE.MeshPhongMaterial({
                    color: new THREE.Color().setHSL((PYRAMID_HUE + r * 0.04) % 1, 0.9, 0.7),
                    emissive: new THREE.Color().setHSL((PYRAMID_HUE + r * 0.04) % 1, 0.9, 0.3),
                    emissiveIntensity: 0.5,
                    shininess: 180,
                    transparent: true,
                    opacity: 0.45,
                    depthWrite: false
                });
                var ring = new THREE.Mesh(torusGeom, ringMat);
                ring.rotation.x = ringRotations[r].x;
                ring.rotation.y = ringRotations[r].y;
                ring.rotation.z = ringRotations[r].z;
                ring.userData.isGlassSphere = true;
                ring.userData.orbitalRingIndex = r;
                group.add(ring);
            }
            scene.add(group);
            keyDrops.push({
                group: group,
                material: mat,
                prime: 5,
                keyIndex: keyIndex,
                total: TOTAL_P5,
                basePosition: new THREE.Vector3(wx, wy, wz),
                expansionProgress: 0,
                expansionSpeed: 0.03,
                isPyramidKey: true,
                pyramidHue: PYRAMID_HUE + pyramidLevel * 0.02,
                pyramidLevel: pyramidLevel
            });
        }

        // --- Hover effects and tooltips for key drop clusters (like 144-satellites) ---
        var hoveredKeyDrop = null;
        var HOVER_SHININESS = 200;
        var HOVER_SPECULAR = 0xaaccff;
        var DEFAULT_SHININESS = 100;
        var DEFAULT_SPECULAR = 0x111111;

        function resetClusterHoverEffect(drop) {
            if (!drop) return;
            drop.group.scale.set(1, 1, 1);
            var c, child;
            for (c = 0; c < drop.group.children.length; c++) {
                child = drop.group.children[c];
                if (child.material) {
                    child.material.emissiveIntensity = 0.4;
                    child.material.shininess = DEFAULT_SHININESS;
                    if (child.material.specular) child.material.specular.setHex(DEFAULT_SPECULAR);
                }
            }
        }

        function getOrbMeshesForRaycast() {
            var list = [];
            for (var i = 0; i < keyDrops.length; i++) {
                var children = keyDrops[i].group.children;
                for (var c = 0; c < children.length; c++) {
                    if (!children[c].userData.isGlassSphere) list.push(children[c]);
                }
            }
            return list;
        }

        var tooltip = document.createElement('div');
        tooltip.setAttribute('id', 'vault-orb-tooltip');
        tooltip.style.cssText = 'position:absolute;left0;top:0;background:rgba(102,126,234,0.95);color:white;padding:10px 15px;border-radius:8px;pointer-events:none;z-index:10;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:none;max-width:280px;';
        container.appendChild(tooltip);

    // seed collison function
    function applyInterChildRepulsion() {
    const REPULSION_RADIUS = 0.45;          // small — tune 0.18 to 0.35; covers satellite orbit + buffer
    const REPULSION_FACTOR = 0.35;          // gentle push; lower than bounce to avoid jitter
    const DAMPING = 0.85;                   // optional soften per-frame moves

    let childA, childB, posA, posB, dx, dy, dz, distSq, dist, overlap, nx, ny, nz, push;
    let dropA, dropB;

    // Only run if enough drops to matter
    if (keyDrops.length < 2) return;

    for (let i = 0; i < keyDrops.length; i++) {
        dropA = keyDrops[i];
        if (dropA.expansionProgress < 1) continue; // skip expanding ones to reduce noise

        for (let j = i + 1; j < keyDrops.length; j++) {
            dropB = keyDrops[j];
            if (dropB.expansionProgress < 1) continue;

            // Now check children between these two drops
            for (let ca = 0; ca < dropA.group.children.length; ca++) {
                childA = dropA.group.children[ca];
                if (childA.userData.isGlassSphere) continue;
                childA.getWorldPosition(worldPosVortex); // reuse your vortex vec or create temp
                posA = worldPosVortex;

                for (let cb = 0; cb < dropB.group.children.length; cb++) {
                    childB = dropB.group.children[cb];
                    if (childB.userData.isGlassSphere) continue;
                    childB.getWorldPosition(tempVec); // need a second temp vec3
                    posB = tempVec;

                    dx = posB.x - posA.x;
                    dy = posB.y - posA.y;
                    dz = posB.z - posA.z;
                    distSq = dx*dx + dy*dy + dz*dz;

                    if (distSq >= REPULSION_RADIUS * REPULSION_RADIUS * 4) continue; // early out

                    dist = Math.sqrt(distSq) || 0.001;
                    overlap = (REPULSION_RADIUS * 2) - dist;
                    if (overlap <= 0) continue;

                    nx = dx / dist;
                    ny = dy / dist;
                    nz = dz / dist;

                    push = overlap * REPULSION_FACTOR;

                    // Push A child away
                    childA.position.x -= nx * push;
                    childA.position.y -= ny * push;
                    childA.position.z -= nz * push;

                    // Push B child away
                    childB.position.x += nx * push;
                    childB.position.y += ny * push;
                    childB.position.z += nz * push;

                    // Optional: damp the move a bit to prevent oscillation
                    childA.position.multiplyScalar(DAMPING);
                    childB.position.multiplyScalar(DAMPING);
                }
            }
        }
    }
}


        function onMouseMove(event) {
            var rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            var orbMeshes = getOrbMeshesForRaycast();
            var hits = raycaster.intersectObjects(orbMeshes, false);
            if (hits.length > 0) {
                var intersected = hits[0].object;
                var dropIndex = intersected.userData.keyDropIndex;
                var drop = dropIndex !== undefined && keyDrops[dropIndex] ? keyDrops[dropIndex] : null;
                if (drop && hoveredKeyDrop !== drop) {
                    if (hoveredKeyDrop) resetClusterHoverEffect(hoveredKeyDrop);
                    hoveredKeyDrop = drop;
                    var c, child;
                    for (c = 0; c < drop.group.children.length; c++) {
                        child = drop.group.children[c];
                        if (child.material) {
                            child.material.emissiveIntensity = 1.0;
                            child.material.shininess = HOVER_SHININESS;
                            if (child.material.specular) child.material.specular.setHex(HOVER_SPECULAR);
                        }
                    }
                    drop.group.scale.set(1.5, 1.5, 1.5);
                    var q = window.HurwitzKeys && drop ? window.HurwitzKeys.getKey(drop.prime, drop.keyIndex) : null;
                    var qStr = q ? '(' + q.a + ',' + q.b + ',' + q.c + ',' + q.d + ')' : '—';
                    var bp = drop.basePosition;
                    tooltip.innerHTML = '<strong>Key #' + (drop ? drop.keyIndex : '') + '</strong> (p=' + (drop ? drop.prime : '') + ')<br>Quaternion: ' + qStr + '<br>Position: (' + bp.x.toFixed(2) + ', ' + bp.y.toFixed(2) + ', ' + bp.z.toFixed(2) + ')';
                    tooltip.style.display = 'block';
                    var cr = container.getBoundingClientRect();
                    tooltip.style.left = (event.clientX - cr.left + 50) + 'px';
                    tooltip.style.top = (event.clientY - cr.top - 10) + 'px';
                } else if (drop) {
                    var cr = container.getBoundingClientRect();
                    tooltip.style.left = (event.clientX - cr.left + 50) + 'px';
                    tooltip.style.top = (event.clientY - cr.top - 10) + 'px';
                }
            } else {
                if (hoveredKeyDrop) {
                    resetClusterHoverEffect(hoveredKeyDrop);
                    hoveredKeyDrop = null;
                }
                tooltip.style.display = 'none';
            }
        }
        renderer.domElement.addEventListener('mousemove', onMouseMove);

        function buildHurwitzCrystalLayer() {
            var quats = window.HurwitzKeys ? window.HurwitzKeys.unzipSeed(5) : [];
            var crystalGeom = new THREE.SphereGeometry(0.14, 8, 8);
            // Board-aligned distribution: snap each node to its nearest 9x9 cell.
            // p=5 components span [-2,2] so 25 of 81 cells are populated (~5.8 nodes/cell)
            // — forms a natural diamond cluster in the center of the board.
            var cellCounts = {};
            for (var i = 0; i < quats.length; i++) {
                var q = quats[i];
                var dScale = 1.0 / (1 + Math.abs(q.d) * 0.1);
                var px = q.a * dScale;
                var pz = q.c * dScale;
                var boardX = Math.max(-4, Math.min(4, Math.round(px)));
                var boardZ = Math.max(-4, Math.min(4, Math.round(pz)));
                var cellKey = boardX + ',' + boardZ;
                var stackIdx = cellCounts[cellKey] || 0;
                cellCounts[cellKey] = stackIdx + 1;
                var jx = Math.sin(i * 7.3) * 0.28;
                var jz = Math.cos(i * 5.1) * 0.28;
                var ph = (i / quats.length);
                var cHue = (0.68 + ph * 0.22) % 1;
                var mat = new THREE.MeshPhysicalMaterial({
                    color: new THREE.Color().setHSL(cHue, 0.25, 0.88),
                    emissive: new THREE.Color().setHSL(cHue, 0.6, 0.5),
                    emissiveIntensity: 0.0,
                    roughness: 0.0,
                    metalness: 0.0,
                    transmission: 0.85,
                    opacity: 1.0,
                    transparent: true,
                    ior: 1.7,
                    clearcoat: 0.8,
                    clearcoatRoughness: 0.05,
                    envMapIntensity: 1.2,
                    side: THREE.FrontSide,
                    specularIntensity: 1.0
                });
                var mesh = new THREE.Mesh(crystalGeom, mat);
                mesh.position.set(boardX + jx, 1.5 + stackIdx * 0.22, boardZ + jz);
                mesh.userData.blockType = BLOCK.GROUND;
                mesh.userData.crystalPhase = ph * Math.PI * 2;
                mesh.userData.crystalHue = cHue;
                scene.add(mesh);
                blockMeshes.push(mesh);
            }
        }

        function buildWorld() {
            var i, j;
            // y=0: p=5 ore (144 satellites) — hidden beneath crystal
            for (i = -4; i <= 4; i++) {
                for (j = -4; j <= 4; j++) {
                    setBlock(i, 0, j, BLOCK.KEY_ORE_P5);
                }
            }
            // y=1: crystal floor — dense base layer
            for (i = -4; i <= 4; i++) {
                for (j = -4; j <= 4; j++) {
                    setBlock(i, 1, j, BLOCK.GROUND);
                }
            }
            // Hurwitz quaternion lattice nodes — 144 sites projected from 4D, floating above crystal floor
            buildHurwitzCrystalLayer();

            // 3D Pyramid — separate key mechanic (PYRAMID_ORE), not bound to F4 vault slots
            // Level 1: y=2, 7×7 (±3)
            for (i = -3; i <= 3; i++) {
                for (j = -3; j <= 3; j++) {
                    setBlock(i, 2, j, BLOCK.PYRAMID_ORE);
                }
            }
            // Level 2: y=3, 5×5 (±2)
            for (i = -2; i <= 2; i++) {
                for (j = -2; j <= 2; j++) {
                    setBlock(i, 3, j, BLOCK.PYRAMID_ORE);
                }
            }
            // Level 3: y=4, 3×3 (±1)
            for (i = -1; i <= 1; i++) {
                for (j = -1; j <= 1; j++) {
                    setBlock(i, 4, j, BLOCK.PYRAMID_ORE);
                }
            }
            // Apex: y=5, 1×1
            setBlock(0, 5, 0, BLOCK.PYRAMID_ORE);
        }

        buildWorld();


        function worldToSlotIndex(bx, bz) {
            var row = 4 - bz;
            var col = bx + 4;
            return row * 9 + col;
        }

        function onPointerClick(event) {
            var rect = renderer.domElement.getBoundingClientRect();
            var clientX = event.clientX !== undefined ? event.clientX : event.touches[0].clientX;
            var clientY = event.clientY !== undefined ? event.clientY : event.touches[0].clientY;
            mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            var hits = raycaster.intersectObjects(blockMeshes, true);
            if (hits.length === 0) return;
            var hit = hits[0];
            var obj = hit.object;
            var bt = obj.userData.blockType;
            if (bt !== BLOCK.KEY_ORE_P5 && bt !== BLOCK.KEY_ORE_P13 && bt !== BLOCK.PYRAMID_ORE) return;
            var bx = obj.userData.bx;
            var by = obj.userData.by;
            var bz = obj.userData.bz;
            var prime = obj.userData.prime;
            var keyIndex = obj.userData.keyIndex;
            setBlock(bx, by, bz, BLOCK.AIR);
            var wx = bx * BLOCK_SIZE;
            var wy = by * BLOCK_SIZE + BLOCK_SIZE * 0.5;
            var wz = bz * BLOCK_SIZE;
            if (bt === BLOCK.PYRAMID_ORE) {
                return;
            }
            spawnKeyDrop(wx, wy, wz, prime, keyIndex);
            updateKeyLabel(null);

            var vaultMode = document.getElementById('vault-mode');
            var vaultBase = document.getElementById('vault-base-url');
            var vaultKey = document.getElementById('vault-api-key');
            var vaultStatus = document.getElementById('vault-status');
            if (vaultMode && vaultMode.checked && vaultBase && vaultKey) {
                var base = (vaultBase.value || '').replace(/\/$/, '');
                var apiKey = vaultKey.value;
                if (base && apiKey) {
                    var slotIndex = worldToSlotIndex(bx, bz);
                    if (vaultStatus) vaultStatus.textContent = 'Requesting…';
                    if (labelEl) labelEl.textContent = 'Vault: Requesting key for slot ' + slotIndex + '…';
                    fetch(base + '/api/vault/request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-Vault-Api-Key': apiKey },
                        body: JSON.stringify({ slotIndex: slotIndex })
                    }).then(function (res) {
                        return res.text().then(function (text) {
                            var data;
                            try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { message: 'Invalid response (status ' + res.status + ')' }; }
                            return { ok: res.ok, data: data };
                        });
                    })
                      .then(function (result) {
                          if (result.ok && result.data && result.data.keyReleased) {
                              if (vaultStatus) vaultStatus.textContent = 'Key released slot ' + slotIndex;
                              if (labelEl) labelEl.textContent = 'Vault: Key released for slot ' + slotIndex + '. ' + (result.data.hasPayload ? 'Payload present.' : '');
                          } else {
                              if (vaultStatus) vaultStatus.textContent = 'Request denied';
                              if (labelEl) labelEl.textContent = 'Vault: ' + ((result.data && (result.data.message || result.data.error)) || 'Request denied');
                          }
                      })
                      .catch(function (err) {
                          if (vaultStatus) vaultStatus.textContent = 'Request failed';
                          if (labelEl) labelEl.textContent = 'Vault: ' + (err.message || 'Request failed');
                      });
                }
            }
        }

        renderer.domElement.addEventListener('click', onPointerClick);
        var touchMoved = false;
        renderer.domElement.addEventListener('touchstart', function () { touchMoved = false; }, { passive: true });
        renderer.domElement.addEventListener('touchmove', function () { touchMoved = true; }, { passive: true });
        renderer.domElement.addEventListener('touchend', function (e) { if (!touchMoved) onPointerClick(e.changedTouches[0]); }, { passive: true });

        var labelEl = document.getElementById('game-key-label');
        function updateKeyLabel(drop) {
            if (!labelEl) return;
            if (drop) {
                var k = window.HurwitzKeys.getKey(drop.prime, drop.keyIndex);
                var q = k ? '(' + k.a + ',' + k.b + ',' + k.c + ',' + k.d + ')' : '';
                labelEl.textContent = 'Key #' + drop.keyIndex + ' (p=' + drop.prime + ') ' + q + ' — click key ore to mine';
            } else {
                var n = keyDrops.length;
                labelEl.textContent = n + ' key drop(z). Click key ore (glowing blockz) to mine.';
            }
        }

        updateKeyLabel(null);

        function animate() {
            requestAnimationFrame(animate);
            time += 0.02;

            // ── VAULT BEACON ANIMATION ───────────────────────────────────
            var bPulse = 0.5 + 0.5 * Math.sin(time * 1.0);
            var bFast  = 0.5 + 0.5 * Math.sin(time * 2.1);
            for (var bci = 0; bci < beaconCorona.length; bci++) {
                var bcp = 0.5 + 0.5 * Math.sin(time * 0.9 + beaconCorona[bci].userData.phase);
                beaconCorona[bci].material.opacity = beaconCorona[bci].userData.baseOp * (0.5 + bcp * 0.9);
                beaconCorona[bci].scale.setScalar(0.93 + bcp * 0.12);
            }
            beaconBeam.material.opacity = 0.30 + 0.28 * Math.sin(time * 1.2);
            beaconGlow.material.opacity = 0.04 + 0.05 * Math.sin(time * 0.8);
            for (var brj = 0; brj < BEACON_RINGS; brj++) {
                var br = beaconRings[brj];
                br.userData.progress += 0.003;
                if (br.userData.progress > 1) br.userData.progress = 0;
                var brp = br.userData.progress;
                br.position.set(0, beaconH + 1 - brp * beaconH, 0);
                var brs = 0.6 + brp * 3.0;
                br.scale.set(brs, brs, brs);
                var bro = brp < 0.1 ? brp * 10 : (brp > 0.75 ? (1 - brp) / 0.25 : 1.0);
                br.material.opacity = Math.max(0, Math.min(1, bro)) * 0.5;
                br.material.color.setHSL((BEACON_HUE + time * 0.02 + brj * 0.1) % 1, 0.9, 0.7);
            }
            for (var bfi = 0; bfi < beaconFlares.length; bfi++) {
                var bfp = 0.5 + 0.5 * Math.sin(time * 1.0 + bfi * 0.9);
                beaconFlares[bfi].material.opacity = beaconFlares[bfi].userData.baseOp * (0.65 + bfp * 0.55);
            }
            beaconLight.intensity = 0.8 + bPulse * 1.2;
            beaconLight.color.setHSL(BEACON_HUE + bFast * 0.06, 1.0, 0.6);
            // ── END BEACON ANIMATION ─────────────────────────────────────

            var idx, phase, rotationAngle, style, hue, sat, light, wobble, scale;

            for (idx = 0; idx < blockMeshes.length; idx++) {
                var m = blockMeshes[idx];
                if (m.userData.blockType === BLOCK.GROUND) {
                    var pulse = 0.5 + 0.5 * Math.sin(time * 0.7 + m.userData.crystalPhase);
                    m.material.emissiveIntensity = 0.015 + pulse * 0.035;
                    continue;
                }
                if (m.userData.blockType === BLOCK.PYRAMID_ORE) {
                    var pLvl = m.userData.pyramidLevel || 1;
                    var pPulse = 0.5 + 0.5 * Math.sin(time * 0.8 + pLvl * 1.1 + m.userData.bx * 0.4 + m.userData.bz * 0.3);
                    m.material.emissiveIntensity = (0.3 + pLvl * 0.12) * (0.6 + pPulse * 0.7);
                    m.material.emissive.setHSL(0.14 + pPulse * 0.02, 1.0, 0.3 + pPulse * 0.1);
                    continue;
                }
                if (m.userData.blockType !== BLOCK.KEY_ORE_P5 && m.userData.blockType !== BLOCK.KEY_ORE_P13) continue;
                var bp = m.position;
                phase = (m.userData.keyIndex / (m.userData.prime === 5 ? TOTAL_P5 : TOTAL_P13)) * Math.PI * 2;
                rotationAngle = time + phase;
                style = styling.calculateUnifiedStyle(m.userData.keyIndex, time, rotationAngle, bp);
                hue = (m.userData.keyIndex / (m.userData.prime === 5 ? TOTAL_P5 : TOTAL_P13));
                sat = 0.7 * (0.8 + style.glowIntensity * 0.4);
                light = 0.55 * (0.9 + style.lightingFactor * 0.2);
                m.material.color.setHSL(hue, sat, light);
                m.material.emissive.setHSL(hue, 0.7, style.glowIntensity * 2);
                m.material.emissiveIntensity = 0.15 + style.glowIntensity * 0.4;
            }

            for (idx = 0; idx < keyDrops.length; idx++) {
                var d = keyDrops[idx];
                var basePos = d.basePosition;
                phase = (d.keyIndex / d.total) * Math.PI * 2;
                rotationAngle = time + phase;
                style = styling.calculateUnifiedStyle(d.keyIndex, time, rotationAngle, basePos);
                wobble = style.noiseFactor * 0.08;
                d.group.position.x = basePos.x + Math.sin(time * 0.7 + idx) * wobble;
                d.group.position.y = basePos.y + Math.cos(time * 1.1 + idx * 0.5) * wobble;
                d.group.position.z = basePos.z + Math.sin(time * 0.6 + idx * 0.3) * wobble;

                if (d.expansionProgress < 1) {
                    d.expansionProgress = Math.min(1, d.expansionProgress + (d.expansionSpeed || 0.03));
                    var eased = 1 - Math.pow(1 - d.expansionProgress, 2);
                    var c, child, baseLocal, lerpedX, lerpedY, lerpedZ;
                    for (c = 0; c < d.group.children.length; c++) {
                        child = d.group.children[c];
                        baseLocal = child.userData.baseLocalPosition;
                        if (!baseLocal) continue;
                        lerpedX = baseLocal.x * eased;
                        lerpedY = baseLocal.y * eased;
                        lerpedZ = baseLocal.z * eased;
                        child.position.set(lerpedX, lerpedY, lerpedZ);
                    }
                } else {
                    var orbitRadius = 0.08;
                    var c, child, baseLocal, satIdx, orbitSpeed, orbitX, orbitY, orbitZ;
                    for (c = 0; c < d.group.children.length; c++) {
                        child = d.group.children[c];
                        baseLocal = child.userData.baseLocalPosition;
                        if (!baseLocal) continue;
                        satIdx = child.userData.satelliteIndex;
                        phase = (satIdx / d.total) * Math.PI * 2;
                        rotationAngle = time + phase;
                        style = styling.calculateUnifiedStyle(satIdx, time, rotationAngle, basePos);
                        orbitSpeed = 0.5 * (style.teslaMultiplier || 1);
                        orbitX = Math.cos(time * orbitSpeed + (style.teslaPhase || 0)) * orbitRadius * style.noiseFactor;
                        orbitY = Math.sin(time * orbitSpeed * 1.3 + (style.teslaPhase || 0)) * orbitRadius * style.noiseFactor;
                        orbitZ = Math.cos(time * orbitSpeed * 0.7 + (style.teslaPhase || 0)) * orbitRadius * style.noiseFactor;
                        child.position.set(
                            baseLocal.x + orbitX,
                            baseLocal.y + orbitY,
                            baseLocal.z + orbitZ
                        );
                    }
                }

                // Compute world positions and ensure previousWorldPosition is initialized
                d.group.updateMatrixWorld(true);
                groupInvWorld.copy(d.group.matrixWorld).invert();
                var children = d.group.children;
                var nearestBlock, b, blockMesh, minDist, dist, prevWorld;
                for (c = 0; c < children.length; c++) {
                    child = children[c];
                    child.getWorldPosition(worldPosVortex);
                    if (!child.userData.worldPos) {
                        child.userData.worldPos = worldPosVortex.clone();
                    } else {
                        child.userData.worldPos.copy(worldPosVortex);
                    }
                    prevWorld = child.userData.previousWorldPosition;
                    if (!prevWorld) {
                        child.userData.previousWorldPosition = worldPosVortex.clone();
                    }
                }

                // Intra-cluster sphere-sphere collisions (soft, damped)
                var i, j, childA, childB, posA, posB, prevA, prevB, minDistCenters, distSq, distCenters, penetration;
                var radiusBase = SPHERE_COLLISION_RADIUS;
                for (i = 0; i < children.length; i++) {
                    childA = children[i];
                    if (childA.userData.isGlassSphere) continue;
                    posA = childA.userData.worldPos;
                    prevA = childA.userData.previousWorldPosition;
                    if (!posA || !prevA) continue;
                    for (j = i + 1; j < children.length; j++) {
                        childB = children[j];
                        if (childB.userData.isGlassSphere) continue;
                        posB = childB.userData.worldPos;
                        prevB = childB.userData.previousWorldPosition;
                        if (!posB || !prevB) continue;
                        minDistCenters = radiusBase * 2;
                        collisionNormal.copy(posB).sub(posA);
                        distSq = collisionNormal.lengthSq();
                        if (distSq === 0 || distSq > minDistCenters * minDistCenters) continue;
                        distCenters = Math.sqrt(distSq);
                        collisionNormal.divideScalar(distCenters);
                        penetration = minDistCenters - distCenters;
                        if (penetration <= 0) continue;
                        // Soft separation along the collision normal, slightly damped
                        var correction = (penetration * 0.5) * SPHERE_COLLISION_DAMPING;
                        posA.addScaledVector(collisionNormal, -correction);
                        posB.addScaledVector(collisionNormal, correction);
                    }
                }

                // BOUNCE PASS — reflect motion off ore (basketball dribble: ball comes right back)
                var worldPos;
                for (c = 0; c < children.length; c++) {
                    child = children[c];
                    if (child.userData.isGlassSphere) continue;
                    var cv = child.userData.vel;
                    if (cv && (cv.x * cv.x + cv.y * cv.y + cv.z * cv.z) > 1e-8) {
                        worldPos = child.userData.worldPos;
                        prevWorld = child.userData.previousWorldPosition;
                        if (worldPos) {
                            if (prevWorld) prevWorld.copy(worldPos);
                            else child.userData.previousWorldPosition = worldPos.clone();
                        }
                        continue;
                    }
                    worldPos = child.userData.worldPos;
                    if (!worldPos) continue;
                    prevWorld = child.userData.previousWorldPosition;
                    if (!prevWorld) {
                        child.userData.previousWorldPosition = worldPos.clone();
                        prevWorld = child.userData.previousWorldPosition;
                    }
                    minDist = Infinity;
                    nearestBlock = null;
                    for (b = 0; b < blockMeshes.length; b++) {
                        blockMesh = blockMeshes[b];
                        if (blockMesh.userData.blockType !== BLOCK.KEY_ORE_P5 && blockMesh.userData.blockType !== BLOCK.KEY_ORE_P13) continue;
                        dist = worldPos.distanceTo(blockMesh.position);
                        if (dist < minDist) {
                            minDist = dist;
                            nearestBlock = blockMesh;
                        }
                    }
                    if (nearestBlock && minDist < BOUNCE_RADIUS_BASE_EXPANDED) {
                        bouncePushDir.copy(worldPos).sub(nearestBlock.position).normalize();
                        surfacePointVortex.copy(nearestBlock.position).add(bouncePushDir.clone().multiplyScalar(BOUNCE_RADIUS_BASE_EXPANDED));
                        velocityVortex.copy(worldPos).sub(prevWorld).reflect(bouncePushDir);
                        correctedWorldVortex.copy(surfacePointVortex).add(velocityVortex.multiplyScalar(BOUNCE_BACK_FACTOR));
                        worldPos.copy(correctedWorldVortex);
                        prevWorld.copy(correctedWorldVortex);
                    } else {
                        prevWorld.copy(worldPos);
                    }
                }

                // Apply final world positions back to local space
                for (c = 0; c < children.length; c++) {
                    child = children[c];
                    var applyVel = child.userData.vel;
                    if (applyVel && (applyVel.x * applyVel.x + applyVel.y * applyVel.y + applyVel.z * applyVel.z) > 1e-8) continue;
                    worldPos = child.userData.worldPos;
                    if (!worldPos) continue;
                    child.position.copy(worldPos).applyMatrix4(groupInvWorld);
                }

                if (hoveredKeyDrop !== d) {
                    phase = (d.keyIndex / d.total) * Math.PI * 2;
                    rotationAngle = time + phase;
                    style = styling.calculateUnifiedStyle(d.keyIndex, time, rotationAngle, basePos);
                    if (d.isPyramidKey) {
                        hue = d.pyramidHue + Math.sin(time * 0.3) * 0.03;
                    } else {
                        hue = (time * 0.1 + d.keyIndex * 0.1) % 1;
                        hue = hue < 0 ? hue + 1 : hue;
                    }
                    sat = 0.7 * (0.8 + style.glowIntensity * 0.4);
                    light = 0.6 * (0.9 + style.lightingFactor * 0.2);
                    var baseIntensity = 0.3 + style.glowIntensity * 0.5;
                    var b, blockMesh, minDist, dist, t, factor;
                    for (c = 0; c < d.group.children.length; c++) {
                        child = d.group.children[c];
                        if (child.userData.isGlassSphere) {
                            if (child.userData.orbitalRingIndex !== undefined) {
                                // Orbital ring — slow counter-rotation + emissive pulse
                                var rIdx = child.userData.orbitalRingIndex;
                                child.rotation.y = time * (0.4 + rIdx * 0.15) * (rIdx % 2 === 0 ? 1 : -1);
                                child.material.emissive.setHSL((hue + rIdx * 0.08) % 1, 0.8, 0.12);
                                child.material.emissiveIntensity = 0.3 + style.glowIntensity * 0.4;
                            } else {
                                // Nucleus sphere
                                child.material.emissive.setHSL(hue, 0.7, 0.08);
                                child.material.emissiveIntensity = 0.25 + style.glowIntensity * 0.3;
                            }
                            continue;
                        }
                        child.material.color.setHSL(hue, sat, light);
                        child.material.emissive.setHSL(hue, 0.7, style.glowIntensity * 2);
                        child.getWorldPosition(worldPosVortex);
                        minDist = Infinity;
                        for (b = 0; b < blockMeshes.length; b++) {
                            blockMesh = blockMeshes[b];
                            if (blockMesh.userData.blockType !== BLOCK.KEY_ORE_P5 && blockMesh.userData.blockType !== BLOCK.KEY_ORE_P13) continue;
                            dist = worldPosVortex.distanceTo(blockMesh.position);
                            if (dist < minDist) minDist = dist;
                        }
                        t = (minDist - AVOID_NEAR) / (AVOID_FAR - AVOID_NEAR);
                        t = t < 0 ? 0 : t > 1 ? 1 : t;
                        factor = smoothstep(t);
                        child.material.emissiveIntensity = baseIntensity * (0.35 + 0.65 * factor);
                    }
                    scale = 0.95 + style.noiseFactor * 0.1;
                    d.group.scale.set(scale, scale, scale);
                }
            }

            controls.update();
            renderer.render(scene, camera);
        }

        animate();

        // Load default config (viz controls panel). Embedded default so the page is always usable (API optional).
        var DEFAULT_CONFIG = {
            id: 'signature',
            name: 'Key-at-zero, 144 Hurwitz moat, unlocked key moat',
            tier: 'signature',
            crownSlotIndex: 0,
            moatLayers: [
                { kind: 'hurwitz', points: 144, role: 'guard' },
                { kind: 'unlocked_key_moat', role: 'orbital' }
            ],
            slotRoles: { '0': 'crown' }
        };
        function applyConfigToPanel(config, fromApi) {
            if (!config || !config.id) return;
            currentVaultConfig = config;
            if (vaultConfigName) vaultConfigName.textContent = config.name || config.id;
            if (vaultConfigTier) vaultConfigTier.textContent = config.tier || '—';
            if (vaultConfigCrown) vaultConfigCrown.textContent = String(config.crownSlotIndex ?? '—');
            var moatLabel = '';
            if (config.moatLayers && config.moatLayers.length) {
                moatLabel = config.moatLayers.map(function (m) {
                    return m.kind + (m.points ? '(' + m.points + ')' : '');
                }).join(', ');
            }
            if (vaultConfigMoat) vaultConfigMoat.textContent = moatLabel || '—';
            if (vaultConfigStatus) vaultConfigStatus.textContent = fromApi ? 'Loaded' : 'Loaded (default)';
        }

        var vaultConfigBase = document.getElementById('vault-config-base');
        var vaultConfigKey = document.getElementById('vault-config-key');
        var loadDefaultConfigBtn = document.getElementById('load-default-config');
        var vaultConfigStatus = document.getElementById('vault-config-status');
        var vaultConfigName = document.getElementById('vault-config-name');
        var vaultConfigTier = document.getElementById('vault-config-tier');
        var vaultConfigCrown = document.getElementById('vault-config-crown');
        var vaultConfigMoat = document.getElementById('vault-config-moat');
        var currentVaultConfig = null;

        if (loadDefaultConfigBtn) {
            loadDefaultConfigBtn.addEventListener('click', function () {
                var base = (vaultConfigBase && vaultConfigBase.value ? vaultConfigBase.value : '').trim().replace(/\/$/, '');
                if (!base) base = window.location.origin;
                var apiKey = (vaultConfigKey && vaultConfigKey.value) ? vaultConfigKey.value : 'vault-demo-key-change-in-production';
                // ROOT CAUSE: This page is served over HTTPS. Browsers block mixed content: HTTPS pages
                // cannot request HTTP URLs. So http://localhost:5003 cannot be used from here.
                // Options: open this page via HTTP (e.g. run locally), or use an HTTPS API URL.
                var pageSecure = window.location.protocol === 'https:';
                var baseSecure = base.indexOf('https:') === 0;
                if (pageSecure && !baseSecure) {
                    applyConfigToPanel(DEFAULT_CONFIG, false);
                    return;
                }
                if (vaultConfigStatus) vaultConfigStatus.textContent = 'Loading…';
                fetch(base + '/api/vault/configs/default', {
                    method: 'GET',
                    headers: { 'X-Vault-Api-Key': apiKey }
                }).then(function (res) {
                    return res.text().then(function (text) {
                        var ok = res.ok;
                        var data;
                        try {
                            data = text ? JSON.parse(text) : {};
                        } catch (e) {
                            data = {};
                        }
                        return { ok: ok && data && data.id, data: data };
                    });
                })
                    .then(function (result) {
                        if (result.ok && result.data.id) {
                            applyConfigToPanel(result.data, true);
                        } else {
                            applyConfigToPanel(DEFAULT_CONFIG, false);
                        }
                    })
                    .catch(function (err) {
                        applyConfigToPanel(DEFAULT_CONFIG, false);
                    });
            });
        }

        var fingerprintMode = false;
        window.toggleFingerprintView = function () {
            fingerprintMode = !fingerprintMode;
            if (fingerprintMode) {
                camera.position.set(0, 22, 0.1);
                camera.lookAt(0, 5, 0);
                controls.target.set(0, 5, 0);
                controls.update();
                if (window.HurwitzLatticeAuth) {
                    window.HurwitzLatticeAuth.getFingerprint(5).then(function (fp) {
                        var label = document.getElementById('game-key-label');
                        if (label) label.textContent = 'Fingerprint: p=5 · ' + fp.siteCount + ' sites · ID: ' + fp.shortId;
                    });
                }
            } else {
                camera.position.set(1.97, 7.89, -1.94);
                camera.lookAt(0, 5, 0);
                controls.target.set(0, 5, 0);
                controls.update();
                var label = document.getElementById('game-key-label');
                if (label) label.textContent = 'Click key ghz field (glowing blockz) to mine. Keyz drop as orbz.';
            }
        };
        window.resetGameView = function () {
            fingerprintMode = false;
            camera.position.set(1.97, 7.89, -1.94);
            camera.lookAt(0, 5, 0);
            controls.target.set(0, 5, 0);
            controls.update();
            var label = document.getElementById('game-key-label');
            if (label) label.textContent = 'Click key ghz field (glowing blockz) to mine. Keyz drop as orbz.';
        };

        window.addEventListener('resize', function () {
            var w = container.clientWidth;
            var h = container.clientHeight || 600;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGame);
    } else {
        initGame();
    }
})();
