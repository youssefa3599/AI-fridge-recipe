import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const client = new MongoClient(uri);

// GET - Read all evaluations
export async function GET(request: NextRequest) {
  console.log('[GET] Fetching evaluations from database...');
  
  try {
    await client.connect();
    const database = client.db('airecipe');
    const collection = database.collection('evaluations');

    // Fetch all evaluations, sorted by newest first
    const evaluations = await collection
      .find({})
      .sort({ timestamp: -1 })
      .toArray();

    console.log(`✓ Found ${evaluations.length} evaluations`);

    return NextResponse.json({
      success: true,
      evaluations: evaluations,
      count: evaluations.length
    });

  } catch (error: any) {
    console.error('❌ Error fetching evaluations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluations', details: error.message },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// POST - Create new evaluation
export async function POST(request: NextRequest) {
  console.log('[POST] Saving evaluation to database...');
  
  try {
    const body = await request.json();
    const { ingredients, recipe, rating, feedback, imageName } = body;

    console.log('[STEP 1] Received data:', {
      ingredients: ingredients?.substring(0, 50),
      rating,
      hasRecipe: !!recipe,
      imageName
    });

    // Validation
    if (!ingredients || !recipe || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields: ingredients, recipe, rating' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    console.log('[STEP 2] Validation passed ✓');

    // Connect to MongoDB
    console.log('[STEP 3] Connecting to MongoDB...');
    await client.connect();
    console.log('  ✓ Connected');

    console.log('[STEP 4] Accessing database and collection...');
    const database = client.db('airecipe');
    const collection = database.collection('evaluations');
    console.log('  - Database: airecipe');
    console.log('  - Collection: evaluations');

    // Create evaluation document
    const evaluation = {
      ingredients,
      recipe,
      rating,
      feedback: feedback || '',
      imageName: imageName || 'manual input',
      timestamp: new Date().toISOString()
    };

    console.log('[STEP 5] Inserting into database...');
    console.log('  - Collection:', collection.collectionName);
    console.log('  - Database:', database.databaseName);
    
    const result = await collection.insertOne(evaluation);
    
    console.log('✓✓✓ SUCCESS! ✓✓✓');
    console.log('  - Inserted ID:', result.insertedId);
    console.log('  - Inserted ID type:', typeof result.insertedId);
    console.log('  - Acknowledged:', result.acknowledged);

    return NextResponse.json({
      success: true,
      message: 'Evaluation saved to MongoDB!',
      id: result.insertedId,
      evaluation: {
        ...evaluation,
        _id: result.insertedId
      }
    });

  } catch (error: any) {
    console.error('❌❌❌ ERROR! ❌❌❌');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save evaluation', 
        details: error.message,
        type: error.constructor.name
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// DELETE - Clear all evaluations
export async function DELETE(request: NextRequest) {
  console.log('[DELETE] Clearing all evaluations...');
  
  try {
    await client.connect();
    const database = client.db('airecipe');
    const collection = database.collection('evaluations');

    const result = await collection.deleteMany({});
    
    console.log(`✓ Deleted ${result.deletedCount} evaluations`);

    return NextResponse.json({
      success: true,
      message: 'All evaluations deleted',
      deletedCount: result.deletedCount
    });

  } catch (error: any) {
    console.error('❌ Error deleting evaluations:', error);
    return NextResponse.json(
      { error: 'Failed to delete evaluations', details: error.message },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}