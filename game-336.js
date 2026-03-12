/**
 * Keyz Game 336 — Same 81 board as game.js, but key drops use four-way 336-key vertex.
 * Uses HurwitzKeys, UnifiedQubitStyling, FourWayVertex. Three.js r128 + OrbitControls.
 * Does NOT modify game.js.
 *
 * FIXES IN THIS VERSION:
 *  - TOTAL_P5 / TOTAL_P13 restored to integer values (float multipliers broke modulo)
 *  - hashKeyIndex now guards against float modulo producing NaN/wrong indices
 *  - tempVec declared at scope level (was missing, crashed applyInterChildRepulsion)
 *  - repulsionFrame lifted out of child loop (was re-declared every iteration — never throttled)
 *  - applyInterChildRepulsion damping fixed: was scaling child.position toward origin (wrong);
 *    now damps the push vector only
 *  - GROUND material changed back to MeshPhongMaterial — MeshPhysicalMaterial's .emissive
 *    property conflicts with the animate loop which calls .emissive on all blockMeshes
 *  - BOUNCE PASS expanded: arms now collide with GROUND blocks via AABB sphere test
 *    in addition to ore sphere collision — both with correct face-normal bounce
 *  - Added ARM_RADIUS constant for tunable arm-orb collision thickness
 *  - bounced flag prevents double-bounce from two overlapping blocks in same frame
 *  - previousWorldPosition only updated when no bounce occurred (was updating on bounce too)
 */
