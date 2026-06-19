"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Float, Html, Line, PerspectiveCamera, RoundedBox } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { useReducedMotion } from "framer-motion"
import {
  BarChart3,
  BrainCircuit,
  BookOpen,
  Bot,
  Boxes,
  Database,
  FileStack,
  Layers,
  Network,
  type LucideIcon,
} from "lucide-react"
import type { Group, Mesh } from "three"

type TopologySystem = {
  id: string
  name: string
  health: string
  capability_count: number
}

type SystemTopologySceneProps = {
  systems: TopologySystem[]
}

const PROJECT_ICONS: Record<string, LucideIcon> = {
  "personal-nexusai-core": Database,
  "multi-agent-hub": BrainCircuit,
  "nexus-agents": BookOpen,
  "svenhven-nexus-ai": BarChart3,
  "nexus-gcp": Bot,
  "primisai-nexus": Layers,
}

export function SystemTopologyScene({ systems }: SystemTopologySceneProps) {
  const reduceMotion = useReducedMotion()
  const [canUseWebGL, setCanUseWebGL] = useState(false)

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas")
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
      setCanUseWebGL(Boolean(gl))
    } catch {
      setCanUseWebGL(false)
    }
  }, [])

  if (reduceMotion || !canUseWebGL) {
    return <TopologyFallback systems={systems} />
  }

  return (
    <div className="dashboard-hero relative min-h-[420px] overflow-hidden dark:!bg-transparent dark:!border-transparent dark:!shadow-none">
      <Canvas
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: process.env.NODE_ENV !== "production",
          powerPreference: "high-performance",
        }}
        className="absolute inset-0"
      >
        <PerspectiveCamera makeDefault position={[0, 0.4, 9.4]} fov={34} />
        <ambientLight intensity={1.3} />
        <directionalLight position={[4, 5, 6]} intensity={1.45} />
        <directionalLight position={[-4, 2, 4]} intensity={0.45} color="#C5A059" />
        <pointLight position={[0, 0, 4]} intensity={0.9} color="#FF8C35" />
        <pointLight position={[0, -2.5, 3]} intensity={0.55} color="#7CB69E" />
        <TopologyRig systems={systems.slice(0, 6)} />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.96))] dark:hidden" />
      <div className="dashboard-mini-card absolute left-5 top-5 px-4 py-3 backdrop-blur-xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9CA3AF]">System topology</p>
        <p className="mt-1 text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">{systems.length} systems mapped</p>
      </div>
    </div>
  )
}

function TopologyRig({ systems }: { systems: TopologySystem[] }) {
  const group = useRef<Group>(null)
  const nodes = useMemo(() => buildNodes(systems), [systems])

  useFrame(({ clock, pointer }) => {
    if (!group.current) return
    const t = clock.getElapsedTime()
    group.current.rotation.y = Math.sin(t * 0.16) * 0.14 + pointer.x * 0.06
    group.current.rotation.x = Math.sin(t * 0.12) * 0.04 - pointer.y * 0.035
  })

  return (
    <group ref={group} position={[0, 0.2, 0]}>
      <FloatingCore />
      <OrbitRings />
        <mesh position={[0, -1.28, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[13, 13]} />
          <meshStandardMaterial color="#f5f6f7" transparent opacity={0.24} />
        </mesh>
      {nodes.map((node, index) => (
        <group key={node.id}>
          <Line
            points={[[0, 0.15, 0.1], [node.x, node.y, node.z]]}
            color={nodeColor(node.health)}
            lineWidth={1.25}
            transparent
            opacity={0.42}
          />
          <SystemNode node={node} index={index} />
        </group>
      ))}
    </group>
  )
}

function FloatingCore() {
  const shellRef = useRef<Mesh>(null)
  const coreRef = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (shellRef.current) {
      shellRef.current.rotation.y = t * 0.18
      shellRef.current.rotation.z = Math.sin(t * 0.5) * 0.07
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = -t * 0.24
      coreRef.current.rotation.x = Math.sin(t * 0.35) * 0.08
    }
  })

  return (
        <Float speed={0.9} rotationIntensity={0.1} floatIntensity={0.22}>
      <group>
        <mesh ref={shellRef} castShadow receiveShadow>
          <sphereGeometry args={[1.02, 48, 48]} />
          <meshPhysicalMaterial
            color="#141414"
            roughness={0.12}
            metalness={0.55}
            clearcoat={0.9}
            clearcoatRoughness={0.1}
            emissive="#18181B"
            emissiveIntensity={0.08}
          />
        </mesh>
        <mesh ref={coreRef} position={[0, 0.02, 0.14]} castShadow receiveShadow>
          <boxGeometry args={[0.64, 0.64, 0.18]} />
          <meshStandardMaterial color="#C5A059" emissive="#FF8C35" emissiveIntensity={0.52} roughness={0.24} metalness={0.12} />
        </mesh>
        <mesh position={[0, 0.02, 0.25]}>
          <sphereGeometry args={[0.24, 28, 28]} />
          <meshStandardMaterial color="#FFF2EB" emissive="#FFF2EB" emissiveIntensity={0.2} roughness={0.2} />
        </mesh>
      </group>
    </Float>
  )
}

function OrbitRings() {
  const rings = [
    { args: [2.25, 0.015, 96, 1] as [number, number, number, number], rotation: [0.22, 0.4, 0.1] as [number, number, number] },
    { args: [2.95, 0.012, 96, 1] as [number, number, number, number], rotation: [-0.2, -0.48, 0.12] as [number, number, number] },
    { args: [3.65, 0.01, 96, 1] as [number, number, number, number], rotation: [0.55, 0.2, -0.15] as [number, number, number] },
  ]

  return (
    <group>
      {rings.map((ring, index) => (
        <mesh key={index} rotation={ring.rotation}>
          <torusGeometry args={ring.args} />
          <meshStandardMaterial
            color={index === 1 ? "#F7D2C1" : "#E5E7EB"}
            transparent
            opacity={0.55}
            roughness={0.55}
            metalness={0.18}
          />
        </mesh>
      ))}
    </group>
  )
}

