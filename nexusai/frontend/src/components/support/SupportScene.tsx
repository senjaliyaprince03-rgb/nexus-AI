"use client"

import { useMemo, useRef } from "react"
import { Float, Line, PerspectiveCamera } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { Wrench } from "lucide-react"
import { useReducedMotion } from "framer-motion"
import type { Group, Mesh } from "three"
import { AdditiveBlending } from "three"

const CARD_LINKS = [
  [[-0.9, 0.48, 0.12], [-0.12, 0.34, 0.2], [0.82, 0.24, 0.16], [1.68, 0.44, 0.08]],
  [[-0.56, -0.08, 0.08], [0.18, -0.02, 0.18], [1.08, 0.02, 0.16], [1.88, -0.1, 0.06]],
] as const

export function SupportScene({ compact = false }: { compact?: boolean }) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <SupportSceneFallback compact={compact} />
  }

  return (
    <div className="relative h-full min-h-[360px] w-full overflow-hidden rounded-[32px] bg-transparent">
      <Canvas
        shadows
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        className="absolute inset-0"
      >
        <PerspectiveCamera makeDefault position={[0.3, 0.1, compact ? 7.5 : 6.6]} fov={compact ? 38 : 40} />
        <ambientLight intensity={1.18} />
        <directionalLight position={[-3.8, 4.2, 5.8]} intensity={1.55} castShadow />
        <pointLight position={[2.8, -0.6, 3.2]} intensity={0.58} color="#ffffff" />
        <pointLight position={[0.9, 0.9, 2.8]} intensity={0.72} color="#B8944E" />
        <HeroRig compact={compact} />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(244,241,236,0),rgba(244,241,236,0.95))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0),rgba(9,14,24,0.95))]" />
    </div>
  )
}

function HeroRig({ compact }: { compact: boolean }) {
  const group = useRef<Group>(null)

  useFrame(({ clock, pointer }) => {
    if (!group.current) return
    const t = clock.getElapsedTime()
    group.current.rotation.y = Math.sin(t * 0.16) * 0.05 + pointer.x * 0.04
    group.current.rotation.x = Math.cos(t * 0.1) * 0.012 - pointer.y * 0.02
  })

  return (
    <group ref={group} position={[0.95, 0.02, 0]}>
      <GlassDocumentStack compact={compact} />
      <DarkDashboardPanel compact={compact} />
      <HighlightModule compact={compact} />
      <CascadingListCards compact={compact} />
      <ForegroundStrips />
      <ConnectorLines />
      <FloorShadow />
    </group>
  )
}

function GlassDocumentStack({ compact }: { compact: boolean }) {
  const sheets = useMemo(
    () => [
      { x: -1.42, y: 0.72, z: -0.22, rotY: -0.16, rotZ: -0.06, scale: 1.08, blur: 0.52 },
      { x: -1.25, y: 0.64, z: -0.08, rotY: -0.08, rotZ: 0.04, scale: 1, blur: 0.74 },
      { x: -1.08, y: 0.57, z: 0.06, rotY: 0.06, rotZ: 0.1, scale: 0.94, blur: 0.92 },
    ],
    [],
  )

  return (
    <group scale={compact ? 0.9 : 1}>
      {sheets.map((sheet, index) => (
        <Float key={index} speed={0.72 + index * 0.08} rotationIntensity={0.05} floatIntensity={0.08}>
          <group position={[sheet.x, sheet.y, sheet.z]} rotation={[0.04, sheet.rotY, sheet.rotZ]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.82 * sheet.scale, 1.18 * sheet.scale, 0.03]} />
              <meshPhysicalMaterial
                color="#ffffff"
                roughness={0.12}
                metalness={0.02}
                transmission={0.52}
                transparent
                opacity={sheet.blur}
                clearcoat={1}
              />
            </mesh>
            <mesh position={[0.21 * sheet.scale, 0, 0.018]}>
              <boxGeometry args={[0.014, 1.04 * sheet.scale, 0.008]} />
              <meshStandardMaterial color="#B8944E" emissive="#B8944E" emissiveIntensity={0.15} />
            </mesh>
            <mesh position={[0, 0.24 * sheet.scale, 0.017]}>
              <boxGeometry args={[0.42 * sheet.scale, 0.032, 0.008]} />
              <meshStandardMaterial color="#ece7e2" />
            </mesh>
            <mesh position={[-0.03 * sheet.scale, 0.02 * sheet.scale, 0.017]}>
              <boxGeometry args={[0.52 * sheet.scale, 0.026, 0.008]} />
              <meshStandardMaterial color="#ebe5de" />
            </mesh>
            <mesh position={[0.04 * sheet.scale, -0.2 * sheet.scale, 0.017]}>
              <boxGeometry args={[0.46 * sheet.scale, 0.026, 0.008]} />
              <meshStandardMaterial color="#eee8e1" />
            </mesh>
          </group>
        </Float>
      ))}
    </group>
  )
}

