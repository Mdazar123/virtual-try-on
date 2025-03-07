import * as THREE from 'three'

export class AlignmentService {
  public calculateClothAlignment(landmarks: any[]) {
    try {
      const shoulders = {
        left: landmarks[11],
        right: landmarks[12]
      }
      const hips = {
        left: landmarks[23],
        right: landmarks[24]
      }

      // Calculate measurements
      const shoulderWidth = this.getDistance(shoulders.left, shoulders.right)
      const torsoLength = this.getDistance(
        this.getMidpoint(shoulders.left, shoulders.right),
        this.getMidpoint(hips.left, hips.right)
      )

      // Calculate transformations
      const scale = new THREE.Vector3(shoulderWidth, torsoLength, shoulderWidth)
      const position = this.calculatePosition(shoulders, hips)
      const rotation = this.calculateRotation(shoulders)

      return { scale, position, rotation }
    } catch (error) {
      console.error('Error calculating alignment:', error)
      return {
        scale: new THREE.Vector3(1, 1, 1),
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0)
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

  private calculatePosition(shoulders: any, hips: any) {
    const mid = this.getMidpoint(
      this.getMidpoint(shoulders.left, shoulders.right),
      this.getMidpoint(hips.left, hips.right)
    )
    return new THREE.Vector3(mid.x, mid.y, 0)
  }

  private calculateRotation(shoulders: any) {
    const angle = Math.atan2(
      shoulders.right.y - shoulders.left.y,
      shoulders.right.x - shoulders.left.x
    )
    return new THREE.Euler(0, 0, angle)
  }
} 