function SystemNode({ node, index }: { node: TopologySystem & { x: number; y: number; z: number }; index: number }) {
  const Icon = PROJECT_ICONS[node.id] ?? Boxes
  return (
    <Float speed={0.85 + index * 0.06} rotationIntensity={0.12} floatIntensity={0.18}>
      <group position={[node.x, node.y, node.z]} rotation={[0.03, -0.24 + index * 0.04, 0]}>
        <RoundedBox args={[0.98, 0.64, 0.1]} radius={0.08} smoothness={4} castShadow receiveShadow>
          <meshPhysicalMaterial color="#f8f8f7" roughness={0.18} metalness={0.08} clearcoat={0.64} />
        </RoundedBox>
        <RoundedBox position={[-0.31, 0.08, 0.08]} args={[0.2, 0.2, 0.02]} radius={0.04} smoothness={4}>
          <meshStandardMaterial color={nodeColor(node.health)} emissive={nodeColor(node.health)} emissiveIntensity={0.26} />
        </RoundedBox>
        <mesh position={[0.12, -0.1, 0.08]}>
          <boxGeometry args={[0.36 + Math.min(node.capability_count, 8) * 0.02, 0.06, 0.02]} />
          <meshStandardMaterial color="#111714" roughness={0.32} />
        </mesh>
        <Html transform distanceFactor={9.5} center pointerEvents="none" position={[0.02, 0.02, 0.12]}>
          <div className="flex min-w-[7.8rem] items-center gap-2 rounded-[18px] border border-[#F8F9FA]/72 bg-white/92 px-3 py-2 shadow-[0_14px_32px_rgba(15,15,15,0.12)] backdrop-blur-xl">
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#FFF0EB] text-[#C5A059] shadow-sm">
              <Icon className="h-[14px] w-[14px]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold leading-4 text-[#18181B]">{node.name}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#9CA3AF]">{statusLabel(node.health)}</p>
            </div>
          </div>
        </Html>
      </group>
    </Float>
  )
}

function TopologyFallback({ systems }: { systems: TopologySystem[] }) {
  const nodes = useMemo(() => buildNodes(systems), [systems])

  return (
    <div className="dashboard-hero relative min-h-[420px] overflow-hidden p-5 dark:!bg-transparent dark:!border-transparent dark:!shadow-none">
      <div className="absolute inset-x-8 top-24 h-px bg-[linear-gradient(90deg,transparent,rgba(0,0,0,0.08),transparent)] dark:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]" />
      <div className="absolute inset-y-24 left-1/2 w-px -translate-x-1/2 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.08),transparent)] dark:bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.08),transparent)]" />

      <div className="dashboard-mini-card absolute left-5 top-5 px-4 py-3 backdrop-blur-xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9CA3AF]">System topology</p>
        <p className="mt-1 text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">{systems.length} systems mapped</p>
      </div>

      <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[2rem] bg-[#111714] shadow-[0_25px_60px_rgba(17,23,20,0.32)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-[1.15rem] bg-[#C5A059] shadow-[0_0_0_10px_rgba(255,107,53,0.12)]" />
      </div>

      {nodes.map((node) => {
        const Icon = PROJECT_ICONS[node.id] ?? Boxes
        const positions = fallbackPosition(node.index, nodes.length)
        return (
          <div
            key={node.id}
            className="absolute w-[10rem] rounded-[18px] border border-black/5 bg-white/90 px-3 py-3 shadow-[0_12px_30px_rgba(10,10,10,0.08)] backdrop-blur-xl"
            style={{
              left: positions.left,
              top: positions.top,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF0EB] text-[#C5A059] shadow-sm">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-[#18181B]">{node.name}</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#9CA3AF]">{statusLabel(node.health)}</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-[#F1F1F1]">
              <div className="h-1.5 rounded-full bg-[#C5A059]" style={{ width: `${Math.min(100, 28 + node.capability_count * 8)}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function buildNodes(systems: TopologySystem[]) {
  return systems.slice(0, 6).map((system, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(systems.length || 1, 1) - Math.PI / 2
    const radius = 3.05 + (index % 3) * 0.32
    return {
      ...system,
      index,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * 1.72 + (index % 2 === 0 ? 0.16 : -0.12),
      z: index % 2 === 0 ? 0.2 : -0.2,
    }
  })
}

function fallbackPosition(index: number, total: number) {
  const positions = [
    { left: "19%", top: "34%" },
    { left: "79%", top: "34%" },
    { left: "12%", top: "64%" },
    { left: "84%", top: "64%" },
    { left: "50%", top: "20%" },
    { left: "50%", top: "82%" },
  ]
  return positions[index] ?? { left: `${50 + Math.cos((index / Math.max(total, 1)) * Math.PI * 2) * 28}%`, top: `${50 + Math.sin((index / Math.max(total, 1)) * Math.PI * 2) * 22}%` }
}

function nodeColor(health: string): string {
  if (health === "online") return "#7CB69E"
  if (health === "offline") return "#C5A059"
  if (health === "degraded") return "#D4AF37"
  if (health === "framework") return "#7C3AED"
  return "#D4AF37"
}

function statusLabel(status: string) {
  if (status === "online") return "Online"
  if (status === "offline") return "Offline"
  if (status === "degraded") return "Degraded"
  if (status === "framework") return "Framework"
  return "Checking"
}
