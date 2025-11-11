import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Upload, Image as ImageIcon, Sparkles, Download, Loader2 } from 'lucide-react';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  'https://us-central1-servease-07762363-b4f31.cloudfunctions.net/api';

const AIMarketing = () => {
  const location = useLocation();
  const { t } = useTranslation('common');
  const lang = location.pathname.split('/').filter(Boolean)[0] || 'en';

  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [prompt, setPrompt] = useState('Create a bold, high-conversion social poster with strong CTA.');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(f);
  };

  const generate = async () => {
    setError('');
    setResultUrl('');
    if (!imagePreview) {
      setError('Please upload an image first.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken'); // from app auth flow
      const resp = await fetch(`${API_BASE}/ai/generate-poster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          imageBase64: imagePreview,
          prompt
        })
      });
      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(json?.message || 'Generation failed');
      }
      setResultUrl(json.url);
    } catch (e) {
      setError(e.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Marketing (Beta)</h1>
        <p className="text-gray-600 mb-6">
          Upload a product/service image and enter a prompt. We’ll create a poster-style marketing image suitable for social media.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload image</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="mx-auto max-h-64 object-contain" />
              ) : (
                <div className="text-gray-400">
                  <Upload className="w-10 h-10 mx-auto mb-2" />
                  <p>Drag and drop or click to upload</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={onFileChange} className="mt-4" />
            </div>

            <label className="block text-sm font-medium text-gray-700 mt-6 mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full border rounded-md p-2"
              placeholder="Describe the style, mood, key text, CTA, colors, etc."
            />

            <button
              onClick={generate}
              disabled={loading}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Poster
            </button>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Result</label>
            <div className="border rounded-lg min-h-[300px] flex items-center justify-center">
              {resultUrl ? (
                <img src={resultUrl} alt="result" className="max-h-[420px] object-contain" />
              ) : (
                <div className="text-gray-400 text-center p-6">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                  <p>No result yet</p>
                </div>
              )}
            </div>
            {resultUrl && (
              <a
                href={resultUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMarketing;


