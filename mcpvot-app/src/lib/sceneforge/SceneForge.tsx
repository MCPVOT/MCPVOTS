'use client';

import { Line, OrthographicCamera, Text } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Line2, LineMaterial, LineSegments2 } from 'three-stdlib';

import type {
    BadgeWidget,
    BarsWidget,
    GlyphWidget,
    MetricsWidget,
    RadarWidget,
    SceneBlueprint,
    ScrollWidget,
    TerminalPalette,
    TerminalWidget,
} from './types';

const VIEWPORT_WIDTH = 24;
const VIEWPORT_HEIGHT = 24;

const CRT_VERTEX_SHADER = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const CRT_FRAGMENT_SHADER = `
    varying vec2 vUv;

    uniform float uTime;
    uniform float uStrength;
    uniform vec3 uAccent;

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
        float scan = sin((vUv.y + uTime * 0.45) * 240.0) * 0.5 + 0.5;
        float noise = random(vUv + uTime);
        float glitch = step(0.995, random(vec2(uTime * 0.2, vUv.y * 12.0)));
        float intensity = mix(scan, noise, 0.35) * uStrength + glitch * 0.12;
        vec3 color = mix(vec3(intensity), uAccent * intensity, 0.55);
        gl_FragColor = vec4(color, clamp(intensity * 1.8, 0.0, 0.28));
    }
`;

const GRID_HIGHLIGHT_FRAGMENT_SHADER = `
    varying vec2 vUv;

    uniform float uTime;
    uniform vec3 uPrimary;

    void main() {
        float scan = sin((vUv.y + uTime * 0.35) * 28.0) * 0.5 + 0.5;
        float sweep = smoothstep(0.0, 0.3, sin((vUv.y - uTime * 0.15) * 3.14159));
        float flicker = fract(sin(dot(vUv.xy + uTime, vec2(12.9898, 78.233))) * 43758.5453);
        float intensity = mix(scan, sweep, 0.5) + flicker * 0.08;
        gl_FragColor = vec4(uPrimary * intensity * 0.18, clamp(intensity * 0.16, 0.0, 0.24));
    }
`;

function hashStringToFloat(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return ((hash >>> 0) % 1000) / 1000;
}

type WidgetTransform = {
    width: number;
    height: number;
    x: number;
    y: number;
    z: number;
};

// Logo emblem wireframe geometries for header
function LogoEmblemVOT({ color, size = 1 }: { color: THREE.ColorRepresentation; size?: number }) {
    const points = useMemo(() => {
        // V-shape chevron
        return [
            new THREE.Vector3(-0.6 * size, 0.5 * size, 0),
            new THREE.Vector3(0, -0.5 * size, 0),
            new THREE.Vector3(0.6 * size, 0.5 * size, 0),
        ];
    }, [size]);

    return (
        <group>
            <Line points={points} color={color} lineWidth={2.5} />
            <mesh position={[0, 0, 0]}>
                <circleGeometry args={[0.18 * size, 6]} />
                <meshBasicMaterial color={color} transparent opacity={0.65} />
            </mesh>
        </group>
    );
}

function LogoEmblemBASE({ color, size = 1 }: { color: THREE.ColorRepresentation; size?: number }) {
    const hexPoints = useMemo(() => {
        // Hexagon wireframe
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 6; i += 1) {
            const angle = (i / 6) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(angle) * 0.5 * size, Math.sin(angle) * 0.5 * size, 0));
        }
        return pts;
    }, [size]);

    return (
        <group>
            <Line points={hexPoints} color={color} lineWidth={2.5} />
            <Line
                points={[
                    new THREE.Vector3(-0.5 * size, 0, 0),
                    new THREE.Vector3(0.5 * size, 0, 0),
                ]}
                color={color}
                lineWidth={2}
            />
        </group>
    );
}

function LogoEmblemWARPLET({ color, size = 1 }: { color: THREE.ColorRepresentation; size?: number }) {
    const spiralPoints = useMemo(() => {
        // Orbital rings
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 32; i += 1) {
            const angle = (i / 32) * Math.PI * 2;
            const radius = 0.5 * size * (1 - i / 64);
            pts.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
        }
        return pts;
    }, [size]);

    return (
        <group>
            <Line points={spiralPoints} color={color} lineWidth={2.5} />
            <mesh position={[0, 0, 0]}>
                <ringGeometry args={[0.3 * size, 0.38 * size, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.5} />
            </mesh>
        </group>
    );
}

