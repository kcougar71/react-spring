// Inpired by: https://codepen.io/popmotion/pen/xWrbNm?editors=0010

import React from 'react'
import { useSpring, animated, interpolate, config } from 'react-spring/hooks'
import { useGesture } from 'react-with-gesture'
import './styles.css'

export default function Slider({ children }) {
  // See: https://github.com/drcmda/react-with-gesture
  // Gives access to: down, x, y, xDelta, yDelta, xInitial, yInitial
  const [handlers, { xDelta, down }] = useGesture()
  const [{ x, y, bg, pers, size }] = useSpring({
    x: down ? xDelta : 0,
    y: down ? -30 : 0,
    pers: `perspective(800px) rotateX(${down ? 45 : 0}deg)`,
    bg: `linear-gradient(120deg, ${
      xDelta < 0 ? '#f093fb 0%, #f5576c' : '#96fbc4 0%, #f9f586'
    } 100%)`,
    size: down ? 1.15 : 1,
    immediate: name => down && name === 'x',
  })
  const avSize = x.interpolate({
    map: Math.abs,
    range: [50, 300],
    output: ['scale(0.5)', 'scale(1)'],
    extrapolate: 'clamp',
  })
  return (
    <div className="slider-main">
      <animated.div
        {...handlers}
        className="item"
        style={{ background: bg, transform: pers }}>
        <animated.div
          className="av"
          style={{
            transform: avSize,
            justifySelf: xDelta < 0 ? 'end' : 'start',
          }}
        />
        <animated.div
          className="fg"
          style={{
            transform: interpolate(
              [x, y, size],
              (x, y, s) => `translate3d(${x}px,${y}px,0) scale(${s})`
            ),
          }}>
          <i>Slide</i>
        </animated.div>
      </animated.div>
    </div>
  )
}
