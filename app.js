const robot = require("robotjs");
const Tesseract = require('tesseract.js').create({
    langPath: "eng.traineddata",//if changed, also change in ocr function
    corePath: "tess-core.js"
});
const translate = require('google-translate-api');
const Jimp = require('jimp');

/**
 * Filters and converts the picture to a more suitable format
 * @param picture
 * @returns {Promise}
 */
function toPng(picture) {
    return new Promise((resolve, reject) => {
        try {
            new Jimp(picture.width, picture.height, function (err, img) {

                img.bitmap.data = picture.image;
                //needed for working with different resolutions
                img.scaleToFit(1920, 1080);
                //The place and size of the chat
                img.crop(660, 650, 550, 160);
                img.write("asdasd.png");
                //To make it easier for the ocr to detect text
                img.scan(0, 0, img.bitmap.width,
                    img.bitmap.height, filterUnwantedColors);
                img.write("asd.png");
                img.getBuffer(Jimp.MIME_JPEG, (err, png) => resolve(png));
            });
        } catch (e) {
            reject(e);
        }
    })
}

/**
 * Sets all almost white to complete white and the rest to black
 * @param x
 * @param y
 * @param idx
 */
function filterUnwantedColors(x, y, idx) {
    "use strict";
    // x, y is the position of this pixel on the image
    // idx is the position start position of this rgba tuple in the bitmap Buffer
    // this is the image

    const red = this.bitmap.data[idx];
    const green = this.bitmap.data[idx + 1];
    const blue = this.bitmap.data[idx + 2];
    const offset = 35;
    if (notInRange(offset, 200, red)
        || notInRange(offset, 233, green)
        || notInRange(offset, 249, blue)) {
        this.bitmap.data[idx] = 0;
        this.bitmap.data[idx + 1] = 0;
        this.bitmap.data[idx + 2] = 0;
    } else {
        this.bitmap.data[idx] = 255;
        this.bitmap.data[idx + 1] = 255;
        this.bitmap.data[idx + 2] = 255;
    }
    // rgba values run from 0 - 255
    // e.g. this.bitmap.data[idx] = 0; // removes red from this pixel
}

/**
 * Checks if a value is outside the specified range
 * @param offset The range
 * @param compare The value to check
 * @param actual The value to compare to
 * @returns {boolean} true if in range, false if not
 */
function notInRange(offset, compare, actual) {
    return !((compare + offset) >= actual && (compare - offset) <= actual);
}

/**
 * Tries to find the text in the image and return the text that is found
 * @param img The image to search for text
 * @returns {Promise} Resolve if found, Reject on failure or no text
 */
function ocr(img) {
    return new Promise((resolve, reject) => {
        //If other than eng the file needs to be changed
        Tesseract.recognize(img, 'eng')
            .catch(err => reject(err))
            .then(result => {
                resolve(result.text)
            });
    })
}

/**
 * Translate a text to english using google translate and return
 * the english text
 * @param text The text to translate
 * @returns {Promise} Resolve if translated, Reject on failure or no text
 */
function toEng(text) {
    return new Promise((resolve, reject) => {
        if (text.length > 0) {
            translate(text, {to: 'en'})
                .then(res => resolve(res))
                .catch(err => reject(err));
        } else {
            reject("No text")
        }
    })
}

function main() {
    toPng(robot.screen.capture())
        .then(ocr)
        .then(toEng)
        .then(res => console.log(res.text))
        .catch(err => console.error(err));

}

setTimeout(main, 1000 * 5);
//main();
//setInterval(main, 5 * 1000); // 60 * 1000 milsec












