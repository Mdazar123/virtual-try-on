export class PoseDetectionService {
    private static API_URL = 'http://localhost:8000/api/pose';

    static async detectPose(videoElement: HTMLVideoElement): Promise<any> {
        try {
            // Create a canvas to capture the video frame
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                throw new Error('Could not get canvas context');
            }

            // Draw the current video frame to the canvas
            ctx.drawImage(videoElement, 0, 0);
            
            // Convert the canvas to base64
            const base64Image = canvas.toDataURL('image/jpeg', 0.8);

            // Send to backend
            const response = await fetch(`${this.API_URL}/estimate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    frame: base64Image
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get pose estimation');
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Pose detection failed');
            }

            return {
                landmarks: result.landmarks,
                worldLandmarks: result.world_landmarks
            };
        } catch (error) {
            console.error('Error in pose detection:', error);
            throw error;
        }
    }
} 