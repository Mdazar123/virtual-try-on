'use client'

import React, { useEffect, useRef, useState, Suspense, useCallback } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import { ClothingItem, PoseData } from '@/types/clothing'
import ClothingSelector from '../ClothingSelector/ClothingSelector'
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary'
import { PoseAlignmentService } from '@/services/PoseAlignmentService'
import { usePoseEstimation } from '@/hooks/usePoseEstimation'
import AugmentedView from './AugmentedView'
import { PoseLandmarks } from './PoseLandmarks'

const clothingItems: ClothingItem[] = [
  {
    id: 't_shirt_1',
    name: 'Womens Shirt',
    modelPath: '/models/womens_shirt/scene.gltf',
    thumbnailPath: '/models/womens_shirt/thumbnail.jpg',
    category: 'tops',
    offset: {
      position: { x: 0, y: 0.12, z: 0.08 },
      rotation: { x: 0.15, y: Math.PI, z: 0 },
      scale: 0.9
    },
    defaultScale: 0.5,
    defaultPosition: [0, 0, 0]
  }
]

// Update ClothingItem type
interface ExtendedClothingItem extends ClothingItem {
  defaultScale: number;
  defaultPosition: [number, number, number];
}

const Model = ({ selectedItem, poseData, alignmentService }: { 
  selectedItem: ExtendedClothingItem;
  poseData: PoseData | null;
  alignmentService: PoseAlignmentService | null;
}) => {
  const modelRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(selectedItem.modelPath)
  const [modelLoaded, setModelLoaded] = useState(false)
  const lastPositionRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const lastScaleRef = useRef<number>(selectedItem.defaultScale)
  const lastRotationRef = useRef<THREE.Euler>(new THREE.Euler())

  useEffect(() => {
    if (scene) {
      try {
        const clonedScene = scene.clone(true)
        
        if (poseData?.landmarks && alignmentService) {
          const shoulders = {
            left: poseData.landmarks[11],
            right: poseData.landmarks[12]
          }
          const neck = poseData.landmarks[0]
          const chest = poseData.landmarks[23]
          
          // Calculate improved position based on upper body
          const centerX = (shoulders.left.x + shoulders.right.x) / 2
          const centerY = (neck.y + shoulders.left.y + shoulders.right.y) / 3 - 0.2
          const centerZ = (chest.z + (shoulders.left.z + shoulders.right.z) / 2) / 2
          
          const targetPosition = new THREE.Vector3(
            centerX * 2,
            -centerY * 2,
            -centerZ * 2
          )

          // Enhanced smoothing
          const smoothingFactor = 0.2
          const smoothedPosition = lastPositionRef.current.lerp(targetPosition, smoothingFactor)
          clonedScene.position.copy(smoothedPosition)
          lastPositionRef.current = smoothedPosition.clone()

          // Improved scaling based on body proportions
          const shoulderWidth = Math.abs(shoulders.right.x - shoulders.left.x)
          const torsoHeight = Math.abs(chest.y - shoulders.left.y)
          const targetScale = (shoulderWidth * 3 + torsoHeight) * 2
          const smoothedScale = THREE.MathUtils.lerp(lastScaleRef.current, targetScale, smoothingFactor)
          clonedScene.scale.setScalar(smoothedScale)
          lastScaleRef.current = smoothedScale

          // Calculate rotation with body lean
          const shoulderAngle = Math.atan2(
            shoulders.right.y - shoulders.left.y,
            shoulders.right.x - shoulders.left.x
          )
          const leanAngle = Math.atan2(
            chest.z - neck.z,
            chest.y - neck.y
          )

          const targetRotation = new THREE.Euler(
            leanAngle * 0.5 + (selectedItem.offset?.rotation.x || 0),
            Math.PI + shoulderAngle + (selectedItem.offset?.rotation.y || 0),
            selectedItem.offset?.rotation.z || 0
          )

          // Smooth rotation
          clonedScene.rotation.set(
            THREE.MathUtils.lerp(lastRotationRef.current.x, targetRotation.x, smoothingFactor),
            THREE.MathUtils.lerp(lastRotationRef.current.y, targetRotation.y, smoothingFactor),
            THREE.MathUtils.lerp(lastRotationRef.current.z, targetRotation.z, smoothingFactor)
          )
          lastRotationRef.current.copy(clonedScene.rotation)

          // Apply clothing offset
          if (selectedItem.offset) {
            clonedScene.position.add(new THREE.Vector3(
              selectedItem.offset.position.x,
              selectedItem.offset.position.y,
              selectedItem.offset.position.z
            ))
            clonedScene.scale.multiplyScalar(selectedItem.offset.scale)
          }
        } else {
          // Default preview position when no pose data
          clonedScene.scale.setScalar(selectedItem.defaultScale)
          clonedScene.position.set(...selectedItem.defaultPosition)
          clonedScene.rotation.set(0, Math.PI, 0)
        }

        if (modelRef.current) {
          modelRef.current.clear()
          modelRef.current.add(clonedScene)
          setModelLoaded(true)
        }
      } catch (error) {
        console.error('Error setting up model:', error)
      }
    }
  }, [scene, poseData, selectedItem, alignmentService])

  return (
    <group ref={modelRef}>
      {!modelLoaded && <LoadingBox />}
    </group>
  )
}

