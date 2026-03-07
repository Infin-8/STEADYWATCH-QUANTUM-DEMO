/**
 * 336 Hurwitz Key — Full Three.js Layers View
 * Left plane (seed), middle (cylinder of keys), right plane (wave).
 * Cylinder: golden-angle + Perlin + Tesla. All keys use UnifiedQubitStyling (animated glow/pulse like 144).
 *
 * Structural parallel: George Gamow quantum tunneling (alpha decay, 1928) — single source (left),
 * barrier/transition region (middle), emerged wave (right). See docs/research/LAYERS_336_GAMOW_TUNNELING.md.
 */
(function () {
    'use strict';

    // ========== Hurwitz quaternion math (port from test_hurwitz_quaternion_sieve.py) ==========

    function HurwitzQuaternion(a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }
    HurwitzQuaternion.prototype.norm = function () {
        return Math.round(this.a * this.a + this.b * this.b + this.c * this.c + this.d * this.d);
    };
    HurwitzQuaternion.prototype.key = function () {
        return this.a + ',' + this.b + ',' + this.c + ',' + this.d;
    };

    function generate24Units() {
        var units = [];
        units.push(new HurwitzQuaternion(1, 0, 0, 0));
        units.push(new HurwitzQuaternion(-1, 0, 0, 0));
        units.push(new HurwitzQuaternion(0, 1, 0, 0));
        units.push(new HurwitzQuaternion(0, -1, 0, 0));
        units.push(new HurwitzQuaternion(0, 0, 1, 0));
        units.push(new HurwitzQuaternion(0, 0, -1, 0));
        units.push(new HurwitzQuaternion(0, 0, 0, 1));
        units.push(new HurwitzQuaternion(0, 0, 0, -1));
        for (var sa = -1; sa <= 1; sa += 2) {
            for (var sb = -1; sb <= 1; sb += 2) {
                for (var sc = -1; sc <= 1; sc += 2) {
                    for (var sd = -1; sd <= 1; sd += 2) {
                        units.push(new HurwitzQuaternion(sa * 0.5, sb * 0.5, sc * 0.5, sd * 0.5));
                    }
                }
            }
        }
        var seen = {};
        var out = [];
        for (var u = 0; u < units.length; u++) {
            var k = units[u].key();
            if (!seen[k]) {
                seen[k] = true;
                out.push(units[u]);
            }
        }
        return out.slice(0, 24);
    }

    function quatMultiply(q, u) {
        var a = q.a * u.a - q.b * u.b - q.c * u.c - q.d * u.d;
        var b = q.a * u.b + q.b * u.a + q.c * u.d - q.d * u.c;
        var c = q.a * u.c - q.b * u.d + q.c * u.a + q.d * u.b;
        var d = q.a * u.d + q.b * u.c - q.c * u.b + q.d * u.a;
        a = Math.round(a * 2) / 2;
        b = Math.round(b * 2) / 2;
        c = Math.round(c * 2) / 2;
        d = Math.round(d * 2) / 2;
        return new HurwitzQuaternion(a, b, c, d);
    }

    function generateHurwitzPrimesNormP(primeP) {
        if (primeP === 2) {
            return generateHurwitzPrimesNorm2();
        }
        var solutions = [];
        var maxVal = Math.floor(Math.sqrt(primeP)) + 1;
        var a, b, c, dSq, d;
        for (a = -maxVal; a <= maxVal; a++) {
            for (b = -maxVal; b <= maxVal; b++) {
                for (c = -maxVal; c <= maxVal; c++) {
                    dSq = primeP - a * a - b * b - c * c;
                    if (dSq >= 0) {
                        d = Math.floor(Math.sqrt(dSq));
                        if (d * d === dSq) {
                            if (d === 0) {
                                solutions.push([a, b, c, 0]);
                            } else {
                                solutions.push([a, b, c, -d]);
                                solutions.push([a, b, c, d]);
                            }
                        }
                    }
                }
            }
        }
        var aHalf, bHalf, cHalf, dHalf;
        for (aHalf = -maxVal * 2; aHalf <= maxVal * 2; aHalf++) {
            a = aHalf / 2;
            for (bHalf = -maxVal * 2; bHalf <= maxVal * 2; bHalf++) {
                b = bHalf / 2;
                for (cHalf = -maxVal * 2; cHalf <= maxVal * 2; cHalf++) {
                    c = cHalf / 2;
                    dSq = primeP - a * a - b * b - c * c;
                    if (dSq >= 0) {
                        dHalf = Math.round(Math.sqrt(dSq * 4));
                        d = dHalf / 2;
                        if (Math.abs(a * a + b * b + c * c + d * d - primeP) < 0.001) {
                            solutions.push([a, b, c, d]);
                            solutions.push([a, b, c, -d]);
                        }
                    }
                }
            }
        }
        var units = generate24Units();
        var seen = {};
        var primes = [];
        for (var s = 0; s < solutions.length; s++) {
            var sol = solutions[s];
            var baseQ = new HurwitzQuaternion(sol[0], sol[1], sol[2], sol[3]);
            for (var u = 0; u < units.length; u++) {
                var qResult = quatMultiply(baseQ, units[u]);
                if (qResult.norm() === primeP) {
                    var k = qResult.key();
                    if (!seen[k]) {
                        seen[k] = true;
                        primes.push(qResult);
                    }
                }
            }
        }
        return primes;
    }

    function generateHurwitzPrimesNorm2() {
        var baseForms = [[1, 1, 0, 0], [1, 0, 1, 0], [1, 0, 0, 1], [0, 1, 1, 0], [0, 1, 0, 1], [0, 0, 1, 1]];
        var halfForms = [[0.5, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, -0.5], [0.5, 0.5, -0.5, 0.5], [0.5, 0.5, -0.5, -0.5], [0.5, -0.5, 0.5, 0.5], [0.5, -0.5, 0.5, -0.5], [0.5, -0.5, -0.5, 0.5], [0.5, -0.5, -0.5, -0.5]];
        var perms = [
            [0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 2, 3, 1], [0, 3, 1, 2], [0, 3, 2, 1],
            [1, 0, 2, 3], [1, 0, 3, 2], [1, 2, 0, 3], [1, 2, 3, 0], [1, 3, 0, 2], [1, 3, 2, 0],
            [2, 0, 1, 3], [2, 0, 3, 1], [2, 1, 0, 3], [2, 1, 3, 0], [2, 3, 0, 1], [2, 3, 1, 0],
            [3, 0, 1, 2], [3, 0, 2, 1], [3, 1, 0, 2], [3, 1, 2, 0], [3, 2, 0, 1], [3, 2, 1, 0]
        ];
        var seen = {};
        var primes = [];
        var allForms = baseForms.concat(halfForms);
        for (var f = 0; f < allForms.length; f++) {
            var form = allForms[f];
            for (var p = 0; p < perms.length; p++) {
                var perm = perms[p];
                for (var sa = -1; sa <= 1; sa += 2) {
                    for (var sb = -1; sb <= 1; sb += 2) {
                        for (var sc = -1; sc <= 1; sc += 2) {
                            for (var sd = -1; sd <= 1; sd += 2) {
                                var q = new HurwitzQuaternion(
                                    sa * form[perm[0]], sb * form[perm[1]], sc * form[perm[2]], sd * form[perm[3]]
                                );
                                if (q.norm() === 2) {
                                    var k = q.key();
                                    if (!seen[k]) {
                                        seen[k] = true;
                                        primes.push(q);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return primes;
    }

    function unzipSeed(primeP) {
        if (primeP === 2) return generateHurwitzPrimesNorm2();
        return generateHurwitzPrimesNormP(primeP);
    }

    // ========== 4D → 3D stereographic projection ==========
    function project4Dto3D(a, b, c, d, radius) {
        radius = radius == null ? 1 : radius;
        var n = Math.sqrt(a * a + b * b + c * c + d * d) || 1;
        a /= n; b /= n; c /= n; d /= n;
        var w = d;
        var scale = radius / (1 + Math.abs(w) * 0.15);
        return { x: a * scale, y: b * scale, z: c * scale, w: w };
    }

    // ========== Golden-angle + Perlin + Tesla (same as header-hurwitz-bg.js) ==========
    function hash(x) {
        var w = (x % 2147483647 + 2147483647) % 2147483647;
        w = ((w * 1103515245) + 12345) & 0x7fffffff;
        w = ((w * 1103515245) + 12345) & 0x7fffffff;
        return (w % 2000000000) / 1000000000.0 - 1.0;
    }
    function smoothstep(t) {
        t = Math.max(0, Math.min(1, t));
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    function perlin1D(x) {
        var x0 = Math.floor(x);
        var x1 = x0 + 1;
        var fx = x - x0;
        var t = smoothstep(fx);
        var g0 = hash(x0) * (x - x0);
        var g1 = hash(x1) * (x - x1);
        return (1 - t) * g0 + t * g1;
    }
    var teslaMultipliers = { base: 1, harmonic3: 1 / 3, harmonic6: 1 / 6 };
    function applyTesla(value, index) {
        var g = index % 3;
        var m = g === 0 ? teslaMultipliers.base : g === 1 ? teslaMultipliers.harmonic3 : teslaMultipliers.harmonic6;
        return value * m;
    }

    // Echo frequencies (SteadyWatch): 336 keys as samples of multi-frequency wave (same as layers-hurwitz-336.js)
    var echoFreqs = [1, 1 / 3, 1 / 6];
    var echoAmplitudes = [0.4, 0.25, 0.2];
    function echoWaveAtKey(index, time, totalKeys) {
        totalKeys = totalKeys || 336;
        var phi = (index / totalKeys) * Math.PI * 2;
        var sum = 0;
        for (var f = 0; f < echoFreqs.length; f++) {
            sum += echoAmplitudes[f] * Math.sin(time * echoFreqs[f] + phi * (f + 1));
        }
        return sum;
    }

    // UnifiedQubitStyling (same as 144-satellites, ES5)
    function UnifiedQubitStyling() {
        this.noiseState = { lastNoiseUpdateTime: 0, smoothedNoiseValue: 0, noiseSmoothingTimeConstant: 0.5 };
        this.shadowParams = { baseGlowIntensity: 0.15, glowIntensityRange: 0.12 };
        this.teslaMultipliers = { base: 1, harmonic3: 1 / 3, harmonic6: 1 / 6 };
    }
    UnifiedQubitStyling.prototype.hash = function (x) {
        var w = (x % 2147483647 + 2147483647) % 2147483647;
        w = ((w * 1103515245) + 12345) & 0x7fffffff;
        w = ((w * 1103515245) + 12345) & 0x7fffffff;
        return (w % 2000000000) / 1000000000 - 1;
    };
    UnifiedQubitStyling.prototype.smoothstep = function (t) {
        t = Math.max(0, Math.min(1, t));
        return t * t * t * (t * (t * 6 - 15) + 10);
    };
    UnifiedQubitStyling.prototype.lerp = function (a, b, t) { return a + (b - a) * t; };
    UnifiedQubitStyling.prototype.gradient = function (x, t) { return this.hash(x) * (t - x); };
    UnifiedQubitStyling.prototype.perlin1D = function (x) {
        x = x % 1000000;
        var x0 = Math.floor(x), x1 = x0 + 1, fx = x - x0;
        return this.lerp(this.gradient(x0, x), this.gradient(x1, x), this.smoothstep(fx));
    };
    UnifiedQubitStyling.prototype.generateNoise = function (time, freq) {
        freq = freq || 1;
        var v = this.perlin1D(time * freq * 0.5) * 0.6 + this.perlin1D(time * freq * 2) * 0.25 + this.perlin1D(time * freq * 4) * 0.15;
        return Math.max(-1, Math.min(1, v));
    };
    UnifiedQubitStyling.prototype.smoothNoiseWithTime = function (raw, cur, last, prev, tc) {
        var alpha = Math.min(1, (cur - last) / tc);
        return alpha * raw + (1 - alpha) * prev;
    };
    UnifiedQubitStyling.prototype.calculateLightingFactor = function (angle) { return (Math.cos(angle) + 1) / 2; };
    UnifiedQubitStyling.prototype.applyTeslaPattern = function (value, idx) {
        var m = idx % 3 === 0 ? this.teslaMultipliers.base : idx % 3 === 1 ? this.teslaMultipliers.harmonic3 : this.teslaMultipliers.harmonic6;
        return value * m;
    };
    UnifiedQubitStyling.prototype.calculateUnifiedStyle = function (idx, time, rotationAngle, basePosition) {
        var rawNoise = this.generateNoise(time, 0.25);
        var lastUpdate = this.noiseState.lastNoiseUpdateTime || time;
        var smoothed = this.smoothNoiseWithTime(rawNoise, time, lastUpdate, this.noiseState.smoothedNoiseValue, this.noiseState.noiseSmoothingTimeConstant);
        this.noiseState.smoothedNoiseValue = smoothed;
        this.noiseState.lastNoiseUpdateTime = time;
        var noiseFactor = 1 + smoothed * 0.05;
        var lightingFactor = this.calculateLightingFactor(rotationAngle);
        var glowIntensity = (this.shadowParams.baseGlowIntensity + lightingFactor * this.shadowParams.glowIntensityRange) * noiseFactor;
        glowIntensity = Math.max(0.12, Math.min(0.3, glowIntensity));
        return {
            noiseFactor: noiseFactor,
            glowIntensity: glowIntensity,
            lightingFactor: lightingFactor,
            teslaPhase: this.applyTeslaPattern(rotationAngle, idx),
            teslaMultiplier: this.applyTeslaPattern(1, idx)
        };
    };

    // ========== Three.js scene ==========
    function initLayers336Visualization(containerId) {
        var container = document.getElementById(containerId);
        if (!container || typeof THREE === 'undefined') return;

        var primeP = 13;
        var keys = unzipSeed(primeP);
        if (keys.length !== 336) keys = keys.slice(0, 336);

        var slitDistance = 8;
        var middleScale = 2.2;
        var rightWaveAmplitude = 2.5;
        var rightWaveScale = 0.018;

        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a1a);
        scene.fog = new THREE.Fog(0x0a0a1a, 20, 80);

        var width = container.clientWidth;
        var height = Math.max(container.clientHeight, 420);

        var camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 6, 18);
        camera.lookAt(0, 0, 0);

        var renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        var controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 8;
        controls.maxDistance = 50;

        var ambient = new THREE.AmbientLight(0x667eea, 0.5);
        scene.add(ambient);
        var light1 = new THREE.PointLight(0x667eea, 1, 80);
        light1.position.set(slitDistance, 10, 10);
        scene.add(light1);
        var light2 = new THREE.PointLight(0x764ba2, 0.8, 80);
        light2.position.set(-slitDistance, 10, -10);
        scene.add(light2);

        // Left plane: single seed
        var seedGeom = new THREE.SphereGeometry(0.4, 24, 24);
        var seedMat = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            emissive: 0xffd700,
            emissiveIntensity: 0.5,
            shininess: 80
        });
        var seedMesh = new THREE.Mesh(seedGeom, seedMat);
        seedMesh.position.set(-slitDistance, 0, 0);
        seedMesh.userData.type = 'seed';
        scene.add(seedMesh);

        var unifiedStyling = new UnifiedQubitStyling();
        var keySphereGeom = new THREE.SphereGeometry(0.12, 12, 12);

        // Middle: cylinder of keys as 336 meshes (golden-angle + Perlin), animated with UnifiedQubitStyling
        var goldenAngle = Math.PI * (3 - Math.sqrt(13));
        var pointCount = keys.length;
        var maxR = 0.52;
        var noiseScale = 0.5;
        var middleGroup = new THREE.Group();
        middleGroup.userData.type = 'middle';
        var middleKeys = [];
        for (var i = 0; i < keys.length; i++) {
            var theta = goldenAngle * i;
            var r = maxR * Math.sqrt((i + 1) / pointCount);
            var y0 = Math.cos(theta) * r;
            var z0 = Math.sin(theta) * r;
            var nx = perlin1D(i * 1.7);
            var ny = perlin1D(i * 2.3 + 500);
            var y = middleScale * (y0 + nx * noiseScale);
            var z = middleScale * (z0 + ny * noiseScale);
            var t = (i + 1) / (keys.length + 1);
            var x = -slitDistance + t * (2 * slitDistance);
            var basePos = new THREE.Vector3(x, y, z);
            var hue = (i / keys.length) * 0.7 + 0.55;
            var mat = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(hue, 0.75, 0.6),
                emissive: new THREE.Color().setHSL(hue, 0.7, 0.2),
                emissiveIntensity: 0.4,
                shininess: 100,
                transparent: true,
                opacity: 0.92
            });
            var mesh = new THREE.Mesh(keySphereGeom, mat);
            mesh.position.copy(basePos);
            mesh.userData.index = i;
            mesh.userData.basePosition = basePos;
            middleKeys.push(mesh);
            middleGroup.add(mesh);
        }
        scene.add(middleGroup);

        // Right plane: wave-like pattern as 336 meshes; base Y/Z stored for echo-wave offset in animate()
        var rightGroup = new THREE.Group();
        rightGroup.userData.type = 'right';
        var rightKeys = [];
        for (var j = 0; j < keys.length; j++) {
            var qr = keys[j];
            var phase = Math.atan2(qr.b + qr.c, qr.a + qr.d) + j * 0.1;
            var baseY = (j / keys.length - 0.5) * 2 * rightWaveAmplitude * 1.2;
            var baseZ = Math.sin(phase * 2) * rightWaveAmplitude + Math.cos(j * rightWaveScale * 200) * 0.8;
            var rx = slitDistance;
            var basePosR = new THREE.Vector3(rx, baseY, baseZ);
            var hueR = (j / keys.length) * 0.3 + 0.75;
            var matR = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(hueR, 0.8, 0.65),
                emissive: new THREE.Color().setHSL(hueR, 0.7, 0.15),
                emissiveIntensity: 0.4,
                shininess: 100,
                transparent: true,
                opacity: 0.9
            });
            var meshR = new THREE.Mesh(keySphereGeom, matR);
            meshR.position.copy(basePosR);
            meshR.userData.index = j;
            meshR.userData.basePosition = basePosR;
            meshR.userData.baseY = baseY;
            meshR.userData.baseZ = baseZ;
            rightKeys.push(meshR);
            rightGroup.add(meshR);
        }
        scene.add(rightGroup);

        // Optional: subtle plane guides at slit positions
        var planeGeom = new THREE.PlaneGeometry(0.3, 12, 1, 1);
        var planeMat = new THREE.MeshBasicMaterial({
            color: 0x667eea,
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide
        });
        var leftPlane = new THREE.Mesh(planeGeom, planeMat);
        leftPlane.position.set(-slitDistance, 0, 0);
        leftPlane.rotation.y = Math.PI / 2;
        scene.add(leftPlane);
        var rightPlane = new THREE.Mesh(planeGeom, planeMat);
        rightPlane.position.set(slitDistance, 0, 0);
        rightPlane.rotation.y = -Math.PI / 2;
        scene.add(rightPlane);

        // ---------- Schrödinger mode: drive spheres from 1D tunneling export ----------
        var schrodingerMode = false;
        var schrodingerData = null;
        var schrodingerDataUrl = 'data/schrodinger_tunneling_export.json';

        function smoothstepSchrod(t) {
            t = Math.max(0, Math.min(1, t));
            return t * t * t * (t * (t * 6 - 15) + 10);
        }
        function lerpSchrod(a, b, t) { return a + (b - a) * t; }

        function sampleDensityForRegions(data, timeIndex) {
            var x = data.x;
            var density = data.probability_density[timeIndex];
            if (!density || density.length !== x.length) return null;
            var params = data.metadata && data.metadata.params ? data.metadata.params : {};
            var xBarrierLeft = params.x_barrier_left != null ? params.x_barrier_left : 0;
            var xBarrierRight = params.x_barrier_right != null ? params.x_barrier_right : 2;
            var barrierLeftI = 0;
            var barrierRightI = x.length - 1;
            for (var i = 0; i < x.length; i++) {
                if (x[i] >= xBarrierLeft) { barrierLeftI = i; break; }
            }
            for (var i = x.length - 1; i >= 0; i--) {
                if (x[i] <= xBarrierRight) { barrierRightI = i; break; }
            }
            var wellSum = 0;
            for (i = 0; i < barrierLeftI; i++) wellSum += density[i];
            var dx = x.length > 1 ? (x[1] - x[0]) : 1;
            wellSum *= dx;

            function sampleAtIndices(startI, endI, count) {
                var out = [];
                for (var c = 0; c < count; c++) {
                    var fi = startI + (endI - startI) * (c / (count - 1 || 1));
                    var i0 = Math.floor(fi);
                    var i1 = Math.min(i0 + 1, density.length - 1);
                    var t = fi - i0;
                    out.push((1 - t) * density[i0] + t * (density[i1] || density[i0]));
                }
                return out;
            }
            var middleDensities = sampleAtIndices(barrierLeftI, barrierRightI, 336);
            var rightStart = Math.min(barrierRightI + 1, x.length - 1);
            var rightDensities = rightStart <= x.length - 1
                ? sampleAtIndices(rightStart, x.length - 1, 336)
                : Array(336).fill(0);
            return { wellSum: wellSum, middleDensities: middleDensities, rightDensities: rightDensities };
        }

        function interpolateDensitySamples(s0, s1, tSmooth) {
            if (!s0 || !s1) return s0 || s1;
            var mid = [];
            var right = [];
            for (var i = 0; i < 336; i++) {
                mid.push(lerpSchrod(s0.middleDensities[i], s1.middleDensities[i], tSmooth));
                right.push(lerpSchrod(s0.rightDensities[i], s1.rightDensities[i], tSmooth));
            }
            return {
                wellSum: lerpSchrod(s0.wellSum, s1.wellSum, tSmooth),
                middleDensities: mid,
                rightDensities: right
            };
        }

        function applySchrodingerDensity(sampled) {
            if (!sampled) return;
            var maxM = 0;
            var maxR = 0;
            for (var i = 0; i < 336; i++) {
                if (sampled.middleDensities[i] > maxM) maxM = sampled.middleDensities[i];
                if (sampled.rightDensities[i] > maxR) maxR = sampled.rightDensities[i];
            }
            maxM = maxM || 1;
            maxR = maxR || 1;
            var wellScale = Math.min(2, 0.3 + sampled.wellSum * 2);
            seedMesh.scale.setScalar(wellScale);
            seedMesh.material.emissiveIntensity = 0.4 + Math.min(0.5, sampled.wellSum * 3);
            for (var mi = 0; mi < middleKeys.length; mi++) {
                var s = Math.max(0.15, Math.min(1.5, (sampled.middleDensities[mi] / maxM) * 1.2));
                middleKeys[mi].scale.setScalar(s);
                middleKeys[mi].material.opacity = 0.3 + 0.65 * (sampled.middleDensities[mi] / maxM);
            }
            for (var ri = 0; ri < rightKeys.length; ri++) {
                var sr = Math.max(0.15, Math.min(1.5, (sampled.rightDensities[ri] / maxR) * 1.2));
                rightKeys[ri].scale.setScalar(sr);
                rightKeys[ri].material.opacity = 0.3 + 0.65 * (sampled.rightDensities[ri] / maxR);
            }
        }

        function resetSchrodingerScales() {
            seedMesh.scale.setScalar(1);
            for (var mi = 0; mi < middleKeys.length; mi++) {
                middleKeys[mi].scale.setScalar(1);
                middleKeys[mi].material.opacity = 0.92;
            }
            for (var ri = 0; ri < rightKeys.length; ri++) {
                rightKeys[ri].scale.setScalar(1);
                rightKeys[ri].material.opacity = 0.9;
            }
        }

        window.toggleLayers336SchrodingerMode = function () {
            schrodingerMode = !schrodingerMode;
            if (schrodingerMode && !schrodingerData) {
                fetch(schrodingerDataUrl)
                    .then(function (r) { return r.json(); })
                    .then(function (d) {
                        schrodingerData = d;
                        var cap = document.getElementById('layers-336-caption');
                        if (cap) cap.textContent = 'Schrödinger mode: Gamow-style 1D tunneling |ψ|² (data loaded).';
                    })
                    .catch(function () {
                        schrodingerMode = false;
                        var cap = document.getElementById('layers-336-caption');
                        if (cap) cap.textContent = 'Schrödinger data not found. Run quantum_computing/schrodinger_tunneling.py and place export in data/.';
                    });
            }
            if (!schrodingerMode) {
                resetSchrodingerScales();
                var cap = document.getElementById('layers-336-caption');
                if (cap) cap.textContent = 'left (seed) ——— tunnel of keyz ——— right (wave)';
            }
            var btn = document.getElementById('layers-336-schrodinger-btn');
            if (btn) {
                btn.textContent = schrodingerMode ? 'Schrödinger mode ON' : 'Schrödinger mode';
                btn.classList.toggle('active', schrodingerMode);
            }
        };

        var time = 0;
        var lastFrameTime = null;
        var schrodingerPlaybackSpeed = 0.8;

        function animate() {
            requestAnimationFrame(animate);
            var now = typeof performance !== 'undefined' ? performance.now() * 0.001 : time + 0.016;
            if (lastFrameTime != null) time += (now - lastFrameTime);
            lastFrameTime = now;
            controls.update();

            if (schrodingerMode && schrodingerData && schrodingerData.probability_density) {
                var numFrames = schrodingerData.probability_density.length;
                if (numFrames < 2) {
                    var sampled = sampleDensityForRegions(schrodingerData, 0);
                    applySchrodingerDensity(sampled);
                } else {
                    var framePos = (time * schrodingerPlaybackSpeed) % numFrames;
                    if (framePos < 0) framePos += numFrames;
                    var timeIndex0 = Math.floor(framePos) % numFrames;
                    var timeIndex1 = (timeIndex0 + 1) % numFrames;
                    var t = framePos - Math.floor(framePos);
                    var tSmooth = smoothstepSchrod(t);
                    var s0 = sampleDensityForRegions(schrodingerData, timeIndex0);
                    var s1 = sampleDensityForRegions(schrodingerData, timeIndex1);
                    var sampled = interpolateDensitySamples(s0, s1, tSmooth);
                    applySchrodingerDensity(sampled);
                }
            } else {
                var seedRotationAngle = time * 1.5;
            var seedBasePos = new THREE.Vector3(-slitDistance, 0, 0);
            var seedStyle = unifiedStyling.calculateUnifiedStyle(0, time, seedRotationAngle, seedBasePos);
            seedMesh.material.emissiveIntensity = 0.5 + seedStyle.glowIntensity * 0.3;

            for (var mi = 0; mi < middleKeys.length; mi++) {
                var m = middleKeys[mi];
                var basePos = m.userData.basePosition;
                var rotationAngle = Math.atan2(basePos.z, basePos.y) + time * 0.3;
                var style = unifiedStyling.calculateUnifiedStyle(m.userData.index, time, rotationAngle, basePos);
                var orbitRadius = 0.08 * style.teslaMultiplier;
                var orbitSpeed = 0.5 * style.teslaMultiplier;
                m.position.set(
                    basePos.x + Math.cos(time * orbitSpeed + style.teslaPhase) * orbitRadius * style.noiseFactor,
                    basePos.y + Math.sin(time * orbitSpeed * 1.3 + style.teslaPhase) * orbitRadius * style.noiseFactor,
                    basePos.z + Math.cos(time * orbitSpeed * 0.7 + style.teslaPhase) * orbitRadius * style.noiseFactor
                );
                m.material.emissiveIntensity = 0.4 + style.glowIntensity * 0.3;
                var hue = (m.userData.index / keys.length) * 0.7 + 0.55 + time * 0.02;
                m.material.color.setHSL(hue % 1, 0.75, 0.6 * (0.9 + style.lightingFactor * 0.2));
                m.material.emissive.setHSL(hue % 1, 0.7, style.glowIntensity * 2);
            }

            for (var ri = 0; ri < rightKeys.length; ri++) {
                var r = rightKeys[ri];
                var basePosR = r.userData.basePosition;
                var baseY = r.userData.baseY;
                var baseZ = r.userData.baseZ;
                var waveY = echoWaveAtKey(r.userData.index, time, keys.length);
                r.position.set(slitDistance, baseY + waveY * 0.8, baseZ);
                var rotR = Math.atan2(baseZ, baseY) + time * 0.2;
                var styleR = unifiedStyling.calculateUnifiedStyle(r.userData.index, time, rotR, basePosR);
                r.material.emissiveIntensity = 0.4 + styleR.glowIntensity * 0.3;
                var hueR = (r.userData.index / keys.length) * 0.3 + 0.75 + time * 0.01;
                r.material.color.setHSL(hueR % 1, 0.8, 0.65 * (0.9 + styleR.lightingFactor * 0.2));
                r.material.emissive.setHSL(hueR % 1, 0.7, styleR.glowIntensity * 2);
            }
            }

            renderer.render(scene, camera);
        }
        animate();

        function onResize() {
            var w = container.clientWidth;
            var h = Math.max(container.clientHeight, 420);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
        window.addEventListener('resize', onResize);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runInit);
    } else {
        runInit();
    }
    function runInit() {
        if (typeof THREE !== 'undefined') {
            initLayers336Visualization('layers-hurwitz-336');
        } else {
            setTimeout(runInit, 50);
        }
    }
})();