function LogoEmblemMECH({ color, size = 1 }: { color: THREE.ColorRepresentation; size?: number }) {
    const crosshairPoints = useMemo(() => {
        // Mechanical crosshair reticle
        return [
            [
                new THREE.Vector3(-0.6 * size, 0, 0),
                new THREE.Vector3(-0.2 * size, 0, 0),
            ],
            [
                new THREE.Vector3(0.2 * size, 0, 0),
                new THREE.Vector3(0.6 * size, 0, 0),
            ],
            [
                new THREE.Vector3(0, -0.6 * size, 0),
                new THREE.Vector3(0, -0.2 * size, 0),
            ],
            [
                new THREE.Vector3(0, 0.2 * size, 0),
                new THREE.Vector3(0, 0.6 * size, 0),
            ],
        ];
    }, [size]);

    return (
        <group>
            {crosshairPoints.map((pts, idx) => (
                <Line key={idx} points={pts} color={color} lineWidth={2.5} />
            ))}
            <mesh position={[0, 0, 0]}>
                <ringGeometry args={[0.25 * size, 0.32 * size, 4]} />
                <meshBasicMaterial color={color} transparent opacity={0.7} />
            </mesh>
        </group>
    );
}

function LogoEmblemSIGNAL({ color, size = 1 }: { color: THREE.ColorRepresentation; size?: number }) {
    const wavePoints = useMemo(() => {
        // Signal wave bars
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 20; i += 1) {
            const x = (i / 20 - 0.5) * size;
            const y = Math.sin(i * 0.8) * 0.3 * size;
            pts.push(new THREE.Vector3(x, y, 0));
        }
        return pts;
    }, [size]);

    return (
        <group>
            <Line points={wavePoints} color={color} lineWidth={2.5} />
            <mesh position={[-0.35 * size, 0, 0]}>
                <boxGeometry args={[0.08 * size, 0.5 * size, 0.1]} />
                <meshBasicMaterial color={color} transparent opacity={0.6} />
            </mesh>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.08 * size, 0.35 * size, 0.1]} />
                <meshBasicMaterial color={color} transparent opacity={0.6} />
            </mesh>
            <mesh position={[0.35 * size, 0, 0]}>
                <boxGeometry args={[0.08 * size, 0.2 * size, 0.1]} />
                <meshBasicMaterial color={color} transparent opacity={0.6} />
            </mesh>
        </group>
    );
}

function computeWidgetTransform(widget: TerminalWidget): WidgetTransform {
    const width = widget.size[0] * VIEWPORT_WIDTH;
    const height = widget.size[1] * VIEWPORT_HEIGHT;
    const x = widget.position[0] * VIEWPORT_WIDTH - VIEWPORT_WIDTH / 2 + width / 2;
    const y = VIEWPORT_HEIGHT / 2 - widget.position[1] * VIEWPORT_HEIGHT - height / 2;
    const z = widget.z ?? 0;
    return { width, height, x, y, z };
}

function TerminalBackdrop({ palette }: { palette: TerminalPalette }) {
    const gridPositions = useMemo(() => {
        const positions: number[] = [];
        const step = 2;
        for (let x = -VIEWPORT_WIDTH / 2; x <= VIEWPORT_WIDTH / 2; x += step) {
            positions.push(x, -VIEWPORT_HEIGHT / 2, 0, x, VIEWPORT_HEIGHT / 2, 0);
        }
        for (let y = -VIEWPORT_HEIGHT / 2; y <= VIEWPORT_HEIGHT / 2; y += step) {
            positions.push(-VIEWPORT_WIDTH / 2, y, 0, VIEWPORT_WIDTH / 2, y, 0);
        }
        return new Float32Array(positions);
    }, []);
    const highlightMaterialRef = useRef<THREE.ShaderMaterial>(null);

    useFrame(({ clock }) => {
        if (highlightMaterialRef.current) {
            highlightMaterialRef.current.uniforms.uTime.value = clock.getElapsedTime();
        }
    });

    return (
        <group>
            <mesh position={[0, 0, -1]}>
                <planeGeometry args={[VIEWPORT_WIDTH, VIEWPORT_HEIGHT]} />
                <meshBasicMaterial color={palette.background} />
            </mesh>
            <lineSegments>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[gridPositions, 3]} />
                </bufferGeometry>
                <lineBasicMaterial color={palette.grid} transparent opacity={0.35} />
            </lineSegments>
            <mesh position={[0, 0, -0.95]}>
                <planeGeometry args={[VIEWPORT_WIDTH, VIEWPORT_HEIGHT]} />
                <shaderMaterial
                    ref={highlightMaterialRef}
                    uniforms={{
                        uTime: { value: 0 },
                        uPrimary: { value: new THREE.Color(palette.primary) },
                    }}
                    vertexShader={CRT_VERTEX_SHADER}
                    fragmentShader={GRID_HIGHLIGHT_FRAGMENT_SHADER}
                    transparent
                    depthWrite={false}
                />
            </mesh>
            <mesh position={[0, 0, -0.9]} scale={[VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 1]}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial color={palette.glow} transparent opacity={0.08} />
            </mesh>
        </group>
    );
}

