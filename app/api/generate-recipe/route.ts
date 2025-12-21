import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ingredients } = await request.json();

    if (!ingredients || ingredients.trim() === '') {
      return NextResponse.json(
        { error: 'Please provide ingredients' },
        { status: 400 }
      );
    }

    console.log('Generating recipe for:', ingredients);

    // Create detailed prompt for recipe generation
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

Now write the complete recipe:`;

    // Call local Ollama API
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'minicpm-v',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 800
        }
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
    let recipe = ollamaData.response?.trim() || '';

    // Add formatting if the model didn't follow format perfectly
    if (!recipe.includes('**')) {
      recipe = `**Recipe with ${ingredients}**\n\n${recipe}`;
    }

    console.log('Recipe generated successfully');

    return NextResponse.json({ recipe });

  } catch (error: any) {
    console.error('Error generating recipe:', error);
    return NextResponse.json(
      { error: `Failed to generate recipe: ${error.message}` },
      { status: 500 }
    );
  }
}