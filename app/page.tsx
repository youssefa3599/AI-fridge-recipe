'use client';

import { useState } from 'react';

export default function Home() {
  const [ingredients, setIngredients] = useState('');
  const [recipe, setRecipe] = useState('');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Detect ingredients
    setIsDetecting(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/detect-ingredients', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setIngredients(data.ingredients);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Failed to detect ingredients. Please try again!');
      console.error(error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleGenerateRecipe = async () => {
    if (!ingredients.trim()) {
      alert('Please enter some ingredients or upload a photo!');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients }),
      });

      const data = await response.json();

      if (response.ok) {
        setRecipe(data.recipe);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Failed to generate recipe. Please try again!');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitEvaluation = () => {
    if (rating === 0) {
      alert('Please rate the recipe!');
      return;
    }

    // Create evaluation object
    const evaluation = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ingredients: ingredients,
      recipe: recipe.substring(0, 200) + '...', // Save preview
      rating: rating,
      feedback: feedback,
      imageName: selectedImage ? 'image-' + Date.now() : 'manual input'
    };

    // Get existing evaluations from localStorage
    const existingEvals = localStorage.getItem('evaluations');
    const evaluations = existingEvals ? JSON.parse(existingEvals) : [];
    
    // Add new evaluation
    evaluations.push(evaluation);
    
    // Save back to localStorage
    localStorage.setItem('evaluations', JSON.stringify(evaluations));

    alert(`✅ Evaluation Submitted & Saved!\n\nRating: ${rating}/5\nTotal Evaluations: ${evaluations.length}`);
    
    // Reset form
    setIngredients('');
    setRecipe('');
    setRating(0);
    setFeedback('');
    setSelectedImage(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <h1 className="text-4xl font-bold text-gray-900">
              🍳 Fridge Recipe AI Trainer
            </h1>
            <a 
              href="/dashboard"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              📊 Dashboard
            </a>
          </div>
          <p className="text-lg text-gray-600">
            Upload fridge photo or type ingredients → AI suggests recipes → Rate the quality!
          </p>
        </div>

        {/* Image Upload Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📸 Upload Fridge Photo (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700"
          />
          
          {isDetecting && (
            <div className="text-center py-4">
              <p className="text-green-600 font-semibold">🔍 AI is analyzing your image...</p>
            </div>
          )}

          {selectedImage && (
            <div className="mt-4">
              <img 
                src={selectedImage} 
                alt="Uploaded fridge" 
                className="w-full max-h-64 object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Ingredient Input */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            What's in Your Fridge? 🥗
          </label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
            rows={3}
            placeholder="AI will auto-fill from photo, or type manually (e.g., chicken, tomatoes, onions)"
          />
          <button
            onClick={handleGenerateRecipe}
            disabled={isLoading || isDetecting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-colors"
          >
            {isLoading ? '🤖 AI is cooking...' : '✨ Generate Recipe'}
          </button>
        </div>

        {/* AI Recipe Output */}
        {recipe && (
          <>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                AI Generated Recipe 🍽️
              </label>
              <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-gray-800">
                {recipe}
              </div>
            </div>

            {/* Rating Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Rate This Recipe ⭐
              </label>
              <div className="flex gap-3 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-4xl transition-transform hover:scale-110 ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                {rating === 0 && 'Click a star to rate'}
                {rating === 1 && '⭐ Poor - Ingredients don\'t match or recipe is impractical'}
                {rating === 2 && '⭐⭐ Below Average - Recipe needs improvement'}
                {rating === 3 && '⭐⭐⭐ Average - Acceptable but not exciting'}
                {rating === 4 && '⭐⭐⭐⭐ Good - Would make this recipe!'}
                {rating === 5 && '⭐⭐⭐⭐⭐ Excellent - Perfect recipe for these ingredients!'}
              </p>
            </div>

            {/* Feedback Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Feedback (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder="Did AI identify ingredients correctly? Is the recipe feasible? Too complex? Missing steps?"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitEvaluation}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-colors"
            >
              Submit Evaluation 🎯
            </button>
          </>
        )}

        {/* Info Footer */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            💡 <strong>AI Training:</strong> By evaluating how well AI identifies ingredients and generates recipes, you're demonstrating the exact skills needed for AI training jobs!
          </p>
        </div>
      </div>
    </main>
  );
}