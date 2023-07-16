import Jimp from '../utils/jimp';

export const jimp2base64 = (img: Jimp) => {
  return img.getBase64Async(Jimp.MIME_PNG);
};
