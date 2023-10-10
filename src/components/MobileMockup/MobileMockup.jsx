import React from 'react'
import './style.css'

// Inspired by https://linknode.vercel.app
// May change importing a css file to using css-in-js later...
const MobileMockup = () => {
  return (
    <div className="mobile__outline">
      <div className="volume volume-up"></div>
      <div className="volume volume-down"></div>
      <div className="switch" data-switch="off"></div>
      <div className="main-content">
        <main>
          <span className="relative flex shrink-0 h-20 w-20 rounded-full overflow-hidden mx-auto">
            <img className="aspect-square h-full w-full object-cover" alt="Kexi Dang's profile picture" src="https://avatars.githubusercontent.com/kexiZeroing" />
          </span>
          <h3 className="text-2xl font-bold mt-4 text-slate-800">Kexi Dang</h3>
          <p className="text-sm mt-2 text-slate-600">Patient with yourself, be forgiving with yourself.</p>
        </main>
      </div>
    </div>
  )
}

export default MobileMockup