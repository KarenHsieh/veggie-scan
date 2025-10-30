import './globals.css'

export const metadata = {
  title: 'VeggieScan | 素食掃描識別器',
  description: '讓素食者與關心成分的人，在任何國家都能安心購物',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}
