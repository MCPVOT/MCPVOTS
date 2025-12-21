// FuturisticThreeBackground.tsx
// Three.js cyberpunk grid + floating VOT glyphs for dashboard background
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';


import { Text } from '@react-three/drei';

function FloatingGlyph({ position, glyph, color, fontSize = 2 }) {
  const mesh = useRef();
  useFrame(({ clock }) => {
    if (mesh.current) {
      mesh.current.position.y = position[1] + Math.sin(clock.getElapsedTime() + position[0]) * 0.5;
      mesh.current.rotation.z = clock.getElapsedTime() * 0.2;
    }
  });
  return (
    <group ref={mesh} position={position}>
      <Text
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Orbitron-Bold.ttf"
        outlineWidth={0.08}
        outlineColor="#222"
      >
        {glyph}
      </Text>
    </group>
  );
}

export default function FuturisticThreeBackground() {
  // Responsive canvas sizing
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 18], fov: 60 }} style={{ width: '100vw', height: '100vh' }}>
        {/* Cyberpunk grid */}
        <gridHelper args={[40, 40, '#00FFFF', '#222']} position={[0, -6, 0]} />
        {/* Floating VOT glyphs - adaptive font size for screen */}
        <FloatingGlyph position={[-8, 2, 0]} glyph={"𒇻"} color="#00FFFF" fontSize={window.innerWidth > 900 ? 2.2 : 1.2} />
        <FloatingGlyph position={[7, 3, 0]} glyph={"𒅗"} color="#00FF88" fontSize={window.innerWidth > 900 ? 2.2 : 1.2} />
        <FloatingGlyph position={[0, -2, 0]} glyph={"𒁹"} color="#00FFFF" fontSize={window.innerWidth > 900 ? 2.2 : 1.2} />
        {/* Soft ambient light */}
        <ambientLight intensity={0.7} />
        <pointLight position={[0, 10, 10]} intensity={1.2} color="#00FFFF" />
      </Canvas>
    </div>
  );
}
