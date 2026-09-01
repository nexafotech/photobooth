const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const TEMPLATE_PATH = path.resolve(__dirname, '..', 'temp 2.jpeg');

// The region inside the template where the uploaded photo should be placed
// Based on the exact pixel boundaries of the dark image in temp 2.jpeg (1600x900)
const PHOTO_REGION = {
  left: 413,
  top: 276,
  width: 765,
  height: 343,
};

/**
 * Composites the uploaded photo onto the template image.
 * Returns a Buffer of the final JPEG.
 *
 * @param {string} uploadedPhotoPath - Absolute path to the uploaded photo
 * @param {string} studentName - Student name (for potential text overlay, unused for now)
 * @returns {Promise<Buffer>} The composited image as a JPEG buffer
 */
async function compositeOnTemplate(uploadedPhotoPath) {
  // 1. Resize the uploaded photo to fit the region (cover mode — fills the area, cropping excess)
  const resizedPhoto = await sharp(uploadedPhotoPath)
    .resize(PHOTO_REGION.width, PHOTO_REGION.height, { fit: 'cover' })
    .toBuffer();

  // 2. Load the template and composite the resized photo onto it
  const result = await sharp(TEMPLATE_PATH)
    .composite([
      {
        input: resizedPhoto,
        left: PHOTO_REGION.left,
        top: PHOTO_REGION.top,
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}

/**
 * Composites and saves the edited image to disk.
 *
 * @param {string} uploadedPhotoPath - Absolute path to the uploaded photo
 * @param {string} outputPath - Where to save the composited image
 * @returns {Promise<void>}
 */
async function compositeAndSave(uploadedPhotoPath, outputPath) {
  const buffer = await compositeOnTemplate(uploadedPhotoPath);
  fs.writeFileSync(outputPath, buffer);
}

module.exports = { compositeOnTemplate, compositeAndSave };
