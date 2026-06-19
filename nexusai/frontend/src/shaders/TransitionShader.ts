/**
 * TransitionShader — Screen-space transition material for scene changes.
 *
 * When the user scrolls from one scene to the next, this shader renders
 * the outgoing scene to a texture and performs a dissolve/wipe reveal
 * of the incoming scene.
 *
 * ── USAGE ─────────────────────────────────────────────────────────────────────
 *  - renderTargetA: current/outgoing scene renderTarget
 *  - renderTargetB: next/incoming scene renderTarget
 *  - progress: 0–1 transition progress (driven by scroll in the overlap region)
 *  - The shader mixes between A and B using a noise-based dissolve pattern
 * ──────────────────────────────────────────────────────────────────────────────
 */
"use client"

import * as THREE from "three"

export const transitionShader: THREE.ShaderMaterialParameters = {
  uniforms: {
    tDiffuse1: { value: null },   // Outgoing scene render texture
    tDiffuse2: { value: null },   // Incoming scene render texture
    uProgress: { value: 0 },       // 0–1 transition progress
    uNoiseScale: { value: 8.0 },   // Frequency of the dissolve noise
    uGlowIntensity: { value: 0.3 },// Edge glow during transition
    uColorGold: { value: new THREE.Color("#c8a84b") },
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    precision highp float;

    uniform sampler2D tDiffuse1;
    uniform sampler2D tDiffuse2;
    uniform float uProgress;
    uniform float uNoiseScale;
    uniform float uGlowIntensity;
    uniform vec3 uColorGold;

    varying vec2 vUv;

    // ── Pseudo-random noise for dissolve pattern ─────────────────────────
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    // ── 2D simplex-ish noise for organic dissolve edges ──────────────────
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main() {
      vec2 uv = vUv;

      // Sample both textures
      vec4 tex1 = texture2D(tDiffuse1, uv);
      vec4 tex2 = texture2D(tDiffuse2, uv);

      // Generate noise value for dissolve pattern
      float n = noise(uv * uNoiseScale + uProgress * 2.0);

      // Threshold-based dissolve: noise < progress shows tex2, else tex1
      float dissolve = smoothstep(uProgress - 0.05, uProgress + 0.05, n);

      // Edge glow: where dissolve is near the threshold, add gold glow
      float edge = 1.0 - abs(dissolve - 0.5) * 2.0;
      edge = pow(edge, 2.0) * uGlowIntensity * (1.0 - abs(uProgress - 0.5) * 2.0);

      // Mix textures based on dissolve
      vec4 color = mix(tex1, tex2, dissolve);

      // Add glow
      color.rgb += uColorGold * edge;

      gl_FragColor = color;
    }
  `,
}

/**
 * Creates a TransitionShader material instance.
 * @param renderTargetA - The outgoing scene's render to texture
 * @param renderTargetB - The incoming scene's render to texture
 */
export function createTransitionMaterial(
  renderTargetA?: THREE.WebGLRenderTarget,
  renderTargetB?: THREE.WebGLRenderTarget,
): THREE.ShaderMaterial {
  const mat = new THREE.ShaderMaterial(transitionShader)
  mat.uniforms.tDiffuse1.value = renderTargetA?.texture ?? null
  mat.uniforms.tDiffuse2.value = renderTargetB?.texture ?? null
  mat.depthWrite = false
  mat.depthTest = false
  return mat
}
