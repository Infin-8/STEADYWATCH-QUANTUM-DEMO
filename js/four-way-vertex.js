/**
 * Four-way qubit vertex: 336 or 432 keyz laid out in four arms (84 or 108 per arm).
 * Used by game-336.js (336) and game-432.js (432). No modification of game.js.
 * Requires: THREE, HurwitzKeys (window).
 */
(function () {
    'use strict';

    var NUM_ARMS = 4;
    var TOTAL_KEYS_336 = 336;
    var KEYS_PER_ARM_336 = 84;
    var TOTAL_KEYS_432 = 432;
    var KEYS_PER_ARM_432 = 108;

    // Four directions in XZ plane: +X, -X, +Z, -Z (unit vectors in local space)
    var ARM_DIRECTIONS = [
        { x: 1, y: 0, z: 0 },   // arm 0: +X
        { x: -1, y: 0, z: 0 },  // arm 1: -X
        { x: 0, y: 0, z: 1 },   // arm 2: +Z
        { x: 0, y: 0, z: -1 }   // arm 3: -Z
    ];

    /**
     * Get local position for key at index i in a four-way vertex (center at origin).
     * @param {number} keyIndex 0..(totalKeys-1)
     * @param {number} totalKeys 336 or 432 (keysPerArm = totalKeys / 4)
     * @param {number} radius arm length
     * @returns {{ x: number, y: number, z: number }}
     */
    function getFourWayVertexPosition(keyIndex, totalKeys, radius) {
        totalKeys = totalKeys || TOTAL_KEYS_336;
        var keysPerArm = totalKeys / NUM_ARMS;
        var armIndex = Math.floor(keyIndex / keysPerArm) % NUM_ARMS;
        var t = (keyIndex % keysPerArm) / keysPerArm;
        var g = t; // linear along arm; could use curve e.g. t * t
        var dir = ARM_DIRECTIONS[armIndex];
        return {
            x: dir.x * radius * g,
            y: dir.y * radius * g,
            z: dir.z * radius * g
        };
    }

    /**
     * Create a key drop group with 336 or 432 spheres in four-way vertex layout.
     * Options: prime (13|17) or totalKeys (336|432). Default 336 / p=13.
     * Returns object compatible with keyDrops array: { group, material, prime, keyIndex, total, basePosition, expansionProgress, expansionSpeed }.
     * @param {number} wx world x
     * @param {number} wy world y
     * @param {number} wz world z
     * @param {number} keyIndex from mined block (for hue/label)
     * @param {{ radius?: number, keyDropIndex?: number, prime?: number, totalKeys?: number, hueShift?: number, emissiveIntensity?: number }} options
     */
    function createFourWayVertexGroup(wx, wy, wz, keyIndex, options) {
        options = options || {};
        var radius = typeof options.radius === 'number' ? options.radius : 0.5;
        var keyDropIndex = typeof options.keyDropIndex === 'number' ? options.keyDropIndex : 0;
        var hueShift = typeof options.hueShift === 'number' ? options.hueShift : 0;
        var emissiveIntensity = typeof options.emissiveIntensity === 'number' ? options.emissiveIntensity : 0.4;

        var totalKeys = TOTAL_KEYS_336;
        var prime = 13;
        if (options.prime === 17 || options.totalKeys === 432) {
            totalKeys = TOTAL_KEYS_432;
            prime = 17;
        }

        var quats = window.HurwitzKeys && window.HurwitzKeys.unzipSeed ? window.HurwitzKeys.unzipSeed(prime) : [];
        if (quats.length < totalKeys) quats = quats.slice(0, totalKeys);

        var hue = (keyIndex / totalKeys) % 1;
        if (hue < 0) hue += 1;
        hue = (hue + hueShift) % 1;
        if (hue < 0) hue += 1;
        var col = typeof THREE !== 'undefined' ? new THREE.Color().setHSL(hue, 0.8, 0.6) : null;
        var mat = typeof THREE !== 'undefined' ? new THREE.MeshPhongMaterial({
            color: col,
            emissive: col,
            emissiveIntensity: emissiveIntensity,
            shininess: 100
        }) : null;

        var group = typeof THREE !== 'undefined' ? new THREE.Group() : null;
        if (!group || !mat) return { group: group, material: mat, prime: prime, keyIndex: keyIndex, total: totalKeys, basePosition: { x: wx, y: wy, z: wz }, expansionProgress: 0, expansionSpeed: 0.03 };

        group.position.set(wx, wy, wz);
        var sharedGeom = new THREE.SphereGeometry(0.03, 8, 8);
        var i, pos, mesh;
        for (i = 0; i < totalKeys; i++) {
            pos = getFourWayVertexPosition(i, totalKeys, radius);
            mesh = new THREE.Mesh(sharedGeom, mat.clone());
            mesh.position.set(0, 0, 0);
            mesh.userData.keyDropIndex = keyDropIndex;
            mesh.userData.baseLocalPosition = new THREE.Vector3(pos.x, pos.y, pos.z);
            mesh.userData.satelliteIndex = i;
            group.add(mesh);
        }

        // Nucleus sphere — compact core protected by the Hurwitz quaternion arms
        var glassMat = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(hue, 0.6, 0.85),
            emissive: col,
            emissiveIntensity: 0.35,
            shininess: 180,
            transparent: true,
            opacity: 0.45,
            side: THREE.FrontSide,
            depthWrite: false
        });
        var glassSphere = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.22, 32, 32), glassMat);
        glassSphere.userData.isGlassSphere = true;
        group.add(glassSphere);

        // Orbital rings — cesium-style electron orbital paths around the nucleus
        var torusGeom = new THREE.TorusGeometry(radius * 0.32, radius * 0.018, 8, 48);
        var ringRotations = [
            { x: Math.PI / 2, y: 0,              z: 0 },
            { x: Math.PI / 2, y: Math.PI / 3,    z: Math.PI / 3 },
            { x: Math.PI / 2, y: Math.PI * 2 / 3, z: -Math.PI / 4 }
        ];
        for (var r = 0; r < ringRotations.length; r++) {
            var ringMat = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL((hue + r * 0.08) % 1, 0.7, 0.75),
                emissive: new THREE.Color().setHSL((hue + r * 0.08) % 1, 0.8, 0.3),
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

        return {
            group: group,
            material: mat,
            prime: prime,
            keyIndex: keyIndex,
            total: totalKeys,
            basePosition: new THREE.Vector3(wx, wy, wz),
            expansionProgress: 0,
            expansionSpeed: 0.03
        };
    }

    window.FourWayVertex = {
        getFourWayVertexPosition: getFourWayVertexPosition,
        createFourWayVertexGroup: createFourWayVertexGroup,
        KEYS_PER_ARM_336: KEYS_PER_ARM_336,
        NUM_ARMS: NUM_ARMS,
        TOTAL_KEYS_336: TOTAL_KEYS_336,
        KEYS_PER_ARM_432: KEYS_PER_ARM_432,
        TOTAL_KEYS_432: TOTAL_KEYS_432
    };
})();
