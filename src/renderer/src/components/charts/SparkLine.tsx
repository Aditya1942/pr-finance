import { useEffect, useRef } from 'react'

interface SparkLineProps {
    data: { label: string; value: number }[]
    height?: number
    color?: string
    fillColor?: string
}

export default function SparkLine({
    data,
    height = 80,
    color = '#6366f1',
    fillColor
}: SparkLineProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rafId = useRef<number>()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || data.length < 2) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)

        const w = rect.width
        const h = height
        const pad = 2

        const values = data.map(d => d.value)
        const min = Math.min(...values)
        const max = Math.max(...values)
        const range = max - min || 1

        const points: [number, number][] = data.map((_, i) => {
            const x = pad + (i / (data.length - 1)) * (w - pad * 2)
            const y = pad + (1 - (values[i] - min) / range) * (h - pad * 2)
            return [x, y]
        })

        const startTime = performance.now()
        const duration = 700

        const draw = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const visiblePoints = Math.floor(points.length * eased)

            ctx.clearRect(0, 0, w, h)

            if (visiblePoints < 2) {
                if (progress < 1) rafId.current = requestAnimationFrame(draw)
                return
            }

            const currentPoints = points.slice(0, visiblePoints)

            // Fill area
            if (fillColor) {
                const grad = ctx.createLinearGradient(0, 0, 0, h)
                grad.addColorStop(0, fillColor)
                grad.addColorStop(1, 'transparent')
                ctx.fillStyle = grad

                ctx.beginPath()
                ctx.moveTo(currentPoints[0][0], h)
                currentPoints.forEach(([x, y]) => ctx.lineTo(x, y))
                ctx.lineTo(currentPoints[currentPoints.length - 1][0], h)
                ctx.closePath()
                ctx.fill()
            }

            // Line
            ctx.beginPath()
            ctx.moveTo(currentPoints[0][0], currentPoints[0][1])
            for (let i = 1; i < currentPoints.length; i++) {
                const [px, py] = currentPoints[i - 1]
                const [cx, cy] = currentPoints[i]
                const cpx = (px + cx) / 2
                ctx.bezierCurveTo(cpx, py, cpx, cy, cx, cy)
            }
            ctx.strokeStyle = color
            ctx.lineWidth = 2.5
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.stroke()

            // End dot
            const last = currentPoints[currentPoints.length - 1]
            ctx.beginPath()
            ctx.arc(last[0], last[1], 4, 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.fill()
            ctx.beginPath()
            ctx.arc(last[0], last[1], 7, 0, Math.PI * 2)
            ctx.strokeStyle = color
            ctx.lineWidth = 1.5
            ctx.globalAlpha = 0.3
            ctx.stroke()
            ctx.globalAlpha = 1

            if (progress < 1) {
                rafId.current = requestAnimationFrame(draw)
            }
        }

        rafId.current = requestAnimationFrame(draw)
        return () => { if (rafId.current) cancelAnimationFrame(rafId.current) }
    }, [data, height, color, fillColor])

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: `${height}px`, display: 'block' }}
        />
    )
}