function AnimatedVerticalBar({
    widgetId,
    index,
    label,
    palette,
    x,
    widgetHeight,
    barWidth,
    barHeight,
    color,
}: {
    widgetId: string;
    index: number;
    label: string;
    palette: TerminalPalette;
    x: number;
    widgetHeight: number;
    barWidth: number;
    barHeight: number;
    color: THREE.ColorRepresentation;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const materialRef = useRef<THREE.MeshBasicMaterial>(null);
    const phase = useMemo(() => hashStringToFloat(`${widgetId}-${label}-${index}`) * Math.PI * 2, [widgetId, label, index]);
    const speed = useMemo(() => 0.9 + hashStringToFloat(`${widgetId}-speed-${index}`) * 0.8, [widgetId, index]);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const scale = 0.92 + Math.sin(t * speed + phase) * 0.1;
        if (groupRef.current) {
            groupRef.current.scale.y = scale;
        }
        if (materialRef.current) {
            const opacity = 0.78 + Math.sin(t * (speed * 1.4) + phase) * 0.12;
            materialRef.current.opacity = THREE.MathUtils.clamp(opacity, 0.42, 0.95);
        }
    });

    return (
        <group position={[x, 0, 0]}>
            <group ref={groupRef} position={[0, -widgetHeight / 2, 0]}>
                <mesh position={[0, barHeight / 2, 0.01]}>
                    <boxGeometry args={[barWidth, barHeight, 0.2]} />
                    <meshBasicMaterial ref={materialRef} color={color} transparent opacity={0.8} />
                </mesh>
            </group>
            <Text position={[0, -widgetHeight / 2 - 0.6, 0.02]} fontSize={0.7} color={palette.text} anchorX="center" anchorY="top">
                {label}
            </Text>
        </group>
    );
}

function AnimatedHorizontalBar({
    widgetId,
    index,
    label,
    palette,
    y,
    widgetWidth,
    barWidth,
    barHeight,
    color,
}: {
    widgetId: string;
    index: number;
    label: string;
    palette: TerminalPalette;
    y: number;
    widgetWidth: number;
    barWidth: number;
    barHeight: number;
    color: THREE.ColorRepresentation;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const materialRef = useRef<THREE.MeshBasicMaterial>(null);
    const phase = useMemo(() => hashStringToFloat(`${widgetId}-${label}-${index}`) * Math.PI * 2, [widgetId, label, index]);
    const speed = useMemo(() => 0.8 + hashStringToFloat(`${widgetId}-speed-h-${index}`) * 0.7, [widgetId, index]);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const scale = 0.9 + Math.sin(t * speed + phase) * 0.1;
        if (groupRef.current) {
            groupRef.current.scale.x = scale;
        }
        if (materialRef.current) {
            const opacity = 0.75 + Math.sin(t * (speed * 1.6) + phase) * 0.12;
            materialRef.current.opacity = THREE.MathUtils.clamp(opacity, 0.4, 0.92);
        }
    });

    return (
        <group position={[0, y, 0]}>
            <group ref={groupRef} position={[-widgetWidth / 2, 0, 0]}>
                <mesh position={[barWidth / 2, 0, 0.01]}>
                    <boxGeometry args={[barWidth, barHeight, 0.2]} />
                    <meshBasicMaterial ref={materialRef} color={color} transparent opacity={0.8} />
                </mesh>
            </group>
            <Text position={[-widgetWidth / 2 - 0.4, 0, 0.02]} fontSize={0.7} color={palette.text} anchorX="right" anchorY="middle">
                {label}
            </Text>
        </group>
    );
}

