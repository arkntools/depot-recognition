import Jimp from 'jimp';

Jimp.prototype.toBase64 = function () {
  return this.getBase64Async(Jimp.AUTO);
};
