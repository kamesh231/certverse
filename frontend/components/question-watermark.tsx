"use client"

interface QuestionWatermarkProps {
  email: string
  date: string
}

/**
 * Visible watermark component
 * Displays user email and date subtly at bottom-right of question card
 */
export function QuestionWatermark({ email, date }: QuestionWatermarkProps) {
  // Obfuscate email: show first 3 chars + domain
  const obfuscateEmail = (email: string): string => {
    const [localPart, domain] = email.split('@')
    if (!domain) return email
    
    const visiblePart = localPart.length > 3 ? localPart.slice(0, 3) + '***' : localPart
    return `${visiblePart}@${domain}`
  }

  const obfuscatedEmail = obfuscateEmail(email)

  return (
    <div 
      className="absolute bottom-2 right-3 text-xs text-muted-foreground opacity-30 select-none pointer-events-none font-mono"
      style={{
        fontSize: '0.7rem',
        lineHeight: '1',
      }}
      title={`${email} • ${date}`}
    >
      {obfuscatedEmail} • {date}
    </div>
  )
}

