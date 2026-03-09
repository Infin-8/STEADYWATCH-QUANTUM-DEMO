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
            var geom = new THREE.SphereGeometry(0.25, 16, 16);
            var mat = new THREE.MeshPhongMaterial({
                color: col,
                emissive: col,
                emissiveIntensity: 0.4,
                shininess: 100
            });
            var mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(wx, wy, wz);
            mesh.userData.prime = prime;
            mesh.userData.keyIndex = keyIndex;
            mesh.userData.basePosition = new THREE.Vector3(wx, wy, wz);
            scene.add(mesh);
            keyDrops.push({
                mesh: mesh,
                prime: prime,
                keyIndex: keyIndex,
                total: total,
                basePosition: new THREE.Vector3(wx, wy, wz)
            });
        }

        // --- Hover effects and tooltips for key drop orbs (like 144-satellites) ---
        var hoveredOrbMesh = null;
        var HOVER_SHININESS = 200;
        var HOVER_SPECULAR = 0xaaccff;
        var DEFAULT_SHININESS = 100;
        var DEFAULT_SPECULAR = 0x111111;

        function resetOrbHoverEffect(mesh) {
            if (!mesh || !mesh.material) return;
            mesh.material.emissiveIntensity = 0.4;
            mesh.material.shininess = DEFAULT_SHININESS;
            if (mesh.material.specular) mesh.material.specular.setHex(DEFAULT_SPECULAR);
            mesh.scale.set(1, 1, 1);
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
            var orbMeshes = keyDrops.map(function (d) { return d.mesh; });
            var hits = raycaster.intersectObjects(orbMeshes, false);
            if (hits.length > 0) {
                var intersected = hits[0].object;
                if (hoveredOrbMesh !== intersected) {
                    if (hoveredOrbMesh) resetOrbHoverEffect(hoveredOrbMesh);
                    hoveredOrbMesh = intersected;
                    intersected.material.emissiveIntensity = 1.0;
                    intersected.material.shininess = HOVER_SHININESS;
                    if (intersected.material.specular) intersected.material.specular.setHex(HOVER_SPECULAR);
                    intersected.scale.set(1.5, 1.5, 1.5);
                    var drop = keyDrops.filter(function (d) { return d.mesh === intersected; })[0];
                    var q = window.HurwitzKeys && drop ? window.HurwitzKeys.getKey(drop.prime, drop.keyIndex) : null;
                    var qStr = q ? '(' + q.a + ',' + q.b + ',' + q.c + ',' + q.d + ')' : '—';
                    tooltip.innerHTML = '<strong>Key #' + (drop ? drop.keyIndex : '') + '</strong> (p=' + (drop ? drop.prime : '') + ')<br>Quaternion: ' + qStr + '<br>Position: (' + intersected.position.x.toFixed(2) + ', ' + intersected.position.y.toFixed(2) + ', ' + intersected.position.z.toFixed(2) + ')';
                    tooltip.style.display = 'block';
                    var cr = container.getBoundingClientRect();
                    tooltip.style.left = (event.clientX - cr.left + 10) + 'px';
                    tooltip.style.top = (event.clientY - cr.top - 10) + 'px';
                } else {
                    var cr = container.getBoundingClientRect();
                    tooltip.style.left = (event.clientX - cr.left + 10) + 'px';
                    tooltip.style.top = (event.clientY - cr.top - 10) + 'px';
                }
            } else {
                if (hoveredOrbMesh) {
                    resetOrbHoverEffect(hoveredOrbMesh);
                    hoveredOrbMesh = null;
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
                    }).then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
                      .then(function (result) {
                          if (result.ok && result.data.keyReleased) {
                              if (vaultStatus) vaultStatus.textContent = 'Key released slot ' + slotIndex;
                              if (labelEl) labelEl.textContent = 'Vault: Key released for slot ' + slotIndex + '. ' + (result.data.hasPayload ? 'Payload present.' : '');
                          } else {
                              if (vaultStatus) vaultStatus.textContent = 'Request denied';
                              if (labelEl) labelEl.textContent = 'Vault: ' + (result.data.message || result.data.error || 'Request denied');
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
                d.mesh.position.x = basePos.x + Math.sin(time * 0.7 + idx) * wobble;
                d.mesh.position.y = basePos.y + Math.cos(time * 1.1 + idx * 0.5) * wobble;
                d.mesh.position.z = basePos.z + Math.sin(time * 0.6 + idx * 0.3) * wobble;
                if (hoveredOrbMesh !== d.mesh) {
                    hue = (d.keyIndex / d.total);
                    sat = 0.7 * (0.8 + style.glowIntensity * 0.4);
                    light = 0.6 * (0.9 + style.lightingFactor * 0.2);
                    d.mesh.material.color.setHSL(hue, sat, light);
                    d.mesh.material.emissive.setHSL(hue, 0.7, style.glowIntensity * 2);
                    d.mesh.material.emissiveIntensity = 0.3 + style.glowIntensity * 0.5;
                    scale = 0.95 + style.noiseFactor * 0.1;
                    d.mesh.scale.set(scale, scale, scale);
                }
            }

            controls.update();
            renderer.render(scene, camera);
        }

        animate();

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
