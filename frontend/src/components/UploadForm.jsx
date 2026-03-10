import { useState } from 'react';
import axios from 'axios';

const UploadForm = () => {
    const [formData, setFormData] = useState({
        patientName: '',
        patientId: '',
        reportName: '',
        reportType: 'Lab Report',
        reportDate: '',
    });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
const [uploadProgress, setUploadProgress] = useState(0);
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!file) {
        setMessage({ type: 'error', text: 'Please select a file to upload.' });
        return;
    }

    const data = new FormData();
    data.append('patientName', formData.patientName);
    data.append('patientId', formData.patientId);
    data.append('reportName', formData.reportName);
    data.append('reportType', formData.reportType);
    data.append('reportDate', formData.reportDate);
    data.append('file', file);

    try {
        setUploading(true);

        const response = await axios.post(
            'http://localhost:5000/api/reports/upload',
            data,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },

                // ⭐ NEW PART (upload progress)
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percent);
                }
            }
        );

        console.log('Upload success:', response.data);
        setMessage({ type: 'success', text: response.data.message || 'Report uploaded successfully!' });

        // Reset form
        setFormData({
            patientName: '',
            patientId: '',
            reportName: '',
            reportType: 'Lab Report',
            reportDate: '',
        });

        setFile(null);
        setUploadProgress(0); // ⭐ reset progress
        e.target.reset();

    } catch (error) {
        console.error('Upload error:', error);
        setMessage({
            type: 'error',
            text: error.response?.data?.message || 'An error occurred while uploading. Please try again.'
        });
    } finally {
        setUploading(false);
    }
};
  return (
<div className="min-h-screen bg-slate-100 flex justify-center items-start pt-16">

<div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10">

<h2 className="text-3xl font-bold text-center text-slate-800 mb-2">
Medical Report Upload
</h2>

<p className="text-center text-slate-500 mb-8">
Upload and manage patient reports securely
</p>

{message.text && (
<div className={`p-4 mb-6 rounded-lg text-sm font-medium
${message.type === 'success'
? 'bg-green-50 text-green-700 border border-green-200'
: 'bg-red-50 text-red-700 border border-red-200'}`}>
{message.text}
</div>
)}

<form onSubmit={handleSubmit} className="space-y-6">

{/* Patient Name */}
<div>
<label className="block text-sm font-semibold text-slate-700 mb-2">
Patient Name
</label>

<input
type="text"
name="patientName"
value={formData.patientName}
onChange={handleInputChange}
required
placeholder="Enter patient name"
className="w-full px-5 py-4 text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
/>
</div>

{/* Patient ID */}
<div>
<label className="block text-sm font-semibold text-slate-700 mb-2">
Patient ID
</label>

<input
type="text"
name="patientId"
value={formData.patientId}
onChange={handleInputChange}
required
placeholder="PT-10234"
className="w-full px-5 py-4 text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
/>
</div>

{/* Report Name */}
<div>
<label className="block text-sm font-semibold text-slate-700 mb-2">
Report Name
</label>

<input
type="text"
name="reportName"
value={formData.reportName}
onChange={handleInputChange}
required
placeholder="Blood Test"
className="w-full px-5 py-4 text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
/>
</div>

{/* Report Type */}
<div>
<label className="block text-sm font-semibold text-slate-700 mb-2">
Report Type
</label>

<select
name="reportType"
value={formData.reportType}
onChange={handleInputChange}
className="w-full px-5 py-4 text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
>
<option>Lab Report</option>
<option>Prescription</option>
<option>Scan Report</option>
</select>
</div>

{/* Report Date */}
<div>
<label className="block text-sm font-semibold text-slate-700 mb-2">
Report Date
</label>

<input
type="date"
name="reportDate"
value={formData.reportDate}
onChange={handleInputChange}
required
className="w-full px-5 py-4 text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
/>
</div>

{/* Upload */}
<div>
<label className="block text-sm font-semibold text-slate-700 mb-3">
Upload File
</label>

<div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 transition">

<input
type="file"
accept=".pdf,.jpg,.jpeg,.png"
onChange={handleFileChange}
required
className="block w-full text-sm"
/>

<p className="text-sm text-slate-400 mt-3">
Drag & drop or choose a file
</p>

</div>
</div>

<button
type="submit"
disabled={uploading}
className="w-full bg-blue-600 text-white py-4 text-lg font-semibold rounded-xl hover:bg-blue-700 transition">

{uploading ? "Uploading..." : "Submit Report"}

</button>

</form>

</div>

</div>
)
};

export default UploadForm;