function RadarWidgetMesh({ widget, palette }: { widget: RadarWidget; palette: TerminalPalette }) {
    const { width, height, x, y, z } = computeWidgetTransform(widget);
    const radius = Math.min(width, height) / 2;
    const sweepRef = useRef<THREE.Mesh>(null);
    const reticleRef = useRef<THREE.Group>(null);

    const crosshairPositions = useMemo(() => {
        const r = radius * 0.92;
        const entries = [
            -r,
            0,
            0,
            r,
            0,
            0,
            0,
            -r,
            0,
            0,
            r,
            0,
            -r * 0.7,
            -r * 0.7,
            0,
            r * 0.7,
            r * 0.7,
            0,
            -r * 0.7,
            r * 0.7,
            0,
            r * 0.7,
            -r * 0.7,
            0,
        ];
        return new Float32Array(entries);
    }, [radius]);

    useFrame((_, delta) => {
        if (sweepRef.current) {
            sweepRef.current.rotation.z -= widget.sweepSpeed * delta;
        }
        if (reticleRef.current) {
            reticleRef.current.rotation.z += delta * 0.22;
        }
    });

    return (
        <group position={[x, y, z]}>
            <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial color={palette.background} transparent opacity={0.55} />
            </mesh>
            {[...Array(widget.rings).keys()].map((ring) => {
                const ringRadius = radius * ((ring + 1) / widget.rings);
                return (
                    <mesh key={`ring-${ring}`}>
                        <ringGeometry args={[ringRadius * 0.98, ringRadius, 64]} />
                        <meshBasicMaterial color={palette.primary} transparent opacity={0.25} side={THREE.DoubleSide} />
                    </mesh>
                );
            })}
            <group ref={reticleRef}>
                <lineSegments>
                    <bufferGeometry>
                        <bufferAttribute attach="attributes-position" args={[crosshairPositions, 3]} />
                    </bufferGeometry>
                    <lineBasicMaterial color={palette.grid} transparent opacity={0.45} />
                </lineSegments>
                <mesh>
                    <ringGeometry args={[radius * 0.05, radius * 0.07, 32]} />
                    <meshBasicMaterial color={palette.secondary} transparent opacity={0.5} side={THREE.DoubleSide} />
                </mesh>
            </group>
            <mesh ref={sweepRef}>
                <ringGeometry args={[radius * 0.1, radius, 64, 1, 0, Math.PI / 3]} />
                <meshBasicMaterial color={palette.secondary} transparent opacity={0.35} side={THREE.DoubleSide} />
            </mesh>
            {widget.blips.map((blip, index) => {
                const angle = blip.angle;
                const distance = blip.distance * radius;
                const bx = Math.cos(angle) * distance;
                const by = Math.sin(angle) * distance;
                return (
                    <mesh key={`blip-${index}`} position={[bx, by, 0.02]}>
                        <circleGeometry args={[0.18, 16]} />
                        <meshBasicMaterial color={palette.secondary} transparent opacity={0.7 * blip.strength} />
                    </mesh>
                );
            })}
        </group>
    );
}

function BarsWidgetMesh({ widget, palette }: { widget: BarsWidget; palette: TerminalPalette }) {
    const { width, height, x, y, z } = computeWidgetTransform(widget);
    const items = widget.items;
    const maxValue = Math.max(...items.map((item) => item.value), 1);
    const spacing = widget.orientation === 'vertical' ? width / items.length : height / items.length;

    return (
        <group position={[x, y, z]}>
            <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial color={palette.background} transparent opacity={0.45} />
            </mesh>
            {items.map((item, index) => {
                const normalized = item.value / maxValue;
                const color = item.tone === 'alert' ? palette.alert : item.tone === 'accent' ? palette.secondary : palette.primary;

                if (widget.orientation === 'vertical') {
                    const barWidth = spacing * 0.6;
                    const barHeight = height * normalized * 0.9;
                    const bx = -width / 2 + spacing * index + spacing / 2;

                    return (
                        <AnimatedVerticalBar
                            key={`${item.label}-${index}`}
                            widgetId={widget.id}
                            index={index}
                            label={item.label}
                            palette={palette}
                            x={bx}
                            widgetHeight={height}
                            barWidth={barWidth}
                            barHeight={barHeight}
                            color={color}
                        />
                    );
                }

                const barHeight = spacing * 0.55;
                const barWidth = width * normalized * 0.85;
                const by = height / 2 - spacing * index - spacing / 2;

                return (
                    <AnimatedHorizontalBar
                        key={`${item.label}-${index}`}
                        widgetId={widget.id}
                        index={index}
                        label={item.label}
                        palette={palette}
                        y={by}
                        widgetWidth={width}
                        barWidth={barWidth}
                        barHeight={barHeight}
                        color={color}
                    />
                );
            })}
        </group>
    );
}

