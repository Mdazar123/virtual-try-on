'use client'

import { useEffect, useRef } from 'react'
import { Pose } from '@mediapipe/pose'
import { Camera } from '@mediapipe/camera_utils'
import * as tf from '@tensorflow/tfjs'

// Helper function to smooth landmarks using TensorFlow.js
const smoothLandmarks = async (landmarksTensor: tf.Tensor2D) => {
  // Apply exponential moving average for smoother transitions
  const alpha = 0.8 // Smoothing factor
  const smoothingFilter = tf.tidy(() => {
    // Apply EMA filter with simpler smoothing
    return tf.movingAverage(landmarksTensor, 5, alpha)
  })

  const smoothedTensor = await smoothingFilter.array() as number[][]
  
  // Clean up tensors
  smoothingFilter.dispose()

  // Convert to landmark format with improved visibility calculation
  return smoothedTensor.map((coords: number[]) => {
    const [x, y, z] = coords
    // Calculate visibility based on landmark stability
    const visibility = Math.min(
      1.0,
      Math.max(0.1, 1.0 - (Math.abs(z) * 2))
    )
    return {
      x,
      y,
      z,
      visibility
    }
  })
}

export const usePoseDetection = (videoRef: React.RefObject<HTMLVideoElement>, onPoseDetected: (pose: any) => void) => {
  const poseRef = useRef<Pose | null>(null)
  const cameraRef = useRef<Camera | null>(null)
  const tensorRef = useRef<tf.Tensor | null>(null)
  const lastPoseRef = useRef<any>(null)

  useEffect(() => {
    let isInitialized = false

    const initPose = async () => {
      if (!poseRef.current && videoRef.current && !isInitialized) {
        isInitialized = true

        try {
          // Initialize TensorFlow.js with WebGL backend for better performance
          await tf.setBackend('webgl')
          await tf.ready()
          
          const pose = new Pose({
            locateFile: (file) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`
            }
          })

          await pose.setOptions({
            modelComplexity: 2,
            enableSegmentation: true,
            smoothSegmentation: true,
            smoothLandmarks: true,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7,
            selfieMode: true
          })

          pose.onResults(async (results) => {
            if (results.poseLandmarks) {
              try {
                // Convert segmentation mask to tensor
                if (results.segmentationMask) {
                  if (tensorRef.current) {
                    tensorRef.current.dispose()
                  }
                  const maskTensor = tf.browser.fromPixels(results.segmentationMask, 1)
                  tensorRef.current = maskTensor
                }

                // Process landmarks with TensorFlow.js for stability
                const landmarksTensor = tf.tensor2d(
                  results.poseLandmarks.map((l: { x: number; y: number; z: number }) => [l.x, l.y, l.z])
                )
                const smoothedLandmarks = await smoothLandmarks(landmarksTensor)
                
                // Interpolate with previous pose for smoother transitions
                const currentPose = {
                  landmarks: smoothedLandmarks,
                  worldLandmarks: results.poseWorldLandmarks,
                  segmentationMask: tensorRef.current
                }

                if (lastPoseRef.current) {
                  const interpolatedPose = interpolatePoses(lastPoseRef.current, currentPose, 0.3)
                  lastPoseRef.current = interpolatedPose
                  onPoseDetected(interpolatedPose)
                } else {
                  lastPoseRef.current = currentPose
                  onPoseDetected(currentPose)
                }

                // Cleanup tensors
                landmarksTensor.dispose()
              } catch (error) {
                console.error('Error processing pose results:', error)
              }
            }
          })

          await pose.initialize()
          poseRef.current = pose

        } catch (err) {
          console.error('Pose initialization error:', err)
        }
      }
    }

    initPose()

    return () => {
      if (tensorRef.current) {
        tensorRef.current.dispose()
      }
      isInitialized = false
    }
  }, [videoRef, onPoseDetected])

  return poseRef.current
}

// Helper function to interpolate between poses for smoother transitions
const interpolatePoses = (pose1: any, pose2: any, t: number) => {
  const interpolatedLandmarks = pose1.landmarks.map((l1: any, i: number) => {
    const l2 = pose2.landmarks[i]
    return {
      x: l1.x * (1 - t) + l2.x * t,
      y: l1.y * (1 - t) + l2.y * t,
      z: l1.z * (1 - t) + l2.z * t,
      visibility: Math.max(l1.visibility, l2.visibility)
    }
  })

  return {
    ...pose2,
    landmarks: interpolatedLandmarks
  }
}

// Helper function to extract clothing region
function extractClothingRegion(segmentationMask: any) {
  // Define key points for clothing region
  const clothingPoints = {
    shoulders: { left: 11, right: 12 },
    chest: { center: 23 },
    waist: { left: 23, right: 24 },
    hips: { left: 23, right: 24 }
  }

  return clothingPoints
} 