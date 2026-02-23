/**
 * STEADYWATCH™ Header – small Hurwitz quaternion-inspired tetrahedra.
 * 144 units in a ring/lattice layout (24-unit group × expansion), subtle rotation.
 * Uses Three.js (expects THREE on global).
 */
(function () {
    'use strict';

    var count = 144;
    var driftSpeed = 0.06;
    var baseScale = 0.018;

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

        var geometry = new THREE.TetrahedronGeometry(1, 0);
        var material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.65,
            depthWrite: false,
        });

        var mesh = new THREE.InstancedMesh(geometry, material, count);
        mesh.count = count;

        var dummy = new THREE.Object3D();
        var phases = [];
        var i, ring, n, radius, angle, x, y;

        for (i = 0; i < count; i++) {
            phases.push(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
        }

        var maxRadius = 0.72;
        function updatePositions() {
            var time = Date.now() * 0.001;
            var idx = 0;
            for (ring = 0; ring < 5; ring++) {
                n = ring === 0 ? 24 : (ring === 1 ? 24 : (ring === 2 ? 36 : (ring === 3 ? 30 : 30)));
                radius = (maxRadius * (0.2 + (ring / 5) * 0.8)) + 0.02 * Math.sin(time * 0.3 + ring);
                for (i = 0; i < n && idx < count; i++) {
                    angle = (i / n) * Math.PI * 2 + time * 0.02 * (ring % 2 === 0 ? 1 : -1);
                    x = (radius * Math.cos(angle)) * aspect;
                    y = radius * Math.sin(angle);
                    dummy.position.set(x, y, (Math.random() - 0.5) * 0.15);
                    dummy.scale.setScalar(baseScale * (0.92 + 0.12 * Math.sin(time + phases[idx * 2])));
                    dummy.rotation.set(
                        time * driftSpeed + phases[idx * 2],
                        time * driftSpeed * 0.7 + phases[idx * 2 + 1],
                        0
                    );
                    dummy.updateMatrix();
                    mesh.setMatrixAt(idx, dummy.matrix);
                    idx++;
                }
            }
            while (idx < count) {
                x = (Math.random() - 0.5) * 0.85 * aspect;
                y = (Math.random() - 0.5) * 0.85;
                dummy.position.set(x, y, (Math.random() - 0.5) * 0.15);
                dummy.scale.setScalar(baseScale * (0.92 + 0.12 * Math.sin(time + idx)));
                dummy.rotation.set(time * driftSpeed, time * 0.5 * driftSpeed, 0);
                dummy.updateMatrix();
                mesh.setMatrixAt(idx, dummy.matrix);
                idx++;
            }
            mesh.instanceMatrix.needsUpdate = true;
        }

        updatePositions();
        scene.add(mesh);

        var requestId;
        function animate() {
            updatePositions();
            renderer.render(scene, camera);
            requestId = requestAnimationFrame(animate);
        }
        requestId = requestAnimationFrame(animate);

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
                if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
            },
        };
    }

    window.initHeaderParticles = initHeaderParticles;
})();
