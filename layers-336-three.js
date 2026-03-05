/**
 * 336 Hurwitz Key — Full Three.js Layers View
 * Real quaternion math: left plane (seed), middle (cylinder of keys), right plane (wave capture).
 * Uses actual Hurwitz enumeration (a²+b²+c²+d²=p, ×24 units) and 4D→3D stereographic projection.
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

        // Middle: cylinder of keys (336 points, x spread left→right, y,z from quaternion)
        var middlePositions = [];
        var middleColors = [];
        for (var i = 0; i < keys.length; i++) {
            var q = keys[i];
            var proj = project4Dto3D(q.a, q.b, q.c, q.d, middleScale);
            var t = (i + 1) / (keys.length + 1);
            var x = -slitDistance + t * (2 * slitDistance);
            middlePositions.push(x, proj.y, proj.z);
            var hue = (i / keys.length) * 0.7 + 0.55;
            var c = new THREE.Color().setHSL(hue, 0.75, 0.6);
            middleColors.push(c.r, c.g, c.b);
        }
        var middleGeom = new THREE.BufferGeometry();
        middleGeom.setAttribute('position', new THREE.Float32BufferAttribute(middlePositions, 3));
        middleGeom.setAttribute('color', new THREE.Float32BufferAttribute(middleColors, 3));
        var middleMat = new THREE.PointsMaterial({
            size: 0.25,
            vertexColors: true,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.92
        });
        var middlePoints = new THREE.Points(middleGeom, middleMat);
        middlePoints.userData.type = 'middle';
        scene.add(middlePoints);

        // Right plane: wave-like pattern (same 336 keys, y = index-based, z = wave from quaternion phase)
        var rightPositions = [];
        var rightColors = [];
        for (var j = 0; j < keys.length; j++) {
            var qr = keys[j];
            var phase = Math.atan2(qr.b + qr.c, qr.a + qr.d) + j * 0.1;
            var y = (j / keys.length - 0.5) * 2 * rightWaveAmplitude * 1.2;
            var z = Math.sin(phase * 2) * rightWaveAmplitude + Math.cos(j * rightWaveScale * 200) * 0.8;
            rightPositions.push(slitDistance, y, z);
            var hueR = (j / keys.length) * 0.3 + 0.75;
            var cr = new THREE.Color().setHSL(hueR, 0.8, 0.65);
            rightColors.push(cr.r, cr.g, cr.b);
        }
        var rightGeom = new THREE.BufferGeometry();
        rightGeom.setAttribute('position', new THREE.Float32BufferAttribute(rightPositions, 3));
        rightGeom.setAttribute('color', new THREE.Float32BufferAttribute(rightColors, 3));
        var rightMat = new THREE.PointsMaterial({
            size: 0.22,
            vertexColors: true,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.9
        });
        var rightPoints = new THREE.Points(rightGeom, rightMat);
        rightPoints.userData.type = 'right';
        scene.add(rightPoints);

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

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
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
