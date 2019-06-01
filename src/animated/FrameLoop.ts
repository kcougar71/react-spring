import { Animated } from './Animated'
import { Controller } from './Controller'
import { now, requestAnimationFrame, manualFrameloop } from './Globals'

let active = false
const controllers = new Set()

const update = () => {
  if (!active) return false
  let time = now()
  for (let controller of controllers) {
    let isActive = false

    // Number of updated animations
    let updateCount = 0

    for (
      let configIdx = 0;
      configIdx < controller.configs.length;
      configIdx++
    ) {
      let config = controller.configs[configIdx]
      let endOfAnimation
      for (let valIdx = 0; valIdx < config.animatedValues.length; valIdx++) {
        let animated = config.animatedValues[valIdx]
        if (animated.done) continue
        updateCount++

        let to = config.toValues[valIdx]
        let isAttached = to instanceof Animated
        if (isAttached) to = to.getValue()

        // Jump to end value for immediate animations
        if (config.immediate) {
          animated.setValue(to)
          animated.done = true
          continue
        }

        const from = config.fromValues[valIdx]

        // Break animation when string values are involved
        if (typeof from === 'string' || typeof to === 'string') {
          animated.setValue(to)
          animated.done = true
          continue
        }

        let position = animated.lastPosition
        let velocity = Array.isArray(config.initialVelocity)
          ? config.initialVelocity[valIdx]
          : config.initialVelocity

        // Duration easing
        if (config.duration !== void 0) {
          position =
            from +
            config.easing((time - animated.startTime) / config.duration) *
              (to - from)

          endOfAnimation = time >= animated.startTime + config.duration
        }
        // Decay easing
        else if (config.decay) {
          const decay = config.decay === true ? 0.998 : config.decay
          position =
            from +
            (velocity / (1 - decay)) *
              (1 - Math.exp(-(1 - decay) * (time - animated.startTime)))

          endOfAnimation = Math.abs(animated.lastPosition - position) < 0.1
          if (endOfAnimation) to = position
        }
        // Spring easing
        else {
          let lastTime = animated.lastTime !== void 0 ? animated.lastTime : time
          if (animated.lastVelocity !== void 0) {
            velocity = animated.lastVelocity
          }

          // If we lost a lot of frames just jump to the end.
          if (time > lastTime + 64) lastTime = time
          // http://gafferongames.com/game-physics/fix-your-timestep/
          let numSteps = Math.floor(time - lastTime)
          for (let i = 0; i < numSteps; ++i) {
            let force = -config.tension * (position - to)
            let damping = -config.friction * velocity
            let acceleration = (force + damping) / config.mass
            velocity = velocity + (acceleration * 1) / 1000
            position = position + (velocity * 1) / 1000
          }

          animated.lastTime = time
          animated.lastVelocity = velocity

          // Conditions for stopping the spring animation
          const isOvershooting =
            config.clamp && config.tension !== 0
              ? from < to
                ? position > to
                : position < to
              : false
          const isVelocity = Math.abs(velocity) <= config.precision
          const isDisplacement =
            config.tension !== 0
              ? Math.abs(to - position) <= config.precision
              : true

          endOfAnimation = isOvershooting || (isVelocity && isDisplacement)
        }

        // Trails aren't done until their parents conclude
        if (isAttached && !config.toValues[valIdx].done) {
          endOfAnimation = false
        }

        if (endOfAnimation) {
          // Ensure that we end up with a round value
          if (animated.value !== to) position = to
          animated.done = true
        } else {
          isActive = true
        }

        animated.setValue(position)
        animated.lastPosition = position
      }

      // Keep track of updated values only when necessary
      if (controller.props.onFrame) {
        controller.values[config.key] = config.animated.getValue()
      }
    }

    controller.onFrame(isActive, updateCount)
  }

  // Loop over as long as there are controllers ...
  if (controllers.size) {
    if (manualFrameloop) manualFrameloop()
    else requestAnimationFrame!(update)
  } else {
    active = false
  }
  return active
}

const start = (controller: Controller) => {
  controllers.add(controller)
  if (!active) {
    active = true
    if (manualFrameloop) manualFrameloop()
    else requestAnimationFrame!(update)
  }
}

const stop = (controller: Controller) => {
  controllers.delete(controller)
}

export { start, stop, update }
