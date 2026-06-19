"use client"

import { Float, Line, PerspectiveCamera, Sphere } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { Suspense, useMemo, useRef } from "react"
import type { Group } from "three"
import { AdditiveBlending, Color, Vector3 } from "three"
import { useReducedMotion } from "framer-motion"

type Edge = [number, number]

function buildGraph(nodeCount: number, radius: number) {
  const points: Vector3[] = []

  for (let i = 0; i < nodeCount; i += 1) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / nodeCount)
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5)
    const wobble = 0.22 + ((i % 7) / 7) * 0.12
    const r = radius * wobble
    points.push(
      new Vector3(
        Math.cos(theta) * Math.sin(phi) * r,
        Math.sin(theta) * Math.sin(phi) * r,
        Math.cos(phi) * r,
      ),
    )
  }

  const edges: Edge[] = []
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      if (points[i].distanceTo(points[j]) < radius * 0.18) {
        edges.push([i, j])
      }
    }
  }

  return { points, edges: edges.slice(0, 140) }
}

function NeuralLattice() {
  const groupRef = useRef<Group>(null)
  const reduceMotion = useReducedMotion()
  const { points, edges } = useMemo(() => buildGraph(64, 9.5), [])

  useFrame((state, delta) => {
    if (!groupRef.current || reduceMotion) return
    groupRef.current.rotation.y += delta * 0.12
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.18
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.08
  })

  return (
    <group ref={groupRef}>
      {edges.map(([a, b], index) => (
        <Line
          key={`${a}-${b}-${index}`}
          points={[points[a], points[b]]}
          color={index % 3 === 0 ? "#D4AF37" : "#67e8f9"}
          lineWidth={0.45}
          transparent
          opacity={0.18}
        />
      ))}

      {points.map((point, index) => (
        <Float
          key={index}
          speed={1.2 + (index % 5) * 0.15}
          rotationIntensity={0.4}
          floatIntensity={0.45}
        >
          <mesh position={[point.x, point.y, point.z]}>
            <sphereGeometry args={[index % 9 === 0 ? 0.11 : 0.07, 16, 16]} />
            <meshStandardMaterial
              color={index % 4 === 0 ? new Color("#67e8f9") : new Color("#f8fafc")}
              emissive={index % 4 === 0 ? new Color("#22d3ee") : new Color("#D4AF37")}
              emissiveIntensity={index % 6 === 0 ? 2.1 : 1.35}
              toneMapped={false}
            />
          </mesh>
        </Float>
      ))}

      <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.2}>
        <Sphere args={[1.35, 40, 40]} scale={2.25}>
          <meshStandardMaterial
            color="#8b5cf6"
            emissive="#8b5cf6"
            emissiveIntensity={0.28}
            transparent
            opacity={0.12}
            wireframe
          />
        </Sphere>
      </Float>

      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={new Float32Array(points.flatMap(point => [point.x, point.y, point.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#fde68a"
          size={0.085}
          sizeAttenuation
          transparent
          opacity={0.75}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  )
}

export function HeroScene() {
  if (typeof window === "undefined") return null

  return (
    <Canvas dpr={[1, 1.5]} className="h-full w-full">
      <Suspense fallback={null}>
        <PerspectiveCamera makeDefault position={[0, 0, 11]} fov={38} />
        <ambientLight intensity={0.5} />
        <pointLight position={[8, 4, 10]} color="#D4AF37" intensity={15} distance={18} />
        <pointLight position={[-6, -4, 8]} color="#22d3ee" intensity={8} distance={16} />
        <NeuralLattice />
      </Suspense>
    </Canvas>
  )
}
