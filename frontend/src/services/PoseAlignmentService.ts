import * as THREE from 'three'
import { PoseData } from '@/types/clothing'

export class PoseAlignmentService {
  async initialize() {
    return this
  }

  public calculateClothAlignment(landmarks: PoseData['landmarks'], modelDimensions: THREE.Vector3) {
    try {
      if (!landmarks) {
        throw new Error('No landmarks provided')
      }

      // Get key body points
      const shoulders = {
        left: landmarks[11],
        right: landmarks[12]
      }
      
      const chest = landmarks[23]
      const waist = {
        left: landmarks[23],
        right: landmarks[24]
      }

      // Calculate clothing measurements
      const shoulderWidth = this.getDistance(shoulders.left, shoulders.right)
      const torsoLength = this.getDistance(
        this.getMidpoint(shoulders.left, shoulders.right),
        this.getMidpoint(waist.left, waist.right)
      )

      // Calculate rotation based on shoulder angle
      const shoulderAngle = Math.atan2(
        shoulders.right.y - shoulders.left.y,
        shoulders.right.x - shoulders.left.x
      )

      // Calculate scale based on body proportions
      const scale = new THREE.Vector3(
        shoulderWidth / modelDimensions.x,
        torsoLength / modelDimensions.y,
        (shoulderWidth * 0.5) / modelDimensions.z
      )

      // Calculate position to align with body
      const position = new THREE.Vector3(
        chest.x,
        chest.y,
        -Math.abs(shoulders.left.z - shoulders.right.z) / 2
      )

      // Apply rotation
      const rotation = new THREE.Euler(0, Math.PI + shoulderAngle, 0)

      return { scale, position, rotation }
    } catch (error) {
      console.error('Error calculating alignment:', error)
      return {
        scale: new THREE.Vector3(1, 1, 1),
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, Math.PI, 0)
      }
    }
  }

  private getDistance(point1: any, point2: any) {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) +
      Math.pow(point2.y - point1.y, 2)
    )
  }

  private getMidpoint(point1: any, point2: any) {
    return {
      x: (point1.x + point2.x) / 2,
      y: (point1.y + point2.y) / 2
    }
  }

  private calculateClothPosition(shoulders: any, hips: any) {
    const midShoulders = this.getMidpoint(shoulders.left, shoulders.right)
    const midHips = this.getMidpoint(hips.left, hips.right)

    return new THREE.Vector3(
      midShoulders.x,
      (midShoulders.y + midHips.y) / 2,
      0
    )
  }

  private calculateClothRotation(shoulders: any) {
    const angle = Math.atan2(
      shoulders.right.position.y - shoulders.left.position.y,
      shoulders.right.position.x - shoulders.left.position.x
    )

    return new THREE.Euler(0, angle, 0)
  }
} 