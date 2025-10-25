import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { X, Save } from 'lucide-react';
import { doc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import { toast } from 'react-toastify';

const ServiceForm = ({ isOpen, onClose, service, onSuccess }) => {
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
  const [newRequirement, setNewRequirement] = useState('');
  const [newTag, setNewTag] = useState('');

  const categories = [
    { value: 'hair', label: 'Hair Services' },
    { value: 'beauty', label: 'Beauty & Wellness' },
    { value: 'massage', label: 'Massage & Therapy' },
    { value: 'food', label: 'Food & Beverage' },
    { value: 'medical', label: 'Medical Services' },
    { value: 'repair', label: 'Repair Services' },
    { value: 'cleaning', label: 'Cleaning Services' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || { en: '', ms: '', zh: '' },
        description: service.description || { en: '', ms: '', zh: '' },
        category: service.category || '',
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
        category: '',
        price: '',
        priceType: 'fixed',
        priceRange: { min: '', max: '' },
        duration: '',
        requirements: [],
        tags: []
      });
    }
  }, [service]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        priceRange: {
          min: formData.priceRange.min ? parseFloat(formData.priceRange.min) : undefined,
          max: formData.priceRange.max ? parseFloat(formData.priceRange.max) : undefined
        }
      };

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
          createdAt: new Date()
        };
        await addDoc(collection(db, 'services'), serviceData);
        toast.success('Service created successfully!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Service save error:', error);
      toast.error(error.response?.data?.message || 'Failed to save service');
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Name - Multilingual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Name *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
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

            {/* Category and Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="form-input form-select"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

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
