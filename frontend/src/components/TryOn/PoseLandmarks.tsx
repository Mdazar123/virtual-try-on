import React from 'react'
import { Landmark } from '@/types/clothing'

interface PoseLandmarksProps {
  landmarks: Landmark[]
}

export const PoseLandmarks: React.FC<PoseLandmarksProps> = ({ landmarks }) => {
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