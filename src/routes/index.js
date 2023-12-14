// demucsRoutes.js

const express = require('express');
const multer = require('multer');
const demucsController = require('../controllers/audio.controller');

const router = express.Router();
const storage = multer.diskStorage({
  destination: './uploads',
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}`);
  },
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
    await demucsController.separateAudio(file, outputFolder);
    return res.status(200).send('Success');
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).send('Error processing audio');
  }
});

module.exports = router;

