"use client";

import { Geometry, Mesh, Program, Renderer } from "ogl";
import type React from "react";
import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import "./diamonds.modules.css";

const MAX_COLORS = 8;
const parseColor = (color: string) => {
  if (typeof window === "undefined") return [0, 0, 0];

  // Handle hex directly for precision/perf
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    if (hex.length === 3) {
      const r = Number.parseInt((hex[0] || "0") + (hex[0] || "0"), 16) / 255;
      const g = Number.parseInt((hex[1] || "0") + (hex[1] || "0"), 16) / 255;
      const b = Number.parseInt((hex[2] || "0") + (hex[2] || "0"), 16) / 255;
      return [r, g, b];
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
      const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
      const b = Number.parseInt(hex.slice(4, 6), 16) / 255;
      return [r, g, b];
    }
  }

  // Browser resolution for vars and named colors
  const div = document.createElement("div");
  div.style.color = color;
  div.style.display = "none";
  document.body.appendChild(div);
  const computed = window.getComputedStyle(div).color;
  document.body.removeChild(div);

  // Handle standard rgb/rgba: rgb(r, g, b) or rgb(r g b)
  const rgbMatch = computed.match(
    /rgba?\((\d+\.?\d*)[,\s]+(\d+\.?\d*)[,\s]+(\d+\.?\d*)/
  );
  if (rgbMatch && rgbMatch.length >= 4) {
    return [
      Number.parseFloat(rgbMatch[1] ?? "0") / 255,
      Number.parseFloat(rgbMatch[2] ?? "0") / 255,
      Number.parseFloat(rgbMatch[3] ?? "0") / 255,
    ];
  }

  // Handle color(srgb r g b) format
  const colorMatch = computed.match(
    /color\(\s*srgb\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/
  );
  if (colorMatch && colorMatch.length >= 4) {
    return [
      Number.parseFloat(colorMatch[1] ?? "0"),
      Number.parseFloat(colorMatch[2] ?? "0"),
      Number.parseFloat(colorMatch[3] ?? "0"),
    ];
  }

  return [0, 0, 0];
};

// UPDATE prepStops to use parseColor
const prepStops = (stops?: string[]) => {
  const base = (stops?.length ? stops : ["#FF9FFC", "#5227FF"]).slice(
    0,
    MAX_COLORS
  );
  if (base.length === 1) base.push(base[0] || "#FF9FFC");
  while (base.length < MAX_COLORS) {
    base.push(base[base.length - 1] || "#5227FF");
  }

  // Use parseColor instead of hexToRGB
  const arr = base.map((color) => parseColor(color));

  const count = Math.max(2, Math.min(MAX_COLORS, stops?.length ?? 2));
  return { arr, count };
};

interface DiamondsProps {
  className?: string;
  dpr?: number;
  paused?: boolean;
  gradientColors?: string[];
  angle?: number;
  noise?: number;
  turbulenceFreq?: number;
  turbulenceAmp?: number;
  turbulenceSpeed?: number;
  refractionStrength?: number;
  vignetteStrength?: number;
  vignetteRadius?: number;
  grainScale?: number;
  tileCount?: number;
  tileMinSize?: number;
  mouseDampening?: number;
  mirrorGradient?: boolean;
  spotlightRadius?: number;
  spotlightSoftness?: number;
  spotlightOpacity?: number;
  distortAmount?: number;
  shineDirection?: "left" | "right" | "top" | "bottom";
  mixBlendMode?: React.CSSProperties["mixBlendMode"];
}

export const Diamonds = ({
  className,
  dpr,
  paused = false,
  gradientColors,
  angle = 45,
  noise = 0.07,
  turbulenceFreq = 2.4,
  turbulenceAmp = 0.01,
  turbulenceSpeed = 0.25,
  refractionStrength = 0.25,
  vignetteStrength = 1.0,
  vignetteRadius = 1.0,
  grainScale = 1.0,
  tileCount = 3,
  tileMinSize = 60,
  mouseDampening = 0.71,
  mirrorGradient = true,
  spotlightRadius = 2.0,
  spotlightSoftness = 1,
  spotlightOpacity = 1,
  distortAmount = 15,
  shineDirection = "left",
  mixBlendMode = "lighten",
}: DiamondsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const programRef = useRef<Program | null>(null);
  const meshRef = useRef<Mesh | null>(null);
  const geometryRef = useRef<Geometry | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const mouseTargetRef = useRef([0, 0]);
  const lastTimeRef = useRef(0);
  const firstResizeRef = useRef(true);

  const propsRef = useRef({
    gradientColors,
    angle,
    noise,
    turbulenceFreq,
    turbulenceAmp,
    turbulenceSpeed,
    refractionStrength,
    vignetteStrength,
    vignetteRadius,
    grainScale,
    tileCount,
    tileMinSize,
    mouseDampening,
    mirrorGradient,
    spotlightRadius,
    spotlightSoftness,
    spotlightOpacity,
    distortAmount,
    shineDirection,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      dpr:
        dpr ??
        (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1),
      alpha: true,
      antialias: true,
    });
    rendererRef.current = renderer;
    const gl = renderer.gl;
    const canvas = gl.canvas;

    Object.assign(canvas.style, {
      width: "100%",
      height: "100%",
      display: "block",
    });
    container.appendChild(canvas);

    const vertex = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

    const fragment = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec3  iResolution;
uniform vec2  iMouse;
uniform float iTime;

uniform float uAngle;
uniform float uNoise;
uniform float uTileCount;
uniform float uSpotlightRadius;
uniform float uSpotlightSoftness;
uniform float uSpotlightOpacity;
uniform float uMirror;
uniform float uDistort;
uniform float uShineFlip;
uniform float uTurbFreq;
uniform float uTurbAmp;
uniform float uTurbSpeed;
uniform float uRefraction;
uniform float uVignette;
uniform float uVignetteRadius;
uniform float uGrainScale;
uniform float uColorCount;

uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
uniform vec3 uColor6;
uniform vec3 uColor7;

varying vec2 vUv;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float rand(vec2 co){
  return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
}

vec2 rotate2D(vec2 p, float a){
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c) * p;
}

vec3 getGradientColor(float t){
  float tt = clamp(t, 0.0, 1.0);
  float count = uColorCount;
  if (count < 2.0) count = 2.0;
  float scaled = tt * (count - 1.0);
  float seg = floor(scaled);
  float f = fract(scaled);

  if (seg < 1.0) return mix(uColor0, uColor1, f);
  if (seg < 2.0 && count > 2.0) return mix(uColor1, uColor2, f);
  if (seg < 3.0 && count > 3.0) return mix(uColor2, uColor3, f);
  if (seg < 4.0 && count > 4.0) return mix(uColor3, uColor4, f);
  if (seg < 5.0 && count > 5.0) return mix(uColor4, uColor5, f);
  if (seg < 6.0 && count > 6.0) return mix(uColor5, uColor6, f);
  if (seg < 7.0 && count > 7.0) return mix(uColor6, uColor7, f);
  if (count > 7.0) return uColor7;
  if (count > 6.0) return uColor6;
  if (count > 5.0) return uColor5;
  if (count > 4.0) return uColor4;
  if (count > 3.0) return uColor3;
  if (count > 2.0) return uColor2;
  return uColor1;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv0 = fragCoord.xy / iResolution.xy;
    float aspect = iResolution.x / iResolution.y;
    
    // Coordinate system for geometry (squares)
    vec2 p = uv0 * 2.0 - 1.0;
    p.x *= aspect;
    
    // Rotate the coordinate system
    vec2 pr = rotate2D(p, uAngle);
    
    // Tiling logic
    vec2 tileUV = (pr * 0.5 + 0.5) * uTileCount;
    
    // Create the grid
    vec2 grid = fract(tileUV);
    
    // Calculate the tile shade/ramp value
    float tileVal = (grid.x + grid.y) * 0.5;
    
    float warpStrength = uRefraction;
    vec2 warpedUV = uv0 + vec2(tileVal * warpStrength);

    if (uShineFlip > 0.5) tileVal = 1.0 - tileVal;
    
    // Global Gradient Logic
    vec2 p_grad = pr;
    p_grad.x /= aspect;
    float t = p_grad.x * 0.5 + 0.5;
    
    // Distortion
    if (uDistort > 0.0) {
      float a = uv0.y * 6.0; 
      float b = uv0.x * 6.0;
      float w = 0.01 * uDistort;
      float n = snoise(uv0 * 3.0 + iTime * 0.2) * 0.5;
      t += (sin(a) + n) * w;
    }
    
    if (uMirror > 0.5) {
      t = 1.0 - abs(1.0 - 2.0 * fract(t));
    }
    
    vec3 base = getGradientColor(t);

    // Spotlight effect
    vec2 offset = vec2(iMouse.x/iResolution.x, iMouse.y/iResolution.y);
    
    float noiseScale = uTurbFreq;
    float noiseStrength = uTurbAmp;
    float turb = snoise(uv0 * noiseScale - vec2(iTime * uTurbSpeed)) * noiseStrength;
    
    float d = length(uv0 - offset);
    d += turb;
    d = max(0.0, d);
    
    float r = max(uSpotlightRadius, 1e-4);
    float dn = d / r;
    float spot = (1.0 - 2.0 * pow(dn, uSpotlightSoftness)) * uSpotlightOpacity;
    spot = clamp(spot, 0.0, 1.0);
    vec3 cir = vec3(spot);
    
    vec3 ran = vec3(tileVal);

    vec3 col = cir + base - ran;
    col += (rand((gl_FragCoord.xy / uGrainScale) + iTime) - 0.5) * uNoise;

    // Updated vignette logic to be more aggressive/exponential
    if (uVignette > 0.0) {
      float vigDist = length(uv0 - 0.5);
      float vig = vigDist * (uVignette * 2.0);
      vig = pow(clamp(vig, 0.0, 1.0), 2.0);
      col = mix(col, vec3(0.0), vig);
    }

    fragColor = vec4(col, 1.0);
}

void main() {
    vec4 color;
    mainImage(color, vUv * iResolution.xy);
    gl_FragColor = color;
}
`;

    const { arr: colorArr, count: colorCount } = prepStops(gradientColors);
    const uniforms = {
      iResolution: {
        value: [gl.drawingBufferWidth, gl.drawingBufferHeight, 1],
      },
      iMouse: { value: [0, 0] },
      iTime: { value: 0 },
      uAngle: { value: (angle * Math.PI) / 180 },
      uNoise: { value: noise ?? 0.1 },
      uTileCount: { value: Math.max(1, tileCount ?? 3) },
      uSpotlightRadius: { value: spotlightRadius ?? 0.9 },
      uSpotlightSoftness: { value: spotlightSoftness ?? 0.4 },
      uSpotlightOpacity: { value: spotlightOpacity ?? 1.0 },
      uMirror: { value: mirrorGradient ? 1 : 0 },
      uDistort: { value: distortAmount ?? 15 },
      uShineFlip: {
        value:
          shineDirection === "right" || shineDirection === "bottom" ? 1 : 0,
      },
      uTurbFreq: { value: turbulenceFreq ?? 3.0 },
      uTurbAmp: { value: turbulenceAmp ?? 0.15 },
      uTurbSpeed: { value: turbulenceSpeed ?? 0.5 },
      uRefraction: { value: refractionStrength ?? 0.1 },
      uVignette: { value: vignetteStrength ?? 0.0 },
      uVignetteRadius: { value: vignetteRadius ?? 1.0 },
      uGrainScale: { value: grainScale ?? 1.0 },
      uColor0: { value: colorArr[0] },
      uColor1: { value: colorArr[1] },
      uColor2: { value: colorArr[2] },
      uColor3: { value: colorArr[3] },
      uColor4: { value: colorArr[4] },
      uColor5: { value: colorArr[5] },
      uColor6: { value: colorArr[6] },
      uColor7: { value: colorArr[7] },
      uColorCount: { value: colorCount },
    };

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms,
    });
    programRef.current = program;

    const geometry = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
      uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
    });
    geometryRef.current = geometry;

    const mesh = new Mesh(gl, { geometry, program });
    meshRef.current = mesh;

    const resize = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      uniforms.iResolution.value = [
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        1,
      ];

      if (tileMinSize && tileMinSize > 0) {
        const maxByMinSize = Math.max(1, Math.floor(rect.width / tileMinSize));
        const effective = tileCount
          ? Math.min(tileCount, maxByMinSize)
          : maxByMinSize;
        uniforms.uTileCount.value = Math.max(1, effective);
      } else {
        uniforms.uTileCount.value = Math.max(1, tileCount ?? 3);
      }

      if (firstResizeRef.current) {
        firstResizeRef.current = false;
        const cx = gl.drawingBufferWidth / 2;
        const cy = gl.drawingBufferHeight / 2;
        uniforms.iMouse.value = [cx, cy];
        mouseTargetRef.current = [cx, cy];
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scale = renderer.dpr || 1;
      const x = (e.clientX - rect.left) * scale;
      const y = (rect.height - (e.clientY - rect.top)) * scale;
      mouseTargetRef.current = [x, y];
      if (propsRef.current.mouseDampening <= 0) {
        uniforms.iMouse.value = [x, y];
      }
    };
    canvas.addEventListener("pointermove", onPointerMove);

    let animationId = 0;
    const loop = (t: number) => {
      animationId = requestAnimationFrame(loop);
      if (!(rendererRef.current && programRef.current && meshRef.current))
        return;

      if (uniforms?.iTime) {
        uniforms.iTime.value = t * 0.001;
      }

      const dampening = propsRef.current.mouseDampening;
      if (dampening > 0) {
        if (!lastTimeRef.current) lastTimeRef.current = t;
        const dt = (t - lastTimeRef.current) / 1000;
        lastTimeRef.current = t;
        const tau = Math.max(1e-4, dampening);
        let factor = 1 - Math.exp(-dt / tau);
        if (factor > 1) factor = 1;
        const target = mouseTargetRef.current;
        const cur = uniforms.iMouse.value;
        if (
          cur &&
          target &&
          cur[0] !== undefined &&
          cur[1] !== undefined &&
          target[0] !== undefined &&
          target[1] !== undefined
        ) {
          cur[0] += (target[0] - cur[0]) * factor;
          cur[1] += (target[1] - cur[1]) * factor;
        }
      } else {
        lastTimeRef.current = t;
      }

      if (!paused) {
        try {
          renderer.render({ scene: meshRef.current });
        } catch (e) {
          console.error("WebGL Render Error:", e);
          cancelAnimationFrame(animationId);
        }
      }
    };
    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener("pointermove", onPointerMove);
      ro.disconnect();

      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }

      if (programRef.current) programRef.current.remove();
      if (geometryRef.current) geometryRef.current.remove();

      rendererRef.current = null;
      programRef.current = null;
      geometryRef.current = null;
      meshRef.current = null;
    };
  }, [dpr, paused]);

  useEffect(() => {
    propsRef.current = {
      gradientColors,
      angle,
      noise,
      turbulenceFreq,
      turbulenceAmp,
      turbulenceSpeed,
      refractionStrength,
      vignetteStrength,
      vignetteRadius,
      grainScale,
      tileCount,
      tileMinSize,
      mouseDampening,
      mirrorGradient,
      spotlightRadius,
      spotlightSoftness,
      spotlightOpacity,
      distortAmount,
      shineDirection,
    };

    if (programRef.current) {
      const { arr: colorArr, count: colorCount } = prepStops(gradientColors);
      const p = propsRef.current;
      const uniforms = programRef.current.uniforms;

      if (uniforms.uAngle) uniforms.uAngle.value = (p.angle * Math.PI) / 180;
      if (uniforms.uNoise) uniforms.uNoise.value = p.noise ?? 0.1;
      if (uniforms.uTurbFreq)
        uniforms.uTurbFreq.value = p.turbulenceFreq ?? 3.0;
      if (uniforms.uTurbAmp) uniforms.uTurbAmp.value = p.turbulenceAmp ?? 0.15;
      if (uniforms.uTurbSpeed)
        uniforms.uTurbSpeed.value = p.turbulenceSpeed ?? 0.5;
      if (uniforms.uRefraction)
        uniforms.uRefraction.value = p.refractionStrength ?? 0.1;
      if (uniforms.uVignette)
        uniforms.uVignette.value = p.vignetteStrength ?? 0.0;
      if (uniforms.uVignetteRadius)
        uniforms.uVignetteRadius.value = p.vignetteRadius ?? 1.0;
      if (uniforms.uGrainScale)
        uniforms.uGrainScale.value = p.grainScale ?? 1.0;
      if (uniforms.uTileCount)
        uniforms.uTileCount.value = Math.max(1, p.tileCount ?? 3);
      if (uniforms.uSpotlightRadius)
        uniforms.uSpotlightRadius.value = p.spotlightRadius ?? 0.9;
      if (uniforms.uSpotlightSoftness)
        uniforms.uSpotlightSoftness.value = p.spotlightSoftness ?? 0.4;
      if (uniforms.uSpotlightOpacity)
        uniforms.uSpotlightOpacity.value = p.spotlightOpacity ?? 1.0;
      if (uniforms.uMirror) uniforms.uMirror.value = p.mirrorGradient ? 1 : 0;
      if (uniforms.uDistort) uniforms.uDistort.value = p.distortAmount ?? 15;
      if (uniforms.uShineFlip)
        uniforms.uShineFlip.value =
          p.shineDirection === "right" || p.shineDirection === "bottom" ? 1 : 0;
      if (uniforms.uColorCount) uniforms.uColorCount.value = colorCount;
      if (uniforms.uColor0) uniforms.uColor0.value = colorArr[0];
      if (uniforms.uColor1) uniforms.uColor1.value = colorArr[1];
      if (uniforms.uColor2) uniforms.uColor2.value = colorArr[2];
      if (uniforms.uColor3) uniforms.uColor3.value = colorArr[3];
      if (uniforms.uColor4) uniforms.uColor4.value = colorArr[4];
      if (uniforms.uColor5) uniforms.uColor5.value = colorArr[5];
      if (uniforms.uColor6) uniforms.uColor6.value = colorArr[6];
      if (uniforms.uColor7) uniforms.uColor7.value = colorArr[7];
    }
  }, [
    gradientColors,
    angle,
    noise,
    turbulenceFreq,
    turbulenceAmp,
    turbulenceSpeed,
    refractionStrength,
    vignetteStrength,
    vignetteRadius,
    grainScale,
    tileCount,
    tileMinSize,
    mouseDampening,
    mirrorGradient,
    spotlightRadius,
    spotlightSoftness,
    spotlightOpacity,
    distortAmount,
    shineDirection,
  ]);

  return (
    <div
      className={cn("diamonds-container", className)}
      ref={containerRef}
      style={{
        ...(mixBlendMode && {
          mixBlendMode,
        }),
      }}
    />
  );
};

export default Diamonds;
