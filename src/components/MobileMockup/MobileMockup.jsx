import React from 'react'
import './style.css'

// Inspired by https://linknode.vercel.app
const MobileMockup = () => {
  return (
    <div className="mobile__outline">
      <div className="volume volume-up"></div>
      <div className="volume volume-down"></div>
      <div className="switch" data-switch="off"></div>
      <div className="main-content">
        <p>Hello World</p>
      </div>
    </div>
  )
}

export default MobileMockup