import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing Gemini API...');
    console.log('API Key exists:', !!process.env.GEMINI_API_KEY);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    
    // Try different model names to find which one works
    const modelsToTry = [
      'gemini-pro',
      'gemini-pro-vision',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-002',
    ];

    const results = [];

    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say hello in 3 words');
        const response = await result.response;
        const text = response.text();
        
        results.push({
          model: modelName,
          status: 'WORKS ✅',
          response: text
        });
        
        console.log(`✅ ${modelName} works!`);
      } catch (error: any) {
        results.push({
          model: modelName,
          status: 'FAILED ❌',
          error: error.message
        });
        console.log(`❌ ${modelName} failed:`, error.message);
      }
    }

    return NextResponse.json({ 
      success: true, 
      results
    });

  } catch (error: any) {
    console.error('Test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
}