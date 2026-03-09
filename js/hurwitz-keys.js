/**
 * Hurwitz key list for game and viz.
 * Port from layers-336-three.js (test_hurwitz_quaternion_sieve.py).
 * No Three.js dependency. Exposes window.HurwitzKeys = { unzipSeed, getKey }.
 */
(function () {
    'use strict';

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

    function getKey(prime, keyIndex) {
        var keys = unzipSeed(prime);
        var q = keys[keyIndex];
        if (!q) return null;
        return { index: keyIndex, a: q.a, b: q.b, c: q.c, d: q.d };
    }

    window.HurwitzKeys = {
        unzipSeed: unzipSeed,
        getKey: getKey
    };
})();
