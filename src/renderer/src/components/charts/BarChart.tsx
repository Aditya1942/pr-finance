import { useEffect, useRef } from 'react'

export type BarChartVariant = 'both' | 'income' | 'expense' | 'savings'

interface BarChartProps {
    data: { label: string; income: number; expense: number }[]
    height?: number
    variant?: BarChartVariant
    currencySymbol?: string
}

export default function BarChart({ data, height = 260, variant = 'both', currencySymbol = '' }: BarChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animProgress = useRef(0)
    const rafId = useRef<number>()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || data.length === 0) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)

        const w = rect.width
        const h = height
        const padTop = 20
        const padBottom = 40
        const padLeft = 60
        const padRight = 20
        const chartW = w - padLeft - padRight
        const chartH = h - padTop - padBottom

        const values = variant === 'income'
            ? data.map(d => d.income)
            : variant === 'expense'
                ? data.map(d => d.expense)
                : variant === 'savings'
                    ? data.map(d => d.income - d.expense)
                    : data.flatMap(d => [d.income, d.expense])
        const savingsValues = variant === 'savings' ? data.map(d => d.income - d.expense) : []
        const maxAbsSavings = variant === 'savings' && savingsValues.length
            ? Math.max(...savingsValues.map(Math.abs), 1)
            : 0
        const maxVal = variant === 'savings' ? maxAbsSavings : Math.max(...values, 1)
        const barGroupWidth = chartW / data.length
        const barCount = variant === 'both' ? 2 : 1
        const barWidth = Math.min((barGroupWidth - 4) / barCount, 28)
        const gap = variant === 'both' ? 4 : 0

        const isDark = document.documentElement.classList.contains('dark')
        const textColor = isDark ? '#94a3b8' : '#64748b'
        const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'

        animProgress.current = 0
        const startTime = performance.now()
        const duration = 800

        const draw = (now: number) => {
            const elapsed = now - startTime
            animProgress.current = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - animProgress.current, 3)

            ctx.clearRect(0, 0, w, h)

            // Grid lines
            const gridLines = 5
            ctx.strokeStyle = gridColor
            ctx.lineWidth = 1
            ctx.font = '11px JetBrains Mono, monospace'
            ctx.fillStyle = textColor
            ctx.textAlign = 'right'
            ctx.textBaseline = 'middle'

            const isSavings = variant === 'savings'
            const baselineY = padTop + chartH / 2

            if (isSavings) {
                // Zero baseline
                ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
                ctx.lineWidth = 1.5
                ctx.beginPath()
                ctx.moveTo(padLeft, baselineY)
                ctx.lineTo(w - padRight, baselineY)
                ctx.stroke()
                ctx.strokeStyle = gridColor
                ctx.lineWidth = 1
                // Grid and labels: +maxVal at top, 0 at middle, -maxVal at bottom
                for (let i = 0; i <= gridLines; i++) {
                    const y = padTop + (chartH / gridLines) * i
                    ctx.beginPath()
                    ctx.moveTo(padLeft, y)
                    ctx.lineTo(w - padRight, y)
                    ctx.stroke()
                    const axisVal = maxVal - (maxVal * 2 / gridLines) * i
                    ctx.fillText(formatShort(axisVal, currencySymbol), padLeft - 8, y)
                }
            } else {
                for (let i = 0; i <= gridLines; i++) {
                    const y = padTop + (chartH / gridLines) * i
                    const val = maxVal - (maxVal / gridLines) * i
                    ctx.beginPath()
                    ctx.moveTo(padLeft, y)
                    ctx.lineTo(w - padRight, y)
                    ctx.stroke()
                    ctx.fillText(formatShort(val, currencySymbol), padLeft - 8, y)
                }
            }

            // Bars
            data.forEach((item, i) => {
                const cx = padLeft + barGroupWidth * i + barGroupWidth / 2

                if (variant === 'income' || variant === 'both') {
                    const incomeH = (item.income / maxVal) * chartH * eased
                    const incomeX = variant === 'both' ? cx - barWidth - gap / 2 : cx - barWidth / 2
                    const incomeY = padTop + chartH - incomeH
                    const incomeGrad = ctx.createLinearGradient(0, incomeY, 0, padTop + chartH)
                    incomeGrad.addColorStop(0, '#22c55e')
                    incomeGrad.addColorStop(1, '#10b981')
                    ctx.fillStyle = incomeGrad
                    roundRect(ctx, incomeX, incomeY, barWidth, incomeH, 4)
                }

                if (variant === 'expense' || variant === 'both') {
                    const expenseH = (item.expense / maxVal) * chartH * eased
                    const expenseX = variant === 'both' ? cx + gap / 2 : cx - barWidth / 2
                    const expenseY = padTop + chartH - expenseH
                    const expenseGrad = ctx.createLinearGradient(0, expenseY, 0, padTop + chartH)
                    expenseGrad.addColorStop(0, '#ef4444')
                    expenseGrad.addColorStop(1, '#f43f5e')
                    ctx.fillStyle = expenseGrad
                    roundRect(ctx, expenseX, expenseY, barWidth, expenseH, 4)
                }

                if (variant === 'savings') {
                    const savings = item.income - item.expense
                    const savingsAbsH = (Math.abs(savings) / maxVal) * (chartH / 2) * eased
                    const savingsX = cx - barWidth / 2
                    const savingsY = savings >= 0 ? baselineY - savingsAbsH : baselineY
                    const savingsGrad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH)
                    savingsGrad.addColorStop(0, savings >= 0 ? '#22c55e' : '#ef4444')
                    savingsGrad.addColorStop(1, savings >= 0 ? '#10b981' : '#f43f5e')
                    ctx.fillStyle = savingsGrad
                    roundRect(ctx, savingsX, savingsY, barWidth, savingsAbsH, 4)
                }

                // Month label
                ctx.fillStyle = textColor
                ctx.font = '11px Outfit, sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'top'
                ctx.fillText(item.label, cx, padTop + chartH + 12)
            })

            if (animProgress.current < 1) {
                rafId.current = requestAnimationFrame(draw)
            }
        }

        rafId.current = requestAnimationFrame(draw)
        return () => { if (rafId.current) cancelAnimationFrame(rafId.current) }
    }, [data, height, variant, currencySymbol])

    return (
        <div className="chart-card__canvas-wrap">
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: `${height}px`, display: 'block' }}
            />
            {(variant === 'both' || variant === 'income' || variant === 'expense' || variant === 'savings') && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px' }}>
                    {(variant === 'both' || variant === 'income') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e', display: 'inline-block' }} />
                            Income
                        </div>
                    )}
                    {(variant === 'both' || variant === 'expense') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} />
                            Expense
                        </div>
                    )}
                    {variant === 'savings' && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e', display: 'inline-block' }} />
                                Positive
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} />
                                Negative
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (h < 1) return
    r = Math.min(r, h / 2, w / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h)
    ctx.lineTo(x, y + h)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
    ctx.fill()
}

function formatShort(n: number, symbol: string): string {
    const s = symbol || ''
    const abs = Math.abs(n)
    const sign = n < 0 ? '-' : ''
    if (abs >= 100000) return sign + s + (abs / 100000).toFixed(1) + 'L'
    if (abs >= 1000) return sign + s + (abs / 1000).toFixed(1) + 'K'
    return sign + s + abs.toFixed(0)
}
