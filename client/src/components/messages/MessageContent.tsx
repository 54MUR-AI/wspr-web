import React from 'react'

const URL_REGEX = /(https?:\/\/[^\s<]+)/g

interface MessageContentProps {
  content: string
  className?: string
}

export default function MessageContent({ content, className = '' }: MessageContentProps) {
  const parts = content.split(URL_REGEX)

  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (URL_REGEX.test(part)) {
          // Reset regex lastIndex since we're reusing it
          URL_REGEX.lastIndex = 0
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-samurai-red hover:text-samurai-red-dark underline break-all"
            >
              {part}
            </a>
          )
        }
        return <React.Fragment key={i}>{part}</React.Fragment>
      })}
    </p>
  )
}
