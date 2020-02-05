import { is, RefProp, UnknownProps, Remap } from 'shared'

import {
  SpringValues,
  SpringsUpdateFn,
  SpringStopFn,
  SpringHandle,
} from '../types/spring'
import { PickAnimated, Valid } from '../types/common'
import { ControllerProps } from '../Controller'
import { useSprings } from './useSprings'

/**
 * The props that `useSpring` recognizes.
 */
export type UseSpringProps<Props extends object = any> = unknown &
  PickAnimated<Props> extends infer State
  ? Remap<
      ControllerProps<State> & {
        /**
         * Used to access the imperative API.
         *
         * Animations never auto-start when `ref` is defined.
         */
        ref?: RefProp<SpringHandle<State>>
      }
    >
  : never

/**
 * When the `deps` argument exists, the `props` function is called whenever
 * the `deps` change on re-render.
 *
 * Without the `deps` argument, the `props` function is only called once.
 */
export function useSpring<Props extends object>(
  props: () => (Props & Valid<Props, UseSpringProps<Props>>) | UseSpringProps,
  deps?: any[]
): [
  SpringValues<PickAnimated<Props>>,
  SpringsUpdateFn<PickAnimated<Props>>,
  SpringStopFn<UnknownProps>
]

/**
 * Animations are updated on re-render.
 */
export function useSpring<Props extends object>(
  props: (Props & Valid<Props, UseSpringProps<Props>>) | UseSpringProps
): SpringValues<PickAnimated<Props>>

/**
 * When the `deps` argument exists, you get the `update` and `stop` function.
 */
export function useSpring<Props extends object>(
  props: (Props & Valid<Props, UseSpringProps<Props>>) | UseSpringProps,
  deps: any[] | undefined
): [
  SpringValues<PickAnimated<Props>>,
  SpringsUpdateFn<PickAnimated<Props>>,
  SpringStopFn<UnknownProps>
]

/** @internal */
export function useSpring(props: any, deps?: any[]) {
  const isFn = is.fun(props)
  const [[values], update, stop] = useSprings(
    1,
    isFn ? props : [props],
    isFn ? deps || [] : deps
  )
  return isFn || arguments.length == 2
    ? ([values, update, stop] as const)
    : values
}
