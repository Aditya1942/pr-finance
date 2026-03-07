import { useEffect, useRef, useState } from 'react'

interface AnimatedCounterProps {
    value: number
    prefix?: string
    suffix?: string
    duration?: number
    decimals?: number
    className?: string
}

export default function AnimatedCounter({
    value,
    prefix = '',
    suffix = '',
    duration = 1200,
    decimals = 0,
    className = ''
}: AnimatedCounterProps) {
    const [display, setDisplay] = useState('0')
    const prevValue = useRef(0)
    const rafId = useRef<number>()

    useEffect(() => {
        const start = prevValue.current
        const end = value
        const startTime = performance.now()

        const animate = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = start + (end - start) * eased

            setDisplay(formatIndianNumber(current, decimals))

            if (progress < 1) {
                rafId.current = requestAnimationFrame(animate)
            } else {
                prevValue.current = end
            }
        }

        rafId.current = requestAnimationFrame(animate)
        return () => { if (rafId.current) cancelAnimationFrame(rafId.current) }
    }, [value, duration, decimals])

    return (
        <span className={className}>
            {prefix}{display}{suffix}
        </span>
    )
}

function formatIndianNumber(num: number, decimals: number): string {
    const fixed = Math.abs(num).toFixed(decimals)
    const [intPart, decPart] = fixed.split('.')
    const sign = num < 0 ? '-' : ''

    // Indian number formatting: last 3 digits, then groups of 2
    let formatted = ''
    const len = intPart.length
    if (len <= 3) {
        formatted = intPart
    } else {
        formatted = intPart.slice(-3)
        let remaining = intPart.slice(0, -3)
        while (remaining.length > 2) {
            formatted = remaining.slice(-2) + ',' + formatted
            remaining = remaining.slice(0, -2)
        }
        formatted = remaining + ',' + formatted
    }

    return sign + formatted + (decPart ? '.' + decPart : '')
}
