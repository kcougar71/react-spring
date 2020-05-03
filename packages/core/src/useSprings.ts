import { useMemo, useImperativeHandle, useState } from 'react'
import { useLayoutEffect } from 'react-layout-effect'
import {
  is,
  each,
  usePrev,
  useOnce,
  RefProp,
  UnknownProps,
  Merge,
} from 'shared'

import {
  SpringStopFn,
  SpringValues,
  SpringsUpdateFn,
  SpringHandle,
} from './types/spring'
import { PickAnimated } from './types/common'
import { UseSpringProps } from './useSpring'
import { Controller, ControllerProps } from './Controller'
import { getProps, useMemo as useMemoOne } from './helpers'

export type UseSpringsProps<Props extends object = any> = Merge<
  UseSpringProps<Props>,
  {
    ref?: RefProp<SpringHandle<PickAnimated<Props>>>
  }
>

/**
 * Animations are updated on re-render.
 */
export function useSprings<
  P extends object[],
  Props extends object = P[number]
>(
  length: number,
  props: P & UseSpringsProps<Props>[]
): SpringValues<PickAnimated<Props>>[]

/**
 * When the `deps` argument exists, you get the `update` and `stop` function.
 */
export function useSprings<
  P extends object[],
  Props extends object = P[number]
>(
  length: number,
  props: P & UseSpringsProps<Props>[],
  deps: any[] | undefined
): [
  SpringValues<PickAnimated<Props>>[],
  SpringsUpdateFn<PickAnimated<Props>>,
  SpringStopFn<UnknownProps>
]

/**
 * When the `deps` argument exists, the `props` function is called whenever
 * the `deps` change on re-render.
 *
 * Without the `deps` argument, the `props` function is only called once.
 */
export function useSprings<Props extends object>(
  length: number,
  props: (i: number, ctrl: Controller) => Props & UseSpringsProps<Props>,
  deps?: any[]
): [
  SpringValues<PickAnimated<Props>>[],
  SpringsUpdateFn<PickAnimated<Props>>,
  SpringStopFn<UnknownProps>
]

/** @internal */
export function useSprings(
  length: number,
  props: any[] | ((i: number, ctrl: Controller) => any),
  deps?: any[]
): any {
  const propsFn = is.fun(props) && props
  if (propsFn && !deps) deps = []

  // The "ref" prop is taken from the props of the first spring only.
  // The ref is assumed to *never* change after the first render.
  let ref: RefProp<SpringHandle> | undefined

  const [ctrls] = useState<Controller[]>([])
  const updates: ControllerProps[] = []
  const prevLength = usePrev(length) || 0

  // Create new controllers when "length" increases, and destroy
  // the affected controllers when "length" decreases.
  useMemoOne(() => {
    // Note: Length changes are unsafe in React concurrent mode.
    if (prevLength > length) {
      for (let i = length; i < prevLength; i++) {
        ctrls[i].dispose()
      }
    }
    ctrls.length = length
    getUpdates(prevLength, length)
  }, [length])

  // Update existing controllers when "deps" are changed.
  useMemoOne(() => {
    getUpdates(0, prevLength)
  }, deps)

  function getUpdates(startIndex: number, endIndex: number) {
    for (let i = startIndex; i < endIndex; i++) {
      const ctrl = ctrls[i] || (ctrls[i] = new Controller())
      const update: UseSpringProps<any> = propsFn
        ? propsFn(i, ctrl)
        : (props as any)[i]

      if (update) {
        update.default = true
        if (i == 0 && update.ref) {
          ref = update.ref
        }
        if (i < prevLength) {
          updates[i] = update
        } else {
          // Update new controllers immediately, so their
          // spring values exist during first render.
          ctrl.update(update)
        }
      }
    }
  }

  // Controllers are not updated until the commit phase.
  useLayoutEffect(() => {
    each(updates, (update, i) => ctrls[i].update(update))
    if (!ref) {
      each(ctrls, ctrl => ctrl.start())
    }
  })

  useOnce(() => () => {
    each(ctrls, ctrl => ctrl.dispose())
  })

  const api = useMemo(
    (): SpringHandle => ({
      get controllers() {
        return ctrls
      },
      update: props => {
        each(ctrls, (ctrl, i) => {
          ctrl.update(getProps(props, i, ctrl))
          if (!ref) ctrl.start()
        })
        return api
      },
      async start() {
        const results = await Promise.all(ctrls.map(ctrl => ctrl.start()))
        return {
          value: results.map(result => result.value),
          finished: results.every(result => result.finished),
        }
      },
      stop: keys => each(ctrls, ctrl => ctrl.stop(keys)),
      pause: keys => each(ctrls, ctrl => ctrl.pause(keys)),
      resume: keys => each(ctrls, ctrl => ctrl.resume(keys)),
    }),
    []
  )

  useImperativeHandle(ref, () => api)

  const values = ctrls.map(ctrl => ({ ...ctrl.springs }))
  return propsFn || arguments.length == 3
    ? [values, api.update, api.stop]
    : values
}
