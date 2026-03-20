/**
 * Header Hurwitz Quaternion Background (CSS version)
 * Golden-angle + Perlin scatter + Unified Qubit Styling (glow/shadow) for visual pop.
 */
(function () {
    'use strict';

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

    // Unified qubit styling (same math as 144-satellites) - static pass at init
    var shadowParams = {
        baseGlowIntensity: 0.18,
        glowIntensityRange: 0.14,
        baseShadowRadius: 2.0,
        shadowRadiusRange: 2.0,
        baseShadowIntensity: 0.5,
        shadowIntensityRange: 0.28
    };
    var teslaMultipliers = { base: 1, harmonic3: 1 / 3, harmonic6: 1 / 6 };

    function generateNoise(time, freq) {
        var b = perlin1D(time * freq * 0.5) * 0.6;
        var d = perlin1D(time * freq * 2) * 0.25;
        var m = perlin1D(time * freq * 4) * 0.15;
        return Math.max(-1, Math.min(1, b + d + m));
    }
    function lightingFactor(angle) {
        return (Math.cos(angle) + 1) / 2;
    }
    function applyTesla(value, index) {
        var g = index % 3;
        var m = g === 0 ? teslaMultipliers.base : g === 1 ? teslaMultipliers.harmonic3 : teslaMultipliers.harmonic6;
        return value * m;
    }
    function calculateUnifiedStyle(index, time, rotationAngle, basePos) {
        var rawNoise = generateNoise(time, 0.25);
        var noiseFactor = 1 + rawNoise * 0.05;
        var light = lightingFactor(rotationAngle);
        var glow = (shadowParams.baseGlowIntensity + light * shadowParams.glowIntensityRange) * noiseFactor;
        glow = glow * (0.85 + applyTesla(0.15, index));
        var sRad = (shadowParams.baseShadowRadius + light * shadowParams.shadowRadiusRange) * noiseFactor;
        var sInt = (shadowParams.baseShadowIntensity + light * shadowParams.shadowIntensityRange) * noiseFactor;
        glow = Math.max(0.12, Math.min(0.45, glow));
        sRad = Math.max(1.5, Math.min(5, sRad));
        sInt = Math.max(0.45, Math.min(0.9, sInt));
        return { glowIntensity: glow, shadowRadius: sRad, shadowIntensity: sInt };
    }

    function init() {
        var container = document.getElementById('header-hurwitz-dots');
        if (!container || !container.closest('header')) return;

        var goldenAngle = Math.PI * (3 - Math.sqrt(13));
        var pointCount = 336;
        var maxR = 0.52;
        var noiseScale = 2.5;
        var sizeNoiseScale = 0.4;
        var time = 0;

        // Brand colors (header gradient: #667eea, #764ba2) for visible tint
        var color1 = { r: 128, g: 148, b: 237 };
        var color2 = { r: 118, g: 75, b: 162 };
        function rgbLerp(t) {
            return 'rgb(' + Math.round(color1.r + t * (color2.r - color1.r)) + ',' +
                Math.round(color1.g + t * (color2.g - color1.g)) + ',' +
                Math.round(color1.b + t * (color2.b - color1.b)) + ')';
        }
        function createDot(className, leftPct, topPct, animationIndex, sizeScale, opacityScale, style, colorT) {
            var dot = document.createElement('div');
            dot.className = 'header-hurwitz-dot ' + (className || '');
            dot.style.left = leftPct + '%';
            dot.style.top = topPct + '%';
            if (colorT != null) {
                var r = Math.round(color1.r + colorT * (color2.r - color1.r));
                var g = Math.round(color1.g + colorT * (color2.g - color1.g));
                var b = Math.round(color1.b + colorT * (color2.b - color1.b));
                var fillA = className === 'center' ? 0.65 : 0.5;
                dot.style.background = 'rgba(' + r + ',' + g + ',' + b + ',' + fillA + ')';
            }
            if (animationIndex != null) {
                dot.style.setProperty('--i', String(animationIndex));
            }
            if (sizeScale != null) {
                dot.style.setProperty('transform', 'translate(-50%, -50%) scale(' + sizeScale + ')');
            }
            if (opacityScale != null) {
                dot.style.setProperty('--opacity-scale', String(opacityScale));
            }
            if (style) {
                var g = style.glowIntensity;
                var glowPx = Math.round(style.shadowRadius * 4);
                var glowRgb = colorT != null ? rgbLerp(colorT) : 'rgb(255,255,255)';
                var glowA = Math.min(1, g * 1.2);
                var glowRgba = glowRgb.replace('rgb(', 'rgba(').replace(')', ',' + glowA + ')');
                dot.style.boxShadow = '0 0 ' + glowPx + 'px ' + glowRgba;
            }
            return dot;
        }

        var centerNx = perlin1D(0) * 0.5;
        var centerNy = perlin1D(100) * 0.5;
        var centerStyle = calculateUnifiedStyle(0, time, 0, { x: 0, y: 0 });
        container.appendChild(createDot('center', 50 + centerNx * noiseScale, 50 + centerNy * noiseScale, null, 1 + perlin1D(200) * sizeNoiseScale, 0.85 + perlin1D(300) * 0.15, centerStyle, 0.5));

        for (var i = 0; i < pointCount; i++) {
            var theta = goldenAngle * i;
            var normalizedR = Math.sqrt((i + 1) / pointCount); // 0=center, 1=edge
            var r = maxR * normalizedR;
            var x = Math.cos(theta) * r;
            var y = Math.sin(theta) * r;
            var rotationAngle = Math.atan2(y, x);
            var nx = perlin1D(i * 1.7);
            var ny = perlin1D(i * 2.3 + 500);
            var leftPct = 50 + (x * 50 + nx * noiseScale);
            var topPct = 50 + (y * 50 + ny * noiseScale);

            // Center density boost: inner nodes are larger and brighter.
            // coreFactor: 3.5 at center, 1.0 at edge — makes the density singularity visible.
            var coreFactor = 1.0 + (1.0 - normalizedR) * 2.5;

            var sizeScale = (1 + perlin1D(i * 3.1 + 1000) * sizeNoiseScale) * coreFactor;
            var opacityScale = Math.min(1.0, (0.85 + perlin1D(i * 4.7 + 2000) * 0.15) * coreFactor);
            var style = calculateUnifiedStyle(i, time + i * 0.01, rotationAngle, { x: x, y: y });
            style.glowIntensity = Math.min(0.75, style.glowIntensity * coreFactor);
            style.shadowRadius = Math.min(10, style.shadowRadius * coreFactor);
            var colorT = i / Math.max(1, pointCount - 1);
            container.appendChild(createDot('', leftPct, topPct, i, sizeScale, opacityScale, style, colorT));
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
