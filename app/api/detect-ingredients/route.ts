import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'Please upload an image' },
        { status: 400 }
      );
    }

    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large. Please use an image smaller than 10MB.' },
        { status: 400 }
      );
    }

    console.log('Analyzing image with local Ollama (MiniCPM-V)...');

    // Convert image to base64
    const imageBuffer = await image.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Call local Ollama API
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'minicpm-v',
        prompt: 'Look at this image and list ONLY the food ingredients you can see. List them as a comma-separated list. Example: "chicken, tomatoes, lettuce, cheese". Only list the ingredients, nothing else.',
        images: [base64Image],
        stream: false
      })
    });

    if (!ollamaResponse.ok) {
      console.error('Ollama response not ok:', ollamaResponse.status);
      return NextResponse.json(
        { error: 'Local AI model is not running. Make sure Ollama is installed and running.' },
        { status: 503 }
      );
    }

    const ollamaData = await ollamaResponse.json();
    let ingredients = ollamaData.response?.trim() || '';

    // Clean up the response
    ingredients = ingredients
      .replace(/^(Ingredients:|Here are the ingredients:|I can see:)/i, '')
      .trim();

    console.log('Detected ingredients:', ingredients);

    return NextResponse.json({ ingredients });

  } catch (error: any) {
    console.error('Error detecting ingredients:', error);
    return NextResponse.json(
      { error: `Failed to detect ingredients: ${error.message}` },
      { status: 500 }
    );
  }
}