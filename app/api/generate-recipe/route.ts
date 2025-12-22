import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  console.log('=== RECIPE API ROUTE CALLED ===');
  
  try {
    // Check API key first
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('✅ API Key exists:', !!apiKey);
    console.log('✅ API Key length:', apiKey?.length || 0);
    
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY is not set!');
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Parse JSON body
    const body = await request.json();
    const { ingredients } = body;
    
    console.log('✅ Ingredients received:', ingredients);

    if (!ingredients || ingredients.trim() === '') {
      return NextResponse.json(
        { error: 'Please provide ingredients' },
        { status: 400 }
      );
    }

    console.log('✅ Initializing Gemini...');

    // Initialize Gemini (same way as detect-ingredients!)
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Create a detailed, delicious recipe using these ingredients: ${ingredients}

Write the recipe in this exact format:

**[Creative Recipe Name]**

**Ingredients:**
- [List each ingredient with measurements]

**Instructions:**
1. [Detailed first step]
2. [Detailed second step]
3. [Continue with clear steps]

**Cooking Time:** [Total time]
**Difficulty:** Easy/Medium/Hard
**Servings:** [Number of servings]

Make the recipe creative, delicious, and practical.`;

    console.log('✅ Calling Gemini API for recipe generation...');

    // Call Gemini API (same way as detect-ingredients!)
    // USE THE SAME MODEL AS DETECT-INGREDIENTS!
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // ← Changed from gemini-2.0-flash-exp
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    });

    console.log('✅ Gemini API response received');
    let recipe = response.text || '';
    console.log('✅ Recipe length:', recipe.length);

    if (!recipe) {
      return NextResponse.json(
        { error: 'Failed to generate recipe - empty response' },
        { status: 500 }
      );
    }

    // Ensure recipe has proper formatting
    if (!recipe.includes('**')) {
      recipe = `**Recipe with ${ingredients}**\n\n${recipe}`;
    }

    console.log('=== ✅ SUCCESS ===');
    return NextResponse.json({ 
      recipe, 
      success: true 
    });

  } catch (error: any) {
    console.error('=== ❌ ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    console.error('Stack trace:', error.stack);
    
    let errorMessage = 'Failed to generate recipe';
    let statusCode = 500;

    if (error.message?.includes('quota') || error.message?.includes('429')) {
      errorMessage = 'API quota exceeded. Please wait a few minutes and try again.';
      statusCode = 429;
    } else if (error.message?.includes('API key') || error.message?.includes('API_KEY')) {
      errorMessage = 'Invalid API key. Check your GEMINI_API_KEY.';
    } else if (error.message?.includes('Cannot find module')) {
      errorMessage = 'Missing @google/genai package. Run: npm install @google/genai';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        error: errorMessage, 
        details: error.message,
        type: error.constructor.name
      },
      { status: statusCode }
    );
  }
}

export const maxDuration = 30;