const LoadingBox = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="hotpink" />
  </mesh>
)

const TryOnComponent = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [selectedItem, setSelectedItem] = useState<ExtendedClothingItem>(clothingItems[0])
  const [poseData, setPoseData] = useState<PoseData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [webcamError, setWebcamError] = useState<string | null>(null)
  const [alignmentService, setAlignmentService] = useState<PoseAlignmentService | null>(null)

  // Use pose estimation hook directly
  const { poseData: detectedPose, error: poseError } = usePoseEstimation(videoRef)

  // Update pose data when detection changes
  useEffect(() => {
    if (detectedPose) {
      setPoseData(detectedPose)
    }
  }, [detectedPose])

  useEffect(() => {
    if (!videoRef.current) return

    // Start webcam
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          } 
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setWebcamError(null)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to access webcam'
        console.error("Error accessing webcam:", err)
        setWebcamError(errorMessage)
        setIsLoading(false)
      }
    }

    startWebcam()
  }, [])

  // Initialize alignment service on client side
  useEffect(() => {
    const initService = async () => {
      const service = await new PoseAlignmentService().initialize()
      setAlignmentService(service)
    }
    initService()
  }, [])

  return (
    <div className="try-on-container p-6">
      <h2 className="text-2xl font-bold mb-6">Virtual Try-On</h2>
      <div className="grid grid-cols-2 gap-8">
        <div className="webcam-container relative">
          <p className="text-sm text-gray-600 mb-2">Virtual Try-On View:</p>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
          )}
          {webcamError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-75 rounded-lg">
              <p className="text-red-600 text-center p-4">{webcamError}</p>
            </div>
          )}
          <AugmentedView 
            videoRef={videoRef}
            poseData={poseData}
            selectedItem={selectedItem}
          />
        </div>
        <div className="model-container h-[480px]">
          <p className="text-sm text-gray-600 mb-2">3D Model Preview:</p>
          <Canvas
            camera={{ 
              position: [0, 0, 3],
              fov: 60,
              near: 0.1,
              far: 1000
            }}
            shadows
            gl={{ 
              preserveDrawingBuffer: true,
              antialias: true
            }}
            className="rounded-lg shadow-md w-full h-full bg-gray-100"
          >
            <Suspense fallback={<LoadingBox />}>
              <ambientLight intensity={1} />
              <directionalLight 
                position={[5, 5, 5]} 
                intensity={1.5}
                castShadow
              />
              <directionalLight 
                position={[-5, 5, -5]} 
                intensity={1}
                castShadow
              />
              <spotLight
                position={[0, 5, 0]}
                intensity={0.8}
                angle={Math.PI / 4}
                castShadow
              />
              <Model 
                selectedItem={selectedItem} 
                poseData={poseData} 
                alignmentService={alignmentService}
              />
              <Environment preset="studio" />
              <OrbitControls 
                makeDefault 
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={1.5}
                maxDistance={6}
                target={[0, 0, 0]}
              />
            </Suspense>
          </Canvas>
        </div>
      </div>
      <div className="mt-8">
        <ClothingSelector 
          items={clothingItems} 
          selectedItem={selectedItem}
          onSelect={setSelectedItem} 
        />
      </div>
    </div>
  )
}

export default TryOnComponent 