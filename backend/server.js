const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const tesseract = require('tesseract.js');
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
        const filePath = path.join(__dirname, 'uploads', req.file.filename);
        let extractedText = '';

        try {
            if (req.file.mimetype === 'application/pdf') {
                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdfParse(dataBuffer);
                extractedText = data.text;
            } else if (req.file.mimetype.startsWith('image/')) {
                const result = await tesseract.recognize(filePath, 'eng');
                extractedText = result.data.text;
            }
        } catch (extractionError) {
            console.error('Text extraction failed:', extractionError);
            // Continuing to save the report even if extraction fails
        }

        const newReport = new Report({
            patientId,
            reportName,
            reportType,
            reportDate,
            fileUrl,
            extractedText
        });

        await newReport.save();

        res.status(201).json({
            message: 'Report uploaded successfully',
            report: newReport,
            extractedText
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Server error during upload.', error: error.message });
    }
});

// Analyze Endpoint using Gemini SDK
app.post('/api/reports/analyze', async (req, res) => {
    try {
        const { extractedText, targetLanguage } = req.body;

        if (!extractedText) {
            return res.status(400).json({ message: 'No text provided for analysis.' });
        }

        const languagePrompt = targetLanguage && targetLanguage !== 'English' 
            ? `\nProvide the output in ${targetLanguage}.` 
            : '';

        const prompt = `
            You are an expert medical AI assistant. Analyze the following medical report text and provide a structured JSON response.

            Medical Report Text:
            """${extractedText}"""

            Requirements:
            1. Respond strictly in valid JSON format.
            2. The JSON object must have exactly the following keys:
               - "keyFindings": An array of important findings.
               - "abnormalLabValues": An array of abnormal values (e.g., "High Cholesterol: 240 mg/dL"). If none, return an empty array.
               - "possibleHealthConcerns": An array of potential concerns based on the findings.
               - "patientFriendlyExplanation": A clear, simple explanation understandable by a non-medical person.
               - "shortSummary": A brief 1-2 sentence summary of the overall report.
               - "structuredLabValues": An array of objects extracting testing data. If none, return an empty array. Each object MUST have these exact keys: "test" (string), "value" (string), "normalRange" (string), and "status". "status" MUST be exactly one of: "High", "Low", or "Normal".
            3. Do not include any markdown formatting wrappers like \`\`\`json in the output. Just the raw JSON object.${languagePrompt}
        `;

        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API Error:", errorText);
            return res.status(response.status).json({ message: 'Error from Gemini API.', error: errorText });
        }

        const data = await response.json();
        
        let responseText = '';
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts.length > 0) {
            responseText = data.candidates[0].content.parts[0].text;
        }
        
        let analysisData;
        try {
            // Strip markdown JSON block wrappers if present
            const sanitizedText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            analysisData = JSON.parse(sanitizedText);
        } catch (e) {
            console.error("Failed to parse Gemini response as JSON:", responseText);
            return res.status(500).json({ message: 'Failed to format analysis response.', rawText: responseText });
        }

        res.status(200).json({ analysis: analysisData });

    } catch (error) {
        console.error('Analysis Error:', error);
        res.status(500).json({ message: 'Server error during analysis.', error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
