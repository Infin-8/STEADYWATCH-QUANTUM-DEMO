/**
 * Keyz Game — Minimal voxel: key ore blocks (p=5, p=13), break → key drop orbs.
 * Uses HurwitzKeys, UnifiedQubitStyling. Three.js r128 + OrbitControls.
 */
(function () {
    'use strict';

    var BLOCK = { AIR: 0, GROUND: 1, KEY_ORE_P5: 2, KEY_ORE_P13: 3 };
    var BLOCK_SIZE = 1;
    var TOTAL_P5 = 144;
    var TOTAL_P13 = 336;
    var CLUSTER_RADIUS = 0.5;
    var AVOID_NEAR = 0.55;
    var AVOID_FAR = 0.55;
    var BOUNCE_RADIUS = 0.58;
    var BOUNCE_RADIUS_BASE_EXPANDED = 0.72;
    var BOUNCE_BACK_FACTOR = 0.4;
    var SPHERE_COLLISION_RADIUS = 0.08;
    var SPHERE_COLLISION_DAMPING = 0.6;

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
        var geometry = new THREE.BoxGeometry(BLOCK_SIZE * 0.98, BLOCK_SIZE * 0.98, BLOCK_SIZE * 0.98);
        var material;
        var prime = blockType === BLOCK.KEY_ORE_P5 ? 5 : blockType === BLOCK.KEY_ORE_P13 ? 13 : 0;
        var keyIndex = (blockType === BLOCK.KEY_ORE_P5 || blockType === BLOCK.KEY_ORE_P13)
            ? hashKeyIndex(bx, bz, prime) : 0;

        if (blockType === BLOCK.GROUND) {
            material = new THREE.MeshPhongMaterial({
                color: 0x4a3728,
                shininess: 20,
                flatShading: true
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
        camera.position.set(6, 6, 6);
        camera.lookAt(0, 0, 0);

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

        var ambientLight = new THREE.AmbientLight(0x667eea, 0.4);
        scene.add(ambientLight);
        var pointLight1 = new THREE.PointLight(0x667eea, 1, 80);
        pointLight1.position.set(12, 12, 12);
        scene.add(pointLight1);
        var pointLight2 = new THREE.PointLight(0x764ba2, 0.8, 80);
        pointLight2.position.set(-12, 12, -12);
        scene.add(pointLight2);

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
                for (var c = 0; c < children.length; c++) list.push(children[c]);
            }
            return list;
        }

        var tooltip = document.createElement('div');
        tooltip.setAttribute('id', 'vault-orb-tooltip');
        tooltip.style.cssText = 'position:absolute;left:0;top:0;background:rgba(102,126,234,0.95);color:white;padding:10px 15px;border-radius:8px;pointer-events:none;z-index:10;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:none;max-width:280px;';
        container.appendChild(tooltip);

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
                    tooltip.style.left = (event.clientX - cr.left + 10) + 'px';
                    tooltip.style.top = (event.clientY - cr.top - 10) + 'px';
                } else if (drop) {
                    var cr = container.getBoundingClientRect();
                    tooltip.style.left = (event.clientX - cr.left + 10) + 'px';
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

        function buildWorld() {
            var i, j;
            for (i = -4; i <= 4; i++) {
                for (j = -4; j <= 4; j++) {
                    setBlock(i, 0, j, BLOCK.GROUND);
                }
            }
            for (i = -4; i <= 4; i++) {
                for (j = -4; j <= 4; j++) {
                    setBlock(i, 1, j, BLOCK.KEY_ORE_P5);
                }
            }
        }

        buildWorld();

        function worldToSlotIndex(bx, bz) {
            var row = 4 - bz;
            var col = bx + 4;
            return row * 9 + col;
        }

        function onPointerClick(event) {
            var rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            var hits = raycaster.intersectObjects(blockMeshes, true);
            if (hits.length === 0) return;
            var hit = hits[0];
            var obj = hit.object;
            var bt = obj.userData.blockType;
            if (bt !== BLOCK.KEY_ORE_P5 && bt !== BLOCK.KEY_ORE_P13) return;
            var bx = obj.userData.bx;
            var by = obj.userData.by;
            var bz = obj.userData.bz;
            var prime = obj.userData.prime;
            var keyIndex = obj.userData.keyIndex;
            setBlock(bx, by, bz, BLOCK.AIR);
            var wx = bx * BLOCK_SIZE;
            var wy = by * BLOCK_SIZE + BLOCK_SIZE * 0.5;
            var wz = bz * BLOCK_SIZE;
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

            var idx, phase, rotationAngle, style, hue, sat, light, wobble, scale;

            for (idx = 0; idx < blockMeshes.length; idx++) {
                var m = blockMeshes[idx];
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
                    var orbitRadius = 0.12;
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
                groupInvWorld.getInverse(d.group.matrixWorld);
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
                    posA = childA.userData.worldPos;
                    prevA = childA.userData.previousWorldPosition;
                    if (!posA || !prevA) continue;
                    for (j = i + 1; j < children.length; j++) {
                        childB = children[j];
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
                    worldPos = child.userData.worldPos;
                    if (!worldPos) continue;
                    child.position.copy(worldPos).applyMatrix4(groupInvWorld);
                }

                if (hoveredKeyDrop !== d) {
                    phase = (d.keyIndex / d.total) * Math.PI * 2;
                    rotationAngle = time + phase;
                    style = styling.calculateUnifiedStyle(d.keyIndex, time, rotationAngle, basePos);
                    hue = (time * 0.1 + d.keyIndex * 0.1) % 1;
                    hue = hue < 0 ? hue + 1 : hue;
                    sat = 0.7 * (0.8 + style.glowIntensity * 0.4);
                    light = 0.6 * (0.9 + style.lightingFactor * 0.2);
                    var baseIntensity = 0.3 + style.glowIntensity * 0.5;
                    var b, blockMesh, minDist, dist, t, factor;
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
