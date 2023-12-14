// audio separation

const { exec } = require('child_process');

const demucsController = {
  separateAudio: (file, outputFolder) => {
    return new Promise((resolve, reject) => {
      // Run the Demucs script on the MP3 file
      exec(`python3.8 -m demucs.separate --mp3 --two-stems vocals -n mdx_extra ${file} --out ./${outputFolder}`, (error, stdout, stderr) => {
        if (error) {
          console.error('Error processing audio', error);
          reject('Error processing audio');
        } else {
          resolve('Success');
        }
      });
    });
  },
};

module.exports = demucsController;

