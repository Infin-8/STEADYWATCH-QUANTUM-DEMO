/**
 * Keyz Game — Minimal shell: Three.js scene + one key-colored orb driven by UnifiedQubitStyling.
 * Uses HurwitzKeys (js/hurwitz-keys.js) and UnifiedQubitStyling (js/unified-qubit-styling.js).
 * Three.js r128 + OrbitControls.
 */
(function () {
    'use strict';

    function getKeyColor(keyIndex, total) {
        if (typeof THREE === 'undefined') return null;
        var hue = (keyIndex / (total || 144)) * 360;
        return new THREE.Color().setHSL(hue / 360, 0.8, 0.6);
    }

    function initGame() {
        var container = document.getElementById('game-container');
        if (!container || typeof THREE === 'undefined' || !window.HurwitzKeys || !window.UnifiedQubitStyling) {
            if (container) container.innerHTML = '<p style="padding:20px;">Load error: Three.js, HurwitzKeys, or UnifiedQubitStyling missing.</p>';
            return;
        }

        var prime = 5;
        var keyIndex = 0;
        var totalKeys = 144;
        var keyData = window.HurwitzKeys.getKey(prime, keyIndex);
        if (!keyData) {
            keyData = { index: 0, a: 2, b: 1, c: 0, d: 0 };
        }

        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a1a);
        scene.fog = new THREE.Fog(0x0a0a1a, 30, 120);

        var width = container.clientWidth;
        var height = container.clientHeight || 600;

        var camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 4, 12);
        camera.lookAt(0, 0, 0);

        var renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        var controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 5;
        controls.maxDistance = 40;

        var ambientLight = new THREE.AmbientLight(0x667eea, 0.4);
        scene.add(ambientLight);
        var pointLight1 = new THREE.PointLight(0x667eea, 1, 80);
        pointLight1.position.set(12, 12, 12);
        scene.add(pointLight1);
        var pointLight2 = new THREE.PointLight(0x764ba2, 0.8, 80);
        pointLight2.position.set(-12, 12, -12);
        scene.add(pointLight2);

        var baseColor = getKeyColor(keyIndex, totalKeys);
        var orbGeometry = new THREE.SphereGeometry(0.8, 32, 32);
        var orbMaterial = new THREE.MeshPhongMaterial({
            color: baseColor,
            emissive: baseColor,
            emissiveIntensity: 0.3,
            shininess: 100,
            transparent: true,
            opacity: 0.95
        });
        var orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.set(0, 0, 0);
        orb.userData.keyIndex = keyIndex;
        orb.userData.prime = prime;
        orb.userData.basePosition = new THREE.Vector3(0, 0, 0);
        scene.add(orb);

        var styling = new window.UnifiedQubitStyling();
        var time = 0;

        var labelEl = document.getElementById('game-key-label');
        if (labelEl) {
            labelEl.textContent = 'Key #' + keyIndex + ' (p=' + prime + ') — (' + keyData.a + ',' + keyData.b + ',' + keyData.c + ',' + keyData.d + ')';
        }

        function animate() {
            requestAnimationFrame(animate);
            time += 0.02;

            var basePos = orb.userData.basePosition;
            var phase = (orb.userData.keyIndex / totalKeys) * Math.PI * 2;
            var rotationAngle = time + phase;
            var style = styling.calculateUnifiedStyle(orb.userData.keyIndex, time, rotationAngle, basePos);

            var wobble = style.noiseFactor * 0.15;
            orb.position.x = basePos.x + Math.sin(time * 0.8) * wobble;
            orb.position.y = basePos.y + Math.cos(time * 1.2) * wobble;
            orb.position.z = basePos.z + Math.sin(time * 0.5) * wobble;

            var hue = (orb.userData.keyIndex / totalKeys);
            var sat = 0.7 * (0.8 + style.glowIntensity * 0.4);
            var light = 0.6 * (0.9 + style.lightingFactor * 0.2);
            orb.material.color.setHSL(hue, sat, light);
            orb.material.emissive.setHSL(hue, 0.7, style.glowIntensity * 2);
            orb.material.emissiveIntensity = 0.3 + style.glowIntensity * 0.5;

            var scale = 0.95 + style.noiseFactor * 0.1;
            orb.scale.set(scale, scale, scale);

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
