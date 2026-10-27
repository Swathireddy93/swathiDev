import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics, type BeforeSend } from '@vercel/analytics/react'
import App from './App'
import './theme/tokens.css'
import './theme/global.css'
import './theme/journey.css'

// Only send the public page address; referral/query tokens and fragments stay local.
const beforeSend: BeforeSend = event => {
  if (event.type !== 'pageview') return null
  const url = new URL(event.url)
  url.search = ''
  url.hash = ''
  url.username = ''
  url.password = ''
  return { ...event, url: url.toString() }
}

createRoot(document.getElementById('root')!).render(<StrictMode><App />{import.meta.env.PROD && <Analytics beforeSend={beforeSend} debug={false} />}</StrictMode>)
