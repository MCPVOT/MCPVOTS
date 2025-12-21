'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Three.js Architecture Visualization Component
 * 
 * Retro cyberpunk style 3D visualization of the MCPVOT architecture
 * Mobile-friendly with touch controls
 */

// Architecture node data
const NODES = [
  { id: 'core', name: 'x402VOT', position: [0, 0, 0], color: 0x00ffcc, size: 1.5 },
  { id: 'mcp', name: 'MCP', position: [-3, 2, 0], color: 0xff6600, size: 0.8 },
  { id: 'ipfs', name: 'IPFS', position: [3, 2, 0], color: 0x0052ff, size: 0.8 },
  { id: 'base', name: 'BASE', position: [0, -3, 0], color: 0x0052ff, size: 1 },
  { id: 'vot', name: 'VOT', position: [-2, -1.5, 2], color: 0x00ffcc, size: 0.6 },
  { id: 'maxx', name: 'MAXX', position: [2, -1.5, 2], color: 0xff0066, size: 0.6 },
  { id: 'ens', name: 'ENS', position: [0, 3, 1], color: 0x5298ff, size: 0.7 },
  { id: 'llm', name: 'LLM', position: [-3, 0, -2], color: 0xff6600, size: 0.7 },
  { id: 'memory', name: 'MEM', position: [3, 0, -2], color: 0x00ff00, size: 0.7 },
];

// Connection definitions
const CONNECTIONS = [
  { from: 'core', to: 'mcp' },
  { from: 'core', to: 'ipfs' },
  { from: 'core', to: 'base' },
  { from: 'core', to: 'vot' },
  { from: 'core', to: 'maxx' },
  { from: 'core', to: 'ens' },
  { from: 'core', to: 'llm' },
  { from: 'core', to: 'memory' },
  { from: 'mcp', to: 'llm' },
  { from: 'ipfs', to: 'memory' },
  { from: 'base', to: 'vot' },
  { from: 'base', to: 'maxx' },
  { from: 'ens', to: 'ipfs' },
];

export default function ThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const particlesRef = useRef<THREE.Points | null>(null);
  const frameRef = useRef<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;
    
    const container = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 10, 30);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 5, 10);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    // Grid helper with cyberpunk colors
    const gridHelper = new THREE.GridHelper(20, 20, 0x00ffcc, 0x001a1a);
    gridHelper.position.y = -4;
    scene.add(gridHelper);

    // Create nodes (hexagonal prisms)
    const nodeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 6);
    
    NODES.forEach((nodeData) => {
      const material = new THREE.MeshBasicMaterial({
        color: nodeData.color,
        transparent: true,
        opacity: 0.8,
        wireframe: false,
      });
      
      const mesh = new THREE.Mesh(nodeGeometry, material);
      mesh.scale.set(nodeData.size, nodeData.size, nodeData.size);
      mesh.position.set(nodeData.position[0], nodeData.position[1], nodeData.position[2]);
      mesh.rotation.x = Math.PI / 2;
      
      // Add wireframe overlay
      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: nodeData.color,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      });
      const wireframe = new THREE.Mesh(nodeGeometry, wireframeMaterial);
      wireframe.scale.set(nodeData.size * 1.1, nodeData.size * 1.1, nodeData.size * 1.1);
      wireframe.position.copy(mesh.position);
      wireframe.rotation.copy(mesh.rotation);
      
      // Add glow ring
      const ringGeometry = new THREE.RingGeometry(nodeData.size * 0.6, nodeData.size * 0.8, 6);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: nodeData.color,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(mesh.position);
      ring.rotation.x = Math.PI / 2;
      
      scene.add(mesh);
      scene.add(wireframe);
      scene.add(ring);
      nodesRef.current.set(nodeData.id, mesh);
    });

    // Create connections (glowing lines)
    CONNECTIONS.forEach((conn) => {
      const fromNode = NODES.find(n => n.id === conn.from);
      const toNode = NODES.find(n => n.id === conn.to);
      
      if (fromNode && toNode) {
        const points = [
          new THREE.Vector3(fromNode.position[0], fromNode.position[1], fromNode.position[2]),
          new THREE.Vector3(toNode.position[0], toNode.position[1], toNode.position[2]),
        ];
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({
          color: 0x00ffcc,
          transparent: true,
          opacity: 0.3,
        });
        
        const line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
      }
    });

    // Particle system for data flow effect
    const particleCount = 500;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 20;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      
      // Cyan or orange particles
      const isCyan = Math.random() > 0.3;
      particleColors[i * 3] = isCyan ? 0 : 1;
      particleColors[i * 3 + 1] = isCyan ? 1 : 0.4;
      particleColors[i * 3 + 2] = isCyan ? 0.8 : 0;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Point lights for dramatic effect
    const cyanLight = new THREE.PointLight(0x00ffcc, 1, 20);
    cyanLight.position.set(0, 5, 5);
    scene.add(cyanLight);

    const orangeLight = new THREE.PointLight(0xff6600, 0.5, 15);
    orangeLight.position.set(-5, -2, -5);
    scene.add(orangeLight);

    // Mark initialized via microtask to avoid sync setState warning
    queueMicrotask(() => setIsInitialized(true));

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      // Update controls
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      // Animate nodes (pulse effect)
      const time = Date.now() * 0.001;
      nodesRef.current.forEach((mesh, id) => {
        const baseScale = NODES.find(n => n.id === id)?.size || 1;
        const pulse = 1 + Math.sin(time * 2 + mesh.position.x) * 0.05;
        mesh.scale.set(baseScale * pulse, baseScale * pulse, baseScale * pulse);
        mesh.rotation.z = time * 0.5;
      });
      
      // Animate particles
      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] -= 0.02; // Fall down
          if (positions[i + 1] < -10) {
            positions[i + 1] = 10;
          }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        particlesRef.current.rotation.y = time * 0.1;
      }
      
      // Render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameRef.current);
      
      if (rendererRef.current && container) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };
  }, [isInitialized]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[300px] md:min-h-[400px] relative touch-none"
      style={{ touchAction: 'none' }}
    >
      {/* Loading state */}
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-cyan-400 font-mono text-sm animate-pulse">
            INITIALIZING 3D ENGINE...
          </div>
        </div>
      )}
      
      {/* Node labels overlay */}
      <div className="absolute top-2 left-2 pointer-events-none">
        <div className="bg-black/80 border border-cyan-400/30 rounded px-2 py-1">
          <span className="font-mono text-[10px] text-cyan-400">
            x402VOT NETWORK TOPOLOGY
          </span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute top-2 right-2 pointer-events-none">
        <div className="bg-black/80 border border-cyan-400/30 rounded px-2 py-1 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="font-mono text-[8px] text-cyan-400">CORE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="font-mono text-[8px] text-orange-500">PROTOCOL</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-mono text-[8px] text-blue-500">NETWORK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pink-500" />
            <span className="font-mono text-[8px] text-pink-500">TOKEN</span>
          </div>
        </div>
      </div>
    </div>
  );
}
