"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function WebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x070b09, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 200);
    camera.position.set(0, 7, 16);
    camera.lookAt(0, 0, 0);

    scene.fog = new THREE.FogExp2(0x070b09, 0.042);

    const gridMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        uTime:  { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uColor: { value: new THREE.Color(0x9fd8bd) },
      },
      vertexShader: /* glsl */`
        uniform float uTime;
        uniform vec2 uMouse;
        varying vec2 vUv;
        varying float vDepth;
        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.y += sin(pos.x * 0.35 + uTime * 0.55) * 0.10
                 + sin(pos.z * 0.28 + uTime * 0.40) * 0.07;
          pos.x += uMouse.x * 1.0;
          pos.z += uMouse.y * 0.6;
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          vDepth = clamp(-mvPos.z / 70.0, 0.0, 1.0);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */`
        uniform vec3 uColor;
        varying vec2 vUv;
        varying float vDepth;
        void main() {
          vec2 grid = abs(fract(vUv * 28.0 - 0.5) - 0.5) / fwidth(vUv * 28.0);
          float line = min(grid.x, grid.y);
          float alpha = (1.0 - min(line, 1.0)) * (1.0 - vDepth * 0.97) * 0.50;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });

    const gridGeo = new THREE.PlaneGeometry(70, 70, 90, 90);
    gridGeo.rotateX(-Math.PI / 2);
    scene.add(new THREE.Mesh(gridGeo, gridMat));

    // Sparse floating particles
    const ptGeo = new THREE.BufferGeometry();
    const count = 120;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 60;
      pos[i*3+1] = Math.random() * 8 - 1;
      pos[i*3+2] = (Math.random() - 0.5) * 60;
    }
    ptGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const ptMat = new THREE.PointsMaterial({ color: 0x9fd8bd, size: 0.08, transparent: true, opacity: 0.4 });
    scene.add(new THREE.Points(ptGeo, ptMat));

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);

    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const clock = new THREE.Clock();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const t = clock.getElapsedTime();
      if (!reduceMotion) {
        mouse.x += (mouse.tx - mouse.x) * 0.035;
        mouse.y += (mouse.ty - mouse.y) * 0.035;
        gridMat.uniforms.uMouse.value.set(mouse.x, mouse.y);
        gridMat.uniforms.uTime.value = t;
        ptMat.opacity = 0.3 + Math.sin(t * 0.5) * 0.15;
      }
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: -1, pointerEvents: "none" }}
    />
  );
}