type MetricCellProps = {
    metric: MetricsWidget['metrics'][number];
    palette: TerminalPalette;
    cellWidth: number;
    cellHeight: number;
    position: [number, number];
    widgetId: string;
    index: number;
};

function MetricCell({ metric, palette, cellWidth, cellHeight, position, widgetId, index }: MetricCellProps) {
    const highlightMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
    const valueRef = useRef<THREE.Mesh>(null);
    const phase = useMemo(() => hashStringToFloat(`${widgetId}-${metric.label}-${index}`) * Math.PI * 2, [widgetId, metric.label, index]);
    const scalePhase = useMemo(
        () => hashStringToFloat(`${widgetId}-scale-${metric.label}-${index}`) * Math.PI * 2,
        [widgetId, metric.label, index],
    );
    const toneColor = metric.tone === 'alert' ? palette.alert : metric.tone === 'accent' ? palette.secondary : palette.text;

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (highlightMaterialRef.current) {
            const opacity = 0.06 + Math.sin(t * 1.2 + phase) * 0.04;
            highlightMaterialRef.current.opacity = THREE.MathUtils.clamp(opacity, 0.02, 0.1);
            highlightMaterialRef.current.needsUpdate = true;
        }
        if (valueRef.current) {
            const scale = 1 + Math.sin(t * 0.8 + scalePhase) * 0.035;
            valueRef.current.scale.setScalar(scale);
        }
    });

    return (
        <group position={[position[0], position[1], 0]}>
            <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[cellWidth * 0.9, cellHeight * 0.8]} />
                <meshBasicMaterial ref={highlightMaterialRef} color={palette.glow} transparent opacity={0.08} />
            </mesh>
            <Text position={[0, cellHeight * 0.2, 0.02]} fontSize={0.6} color={palette.grid} anchorX="center" anchorY="middle">
                {metric.label.toUpperCase()}
            </Text>
            <Text
                ref={valueRef}
                position={[0, -cellHeight * 0.1, 0.02]}
                fontSize={0.9}
                color={toneColor}
                anchorX="center"
                anchorY="middle"
            >
                {metric.value}
            </Text>
        </group>
    );
}

function MetricsWidgetMesh({ widget, palette }: { widget: MetricsWidget; palette: TerminalPalette }) {
    const { width, height, x, y, z } = computeWidgetTransform(widget);
    const rows = Math.ceil(widget.metrics.length / widget.columns);
    const cellWidth = width / widget.columns;
    const cellHeight = height / rows;

    return (
        <group position={[x, y, z]}>
            <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial color={palette.background} transparent opacity={0.35} />
            </mesh>
            {widget.metrics.map((metric, index) => {
                const column = index % widget.columns;
                const row = Math.floor(index / widget.columns);
                const cx = -width / 2 + column * cellWidth + cellWidth / 2;
                const cy = height / 2 - row * cellHeight - cellHeight / 2;
                return (
                    <MetricCell
                        key={`${metric.label}-${index}`}
                        metric={metric}
                        palette={palette}
                        cellWidth={cellWidth}
                        cellHeight={cellHeight}
                        position={[cx, cy]}
                        widgetId={widget.id}
                        index={index}
                    />
                );
            })}
        </group>
    );
}

