/**
 * Header Hurwitz Quaternion Background (CSS version)
 * Injects positioned divs using golden-angle math; all animation is CSS.
 * No canvas - avoids layout/size issues.
 */
(function () {
    'use strict';

    function init() {
        var container = document.getElementById('header-hurwitz-dots');
        if (!container || !container.closest('header')) return;

        var goldenAngle = Math.PI * (3 - Math.sqrt(5));
        var pointCount = 144;
        var maxR = 0.52;

        function createDot(className, leftPct, topPct, animationIndex) {
            var dot = document.createElement('div');
            dot.className = 'header-hurwitz-dot ' + (className || '');
            dot.style.left = leftPct + '%';
            dot.style.top = topPct + '%';
            if (animationIndex != null) {
                dot.style.setProperty('--i', String(animationIndex));
            }
            return dot;
        }

        container.appendChild(createDot('center', 50, 50, null));

        for (var i = 0; i < pointCount; i++) {
            var theta = goldenAngle * i;
            var r = maxR * Math.sqrt((i + 1) / pointCount);
            var x = Math.cos(theta) * r;
            var y = Math.sin(theta) * r;
            var leftPct = 50 + x * 50;
            var topPct = 50 + y * 50;
            container.appendChild(createDot('', leftPct, topPct, i));
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
