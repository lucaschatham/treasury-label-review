// Experimental browser preprocessing. Not imported by the application.
// Bicubic coordinates and 22-bit coefficient quantization match Pillow 12.3.0:
// https://github.com/python-pillow/Pillow/blob/12.3.0/src/libImaging/Resample.c
const precision = 2 ** 22;
function cubic(distance) {
  const x = Math.abs(distance);
  if (x < 1) return (1.5 * x - 2.5) * x * x + 1;
  if (x < 2) return -0.5 * (((x - 5) * x + 8) * x - 4);
  return 0;
}
function coefficients(input, output) {
  const ratio = input / output, stretch = Math.max(1, ratio);
  return Array.from({length: output}, (_, position) => {
    const center = (position + 0.5) * ratio;
    const first = Math.max(0, Math.trunc(center - 2 * stretch + 0.5));
    const last = Math.min(input, Math.trunc(center + 2 * stretch + 0.5));
    const values = Array.from({length: last - first}, (_, offset) => cubic((first + offset - center + 0.5) / stretch));
    const total = values.reduce((sum, value) => sum + value, 0);
    return {first, weights: values.map(value => {
      const normalized = total ? value / total : value;
      return Math.trunc(normalized * precision + (normalized < 0 ? -0.5 : 0.5));
    })};
  });
}
const byte = value => Math.min(255, Math.max(0, Math.floor(value / precision)));
export function resizeRGB(image, width, height) {
  if (![image.width, image.height, width, height].every(value => Number.isInteger(value) && value > 0) || image.data.length !== image.width * image.height * 3) throw new TypeError('Valid RGB dimensions required');
  const horizontal = coefficients(image.width, width), vertical = coefficients(image.height, height);
  const intermediate = new Uint8Array(width * image.height * 3);
  for (let y = 0; y < image.height; y++) for (let x = 0; x < width; x++) for (let channel = 0; channel < 3; channel++) {
    const {first, weights} = horizontal[x];
    let sum = precision / 2;
    for (let offset = 0; offset < weights.length; offset++) sum += image.data[(y * image.width + first + offset) * 3 + channel] * weights[offset];
    intermediate[(y * width + x) * 3 + channel] = byte(sum);
  }
  const data = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) for (let channel = 0; channel < 3; channel++) {
    const {first, weights} = vertical[y];
    let sum = precision / 2;
    for (let offset = 0; offset < weights.length; offset++) sum += intermediate[((first + offset) * width + x) * 3 + channel] * weights[offset];
    data[(y * width + x) * 3 + channel] = byte(sum);
  }
  return {width, height, data};
}
