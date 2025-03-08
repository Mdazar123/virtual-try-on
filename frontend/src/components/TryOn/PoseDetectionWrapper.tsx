'use client'

import { useEffect, useRef } from 'react'
import { PoseDetectionService } from '@/services/PoseDetectionService'
import { PoseData } from '@/types/clothing'

export const usePoseDetection = (
  videoRef: React.RefObject<HTMLVideoElement>, 
  onPoseDetected: (pose: PoseData) => void
) => {
  const frameProcessingRef = useRef<boolean>(false)
  const animationFrameRef = useRef<number>()
  const lastPoseRef = useRef<PoseData | null>(null)

  useEffect(() => {
    if (!videoRef.current) return

    const processFrame = async () => {
      if (!videoRef.current || frameProcessingRef.current) return

      try {
        frameProcessingRef.current = true
        const pose = await PoseDetectionService.detectPose(videoRef.current)
        
        // Apply interpolation if we have a previous pose
        if (lastPoseRef.current && pose.landmarks) {
          const interpolatedPose = interpolatePoses(lastPoseRef.current, pose, 0.3)
          lastPoseRef.current = interpolatedPose
          onPoseDetected(interpolatedPose)
        } else {
          lastPoseRef.current = pose
          onPoseDetected(pose)
        }
      } catch (error) {
        console.error('Error in pose detection:', error)
      } finally {
        frameProcessingRef.current = false
        animationFrameRef.current = requestAnimationFrame(processFrame)
      }
    }

    // Start processing frames
    animationFrameRef.current = requestAnimationFrame(processFrame)

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [videoRef, onPoseDetected])

  return null
}

// Helper function to interpolate between poses for smoother transitions
const interpolatePoses = (pose1: PoseData, pose2: PoseData, t: number) => {
  if (!pose1.landmarks || !pose2.landmarks) return pose2

  const interpolatedLandmarks = pose1.landmarks.map((l1, i) => {
    const l2 = pose2.landmarks![i]
    return {
      x: l1.x * (1 - t) + l2.x * t,
      y: l1.y * (1 - t) + l2.y * t,
      z: l1.z * (1 - t) + l2.z * t,
      visibility: Math.max(l1.visibility || 0, l2.visibility || 0)
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