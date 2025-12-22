import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  console.log('=== RECIPE API ROUTE CALLED ===');
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('✅ API Key exists:', !!apiKey);
    
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY is not set!');
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

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
    const ai = new GoogleGenAI({ apiKey });

    // Optimized prompt - still detailed but generates faster
    const prompt = `Create a delicious recipe using: ${ingredients}

Format (be concise but complete):

**[Creative Recipe Name]**

**Ingredients:**
- [list with measurements]

**Instructions:**
1. [clear steps]

**Time:** [minutes]
**Difficulty:** [Easy/Medium/Hard]
**Servings:** [number]

Make it tasty and practical!`;

    console.log('✅ Calling Gemini API...');

    // Use fastest model with generation config for speed
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', // Fastest stable model
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 800, // Limit output for speed
        temperature: 0.7, // Balanced creativity
      }
    });

    console.log('✅ Response received');
    let recipe = response.text || '';

    if (!recipe) {
      return NextResponse.json(
        { error: 'Failed to generate recipe - empty response' },
        { status: 500 }
      );
    }

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
    console.error('Error:', error.message);
    
    let errorMessage = 'Failed to generate recipe';
    let statusCode = 500;

    if (error.message?.includes('quota') || error.message?.includes('429')) {
      errorMessage = 'API quota exceeded. Please wait a few minutes.';
      statusCode = 429;
    } else if (error.message?.includes('API key')) {
      errorMessage = 'Invalid API key configuration.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: statusCode }
    );
  }
}

// CRITICAL: Vercel free tier maximum is 10 seconds
export const maxDuration = 10;
