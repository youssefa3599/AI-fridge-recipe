import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  console.log('=== API Route Called ===');
  
  try {
    // Check API key first
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set!');
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured. Please add it to your .env.local file' },
        { status: 500 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const image = formData.get('image') as File;
    console.log('Image received:', !!image);

    if (!image) {
      return NextResponse.json(
        { error: 'Please upload an image' },
        { status: 400 }
      );
    }

    console.log('Image size:', image.size, 'bytes');
    console.log('Image type:', image.type);

    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large. Please use an image smaller than 10MB.' },
        { status: 400 }
      );
    }

    console.log('Initializing Gemini...');

    // Initialize Gemini
    const ai = new GoogleGenAI({ apiKey });

    // Convert image to base64
    console.log('Converting image to base64...');
    const imageBuffer = await image.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    console.log('Base64 conversion complete, length:', base64Image.length);

    // Call Gemini API
    console.log('Calling Gemini API...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { 
              text: 'Look at this image and identify all food ingredients you can see. List them as a simple comma-separated list with no extra text. For example: "chicken, tomatoes, lettuce, cheese, bread". Only list the ingredient names, nothing else.' 
            },
            {
              inlineData: {
                mimeType: image.type,
                data: base64Image
              }
            }
          ]
        }
      ]
    });

    console.log('Gemini API response received');
    let ingredients = response.text || '';
    console.log('Raw response:', ingredients);

    // Clean up the response
    ingredients = ingredients
      .replace(/^(Ingredients:|Here are the ingredients:|I can see:|The ingredients are:)/i, '')
      .replace(/\.$/, '')
      .trim();

    console.log('Cleaned ingredients:', ingredients);
    console.log('=== Success ===');

    return NextResponse.json({ 
      ingredients,
      success: true 
    });

  } catch (error: any) {
    console.error('=== ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    console.error('Stack trace:', error.stack);
    
    let errorMessage = 'Failed to detect ingredients';
    
    if (error.message?.includes('API key') || error.message?.includes('API_KEY')) {
      errorMessage = 'Invalid API key. Please check your GEMINI_API_KEY in .env.local';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API quota exceeded. Please try again later.';
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
      { status: 500 }
    );
  }
}