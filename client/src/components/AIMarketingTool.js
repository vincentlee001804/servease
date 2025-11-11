import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Download, Loader2 } from 'lucide-react';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  'https://us-central1-servease-07762363-b4f31.cloudfunctions.net/api';

const AIMarketingTool = () => {
  const [imagePreview, setImagePreview] = useState('');
  const [prompt, setPrompt] = useState(
    'Create a bold social media poster with strong call-to-action and clear pricing.'
  );
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
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
      const token = localStorage.getItem('authToken');
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          AI Personalized Marketing (Beta)
        </h3>
        <p className="text-sm text-gray-600">
          Upload a product or service image and add creative direction. We’ll enhance it into a
          ready-to-post social media poster.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Product / service image</label>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
            {imagePreview ? (
              <img src={imagePreview} alt="preview" className="mx-auto max-h-64 object-contain rounded-md" />
            ) : (
              <div className="text-gray-400">
                <Upload className="w-10 h-10 mx-auto mb-2" />
                <p>Drag & drop or click to upload</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={onFileChange} className="mt-4" />
          </div>

          <label className="block text-sm font-medium text-gray-700 mt-6 mb-2">Creative direction</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Highlight the promo, tone, CTA, colors, target audience, etc."
          />

          <button
            onClick={generate}
            disabled={loading}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate poster
          </button>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Generated result</label>
          <div className="border rounded-lg min-h-[320px] flex items-center justify-center bg-gray-50">
            {resultUrl ? (
              <img src={resultUrl} alt="result" className="max-h-[420px] object-contain rounded-md" />
            ) : (
              <div className="text-gray-400 text-center p-6">
                <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                <p>No result yet. Generate your first poster to preview it here.</p>
              </div>
            )}
          </div>
          {resultUrl && (
            <a
              href={resultUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Download poster
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIMarketingTool;


