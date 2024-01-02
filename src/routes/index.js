const express = require('express');
const multer = require('multer');
const demucsController = require('../controllers/audio.controller');

const router = express.Router();
const path = require('path'); // Import path module for joining paths
const storage = multer.diskStorage({
  destination: './uploads',
  filename(req, file, cb) {
    // Extract the title from the file name (assuming a pattern like "Love_Song.mp3")
    const fileNameWithoutExtension = file.originalname.split('.')[0];
    const title = fileNameWithoutExtension.replace(/-/g, ' '); // Replace underscores with spaces
    req.body.title = title;

    cb(null, `${file.fieldname}-${Date.now()}`);
  }
});
const upload = multer({ storage: storage });

router.use(express.json());

router.post('/api/JamZ/', upload.single('audioFile'), async (req, res) => {
  const file = req.file.path;

  if (!file) {
    return res.status(400).send('No file path provided');
  }

  const outputFolder = './output';

  try {
    // Pass req to separateAudio function
    await demucsController.separateAudio(file, outputFolder, req);
    return res.status(200).send('Success');
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).send('Error processing audio');
  }
});

// get all audio files
router.get('/api/JamZ/', async (req, res) => {
  try {
    const audioFiles = await demucsController.getAudioFiles();
    return res.status(200).send(audioFiles);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).send('Error getting audio files');
  }
});

// get audio file by id
router.get('/api/JamZ/:filename', async (req, res) => {
  try {
    const audioFile = await demucsController.getAudioFile(req.params.filename);
    return res.status(200).send(audioFile);
  } catch (error) {
    return res.status(500).send('Error getting audio file');
  }
});

// play vocal audio file
router.get('/api/JamZ/vocals/:filename', demucsController.getVocal);

// play instrumental audio file
router.get('/api/JamZ/instrumental/:filename', demucsController.getNoVocal);

module.exports = router;