(function () {
    'use strict';

    // ─── Constants ────────────────────────────────────────────────────────────
    var BLOCK = { AIR: 0, GROUND: 1, KEY_ORE_P5: 2, KEY_ORE_P13: 3 };
    var BLOCK_SIZE      = 1;
    var TOTAL_P5        = 144;      // FIX: was 144*2.2 (float) — broke % modulo
    var TOTAL_P13       = 336;      // FIX: was 336*1.6 (float) — broke % modulo
    var CLUSTER_RADIUS  = 0.55;
    var AVOID_NEAR      = 0.2;
    var AVOID_FAR       = 0.55;
    var BOUNCE_RADIUS_336   = 0.72; // arm vs ore collision radius
    var BOUNCE_BACK_FACTOR  = 0.4;
    var ARM_RADIUS          = 0.18; // arm orb size for AABB floor collision

    // ─── Repulsion throttle (module-level, not per-child) ─────────────────────
    var repulsionFrame = 0; // FIX: was declared inside the child loop

    // ─── Math helpers ─────────────────────────────────────────────────────────
    function smoothstep(t) {
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        return t * t * (3 - 2 * t);
    }

    function getKeyColor(keyIndex, total) {
        if (typeof THREE === 'undefined') return null;
        var hue = (keyIndex / (total || 144)) * 360;
        return new THREE.Color().setHSL(hue / 360, 0.8, 0.6);
    }

    function blockKey(x, y, z) { return x + ',' + y + ',' + z; }

    function hashKeyIndex(x, z, prime) {
        var n = (x * 31 + z * 17) | 0;  // bitwise OR forces integer
        n = n < 0 ? -n : n;
        // FIX: use integer TOTAL_P5/P13 so modulo is always a valid integer index
        return prime === 5 ? n % TOTAL_P5 : n % TOTAL_P13;
    }

    // ─── Block mesh factory ───────────────────────────────────────────────────
    function createBlockMesh(blockType, bx, by, bz) {
        var geometry = new THREE.BoxGeometry(BLOCK_SIZE * 0.98, BLOCK_SIZE * 0.98, BLOCK_SIZE * 0.98);
        var material;
        var prime    = blockType === BLOCK.KEY_ORE_P5  ? 5  :
                       blockType === BLOCK.KEY_ORE_P13 ? 13 : 0;
        var keyIndex = (blockType === BLOCK.KEY_ORE_P5 || blockType === BLOCK.KEY_ORE_P13)
            ? hashKeyIndex(bx, bz, prime) : 0;

        if (blockType === BLOCK.GROUND) {
            // FIX: MeshPhongMaterial instead of MeshPhysicalMaterial.
            // MeshPhysicalMaterial breaks the animate loop which sets .emissive on all
            // blockMeshes — PhongMaterial has emissive; PhysicalMaterial does not in r128.
            material = new THREE.MeshPhongMaterial({
                color:              0xc8b8d8,   // pale crystal-purple
                emissive:           0x110022,
                emissiveIntensity:  0.15,
                shininess:          120,
                transparent:        true,
                opacity:            0.82,
                flatShading:        false
            });
        } else {
            var col = getKeyColor(keyIndex, prime === 5 ? TOTAL_P5 : TOTAL_P13);
            material = new THREE.MeshPhongMaterial({
                color:              col,
                emissive:           col,
                emissiveIntensity:  0.2,
                shininess:          80,
                flatShading:        true
            });
        }

        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(bx * BLOCK_SIZE, by * BLOCK_SIZE, bz * BLOCK_SIZE);
        mesh.userData.blockType = blockType;
        mesh.userData.bx        = bx;
        mesh.userData.by        = by;
        mesh.userData.bz        = bz;
        mesh.userData.prime     = prime;
        mesh.userData.keyIndex  = keyIndex;
        return mesh;
    }

    // ─── Main init ────────────────────────────────────────────────────────────
    function initGame() {
        var container = document.getElementById('game-container');
        if (!container || typeof THREE === 'undefined' ||
            !window.HurwitzKeys || !window.UnifiedQubitStyling || !window.FourWayVertex) {
            if (container) container.innerHTML = '<p style="padding:20px;">Load error: Three.js, HurwitzKeys, UnifiedQubitStyling, or FourWayVertex missing.</p>';
            return;
        }

        // Scene
        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a1a);
        scene.fog = new THREE.Fog(0x0a0a1a, 40, 100);

        var width  = container.clientWidth;
        var height = container.clientHeight || 600;

        // Camera
        var camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(6, 6, 6);
        camera.lookAt(0, 0, 0);

        // Renderer
        var renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // Controls
        var controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance   = 4;
        controls.maxDistance   = 50;

        // Lights
        scene.add(new THREE.AmbientLight(0x667eea, 0.4));
        var pl1 = new THREE.PointLight(0x667eea, 1, 80);
        pl1.position.set(12, 12, 12);
        scene.add(pl1);
        var pl2 = new THREE.PointLight(0x764ba2, 0.8, 80);
        pl2.position.set(-12, 12, -12);
        scene.add(pl2);

        // State
        var blocks      = {};
        var blockMeshes = [];
        var keyDrops    = [];
        var styling     = new window.UnifiedQubitStyling();
        var time        = 0;

        // Raycaster
        var raycaster = new THREE.Raycaster();
        var mouse     = new THREE.Vector2();

        // Reusable vectors (allocated once, reused every frame)
        var worldPosVortex      = new THREE.Vector3();
        var correctedWorldVortex= new THREE.Vector3();
        var bouncePushDir       = new THREE.Vector3();
        var velocityVortex      = new THREE.Vector3();
        var surfacePointVortex  = new THREE.Vector3();
        var groupInvWorld       = new THREE.Matrix4();
        var tempVec             = new THREE.Vector3(); // FIX: was missing — crashed applyInterChildRepulsion

        // ─── Block helpers ────────────────────────────────────────────────────
        function setBlock(bx, by, bz, blockType) {
            var key = blockKey(bx, by, bz);
            if (blocks[key]) {
                scene.remove(blocks[key]);
                blockMeshes.splice(blockMeshes.indexOf(blocks[key]), 1);
            }
            if (blockType === BLOCK.AIR) { delete blocks[key]; return; }
            var mesh = createBlockMesh(blockType, bx, by, bz);
            blocks[key] = mesh;
            blockMeshes.push(mesh);
            scene.add(mesh);
        }

        // ─── Key drop spawn ───────────────────────────────────────────────────
        function spawnKeyDrop(wx, wy, wz, prime, keyIndex) {
            var drop = window.FourWayVertex.createFourWayVertexGroup(wx, wy, wz, keyIndex, {
                radius:       CLUSTER_RADIUS,
                keyDropIndex: keyDrops.length
            });
            scene.add(drop.group);
            keyDrops.push(drop);
        }

        // ─── Hover state ──────────────────────────────────────────────────────
        var hoveredKeyDrop    = null;
        var HOVER_SHININESS   = 200;
        var HOVER_SPECULAR    = 0xaaccff;
        var DEFAULT_SHININESS = 100;
        var DEFAULT_SPECULAR  = 0x111111;

        function resetClusterHoverEffect(drop) {
            if (!drop) return;
            drop.group.scale.set(1, 1, 1);
            for (var c = 0; c < drop.group.children.length; c++) {
                var child = drop.group.children[c];
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
                var ch = keyDrops[i].group.children;
                for (var c = 0; c < ch.length; c++) list.push(ch[c]);
            }
            return list;
        }

        // ─── Tooltip ──────────────────────────────────────────────────────────
        var tooltip = document.createElement('div');
        tooltip.setAttribute('id', 'vault-orb-tooltip');
        tooltip.style.cssText = 'position:absolute;left:0;top:0;background:rgba(102,126,234,0.95);color:white;padding:10px 15px;border-radius:8px;pointer-events:none;z-index:10;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:none;max-width:280px;';
        container.appendChild(tooltip);

        // ─── Inter-child repulsion (cross-drop) ───────────────────────────────
        // Prevents arm orbs from different key drops from clipping through each other.
        // FIX: tempVec now declared; damping now applied to push vector, not position.
        var REPULSION_RADIUS = 0.45;
        var REPULSION_FACTOR = 0.35;

        function applyInterChildRepulsion() {
            if (keyDrops.length < 2) return;
            var dropA, dropB, childA, childB;
            var dx, dy, dz, distSq, dist, overlap, nx, ny, nz, push;

            for (var i = 0; i < keyDrops.length; i++) {
                dropA = keyDrops[i];
                if (dropA.expansionProgress < 1) continue;

                for (var j = i + 1; j < keyDrops.length; j++) {
                    dropB = keyDrops[j];
                    if (dropB.expansionProgress < 1) continue;

                    for (var ca = 0; ca < dropA.group.children.length; ca++) {
                        childA = dropA.group.children[ca];
                        childA.getWorldPosition(worldPosVortex);

                        for (var cb = 0; cb < dropB.group.children.length; cb++) {
                            childB = dropB.group.children[cb];
                            childB.getWorldPosition(tempVec); // FIX: tempVec now exists

                            dx = tempVec.x - worldPosVortex.x;
                            dy = tempVec.y - worldPosVortex.y;
                            dz = tempVec.z - worldPosVortex.z;
                            distSq = dx*dx + dy*dy + dz*dz;
                            if (distSq >= REPULSION_RADIUS * REPULSION_RADIUS * 4) continue;

                            dist    = Math.sqrt(distSq) || 0.001;
                            overlap = (REPULSION_RADIUS * 2) - dist;
                            if (overlap <= 0) continue;

                            nx = dx / dist;
                            ny = dy / dist;
                            nz = dz / dist;
                            // FIX: damp the push magnitude, not child.position itself
                            // (multiplying child.position would pull it toward origin)
                            push = overlap * REPULSION_FACTOR * 0.85;

                            childA.position.x -= nx * push;
                            childA.position.y -= ny * push;
                            childA.position.z -= nz * push;

                            childB.position.x += nx * push;
                            childB.position.y += ny * push;
                            childB.position.z += nz * push;
                        }
                    }
                }
            }
        }

        // ─── Mouse move ───────────────────────────────────────────────────────
        function onMouseMove(event) {
            var rect = renderer.domElement.getBoundingClientRect();
            mouse.x =  ((event.clientX - rect.left) / rect.width)  *  2 - 1;
            mouse.y = -((event.clientY - rect.top)  / rect.height) *  2 + 1;
            raycaster.setFromCamera(mouse, camera);
            var orbMeshes = getOrbMeshesForRaycast();
            var hits = raycaster.intersectObjects(orbMeshes, false);
            if (hits.length > 0) {
                var intersected = hits[0].object;
                var dropIndex   = intersected.userData.keyDropIndex;
                var drop = (dropIndex !== undefined && keyDrops[dropIndex]) ? keyDrops[dropIndex] : null;
                if (drop && hoveredKeyDrop !== drop) {
                    if (hoveredKeyDrop) resetClusterHoverEffect(hoveredKeyDrop);
                    hoveredKeyDrop = drop;
                    for (var c = 0; c < drop.group.children.length; c++) {
                        var child = drop.group.children[c];
                        if (child.material) {
                            child.material.emissiveIntensity = 1.0;
                            child.material.shininess = HOVER_SHININESS;
                            if (child.material.specular) child.material.specular.setHex(HOVER_SPECULAR);
                        }
                    }
                    drop.group.scale.set(1.5, 1.5, 1.5);
                    var q    = window.HurwitzKeys ? window.HurwitzKeys.getKey(drop.prime, drop.keyIndex) : null;
                    var qStr = q ? '(' + q.a + ',' + q.b + ',' + q.c + ',' + q.d + ')' : '—';
                    var bp   = drop.basePosition;
                    tooltip.innerHTML = '<strong>Key #' + drop.keyIndex + '</strong> (p=' + drop.prime + ') 336 four-way<br>Quaternion: ' + qStr + '<br>Position: (' + bp.x.toFixed(2) + ', ' + bp.y.toFixed(2) + ', ' + bp.z.toFixed(2) + ')';
                    tooltip.style.display = 'block';
                }
                if (drop) {
                    var cr = container.getBoundingClientRect();
                    tooltip.style.left = (event.clientX - cr.left + 50) + 'px';
                    tooltip.style.top  = (event.clientY - cr.top  - 10) + 'px';
                }
            } else {
                if (hoveredKeyDrop) { resetClusterHoverEffect(hoveredKeyDrop); hoveredKeyDrop = null; }
                tooltip.style.display = 'none';
            }
        }
        renderer.domElement.addEventListener('mousemove', onMouseMove);

        // ─── World build ──────────────────────────────────────────────────────
        function buildWorld() {
            for (var i = -4; i <= 4; i++) {
                for (var j = -4; j <= 4; j++) {
                    setBlock(i, 0, j, BLOCK.GROUND);
                    setBlock(i, 1, j, BLOCK.KEY_ORE_P5);
                }
            }
        }
        buildWorld();

        function worldToSlotIndex(bx, bz) {
            return (4 - bz) * 9 + (bx + 4);
        }

        // ─── Click handler ────────────────────────────────────────────────────
        function onPointerClick(event) {
            var rect = renderer.domElement.getBoundingClientRect();
            mouse.x =  ((event.clientX - rect.left) / rect.width)  *  2 - 1;
            mouse.y = -((event.clientY - rect.top)  / rect.height) *  2 + 1;
            raycaster.setFromCamera(mouse, camera);
            var hits = raycaster.intersectObjects(blockMeshes, true);
            if (hits.length === 0) return;
            var obj = hits[0].object;
            var bt  = obj.userData.blockType;
            if (bt !== BLOCK.KEY_ORE_P5 && bt !== BLOCK.KEY_ORE_P13) return;

            var bx       = obj.userData.bx;
            var by       = obj.userData.by;
            var bz       = obj.userData.bz;
            var prime    = obj.userData.prime;
            var keyIndex = obj.userData.keyIndex;

            setBlock(bx, by, bz, BLOCK.AIR);
            spawnKeyDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE + BLOCK_SIZE * 0.5, bz * BLOCK_SIZE, prime, keyIndex);
            updateKeyLabel(null);

            var vaultMode   = document.getElementById('vault-mode');
            var vaultBase   = document.getElementById('vault-base-url');
            var vaultKey    = document.getElementById('vault-api-key');
            var vaultStatus = document.getElementById('vault-status');
            if (vaultMode && vaultMode.checked && vaultBase && vaultKey) {
                var base   = (vaultBase.value || '').replace(/\/$/, '');
                var apiKey = vaultKey.value;
                if (base && apiKey) {
                    var slotIndex = worldToSlotIndex(bx, bz);
                    if (vaultStatus) vaultStatus.textContent = 'Requesting…';
                    if (labelEl)     labelEl.textContent     = 'Vault: Requesting key for slot ' + slotIndex + '…';
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
                    }).then(function (result) {
                        if (result.ok && result.data && result.data.keyReleased) {
                            if (vaultStatus) vaultStatus.textContent = 'Key released slot ' + slotIndex;
                            if (labelEl)     labelEl.textContent     = 'Vault: Key released for slot ' + slotIndex + '. ' + (result.data.hasPayload ? 'Payload present.' : '');
                        } else {
                            if (vaultStatus) vaultStatus.textContent = 'Request denied';
                            if (labelEl)     labelEl.textContent     = 'Vault: ' + ((result.data && (result.data.message || result.data.error)) || 'Request denied');
                        }
                    }).catch(function (err) {
                        if (vaultStatus) vaultStatus.textContent = 'Request failed';
                        if (labelEl)     labelEl.textContent     = 'Vault: ' + (err.message || 'Request failed');
                    });
                }
            }
        }
        renderer.domElement.addEventListener('click', onPointerClick);

        // ─── Label ────────────────────────────────────────────────────────────
        var labelEl = document.getElementById('game-key-label');
        function updateKeyLabel(drop) {
            if (!labelEl) return;
            if (drop) {
                var k = window.HurwitzKeys.getKey(drop.prime, drop.keyIndex);
                var q = k ? '(' + k.a + ',' + k.b + ',' + k.c + ',' + k.d + ')' : '';
                labelEl.textContent = 'Key #' + drop.keyIndex + ' (p=13, 336 four-way) ' + q + ' — click key ore to mine';
            } else {
                labelEl.textContent = keyDrops.length + ' key drop(z) [336 four-way]. Click key ore (glowing blockz) to mine.';
            }
        }
        updateKeyLabel(null);

        // ─── Animate ──────────────────────────────────────────────────────────
        function animate() {
            requestAnimationFrame(animate);
            time += 0.02;

            var idx, phase, rotationAngle, style, hue, sat, light, wobble, scale;
            var c, child, b, blockMesh, dist, minDist;

            // Animate ore block glow
            for (idx = 0; idx < blockMeshes.length; idx++) {
                var m = blockMeshes[idx];
                if (m.userData.blockType !== BLOCK.KEY_ORE_P5 && m.userData.blockType !== BLOCK.KEY_ORE_P13) continue;
                var bp = m.position;
                phase        = (m.userData.keyIndex / (m.userData.prime === 5 ? TOTAL_P5 : TOTAL_P13)) * Math.PI * 2;
                rotationAngle = time + phase;
                style = styling.calculateUnifiedStyle(m.userData.keyIndex, time, rotationAngle, bp);
                hue   = (m.userData.keyIndex / (m.userData.prime === 5 ? TOTAL_P5 : TOTAL_P13));
                sat   = 0.7  * (0.8 + style.glowIntensity * 0.4);
                light = 0.55 * (0.9 + style.lightingFactor * 0.2);
                m.material.color.setHSL(hue, sat, light);
                m.material.emissive.setHSL(hue, 0.7, style.glowIntensity * 2);
                m.material.emissiveIntensity = 0.15 + style.glowIntensity * 0.4;
            }

            // Animate key drops
            for (idx = 0; idx < keyDrops.length; idx++) {
                var d       = keyDrops[idx];
                var basePos = d.basePosition;

                phase        = (d.keyIndex / d.total) * Math.PI * 2;
                rotationAngle = time + phase;
                style = styling.calculateUnifiedStyle(d.keyIndex, time, rotationAngle, basePos);

                wobble = style.noiseFactor * 0.08;
                d.group.position.x = basePos.x + Math.sin(time * 0.7 + idx)        * wobble;
                d.group.position.y = basePos.y + Math.cos(time * 1.1 + idx * 0.5)  * wobble;
                d.group.position.z = basePos.z + Math.sin(time * 0.6 + idx * 0.3)  * wobble;

                // Expansion animation
                if (d.expansionProgress < 1) {
                    d.expansionProgress = Math.min(1, d.expansionProgress + (d.expansionSpeed || 0.03));
                    var eased = 1 - Math.pow(1 - d.expansionProgress, 2);
                    for (c = 0; c < d.group.children.length; c++) {
                        child = d.group.children[c];
                        var baseLocal = child.userData.baseLocalPosition;
                        if (!baseLocal) continue;
                        child.position.set(baseLocal.x * eased, baseLocal.y * eased, baseLocal.z * eased);
                    }
                } else {
                    // Orbital micro-motion
                    var orbitRadius = 0.12;
                    var baseLocal, satIdx, orbitSpeed, orbitX, orbitY, orbitZ;
                    for (c = 0; c < d.group.children.length; c++) {
                        child = d.group.children[c];
                        baseLocal = child.userData.baseLocalPosition;
                        if (!baseLocal) continue;
                        satIdx       = child.userData.satelliteIndex;
                        phase        = (satIdx / d.total) * Math.PI * 2;
                        rotationAngle = time + phase;
                        style = styling.calculateUnifiedStyle(satIdx, time, rotationAngle, basePos);
                        orbitSpeed = 0.5 * (style.teslaMultiplier || 1);
                        orbitX = Math.cos(time * orbitSpeed        + (style.teslaPhase || 0)) * orbitRadius * style.noiseFactor;
                        orbitY = Math.sin(time * orbitSpeed * 1.3  + (style.teslaPhase || 0)) * orbitRadius * style.noiseFactor;
                        orbitZ = Math.cos(time * orbitSpeed * 0.7  + (style.teslaPhase || 0)) * orbitRadius * style.noiseFactor;
                        child.position.set(baseLocal.x + orbitX, baseLocal.y + orbitY, baseLocal.z + orbitZ);
                    }
                }

                // ── BOUNCE PASS ──────────────────────────────────────────────
                // Handles two collision types:
                //   1. Arm vs ORE  — sphere-vs-sphere using BOUNCE_RADIUS_336
                //   2. Arm vs GROUND 9x9 — sphere-vs-AABB using face-normal
                //
                // Key principles:
                //   • ARM_RADIUS added to ore radius so arm thickness is respected
                //   • AABB closest-point gives the correct surface normal for any face
                //   • bounced flag: break after first collision — no double-bounce
                //   • previousWorldPosition only updated when NOT bouncing
                // ─────────────────────────────────────────────────────────────
                d.group.updateMatrixWorld(true);
                groupInvWorld.getInverse(d.group.matrixWorld);
                var half = BLOCK_SIZE * 0.5; // half-extent of a block = 0.5
                var prevWorld, bounced;

                for (c = 0; c < d.group.children.length; c++) {
                    child = d.group.children[c];
                    child.getWorldPosition(worldPosVortex);

                    prevWorld = child.userData.previousWorldPosition;
                    if (!prevWorld) {
                        child.userData.previousWorldPosition = worldPosVortex.clone();
                        prevWorld = child.userData.previousWorldPosition;
                    }

                    bounced = false;

                    for (b = 0; b < blockMeshes.length; b++) {
                        blockMesh = blockMeshes[b];
                        var bt = blockMesh.userData.blockType;

                        if (bt === BLOCK.KEY_ORE_P5 || bt === BLOCK.KEY_ORE_P13) {
                            // ── Sphere vs sphere (ore) ────────────────────────
                            dist = worldPosVortex.distanceTo(blockMesh.position);
                            var oreRadius = BOUNCE_RADIUS_336 + ARM_RADIUS;
                            if (dist < oreRadius && dist > 0.001) {
                                bouncePushDir.copy(worldPosVortex).sub(blockMesh.position).normalize();
                                surfacePointVortex.copy(blockMesh.position).add(
                                    bouncePushDir.clone().multiplyScalar(oreRadius)
                                );
                                velocityVortex.copy(worldPosVortex).sub(prevWorld).reflect(bouncePushDir);
                                correctedWorldVortex.copy(surfacePointVortex).add(
                                    velocityVortex.multiplyScalar(BOUNCE_BACK_FACTOR)
                                );
                                child.position.copy(correctedWorldVortex).applyMatrix4(groupInvWorld);
                                prevWorld.copy(correctedWorldVortex);
                                bounced = true;
                                break;
                            }

                        } else if (bt === BLOCK.GROUND) {
                            // ── Sphere vs AABB (9x9 ground blocks) ───────────
                            // Closest point on block's AABB to the arm center
                            var bpx = blockMesh.position.x;
                            var bpy = blockMesh.position.y;
                            var bpz = blockMesh.position.z;
                            var cx2 = Math.max(bpx - half, Math.min(worldPosVortex.x, bpx + half));
                            var cy2 = Math.max(bpy - half, Math.min(worldPosVortex.y, bpy + half));
                            var cz2 = Math.max(bpz - half, Math.min(worldPosVortex.z, bpz + half));

                            var dx = worldPosVortex.x - cx2;
                            var dy = worldPosVortex.y - cy2;
                            var dz = worldPosVortex.z - cz2;
                            var penetration = Math.sqrt(dx*dx + dy*dy + dz*dz);

                            if (penetration < ARM_RADIUS && penetration > 0.0001) {
                                // Normal points from AABB surface toward arm center
                                bouncePushDir.set(dx, dy, dz).divideScalar(penetration);
                                surfacePointVortex.set(cx2, cy2, cz2).add(
                                    bouncePushDir.clone().multiplyScalar(ARM_RADIUS)
                                );
                                velocityVortex.copy(worldPosVortex).sub(prevWorld).reflect(bouncePushDir);
                                correctedWorldVortex.copy(surfacePointVortex).add(
                                    velocityVortex.multiplyScalar(BOUNCE_BACK_FACTOR)
                                );
                                child.position.copy(correctedWorldVortex).applyMatrix4(groupInvWorld);
                                prevWorld.copy(correctedWorldVortex);
                                bounced = true;
                                break;
                            }
                        }
                    }

                    // Only advance history when no collision — keeps velocity accurate
                    if (!bounced) {
                        prevWorld.copy(worldPosVortex);
                    }
                }
                // ── END BOUNCE PASS ──────────────────────────────────────────

                // Non-hovered glow/color update
                if (hoveredKeyDrop !== d) {
                    phase        = (d.keyIndex / d.total) * Math.PI * 2;
                    rotationAngle = time + phase;
                    style = styling.calculateUnifiedStyle(d.keyIndex, time, rotationAngle, basePos);
                    hue   = (time * 0.1 + d.keyIndex * 0.1) % 1;
                    hue   = hue < 0 ? hue + 1 : hue;
                    sat   = 0.7 * (0.8 + style.glowIntensity * 0.4);
                    light = 0.6 * (0.9 + style.lightingFactor * 0.2);
                    var baseIntensity = 0.3 + style.glowIntensity * 0.5;
                    var t, factor;
                    for (c = 0; c < d.group.children.length; c++) {
                        child = d.group.children[c];
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

            // FIX: repulsionFrame now at module level — correctly throttles every 4 frames
            repulsionFrame++;
            if (repulsionFrame % 4 === 0) {
                applyInterChildRepulsion();
            }

            controls.update();
            renderer.render(scene, camera);
        }

        animate();

        // ─── Vault config panel ───────────────────────────────────────────────
        var DEFAULT_CONFIG = {
            id:            'signature',
            name:          'Key-at-zero, 144 Hurwitz moat, unlocked key moat',
            tier:          'signature',
            crownSlotIndex: 0,
            moatLayers:    [
                { kind: 'hurwitz',          points: 144, role: 'guard'   },
                { kind: 'unlocked_key_moat',             role: 'orbital' }
            ],
            slotRoles: { '0': 'crown' }
        };

        var vaultConfigBase    = document.getElementById('vault-config-base');
        var vaultConfigKey     = document.getElementById('vault-config-key');
        var loadDefaultConfigBtn = document.getElementById('load-default-config');
        var vaultConfigStatus  = document.getElementById('vault-config-status');
        var vaultConfigName    = document.getElementById('vault-config-name');
        var vaultConfigTier    = document.getElementById('vault-config-tier');
        var vaultConfigCrown   = document.getElementById('vault-config-crown');
        var vaultConfigMoat    = document.getElementById('vault-config-moat');
        var currentVaultConfig = null;

        function applyConfigToPanel(config, fromApi) {
            if (!config || !config.id) return;
            currentVaultConfig = config;
            if (vaultConfigName)   vaultConfigName.textContent   = config.name  || config.id;
            if (vaultConfigTier)   vaultConfigTier.textContent   = config.tier  || '—';
            if (vaultConfigCrown)  vaultConfigCrown.textContent  = String(config.crownSlotIndex ?? '—');
            var moatLabel = '';
            if (config.moatLayers && config.moatLayers.length) {
                moatLabel = config.moatLayers.map(function (ml) {
                    return ml.kind + (ml.points ? '(' + ml.points + ')' : '');
                }).join(', ');
            }
            if (vaultConfigMoat)   vaultConfigMoat.textContent   = moatLabel || '—';
            if (vaultConfigStatus) vaultConfigStatus.textContent = fromApi ? 'Loaded' : 'Loaded (default)';
        }

        if (loadDefaultConfigBtn) {
            loadDefaultConfigBtn.addEventListener('click', function () {
                var base   = (vaultConfigBase && vaultConfigBase.value ? vaultConfigBase.value : '').trim().replace(/\/$/, '');
                if (!base) base = window.location.origin;
                var apiKey = (vaultConfigKey && vaultConfigKey.value) ? vaultConfigKey.value : 'vault-demo-key-change-in-production';
                var pageSecure = window.location.protocol === 'https:';
                var baseSecure = base.indexOf('https:') === 0;
                if (pageSecure && !baseSecure) { applyConfigToPanel(DEFAULT_CONFIG, false); return; }
                if (vaultConfigStatus) vaultConfigStatus.textContent = 'Loading…';
                fetch(base + '/api/vault/configs/default', {
                    method: 'GET',
                    headers: { 'X-Vault-Api-Key': apiKey }
                }).then(function (res) {
                    return res.text().then(function (text) {
                        var data;
                        try { data = text ? JSON.parse(text) : {}; } catch (e) { data = {}; }
                        return { ok: res.ok && data && data.id, data: data };
                    });
                }).then(function (result) {
                    applyConfigToPanel(result.ok && result.data.id ? result.data : DEFAULT_CONFIG, !!result.ok);
                }).catch(function () {
                    applyConfigToPanel(DEFAULT_CONFIG, false);
                });
            });
        }

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