function ScrollWidgetMesh({ widget, palette }: { widget: ScrollWidget; palette: TerminalPalette }) {
    const { width, height, x, y, z } = computeWidgetTransform(widget);
    const groupRef = useRef<THREE.Group>(null);
    const totalHeight = widget.lines.length * 1.2;
    const phase = useMemo(() => hashStringToFloat(widget.id) * Math.PI * 2, [widget.id]);

    useFrame(({ clock }, delta) => {
        if (!groupRef.current) return;
        const t = clock.getElapsedTime();
        groupRef.current.position.y -= widget.speed * delta;
        if (groupRef.current.position.y < -totalHeight / 2) {
            groupRef.current.position.y = totalHeight / 2;
        }
        groupRef.current.position.x = Math.sin(t * 2.2 + phase) * 0.06;
        const glitch = Math.sin(t * 14.0 + phase * 2.0) * Math.sin(t * 2.4 + phase) * 0.08;
        groupRef.current.rotation.z = glitch * 0.18;
    });

    return (
        <group position={[x, y, z]}>
            <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial color={palette.background} transparent opacity={0.3} />
            </mesh>
            <group ref={groupRef} position={[0, 0, 0.02]}>
                {widget.lines.map((line, index) => (
                    <Text
                        key={`${line}-${index}`}
                        position={[0, totalHeight / 2 - index * 1.2, 0]}
                        fontSize={0.65}
                        color={palette.secondary}
                        anchorX="center"
                        anchorY="middle"
                    >
                        {line}
                    </Text>
                ))}
            </group>
        </group>
    );
}

function GlyphWidgetMesh({ widget, palette }: { widget: GlyphWidget; palette: TerminalPalette }) {
    const { width, height, x, y, z } = computeWidgetTransform(widget);
    const size = Math.min(width, height) * 0.8;
    const groupRef = useRef<THREE.Group>(null);
    const materialRef = useRef<THREE.LineBasicMaterial>(null);
    const phase = useMemo(() => hashStringToFloat(widget.id) * Math.PI * 2, [widget.id]);

    const points = useMemo(() => {
        switch (widget.glyph) {
            case 'mech':
                return [
                    [-0.5, 0.6, 0],
                    [0.2, 0.6, 0],
                    [0.5, 0.2, 0],
                    [0.5, -0.4, 0],
                    [0.1, -0.6, 0],
                    [-0.5, -0.3, 0],
                    [-0.5, 0.6, 0],
                ];
            case 'city':
                return [
                    [-0.8, -0.6, 0],
                    [-0.6, 0.2, 0],
                    [-0.4, -0.1, 0],
                    [-0.2, 0.4, 0],
                    [0.1, -0.5, 0],
                    [0.3, 0.1, 0],
                    [0.6, -0.2, 0],
                    [0.8, 0.6, 0],
                ];
            case 'signal':
                return [
                    [-0.7, -0.3, 0],
                    [-0.3, 0.3, 0],
                    [0, -0.6, 0],
                    [0.3, 0.4, 0],
                    [0.7, -0.2, 0],
                ];
            case 'sphere':
                return [...Array(32).keys()].map((i) => {
                    const theta = (i / 31) * Math.PI * 2;
                    return [Math.cos(theta), Math.sin(theta), 0];
                });
            default:
                return [
                    [-0.6, -0.6, 0],
                    [-0.6, 0.6, 0],
                    [0.6, 0.6, 0],
                    [0.6, -0.6, 0],
                    [-0.6, -0.6, 0],
                ];
        }
    }, [widget.glyph]);

    const positionArray = useMemo(() => {
        const arr: number[] = [];
        points.forEach((point, idx) => {
            if (idx === points.length - 1) return;
            const next = points[idx + 1];
            arr.push(point[0] * size, point[1] * size, 0, next[0] * size, next[1] * size, 0);
        });
        return new Float32Array(arr);
    }, [points, size]);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (groupRef.current) {
            const scale = 0.96 + Math.sin(t * 0.6 + phase) * 0.04;
            groupRef.current.rotation.z = Math.sin(t * 0.35 + phase) * 0.08;
            groupRef.current.scale.setScalar(scale);
        }
        if (materialRef.current) {
            const opacity = 0.55 + Math.sin(t * 1.25 + phase * 3.1) * 0.25;
            materialRef.current.opacity = THREE.MathUtils.clamp(opacity, 0.25, 0.85);
        }
    });

    return (
        <group ref={groupRef} position={[x, y, z]}>
            <mesh position={[0, 0, -0.02]}>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial color={palette.background} transparent opacity={0.25} />
            </mesh>
            <lineSegments>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[positionArray, 3]} />
                </bufferGeometry>
                <lineBasicMaterial ref={materialRef} color={palette.secondary} transparent opacity={0.75} />
            </lineSegments>
        </group>
    );
}

