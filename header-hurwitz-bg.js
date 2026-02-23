/**
 * Header Hurwitz Quaternion Background
 * Nodes only (center + radial points); no connection lines.
 * Golden-angle distribution; low opacity; optional slow rotation.
 */
(function () {
    'use strict';

    var canvas = document.getElementById('header-hurwitz-bg');
    var header = canvas && canvas.closest('header');
    if (!canvas || !header) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var goldenAngle = Math.PI * (3 - Math.sqrt(5));
    var pointCount = 24; // 24 unit group
    var centerRadius = 3;
    var dotRadius = 1.5;
    var dotOpacity = 0.12;
    var fillStyle = 'rgba(255,255,255,' + dotOpacity + ')';
    var angleOffset = 0;
    var animationId = null;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function getSatellitePositions() {
        var positions = [];
        var maxR = 0.48; // use up to ~48% of half-width so points stay in view
        for (var i = 0; i < pointCount; i++) {
            var theta = goldenAngle * i + angleOffset;
            var r = maxR * Math.sqrt((i + 1) / pointCount);
            positions.push({
                x: Math.cos(theta) * r,
                y: Math.sin(theta) * r
            });
        }
        return positions;
    }

    var maxCanvasDim = 4096; // stay under browser canvas max to avoid setTransform error

    function sizeCanvas() {
        var rect = header.getBoundingClientRect();
        var w = rect.width;
        var h = rect.height;
        if (w <= 0 || h <= 0) return;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var bufferW = Math.round(w * dpr);
        var bufferH = Math.round(h * dpr);
        if (bufferW > maxCanvasDim || bufferH > maxCanvasDim) {
            var scale = Math.min(maxCanvasDim / bufferW, maxCanvasDim / bufferH);
            bufferW = Math.max(1, Math.floor(bufferW * scale));
            bufferH = Math.max(1, Math.floor(bufferH * scale));
        }
        canvas.width = bufferW;
        canvas.height = bufferH;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(bufferW / w, 0, 0, bufferH / h, 0, 0);
        draw();
    }

    function draw() {
        var w = header.getBoundingClientRect().width;
        var h = header.getBoundingClientRect().height;
        if (w <= 0 || h <= 0) return;

        ctx.clearRect(0, 0, w, h);

        var cx = w / 2;
        var cy = h / 2;
        var scale = Math.min(w, h);

        // Center dot
        ctx.beginPath();
        ctx.arc(cx, cy, centerRadius, 0, Math.PI * 2);
        ctx.fillStyle = fillStyle;
        ctx.fill();

        // Satellite dots only (no lines)
        var positions = getSatellitePositions();
        for (var i = 0; i < positions.length; i++) {
            var p = positions[i];
            var x = cx + p.x * scale;
            var y = cy + p.y * scale;
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }
    }

    function tick() {
        if (reduceMotion) return;
        angleOffset += 0.00015;
        draw();
        animationId = requestAnimationFrame(tick);
    }

    function init() {
        sizeCanvas();
        if (!reduceMotion) {
            animationId = requestAnimationFrame(tick);
        }
    }

    var ro = typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(function () { sizeCanvas(); })
        : null;
    if (ro) ro.observe(header);
    window.addEventListener('resize', function () { sizeCanvas(); });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
