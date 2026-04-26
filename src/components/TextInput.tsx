'use client'

interface TextInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function TextInput({ value, onChange, disabled }: TextInputProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={`請貼上或輸入食品成分文字，例如：\n\n砂糖、小麥粉、植物油、奶粉、可可粉、乳化劑（大豆卵磷脂）、香料、食鹽`}
      className="w-full p-4 sm:p-5 rounded-2xl resize-none text-sm sm:text-base transition-all duration-200 border disabled:opacity-40"
      style={{
        height: 'clamp(180px, 30vh, 280px)',
        borderColor: 'var(--color-border)',
        background: 'white',
        color: 'var(--color-charcoal)',
        boxShadow: 'var(--shadow-soft)',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-sage)'
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58, 107, 53, 0.1)'
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.boxShadow = 'var(--shadow-soft)'
      }}
    />
  )
}