function BadgeWidgetMesh({ widget, palette }: { widget: BadgeWidget; palette: TerminalPalette }) {
    const { width, height, x, y, z } = computeWidgetTransform(widget);
    const toneColor = widget.tone === 'alert' ? palette.alert : widget.tone === 'accent' ? palette.secondary : palette.primary;
    const borderRef = useRef<Line2 | LineSegments2 | null>(null);
    const phase = useMemo(() => hashStringToFloat(widget.id) * Math.PI * 2, [widget.id]);

    useFrame(({ clock }) => {
        const frame = borderRef.current;
        if (!frame) return;
        const material = frame.material as LineMaterial | undefined;
        if (!material) return;
        const t = clock.getElapsedTime();
        const opacity = 0.48 + Math.sin(t * 1.1 + phase) * 0.18;
        material.opacity = THREE.MathUtils.clamp(opacity, 0.25, 0.75);
        material.transparent = true;
        material.needsUpdate = true;
    });

    return (
        <group position={[x, y, z]}>
            <mesh>
                <boxGeometry args={[width, height, 0.1]} />
                <meshBasicMaterial color={palette.background} transparent opacity={0.5} />
            </mesh>
            <Line
                ref={borderRef}
                points={[
                    [-width / 2, -height / 2, 0],
                    [-width / 2, height / 2, 0],
                    [width / 2, height / 2, 0],
                    [width / 2, -height / 2, 0],
                    [-width / 2, -height / 2, 0],
                ]}
                color={toneColor}
                lineWidth={1.5}
                opacity={0.6}
                transparent
            />
            <Text position={[0, height * 0.2, 0.05]} fontSize={0.6} color={palette.grid} anchorX="center" anchorY="middle">
                {widget.label.toUpperCase()}
            </Text>
            <Text position={[0, -height * 0.1, 0.05]} fontSize={0.85} color={toneColor} anchorX="center" anchorY="middle">
                {widget.value}
            </Text>
        </group>
    );
}

function CRTNoiseOverlay({ palette }: { palette: TerminalPalette }) {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    useFrame(({ clock }) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
        }
    });

    return (
        <mesh position={[0, 0, 0.8]} renderOrder={10}>
            <planeGeometry args={[VIEWPORT_WIDTH, VIEWPORT_HEIGHT]} />
            <shaderMaterial
                ref={materialRef}
                uniforms={{
                    uTime: { value: 0 },
                    uStrength: { value: 0.08 },
                    uAccent: { value: new THREE.Color(palette.secondary) },
                }}
                vertexShader={CRT_VERTEX_SHADER}
                fragmentShader={CRT_FRAGMENT_SHADER}
                transparent
                depthWrite={false}
            />
        </mesh>
    );
}

function WidgetRenderer({ widget, palette }: { widget: TerminalWidget; palette: TerminalPalette }) {
    switch (widget.type) {
        case 'radar':
            return <RadarWidgetMesh widget={widget} palette={palette} />;
        case 'bars':
            return <BarsWidgetMesh widget={widget} palette={palette} />;
        case 'metrics':
            return <MetricsWidgetMesh widget={widget} palette={palette} />;
        case 'glyph':
            return <GlyphWidgetMesh widget={widget} palette={palette} />;
        case 'scroll':
            return <ScrollWidgetMesh widget={widget} palette={palette} />;
        case 'badge':
            return <BadgeWidgetMesh widget={widget} palette={palette} />;
        default:
            return null;
    }
}

function AnimatedBasename({
    name,
    palette,
    position
}: {
    name: string;
    palette: TerminalPalette;
    position: [number, number, number];
}) {
    const textRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.MeshBasicMaterial>(null);
    const phase = useMemo(() => hashStringToFloat(name) * Math.PI * 2, [name]);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (materialRef.current) {
            // Pulse opacity
            const opacity = 0.75 + Math.sin(t * 1.2 + phase) * 0.15;
            materialRef.current.opacity = THREE.MathUtils.clamp(opacity, 0.6, 0.95);
        }
        if (textRef.current) {
            // Subtle scale breathing
            const scale = 1.0 + Math.sin(t * 0.8 + phase) * 0.03;
            textRef.current.scale.setScalar(scale);
        }
    });

    return (
        <group position={position}>
            <Text
                ref={textRef}
                fontSize={0.7}
                color={palette.secondary}
                anchorX="right"
                anchorY="middle"
                // @ts-expect-error - drei Text material typing
                materialRef={materialRef}
            >
                {name}
            </Text>
        </group>
    );
}

