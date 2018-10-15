import AnimatedWithChildren from './AnimatedWithChildren'
import AnimatedInterpolation from './AnimatedInterpolation'

var _uniqueId = 0

/**
 * Animated works by building a directed acyclic graph of dependencies
 * transparently when you render your Animated components.
 *
 *               new Animated.Value(0)
 *     .interpolate()        .interpolate()    new Animated.Value(1)
 *         opacity               translateY      scale
 *          style                         transform
 *         View#234                         style
 *                                         View#123
 *
 * A) Top Down phase
 * When an Animated.Value is updated, we recursively go down through this
 * graph in order to find leaf nodes: the views that we flag as needing
 * an update.
 *
 * B) Bottom Up phase
 * When a view is flagged as needing an update, we recursively go back up
 * in order to build the new value that it needs. The reason why we need
 * this two-phases process is to deal with composite props such as
 * transform which can receive values from multiple parents.
 */

function findAnimatedStyles(node, styles) {
  if (typeof node.update === 'function') styles.add(node)
  else node.__getChildren().forEach(child => findAnimatedStyles(child, styles))
}

/**
 * Standard value for driving animations.  One `Animated.Value` can drive
 * multiple properties in a synchronized fashion, but can only be driven by one
 * mechanism at a time.  Using a new mechanism (e.g. starting a new animation,
 * or calling `setValue`) will stop any previous ones.
 */
export default class AnimatedValue extends AnimatedWithChildren {
  constructor(value) {
    super()
    this._value = value
    this._animatedStyles = new Set()
    this._listeners = {}
    this._cache = {}
    this._done = false
  }

  __detach() {
    this._detached = true
  }

  __getValue() {
    return this._value
  }

  _update() {
    findAnimatedStyles(this, this._animatedStyles)
  }

  _flush() {
    if (this._animatedStyles.size === 0) this._update()
    this._animatedStyles.forEach(animatedStyle => animatedStyle.update())
  }

  _updateValue = value => {
    this._value = value
    this._flush()
    for (let key in this._listeners) this._listeners[key]({ value })
  }

  /**
   * Directly set the value.  This will stop any animations running on the value
   * and update all the bound properties.
   */
  setValue(value) {
    this._animatedStyles.clear()
    this._updateValue(value)
  }

  /**
   * Interpolates the value before updating the property, e.g. mapping 0-1 to
   * 0-10.
   */
  interpolate(config) {
    return new AnimatedInterpolation(this, config)
  }

  /**
   * Adds an asynchronous listener to the value so you can observe updates from
   * animations.  This is useful because there is no way to
   * synchronously read the value because it might be driven natively.
   */
  addListener(callback) {
    var id = String(_uniqueId++)
    this._listeners[id] = callback
    return id
  }

  removeListener(id) {
    delete this._listeners[id]
  }

  removeAllListeners() {
    this._listeners = {}
  }
}