function DarkDashboardPanel({ compact }: { compact: boolean }) {
  const panelRef = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    if (!panelRef.current) return
    panelRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.42) * 0.015
  })

  return (
    <Float speed={0.95} rotationIntensity={0.06} floatIntensity={0.1}>
      <group position={[0.38, 0.32, 0.26]} rotation={[0.02, -0.24, -0.03]} scale={compact ? 0.92 : 1}>
        <mesh position={[0.03, -0.03, -0.05]} rotation={[0.18, 0, 0]} receiveShadow>
          <cylinderGeometry args={[0.52, 0.64, 0.1, 30]} />
          <meshStandardMaterial color="#d8d0c8" roughness={0.92} opacity={0.4} transparent />
        </mesh>
        <mesh ref={panelRef} castShadow receiveShadow>
          <boxGeometry args={[1.04, 0.74, 0.075]} />
          <meshStandardMaterial color="#1C1C1E" roughness={0.26} metalness={0.18} />
        </mesh>
        <mesh position={[-0.23, 0.16, 0.041]}>
          <boxGeometry args={[0.44, 0.028, 0.01]} />
          <meshStandardMaterial color="#f4f4f4" emissive="#ffffff" emissiveIntensity={0.12} />
        </mesh>
        <mesh position={[0.05, 0.02, 0.041]}>
          <boxGeometry args={[0.56, 0.026, 0.01]} />
          <meshStandardMaterial color="#efefef" emissive="#ffffff" emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0.12, -0.12, 0.041]}>
          <boxGeometry args={[0.48, 0.024, 0.01]} />
          <meshStandardMaterial color="#cfcfcf" emissive="#ffffff" emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0.39, -0.19, 0.041]}>
          <boxGeometry args={[0.16, 0.018, 0.01]} />
          <meshStandardMaterial color="#B8944E" emissive="#B8944E" emissiveIntensity={0.16} />
        </mesh>
      </group>
    </Float>
  )
}

function HighlightModule({ compact }: { compact: boolean }) {
  const glow = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    if (!glow.current) return
    glow.current.rotation.y = clock.getElapsedTime() * 0.4
  })

  return (
    <Float speed={1.12} rotationIntensity={0.05} floatIntensity={0.12}>
      <group position={[0.1, 0.56, 0.54]} rotation={[0.08, -0.28, 0.02]} scale={compact ? 0.88 : 1}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.54, 0.54, 0.42]} />
          <meshPhysicalMaterial
            color="#f4d3bf"
            roughness={0.16}
            metalness={0.08}
            transmission={0.18}
            transparent
            opacity={0.72}
            clearcoat={1}
          />
        </mesh>
        <mesh ref={glow} position={[0.04, 0.02, 0.08]} castShadow>
          <boxGeometry args={[0.24, 0.24, 0.24]} />
          <meshStandardMaterial color="#B8944E" emissive="#B8944E" emissiveIntensity={0.72} roughness={0.18} metalness={0.14} />
        </mesh>
      </group>
    </Float>
  )
}

