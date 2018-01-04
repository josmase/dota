"use strict";
const screenshot = require("screenshot-desktop");
const setting = require("./settings");
const Tesseract = require('tesseract.js').create({
    langPath: setting.tLang + ".traineddata",
    corePath: "tess-core.js"
});
const gTranslate = require('google-translate-api');
const Jimp = require('jimp');

/**
 * Filters and converts the picture to a more suitable format
 * @param imageBuffer
 * @returns {Promise}
 */
function toPng(imageBuffer) {
    return new Promise((resolve, reject) => {
        Jimp.read('dota.png').then(img => {
            //needed for working with different resolutions
            img.scaleToFit(1920, 1080);
            //The place and size of the chat
            img.crop(660, 650, 550, 160);
            //To make it easier for the ocr to detect text make the text white and everything else black
            img.scan(0, 0, img.bitmap.width, img.bitmap.height, filterUnwantedColors);
            img.write('done.png');
            img.getBuffer(Jimp.MIME_PNG, (err, png) => resolve(png));
        }).catch(e => {
            console.log("Image conversion error:", e);
            reject();
        });
    })
}

function setColor(scope, idx, color) {
    scope.bitmap.data[idx + 0] = color;
    scope.bitmap.data[idx + 1] = color;
    scope.bitmap.data[idx + 2] = color;
    scope.bitmap.data[idx + 3] = 255;
}

/**
 * Set all colors not matching the chat color to black and all the colors matching the chat to white.
 * @param x Position
 * @param y Position
 * @param idx The pixel to check colors on.
 */
function filterUnwantedColors(x, y, idx) {

    // rgba values run from 0 - 255
    // e.g. this.bitmap.data[idx] = 0; // removes red from this pixel
    const red = this.bitmap.data[idx];
    const green = this.bitmap.data[idx + 1];
    const blue = this.bitmap.data[idx + 2];
    const offset = 65;

    //Set colors in range to white and outside to black.
    if (notInRange(offset, 239, red) || notInRange(offset, 224, green) || notInRange(offset, 192, blue)) {
        setColor(this, idx, 0)
    } else {
        setColor(this, idx, 255)
    }
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
        Tesseract.recognize(img, setting.tLang)
            .catch(err => reject(err))
            .then(result => {
                resolve(result.text)
            });
    })
}


async function main(prevRecognized) {
    const buffer = await screenshot();
    const img = await toPng(buffer);
    let a = new Date();
    const recognisedText = await ocr(img);
    console.log(new Date() - a);
    if (recognisedText !== prevRecognized && recognisedText.length > 0) {
        const res = await  gTranslate(recognisedText, {to: setting.gLang});
        console.log(res);
    }
    return recognisedText;
}

async function start() {
    let prevRecognized = "";
    let error = false;
    while (!error) {
        try {
            prevRecognized = await main(prevRecognized);
        }
        catch (e) {
            console.log(e);
            error = true;
        }
    }
}

start().then(() => console.log('Exiting'));











