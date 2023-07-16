import configure from '@jimp/custom';

import jpeg from '@jimp/jpeg';
import png from '@jimp/png';

import blit from '@jimp/plugin-blit';
import circle from '@jimp/plugin-circle';
import color from '@jimp/plugin-color';
import crop from '@jimp/plugin-crop';
import invert from '@jimp/plugin-invert';
import resize from '@jimp/plugin-resize';
import scale from '@jimp/plugin-scale';
import threshold from '@jimp/plugin-threshold';

const Jimp = configure({
  types: [jpeg, png],
  plugins: [blit, circle, color, crop, invert, resize, scale, threshold],
});

// eslint-disable-next-line @typescript-eslint/no-redeclare
declare type Jimp = InstanceType<typeof Jimp>;

export default Jimp;
