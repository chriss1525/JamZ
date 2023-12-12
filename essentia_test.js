// take in audio files, extract the instrumental part, and save it to a new file
const express = require('express');
const essentia = require('essentia.js');
const fs = require('fs');
const multer = require('multer');

const app = express();
const port = 3000;

// Configure multer to save files to the `uploads` directory
const storage = multer.diskStorage({
  destination: './uploads',
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}`);
  }
});

const upload = multer({ storage: storage });

app.use(express.json());

app.post('/api/essentia', upload.single('audioFile'), (req, res) => {
  // Load audio file
  const file = req.file.path;

  if (!file) {
    return res.status(400).send('No file path provided');
  }

  try {
    // load audio file
    const audio = fs.readFileSync(file);

    v// Load audio as mono
    const monoAudio = essentia.array(essentia.MonoLoader(audio));

    // Demux audio into left and right channels
    const [leftChannel, rightChannel] = essentia.array(essentia.StereoDemuxer(monoAudio));

    // Subtract left and right channels from the original signal to obtain the instrumental part
    const instrumental = monoAudio.map((value, index) => value - leftChannel[index] - rightChannel[index]);

    // Save the instrumental part to a new file
    fs.writeFileSync('./audio', instrumental);

    // send success response
    return res.status(200).send('Success');
  } catch (err) {
    console.error('Error processing audio', err);
    return res.status(500).send('Error processing audio');
  }
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`));
