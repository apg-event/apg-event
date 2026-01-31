import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, Stars, Float, useGLTF, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { getSectorInfo } from '../../constants';
import { Player } from '../../types';
import { TerrainModel } from './TerrainModel';
import { MousePointer2, X, Sun, Moon, Heart, Package, Sparkles as SparklesIcon, Clock, ExternalLink } from 'lucide-react';
import { GameIcon } from '../UI/GameIcon';

// --- HELPERS ---

// Generate a procedural noise texture for the snow ground
const useSnowTexture = () => {
    return useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, 512, 512);
            for (let i = 0; i < 50000; i++) {
                const x = Math.random() * 512;
                const y = Math.random() * 512;
                const opacity = Math.random() * 0.1;
                context.fillStyle = `rgba(0, 0, 0, ${opacity})`;
                context.fillRect(x, y, 2, 2);
            }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(50, 50);
        return texture;
    }, []);
};

// Reusable logic to find a 3D position from nodes and player tile ID
const getPlayerPosition3D = (nodes: any, tileId: number): THREE.Vector3 => {
    if (!nodes) return new THREE.Vector3(0, 10, 0);

    const suffix = tileId.toString().padStart(3, '0');
    const nodeName = `tile${suffix}`;
    
    const targetNode = nodes[nodeName];
    
    if (targetNode) {
            targetNode.updateWorldMatrix(true, false);
            
            if (targetNode.geometry) {
                if (!targetNode.geometry.boundingBox) targetNode.geometry.computeBoundingBox();
                const center = new THREE.Vector3();
                targetNode.geometry.boundingBox.getCenter(center);
                center.applyMatrix4(targetNode.matrixWorld);
                center.y += 0.5; // Slightly adjust base height
                return center;
            }

            const pos = new THREE.Vector3();
            targetNode.getWorldPosition(pos);
            pos.y += 0.5; 
            return pos;
    }

    if (tileId > 100 && nodes['tile100']) return getPlayerPosition3D(nodes, 100);

    return new THREE.Vector3(0, 10, 0);
};

// --- DYNAMIC SUN SYSTEM (MSK TIME) ---
// (Logic unchanged, only shadows removed)

const START_TIMESTAMP = Date.UTC(2026, 1, 2, 13, 0, 0); 
const END_TIMESTAMP = Date.UTC(2026, 1, 16, 16, 0, 0);

interface SunConfig {
    position: [number, number, number];
    color: string;
    intensity: number;
    ambientColor: string;
    ambientIntensity: number;
    fogColor: string;
    isNight: boolean;
    displayTime: string;
    eventStatus: string;
}

const getMoscowSunConfig = (): SunConfig => {
    const now = new Date();
    const nowMs = now.getTime();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    let mskHours = utcHours + 3;
    if (mskHours >= 24) mskHours -= 24;
    const timeFloat = mskHours + utcMinutes / 60;

    const displayTime = now.toLocaleTimeString("ru-RU", {
        timeZone: "Europe/Moscow", 
        hour: '2-digit', 
        minute: '2-digit'
    });

    let eventStatus = "WIP";
    if (nowMs >= END_TIMESTAMP) eventStatus = "ФИНИШ";
    else if (nowMs < START_TIMESTAMP) eventStatus = "WIP";
    else {
        const diff = nowMs - START_TIMESTAMP;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
        eventStatus = `День ${days}`;
    }

    const SUN_DISTANCE = 200;
    
    if (timeFloat < 6 || timeFloat > 18) {
        return {
            position: [50, 100, 50],
            color: "#60a5fa",
            intensity: 0.8,
            ambientColor: "#1e3a8a",
            ambientIntensity: 0.3,
            fogColor: "#0f172a",
            isNight: true,
            displayTime,
            eventStatus
        };
    }
    
    const dayProgress = (timeFloat - 6) / 12;
    const angle = dayProgress * Math.PI;
    const x = -Math.cos(angle) * SUN_DISTANCE; 
    const y = Math.sin(angle) * SUN_DISTANCE * 0.8;
    const z = -50;
    
    let sunColor = "#ffe4b5";
    let fogColor = "#dbeafe";
    let ambientColor = "#e0f2fe";
    let ambientIntensity = 0.6;
    let intensity = 2.0;

    if (dayProgress < 0.2) { 
        sunColor = "#fb923c";
        fogColor = "#ffedd5";
        intensity = 1.5;
    } else if (dayProgress > 0.8) {
        sunColor = "#f472b6";
        fogColor = "#fae8ff"; 
        ambientColor = "#5b21b6";
        intensity = 1.5;
    }

    return {
        position: [x, y, z],
        color: sunColor,
        intensity: intensity,
        ambientColor: ambientColor,
        ambientIntensity: ambientIntensity,
        fogColor: fogColor,
        isNight: false,
        displayTime,
        eventStatus
    };
};

