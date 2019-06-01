export abstract class Animated<Payload = unknown> {
  public abstract getValue(): any
  public getAnimatedValue() {
    return this.getValue()
  }

  protected payload?: Payload
  public getPayload() {
    return this.payload || this
  }

  public attach(): void {}

  public detach(): void {}

  private children: Animated[] = []

  public getChildren() {
    return this.children
  }

  public addChild(child: Animated) {
    if (this.children.length === 0) this.attach()
    this.children.push(child)
  }

  public removeChild(child: Animated) {
    const index = this.children.indexOf(child)
    this.children.splice(index, 1)
    if (this.children.length === 0) this.detach()
  }
}

export abstract class AnimatedArray<
  Payload extends ReadonlyArray<any> = ReadonlyArray<unknown>
> extends Animated<Payload> {
  protected payload!: Payload

  public attach() {
    this.payload.forEach(p => p instanceof Animated && p.addChild(this))
  }

  public detach() {
    this.payload.forEach(p => p instanceof Animated && p.removeChild(this))
  }
}

export class AnimatedObject<
  Payload extends { [key: string]: unknown }
> extends Animated<Payload> {
  constructor(protected payload: Payload) {
    super()
  }

  public getValue(animated = false) {
    const payload: { [key: string]: any } = {}
    for (const key in this.payload) {
      const value = this.payload[key]
      if (animated && !(value instanceof Animated)) continue
      payload[key] =
        value instanceof Animated
          ? value[animated ? 'getAnimatedValue' : 'getValue']()
          : value
    }
    return payload
  }

  public getAnimatedValue() {
    return this.getValue(true)
  }

  public attach() {
    Object.values(this.payload).forEach(
      s => s instanceof Animated && s.addChild(this)
    )
  }

  public detach() {
    Object.values(this.payload).forEach(
      s => s instanceof Animated && s.removeChild(this)
    )
  }
}
