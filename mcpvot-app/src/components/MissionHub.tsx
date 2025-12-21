'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { useMissions } from '@/hooks/useMissions';

interface Mission {
    id: string;
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    reward: {
        nft: string;
        votTokens: number;
        xp: number;
    };
    requirements: string[];
    progress: number;
    maxProgress: number;
    completed: boolean;
    claimed: boolean;
    icon: string;
    color: string;
}

interface MissionHubProps {
    className?: string;
}

const MATRIX_PARTICLE_COUNT = 200;
const PREVIEW_PARTICLE_COUNT = 100;

const MissionHub = ({ className = '' }: MissionHubProps) => {
    const { missions, stats, loading, completeMission, claimReward } = useMissions();
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const backgroundCleanupRef = useRef<(() => void) | null>(null);
    const previewCleanupRef = useRef<(() => void) | null>(null);

    // Initialize background matrix effect once
    useEffect(() => {
        if (!backgroundCanvasRef.current) {
            return;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        const renderer = new THREE.WebGLRenderer({
            canvas: backgroundCanvasRef.current,
            alpha: true,
            antialias: true,
        });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        camera.position.z = 5;

        const matrixGeometry = new THREE.BufferGeometry();
        const matrixPositions = new Float32Array(MATRIX_PARTICLE_COUNT * 3);
        const matrixColors = new Float32Array(MATRIX_PARTICLE_COUNT * 3);
        const matrixSpeeds: number[] = [];

        for (let i = 0; i < MATRIX_PARTICLE_COUNT; i += 1) {
            matrixPositions[i * 3] = (Math.random() - 0.5) * 20;
            matrixPositions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            matrixPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;

            matrixColors[i * 3] = 0;
            matrixColors[i * 3 + 1] = Math.random() * 0.5 + 0.5;
            matrixColors[i * 3 + 2] = 0;

            matrixSpeeds.push(Math.random() * 0.02 + 0.01);
        }

        matrixGeometry.setAttribute('position', new THREE.BufferAttribute(matrixPositions, 3));
        matrixGeometry.setAttribute('color', new THREE.BufferAttribute(matrixColors, 3));

        const matrixMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
        });

        const matrixParticles = new THREE.Points(matrixGeometry, matrixMaterial);
        scene.add(matrixParticles);

        const gridHelper = new THREE.GridHelper(20, 20, 0x00ff00, 0x004400);
        gridHelper.position.y = -5;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.3;
        scene.add(gridHelper);

        let frameId: number;
        let time = 0;

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            time += 0.016;

            const positions = matrixGeometry.attributes.position.array as Float32Array;
            for (let i = 0; i < MATRIX_PARTICLE_COUNT; i += 1) {
                positions[i * 3 + 1] -= matrixSpeeds[i];
                if (positions[i * 3 + 1] < -10) {
                    positions[i * 3 + 1] = 10;
                    positions[i * 3] = (Math.random() - 0.5) * 20;
                }
            }
            matrixGeometry.attributes.position.needsUpdate = true;

            (gridHelper.material as THREE.Material).opacity =
                0.3 + Math.sin(time) * 0.1;
            gridHelper.rotation.z += 0.001;

            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        backgroundCleanupRef.current = () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', handleResize);
            scene.clear();
            renderer.dispose();
        };

        return () => {
            backgroundCleanupRef.current?.();
            backgroundCleanupRef.current = null;
        };
    }, []);

    // Mission preview scene that reacts to the selected mission
    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 200 / 150, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
            antialias: true,
        });

        renderer.setSize(200, 150);
        renderer.setPixelRatio(window.devicePixelRatio);
        camera.position.z = 5;

        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        const directionalLight = new THREE.DirectionalLight(0x00ff00, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(ambientLight, directionalLight);

        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(PREVIEW_PARTICLE_COUNT * 3);
        const particleColors = new Float32Array(PREVIEW_PARTICLE_COUNT * 3);

        for (let i = 0; i < PREVIEW_PARTICLE_COUNT; i += 1) {
            particlePositions[i * 3] = (Math.random() - 0.5) * 10;
            particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;

            particleColors[i * 3] = Math.random() * 0.5;
            particleColors[i * 3 + 1] = Math.random() * 0.8 + 0.2;
            particleColors[i * 3 + 2] = Math.random() * 0.3;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);

        const makeMaterial = (color: number, options: Partial<THREE.MeshPhongMaterialParameters>) =>
            new THREE.MeshPhongMaterial({
                color,
                transparent: true,
                ...options,
            });

        const missionGeometry = (() => {
            if (selectedMission?.difficulty === 'beginner') {
                return new THREE.SphereGeometry(1, 32, 32);
            }
            if (selectedMission?.difficulty === 'intermediate') {
                return new THREE.OctahedronGeometry(1.2);
            }
            if (selectedMission?.difficulty === 'advanced') {
                return new THREE.IcosahedronGeometry(1.3);
            }
            return new THREE.TorusGeometry(1, 0.4, 16, 100);
        })();

        const missionMaterial = (() => {
            if (selectedMission?.difficulty === 'beginner') {
                return makeMaterial(0x00ff00, { opacity: 0.8, emissive: 0x002200 });
            }
            if (selectedMission?.difficulty === 'intermediate') {
                return makeMaterial(0xffa500, {
                    opacity: 0.7,
                    wireframe: true,
                    emissive: 0x331100,
                });
            }
            if (selectedMission?.difficulty === 'advanced') {
                return makeMaterial(0xff0000, { opacity: 0.9, emissive: 0x220000 });
            }
            return makeMaterial(0x00ff00, {
                opacity: 0.7,
                wireframe: true,
                emissive: 0x002200,
            });
        })();

        const mesh = new THREE.Mesh(missionGeometry, missionMaterial);
        scene.add(mesh);

        const orbitingElements: THREE.Mesh[] = [];
        if (selectedMission?.difficulty === 'advanced') {
            for (let i = 0; i < 3; i += 1) {
                const orbitGeometry = new THREE.SphereGeometry(0.1, 8, 8);
                const orbitMaterial = makeMaterial(0xff4500, { emissive: 0x331100 });
                const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);
                orbitingElements.push(orbitMesh);
                scene.add(orbitMesh);
            }
        }

        let frameId: number;
        let time = 0;

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            time += 0.01;

            mesh.rotation.x += 0.01;
            mesh.rotation.y += 0.015;

            const positions = particleGeometry.attributes.position.array as Float32Array;
            for (let i = 0; i < PREVIEW_PARTICLE_COUNT; i += 1) {
                positions[i * 3 + 1] += Math.sin(time + i * 0.1) * 0.002;
                if (positions[i * 3 + 1] > 5) {
                    positions[i * 3 + 1] = -5;
                }
            }
            particleGeometry.attributes.position.needsUpdate = true;

            orbitingElements.forEach((element, index) => {
                const angle = time * 2 + (index * Math.PI * 2) / 3;
                element.position.set(
                    Math.cos(angle) * 2,
                    Math.sin(time * 3 + index) * 0.5,
                    Math.sin(angle) * 2
                );
                element.rotation.x += 0.02;
                element.rotation.y += 0.02;
            });

            if (selectedMission?.completed) {
                const pulse = Math.sin(time * 4) * 0.1 + 1;
                mesh.scale.setScalar(pulse);
            } else {
                mesh.scale.setScalar(1);
            }

            renderer.render(scene, camera);
        };

        animate();

        previewCleanupRef.current = () => {
            cancelAnimationFrame(frameId);
            scene.clear();
            renderer.dispose();
        };

        return () => {
            previewCleanupRef.current?.();
            previewCleanupRef.current = null;
        };
    }, [selectedMission]);

    return (
        <div className={`relative min-h-screen ${className}`} style={{ backgroundColor: '#0a0e18' }}>
            <canvas ref={backgroundCanvasRef} className="pointer-events-none fixed inset-0" />

            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(0deg, transparent 24%, rgba(0, 255, 204, 0.03) 25%, rgba(0, 255, 204, 0.03) 26%, transparent 27%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 204, 0.03) 25%, rgba(0, 255, 204, 0.03) 26%, transparent 27%, transparent)',
                    backgroundSize: '60px 60px',
                }}
            />

            <div className="relative z-10 mx-auto max-w-5xl space-y-6 p-4 md:p-8">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-lg font-bold uppercase tracking-[0.4em] text-blue-300">
                            <span className="text-slate-200">{'//MSG'}</span> Mission Grid
                        </h2>
                        <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                            Missions completed: {stats?.completedMissions ?? 0} • XP earned: {stats?.totalXP ?? 0}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-cyan-500/20 bg-black/60 p-4">
                        <span className="text-xs uppercase tracking-[0.3em] text-cyan-400">Completed</span>
                        <p className="text-xl font-semibold text-cyan-200">{stats?.completedMissions ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-cyan-500/20 bg-black/60 p-4">
                        <span className="text-xs uppercase tracking-[0.3em] text-cyan-400">XP Earned</span>
                        <p className="text-xl font-semibold text-cyan-200">{stats?.totalXP ?? 0}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-8 text-center text-cyan-400">Loading missions...</div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {missions.map(mission => (
                                <button
                                    key={mission.id}
                                    type="button"
                                    className="group relative flex h-28 flex-col items-center justify-center gap-1 rounded-lg border border-cyan-400/30 bg-black/40 p-3 text-center transition-all duration-300 hover:scale-105 hover:border-cyan-400/60 hover:bg-cyan-500/10"
                                    onClick={() => setSelectedMission(mission)}
                                >
                                    <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(59,130,246,0.08))' }} />
                                    <div className="relative z-10 space-y-1">
                                        <div className="text-3xl">{mission.icon}</div>
                                        <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-cyan-200 line-clamp-2">
                                            {mission.title}
                                        </div>
                                        <div className="text-[0.55rem] uppercase tracking-[0.3em] text-cyan-400/60">
                                            {mission.difficulty}
                                        </div>
                                    </div>
                                    {mission.completed && (
                                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-green-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {selectedMission && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 p-4">
                    <div className="w-full max-w-md overflow-y-auto rounded-2xl border border-cyan-400/30 bg-black/70 p-6 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
                        <div className="flex items-center justify-between border-b border-cyan-400/30 pb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{selectedMission.icon}</span>
                                <div>
                                    <h3 className="text-lg font-bold text-cyan-300">{selectedMission.title}</h3>
                                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-400/70">
                                        {selectedMission.difficulty} mission
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedMission(null)}
                                className="rounded-full p-2 text-cyan-400/70 transition hover:bg-cyan-400/10 hover:text-cyan-300"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-4 space-y-4">
                            <div className="overflow-hidden rounded-lg border border-cyan-400/30 bg-black/50">
                                <canvas ref={canvasRef} className="h-40 w-full" />
                            </div>

                            <p className="text-sm leading-relaxed text-cyan-100/90">{selectedMission.description}</p>

                            <div className="space-y-2 rounded-xl border border-cyan-400/30 bg-black/50 p-4">
                                <h4 className="text-xs uppercase tracking-[0.3em] text-cyan-300">Rewards</h4>
                                <div className="space-y-1 text-sm text-cyan-100">
                                    <div className="flex items-center justify-between">
                                        <span>NFT</span>
                                        <span>{selectedMission.reward.nft}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>VOT Tokens</span>
                                        <span>+{selectedMission.reward.votTokens}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>XP</span>
                                        <span>+{selectedMission.reward.xp}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1 rounded-xl border border-cyan-400/30 bg-black/50 p-4">
                                <h4 className="text-xs uppercase tracking-[0.3em] text-cyan-300">Requirements</h4>
                                <ul className="space-y-1 text-sm text-cyan-100/80">
                                    {selectedMission.requirements.map((requirement, index) => (
                                        <li key={requirement} className="flex items-start gap-2">
                                            <span className="text-cyan-400">{index + 1}.</span>
                                            <span>{requirement}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-cyan-400/80">
                                    <span>Progress</span>
                                    <span>
                                        {selectedMission.progress}/{selectedMission.maxProgress}
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded border border-cyan-400/30 bg-black/60">
                                    <div
                                        className="h-full bg-cyan-400"
                                        style={{ width: `${(selectedMission.progress / selectedMission.maxProgress) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                {selectedMission.completed && !selectedMission.claimed ? (
                                    <button
                                        type="button"
                                        onClick={() => claimReward(selectedMission.id)}
                                        className="flex-1 rounded-xl border border-green-500/50 bg-gradient-to-r from-green-600/20 to-emerald-600/20 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-green-200 transition hover:border-green-400 hover:shadow-[0_0_25px_rgba(34,197,94,0.5)]"
                                    >
                                        Claim Reward
                                    </button>
                                ) : selectedMission.progress === selectedMission.maxProgress ? (
                                    <button
                                        type="button"
                                        onClick={() => completeMission(selectedMission.id)}
                                        className="flex-1 rounded-xl border border-green-500/50 bg-gradient-to-r from-green-600/20 to-emerald-600/20 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-green-200 transition hover:border-green-400 hover:shadow-[0_0_25px_rgba(34,197,94,0.5)]"
                                    >
                                        Complete Mission
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="flex-1 rounded-xl border border-cyan-500/50 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200 transition hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]"
                                    >
                                        Start Mission
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setSelectedMission(null)}
                                    className="rounded-xl border border-slate-500/50 bg-gradient-to-r from-slate-600/20 to-slate-700/20 px-4 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-slate-200 transition hover:border-slate-400 hover:shadow-[0_0_25px_rgba(148,163,184,0.4)]"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MissionHub;
