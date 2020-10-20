'use strict';
const _ = require('lodash');

/*
  if a pixel has grey scale value < GREY_SCALE_LIMIT, that pixel will be turned into a black pixel
  old value = 140, maximum is 255
 */
const GREY_SCALE_LIMIT = 230;

function makeHeader(w, h) {
  return [0x1d, 0x76, 0x30, 48, (w >> 3) & 0xff, 0x00, h & 0xff, (h >> 8) & 0xff];
}

module.exports = {png, pngCompress}

function pngCompress(img, append, maxHeight = 50) {
  const width = img.width < 560 ? img.width : 560;
  console.time('pngCompress');
  let height = img.height;

  let step = 1;
  //const maxHeight = 50;
  while (true) {
    let _height, begin;
    if (step * maxHeight > height) {
      _height = height;
      begin = (step - 1) * maxHeight;
    } else {
      _height = step * maxHeight - 1;
      begin = (step - 1) * maxHeight;
    }

    if (begin === 0) begin = 1;

    // 1D 57 nL nH
    const arr = [];
    if (step === 1) arr.unshift(0x1b, 0x40);

    let grayscale;
    const _arr = [];

    let whiteLines = 0;
    let normalLines = 0;
    let maxLeft = width;
    let minRight = 0;

    for (let i = begin; i < _height; i++) {
      const line = [];
      let white = true;
      let left = 0;
      let fixLeft = false;
      let right = 0;

      for (let j = 0; j < width / 8; j++) {
        let byte = 0x0;
        for (let k = 0; k < 8; k++) {
          let idx = (img.width * i + j * 8 + k) << 2;
          grayscale = 0.2126 * img.data[idx] + 0.7152 * img.data[idx + 1] + 0.0722 * img.data[idx + 2];
          if (grayscale < GREY_SCALE_LIMIT) byte |= 1 << 7 - k;
        }
        line.push(byte);
        if (byte !== 0) white = false;


        if (!fixLeft && byte === 0) {
          left++;
        } else if (byte !== 0 && !fixLeft) {
          fixLeft = true;
        }

        if (byte !== 0) {
          right = j;
        }

      }

      if (white || (i === _height - 1 && !white)) {
        whiteLines++;
        if (normalLines > 0) {
          minRight++;
          const temp = _arr.map(line => _.slice(line, maxLeft, minRight));
          arr.push(0x1d, 0x4c, maxLeft * 8 % 256, parseInt(maxLeft / 32));
          arr.push(...makeHeader((minRight - maxLeft) * 8, normalLines));
          arr.push(..._.flatten(temp));
          _arr.length = 0;
          normalLines = 0;
          maxLeft = width;
          minRight = 0;
        }
      }

      if (!white || (i === _height - 1 && white)) {
        if (maxLeft > left) {
          maxLeft = left;
        }
        if (minRight < right) minRight = right;

        if (whiteLines > 0) {
          arr.push(...makeHeader(8, whiteLines));
          arr.push(..._.fill(Array(whiteLines), 0));
          whiteLines = 0;
        } else {
          normalLines++;
          _arr.push(line);
        }
      }
    }

    const imageBuffer = new Buffer(arr);
    // append data
    append(imageBuffer);

    if (step * maxHeight > height) break;
    step++;
  }
  console.timeEnd('pngCompress');
}

function png(img, append) {
  const width = img.width < 560 ? img.width : 560;
  let height = img.height;

  let step = 1;
  const maxHeight = 2000;
  while (true) {
    let _height, begin;
    if (step * maxHeight > height) {
      _height = height;
      begin = (step - 1) * maxHeight;
    } else {
      _height = step * maxHeight - 1;
      begin = (step - 1) * maxHeight;
    }

    if (begin === 0) begin = 1;

    if ((_height - begin) % 96 === 0) _height = _height - 1;

    // reset, set density, print raster image
    // 0x1b, 0x3f, 0x0a, 0x00
    //0x1b, 0x40
    //01 4A n

    const arr = [0x1d, 0x76, 0x30, 48, (width >> 3) & 0xff, 0x00, (_height - begin) & 0xff, ((_height - begin) >> 8) & 0xff];
    if (step === 1) arr.unshift(0x1b, 0x40);
    let grayscale;

    for (let i = begin; i < _height; i++) {
      for (let j = 0; j < width / 8; j++) {
        let byte = 0x0;
        for (let k = 0; k < 8; k++) {
          let idx = (img.width * i + j * 8 + k) << 2;
          grayscale = 0.2126 * img.data[idx] + 0.7152 * img.data[idx + 1] + 0.0722 * img.data[idx + 2];
          if (grayscale < GREY_SCALE_LIMIT) byte |= 1 << 7 - k;
        }

        arr.push(byte);
      }
    }

    const imageBuffer = new Buffer(arr);
    // append data
    append(imageBuffer);

    if (step * maxHeight > height) break;
    step++;
  }
}
