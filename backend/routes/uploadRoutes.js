const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Make sure this folder exists
    },
    filename: function (req, file, cb) {
        // Create unique filename
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Upload Endpoint
router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    // Construct the public URL
    // req.protocol + '://' + req.get('host') might return localhost:5000
    // We want to return a relative path or full path. 
    // Usually full path is easier for frontend if it's on a different port/IP.
    // However, for local dev, IP might be needed if running on device.
    // Ideally, return just the filename or relative path and let frontend construct it, 
    // OR return the full path based on server config.
    // Let's return the full URL relative to the server root.

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, message: 'File uploaded successfully' });
});

module.exports = router;