const DynamicLighting = ({ config, isMobile }: { config: SunConfig, isMobile: boolean }) => {
    const { scene } = useThree();
    useEffect(() => {
        scene.background = new THREE.Color(config.fogColor);
        if (scene.fog) {
            (scene.fog as THREE.Fog).color.set(config.fogColor);
        }
    }, [config.fogColor, scene]);

    // OPTIMIZATION: Shadows Removed completely
    return (
        <group>
            <directionalLight 
                position={config.position} 
                intensity={config.intensity} 
                color={config.color} 
                // castShadow={false} <-- Defaults to false
            />
            <ambientLight intensity={config.ambientIntensity} color={config.ambientColor} />
            
            {!config.isNight && (
                 <directionalLight position={[-config.position[0], 20, -config.position[2]]} intensity={0.3} color="#bfdbfe" />
            )}
            
            <fog attach="fog" args={[config.fogColor, 300, 1500]} />
        </group>
    );
};

// --- GPU SNOW SYSTEM (Optimized) ---

const SnowShader = {
    vertexShader: `
      uniform float uTime;
      uniform float uHeight;
      attribute float aSpeed;
      attribute float aScale;
      attribute vec3 aRandom;
      
      void main() {
        vec3 pos = position;
        
        // Fall down logic: InitialY - (speed * time) % height
        float fall = aSpeed * uTime;
        pos.y = mod(position.y - fall, uHeight);
        
        // Wrap around correction to keep them in [0, uHeight] range relative to camera/center
        // Actually mod does this, but we center it around 0
        if(pos.y < 0.0) pos.y += uHeight;
        pos.y -= uHeight * 0.5; // Center vertically
        
        // X/Z Drift
        pos.x += sin(uTime * 0.5 + aRandom.x) * 3.0;
        pos.z += cos(uTime * 0.3 + aRandom.z) * 3.0;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Size attenuation
        gl_PointSize = (300.0 / -mvPosition.z) * aScale;
      }
    `,
    fragmentShader: `
      void main() {
        // Simple circular soft particle
        vec2 xy = gl_PointCoord.xy - vec2(0.5);
        float ll = length(xy);
        if(ll > 0.5) discard;
        
        float alpha = (0.5 - ll) * 2.0;
        gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.8);
      }
    `
};

