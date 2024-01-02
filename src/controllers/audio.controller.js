// audio separation and databse integration

const { exec } = require('child_process');
const supabase = require('../../utils/db');
const fs = require('fs');

const demucsController = {
  separateAudio: async (file, outputFolder, req) => {
    try {
      console.log('Separating audio...');
      console.log('File:', file);
      console.log('Output Folder:', outputFolder);

      // Run the Demucs script on the MP3 file
      await new Promise((resolve, reject) => {
        exec(`/usr/bin/python3 -m demucs.separate --mp3 --two-stems vocals -n mdx_extra ${file} --out ./${outputFolder}`, (error, stdout, stderr) => {
          if (error) {
            console.error('Demucs Error:', error);
            console.error('Demucs Stderr:', stderr);
            reject('Error processing audio');
          } else {
            console.log('Demucs Success:', stdout);
            resolve('Success');
          }
        });
      });

      // get the paths of the separated audio
      const path = require('path');
      const vocalPath = path.resolve(__dirname, '../../', outputFolder, `mdx_extra/${file.replace('uploads/', '').split('.')[0]}/vocals.mp3`);
      const noVocalPath = path.resolve(__dirname, '../../', outputFolder, `mdx_extra/${file.replace('uploads/', '').split('.')[0]}/no_vocals.mp3`);

      console.log('Vocal Path:', vocalPath);
      console.log('No Vocal Path:', noVocalPath);

      // add the separated audio to the database
      const { data, error } = await supabase
        .from('Song')
        .insert([{
          title: req.body.title,
          vocalpath: vocalPath,
          novocalpath: noVocalPath,
        }]);

      if (error) {
        console.error('Database Insert Error:', error);
        throw new Error('Error inserting into the database');
      }

      console.log('Database Insert Success:', data);

      return 'Success';
    } catch (err) {
      console.error('Separate Audio Error:', err);
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
        throw new Error('Error getting audio files');
      }

      return data;
    } catch (err) {
      throw err;
    }
  },

  // get a specific audio details by filename
  getAudioFile: async (filename) => {
    try {
      const { data, error } = await supabase
        .from('Song')
        .select('*')
        .eq('title', filename);

      if (error) {
        throw new Error('Error getting audio file');
      }

      return data;
    } catch (err) {
      throw err;
    }
  },

  // play a specific vocal audio file 
  getVocal: async (req, res) => {
    try {
      const filename = req.params.filename;

      // Fetch the details of the audio file
      const audioDetails = await demucsController.getAudioFile(filename);

      if (audioDetails && audioDetails.length > 0) {
        // Get the vocal path from the details
        const vocalPath = audioDetails[0].vocalpath;

        // Ensure that the file exists
        if (fs.existsSync(vocalPath)) {
          // set the appropriate content type
          res.setHeader('Content-Type', 'audio/mp3');

          // Stream the audio to the client
          const stream = fs.createReadStream(vocalPath);
          stream.pipe(res);
        } else {
          res.status(404).json({ error: 'Vocal File not found' });
        }
      } else {
        res.status(404).json({ error: 'Audio Details not found' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to get audio' });
    }
  },

  // play a specific no vocal audio file
  getNoVocal: async (req, res) => {
    try {
      const filename = req.params.filename;

      // Fetch the details of the audio file
      const audioDetails = await demucsController.getAudioFile(filename);

      if (audioDetails && audioDetails.length > 0) {
        // Get the vocal path from the details
        const noVocalPath = audioDetails[0].novocalpath;

        // Ensure that the file exists
        if (fs.existsSync(noVocalPath)) {
          // set the appropriate content type
          res.setHeader('Content-Type', 'audio/mp3');

          // Stream the audio to the client
          const stream = fs.createReadStream(noVocalPath);
          stream.pipe(res);
        } else {
          res.status(404).json({ error: 'No Vocal File not found' });
        }
      } else {
        res.status(404).json({ error: 'Audio Details not found' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to get audio' });
    }
  },
 };


module.exports = demucsController;