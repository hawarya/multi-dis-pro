const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true,
    },
    reportName: {
        type: String,
        required: true,
    },
    reportType: {
        type: String,
        required: true,
    },
    reportDate: {
        type: Date,
        required: true,
    },
    fileUrl: {
        type: String,
        required: true,
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Report', reportSchema);
