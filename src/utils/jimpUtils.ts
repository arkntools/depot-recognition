import Jimp from './jimp';

export const jimp2base64 = (img: Jimp) => {
  return img.getBase64Async(Jimp.MIME_PNG);
};

const GAUSS_CORE = [
  [2 / 159, 4 / 159, 5 / 159, 4 / 159, 2 / 159],
  [4 / 159, 9 / 159, 12 / 159, 9 / 159, 4 / 159],
  [5 / 159, 12 / 159, 15 / 159, 12 / 159, 5 / 159],
  [4 / 159, 9 / 159, 12 / 159, 9 / 159, 4 / 159],
  [2 / 159, 4 / 159, 5 / 159, 4 / 159, 2 / 159],
];

export const jimpGaussBlur = (img: Jimp) => img.convolution(GAUSS_CORE);
