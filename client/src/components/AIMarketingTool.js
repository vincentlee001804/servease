import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Download, Loader2, Wand2, X, CheckCircle2, AlertCircle, Lightbulb, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase-config';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  'https://api-6b4nslsuyq-uc.a.run.app';

const AIMarketingTool = ({ vendorId }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [imagePreview, setImagePreview] = useState('');
  const [prompt, setPrompt] = useState(t('aiMarketing.defaultPrompt'));
  const [isDefaultPrompt, setIsDefaultPrompt] = useState(true);
  const [enhancePrompt, setEnhancePrompt] = useState(true); // Default to enabled
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFile(file);
  };

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setError(t('aiMarketing.pleaseUploadImageFile'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setError('');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const clearImage = () => {
    setImagePreview('');
    setResultUrl('');
    setError('');
  };

  // Update default prompt when language changes
  useEffect(() => {
    if (isDefaultPrompt) {
      setPrompt(t('aiMarketing.defaultPrompt'));
    }
  }, [i18n.language, t, isDefaultPrompt]);

  // Track if user has modified the prompt
  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
    setIsDefaultPrompt(false);
  };

  // AI Prompt Enhancement function
  const enhancePromptText = (userPrompt) => {
    // Extract key information from user prompt
    const lowerPrompt = userPrompt.toLowerCase();
    
    // Detect pricing information
    const priceMatch = userPrompt.match(/RM\s*[\d,]+|[\d,]+/g);
    const price = priceMatch ? priceMatch[0] : null;
    
    // Detect product/service mentions
    const productKeywords = ['product', 'service', 'item', 'promo', 'offer', 'deal', 'sale'];
    const hasProduct = productKeywords.some(keyword => lowerPrompt.includes(keyword));
    
    // Detect tone/mood
    const isBold = lowerPrompt.includes('bold') || lowerPrompt.includes('strong') || lowerPrompt.includes('vibrant');
    const isElegant = lowerPrompt.includes('elegant') || lowerPrompt.includes('sophisticated') || lowerPrompt.includes('premium');
    const isPlayful = lowerPrompt.includes('playful') || lowerPrompt.includes('fun') || lowerPrompt.includes('cheerful');
    
    // Build enhanced prompt
    let enhanced = `Portrait of the same image from the reference photo, preserving the main identity and key features. Use the suggested specs below and generate the image:\n\n`;
    
    // Core Subject
    enhanced += `1. **Core Subject:** `;
    if (hasProduct) {
      enhanced += `The main product or service from the reference photo, clearly visible and prominent. `;
    } else {
      enhanced += `The primary subject from the reference photo, maintaining its distinctive features and characteristics. `;
    }
    if (price) {
      enhanced += `Pricing information (${price}) should be clearly displayed and easily readable. `;
    }
    enhanced += `The expression and presentation should be confident and engaging, drawing attention to the key elements.\n\n`;
    
    // Setting
    enhanced += `2. **Setting:** `;
    if (lowerPrompt.includes('outdoor') || lowerPrompt.includes('festival') || lowerPrompt.includes('market')) {
      enhanced += `A dynamic and bustling outdoor environment with a lively atmosphere. `;
    } else if (lowerPrompt.includes('indoor') || lowerPrompt.includes('studio') || lowerPrompt.includes('minimal')) {
      enhanced += `A clean, professional setting that emphasizes the subject without distraction. `;
    } else {
      enhanced += `A vibrant, engaging background that complements the main subject without overwhelming it. `;
    }
    enhanced += `The environment should feel authentic and inviting, creating depth and visual interest.\n\n`;
    
    // Composition
    enhanced += `3. **Composition:** `;
    enhanced += `A medium close-up to full-frame shot, capturing the subject in a visually appealing manner. `;
    enhanced += `The main focal point should be positioned to draw immediate attention, with the background providing context without competing for focus. `;
    enhanced += `The layout should be optimized for social media, ensuring key information is easily readable at various sizes.\n\n`;
    
    // Lighting
    enhanced += `4. **Lighting:** `;
    if (isBold) {
      enhanced += `Bright, vibrant natural or studio lighting that creates strong highlights and clear definition. `;
    } else if (isElegant) {
      enhanced += `Soft, professional lighting with subtle highlights and gentle shadows that add sophistication. `;
    } else {
      enhanced += `Bright, inviting natural daylight that creates appealing highlights and soft shadows. `;
    }
    enhanced += `The lighting should make the subject pop while maintaining a warm, appealing glow throughout the image.\n\n`;
    
    // Style
    enhanced += `5. **Style:** `;
    enhanced += `High-resolution, realistic photographic style with rich textures and sharp details. `;
    if (isElegant) {
      enhanced += `The aesthetic should be professional and polished, emphasizing quality and sophistication. `;
    } else if (isPlayful) {
      enhanced += `The aesthetic should be energetic and engaging, with authentic expressions and a candid feel. `;
    } else {
      enhanced += `The overall aesthetic should be professional yet approachable, emphasizing authenticity and engagement. `;
    }
    enhanced += `The style should be optimized for social media marketing, ensuring visual appeal and clarity.\n\n`;
    
    // Atmosphere
    enhanced += `6. **Atmosphere:** `;
    if (isPlayful || isBold) {
      enhanced += `Energetic, cheerful, and inviting. The scene should evoke a sense of excitement and engagement. `;
    } else if (isElegant) {
      enhanced += `Sophisticated, premium, and refined. The scene should convey quality and exclusivity. `;
    } else {
      enhanced += `Inviting, engaging, and professional. The scene should create a positive emotional connection. `;
    }
    enhanced += `The overall mood should align with the marketing message and target audience.\n\n`;
    
    // Color Palette
    enhanced += `7. **Color Palette:** `;
    enhanced += `A rich and vibrant palette that enhances the main subject. `;
    if (isBold) {
      enhanced += `Use strong, contrasting colors that create visual impact and draw attention. `;
    } else if (isElegant) {
      enhanced += `Use sophisticated, refined colors that convey quality and premium positioning. `;
    } else {
      enhanced += `Use warm, inviting colors that create an appealing and approachable aesthetic. `;
    }
    enhanced += `Ensure the color scheme is optimized for social media visibility and brand consistency.`;
    
    return enhanced;
  };

  const generate = async () => {
    setError('');
    setResultUrl('');
    if (!imagePreview) {
      setError(t('aiMarketing.pleaseUploadImage'));
      return;
    }
    if (!user) {
      setError(t('aiMarketing.mustBeLoggedIn'));
      return;
    }
    setLoading(true);
    try {
      // Ensure we have the latest Firebase Auth ID token
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('Authentication required');
      }
      const token = await firebaseUser.getIdToken(true); // Force refresh to ensure validity
      if (!token) {
        throw new Error('Authentication required');
      }

      // Apply prompt enhancement if enabled
      const finalPrompt = enhancePrompt ? enhancePromptText(prompt) : prompt;
      
      // Log enhanced prompt for debugging (only in development)
      if (process.env.NODE_ENV === 'development' && enhancePrompt) {
        console.log('🔮 Enhanced Prompt:', finalPrompt);
      }

      const resp = await fetch(`${API_BASE}/ai/generate-poster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vendorId: vendorId || user.uid,
          imageBase64: imagePreview,
          prompt: finalPrompt
        })
      });
      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(json?.message || json?.detail || 'Generation failed');
      }
      setResultUrl(json.posterUrl || json.url);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      setError(e.message || t('aiMarketing.failedToGenerate'));
      console.error('AI Marketing Tool Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const promptLength = prompt.length;
  const maxPromptLength = 500;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
              {t('aiMarketing.title')}
              <span className="text-xs font-normal bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{t('aiMarketing.beta')}</span>
            </h3>
            <p className="text-sm text-gray-600">
              {t('aiMarketing.description')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          {/* Image Upload */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <ImageIcon className="w-4 h-4 text-blue-500" />
              {t('aiMarketing.productImage')}
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="mx-auto max-h-64 object-contain rounded-lg shadow-md"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    title={t('aiMarketing.removeImage')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-gray-400">
                  <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragging ? 'text-blue-500' : ''}`} />
                  <p className="font-medium mb-1">{t('aiMarketing.dragDrop')}</p>
                  <p className="text-xs">{t('aiMarketing.orClick')}</p>
                  <p className="text-xs mt-2 text-gray-400">{t('aiMarketing.supports')}</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Prompt Section */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <Zap className="w-4 h-4 text-yellow-500" />
              {t('aiMarketing.creativeDirection')}
            </label>
            
            {/* AI Prompt Enhancement Toggle */}
            <div className="mb-4 flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-md">
                  <Wand2 className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">{t('aiMarketing.promptEnhancement')}</span>
                  <span className="text-xs text-gray-500">{t('aiMarketing.promptEnhancementDesc')}</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enhancePrompt}
                  onChange={(e) => setEnhancePrompt(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:left-auto peer-checked:after:right-[2px] peer-checked:after:border-white peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-blue-500"></div>
              </label>
            </div>
            
            <textarea
              value={prompt}
              onChange={handlePromptChange}
              rows={5}
              maxLength={maxPromptLength}
              className="w-full border-2 border-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all resize-none"
              placeholder={t('aiMarketing.promptPlaceholder')}
            />
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {enhancePrompt && (
                  <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                    <Lightbulb className="w-3 h-3" />
                    <span>{t('aiMarketing.enhancementActive')}</span>
                  </div>
                )}
              </div>
              <span className={`text-xs ${promptLength > maxPromptLength * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
                {promptLength} / {maxPromptLength}
              </span>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generate}
            disabled={loading || !imagePreview}
            className="w-full inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span>{t('aiMarketing.generatingPoster')}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                <span>{t('aiMarketing.generatePoster')}</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <p className="text-sm text-green-700 font-medium">{t('aiMarketing.posterGenerated')}</p>
            </div>
          )}
        </div>

        {/* Result Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
            <Sparkles className="w-4 h-4 text-green-500" />
            {t('aiMarketing.generatedResult')}
          </label>
          <div className="border-2 border-gray-200 rounded-xl min-h-[400px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            {loading ? (
              <div className="text-center p-8">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
                  </div>
                </div>
                <p className="text-gray-600 font-medium mt-4">{t('aiMarketing.creatingPoster')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('aiMarketing.mayTakeTime')}</p>
              </div>
            ) : resultUrl ? (
              <div className="w-full p-4">
                <div className="relative bg-white rounded-lg shadow-xl p-2">
                  <img
                    src={resultUrl}
                    alt="Generated poster"
                    className="w-full max-h-[500px] object-contain rounded-md"
                  />
                </div>
                <div className="mt-4 flex gap-3">
                  <a
                    href={resultUrl}
                    download="ai-poster.png"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    {t('aiMarketing.downloadPoster')}
                  </a>
                  <a
                    href={resultUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
                  >
                    {t('aiMarketing.viewFullSize')}
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium mb-1">{t('aiMarketing.noPosterYet')}</p>
                <p className="text-xs text-gray-400">{t('aiMarketing.uploadAndGenerate')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMarketingTool;


