'use client'

import React, { useEffect, useRef, useState, Suspense, useCallback } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import { ClothingItem, PoseData } from '@/types/clothing'
import ClothingSelector from '../ClothingSelector/ClothingSelector'
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary'
import { PoseAlignmentService } from '@/services/PoseAlignmentService'
import { usePoseDetection } from './PoseDetectionWrapper'
import AugmentedView from './AugmentedView'

const clothingItems: ClothingItem[] = [
  {
    id: 't_shirt_1',
    name: 'Womens Shirt',
    modelPath: './models/womens_shirt/scene.gltf',
    thumbnail: './models/womens_shirt/thumbnail.jpg',
    category: 'tops',
    defaultScale: 2.5,
    defaultPosition: [0, 0, 0] as [number, number, number],
    offset: {
      position: { x: 0, y: 0.3, z: 0.2 },
      rotation: { x: 0, y: Math.PI, z: 0 },
      scale: 1.5
    }
  }
]

const Model = ({ selectedItem, poseData, alignmentService }: { 
  selectedItem: ClothingItem;
  poseData: PoseData | null;
  alignmentService: PoseAlignmentService | null;
}) => {
  const modelRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(selectedItem.modelPath)
  const [modelLoaded, setModelLoaded] = useState(false)

  useEffect(() => {
    if (scene) {
      try {
        const clonedScene = scene.clone(true)
        
        // Initial positioning for 3D preview
        clonedScene.scale.setScalar(selectedItem.defaultScale)
        clonedScene.position.set(0, 0, 0)
        clonedScene.rotation.set(0, Math.PI, 0)

        // If we have pose data, align with body
        if (poseData?.landmarks && alignmentService) {
          const shoulders = {
            left: poseData.landmarks[11],
            right: poseData.landmarks[12]
          }
          
          // Calculate position based on shoulders
          const centerX = (shoulders.left.x + shoulders.right.x) / 2
          const centerY = shoulders.left.y - 0.2 // Slightly above shoulders
          const centerZ = (shoulders.left.z + shoulders.right.z) / 2
          
          clonedScene.position.set(
            centerX * 2,
            -centerY * 2,
            -centerZ * 2
          )

          // Scale based on shoulder width
          const shoulderWidth = Math.abs(shoulders.right.x - shoulders.left.x)
          const scale = shoulderWidth * 3
          clonedScene.scale.setScalar(scale)
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
  const [selectedItem, setSelectedItem] = useState<ClothingItem>(clothingItems[0])
  const [poseData, setPoseData] = useState<PoseData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [webcamError, setWebcamError] = useState<string | null>(null)
  const [alignmentService, setAlignmentService] = useState<PoseAlignmentService | null>(null)

  const handlePoseDetected = useCallback((pose: any) => {
    setPoseData(pose)
  }, [])

  const pose = usePoseDetection(videoRef, handlePoseDetected)

  useEffect(() => {
    if (videoRef.current && pose) {
      const processFrame = async () => {
        if (videoRef.current) {
          await pose.send({ image: videoRef.current })
        }
        requestAnimationFrame(processFrame)
      }

      processFrame()
    }
  }, [pose])

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

// Add a component to visualize landmarks
const PoseLandmarks = ({ landmarks }: { landmarks: PoseData['landmarks'] }) => {
  return (
    <svg className="absolute top-0 left-0 w-full h-full" style={{ transform: 'scaleX(-1)' }}>
      {landmarks.map((landmark, index) => (
        <circle
          key={index}
          cx={landmark.x * 640}
          cy={landmark.y * 480}
          r={3}
          fill={(landmark.visibility ?? 0) > 0.5 ? "lime" : "red"}
        />
      ))}
      {/* Draw lines between shoulders */}
      {landmarks[11] && landmarks[12] && (
        <line
          x1={landmarks[11].x * 640}
          y1={landmarks[11].y * 480}
          x2={landmarks[12].x * 640}
          y2={landmarks[12].y * 480}
          stroke="yellow"
          strokeWidth="2"
        />
      )}
    </svg>
  )
}

export default TryOnComponent 