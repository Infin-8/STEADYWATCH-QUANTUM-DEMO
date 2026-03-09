/**
 * UnifiedQubitStyling — Perlin + ECHO shadowing + Tesla 3-6-9.
 * Extracted from 144-satellites-visualization.js for use by game and viz.
 * No Three.js dependency. Exposes window.UnifiedQubitStyling (class).
 */
(function () {
    'use strict';

    class UnifiedQubitStyling {
        constructor() {
            this.noiseState = {
                lastNoiseUpdateTime: 0,
                smoothedNoiseValue: 0,
                noiseSmoothingTimeConstant: 0.5
            };
            this.shadowParams = {
                lightAngle: 45.0,
                baseGlowIntensity: 0.15,
                glowIntensityRange: 0.12,
                baseShadowRadius: 2.0,
                shadowRadiusRange: 2.0,
                baseShadowIntensity: 0.55,
                shadowIntensityRange: 0.25
            };
            this.teslaMultipliers = {
                base: 1.0,
                harmonic3: 1.0 / 3.0,
                harmonic6: 1.0 / 6.0,
                harmonic9: 1.0 / 9.0
            };
        }

        hash(x) {
            var wrapped = x % 2147483647;
            var h = Math.abs(wrapped);
            h = ((h * 1103515245) + 12345) & 0x7fffffff;
            h = ((h * 1103515245) + 12345) & 0x7fffffff;
            return (h % 2000000000) / 1000000000.0 - 1.0;
        }

        smoothstep(t) {
            var clamped = Math.max(0.0, Math.min(1.0, t));
            return clamped * clamped * clamped * (clamped * (clamped * 6.0 - 15.0) + 10.0);
        }

        lerp(a, b, t) {
            return a + (b - a) * t;
        }

        gradient(x, t) {
            return this.hash(x) * (t - x);
        }

        perlin1D(x) {
            var wrappedX = x % 1000000.0;
            var x0 = Math.floor(wrappedX);
            var x1 = x0 + 1;
            var fx = wrappedX - x0;
            var g0 = this.gradient(x0, wrappedX);
            var g1 = this.gradient(x1, wrappedX);
            return this.lerp(g0, g1, this.smoothstep(fx));
        }

        generateNoise(time, frequency) {
            frequency = frequency === undefined ? 1.0 : frequency;
            var baseOctave = this.perlin1D(time * frequency * 0.5) * 0.6;
            var detailOctave = this.perlin1D(time * frequency * 2.0) * 0.25;
            var microOctave = this.perlin1D(time * frequency * 4.0) * 0.15;
            var combined = baseOctave + detailOctave + microOctave;
            return Math.max(-1.0, Math.min(1.0, combined));
        }

        smoothNoiseWithTime(rawNoise, currentTime, lastUpdateTime, previousSmoothed, timeConstant) {
            var deltaTime = currentTime - lastUpdateTime;
            var alpha = Math.min(1.0, deltaTime / timeConstant);
            return alpha * rawNoise + (1.0 - alpha) * previousSmoothed;
        }

        calculateLightingFactor(rotationAngle) {
            return (Math.cos(rotationAngle) + 1.0) / 2.0;
        }

        calculateBilateralShadowOffset(waveYOffset, lightAngleDegrees) {
            lightAngleDegrees = lightAngleDegrees === undefined ? 45.0 : lightAngleDegrees;
            var lightAngleRadians = lightAngleDegrees * Math.PI / 180.0;
            return Math.abs(waveYOffset) * Math.tan(lightAngleRadians);
        }

        applyTeslaPattern(value, qubitIndex) {
            var teslaGroup = qubitIndex % 3;
            var multiplier = teslaGroup === 0 ? this.teslaMultipliers.base
                : teslaGroup === 1 ? this.teslaMultipliers.harmonic3
                : this.teslaMultipliers.harmonic6;
            return value * multiplier;
        }

        calculateUnifiedStyle(qubitIndex, time, rotationAngle, basePosition) {
            var noiseFrequency = 0.25;
            var rawNoise = this.generateNoise(time, noiseFrequency);
            var currentTime = time;
            var lastUpdate = this.noiseState.lastNoiseUpdateTime || currentTime;
            var smoothedNoise = this.smoothNoiseWithTime(
                rawNoise,
                currentTime,
                lastUpdate,
                this.noiseState.smoothedNoiseValue,
                this.noiseState.noiseSmoothingTimeConstant
            );
            this.noiseState.smoothedNoiseValue = smoothedNoise;
            this.noiseState.lastNoiseUpdateTime = currentTime;
            var noiseFactor = 1.0 + (smoothedNoise * 0.05);
            var lightingFactor = this.calculateLightingFactor(rotationAngle);
            var waveYOffset = basePosition.y;
            var bilateralShadowXOffset = this.calculateBilateralShadowOffset(waveYOffset);
            var teslaPhase = this.applyTeslaPattern(rotationAngle, qubitIndex);
            var glowIntensity = (this.shadowParams.baseGlowIntensity +
                (lightingFactor * this.shadowParams.glowIntensityRange)) * noiseFactor;
            var shadowRadius = ((this.shadowParams.baseShadowRadius +
                (lightingFactor * this.shadowParams.shadowRadiusRange)) *
                (this.shadowParams.shadowTightnessFactor || 1.0)) * noiseFactor;
            var shadowIntensity = (this.shadowParams.baseShadowIntensity +
                (lightingFactor * this.shadowParams.shadowIntensityRange)) * noiseFactor;
            var blurRadius = (0.3 + ((1.0 - lightingFactor) * 0.9)) / noiseFactor;
            return {
                noiseFactor: noiseFactor,
                smoothedNoise: smoothedNoise,
                glowIntensity: Math.max(0.12, Math.min(0.3, glowIntensity)),
                shadowRadius: Math.max(1.5, Math.min(5.0, shadowRadius)),
                shadowIntensity: Math.max(0.5, Math.min(0.85, shadowIntensity)),
                blurRadius: Math.max(0.3, Math.min(1.2, blurRadius)),
                bilateralShadowXOffset: bilateralShadowXOffset,
                lightingFactor: lightingFactor,
                teslaPhase: teslaPhase,
                teslaMultiplier: this.applyTeslaPattern(1.0, qubitIndex)
            };
        }
    }

    window.UnifiedQubitStyling = UnifiedQubitStyling;
})();
