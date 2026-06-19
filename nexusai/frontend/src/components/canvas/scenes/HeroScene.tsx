/**
 * HeroScene — Full-viewport 3D scene for the hero section.
 *
 * Renders a rotating particle sphere (neural network aesthetic) and a
 * floating wireframe orb. Camera is driven by scroll progress via lerp:
 * as the user scrolls through the hero section (0–25% of page), the camera
 * slowly pulls back and rotates.
 *
 * Exposes render() via useImperativeHandle for the SceneManager
 * selective rendering system.
 */
"use client"

import { forwardRef, useImperativeHandle, useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

function generateSpherePoints(count: number, radius: number): Float32Array {
  const points = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const u = Math.random()
    const v = Math.random()
    const theta = u * 2.0 * Math.PI
    const phi = Math.acos(2.0 * v - 1.0)
    const r = radius * Math.cbrt(Math.random())
    points[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    points[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    points[i * 3 + 2] = r * Math.cos(phi)
  }
  return points
}

export const HeroScene = forwardRef<
  { render: (progress: number, sceneProgress: number) => void },
  {}
>(function HeroScene(_props, ref) {
  const groupRef = useRef<THREE.Group>(null!)
  const particlesRef = useRef<THREE.Points>(null!)
  const orbRef = useRef<THREE.Mesh>(null!)

  // Camera target positions at start (sceneProgress=0) and end (sceneProgress=1)
  const cameraTarget = useRef(new THREE.Vector3(0, 0, 4.5))
  const cameraLookAt = useRef(new THREE.Vector3(0, 0, 0))

  const spherePoints = useMemo(() => generateSpherePoints(2000, 2.5), [])

  // Expose render() — only called by SceneManager when this scene is in view
  useImperativeHandle(ref, () => ({
    render: (_progress: number, sceneProgress: number) => {
      if (!groupRef.current) return

      // Map sceneProgress 0→1 to camera pullback 4.5→6.5
      const zTarget = 4.5 + sceneProgress * 2.0
      cameraTarget.current.set(0, sceneProgress * 0.3, zTarget)

      // Smooth lerp — creates the weighted scroll feel
      groupRef.current.position.lerp(cameraTarget.current, 0.05)

      // Slow rotation
      groupRef.current.rotation.y += 0.003
      groupRef.current.rotation.x = Math.sin(Date.now() * 0.0005) * 0.05
    },
  }))

  // Continuous idle animation even when not the "active" scene
  // (subtle rotation so particles don't freeze mid-spin during transitions)
  useFrame(() => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.0005
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 4.5]}>
      {/* Particle sphere */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={spherePoints.length / 3}
            array={spherePoints}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#c8a84b"
          size={0.015}
          sizeAttenuation
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </points>

      {/* Wireframe orb */}
      <mesh ref={orbRef} scale={1.2}>
        <icosahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial
          color="#4a7a9c"
          wireframe
          transparent
          opacity={0.15}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Ambient glow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.0, 0]}>
        <ringGeometry args={[1.5, 3.0, 64]} />
        <meshBasicMaterial
          color="#c8a84b"
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
})
