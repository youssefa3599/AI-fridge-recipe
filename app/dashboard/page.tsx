'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Evaluation {
  id: number;
  timestamp: string;
  ingredients: string;
  recipe: string;
  rating: number;
  feedback: string;
  imageName: string;
}

export default function Dashboard() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    avgRating: 0,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStar: 0
  });

  useEffect(() => {
    // Load evaluations from localStorage
    const saved = localStorage.getItem('evaluations');
    if (saved) {
      const evals = JSON.parse(saved);
      setEvaluations(evals);

      // Calculate statistics
      const total = evals.length;
      const avgRating = total > 0 
        ? (evals.reduce((sum: number, e: Evaluation) => sum + e.rating, 0) / total).toFixed(1)
        : 0;
      
      const ratingCounts = evals.reduce((acc: any, e: Evaluation) => {
        acc[e.rating] = (acc[e.rating] || 0) + 1;
        return acc;
      }, {});

      setStats({
        total,
        avgRating: parseFloat(avgRating as string),
        fiveStars: ratingCounts[5] || 0,
        fourStars: ratingCounts[4] || 0,
        threeStars: ratingCounts[3] || 0,
        twoStars: ratingCounts[2] || 0,
        oneStar: ratingCounts[1] || 0
      });
    }
  }, []);

  const exportCSV = () => {
    if (evaluations.length === 0) {
      alert('No evaluations to export!');
      return;
    }

    const csv = [
      ['Timestamp', 'Ingredients', 'Rating', 'Feedback', 'Source'],
      ...evaluations.map(e => [
        new Date(e.timestamp).toLocaleString(),
        e.ingredients,
        e.rating.toString(),
        e.feedback || 'No feedback',
        e.imageName
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-training-evaluations-${Date.now()}.csv`;
    a.click();
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to delete all evaluations?')) {
      localStorage.removeItem('evaluations');
      setEvaluations([]);
      setStats({
        total: 0,
        avgRating: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        twoStars: 0,
        oneStar: 0
      });
      alert('All evaluations cleared!');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              📊 AI Training Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Track your recipe evaluation performance
            </p>
          </div>
          <Link 
            href="/"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            ← Back to Evaluator
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Evaluations */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Evaluations</h3>
            <p className="text-4xl font-bold text-blue-600">{stats.total}</p>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Average Rating</h3>
            <p className="text-4xl font-bold text-yellow-500">{stats.avgRating} ⭐</p>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Rating Distribution</h3>
            <div className="space-y-1 text-sm">
              <div>⭐⭐⭐⭐⭐ {stats.fiveStars} ({stats.total > 0 ? Math.round(stats.fiveStars/stats.total*100) : 0}%)</div>
              <div>⭐⭐⭐⭐ {stats.fourStars} ({stats.total > 0 ? Math.round(stats.fourStars/stats.total*100) : 0}%)</div>
              <div>⭐⭐⭐ {stats.threeStars} ({stats.total > 0 ? Math.round(stats.threeStars/stats.total*100) : 0}%)</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={exportCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            📥 Export as CSV
          </button>
          <button
            onClick={clearAll}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            🗑️ Clear All Data
          </button>
        </div>

        {/* Evaluations List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Evaluation History
          </h2>

          {evaluations.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No evaluations yet. Go evaluate some recipes! 🍳
            </p>
          ) : (
            <div className="space-y-4">
              {evaluations.slice().reverse().map((evaluation) => (
                <div key={evaluation.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm text-gray-500">
                        {new Date(evaluation.timestamp).toLocaleString()}
                      </span>
                      <p className="font-semibold text-gray-900 mt-1">
                        Ingredients: {evaluation.ingredients}
                      </p>
                    </div>
                    <div className="text-2xl">
                      {'⭐'.repeat(evaluation.rating)}
                    </div>
                  </div>
                  
                  {evaluation.feedback && (
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mt-2">
                      <strong>Feedback:</strong> {evaluation.feedback}
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-400 mt-2">
                    Source: {evaluation.imageName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-800">
            💡 <strong>Portfolio Tip:</strong> Export your evaluations as CSV and include statistics in your resume. Show you've evaluated 50+ AI outputs with detailed analysis!
          </p>
        </div>
      </div>
    </main>
  );
}