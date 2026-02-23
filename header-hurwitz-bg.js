/**
 * Header Hurwitz Quaternion Background (CSS version)
 * Injects positioned divs using golden-angle math + Perlin noise for organic scatter.
 * No canvas - avoids layout/size issues.
 */
(function () {
    'use strict';

    // Perlin 1D (same family as 144-satellites) for deterministic per-dot randomness
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

    function init() {
        var container = document.getElementById('header-hurwitz-dots');
        if (!container || !container.closest('header')) return;

        var goldenAngle = Math.PI * (3 - Math.sqrt(13));
        var pointCount = 24;
        var maxR = 0.52;
        var noiseScale = 2.5;   // max % position offset from Perlin
        var sizeNoiseScale = 0.4; // scale for size variation (added to 1)

        function createDot(className, leftPct, topPct, animationIndex, sizeScale, opacityScale) {
            var dot = document.createElement('div');
            dot.className = 'header-hurwitz-dot ' + (className || '');
            dot.style.left = leftPct + '%';
            dot.style.top = topPct + '%';
            if (animationIndex != null) {
                dot.style.setProperty('--i', String(animationIndex));
            }
            if (sizeScale != null) {
                dot.style.setProperty('transform', 'translate(-50%, -50%) scale(' + sizeScale + ')');
            }
            if (opacityScale != null) {
                dot.style.setProperty('--opacity-scale', String(opacityScale));
            }
            return dot;
        }

        var centerNx = perlin1D(0) * 0.5;
        var centerNy = perlin1D(100) * 0.5;
        container.appendChild(createDot('center', 50 + centerNx * noiseScale, 50 + centerNy * noiseScale, null, 1 + perlin1D(200) * sizeNoiseScale, 0.85 + perlin1D(300) * 0.15));

        for (var i = 0; i < pointCount; i++) {
            var theta = goldenAngle * i;
            var r = maxR * Math.sqrt((i + 1) / pointCount);
            var x = Math.cos(theta) * r;
            var y = Math.sin(theta) * r;
            var nx = perlin1D(i * 1.7);
            var ny = perlin1D(i * 2.3 + 500);
            var leftPct = 50 + (x * 50 + nx * noiseScale);
            var topPct = 50 + (y * 50 + ny * noiseScale);
            var sizeScale = 1 + perlin1D(i * 3.1 + 1000) * sizeNoiseScale;
            var opacityScale = 0.85 + perlin1D(i * 4.7 + 2000) * 0.15;
            container.appendChild(createDot('', leftPct, topPct, i, sizeScale, opacityScale));
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
