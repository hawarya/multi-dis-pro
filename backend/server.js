const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON request bodies
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files statically

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Multer Setup for File Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // The folder where files will be saved
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter (optional, but good for security)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Import the Report Model
const Report = require('./models/Report');

// Routes
app.post('/api/reports/upload', upload.single('file'), async (req, res) => {
    try {
        const { patientName, patientId, reportName, reportType, reportDate } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded or invalid file type.' });
        }

        const fileUrl = `/uploads/${req.file.filename}`; // Path relative to the server

        const newReport = new Report({
            patientId,
            reportName,
            reportType,
            reportDate,
            fileUrl
        });

        await newReport.save();

        res.status(201).json({
            message: 'Report uploaded successfully',
            report: newReport
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Server error during upload.', error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
