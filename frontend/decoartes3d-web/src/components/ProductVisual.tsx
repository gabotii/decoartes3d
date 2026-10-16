import { useId, useState } from 'react'

// Siluetas en un lienzo de 200×200 con la base apoyada en y≈170.
const SILHOUETTES = [
  // Jarrón
  'M78 40h44v10c0 8 18 22 18 56 0 34-16 64-40 64s-40-30-40-64c0-34 18-48 18-56z',
  // Esfera (lámpara)
  'M100 42a64 64 0 1 1 0 128a64 64 0 1 1 0-128z',
  // Prisma hexagonal
  'M100 38l58 33v66l-58 33-58-33V71z',
  // Arco
  'M40 170V98a60 60 0 0 1 120 0v72h-30V100a30 30 0 0 0-60 0v70z',
  // Busto / figura
  'M100 36c20 0 34 16 34 38 0 16-8 28-16 34 28 6 44 26 46 62H36c2-36 18-56 46-62-8-6-16-18-16-34 0-22 14-38 34-38z',
]

// Silueta según lo que es la pieza (por palabras de su slug); si no encaja ninguna, se elige por hash.
const SHAPE_KEYWORDS: [RegExp, number][] = [
  [/jarr|macet|florer/, 0],
  [/lampar|luna|esfer|globo/, 1],
  [/hexag|panel|pared|facet/, 2],
  [/arco|relieve|montan|portal/, 3],
  [/busto|figura|escultur|estatu/, 4],
]

function pickShape(seed: string, h: number): string {
  const match = SHAPE_KEYWORDS.find(([pattern]) => pattern.test(seed))
  return SILHOUETTES[match ? match[1] : h % SILHOUETTES.length]
}

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

interface ProductVisualProps {
  seed: string
  colorHex?: string | null
  className?: string
}

/**
 * Ilustración generada para productos sin foto: una silueta rellena de "capas de impresión".
 * Es determinista (mismo producto → misma imagen) para que el catálogo se vea coherente.
 */
export function ProductVisual({ seed, colorHex, className }: ProductVisualProps) {
  const id = useId().replace(/:/g, '')
  const h = hash(seed)
  const hue = colorHex ? null : (h % 360)
  const shape = pickShape(seed, h)
  const layerGap = 3 + (h % 3)

  const fill = colorHex ?? `hsl(${hue} 42% 58%)`
  const fillDark = colorHex ? `color-mix(in oklab, ${colorHex} 70%, #1f1b16)` : `hsl(${hue} 38% 44%)`
  const background = colorHex ? `color-mix(in oklab, ${colorHex} 18%, #f4efe6)` : `hsl(${hue} 30% 93%)`

  return (
    <svg className={className} viewBox="0 0 200 200" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id={`layers-${id}`} width="200" height={layerGap * 2} patternUnits="userSpaceOnUse">
          <rect width="200" height={layerGap} fill={fill} />
          <rect y={layerGap} width="200" height={layerGap} fill={fillDark} />
        </pattern>
        <linearGradient id={`light-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill={background} />
      <ellipse cx="100" cy="174" rx="62" ry="7" fill="#1f1b16" opacity="0.12" />
      <path d={shape} fill={`url(#layers-${id})`} />
      <path d={shape} fill={`url(#light-${id})`} />
    </svg>
  )
}

interface ProductImageProps {
  src: string | null
  alt: string
  seed: string
  colorHex?: string | null
  className?: string
}

/** Foto real si existe y carga; si no, la ilustración generada. */
export function ProductImage({ src, alt, seed, colorHex, className }: ProductImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) return <ProductVisual seed={seed} colorHex={colorHex} className={className} />

  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
}