const GPUSnowSystem = ({ count = 5000 }: { count?: number }) => {
    const points = useRef<THREE.Points>(null);
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const speeds = new Float32Array(count);
        const scales = new Float32Array(count);
        const randoms = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 600; // X
            positions[i * 3 + 1] = Math.random() * 400;     // Y (initial)
            positions[i * 3 + 2] = (Math.random() - 0.5) * 600; // Z

            speeds[i] = 10 + Math.random() * 20; // Falling speed
            scales[i] = 0.5 + Math.random() * 0.5;
            
            randoms[i * 3] = Math.random() * 10;
            randoms[i * 3 + 1] = Math.random() * 10;
            randoms[i * 3 + 2] = Math.random() * 10;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
        geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
        geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));
        return geo;
    }, [count]);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uHeight: { value: 500.0 }
    }), []);

    useFrame((state) => {
        if (points.current && points.current.material) {
            (points.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    return (
        <points ref={points} geometry={geometry}>
            <shaderMaterial 
                vertexShader={SnowShader.vertexShader}
                fragmentShader={SnowShader.fragmentShader}
                uniforms={uniforms}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

// --- PLAYER INTERACTION & TOOLTIP ---

const PlayerTooltip = ({ player, rank, onClose }: { player: Player, rank: number, onClose: () => void }) => {
    return (
        <Html position={[0, 9, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[200, 0]}>
             <div 
                className="relative pointer-events-auto transform -translate-x-1/2 -translate-y-[100%] pb-6 transition-all duration-200"
                onClick={(e) => e.stopPropagation()} 
             >
                <div className="w-64 bg-midnight-950/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 relative">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="absolute top-2 right-2 p-1 text-white/30 hover:text-white transition-colors z-50 rounded-full hover:bg-white/10"
                    >
                        <X size={16} />
                    </button>
                    <div className="px-4 py-3 bg-white/5 border-b border-white/10">
                        {player.twitchUsername ? (
                            <a 
                                href={player.twitchUsername}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-lg text-white mb-1 truncate hover:text-ice-400 transition-colors flex items-center gap-2 group/link"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {player.name}
                                <ExternalLink size={14} className="opacity-50 group-hover/link:opacity-100 transition-opacity" />
                            </a>
                        ) : (
                            <div className="font-bold text-lg text-white mb-1 truncate">{player.name}</div>
                        )}
                        
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            <span className="bg-ice-500/10 px-1.5 py-0.5 rounded border border-ice-500/20 text-ice-300">#{rank} Место</span>
                            <span className="text-slate-600">|</span>
                            <span>Клетка {player.position}</span>
                        </div>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                                    <Heart size={12} className="fill-rose-500/20" /> Здоровье
                                </div>
                                <div className="font-mono text-slate-500">
                                    <span className="text-rose-500 font-bold">{player.hp}</span> / {player.maxHp}
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                                <div 
                                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                                    style={{ width: `${Math.min(100, (player.hp / player.maxHp) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        {player.effects && player.effects.length > 0 && (
                             <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                    <SparklesIcon size={10} className="text-ice-400" /> Эффекты
                                </div>
                                <div className="space-y-1">
                                    {player.effects.map(eff => (
                                        <div key={eff.id} className={`flex justify-between items-center text-xs px-2 py-1 rounded border ${
                                            eff.isPositive 
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' 
                                            : 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                                        }`}>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-4 h-4 flex-shrink-0">
                                                    <GameIcon 
                                                        glossaryId={eff.glossaryId}
                                                        alt={eff.name}
                                                        fallback={<SparklesIcon size={12} />}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <span className="truncate max-w-[90px]">{eff.name}</span>
                                            </div>
                                            <span className="flex items-center gap-1 opacity-70 font-mono text-[10px] ml-2 flex-shrink-0">
                                                <Clock size={8} /> {eff.duration}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        )}
                        <div className="space-y-2">
                             <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                <Package size={10} className="text-amber-400" /> Инвентарь
                             </div>
                             {player.inventory && player.inventory.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {player.inventory.map(item => (
                                        <div 
                                            key={item.id} 
                                            className="w-8 h-8 flex items-center justify-center bg-midnight-800 rounded border border-white/10 hover:border-ice-400 cursor-help relative group p-1"
                                            title={item.name}
                                        >
                                            <GameIcon 
                                                glossaryId={item.glossaryId}
                                                alt={item.name}
                                                fallback={<span className="text-sm">{item.icon}</span>}
                                                className="w-full h-full object-contain"
                                            />
                                            {item.count > 1 && (
                                                <div className="absolute -top-1.5 -right-1.5 bg-ice-600 text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full text-white font-bold border border-midnight-900 z-10">
                                                    {item.count}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                             ) : (
                                <div className="text-[10px] italic text-slate-600">Пусто...</div>
                             )}
                        </div>
                    </div>
                    <div className="h-1 w-full bg-gradient-to-r from-ice-500 via-ice-300 to-ice-500 opacity-20"></div>
                </div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 translate-y-[50%] w-3 h-3 bg-midnight-950 border-r border-b border-white/20 rotate-45"></div>
             </div>
        </Html>
    );
};

interface Player3DProps {
    player: Player;
    nodes: any;
    stackIndex: number;
    stackSize: number;
    isSelected: boolean;
    onSelect: (id: string | null) => void;
    rank: number;
    key?: any;
}

const Player3D = ({ player, nodes, stackIndex, stackSize, isSelected, onSelect, rank }: Player3DProps) => {
    const meshRef = useRef<THREE.Mesh>(null);

    const targetPos = useMemo(() => {
        const basePos = getPlayerPosition3D(nodes, player.position);
        if (stackSize > 1) {
            const radius = 2.0; 
            const angle = (stackIndex / stackSize) * Math.PI * 2;
            basePos.x += Math.cos(angle) * radius;
            basePos.z += Math.sin(angle) * radius;
        }
        return basePos;
    }, [player.position, nodes, stackIndex, stackSize]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 1.5; 
        }
    });

    return (
        <group position={targetPos}>
            <Float speed={3} rotationIntensity={0} floatIntensity={1} floatingRange={[1, 3]}>
                <mesh 
                    ref={meshRef} 
                    position={[0, 4, 0]} 
                    scale={[1.5, 3.0, 1.5]}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(isSelected ? null : player.id);
                    }}
                    onPointerEnter={() => document.body.style.cursor = 'pointer'}
                    onPointerLeave={() => document.body.style.cursor = 'default'}
                >
                    <octahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial 
                        color={player.color} 
                        emissive={player.color}
                        emissiveIntensity={isSelected ? 6.0 : 4.0} 
                        toneMapped={false} 
                        roughness={0.1}
                        metalness={0.9}
                        envMapIntensity={2.0} 
                        side={THREE.DoubleSide}
                    />
                </mesh>
                <pointLight position={[0, 4, 0]} distance={10} intensity={3} color={player.color} />
                
                {!isSelected && (
                    <Billboard position={[0, 9, 0]}>
                        <Text
                            fontSize={2.5}
                            color="white"
                            anchorX="center"
                            anchorY="middle"
                            outlineWidth={0.1}
                            outlineColor="black"
                            fontWeight="bold"
                        >
                            {player.name}
                        </Text>
                    </Billboard>
                )}

                <mesh position={[0, 2, 0]} rotation={[0, 0, 0]}>
                    <cylinderGeometry args={[0.1, 1.5, 4, 8, 1, true]} />
                    <meshBasicMaterial 
                        color={player.color} 
                        opacity={0.1} 
                        transparent 
                        side={THREE.DoubleSide} 
                        depthWrite={false} 
                        blending={THREE.AdditiveBlending} 
                    />
                </mesh>

                {isSelected && (
                    <>
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
                             <ringGeometry args={[2, 2.3, 32]} />
                             <meshBasicMaterial color="white" toneMapped={false} />
                        </mesh>
                        <PlayerTooltip player={player} rank={rank} onClose={() => onSelect(null)} />
                    </>
                )}
            </Float>
        </group>
    );
};

// --- OPTIMIZED INTERACTIVE TILES (INSTANCING) ---

const TileTooltip = ({ id, onClose }: { id: number, onClose: () => void }) => {
    const info = getSectorInfo(id);
    // Find Position 3D to attach HTML. We use a simpler method since we don't have direct access to the node here easily.
    // Instead, we just float it above the "active" selection.
    
    return (
        <Html position={[0, 1.5, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[100, 0]}>
             <div 
                className="relative pointer-events-auto transform -translate-x-1/2 -translate-y-[100%] pb-4 transition-all duration-200"
                onClick={(e) => e.stopPropagation()} 
             >
                <div 
                    className="w-56 bg-midnight-950/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 relative"
                    style={{ boxShadow: `0 0 30px ${info.color}40` }}
                >
                    <button 
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="absolute top-2 right-2 p-1 text-white/30 hover:text-white transition-colors z-50 rounded-full hover:bg-white/10"
                    >
                        <X size={16} />
                    </button>
                    <div className="px-4 py-2 flex justify-between items-center bg-white/5 border-b border-white/10">
                        <span className="font-mono text-xl font-black text-white" style={{ textShadow: `0 0 10px ${info.color}` }}>
                            {id}
                        </span>
                    </div>
                    <div className="p-4 space-y-2">
                         <div className="text-sm font-medium text-ice-100 leading-snug">
                             {info.text}
                         </div>
                    </div>
                    <div className="h-1 w-full" style={{ backgroundColor: info.color }}></div>
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-[50%] w-4 h-4 bg-midnight-950 border-r border-b border-white/20 rotate-45"></div>
             </div>
        </Html>
    );
};

const InstancedInteractiveTiles = ({ nodes }: { nodes: any }) => {
    const [activeTile, setActiveTile] = useState<number | null>(null);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    
    // Calculate matrices once
    const tileData = useMemo(() => {
        const positions = [];
        const ids = [];
        const dummy = new THREE.Object3D();
        
        for (let i = 1; i <= 100; i++) {
            const pos = getPlayerPosition3D(nodes, i);
            if(pos) {
                dummy.position.copy(pos);
                dummy.position.y += 0.5; // Slightly up
                dummy.updateMatrix();
                positions.push(dummy.matrix.clone());
                ids.push(i);
            }
        }
        return { positions, ids };
    }, [nodes]);

    useLayoutEffect(() => {
        if (meshRef.current) {
            tileData.positions.forEach((matrix, i) => {
                meshRef.current!.setMatrixAt(i, matrix);
            });
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [tileData]);

    const activeTilePos = useMemo(() => {
        if (!activeTile) return null;
        return getPlayerPosition3D(nodes, activeTile);
    }, [activeTile, nodes]);

    return (
        <group>
            {/* The Clickable Hitboxes (Invisible but raycastable) */}
            <instancedMesh 
                ref={meshRef} 
                args={[undefined, undefined, tileData.positions.length]}
                onClick={(e) => {
                    e.stopPropagation();
                    // Map instanceId to Tile ID
                    // Note: Three.js might sort instances? Usually instanceId matches index set in setMatrixAt.
                    const tileId = tileData.ids[e.instanceId!];
                    setActiveTile(prev => prev === tileId ? null : tileId);
                }}
                onPointerOver={() => document.body.style.cursor = 'help'}
                onPointerOut={() => document.body.style.cursor = 'default'}
            >
                <boxGeometry args={[4, 1, 4]} />
                <meshBasicMaterial visible={false} />
            </instancedMesh>

            {/* The Active Highlight Cursor (Only renders when something is selected) */}
            {activeTile && activeTilePos && (
                <group position={activeTilePos}>
                     <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.7, 0]}>
                        <ringGeometry args={[2.5, 2.8, 32]} />
                        <meshBasicMaterial color="#38bdf8" />
                    </mesh>
                    <TileTooltip id={activeTile} onClose={() => setActiveTile(null)} />
                </group>
            )}
        </group>
    );
};

// --- CAMERA CONTROLLER ---
const CameraController = ({ 
    focusedPlayerId, 
    players, 
    nodes 
}: { 
    focusedPlayerId: string | null, 
    players: Player[], 
    nodes: any 
}) => {
    const { camera } = useThree();
    const controlsRef = useRef<any>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const lastFocusedIdRef = useRef<string | null>(null);

    const animRef = useRef({
        active: false,
        startTime: 0,
        duration: 1500,
        startPos: new THREE.Vector3(),
        startTarget: new THREE.Vector3(),
        endPos: new THREE.Vector3(),
        endTarget: new THREE.Vector3()
    });

    useEffect(() => {
        if (focusedPlayerId === null) {
            lastFocusedIdRef.current = null;
        }
    }, [focusedPlayerId]);

    useEffect(() => {
        if (!focusedPlayerId || !nodes || players.length === 0 || !controlsRef.current) return;
        if (focusedPlayerId === lastFocusedIdRef.current) return;

        const player = players.find(p => p.id === focusedPlayerId);
        if (player) {
            lastFocusedIdRef.current = focusedPlayerId;

            const targetPos = getPlayerPosition3D(nodes, player.position);
            const offset = new THREE.Vector3(20, 40, 40);
            const finalCamPos = targetPos.clone().add(offset);
            
            animRef.current.active = true;
            animRef.current.startTime = performance.now();
            animRef.current.startPos.copy(camera.position);
            animRef.current.startTarget.copy(controlsRef.current.target);
            animRef.current.endPos.copy(finalCamPos);
            animRef.current.endTarget.copy(targetPos);
            
            setIsAnimating(true);
        }
    }, [focusedPlayerId, players, nodes, camera]);

    useEffect(() => {
        if (controlsRef.current) {
            const controls = controlsRef.current;
            controls.enabled = !isAnimating;
            controls.minDistance = 40; 
            controls.maxDistance = 300;
            controls.maxPolarAngle = Math.PI / 2.05; 
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
        }
    }, [isAnimating]);

    useFrame(() => {
        if (controlsRef.current) {
            const t = controlsRef.current.target;
            t.x = THREE.MathUtils.clamp(t.x, -250, 150);
            t.z = THREE.MathUtils.clamp(t.z, -250, 150);
            t.y = THREE.MathUtils.clamp(t.y, 0, 150);
        }

        if (animRef.current.active && controlsRef.current) {
            const now = performance.now();
            const elapsed = now - animRef.current.startTime;
            const progress = Math.min(elapsed / animRef.current.duration, 1);
            
            const ease = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            camera.position.lerpVectors(animRef.current.startPos, animRef.current.endPos, ease);
            controlsRef.current.target.lerpVectors(animRef.current.startTarget, animRef.current.endTarget, ease);
            
            controlsRef.current.update();

            if (progress >= 1) {
                animRef.current.active = false;
                setIsAnimating(false);
            }
        }
    });

    return (
        <OrbitControls ref={controlsRef} />
    );
};

// --- MAIN SCENE ---

interface GameBoardProps {
  players: Player[];
  focusedPlayerId?: string | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({ players, focusedPlayerId = null }) => {
  // Model loading now handled entirely by TerrainModel with KTX2 support
  // We pass nodes down, but we load them in TerrainModel mostly. 
  // To avoid double loading, let's keep the hook in one place or use useGLTF.preload.
  // Actually, nodes are needed for Tiles and Camera.
  // Let's rely on TerrainModel's preloading or standard caching.
  const { nodes } = useGLTF('./assets/map_done2.glb') as any;
  
  const snowTexture = useSnowTexture();
  const [sunConfig, setSunConfig] = useState<SunConfig>(getMoscowSunConfig());
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
        const mobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (focusedPlayerId) {
        setSelectedPlayerId(focusedPlayerId);
    }
  }, [focusedPlayerId]);

  useEffect(() => {
    const interval = setInterval(() => {
        setSunConfig(getMoscowSunConfig());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const playersByTile = useMemo(() => {
      const map: Record<number, Player[]> = {};
      players.forEach(p => {
          if (!map[p.position]) map[p.position] = [];
          map[p.position].push(p);
      });
      return map;
  }, [players]);

  const playerRanks = useMemo(() => {
      const sorted = [...players].sort((a, b) => b.position - a.position);
      const ranks: Record<string, number> = {};
      sorted.forEach((p, i) => ranks[p.id] = i + 1);
      return ranks;
  }, [players]);

  return (
    <div className="flex-1 h-full w-full relative bg-midnight-950 overflow-hidden">
        <Canvas 
            camera={{ position: [-50, 150, 150], fov: 45 }} 
            dpr={isMobile ? 1 : [1, 1.5]}
            gl={{ 
                toneMapping: THREE.ReinhardToneMapping, 
                toneMappingExposure: 1.2,
                powerPreference: "high-performance",
                preserveDrawingBuffer: false,
            }} 
            onPointerMissed={() => setSelectedPlayerId(null)}
        >
            <DynamicLighting config={sunConfig} isMobile={isMobile} />

            <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            
            {/* GPU SNOW SYSTEM */}
            <GPUSnowSystem count={isMobile ? 3000 : 8000} />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
                <planeGeometry args={[5000, 5000]} />
                <meshStandardMaterial 
                    color="#f0f9ff" 
                    roughness={0.8} 
                    metalness={0.1}
                    bumpMap={snowTexture}
                    bumpScale={1.5}
                />
            </mesh>
            
            <CameraController focusedPlayerId={focusedPlayerId} players={players} nodes={nodes} />

            <TerrainModel isMobile={isMobile} />
            
            {/* INSTANCED INTERACTIVE TILES */}
            {nodes && <InstancedInteractiveTiles nodes={nodes} />}

            <group>
                {players.map(player => {
                    const stack = playersByTile[player.position] || [];
                    const index = stack.findIndex(p => p.id === player.id);
                    return (
                        <Player3D 
                            key={player.id} 
                            player={player} 
                            nodes={nodes} 
                            stackIndex={index !== -1 ? index : 0}
                            stackSize={stack.length}
                            isSelected={selectedPlayerId === player.id}
                            onSelect={setSelectedPlayerId}
                            rank={playerRanks[player.id] || 0}
                        />
                    );
                })}
            </group>

            {!isMobile && (
                <EffectComposer enableNormalPass={false}>
                    <Bloom luminanceThreshold={1.5} mipmapBlur intensity={0.05} radius={0.4} />
                    <Vignette eskil={false} offset={0.1} darkness={0.8} />
                </EffectComposer>
            )}

        </Canvas>
      
      {/* UI Overlay */}
      <div className="absolute top-4 right-4 md:top-auto md:bottom-6 md:right-6 pointer-events-none select-none flex flex-col gap-3 items-end z-30">
          <div className="bg-black/60 backdrop-blur-xl text-white px-3 py-2 md:px-5 md:py-4 rounded-xl md:rounded-2xl border border-white/10 flex items-center gap-3 md:gap-4 w-fit animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl pointer-events-auto">
              <div className="w-10 h-10 md:w-14 md:h-14 flex-shrink-0 flex items-center justify-center bg-white/5 rounded-full border border-white/10 shadow-inner">
                 {sunConfig.isNight ? (
                    <Moon className="w-6 h-6 md:w-8 md:h-8 text-ice-300 drop-shadow-[0_0_10px_rgba(147,197,253,0.5)]" />
                 ) : (
                    <Sun className="w-6 h-6 md:w-8 md:h-8 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse-slow" />
                 )}
              </div>
              <div className="flex flex-col items-end">
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden md:block">Время (МСК)</span>
                  <div className="flex items-baseline gap-2 md:gap-3">
                      <span className="text-lg md:text-2xl font-mono font-bold leading-none text-white">{sunConfig.displayTime}</span>
                      <span className="text-slate-600 font-light text-sm md:text-base">|</span>
                      <span className="text-sm md:text-lg font-bold text-ice-300 drop-shadow-sm">{sunConfig.eventStatus}</span>
                  </div>
              </div>
          </div>

          <div className="hidden md:flex bg-black/50 backdrop-blur-md text-white/50 text-xs px-3 py-2 rounded-lg border border-white/5 items-center gap-3">
                <span className="flex items-center gap-1"><MousePointer2 className="w-3 h-3" /> ЛКМ - Вращение</span>
                <span className="w-px h-3 bg-white/10"></span>
                <span>ПКМ - Панорама</span>
                <span className="w-px h-3 bg-white/10"></span>
                <span>Колесо - Зум</span>
                <span className="w-px h-3 bg-white/10"></span>
                <span>Клик по клетке - Инфо</span>
          </div>
      </div>
    </div>
  );
};