function CascadingListCards({ compact }: { compact: boolean }) {
  return (
    <group position={[1.82, 0.58, -0.02]} scale={compact ? 0.92 : 1}>
      {[0, 1, 2, 3].map((index) => (
        <Float key={index} speed={0.78 + index * 0.06} rotationIntensity={0.03} floatIntensity={0.06}>
          <group position={[index * 0.05, 0.62 - index * 0.46, -index * 0.08]} rotation={[0.02, -0.18, 0.01]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.02, 0.28, 0.045]} />
              <meshPhysicalMaterial
                color={index === 1 ? "#1C1C1E" : "#ffffff"}
                roughness={index === 1 ? 0.26 : 0.14}
                metalness={index === 1 ? 0.16 : 0.02}
                transmission={index === 1 ? 0 : 0.28}
                transparent
                opacity={index === 1 ? 1 : 0.88}
                clearcoat={0.9}
              />
            </mesh>
            <mesh position={[-0.33, 0.06, 0.026]}>
              <boxGeometry args={[0.1, 0.026, 0.008]} />
              <meshStandardMaterial color="#B8944E" emissive="#B8944E" emissiveIntensity={0.1} />
            </mesh>
            <mesh position={[0.06, 0.06, 0.026]}>
              <boxGeometry args={[0.44, 0.022, 0.008]} />
              <meshStandardMaterial color={index === 1 ? "#ffffff" : "#dfdbd5"} emissive={index === 1 ? "#ffffff" : "#000000"} emissiveIntensity={index === 1 ? 0.08 : 0} />
            </mesh>
            <mesh position={[0.02, -0.04, 0.026]}>
              <boxGeometry args={[0.56, 0.02, 0.008]} />
              <meshStandardMaterial color={index === 1 ? "#d0d0d0" : "#ece7e0"} />
            </mesh>
          </group>
        </Float>
      ))}
    </group>
  )
}

function ForegroundStrips() {
  return (
    <group position={[0.72, -0.82, 0.12]} rotation={[-0.05, -0.18, -0.02]}>
      {[0, 1, 2].map((index) => (
        <mesh key={index} position={[index * 0.46, index * 0.03, index * 0.02]} castShadow receiveShadow>
          <boxGeometry args={[0.54, 0.12, 0.022]} />
          <meshPhysicalMaterial
            color={index === 0 ? "#d9d3cd" : "#ffffff"}
            roughness={0.2}
            metalness={0.04}
            transmission={index === 0 ? 0 : 0.22}
            transparent
            opacity={0.86}
          />
        </mesh>
      ))}
    </group>
  )
}

function ConnectorLines() {
  return (
    <group>
      {CARD_LINKS.map((points, index) => (
        <Line
          key={index}
          points={points}
          color={index === 0 ? "#B8944E" : "#ede7df"}
          lineWidth={index === 0 ? 1.6 : 1}
          transparent
          opacity={index === 0 ? 0.68 : 0.48}
          blending={AdditiveBlending}
        />
      ))}
    </group>
  )
}

function FloorShadow() {
  const lines = useMemo(() => Array.from({ length: 5 }, (_, index) => -0.9 + index * 0.45), [])

  return (
    <group position={[0.76, -1.26, -0.84]} rotation={[-0.62, 0, 0]}>
      <mesh receiveShadow>
        <planeGeometry args={[5.4, 2]} />
        <shadowMaterial transparent opacity={0.08} />
      </mesh>
      {lines.map((offset) => (
        <Line key={`h-${offset}`} points={[[-2.2, offset, 0], [2.2, offset, 0]]} color="#e4ddd5" lineWidth={0.45} transparent opacity={0.18} />
      ))}
      {lines.map((offset) => (
        <Line key={`v-${offset}`} points={[[offset * 1.6, -1.2, 0], [offset * 1.6, 1.2, 0]]} color="#e4ddd5" lineWidth={0.45} transparent opacity={0.14} />
      ))}
    </group>
  )
}

