declare module '@mediapipe/pose' {
  export class Pose {
    constructor(config?: { locateFile?: (file: string) => string })
    initialize(): Promise<void>
    setOptions(options: any): void
    onResults(callback: (results: any) => void): void
    send(config: { image: HTMLVideoElement }): Promise<void>
    close(): void
  }
}

declare module '@mediapipe/camera_utils' {
  export class Camera {
    constructor(
      videoElement: HTMLVideoElement,
      config: {
        onFrame: () => Promise<void>
        width: number
        height: number
      }
    )
    start(): Promise<void>
    stop(): void
  }
} 