// audio separation and databse integration

const { exec } = require('child_process');
const supabase = require('../../utils/db');

const demucsController = {
  separateAudio: async (file, outputFolder, req) => {
    try {
      // Run the Demucs script on the MP3 file
      await new Promise((resolve, reject) => {
        exec(`python3.8 -m demucs.separate --mp3 --two-stems vocals -n mdx_extra ${file} --out ./${outputFolder}`, (error, stdout, stderr) => {
          if (error) {
            console.error('Error processing audio', error);
            reject('Error processing audio');
          } else {
            resolve('Success');
          }
        });
      });

      // get the paths of the separated audio
      const vocalPath = `./${outputFolder}/${file.split('.')[0]}_vocals.mp3`;
      const noVocalPath = `./${outputFolder}/${file.split('.')[0]}_no_vocals.mp3`;

      // add the separated audio to the database
      const { data, error } = await supabase
        .from('Song')
        .upsert({
          title: req.body.title,
          vocalpath: vocalPath,
          novocalpath: noVocalPath,
        });

      if (error) {
        console.error('Error inserting into the database', error);
        throw new Error('Error inserting into the database');
      }

      console.log('Database insertion successful', data);
      return 'Success';
    } catch (err) {
      console.error('Error in separateAudio:', err);
      throw err;
    }
  },

  // get all audio files
  getAudioFiles: async () => {
    try {
      const { data, error } = await supabase
        .from('Song')
        .select('*');

      if (error) {
        console.error('Error getting audio files', error);
        throw new Error('Error getting audio files');
      }

      return data;
    } catch (err) {
      console.error('Error in getAudioFiles:', err);
      throw err;
    }
  },

  // get audio file by id
  getAudioFile: async (id) => {
    try {
      const { data, error } = await supabase
        .from('Song')
        .select('*')
        .eq('id', id);

      if (error) {
        console.error('Error getting audio file', error);
        throw new Error('Error getting audio file');
      }

      return data;
    } catch (err) {
      console.error('Error in getAudioFile:', err);
      throw err;
    }
  },

  // play audio file by path
  playAudioFile: async (path) => {
    try {
      // play the audio file
      await new Promise((resolve, reject) => {
        exec(`ffplay ${path}`, (error, stdout, stderr) => {
          if (error) {
            console.error('Error playing audio', error);
            reject('Error playing audio');
          } else {
            resolve('Success');
          }
        });
      });

      return 'Success';
    } catch (err) {
      console.error('Error in playAudioFile:', err);
      throw err;
    }
  }
};

module.exports = demucsController;
