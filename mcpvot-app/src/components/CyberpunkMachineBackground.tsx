'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  CYBERPUNK MACHINE BACKGROUND - Three.js Animated Edges                      ║
 * ║                                                                               ║
 * ║  NO PARTICLES - Uses animated geometric edges, sacred geometry, and          ║
 * ║  glowing lines inspired by VOT Machine SVG template                          ║
 * ║                                                                               ║
 * ║  Animation Patterns (from vot-machine-responsive.ts):                        ║
 * ║  • Sacred Geometry rotating rings                                            ║
 * ║  • MCP Network pulsing nodes                                                 ║
 * ║  • Chain flow circuit patterns                                               ║
 * ║  • Burn effect edge glows                                                    ║
 * ║  • Identity convergence beams                                                ║
 * ║                                                                               ║
 * ║  MCP MEMORY: #238 (VOT Machine Mint Page Style Redesign)                     ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Color palette from design system
const COLORS = {
  cyan: 0x00ffff,      // Primary
  green: 0x00ff88,     // Success/Active
  orange: 0xff8800,    // Warning/Burn
  purple: 0x9945ff,    // VOT
  mcpTeal: 0x00ffcc,   // MCP
  base: 0x0052ff,      // Base Network
};

export default function CyberpunkMachineBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    geometries: THREE.Object3D[];
    time: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 30;
    camera.position.y = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const geometries: THREE.Object3D[] = [];

    // =========================================================================
    // SACRED GEOMETRY RINGS - Rotating concentric hexagons
    // =========================================================================
    const createSacredGeometryRing = (radius: number, segments: number, color: number, yOffset: number) => {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          yOffset,
          Math.sin(angle) * radius
        ));
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color,
        transparent: true,
        opacity: 0.6,
        linewidth: 2,
      });
      
      return new THREE.Line(geometry, material);
    };

    // Create multiple sacred geometry rings
    const ringGroup = new THREE.Group();
    const ringConfigs = [
      { radius: 15, segments: 6, color: COLORS.cyan, y: 0 },
      { radius: 12, segments: 6, color: COLORS.mcpTeal, y: 1 },
      { radius: 18, segments: 8, color: COLORS.purple, y: -1 },
      { radius: 20, segments: 12, color: COLORS.green, y: 2 },
      { radius: 10, segments: 4, color: COLORS.orange, y: -2 },
    ];

    ringConfigs.forEach(config => {
      const ring = createSacredGeometryRing(config.radius, config.segments, config.color, config.y);
      ringGroup.add(ring);
    });
    scene.add(ringGroup);
    geometries.push(ringGroup);

    // =========================================================================
    // MCP NETWORK NODES - Pulsing vertices with connections
    // =========================================================================
    const createMCPNetwork = () => {
      const group = new THREE.Group();
      
      // Node positions (icosahedron-like distribution)
      const nodePositions = [
        new THREE.Vector3(0, 8, 0),
        new THREE.Vector3(8, 0, 0),
        new THREE.Vector3(-8, 0, 0),
        new THREE.Vector3(0, 0, 8),
        new THREE.Vector3(0, 0, -8),
        new THREE.Vector3(4, 4, 4),
        new THREE.Vector3(-4, 4, 4),
        new THREE.Vector3(4, -4, 4),
        new THREE.Vector3(-4, -4, -4),
      ];

      // Create edges between nodes
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: COLORS.mcpTeal,
        transparent: true,
        opacity: 0.4,
      });

      // Connect nodes with edges
      for (let i = 0; i < nodePositions.length; i++) {
        for (let j = i + 1; j < nodePositions.length; j++) {
          const distance = nodePositions[i].distanceTo(nodePositions[j]);
          if (distance < 12) {
            const edgeGeometry = new THREE.BufferGeometry().setFromPoints([
              nodePositions[i],
              nodePositions[j]
            ]);
            const edge = new THREE.Line(edgeGeometry, edgeMaterial);
            group.add(edge);
          }
        }
      }

      // Create glowing node indicators
      nodePositions.forEach((pos, index) => {
        const nodeGeometry = new THREE.RingGeometry(0.2, 0.3, 6);
        const nodeMaterial = new THREE.MeshBasicMaterial({
          color: index % 2 === 0 ? COLORS.cyan : COLORS.green,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        });
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.copy(pos);
        node.lookAt(camera.position);
        node.userData = { pulseOffset: index * 0.5 };
        group.add(node);
      });

      return group;
    };

    const mcpNetwork = createMCPNetwork();
    scene.add(mcpNetwork);
    geometries.push(mcpNetwork);

    // =========================================================================
    // CHAIN FLOW CIRCUITS - Animated edge streams
    // =========================================================================
    const createChainFlowCircuit = () => {
      const group = new THREE.Group();
      
      // Circuit path points
      const circuitPaths = [
        // Horizontal flow
        [new THREE.Vector3(-25, 3, -5), new THREE.Vector3(-10, 3, -5), new THREE.Vector3(0, 5, -5), new THREE.Vector3(10, 3, -5), new THREE.Vector3(25, 3, -5)],
        // Diagonal flow
        [new THREE.Vector3(-20, -5, 10), new THREE.Vector3(-5, 0, 5), new THREE.Vector3(5, 0, 5), new THREE.Vector3(20, -5, 10)],
        // Vertical flow
        [new THREE.Vector3(-15, -10, 0), new THREE.Vector3(-15, -5, 2), new THREE.Vector3(-15, 5, 2), new THREE.Vector3(-15, 10, 0)],
        [new THREE.Vector3(15, -10, 0), new THREE.Vector3(15, -5, -2), new THREE.Vector3(15, 5, -2), new THREE.Vector3(15, 10, 0)],
      ];

      circuitPaths.forEach((pathPoints, index) => {
        const curve = new THREE.CatmullRomCurve3(pathPoints);
        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Create dashed line for flow effect
        const material = new THREE.LineDashedMaterial({
          color: index % 2 === 0 ? COLORS.base : COLORS.cyan,
          transparent: true,
          opacity: 0.5,
          dashSize: 1,
          gapSize: 0.5,
        });
        
        const line = new THREE.Line(geometry, material);
        line.computeLineDistances();
        line.userData = { dashOffset: 0, speed: 0.02 + index * 0.005 };
        group.add(line);
      });

      return group;
    };

    const chainCircuits = createChainFlowCircuit();
    scene.add(chainCircuits);
    geometries.push(chainCircuits);

    // =========================================================================
    // BURN EFFECT EDGES - Orange glowing perimeter
    // =========================================================================
    const createBurnEffectEdges = () => {
      const group = new THREE.Group();
      
      // Create outer burn ring
      const burnCurve = new THREE.EllipseCurve(0, 0, 22, 22, 0, Math.PI * 2, false, 0);
      const burnPoints = burnCurve.getPoints(100).map(p => new THREE.Vector3(p.x, -3, p.y));
      const burnGeometry = new THREE.BufferGeometry().setFromPoints(burnPoints);
      
      const burnMaterial = new THREE.LineBasicMaterial({
        color: COLORS.orange,
        transparent: true,
        opacity: 0.3,
      });
      
      const burnRing = new THREE.Line(burnGeometry, burnMaterial);
      group.add(burnRing);

      // Inner burn glow ring
      const innerBurnCurve = new THREE.EllipseCurve(0, 0, 20, 20, 0, Math.PI * 2, false, 0);
      const innerBurnPoints = innerBurnCurve.getPoints(80).map(p => new THREE.Vector3(p.x, -3.5, p.y));
      const innerBurnGeometry = new THREE.BufferGeometry().setFromPoints(innerBurnPoints);
      
      const innerBurnMaterial = new THREE.LineBasicMaterial({
        color: COLORS.orange,
        transparent: true,
        opacity: 0.15,
      });
      
      const innerBurnRing = new THREE.Line(innerBurnGeometry, innerBurnMaterial);
      group.add(innerBurnRing);

      return group;
    };

    const burnEdges = createBurnEffectEdges();
    scene.add(burnEdges);
    geometries.push(burnEdges);

    // =========================================================================
    // IDENTITY CONVERGENCE BEAMS - Radiating lines to center
    // =========================================================================
    const createIdentityBeams = () => {
      const group = new THREE.Group();
      const beamCount = 12;
      
      for (let i = 0; i < beamCount; i++) {
        const angle = (i / beamCount) * Math.PI * 2;
        const startRadius = 25;
        const endRadius = 3;
        
        const startPoint = new THREE.Vector3(
          Math.cos(angle) * startRadius,
          0,
          Math.sin(angle) * startRadius
        );
        const endPoint = new THREE.Vector3(
          Math.cos(angle) * endRadius,
          0,
          Math.sin(angle) * endRadius
        );
        
        const geometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
        const material = new THREE.LineBasicMaterial({
          color: i % 3 === 0 ? COLORS.purple : (i % 3 === 1 ? COLORS.cyan : COLORS.green),
          transparent: true,
          opacity: 0.2,
        });
        
        const beam = new THREE.Line(geometry, material);
        beam.userData = { pulseOffset: i * 0.3 };
        group.add(beam);
      }
      
      return group;
    };

    const identityBeams = createIdentityBeams();
    scene.add(identityBeams);
    geometries.push(identityBeams);

    // =========================================================================
    // GRID FLOOR - Cyberpunk ground plane
    // =========================================================================
    const createGridFloor = () => {
      const gridHelper = new THREE.GridHelper(60, 30, COLORS.cyan, COLORS.cyan);
      gridHelper.position.y = -8;
      gridHelper.material.transparent = true;
      (gridHelper.material as THREE.Material).opacity = 0.08;
      return gridHelper;
    };

    const gridFloor = createGridFloor();
    scene.add(gridFloor);
    geometries.push(gridFloor);

    // Store refs
    sceneRef.current = { scene, camera, renderer, geometries, time: 0 };

    // =========================================================================
    // ANIMATION LOOP
    // =========================================================================
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      if (!sceneRef.current) return;
      const { scene: s, camera: cam, renderer: rend } = sceneRef.current;
      sceneRef.current.time += 0.01;
      const t = sceneRef.current.time;

      // Rotate sacred geometry rings at different speeds
      if (ringGroup) {
        ringGroup.children.forEach((ring, i) => {
          ring.rotation.y = t * (0.1 + i * 0.05) * (i % 2 === 0 ? 1 : -1);
          ring.rotation.x = Math.sin(t * 0.5 + i) * 0.1;
        });
      }

      // Pulse MCP network nodes
      mcpNetwork.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const pulseOffset = child.userData.pulseOffset || 0;
          const scale = 1 + Math.sin(t * 2 + pulseOffset) * 0.3;
          child.scale.set(scale, scale, scale);
          (child.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(t * 2 + pulseOffset) * 0.4;
        }
      });

      // Animate chain flow dash offset
      chainCircuits.children.forEach((line) => {
        if (line instanceof THREE.Line && line.userData.dashOffset !== undefined) {
          line.userData.dashOffset -= line.userData.speed;
          const mat = line.material as THREE.LineDashedMaterial;
          mat.dashOffset = line.userData.dashOffset;
        }
      });

      // Burn effect pulsing
      burnEdges.rotation.y = t * 0.05;
      burnEdges.children.forEach((child, i) => {
        const line = child as THREE.Line;
        const mat = line.material as THREE.LineBasicMaterial;
        mat.opacity = 0.2 + Math.sin(t * 3 + i) * 0.15;
      });

      // Identity beams pulse
      identityBeams.children.forEach((beam) => {
        const line = beam as THREE.Line;
        const mat = line.material as THREE.LineBasicMaterial;
        const offset = line.userData.pulseOffset || 0;
        mat.opacity = 0.1 + Math.sin(t * 1.5 + offset) * 0.15;
      });

      // Slow camera orbit
      cam.position.x = Math.sin(t * 0.1) * 5;
      cam.position.z = 30 + Math.cos(t * 0.1) * 5;
      cam.lookAt(0, 0, 0);

      rend.render(s, cam);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!sceneRef.current) return;
      const { camera: cam, renderer: rend } = sceneRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      rend.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      
      if (sceneRef.current) {
        sceneRef.current.renderer.dispose();
        sceneRef.current.geometries.forEach(obj => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach(m => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
      }
      
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #000000 70%)' }}
    />
  );
}
