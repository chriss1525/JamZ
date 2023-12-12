// Post controller for audio reception and processing

const multer = require('multer');
const express = require('express');
const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'audio/')
  }
});
const upload = multer({ storage: storage });

// Post controller for audio reception
const audioprocessor = {
  post: function(req, res) {
    const audioBuffer = req.file.buffer;


  }


}
