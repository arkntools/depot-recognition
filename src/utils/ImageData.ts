class ImageDataPolyfill {
  constructor(
    public readonly data: Uint8ClampedArray,
    public readonly width: number,
    public readonly height: number,
  ) {}
}

export default typeof ImageData === 'undefined'
  ? (ImageDataPolyfill as any as new () => ImageData)
  : ImageData;
