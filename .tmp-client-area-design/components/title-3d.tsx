"use client"

import { Canvas, useThree } from "@react-three/fiber"
import { Float } from "@react-three/drei"
import { useEffect } from "react"

function ContextHandler() {
  const { gl, invalidate } = useThree()

  useEffect(() => {
    const canvas = gl.domElement
    const onRestored = () => invalidate()
    const onLost = (e: Event) => e.preventDefault()
    canvas.addEventListener("webglcontextlost", onLost)
    canvas.addEventListener("webglcontextrestored", onRestored)
    return () => {
      canvas.removeEventListener("webglcontextlost", onLost)
      canvas.removeEventListener("webglcontextrestored", onRestored)
    }
  }, [gl, invalidate])

  return null
}

type Shape = {
  position: [number, number, number]
  geometry: "box" | "tower" | "sphere" | "torus"
  scale: number
  color: string
  speed: number
}

const shapes: Shape[] = [
  { position: [-4.6, 0.3, 0], geometry: "tower", scale: 1, color: "#b85c38", speed: 1.4 },
  { position: [-3.1, -0.5, -1], geometry: "box", scale: 0.8, color: "#d98a52", speed: 1.8 },
  { position: [-2, 0.8, -0.5], geometry: "sphere", scale: 0.55, color: "#e8b27d", speed: 2.2 },
  { position: [2, 0.7, -0.5], geometry: "torus", scale: 0.55, color: "#c46a3f", speed: 2 },
  { position: [3.1, -0.4, -1], geometry: "tower", scale: 0.9, color: "#d98a52", speed: 1.6 },
  { position: [4.6, 0.4, 0], geometry: "box", scale: 0.85, color: "#b85c38", speed: 1.5 },
]

function ShapeMesh({ shape }: { shape: Shape }) {
  return (
    <Float speed={shape.speed} rotationIntensity={0.8} floatIntensity={1.1}>
      <mesh position={shape.position} scale={shape.scale} rotation={[0.4, 0.6, 0.1]}>
        {shape.geometry === "box" && <boxGeometry args={[1, 1, 1]} />}
        {shape.geometry === "tower" && <boxGeometry args={[0.7, 1.8, 0.7]} />}
        {shape.geometry === "sphere" && <icosahedronGeometry args={[0.7, 1]} />}
        {shape.geometry === "torus" && <torusGeometry args={[0.55, 0.22, 16, 32]} />}
        <meshStandardMaterial
          color={shape.color}
          roughness={0.4}
          metalness={0.2}
          flatShading
        />
      </mesh>
    </Float>
  )
}

export function Title3D() {
  return (
    <Canvas camera={{ position: [0, 0, 9], fov: 40 }} dpr={[1, 1.5]}>
      <ContextHandler />
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 5, 6]} intensity={2} />
      <directionalLight position={[-4, 2, -2]} intensity={0.8} color="#ffce9e" />
      {shapes.map((s, i) => (
        <ShapeMesh key={i} shape={s} />
      ))}
    </Canvas>
  )
}