export function SupportSceneFallback({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative h-full min-h-[360px] overflow-hidden rounded-[32px] bg-transparent">
      <div className="absolute left-[34%] top-[26%] h-[142px] w-[108px] rotate-[-7deg] rounded-[26px] border border-[#F8F9FA]/70 bg-white/62 shadow-[0_24px_54px_rgba(10,10,10,0.08)] backdrop-blur-xl dark:border-[#F8F9FA]/10 dark:bg-white/8 dark:shadow-[0_24px_54px_rgba(0,0,0,0.25)]" />
      <div className="absolute left-[36%] top-[23%] h-[142px] w-[108px] rotate-[5deg] rounded-[26px] border border-[#F8F9FA]/60 bg-white/48 shadow-[0_24px_54px_rgba(10,10,10,0.05)] backdrop-blur-xl dark:border-[#F8F9FA]/10 dark:bg-white/6 dark:shadow-[0_24px_54px_rgba(0,0,0,0.22)]" />
      <div className="absolute left-[49%] top-[33%] h-[108px] w-[126px] rotate-[-6deg] rounded-[24px] bg-[#1C1C1E] shadow-[0_24px_58px_rgba(28,28,30,0.18)]" />
      <div className="absolute left-[47%] top-[29%] h-[88px] w-[88px] rotate-[6deg] rounded-[24px] border border-[#efc5af] bg-[#ffffff80] shadow-[0_14px_36px_rgba(224,123,63,0.10)] backdrop-blur-xl dark:border-[#B8944E]/20 dark:bg-white/10" />
      <div className="absolute left-[50%] top-[33%] h-[36px] w-[36px] rounded-[12px] bg-[#B8944E] shadow-[0_0_42px_rgba(224,123,63,0.35)]" />

      <div className="absolute right-[20%] top-[25%] space-y-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={index === 1 ? "h-10 w-40 rounded-[16px] bg-[#1C1C1E] shadow-[0_18px_40px_rgba(28,28,30,0.14)]" : "h-10 w-40 rounded-[16px] border border-[#F8F9FA]/70 bg-white/76 shadow-[0_18px_40px_rgba(10,10,10,0.06)] backdrop-blur-xl dark:border-[#F8F9FA]/10 dark:bg-white/8 dark:shadow-[0_18px_40px_rgba(0,0,0,0.2)]"}
            style={{ transform: `translateX(${index * 6}px)` }}
          />
        ))}
      </div>

      <div className="absolute bottom-[20%] left-[55%] flex gap-3">
        <div className="h-4 w-14 rounded-md bg-[#c9c2bb] dark:bg-white/12" />
        <div className="h-4 w-16 rounded-md bg-white/88 shadow-[0_10px_24px_rgba(10,10,10,0.05)] dark:bg-white/10 dark:shadow-[0_10px_24px_rgba(0,0,0,0.2)]" />
        <div className="h-4 w-18 rounded-md bg-white/80 shadow-[0_10px_24px_rgba(10,10,10,0.05)] dark:bg-white/8 dark:shadow-[0_10px_24px_rgba(0,0,0,0.18)]" />
      </div>

      <div className="absolute bottom-5 right-5 hidden rounded-[24px] border border-[#F8F9FA]/70 bg-[#161513]/94 p-3 text-white shadow-[0_20px_54px_rgba(12,12,12,0.15)] dark:border-[#F8F9FA]/10 dark:bg-[#0B1220]/95 md:block">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[#F8F9FA]/10 bg-[#1C1C1E] text-[#E0D0A0] dark:bg-white/6">
            <Wrench className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Technical</p>
            <p className="text-xs text-white/58">API, indexing, document topics</p>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(244,241,236,0),rgba(244,241,236,0.95))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0),rgba(9,14,24,0.95))]" />
    </div>
  )
}
