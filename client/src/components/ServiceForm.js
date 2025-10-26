import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { X, Save, Languages, Loader2 } from 'lucide-react';
import { doc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import { toast } from 'react-toastify';
import { translateWithFallback } from '../utils/translation';

const ServiceForm = ({ isOpen, onClose, service, onSuccess, vendorBusinessType }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: {
      en: '',
      ms: '',
      zh: ''
    },
    description: {
      en: '',
      ms: '',
      zh: ''
    },
    category: '',
    price: '',
    priceType: 'fixed',
    priceRange: {
      min: '',
      max: ''
    },
    duration: '',
    requirements: [],
    tags: []
  });
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [newRequirement, setNewRequirement] = useState('');
  const [newTag, setNewTag] = useState('');

  // Auto-set category based on vendor's business type
  const getCategoryFromBusinessType = (businessType) => {
    if (!businessType) return 'other';
    
    const type = businessType.toLowerCase();
    if (type.includes('hair') || type.includes('salon') || type.includes('barber')) return 'hair';
    if (type.includes('beauty') || type.includes('spa') || type.includes('wellness')) return 'beauty';
    if (type.includes('massage') || type.includes('therapy')) return 'massage';
    if (type.includes('food') || type.includes('restaurant') || type.includes('cafe')) return 'food';
    if (type.includes('medical') || type.includes('health') || type.includes('clinic')) return 'medical';
    if (type.includes('repair') || type.includes('maintenance')) return 'repair';
    if (type.includes('cleaning') || type.includes('housekeeping')) return 'cleaning';
    return 'other';
  };

  useEffect(() => {
    const autoCategory = getCategoryFromBusinessType(vendorBusinessType);
    
    if (service) {
      setFormData({
        name: service.name || { en: '', ms: '', zh: '' },
        description: service.description || { en: '', ms: '', zh: '' },
        category: service.category || autoCategory,
        price: service.price || '',
        priceType: service.priceType || 'fixed',
        priceRange: service.priceRange || { min: '', max: '' },
        duration: service.duration || '',
        requirements: service.requirements || [],
        tags: service.tags || []
      });
    } else {
      setFormData({
        name: { en: '', ms: '', zh: '' },
        description: { en: '', ms: '', zh: '' },
        category: autoCategory,
        price: '',
        priceType: 'fixed',
        priceRange: { min: '', max: '' },
        duration: '',
        requirements: [],
        tags: []
      });
    }
  }, [service, vendorBusinessType]);

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleLanguageChange = (field, lang, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [lang]: value
      }
    }));
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  // Auto-translate function for service name only
  const autoTranslateName = async () => {
    const nameSource = formData.name.en || formData.name.ms || formData.name.zh;
    
    if (!nameSource) {
      toast.warning('Please enter service name in any language first');
      return;
    }

    setTranslating(true);
    try {
      let sourceLang = 'en';
      if (formData.name.ms && !formData.name.en && !formData.name.zh) sourceLang = 'ms';
      if (formData.name.zh && !formData.name.en && !formData.name.ms) sourceLang = 'zh';
      
      const translations = await Promise.all([
        sourceLang !== 'en' ? translateWithFallback(nameSource, 'en') : Promise.resolve(formData.name.en || ''),
        sourceLang !== 'ms' ? translateWithFallback(nameSource, 'ms') : Promise.resolve(formData.name.ms || ''),
        sourceLang !== 'zh' ? translateWithFallback(nameSource, 'zh') : Promise.resolve(formData.name.zh || '')
      ]);
      
      setFormData(prev => ({
        ...prev,
        name: {
          en: translations[0] || prev.name.en,
          ms: translations[1] || prev.name.ms,
          zh: translations[2] || prev.name.zh
        }
      }));

      toast.success('Service name translated successfully!');
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Translation failed. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  // Auto-translate function for description only
  const autoTranslateDescription = async () => {
    const descSource = formData.description.en || formData.description.ms || formData.description.zh;
    
    if (!descSource) {
      toast.warning('Please enter service description in any language first');
      return;
    }

    setTranslating(true);
    try {
      let sourceLang = 'en';
      if (formData.description.ms && !formData.description.en && !formData.description.zh) sourceLang = 'ms';
      if (formData.description.zh && !formData.description.en && !formData.description.ms) sourceLang = 'zh';
      
      const translations = await Promise.all([
        sourceLang !== 'en' ? translateWithFallback(descSource, 'en') : Promise.resolve(formData.description.en || ''),
        sourceLang !== 'ms' ? translateWithFallback(descSource, 'ms') : Promise.resolve(formData.description.ms || ''),
        sourceLang !== 'zh' ? translateWithFallback(descSource, 'zh') : Promise.resolve(formData.description.zh || '')
      ]);
      
      setFormData(prev => ({
        ...prev,
        description: {
          en: translations[0] || prev.description.en,
          ms: translations[1] || prev.description.ms,
          zh: translations[2] || prev.description.zh
        }
      }));

      toast.success('Service description translated successfully!');
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Translation failed. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Handle different pricing types properly
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration)
      };

      // Only add priceRange for range pricing
      if (formData.priceType === 'range') {
        submitData.priceRange = {
          min: formData.priceRange.min ? parseFloat(formData.priceRange.min) : undefined,
          max: formData.priceRange.max ? parseFloat(formData.priceRange.max) : undefined
        };
      }
      // For "Starting from" pricing, we don't include priceRange at all
      // The price field itself contains the starting price

      if (service) {
        // Update existing service
        const serviceRef = doc(db, 'services', service.id);
        await updateDoc(serviceRef, {
          ...submitData,
          updatedAt: new Date()
        });
        toast.success('Service updated successfully!');
      } else {
        // Create new service
        const serviceData = {
          ...submitData,
          vendorEmail: user.email,
          vendorId: user.uid,
          isActive: true,
          createdAt: new Date()
        };
        console.log('Creating service with data:', serviceData);
        const docRef = await addDoc(collection(db, 'services'), serviceData);
        console.log('Service created with ID:', docRef.id);
        toast.success('Service created successfully!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Service save error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message
      });
      toast.error(`Failed to save service: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {service ? t('editService') : t('addService')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Translation Help */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <Languages className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Auto-Translation Feature</h4>
                <p className="text-sm text-blue-800">
                  Enter your service details in any language (English, Bahasa Malaysia, or Chinese), then click "Auto Translate" to automatically translate to the other languages. 
                  You can still edit the translations manually if needed.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Name - Multilingual */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Service Name *
                </label>
                <button
                  type="button"
                  onClick={autoTranslateName}
                  disabled={translating || (!formData.name.en && !formData.name.ms && !formData.name.zh)}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {translating ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Languages className="h-3 w-3 mr-1" />
                      Auto Translate
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">English *</label>
                  <input
                    type="text"
                    value={formData.name.en}
                    onChange={(e) => handleLanguageChange('name', 'en', e.target.value)}
                    className="form-input"
                    required
                    placeholder="Enter service name in English"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bahasa Malaysia</label>
                  <input
                    type="text"
                    value={formData.name.ms}
                    onChange={(e) => handleLanguageChange('name', 'ms', e.target.value)}
                    className="form-input"
                    placeholder="Enter service name in Bahasa Malaysia"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">中文</label>
                  <input
                    type="text"
                    value={formData.name.zh}
                    onChange={(e) => handleLanguageChange('name', 'zh', e.target.value)}
                    className="form-input"
                    placeholder="Enter service name in Chinese"
                  />
                </div>
              </div>
            </div>

            {/* Service Description - Multilingual */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <button
                  type="button"
                  onClick={autoTranslateDescription}
                  disabled={translating || (!formData.description.en && !formData.description.ms && !formData.description.zh)}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {translating ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Languages className="h-3 w-3 mr-1" />
                      Auto Translate
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">English</label>
                  <textarea
                    value={formData.description.en}
                    onChange={(e) => handleLanguageChange('description', 'en', e.target.value)}
                    className="form-input form-textarea"
                    rows={3}
                    placeholder="Enter service description in English"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bahasa Malaysia</label>
                  <textarea
                    value={formData.description.ms}
                    onChange={(e) => handleLanguageChange('description', 'ms', e.target.value)}
                    className="form-input form-textarea"
                    rows={3}
                    placeholder="Enter service description in Bahasa Malaysia"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">中文</label>
                  <textarea
                    value={formData.description.zh}
                    onChange={(e) => handleLanguageChange('description', 'zh', e.target.value)}
                    className="form-input form-textarea"
                    rows={3}
                    placeholder="Enter service description in Chinese"
                  />
                </div>
              </div>
            </div>

            {/* Auto-set Category Display */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">ℹ</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Service Category:</span> {formData.category === 'hair' ? 'Hair Services' : 
                     formData.category === 'beauty' ? 'Beauty & Wellness' :
                     formData.category === 'massage' ? 'Massage & Therapy' :
                     formData.category === 'food' ? 'Food & Beverage' :
                     formData.category === 'medical' ? 'Medical Services' :
                     formData.category === 'repair' ? 'Repair Services' :
                     formData.category === 'cleaning' ? 'Cleaning Services' : 'Other'}
                    <br />
                    <span className="text-xs text-blue-600">This category is automatically set based on your business type.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  className="form-input"
                  min="5"
                  required
                  placeholder="e.g., 60"
                />
              </div>
            </div>

            {/* Pricing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pricing *
              </label>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Price Type</label>
                  <select
                    value={formData.priceType}
                    onChange={(e) => handleChange('priceType', e.target.value)}
                    className="form-input form-select"
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="range">Price Range</option>
                    <option value="from">Starting From</option>
                  </select>
                </div>

                {formData.priceType === 'fixed' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Price (RM)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleChange('price', e.target.value)}
                      className="form-input"
                      min="0"
                      step="0.01"
                      required
                      placeholder="e.g., 50.00"
                    />
                  </div>
                )}

                {formData.priceType === 'range' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Min Price (RM)</label>
                      <input
                        type="number"
                        value={formData.priceRange.min}
                        onChange={(e) => handleChange('priceRange.min', e.target.value)}
                        className="form-input"
                        min="0"
                        step="0.01"
                        required
                        placeholder="e.g., 30.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Max Price (RM)</label>
                      <input
                        type="number"
                        value={formData.priceRange.max}
                        onChange={(e) => handleChange('priceRange.max', e.target.value)}
                        className="form-input"
                        min="0"
                        step="0.01"
                        required
                        placeholder="e.g., 80.00"
                      />
                    </div>
                  </div>
                )}

                {formData.priceType === 'from' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Starting Price (RM)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleChange('price', e.target.value)}
                      className="form-input"
                      min="0"
                      step="0.01"
                      required
                      placeholder="e.g., 25.00"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              <div className="space-y-2">
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex-1 p-2 bg-gray-100 rounded text-sm">{req}</span>
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    className="form-input flex-1"
                    placeholder="Add requirement (e.g., Bring ID)"
                  />
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="btn btn-outline"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="form-input flex-1"
                    placeholder="Add tag (e.g., popular, new)"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="btn btn-outline"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="spinner mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save size={16} className="mr-2" />
                    {service ? 'Update Service' : 'Create Service'}
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ServiceForm;
