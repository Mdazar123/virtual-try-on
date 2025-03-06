'use client'

import React, { useEffect, useRef, useState, Suspense } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'

const Model = ({ poseData }: { poseData?: any }) => {
  const gltf = useGLTF('/models/womens_shirt/scene.gltf')
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    if (gltf) {
      setIsLoaded(true)
      // Set initial position and scale
      gltf.scene.position.set(0, 2, -1)
      gltf.scene.scale.set(8, 8, 8) // Increased initial scale
      gltf.scene.rotation.set(0, Math.PI, 0)
    }
  }, [gltf])
  
  useEffect(() => {
    if (poseData && !poseData.error && isLoaded) {
      try {
        const { landmarks } = poseData
        
        if (landmarks && landmarks[11] && landmarks[12]) {
          const leftShoulder = landmarks[11]
          const rightShoulder = landmarks[12]
          const leftHip = landmarks[23]
          const rightHip = landmarks[24]
          const neck = landmarks[0] // Using nose as reference for depth
          
          // Calculate body dimensions with normalized coordinates
          const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x)
          const bodyHeight = Math.abs((leftShoulder.y + rightShoulder.y)/2 - (leftHip.y + rightHip.y)/2)
          
          // Calculate center position with better shoulder alignment
          const centerX = (leftShoulder.x + rightShoulder.x) / 2
          const shoulderY = (leftShoulder.y + rightShoulder.y) / 2
          const hipY = (leftHip.y + rightHip.y) / 2
          const centerY = (shoulderY + hipY) / 2
          
          // Improved position calculations
          const posX = (centerX - 0.5) * 10 // Increased range for more responsive horizontal movement
          const posY = -(centerY - 0.4) * 12 + 2 // Adjusted vertical positioning
          const posZ = -1 - (neck.z * 2) // Dynamic depth based on neck position
          
          // More responsive position updates
          gltf.scene.position.x = THREE.MathUtils.lerp(gltf.scene.position.x, posX, 0.5)
          gltf.scene.position.y = THREE.MathUtils.lerp(gltf.scene.position.y, posY, 0.5)
          gltf.scene.position.z = THREE.MathUtils.lerp(gltf.scene.position.z, posZ, 0.3)
          
          // Improved rotation calculation
          const shoulderAngle = Math.atan2(
            rightShoulder.z - leftShoulder.z,
            rightShoulder.x - leftShoulder.x
          )
          
          // Smoother rotation with faster response
          const targetRotation = Math.PI + shoulderAngle
          gltf.scene.rotation.y = THREE.MathUtils.lerp(
            gltf.scene.rotation.y,
            targetRotation,
            0.4
          )
          
          // Dynamic scaling based on body proportions
          const baseScale = 15 // Increased base scale
          const widthScale = shoulderWidth * baseScale
          const heightScale = bodyHeight * (baseScale * 1.2) // Slightly taller
          
          // Calculate final scale with minimum threshold
          const minScale = 6
          const maxScale = 20
          const finalScale = THREE.MathUtils.clamp(
            Math.max(widthScale, heightScale),
            minScale,
            maxScale
          )
          
          // Apply scale with faster response
          const scaleSpeed = 0.4
          gltf.scene.scale.x = THREE.MathUtils.lerp(gltf.scene.scale.x, finalScale, scaleSpeed)
          gltf.scene.scale.y = THREE.MathUtils.lerp(gltf.scene.scale.y, finalScale, scaleSpeed)
          gltf.scene.scale.z = THREE.MathUtils.lerp(gltf.scene.scale.z, finalScale, scaleSpeed)
        }
      } catch (error) {
        console.error('Error updating model:', error)
      }
    }
  }, [poseData, gltf.scene, isLoaded])

  return (
    <primitive 
      object={gltf.scene}
      castShadow
      receiveShadow
      position={[0, 2, -1]}
      scale={[8, 8, 8]} // Matched with initial scale
    />
  )
}

useGLTF.preload('/models/womens_shirt/scene.gltf')

const TryOnComponent = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [modelVisible, setModelVisible] = useState(false)
  const [poseData, setPoseData] = useState(null)
  const [isWsConnected, setIsWsConnected] = useState(false)
  const [debugFrame, setDebugFrame] = useState<string | null>(null)

  useEffect(() => {
    // Setup WebSocket connection with reconnection logic
    const connectWebSocket = () => {
      wsRef.current = new WebSocket('ws://localhost:8000/ws/pose')
      
      wsRef.current.onopen = () => {
        console.log('WebSocket Connected')
        setIsWsConnected(true)
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setPoseData(data)
          if (data.debug_frame) {
            setDebugFrame(data.debug_frame)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected. Attempting to reconnect...')
        setIsWsConnected(false)
        setTimeout(connectWebSocket, 3000) // Retry every 3 seconds
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    }

    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        setIsWsConnected(false)
      }
    }
  }, [])

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error("Error accessing webcam:", err)
      }
    }

    startWebcam()
  }, [])

  // Update sendFrame function
  const sendFrame = () => {
    const canvas = canvasRef.current
    if (!canvas || !videoRef.current || !wsRef.current || !isWsConnected) return

    const context = canvas.getContext('2d')
    if (context) {
      context.drawImage(videoRef.current, 0, 0, 640, 480)
      const base64Frame = canvas.toDataURL('image/jpeg')
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(base64Frame)
      }
    }
    requestAnimationFrame(sendFrame)
  }

  // Only start sending frames when WebSocket is connected
  useEffect(() => {
    if (isWsConnected) {
      sendFrame()
    }
  }, [isWsConnected])

  useEffect(() => {
    // Make model visible by default
    setModelVisible(true)
  }, [])

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
              position: [0, 0, 10], // Moved camera back slightly
              fov: 40, // Narrower FOV for better perspective
              near: 0.1,
              far: 1000
            }}
            shadows
            gl={{ preserveDrawingBuffer: true }}
            className="rounded-lg shadow-md w-full h-full bg-gray-100"
          >
            <Suspense fallback={<LoadingBox />}>
              <ambientLight intensity={2} />
              <directionalLight
                position={[5, 5, 5]}
                intensity={3}
                castShadow
              />
              <directionalLight
                position={[-5, 5, -5]}
                intensity={2}
                castShadow
              />
              <Model poseData={poseData} />
              <Environment preset="studio" />
              <OrbitControls 
                makeDefault
                minPolarAngle={0}
                maxPolarAngle={Math.PI}
                enableZoom={true}
                enablePan={true}
                enableRotate={true}
                target={[0, 2, -1]}
              />
            </Suspense>
          </Canvas>
        </div>
      </div>
      <canvas 
        ref={canvasRef} 
        width={640} 
        height={480} 
        style={{ display: 'none' }} 
      />
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