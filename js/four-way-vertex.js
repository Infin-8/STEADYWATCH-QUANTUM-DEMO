/**
 * Four-way qubit vertex: 336 keyz laid out in four arms (84 per arm).
 * Used by game-336.js for key drops. No modification of game.js.
 * Requires: THREE, HurwitzKeys (window).
 */
(function () {
    'use strict';

    var KEYS_PER_ARM = 84;
    var NUM_ARMS = 4;
    var TOTAL_KEYS = 336;

    // Four directions in XZ plane: +X, -X, +Z, -Z (unit vectors in local space)
    var ARM_DIRECTIONS = [
        { x: 1, y: 0, z: 0 },   // arm 0: +X
        { x: -1, y: 0, z: 0 },  // arm 1: -X
        { x: 0, y: 0, z: 1 },   // arm 2: +Z
        { x: 0, y: 0, z: -1 }   // arm 3: -Z
    ];

    /**
     * Get local position for key at index i in a four-way vertex (center at origin).
     * @param {number} keyIndex 0..335
     * @param {number} totalKeys 336
     * @param {number} radius arm length
     * @returns {{ x: number, y: number, z: number }}
     */
    function getFourWayVertexPosition(keyIndex, totalKeys, radius) {
        totalKeys = totalKeys || TOTAL_KEYS;
        var armIndex = Math.floor(keyIndex / KEYS_PER_ARM) % NUM_ARMS;
        var t = (keyIndex % KEYS_PER_ARM) / KEYS_PER_ARM;
        var g = t; // linear along arm; could use curve e.g. t * t
        var dir = ARM_DIRECTIONS[armIndex];
        return {
            x: dir.x * radius * g,
            y: dir.y * radius * g,
            z: dir.z * radius * g
        };
    }

    /**
     * Create a key drop group with 336 spheres in four-way vertex layout.
     * Returns object compatible with keyDrops array: { group, material, prime, keyIndex, total, basePosition, expansionProgress, expansionSpeed }.
     * @param {number} wx world x
     * @param {number} wy world y
     * @param {number} wz world z
     * @param {number} keyIndex from mined block (for hue/label)
     * @param {{ radius?: number, keyDropIndex?: number }} options
     */
    function createFourWayVertexGroup(wx, wy, wz, keyIndex, options) {
        options = options || {};
        var radius = typeof options.radius === 'number' ? options.radius : 0.5;
        var keyDropIndex = typeof options.keyDropIndex === 'number' ? options.keyDropIndex : 0;

        var quats = window.HurwitzKeys && window.HurwitzKeys.unzipSeed ? window.HurwitzKeys.unzipSeed(13) : [];
        if (quats.length < TOTAL_KEYS) quats = quats.slice(0, TOTAL_KEYS);

        var hue = (keyIndex / TOTAL_KEYS) % 1;
        if (hue < 0) hue += 1;
        var col = typeof THREE !== 'undefined' ? new THREE.Color().setHSL(hue, 0.8, 0.6) : null;
        var mat = typeof THREE !== 'undefined' ? new THREE.MeshPhongMaterial({
            color: col,
            emissive: col,
            emissiveIntensity: 0.4,
            shininess: 100
        }) : null;

        var group = typeof THREE !== 'undefined' ? new THREE.Group() : null;
        if (!group || !mat) return { group: group, material: mat, prime: 13, keyIndex: keyIndex, total: TOTAL_KEYS, basePosition: { x: wx, y: wy, z: wz }, expansionProgress: 0, expansionSpeed: 0.03 };

        group.position.set(wx, wy, wz);
        var sharedGeom = new THREE.SphereGeometry(0.06, 8, 8);
        var i, pos, mesh;
        for (i = 0; i < TOTAL_KEYS; i++) {
            pos = getFourWayVertexPosition(i, TOTAL_KEYS, radius);
            mesh = new THREE.Mesh(sharedGeom, mat.clone());
            mesh.position.set(0, 0, 0);
            mesh.userData.keyDropIndex = keyDropIndex;
            mesh.userData.baseLocalPosition = new THREE.Vector3(pos.x, pos.y, pos.z);
            mesh.userData.satelliteIndex = i;
            group.add(mesh);
        }

        return {
            group: group,
            material: mat,
            prime: 13,
            keyIndex: keyIndex,
            total: TOTAL_KEYS,
            basePosition: new THREE.Vector3(wx, wy, wz),
            expansionProgress: 0,
            expansionSpeed: 0.03
        };
    }

    window.FourWayVertex = {
        getFourWayVertexPosition: getFourWayVertexPosition,
        createFourWayVertexGroup: createFourWayVertexGroup,
        KEYS_PER_ARM: KEYS_PER_ARM,
        NUM_ARMS: NUM_ARMS,
        TOTAL_KEYS: TOTAL_KEYS
    };
})();
