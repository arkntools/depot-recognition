import '@jimp/core';

declare module '@jimp/core' {
  interface Jimp {
    toBase64(): Promise<string>;
  }
}
