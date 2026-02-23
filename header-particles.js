/**
 * STEADYWATCH™ Header particle field – subtle quantum/SHQKD vibe.
 * Sparse drifting particles with optional faint "entanglement" lines.
 * Uses Three.js (expects THREE on global).
 */
(function () {
    'use strict';

    var particleCount = 220;
    var lineDistance = 0.5;
    var driftSpeed = 0.12;
    var particleSize = 0.06;
    var particleOpacity = 0.28;
    var lineOpacity = 0.10;

    function initHeaderParticles(headerEl) {
        if (!headerEl || typeof THREE === 'undefined') return null;

        var width = headerEl.offsetWidth;
        var height = headerEl.offsetHeight;
        if (width <= 0 || height <= 0) return null;

        var aspect = width / height;
        var scene = new THREE.Scene();
        var camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10);
        camera.position.z = 2;
        camera.lookAt(0, 0, 0);

        var renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.setClearAlpha(0);

        var wrapper = document.createElement('div');
        wrapper.className = 'header-particles-bg';
        wrapper.appendChild(renderer.domElement);
        headerEl.insertBefore(wrapper, headerEl.firstChild);

        // Particle positions and drift phases (x: -aspect..aspect, y: -1..1)
        var positions = new Float32Array(particleCount * 3);
        var phases = new Float32Array(particleCount * 3);
        var i, j;
        for (i = 0; i < particleCount; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * 2 * aspect;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
            phases[i * 3 + 0] = Math.random() * Math.PI * 2;
            phases[i * 3 + 1] = Math.random() * Math.PI * 2;
            phases[i * 3 + 2] = Math.random() * Math.PI * 2;
        }

        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.attributes.position.needsUpdate = true;

        var material = new THREE.PointsMaterial({
            size: particleSize,
            color: 0x667eea,
            transparent: true,
            opacity: particleOpacity,
            sizeAttenuation: true,
            depthWrite: false,
        });

        var points = new THREE.Points(geometry, material);
        scene.add(points);

        // Sparse "entanglement" lines between nearby particles (store pairs of indices)
        var linePairs = [];
        var maxLines = 45;
        var added = 0;
        for (i = 0; i < particleCount && added < maxLines; i++) {
            var xi = positions[i * 3 + 0];
            var yi = positions[i * 3 + 1];
            var zi = positions[i * 3 + 2];
            for (j = i + 1; j < particleCount && added < maxLines; j++) {
                var dx = positions[j * 3 + 0] - xi;
                var dy = positions[j * 3 + 1] - yi;
                var dz = positions[j * 3 + 2] - zi;
                var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (d > 0 && d < lineDistance) {
                    linePairs.push(i, j);
                    added++;
                }
            }
        }

        var lineGeometry = null;
        var lineSegments = null;
        if (linePairs.length >= 2) {
            var linePosArray = new Float32Array(linePairs.length * 3);
            lineGeometry = new THREE.BufferGeometry();
            lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePosArray, 3));
            lineSegments = new THREE.LineSegments(
                lineGeometry,
                new THREE.LineBasicMaterial({
                    color: 0x764ba2,
                    transparent: true,
                    opacity: lineOpacity,
                    depthWrite: false,
                })
            );
            scene.add(lineSegments);
        }

        var time = 0;
        function animate() {
            time += 0.016;
            var pos = geometry.attributes.position.array;
            for (i = 0; i < particleCount; i++) {
                pos[i * 3 + 0] = positions[i * 3 + 0] + 0.08 * Math.sin(phases[i * 3 + 0] + time * driftSpeed);
                pos[i * 3 + 1] = positions[i * 3 + 1] + 0.06 * Math.sin(phases[i * 3 + 1] + time * driftSpeed * 0.9);
                pos[i * 3 + 2] = positions[i * 3 + 2] + 0.02 * Math.sin(phases[i * 3 + 2] + time * driftSpeed * 0.7);
            }
            geometry.attributes.position.needsUpdate = true;
            if (lineGeometry && lineSegments && linePairs.length >= 2) {
                var linePos = lineGeometry.attributes.position.array;
                var idx = 0;
                for (i = 0; i < linePairs.length; i += 2) {
                    var a = linePairs[i] * 3;
                    var b = linePairs[i + 1] * 3;
                    linePos[idx++] = pos[a];
                    linePos[idx++] = pos[a + 1];
                    linePos[idx++] = pos[a + 2];
                    linePos[idx++] = pos[b];
                    linePos[idx++] = pos[b + 1];
                    linePos[idx++] = pos[b + 2];
                }
                lineGeometry.attributes.position.needsUpdate = true;
            }
            renderer.render(scene, camera);
            requestId = requestAnimationFrame(animate);
        }

        var requestId = requestAnimationFrame(animate);

        function resize() {
            var w = headerEl.offsetWidth;
            var h = headerEl.offsetHeight;
            if (w <= 0 || h <= 0) return;
            renderer.setSize(w, h);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            var newAspect = w / h;
            camera.left = -newAspect;
            camera.right = newAspect;
            camera.top = 1;
            camera.bottom = -1;
            camera.updateProjectionMatrix();
        }

        window.addEventListener('resize', resize);

        return {
            destroy: function () {
                window.removeEventListener('resize', resize);
                if (requestId) cancelAnimationFrame(requestId);
                renderer.dispose();
                material.dispose();
                geometry.dispose();
                if (lineGeometry) lineGeometry.dispose();
                if (lineSegments && lineSegments.material) lineSegments.material.dispose();
                if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
            },
        };
    }

    // Export for use on index.html
    window.initHeaderParticles = initHeaderParticles;
})();
