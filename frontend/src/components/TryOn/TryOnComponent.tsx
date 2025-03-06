'use client'

import React, { useEffect, useRef, useState, Suspense } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import { Pose } from '@mediapipe/pose'
import { Camera } from '@mediapipe/camera_utils'

const Model = ({ posePoints }: { posePoints?: any }) => {
  const gltf = useGLTF('/models/scene.gltf')
  return (
    <group>
      <primitive 
        object={gltf.scene} 
        scale={0.5}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      />
    </group>
  )
}

useGLTF.preload('/models/scene.gltf')

const TryOnComponent = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [modelVisible, setModelVisible] = useState(false)
  const [posePoints, setPosePoints] = useState(null)

  useEffect(() => {
    if (!videoRef.current) return

    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      }
    })

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })

    pose.onResults((results) => {
      if (results.poseLandmarks) {
        setPosePoints(results)
      }
    })

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await pose.send({ image: videoRef.current })
        }
      },
      width: 640,
      height: 480
    })

    camera.start()

    return () => {
      camera.stop()
      pose.close()
    }
  }, [])

  const handleTryOn = () => {
    setModelVisible(true)
  }

  return (
    <div className="try-on-container">
      <h2 className="text-xl font-bold mb-4">Virtual Try-On</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="webcam-container">
          <p className="text-sm text-gray-600 mb-2">Webcam Feed:</p>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="rounded-lg shadow-md w-full"
          />
        </div>
        <div className="model-container h-[480px]">
          <p className="text-sm text-gray-600 mb-2">3D Model Preview:</p>
          <Canvas
            camera={{ 
              position: [0, 1, 5],
              fov: 75 
            }}
            shadows
            gl={{ preserveDrawingBuffer: true }}
            className="rounded-lg shadow-md w-full h-full bg-gray-100"
          >
            <Suspense fallback={<LoadingBox />}>
              <ambientLight intensity={0.5} />
              <directionalLight
                position={[5, 5, 5]}
                intensity={1}
                castShadow
              />
              {modelVisible && <Model posePoints={posePoints} />}
              <Environment preset="studio" />
              <OrbitControls 
                makeDefault
                minPolarAngle={0}
                maxPolarAngle={Math.PI / 2}
              />
              <gridHelper args={[10, 10]} />
            </Suspense>
          </Canvas>
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={handleTryOn}
          className="px-4 py-2 bg-blue-600 text-white rounded-full
            hover:bg-blue-700 transition-colors"
        >
          Try On Clothing
        </button>
      </div>
    </div>
  )
}

// Simple loading indicator
const LoadingBox = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="hotpink" />
  </mesh>
)

export default TryOnComponent 