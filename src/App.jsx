import React, { useEffect, useRef, useState } from 'react'

// Keep a default embedded avatar so the app runs without the public image.
// Replace MEMOJI_URL with "/memoji.png" after you add /public/memoji.png.
const DEFAULT_MEMOJI = `data:image/svg+xml;utf8,${encodeURIComponent(`<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='100%' height='100%' rx='100' fill='%23fff' /><g transform='translate(100 100)'><circle r='80' fill='%23fef2f2' /><g transform='translate(-30 -10)'><circle r='10' fill='%23000' cy='-10'/><circle r='10' fill='%23000' cx='40' cy='-10'/></g><path d='M50 80c-20-30-60-30-80 0' stroke='%23000' stroke-width='6' stroke-linecap='round' fill='none' /></g></svg>`)}
`
const MEMOJI_URL = '/memoji.png' // change to DEFAULT_MEMOJI if you want inline default

export default function App() {
  const [cursor, setCursor] = useState({ x: -100, y: -100 })
  const wrapRef = useRef(null)

  useEffect(() => {
    const onMove = (e) => setCursor({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className="container">
      <main className="hero">
        <div className="wave">👋 Hi, I'm AI Dev</div>
        <h1 className="title">AI Portfolio</h1>

        <div className="avatar">
          <img src={MEMOJI_URL} alt="memoji" style={{ width: '94%', height: '94%', borderRadius: '50%' }} onError={(e)=>{e.currentTarget.src = DEFAULT_MEMOJI}} />
        </div>

        <form className="search" onSubmit={(e)=>e.preventDefault()} role="search">
          <input placeholder="Search projects, skills, or blog..." aria-label="Search" />
          <button className="go" aria-label="Go">🔎</button>
        </form>

        <div className="navcards">
          <div className="card">Projects</div>
          <div className="card">About</div>
          <div className="card">Blog</div>
          <div className="card">Contact</div>
        </div>
      </main>

      <div className="rainbow-wrap" ref={wrapRef} aria-hidden>
        <div className="blob r1" style={{ left: cursor.x, top: cursor.y }} />
        <div className="blob r2" style={{ left: cursor.x + 40, top: cursor.y + 20 }} />
        <div className="blob r3" style={{ left: cursor.x + 90, top: cursor.y + 40 }} />
      </div>

      <div className="watermark">AI-Portfolio</div>
    </div>
  )
}
