"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ChartData {
  label: string
  value: number
  color?: string
}

interface LineChartProps {
  data: ChartData[]
  height?: number
  className?: string
}

interface BarChartProps {
  data: ChartData[]
  height?: number
  className?: string
}

interface DonutChartProps {
  data: ChartData[]
  size?: number
  className?: string
}

// Simple Line Chart Component
const LineChart = React.forwardRef<HTMLDivElement, LineChartProps>(
  ({ data, height = 200, className }, ref) => {
    const maxValue = Math.max(...data.map(d => d.value))
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - (item.value / maxValue) * 80
      return `${x},${y}`
    }).join(' ')

    return (
      <div ref={ref} className={cn("w-full", className)}>
        <svg width="100%" height={height} viewBox="0 0 100 100" className="overflow-visible">
          <polyline
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            points={points}
            className="drop-shadow-sm"
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100
            const y = 100 - (item.value / maxValue) * 80
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="hsl(var(--primary))"
                className="drop-shadow-sm"
              />
            )
          })}
        </svg>
      </div>
    )
  }
)
LineChart.displayName = "LineChart"

// Simple Bar Chart Component
const BarChart = React.forwardRef<HTMLDivElement, BarChartProps>(
  ({ data, height = 200, className }, ref) => {
    const maxValue = Math.max(...data.map(d => d.value))
    const barWidth = 80 / data.length

    return (
      <div ref={ref} className={cn("w-full", className)}>
        <svg width="100%" height={height} viewBox="0 0 100 100">
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * 80
            const x = 10 + (index * barWidth)
            const y = 90 - barHeight
            
            return (
              <rect
                key={index}
                x={x}
                y={y}
                width={barWidth * 0.8}
                height={barHeight}
                fill={item.color || "hsl(var(--primary))"}
                className="drop-shadow-sm"
                rx="1"
              />
            )
          })}
        </svg>
      </div>
    )
  }
)
BarChart.displayName = "BarChart"

// Simple Donut Chart Component
const DonutChart = React.forwardRef<HTMLDivElement, DonutChartProps>(
  ({ data, size = 120, className }, ref) => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    let currentAngle = 0
    const radius = 40
    const strokeWidth = 8
    const center = 50

    return (
      <div ref={ref} className={cn("flex items-center justify-center", className)}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          {data.map((item, index) => {
            const percentage = item.value / total
            const strokeDasharray = `${percentage * 251.2} 251.2`
            const strokeDashoffset = -currentAngle * 251.2 / 360
            currentAngle += percentage * 360

            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color || `hsl(${index * 137.5 % 360}, 70%, 50%)`}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(-90 ${center} ${center})`}
                className="transition-all duration-300"
              />
            )
          })}
        </svg>
      </div>
    )
  }
)
DonutChart.displayName = "DonutChart"

export { LineChart, BarChart, DonutChart }
