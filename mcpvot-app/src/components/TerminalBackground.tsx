'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Matrix green color values (matching MCPVOT branding)
const MATRIX_GREEN_HEX = 0x77FE80;  // #77FE80 - Bright matrix green

export default function TerminalBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance' // Mobile optimization
        });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for mobile
        container.appendChild(renderer.domElement);

        // Sacred geometry grid (subtle)
        const gridGeometry = new THREE.PlaneGeometry(20, 20, 20, 20);
        const gridMaterial = new THREE.MeshBasicMaterial({
            color: MATRIX_GREEN_HEX,
            wireframe: true,
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide
        });
        const grid = new THREE.Mesh(gridGeometry, gridMaterial);
        grid.rotation.x = -Math.PI / 3;
        grid.position.z = -5;
        scene.add(grid);

        // Floating particles (hieroglyphic symbols)
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 100; // Reduced for mobile
        const positions = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 15;
            positions[i + 1] = (Math.random() - 0.5) * 15;
            positions[i + 2] = (Math.random() - 0.5) * 10;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            color: MATRIX_GREEN_HEX,
            size: 0.05,
            transparent: true,
            opacity: 0.3,
            sizeAttenuation: true
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);

        // Sacred geometry hexagon
        const hexagonShape = new THREE.Shape();
        const radius = 2;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            if (i === 0) hexagonShape.moveTo(x, y);
            else hexagonShape.lineTo(x, y);
        }
        hexagonShape.closePath();

        const hexagonGeometry = new THREE.ShapeGeometry(hexagonShape);
        const hexagonMaterial = new THREE.LineBasicMaterial({
            color: MATRIX_GREEN_HEX,
            transparent: true,
            opacity: 0.15,
            linewidth: 1
        });

        const hexagonLine = new THREE.LineSegments(
            new THREE.EdgesGeometry(hexagonGeometry),
            hexagonMaterial
        );
        hexagonLine.position.z = -3;
        scene.add(hexagonLine);

        // Metatron's Cube (subtle sacred geometry)
        const numCircles = 7;
        const circleRadius = 1.5;
        const circles: THREE.Line[] = [];

        for (let i = 0; i < numCircles; i++) {
            const circleCurve = new THREE.EllipseCurve(
                0, 0,
                circleRadius * 0.4, circleRadius * 0.4,
                0, 2 * Math.PI,
                false,
                0
            );

            const circlePoints = circleCurve.getPoints(32);
            const circleGeometry = new THREE.BufferGeometry().setFromPoints(circlePoints);
            const circleMaterial = new THREE.LineBasicMaterial({
                color: MATRIX_GREEN_HEX,
                transparent: true,
                opacity: 0.1
            });

            const circle = new THREE.Line(circleGeometry, circleMaterial);
            const angle = (Math.PI * 2 / numCircles) * i;
            circle.position.x = Math.cos(angle) * circleRadius;
            circle.position.y = Math.sin(angle) * circleRadius;
            circle.position.z = -4;
            circles.push(circle);
            scene.add(circle);
        }

        // Terminal scan lines effect
        const scanlineGeometry = new THREE.PlaneGeometry(30, 0.02);
        const scanlineMaterial = new THREE.MeshBasicMaterial({
            color: MATRIX_GREEN_HEX,
            transparent: true,
            opacity: 0.1
        });
        const scanline = new THREE.Mesh(scanlineGeometry, scanlineMaterial);
        scanline.position.z = -2;
        scene.add(scanline);

        camera.position.z = 5;

        // Animation
        let animationFrameId: number;
        let time = 0;

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            time += 0.005;

            // Slow, subtle grid rotation
            grid.rotation.z = Math.sin(time * 0.3) * 0.05;

            // Gentle particle drift
            const particlePositions = particles.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < particlePositions.length; i += 3) {
                particlePositions[i + 1] += Math.sin(time + i) * 0.001;
                if (particlePositions[i + 1] > 7.5) particlePositions[i + 1] = -7.5;
            }
            particles.geometry.attributes.position.needsUpdate = true;

            // Subtle hexagon pulse
            hexagonLine.scale.set(
                1 + Math.sin(time * 0.5) * 0.05,
                1 + Math.sin(time * 0.5) * 0.05,
                1
            );
            hexagonLine.rotation.z = time * 0.1;

            // Sacred geometry breathing
            circles.forEach((circle, index) => {
                circle.rotation.z = time * 0.15 + index * 0.2;
                const scale = 1 + Math.sin(time * 0.7 + index) * 0.03;
                circle.scale.set(scale, scale, 1);
            });

            // Scanline movement
            scanline.position.y = Math.sin(time * 2) * 5;

            // Subtle camera sway
            camera.position.x = Math.sin(time * 0.2) * 0.2;
            camera.position.y = Math.cos(time * 0.15) * 0.2;

            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);

            // Dispose geometries and materials
            gridGeometry.dispose();
            gridMaterial.dispose();
            particlesGeometry.dispose();
            particlesMaterial.dispose();
            hexagonGeometry.dispose();
            hexagonMaterial.dispose();
            scanlineGeometry.dispose();
            scanlineMaterial.dispose();

            circles.forEach(circle => {
                circle.geometry.dispose();
                (circle.material as THREE.Material).dispose();
            });

            renderer.dispose();
            if (container) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 -z-10"
            style={{
                background: 'linear-gradient(180deg, #050505 0%, #051a0a 50%, #0a2010 100%)',
                pointerEvents: 'none'
            }}
        />
    );
}
