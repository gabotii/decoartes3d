interface QuantityInputProps {
  value: number
  max: number
  onChange: (value: number) => void
  label?: string
}

export function QuantityInput({ value, max, onChange, label = 'Cantidad' }: QuantityInputProps) {
  const clamp = (n: number) => Math.max(1, Math.min(max, Number.isFinite(n) ? Math.trunc(n) : 1))

  return (
    <div className="quantity" role="group" aria-label={label}>
      <button type="button" className="quantity__btn" onClick={() => onChange(clamp(value - 1))} disabled={value <= 1} aria-label="Quitar uno">
        −
      </button>
      <input
        className="quantity__input"
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(clamp(e.target.valueAsNumber))}
      />
      <button type="button" className="quantity__btn" onClick={() => onChange(clamp(value + 1))} disabled={value >= max} aria-label="Añadir uno">
        +
      </button>
    </div>
  )
}
