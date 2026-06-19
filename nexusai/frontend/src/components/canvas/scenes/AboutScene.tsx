/**
 * AboutScene — 3D scene for the "How It Works" / about section.
 *
 * Renders a geometric tunnel of torus knots that rotate and pulse
 * based on scroll progress. Creates a sense of data flowing through
 * the RAG pipeline as the user scrolls.
 *
 * Camera follows a gentle arc: starts wide and low, ends closer and higher.
 */
"use client"

import { forwardRef, useImperativeHandle, useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export const AboutScene = forwardRef<
  { render: (progress: number, sceneProgress: number) => void },
  {}
>(function AboutScene(_props, ref) {
  const groupRef = useRef<THREE.Group>(null!)
  const knotsRef = useRef<THREE.Mesh[]>([])

  const cameraTarget = useRef(new THREE.Vector3(0, 0, 6))

  // Pre-generate a set of torus knot positions along a sine-wave ring
  const knotPositions = useMemo(() => {
    const positions: { x: number; y: number; z: number; size: number }[] = []
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      positions.push({
        x: Math.cos(angle) * 2.5,
        y: Math.sin(angle * 2) * 0.8,
        z: Math.sin(angle) * 2.5 - 2,
        size: 0.3 + Math.random() * 0.3,
      })
    }
    return positions
  }, [])

  // Expose render() for selective rendering
  useImperativeHandle(ref, () => ({
    render: (_progress: number, sceneProgress: number) => {
      if (!groupRef.current) return

      // Camera arc: moves from z=6 at start to z=4 at end, with slight rise
      const z = 6 - sceneProgress * 2
      const y = sceneProgress * 0.5
      cameraTarget.current.set(0, y, z)
      groupRef.current.position.lerp(cameraTarget.current, 0.04)

      // Spin the knots based on scroll
      groupRef.current.rotation.y += 0.005 + sceneProgress * 0.01
    },
  }))

  // Idle animation — subtle oscillation of knot sizes
  useFrame((state) => {
    knotsRef.current.forEach((knot, i) => {
      if (knot) {
        const pulse = Math.sin(state.clock.elapsedTime * 0.5 + i * 0.8) * 0.03
        knot.scale.setScalar(1 + pulse)
      }
    })
  })

  return (
    <group ref={groupRef} position={[0, 0, 6]}>
      {knotPositions.map((pos, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) knotsRef.current[i] = el
          }}
          position={[pos.x, pos.y, pos.z]}
          scale={pos.size}
        >
          <torusKnotGeometry args={[0.5, 0.15, 64, 8]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#c8a84b" : "#4a7a9c"}
            wireframe
            transparent
            opacity={0.25 + i * 0.03}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      ))}

      {/* Connecting lines between knots */}
      {knotPositions.map((pos, i) => {
        const next = knotPositions[(i + 1) % knotPositions.length]
        const points = [
          new THREE.Vector3(pos.x, pos.y, pos.z),
          new THREE.Vector3(next.x, next.y, next.z),
        ]
        return (
          <line key={`line-${i}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([
                  points[0].x, points[0].y, points[0].z,
                  points[1].x, points[1].y, points[1].z,
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#c8a84b" transparent opacity={0.08} />
          </line>
        )
      })}
    </group>
  )
})
