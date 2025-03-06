'use client'

import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { PoseData, ClothingItem } from '@/types/clothing'
import * as tf from '@tensorflow/tfjs'

const AugmentedView = ({ 
  videoRef, 
  poseData, 
  selectedItem 
}: { 
  videoRef: React.RefObject<HTMLVideoElement>;
  poseData: PoseData | null;
  selectedItem: ClothingItem;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const { scene, error } = useGLTF(selectedItem.modelPath, undefined, (error) => {
    console.error('Error loading model:', error)
    setLoadError(error.message)
  })
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return

    // Setup Three.js
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    })
    renderer.setSize(640, 480)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 0)
    rendererRef.current = renderer

    // Setup camera for AR view
    const fov = 63 // Match the webcam's FOV
    const camera = new THREE.PerspectiveCamera(fov, 640 / 480, 0.1, 1000)
    camera.position.set(0, 0, 2)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(0, 1, 1)
    scene.add(directionalLight)

    const backLight = new THREE.DirectionalLight(0xffffff, 0.5)
    backLight.position.set(0, 0, -1)
    scene.add(backLight)

    return () => {
      cancelAnimationFrame(animationFrameRef.current!)
      renderer.dispose()
    }
  }, [])

  useEffect(() => {
    if (!poseData?.landmarks || !scene || !sceneRef.current || !cameraRef.current || !rendererRef.current) return

    const animate = () => {
      if (!poseData?.landmarks) return

      const clonedScene = scene.clone()
      
      // Clear existing model
      while (sceneRef.current!.children.length > 3) { // Keep lights
        sceneRef.current!.remove(sceneRef.current!.children[3])
      }

      // Get body landmarks
      const shoulders = {
        left: poseData.landmarks[11],
        right: poseData.landmarks[12]
      }
      const chest = poseData.landmarks[23]
      const hips = {
        left: poseData.landmarks[23],
        right: poseData.landmarks[24]
      }

      // Calculate body measurements with TensorFlow.js for stability
      const shoulderWidth = tf.tidy(() => {
        const leftPoint = tf.tensor1d([shoulders.left.x, shoulders.left.y])
        const rightPoint = tf.tensor1d([shoulders.right.x, shoulders.right.y])
        return tf.sqrt(tf.sum(tf.square(tf.sub(rightPoint, leftPoint)))).arraySync()
      })

      // Calculate model position in normalized coordinates (-1 to 1)
      const centerX = (shoulders.left.x + shoulders.right.x) / 2 - 0.5
      const centerY = -((shoulders.left.y + chest.y) / 2) + 0.5
      const centerZ = -((shoulders.left.z + shoulders.right.z) / 2) - 1 // Move model in front of person

      // Apply clothing offset if available
      const offset = selectedItem.offset || {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1
      }

      // Scale model based on shoulder width and offset
      const baseScale = shoulderWidth * 5 * offset.scale // Increased scale factor
      clonedScene.scale.setScalar(baseScale)

      // Position model with offset
      clonedScene.position.set(
        centerX * 2 + offset.position.x,
        centerY * 2 + offset.position.y + 0.1, // Slight upward adjustment
        centerZ + offset.position.z
      )

      // Calculate rotation based on shoulder angle
      const shoulderAngle = Math.atan2(
        shoulders.right.y - shoulders.left.y,
        shoulders.right.x - shoulders.left.x
      )

      // Apply rotation with offset
      clonedScene.rotation.set(
        offset.rotation.x,
        Math.PI + shoulderAngle + offset.rotation.y,
        offset.rotation.z
      )

      // Add model to scene
      sceneRef.current!.add(clonedScene)

      // Render
      rendererRef.current!.render(sceneRef.current!, cameraRef.current!)

      // Request next frame
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameRef.current!)
    }
  }, [scene, poseData, selectedItem])

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="rounded-lg shadow-md w-full"
        style={{ transform: 'scaleX(-1)' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ transform: 'scaleX(-1)' }}
      />
      {loadError && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-red-100 bg-opacity-75">
          <p className="text-red-600 text-center p-4">Error loading model: {loadError}</p>
        </div>
      )}
      {poseData && <PoseLandmarks landmarks={poseData.landmarks} />}
    </div>
  )
}

export default AugmentedView 