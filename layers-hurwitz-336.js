/**
 * 336 Hurwitz Key — Safari Layers–style visualization.
 * Layout: left = prime seed (single point), right = unzipped prime (336 dots).
 * Reuses .header-hurwitz-dots / .header-hurwitz-dot implementation from header-hurwitz-bg.js.
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

    var shadowParams = {
        baseGlowIntensity: 0.18,
        glowIntensityRange: 0.14,
        baseShadowRadius: 2.0,
        shadowRadiusRange: 2.0,
        baseShadowIntensity: 0.5,
        shadowIntensityRange: 0.28
    };
    var teslaMultipliers = { base: 1, harmonic3: 1 / 3, harmonic6: 1 / 6 };

    // Echo frequencies (SteadyWatch: Tesla 1, 1/3, 1/6 — 336 keys as samples of multi-frequency wave)
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
        var container = document.getElementById('layers-hurwitz-336');
        if (!container) return;

        var goldenAngle = Math.PI * (3 - Math.sqrt(13));
        var pointCount = 336;
        var maxR = 0.52;
        var noiseScale = 2.5;
        var sizeNoiseScale = 0.4;
        var time = 0;

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

        // Left: single point (seed) at ~15%, 50%
        var centerStyle = calculateUnifiedStyle(0, time, 0, { x: 0, y: 0 });
        container.appendChild(createDot('center', 15, 50, null, 1 + perlin1D(200) * sizeNoiseScale, 0.85 + perlin1D(300) * 0.15, centerStyle, 0.5));

        // Right: 336 dots — same spiral math, remapped to right half; vertical offset from echo wave (multi-frequency)
        var dots = [];
        var waveSpreadPct = 8;
        for (var i = 0; i < pointCount; i++) {
            var theta = goldenAngle * i;
            var r = maxR * Math.sqrt((i + 1) / pointCount);
            var x = Math.cos(theta) * r;
            var y = Math.sin(theta) * r;
            var rotationAngle = Math.atan2(y, x);
            var nx = perlin1D(i * 1.7);
            var ny = perlin1D(i * 2.3 + 500);
            var leftPct = 50 + 50 * (0.5 + x * 0.5) + nx * noiseScale * 0.5;
            var baseTopPct = 50 + y * 40 + ny * noiseScale * 0.5;
            leftPct = Math.max(50, Math.min(100, leftPct));
            var sizeScale = 1 + perlin1D(i * 3.1 + 1000) * sizeNoiseScale;
            var opacityScale = 0.85 + perlin1D(i * 4.7 + 2000) * 0.15;
            var style = calculateUnifiedStyle(i, time + i * 0.01, rotationAngle, { x: x, y: y });
            var colorT = i / Math.max(1, pointCount - 1);
            var wave = echoWaveAtKey(i, time, pointCount);
            var topPct = Math.max(5, Math.min(95, baseTopPct + wave * waveSpreadPct));
            var dot = createDot('', leftPct, topPct, i, sizeScale, opacityScale, style, colorT);
            dot.setAttribute('data-index', String(i));
            dot.setAttribute('data-base-top', String(baseTopPct));
            dot.setAttribute('data-size-scale', String(sizeScale));
            dot.setAttribute('data-opacity-scale', String(opacityScale));
            dots.push(dot);
            container.appendChild(dot);
        }

        function animateDots() {
            time += 0.016;
            for (var i = 0; i < dots.length; i++) {
                var d = dots[i];
                var idx = parseInt(d.getAttribute('data-index'), 10);
                var baseTopPct = parseFloat(d.getAttribute('data-base-top'), 10);
                var sizeScale = parseFloat(d.getAttribute('data-size-scale'), 10);
                var opacityScale = parseFloat(d.getAttribute('data-opacity-scale'), 10);
                var wave = echoWaveAtKey(idx, time, pointCount);
                var topPct = Math.max(5, Math.min(95, baseTopPct + wave * waveSpreadPct));
                d.style.top = topPct + '%';
                var sizeMod = 0.9 + wave * 0.2;
                var opacityMod = 0.85 + (wave + 1) * 0.15;
                d.style.setProperty('transform', 'translate(-50%, -50%) scale(' + (sizeScale * sizeMod) + ')');
                d.style.setProperty('--opacity-scale', String(opacityScale * opacityMod));
            }
            requestAnimationFrame(animateDots);
        }
        requestAnimationFrame(animateDots);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
