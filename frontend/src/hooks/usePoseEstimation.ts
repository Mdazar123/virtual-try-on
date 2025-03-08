import { useEffect, useRef, useState } from 'react'
import { PoseData } from '@/types/clothing'
import { Camera } from '@mediapipe/camera_utils'

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/pose/ws'

export const usePoseEstimation = (videoRef: React.RefObject<HTMLVideoElement>) => {
  const [poseData, setPoseData] = useState<PoseData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const cameraRef = useRef<Camera | null>(null)

  useEffect(() => {
    if (!videoRef.current) return

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (!videoRef.current || !wsRef.current) return

        try {
          const canvas = document.createElement('canvas')
          canvas.width = videoRef.current.videoWidth
          canvas.height = videoRef.current.videoHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          ctx.drawImage(videoRef.current, 0, 0)
          const base64Frame = canvas.toDataURL('image/jpeg', 0.8)
          
          wsRef.current.send(base64Frame)
        } catch (err) {
          console.error('Error capturing frame:', err)
          setError('Error processing video frame')
        }
      },
      width: 640,
      height: 480
    })

    wsRef.current = new WebSocket(WEBSOCKET_URL)
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connection established')
      setError(null)
    }

    wsRef.current.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        if (data.success) {
          setPoseData({
            landmarks: data.landmarks,
            timestamp: Date.now()
          })
          setError(null)
        } else {
          setError(data.message || 'No pose detected')
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err)
      }
    }

    cameraRef.current = camera
    camera.start()
      .catch((err) => {
        console.error('Error starting camera:', err)
        setError('Failed to start camera. Please ensure camera access is allowed.')
      })

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (cameraRef.current) {
        cameraRef.current.stop()
      }
    }
  }, [videoRef])

  return { poseData, error } as const
} 