import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Listing } from '../../types';
import { 
  Home, Building, Warehouse, Palmtree, Castle, 
  Tent, Ship, Hotel, Box, Camera, ChevronLeft, 
  MapPin, Users, Bed, Bath, Upload, X, Check
} from 'lucide-react';

type Step = 'intro' | 'category' | 'location' | 'basics' | 'photos' | 'description' | 'price' | 'review';

const STEPS: Step[] = ['intro', 'category', 'location', 'basics', 'photos', 'description', 'price', 'review'];

const CreateListing: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Listing>>({
    name: '',
    address: '',
    price: 0,
    type: 'apartment',
    size: 0,
    bedrooms: 1,
    description: '',
    petsAllowed: false,
    imageUrls: [],
    energyClass: 'A',
    coordinates: { lat: 51.05, lng: 3.73 } // Default
  });

  // Helper to update form data
  const updateData = (updates: Partial<Listing>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!formData.name || !formData.address || !formData.price || (formData.imageUrls?.length || 0) < 4) {
        throw new Error("Please complete all fields and upload at least 4 photos.");
      }

      const { error } = await supabase
        .from('listings')
        .insert([formData]);

      if (error) throw error;
      
      // Success - redirect or show success message
      alert('Listing created successfully!');
      window.location.href = '/admin'; // Simple redirect for now
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Step Components ---

  const IntroStep = () => (
    <div className="flex flex-col md:flex-row items-center justify-between gap-12 h-full">
      <div className="flex-1">
        <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
          It's easy to get started on Eburon
        </h1>
      </div>
      <div className="flex-1 space-y-8">
        <div className="flex gap-4 items-start pb-8 border-b border-slate-100">
          <div className="text-2xl font-bold text-slate-900">1</div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Tell us about your place</h3>
            <p className="text-slate-500">Share some basic info, like where it is and how many guests can stay.</p>
          </div>
          <div className="ml-auto">
            <Home className="w-12 h-12 text-slate-300" />
          </div>
        </div>
        
        <div className="flex gap-4 items-start pb-8 border-b border-slate-100">
          <div className="text-2xl font-bold text-slate-900">2</div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Make it stand out</h3>
            <p className="text-slate-500">Add 4 or more photos plus a title and description—we'll help you out.</p>
          </div>
          <div className="ml-auto">
            <Camera className="w-12 h-12 text-slate-300" />
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="text-2xl font-bold text-slate-900">3</div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Finish up and publish</h3>
            <p className="text-slate-500">Choose a starting price, verify a few details, then publish your listing.</p>
          </div>
          <div className="ml-auto">
            <Check className="w-12 h-12 text-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );

  const CategoryStep = () => {
    const categories = [
      { id: 'house', label: 'House', icon: Home },
      { id: 'apartment', label: 'Apartment', icon: Building },
      { id: 'loft', label: 'Loft', icon: Warehouse },
      { id: 'villa', label: 'Villa', icon: Palmtree },
      { id: 'castle', label: 'Castle', icon: Castle },
      { id: 'cabin', label: 'Cabin', icon: Tent },
      { id: 'boat', label: 'Boat', icon: Ship },
      { id: 'hotel', label: 'Hotel', icon: Hotel },
      { id: 'other', label: 'Other', icon: Box },
    ];

    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Which of these best describes your place?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => updateData({ type: cat.id as any })}
              className={`
                flex flex-col items-start p-4 border rounded-xl transition-all hover:border-black
                ${formData.type === cat.id ? 'border-black bg-slate-50 ring-1 ring-black' : 'border-slate-200'}
              `}
            >
              <cat.icon className="w-8 h-8 mb-3 text-slate-900" />
              <span className="font-semibold text-slate-900">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const LocationStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-3xl font-bold text-slate-900 mb-4">Where's your place located?</h2>
      <p className="text-slate-500 mb-8">Your address is only shared with guests after they've made a reservation.</p>
      
      <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 mb-6">
        <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <input
          type="text"
          value={formData.address}
          onChange={(e) => updateData({ address: e.target.value })}
          placeholder="Enter your address"
          className="w-full text-center text-xl font-semibold bg-transparent border-b border-slate-300 pb-2 focus:border-black outline-none transition-colors placeholder:text-slate-300"
        />
      </div>
    </div>
  );

  const BasicsStep = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-4">Share some basics about your place</h2>
      <p className="text-slate-500 mb-8">You'll add more details later, like bed types.</p>
      
      <div className="space-y-6">
        {/* Size */}
        <div className="flex items-center justify-between py-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <Home className="w-6 h-6 text-slate-400" />
            <span className="text-lg font-medium">Size (m²)</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => updateData({ size: Math.max(0, (formData.size || 0) - 5) })}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:border-black transition-colors"
            >-</button>
            <span className="w-12 text-center font-semibold">{formData.size}</span>
            <button 
              onClick={() => updateData({ size: (formData.size || 0) + 5 })}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:border-black transition-colors"
            >+</button>
          </div>
        </div>

        {/* Bedrooms */}
        <div className="flex items-center justify-between py-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <Bed className="w-6 h-6 text-slate-400" />
            <span className="text-lg font-medium">Bedrooms</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => updateData({ bedrooms: Math.max(0, (formData.bedrooms || 1) - 1) })}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:border-black transition-colors"
            >-</button>
            <span className="w-12 text-center font-semibold">{formData.bedrooms}</span>
            <button 
              onClick={() => updateData({ bedrooms: (formData.bedrooms || 1) + 1 })}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:border-black transition-colors"
            >+</button>
          </div>
        </div>
      </div>
    </div>
  );

  const PhotosStep = () => {
    const handleImageAdd = () => {
      const url = prompt("Enter image URL (for demo purposes):");
      if (url) {
        updateData({ imageUrls: [...(formData.imageUrls || []), url] });
      }
    };

    const removeImage = (index: number) => {
      const newImages = [...(formData.imageUrls || [])];
      newImages.splice(index, 1);
      updateData({ imageUrls: newImages });
    };

    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Add some photos of your house</h2>
        <p className="text-slate-500 mb-8">You'll need 4 photos to get started. You can add more or make changes later.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {/* Existing Images */}
          {formData.imageUrls?.map((url, idx) => (
            <div key={idx} className="relative aspect-[4/3] group rounded-xl overflow-hidden border border-slate-200">
              <img src={url} alt={`Listing ${idx}`} className="w-full h-full object-cover" />
              <button 
                onClick={() => removeImage(idx)}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
              {idx === 0 && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-white text-xs font-bold rounded shadow-sm">Cover Photo</div>
              )}
            </div>
          ))}

          {/* Add Button */}
          <button 
            onClick={handleImageAdd}
            className="aspect-[4/3] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-black hover:bg-slate-50 transition-all"
          >
            <Upload className="w-8 h-8 text-slate-400" />
            <span className="font-semibold text-slate-600">Add photos</span>
          </button>
        </div>

        {(formData.imageUrls?.length || 0) < 4 && (
          <div className="p-4 bg-amber-50 text-amber-800 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Please upload at least {4 - (formData.imageUrls?.length || 0)} more photos.
          </div>
        )}
      </div>
    );
  };

  const DescriptionStep = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-8">Now, let's describe your place</h2>
      
      <div className="space-y-8">
        <div>
          <label className="block text-lg font-semibold text-slate-700 mb-2">Create a title</label>
          <p className="text-sm text-slate-500 mb-4">Short titles work best. Have fun with it—you can always change it later.</p>
          <textarea
            value={formData.name}
            onChange={(e) => updateData({ name: e.target.value })}
            className="w-full p-4 border border-slate-300 rounded-xl text-xl font-medium focus:border-black outline-none min-h-[100px]"
            placeholder="e.g. Modern Loft in Ghent Center"
            maxLength={50}
          />
          <div className="text-right text-xs text-slate-400 mt-1">{formData.name?.length || 0}/50</div>
        </div>

        <div>
          <label className="block text-lg font-semibold text-slate-700 mb-2">Create your description</label>
          <p className="text-sm text-slate-500 mb-4">Share what makes your place special.</p>
          <textarea
            value={formData.description}
            onChange={(e) => updateData({ description: e.target.value })}
            className="w-full p-4 border border-slate-300 rounded-xl text-base focus:border-black outline-none min-h-[200px]"
            placeholder="This spacious loft is located..."
          />
        </div>
      </div>
    </div>
  );

  const PriceStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-3xl font-bold text-slate-900 mb-4">Now, set your price</h2>
      <p className="text-slate-500 mb-8">You can change it anytime.</p>
      
      <div className="bg-slate-50 p-12 rounded-2xl border border-slate-200 inline-block">
        <div className="flex items-center justify-center gap-2">
          <span className="text-6xl font-bold text-slate-900">€</span>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => updateData({ price: Number(e.target.value) })}
            className="w-48 text-6xl font-bold bg-transparent border-none outline-none placeholder:text-slate-300"
            placeholder="0"
          />
        </div>
        <div className="mt-4 text-slate-500 font-medium">per month</div>
      </div>
    </div>
  );

  const ReviewStep = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 mb-8">Review your listing</h2>
      
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg">
        <img 
          src={formData.imageUrls?.[0] || 'https://via.placeholder.com/800x600'} 
          alt="Cover" 
          className="w-full h-64 object-cover"
        />
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{formData.name}</h3>
              <p className="text-slate-500">{formData.type} in {formData.address}</p>
            </div>
            <div className="text-xl font-bold">€{formData.price}<span className="text-sm font-normal text-slate-500">/mo</span></div>
          </div>
          
          <div className="flex gap-4 text-slate-600 mb-6 text-sm">
            <span>{formData.bedrooms} Bedrooms</span>
            <span>•</span>
            <span>{formData.size} m²</span>
            <span>•</span>
            <span>{formData.petsAllowed ? 'Pets Allowed' : 'No Pets'}</span>
          </div>

          <p className="text-slate-600 line-clamp-3">{formData.description}</p>
        </div>
      </div>
    </div>
  );

  // --- Main Render ---

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex-none h-20 px-8 flex items-center justify-between border-b border-slate-100 bg-white z-10">
        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">E</span>
        </div>
        <button className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
          Save & exit
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-12 h-full">
          {error && (
            <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {currentStep === 0 && <IntroStep />}
          {currentStep === 1 && <CategoryStep />}
          {currentStep === 2 && <LocationStep />}
          {currentStep === 3 && <BasicsStep />}
          {currentStep === 4 && <PhotosStep />}
          {currentStep === 5 && <DescriptionStep />}
          {currentStep === 6 && <PriceStep />}
          {currentStep === 7 && <ReviewStep />}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-none h-20 px-8 flex items-center justify-between border-t border-slate-100 bg-white z-10">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-slate-100 w-full">
          <div 
            className="h-full bg-black transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <button 
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`
            text-sm font-bold underline decoration-2 underline-offset-4
            ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-900 hover:bg-slate-50 px-4 py-2 rounded-lg'}
          `}
        >
          Back
        </button>

        <button 
          onClick={handleNext}
          disabled={loading}
          className={`
            px-8 py-3 rounded-lg font-bold text-white transition-all
            ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-black to-slate-800 hover:scale-105 active:scale-95 shadow-lg'}
          `}
        >
          {loading ? 'Publishing...' : currentStep === STEPS.length - 1 ? 'Publish Listing' : 'Next'}
        </button>
      </footer>
    </div>
  );
};

export default CreateListing;
