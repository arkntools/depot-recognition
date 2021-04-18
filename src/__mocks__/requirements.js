import _ from 'lodash';
import * as ss from 'simple-statistics';
import JSZip from 'jszip';
import OCRAD from '@arkntools/scripts/dist/ocrad';
import Jimp from 'jimp';

Jimp.prototype.toBase64 = function () {
  return this.getBase64Async(Jimp.AUTO);
};

class ImageData {
  constructor(data, width, height) {
    Object.defineProperties(this, {
      data: { value: data },
      width: { value: width },
      height: { value: height },
    });
  }
}

Object.assign(global, {
  _,
  ss,
  JSZip,
  OCRAD,
  Jimp,
  ImageData,
});
