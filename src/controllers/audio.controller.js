// audio separation and databse integration

const { exec } = require('child_process');
const supabase = require('../../utils/db');
const fs = require('fs');
const path = require('path');


// concatenate audio chunks

const demucsController = {
  separateAudio: async (file, outputFolder, req) => {
    try {
      console.log('Separating audio...');

      // Create the output directory for chunks if it doesn't exist
      const chunkFolder = path.resolve(__dirname, '../../', outputFolder, 'chunks');
      if (!fs.existsSync(chunkFolder)) {
        fs.mkdirSync(chunkFolder, { recursive: true });
      }

      // Split the audio into 0.5-second chunks
      await new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${file} -f segment -segment_time 0.5 -c copy ${chunkFolder}/chunk_%03d.mp3`, (error, stdout, stderr) => {
          if (error) {
            console.error('FFmpeg Error:', error);
            console.error('FFmpeg Stderr:', stderr);
            reject('Error splitting audio into chunks');
          } else {
            console.log('FFmpeg Success:', stdout);
            resolve('Success');
          }
        });
      });

      // Process each chunk with Demucs
      const processedChunks = [];
      const chunkFiles = fs.readdirSync(chunkFolder);
      for (const chunkFile of chunkFiles) {
        const chunkPath = path.resolve(chunkFolder, chunkFile);
        const outputFolderName = chunkFile.replace('.mp3', '');
        const outputPath = path.resolve(__dirname, '../../', outputFolder, `mdx_extra/${outputFolderName}`);

        // Separate the audio with Demucs
        await new Promise((resolve, reject) => {
          exec(`python3 -m demucs.separate --mp3 --two-stems vocals -n mdx_extra ${chunkPath} --out ${outputPath}`, (error, stdout, stderr) => {
            if (error) {
              console.error('Demucs Error:', error);
              console.error('Demucs Stderr:', stderr);
              reject(`Error processing audio chunk ${chunkFile}`);
            } else {
              console.log(`Demucs Success for chunk ${chunkFile}:`, stdout);
              processedChunks.push(outputPath);
              resolve('Success');
            }
          });
        });
      }

      // Concatenate processed chunks
      const concatenatedVocalPath = path.resolve(__dirname, '../../', outputFolder, 'concatenated_output_vocal.mp3');
      const concatenatedNoVocalPath = path.resolve(__dirname, '../../', outputFolder, 'concatenated_output_no_vocal.mp3');
      const concatInputFileVocal = path.resolve(__dirname, '../../', outputFolder, 'concat_input_vocal.txt');
      const concatInputFileNoVocal = path.resolve(__dirname, '../../', outputFolder, 'concat_input_no_vocal.txt');

      // Corrected paths for vocal and no vocal
      const correctedVocalPaths = processedChunks.map(chunk => [
        `file '${path.join(chunk, 'mdx_extra', path.basename(chunk), 'vocals.mp3')}'`
      ]);
      const correctedNoVocalPaths = processedChunks.map(chunk => [
        `file '${path.join(chunk, 'mdx_extra', path.basename(chunk), 'no_vocals.mp3')}'`
      ]);

      fs.writeFileSync(concatInputFileVocal, correctedVocalPaths.join('\n'));
      fs.writeFileSync(concatInputFileNoVocal, correctedNoVocalPaths.join('\n'));

      await new Promise((resolve, reject) => {
        exec(`ffmpeg -f concat -safe 0 -i ${concatInputFileVocal} -c copy ${concatenatedVocalPath}`, (error, stdout, stderr) => {
          if (error) {
            console.error('FFmpeg Concatenation Error (Vocal):', error);
            console.error('FFmpeg Concatenation Stderr (Vocal):', stderr);
            reject('Error concatenating vocal processed chunks');
          } else {
            console.log('FFmpeg Concatenation Success (Vocal):', stdout);
            resolve('Success');
          }
        });
      });

      await new Promise((resolve, reject) => {
        exec(`ffmpeg -f concat -safe 0 -i ${concatInputFileNoVocal} -c copy ${concatenatedNoVocalPath}`, (error, stdout, stderr) => {
          if (error) {
            console.error('FFmpeg Concatenation Error (No Vocal):', error);
            console.error('FFmpeg Concatenation Stderr (No Vocal):', stderr);
            reject('Error concatenating no vocal processed chunks');
          } else {
            console.log('FFmpeg Concatenation Success (No Vocal):', stdout);
            resolve('Success');
          }
        });
      });

      // Delete intermediate files and mdx_extra folder
      fs.unlinkSync(concatInputFileVocal);
      fs.unlinkSync(concatInputFileNoVocal);
      fs.rmdirSync(chunkFolder, { recursive: true });

      // Get the paths of the separated audio
      const upload = path.resolve(__dirname, '../../', file);
      const vocalPath = concatenatedVocalPath;
      const noVocalPath = concatenatedNoVocalPath;

      // Add the separated audio to the database
      const { data, error } = await supabase
        .from('Song')
        .insert([
          {
            title: req.body.title,
            uploadpath: upload,
            vocalpath: vocalPath,
            novocalpath: noVocalPath,
          },
        ]);

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

  // play a specific vocal audio file 
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

  // get an uploaded audio file
  getUpload: async (req, res) => {
    try {
      const filename = req.params.filename;

      // Fetch the details of the audio file
      const audioDetails = await demucsController.getAudioFile(filename);

      if (audioDetails && audioDetails.length > 0) {
        // Get the vocal path from the details
        const uploadPath = audioDetails[0].uploadpath;

        // Ensure that the file exists
        if (fs.existsSync(uploadPath)) {
          // set the appropriate content type
          res.setHeader('Content-Type', 'audio/mp3');

          // Stream the audio to the client
          const stream = fs.createReadStream(uploadPath);
          stream.pipe(res);
        } else {
          res.status(404).json({ error: 'Upload File not found' });
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