function HeaderLayer({ blueprint }: { blueprint: SceneBlueprint }) {
    const { palette, header } = blueprint;
    const logoVariant = header.logoVariant ?? 'vot';
    const logoColor = palette.secondary;
    const logoSize = 1.5;
    const logoX = VIEWPORT_WIDTH / 2 - 3.5;
    const logoY = VIEWPORT_HEIGHT / 2 - 3.0;

    return (
        <group>
            <Text
                position={[-VIEWPORT_WIDTH / 2 + 1.2, VIEWPORT_HEIGHT / 2 - 1.6, 0.5]}
                fontSize={1.1}
                color={palette.secondary}
                anchorX="left"
                anchorY="middle"
            >
                {header.code}
            </Text>
            <Text
                position={[-VIEWPORT_WIDTH / 2 + 1.2, VIEWPORT_HEIGHT / 2 - 3.2, 0.5]}
                fontSize={1.6}
                color={palette.primary}
                anchorX="left"
                anchorY="middle"
            >
                {header.title}
            </Text>
            <Text
                position={[-VIEWPORT_WIDTH / 2 + 1.2, VIEWPORT_HEIGHT / 2 - 4.6, 0.5]}
                fontSize={0.9}
                color={palette.text}
                anchorX="left"
                anchorY="middle"
            >
                {header.subtitle}
            </Text>

            {/* Animated Basename/ENS Display */}
            {header.ownerName && (
                <AnimatedBasename
                    name={header.ownerName}
                    palette={palette}
                    position={[VIEWPORT_WIDTH / 2 - 1.5, VIEWPORT_HEIGHT / 2 - 1.6, 0.5]}
                />
            )}

            <group position={[logoX, logoY, 0.5]}>
                {logoVariant === 'vot' && <LogoEmblemVOT color={logoColor} size={logoSize} />}
                {logoVariant === 'base' && <LogoEmblemBASE color={logoColor} size={logoSize} />}
                {logoVariant === 'warplet' && <LogoEmblemWARPLET color={logoColor} size={logoSize} />}
                {logoVariant === 'mech' && <LogoEmblemMECH color={logoColor} size={logoSize} />}
                {logoVariant === 'signal' && <LogoEmblemSIGNAL color={logoColor} size={logoSize} />}
            </group>
        </group>
    );
}

function FooterLayer({ blueprint }: { blueprint: SceneBlueprint }) {
    const { palette, footer } = blueprint;
    const bannerHeight = 1.4;
    return (
        <group position={[0, -VIEWPORT_HEIGHT / 2 + bannerHeight / 2, 0.5]}>
            <mesh>
                <planeGeometry args={[VIEWPORT_WIDTH, bannerHeight]} />
                <meshBasicMaterial color={palette.background} transparent opacity={0.72} />
            </mesh>
            <Text fontSize={0.85} color={palette.text} anchorX="center" anchorY="middle">
                {footer.caption}
            </Text>
            <Text
                position={[VIEWPORT_WIDTH / 2 - 1.5, 0, 0.01]}
                fontSize={0.65}
                color={palette.grid}
                anchorX="right"
                anchorY="middle"
            >
                REFRESH {footer.refreshIntervalSeconds}s
            </Text>
        </group>
    );
}

export function BlueprintScene({ blueprint }: { blueprint: SceneBlueprint }) {
    return (
        <>
            <OrthographicCamera makeDefault position={[0, 0, 25]} zoom={20} />
            <TerminalBackdrop palette={blueprint.palette} />
            <HeaderLayer blueprint={blueprint} />
            <FooterLayer blueprint={blueprint} />
            {blueprint.widgets.map((widget) => (
                <WidgetRenderer key={widget.id} widget={widget} palette={blueprint.palette} />
            ))}
            <CRTNoiseOverlay palette={blueprint.palette} />
        </>
    );
}

export function SceneForge({ blueprint, className }: { blueprint: SceneBlueprint; className?: string }) {
    return (
        <div className={className} data-tier={blueprint.tierId}>
            <Canvas orthographic shadows={false} dpr={[1, 1.5]}>
                <Suspense fallback={null}>
                    <BlueprintScene blueprint={blueprint} />
                </Suspense>
            </Canvas>
        </div>
    );
}
