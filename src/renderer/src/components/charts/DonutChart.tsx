import { useEffect, useRef } from 'react'

interface DonutChartProps {
    data: { name: string; value: number; color: string }[]
    size?: number
}

export default function DonutChart({ data, size = 200 }: DonutChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rafId = useRef<number>()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || data.length === 0) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        canvas.width = size * dpr
        canvas.height = size * dpr
        ctx.scale(dpr, dpr)

        const cx = size / 2
        const cy = size / 2
        const outerR = size / 2 - 4
        const innerR = outerR * 0.62

        const total = data.reduce((s, d) => s + d.value, 0)
        if (total === 0) return

        const startTime = performance.now()
        const duration = 900

        const draw = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)

            ctx.clearRect(0, 0, size, size)

            // Background ring
            const isDark = document.documentElement.classList.contains('dark')
            ctx.beginPath()
            ctx.arc(cx, cy, outerR, 0, Math.PI * 2)
            ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true)
            ctx.fillStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
            ctx.fill()

            let angle = -Math.PI / 2
            const totalAngle = Math.PI * 2 * eased

            data.forEach((item) => {
                const sliceAngle = (item.value / total) * totalAngle
                if (sliceAngle < 0.001) return

                ctx.beginPath()
                ctx.arc(cx, cy, outerR, angle, angle + sliceAngle)
                ctx.arc(cx, cy, innerR, angle + sliceAngle, angle, true)
                ctx.closePath()
                ctx.fillStyle = item.color
                ctx.fill()

                // Gap lines
                ctx.beginPath()
                ctx.arc(cx, cy, outerR, angle, angle + sliceAngle)
                ctx.arc(cx, cy, innerR, angle + sliceAngle, angle, true)
                ctx.closePath()
                ctx.strokeStyle = isDark ? '#111827' : '#ffffff'
                ctx.lineWidth = 2
                ctx.stroke()

                angle += sliceAngle
            })

            // Center text
            if (progress > 0.5) {
                const textOpacity = Math.min((progress - 0.5) * 4, 1)
                ctx.globalAlpha = textOpacity
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a'
                ctx.font = '600 12px Outfit, sans-serif'
                ctx.fillText('TOTAL', cx, cy - 10)
                ctx.font = '700 18px JetBrains Mono, monospace'
                ctx.fillText(formatShort(total), cx, cy + 12)
                ctx.globalAlpha = 1
            }

            if (progress < 1) {
                rafId.current = requestAnimationFrame(draw)
            }
        }

        rafId.current = requestAnimationFrame(draw)
        return () => { if (rafId.current) cancelAnimationFrame(rafId.current) }
    }, [data, size])

    return (
        <canvas
            ref={canvasRef}
            style={{ width: `${size}px`, height: `${size}px`, display: 'block', margin: '0 auto' }}
        />
    )
}

function formatShort(n: number): string {
    if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L'
    if (n >= 1000) return '₹' + (n / 1000).toFixed(0) + 'K'
    return '₹' + n.toFixed(0)
}
