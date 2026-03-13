import { useState } from "react";
import axios from "axios";

const UploadForm = () => {
  const [formData, setFormData] = useState({
    patientName: "",
    patientId: "",
    reportName: "",
    reportType: "Lab Report",
    reportDate: "",
  });

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedText, setExtractedText] = useState("");

  const [targetLanguage, setTargetLanguage] = useState("English");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!file) {
      setMessage({ type: "error", text: "Please select a file to upload." });
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });
    data.append("file", file);

    try {
      setUploading(true);

      const response = await axios.post(
        "http://localhost:5000/api/reports/upload",
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          },
        }
      );

      setMessage({
        type: "success",
        text: response.data.message || "Report uploaded successfully!",
      });

      setExtractedText(response.data.extractedText || "");
      setAnalysisResult(null);

      setFormData({
        patientName: "",
        patientId: "",
        reportName: "",
        reportType: "Lab Report",
        reportDate: "",
      });

      setFile(null);
      setUploadProgress(0);
      e.target.reset();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Upload failed. Please try again later.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!extractedText) return;

    try {
      setAnalyzing(true);

      const response = await axios.post(
        "http://localhost:5000/api/reports/analyze",
        {
          extractedText,
          targetLanguage,
        }
      );

      if (response.data.analysis) {
        setAnalysisResult(response.data.analysis);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "AI analysis failed.",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">

      {/* MAIN CARD */}
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-3xl p-10">

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800">
            Medical Report Upload
          </h2>
          <p className="text-slate-500 mt-2">
            Upload patient records and analyze with AI
          </p>
        </div>

        {message.text && (
          <div
            className={`p-4 rounded-lg mb-6 text-sm font-medium ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="grid md:grid-cols-2 gap-6">
            <input
              type="text"
              name="patientName"
              placeholder="Patient Name"
              value={formData.patientName}
              onChange={handleInputChange}
              required
              className="input"
            />

            <input
              type="text"
              name="patientId"
              placeholder="Patient ID"
              value={formData.patientId}
              onChange={handleInputChange}
              required
              className="input"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <input
              type="text"
              name="reportName"
              placeholder="Report Title"
              value={formData.reportName}
              onChange={handleInputChange}
              required
              className="input"
            />

            <input
              type="date"
              name="reportDate"
              value={formData.reportDate}
              onChange={handleInputChange}
              required
              className="input"
            />
          </div>

          <select
            name="reportType"
            value={formData.reportType}
            onChange={handleInputChange}
            className="input"
          >
            <option>Lab Report</option>
            <option>Prescription</option>
            <option>Scan Report</option>
          </select>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-500 transition">

  <label className="cursor-pointer bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700">
    Choose File
    <input
      type="file"
      accept=".pdf,.jpg,.jpeg,.png"
      onChange={handleFileChange}
      className="hidden"
      required
    />
  </label>

  {file && (
    <p className="mt-3 text-sm text-slate-600">{file.name}</p>
  )}

  <p className="text-sm text-slate-500 mt-2">
    Supports PDF, JPG, PNG up to 5MB
  </p>

</div>

          {/* Upload Progress */}
          {uploading && (
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-semibold text-lg transition"
          >
            {uploading ? `Uploading ${uploadProgress}%` : "Submit Report"}
          </button>
        </form>
      </div>

      {/* Extracted Text */}
      {extractedText && (
        <div className="w-full max-w-4xl mt-10 bg-white p-8 rounded-3xl shadow-lg">

          <h3 className="text-xl font-semibold mb-4 text-slate-700">
            Extracted Data
          </h3>

          <pre className="bg-slate-100 p-4 rounded-lg text-sm max-h-60 overflow-auto">
            {extractedText}
          </pre>

          <div className="flex gap-4 mt-6">

            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="input"
            >
              <option>English</option>
              <option>Spanish</option>
              <option>Hindi</option>
              <option>French</option>
            </select>

            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
            >
              {analyzing ? "Analyzing..." : "Generate Analysis"}
            </button>

          </div>

          {/* AI Analysis */}
          {analysisResult && (
            <div className="mt-8 space-y-8 animate-[fadeIn_0.5s_ease-out]">

              {/* Lab Values Cards */}
              {analysisResult.structuredLabValues && analysisResult.structuredLabValues.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h4 className="font-bold text-slate-800 text-lg mb-5 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    Lab Results Overview
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysisResult.structuredLabValues.map((lab, idx) => {
                      let statusStyles = "";
                      let Icon = null;
                      
                      if (lab.status === "High") {
                        statusStyles = "bg-red-50 border-red-200 text-red-900";
                        Icon = () => <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
                      } else if (lab.status === "Low") {
                        statusStyles = "bg-orange-50 border-orange-200 text-orange-900";
                        Icon = () => <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
                      } else {
                        statusStyles = "bg-green-50 border-green-200 text-green-900";
                        Icon = () => <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
                      }

                      return (
                        <div key={idx} className={`p-4 rounded-xl border ${statusStyles} flex flex-col justify-between hover:-translate-y-1 transition-transform duration-200 shadow-sm`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-sm tracking-wide uppercase opacity-80">{lab.test}</span>
                            <span className="bg-white/60 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm border border-black/5">
                              {Icon && <Icon />}
                              {lab.status}
                            </span>
                          </div>
                          <div>
                            <div className="text-2xl font-black tracking-tight mb-1">{lab.value}</div>
                            <div className="text-xs font-medium opacity-70">Normal Range: {lab.normalRange}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm">
                  <h4 className="font-bold text-indigo-900 text-lg mb-3">Executive Summary</h4>
                  <p className="text-indigo-800 leading-relaxed text-sm">{analysisResult.shortSummary}</p>
                </div>

                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm">
                  <h4 className="font-bold text-emerald-900 text-lg mb-3">Patient Friendly Explanation</h4>
                  <p className="text-emerald-800 leading-relaxed text-sm">{analysisResult.patientFriendlyExplanation}</p>
                </div>
              </div>

            </div>
          )}
        </div>
      )}


    </div>
  );
};

export default UploadForm;