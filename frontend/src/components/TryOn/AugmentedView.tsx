'use client'

import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { ClothingItem, PoseData } from '@/types/clothing'
import { usePoseEstimation } from '@/hooks/usePoseEstimation'
import { PoseLandmarks } from './PoseLandmarks'

interface AugmentedViewProps {
  selectedItem: ClothingItem;
  videoRef: React.RefObject<HTMLVideoElement>;
  poseData: PoseData | null;
}

const AugmentedView = ({ selectedItem, videoRef, poseData }: AugmentedViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { scene } = useGLTF(selectedItem.modelPath)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const animationFrameRef = useRef<number>()
  
  // Use our custom pose estimation hook
  const { poseData: poseDataFromHook, error } = usePoseEstimation(videoRef)

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
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer

    // Setup camera for AR view
    const camera = new THREE.PerspectiveCamera(63, 640 / 480, 0.1, 1000)
    camera.position.set(0, 0, 2)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 5, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 1024
    directionalLight.shadow.mapSize.height = 1024
    scene.add(directionalLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-5, 0, -5)
    scene.add(fillLight)

    return () => {
      cancelAnimationFrame(animationFrameRef.current!)
      renderer.dispose()
    }
  }, [])

  useEffect(() => {
    if (!poseData?.landmarks) return

    const animate = () => {
      if (!poseData?.landmarks || !scene || !sceneRef.current) return

      const clonedScene = scene.clone()
      
      // Clear existing model
      while (sceneRef.current!.children.length > 3) {
        sceneRef.current!.remove(sceneRef.current!.children[3])
      }

      // Enhanced body measurements
      const shoulders = {
        left: poseData.landmarks[11],
        right: poseData.landmarks[12]
      }
      const hips = {
        left: poseData.landmarks[23],
        right: poseData.landmarks[24]
      }
      const spine = {
        top: poseData.landmarks[11],
        mid: poseData.landmarks[23],
        bottom: poseData.landmarks[24]
      }

      // Calculate improved body proportions
      const shoulderWidth = Math.sqrt(
        Math.pow(shoulders.right.x - shoulders.left.x, 2) +
        Math.pow(shoulders.right.y - shoulders.left.y, 2)
      )
      const torsoHeight = Math.abs(spine.top.y - spine.bottom.y)
      const bodyDepth = Math.abs(spine.mid.z - shoulders.left.z)

      // Enhanced position calculation
      const centerX = (shoulders.left.x + shoulders.right.x) / 2
      const centerY = -(spine.top.y + spine.mid.y) / 2
      const centerZ = -(spine.mid.z + shoulders.left.z) / 2

      // Apply clothing offset with improved positioning
      const offset = selectedItem.offset || {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1
      }

      // Dynamic scaling based on body proportions
      const baseScale = (
        shoulderWidth * 3.5 +
        torsoHeight * 1.5 +
        bodyDepth * 1.0
      ) * offset.scale
      clonedScene.scale.setScalar(baseScale)

      // Smooth position interpolation
      const targetPosition = new THREE.Vector3(
        centerX * 2 + offset.position.x,
        centerY * 2 + offset.position.y,
        centerZ + offset.position.z
      )

      // Enhanced rotation calculation
      const spineAngle = Math.atan2(
        spine.bottom.z - spine.top.z,
        spine.bottom.y - spine.top.y
      )
      const shoulderAngle = Math.atan2(
        shoulders.right.y - shoulders.left.y,
        shoulders.right.x - shoulders.left.x
      )
      const hipAngle = Math.atan2(
        hips.right.y - hips.left.y,
        hips.right.x - hips.left.x
      )

      // Apply enhanced rotations
      const smoothFactor = 0.15
      clonedScene.position.lerp(targetPosition, smoothFactor)
      clonedScene.rotation.set(
        spineAngle * 0.8 + offset.rotation.x,
        Math.PI + shoulderAngle * 0.7 + hipAngle * 0.3 + offset.rotation.y,
        offset.rotation.z
      )

      // Add model to scene with shadows
      clonedScene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true
          object.receiveShadow = true
        }
      })
      sceneRef.current!.add(clonedScene)

      // Render
      rendererRef.current!.render(sceneRef.current!, cameraRef.current!)

      // Request next frame
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
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
      {error && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-red-100 bg-opacity-75">
          <p className="text-red-600 text-center p-4">{error}</p>
        </div>
      )}
      {poseData && <PoseLandmarks landmarks={poseData.landmarks} />}
    </div>
  )
}

export default AugmentedView 