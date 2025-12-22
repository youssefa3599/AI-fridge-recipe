// app/api/evaluations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, Db } from 'mongodb';

// In-memory connection cache
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectToDatabase() {
  console.log('┌─────────────────────────────────────┐');
  console.log('│ CONNECT TO DATABASE FUNCTION CALLED │');
  console.log('└─────────────────────────────────────┘');
  
  // Return cached connection if available
  if (cachedClient && cachedDb) {
    console.log('✓ Using cached MongoDB connection');
    return { client: cachedClient, db: cachedDb };
  }

  console.log('→ No cached connection, creating new one...');
  
  const uri = process.env.MONGODB_URI;
  console.log('→ Checking MONGODB_URI from env...');
  console.log('  - MONGODB_URI exists:', !!uri);
  console.log('  - MONGODB_URI type:', typeof uri);
  console.log('  - MONGODB_URI length:', uri?.length || 0);
  console.log('  - MONGODB_URI starts with:', uri?.substring(0, 30));
  
  if (!uri) {
    console.error('✗ MONGODB_URI is not defined!');
    console.error('  - All env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
    throw new Error('MONGODB_URI is not defined in .env.local');
  }

  console.log('→ Creating MongoClient instance...');
  try {
    const client = new MongoClient(uri);
    console.log('✓ MongoClient created successfully');
    
    console.log('→ Attempting to connect to MongoDB...');
    await client.connect();
    console.log('✓ MongoDB client.connect() completed');
    
    console.log('→ Selecting database: airecipe');
    const db = client.db('airecipe');
    console.log('✓ Database selected');
    
    cachedClient = client;
    cachedDb = db;
    
    console.log('✓✓✓ MongoDB connected successfully! ✓✓✓');
    return { client, db };
  } catch (connectError: any) {
    console.error('╔════════════════════════════════════╗');
    console.error('║ MONGODB CONNECTION ERROR DETAILS   ║');
    console.error('╚════════════════════════════════════╝');
    console.error('Error name:', connectError.name);
    console.error('Error message:', connectError.message);
    console.error('Error code:', connectError.code);
    console.error('Error stack:', connectError.stack);
    console.error('Full error object:', JSON.stringify(connectError, null, 2));
    throw connectError;
  }
}

// GET - Fetch all evaluations
export async function GET() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  GET /api/evaluations REQUEST        ║');
  console.log('╚══════════════════════════════════════╝');
  
  try {
    console.log('→ Fetching evaluations...');
    const { db } = await connectToDatabase();
    
    console.log('→ Querying evaluations collection...');
    const evaluations = await db
      .collection('evaluations')
      .find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    console.log(`✓ Found ${evaluations.length} evaluations`);
    
    return NextResponse.json({ 
      evaluations,
      success: true 
    });
  } catch (error: any) {
    console.error('╔════════════════════════════════════╗');
    console.error('║ GET REQUEST ERROR                  ║');
    console.error('╚════════════════════════════════════╝');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch evaluations', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Save new evaluation
export async function POST(request: NextRequest) {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  POST /api/evaluations REQUEST       ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    console.log('\n[STEP 1] Parsing request body...');
    console.log('  - Request method:', request.method);
    console.log('  - Request URL:', request.url);
    console.log('  - Content-Type:', request.headers.get('content-type'));
    
    const body = await request.json();
    console.log('✓ Body parsed successfully');
    console.log('  - Body keys:', Object.keys(body));
    
    const { ingredients, recipe, rating, feedback, imageName } = body;

    console.log('\n[STEP 2] Validating received data...');
    console.log('  - ingredients exists:', !!ingredients);
    console.log('  - ingredients type:', typeof ingredients);
    console.log('  - ingredients length:', ingredients?.length);
    console.log('  - ingredients preview:', ingredients?.substring(0, 50));
    console.log('  - recipe exists:', !!recipe);
    console.log('  - recipe type:', typeof recipe);
    console.log('  - recipe length:', recipe?.length);
    console.log('  - recipe preview:', recipe?.substring(0, 50));
    console.log('  - rating:', rating);
    console.log('  - rating type:', typeof rating);
    console.log('  - feedback:', feedback?.substring(0, 30) || 'none');
    console.log('  - imageName:', imageName);

    if (!ingredients || !recipe || !rating) {
      console.error('✗ VALIDATION FAILED - Missing required fields!');
      console.error('  - ingredients missing:', !ingredients);
      console.error('  - recipe missing:', !recipe);
      console.error('  - rating missing:', !rating);
      return NextResponse.json(
        { error: 'Missing required fields: ingredients, recipe, and rating are required' },
        { status: 400 }
      );
    }
    console.log('✓ All required fields present');

    console.log('\n[STEP 3] Connecting to MongoDB...');
    const { db } = await connectToDatabase();
    console.log('✓ MongoDB connection established');
    
    console.log('\n[STEP 4] Preparing evaluation document...');
    const evaluation = {
      ingredients,
      recipe,
      rating,
      feedback: feedback || '',
      imageName: imageName || 'Unknown',
      timestamp: new Date().toISOString(),
      createdAt: new Date()
    };
    console.log('✓ Evaluation document prepared');
    console.log('  - Document keys:', Object.keys(evaluation));
    console.log('  - Document size:', JSON.stringify(evaluation).length, 'bytes');

    console.log('\n[STEP 5] Inserting into database...');
    console.log('  - Collection: evaluations');
    console.log('  - Database: airecipe');
    
    const result = await db.collection('evaluations').insertOne(evaluation);
    
    console.log('\n✓✓✓ SUCCESS! ✓✓✓');
    console.log('  - Inserted ID:', result.insertedId);
    console.log('  - Inserted ID type:', typeof result.insertedId);
    console.log('  - Acknowledged:', result.acknowledged);

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      evaluation
    });
    
  } catch (error: any) {
    console.error('\n╔════════════════════════════════════╗');
    console.error('║ POST REQUEST ERROR OCCURRED        ║');
    console.error('╚════════════════════════════════════╝');
    console.error('Error occurred at:', new Date().toISOString());
    console.error('Error constructor:', error.constructor.name);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error cause:', error.cause);
    console.error('\n--- FULL ERROR STACK ---');
    console.error(error.stack);
    console.error('\n--- FULL ERROR OBJECT ---');
    console.error(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Check for specific error types
    if (error.message?.includes('connect')) {
      console.error('\n⚠ This appears to be a CONNECTION ERROR');
    }
    if (error.message?.includes('timeout')) {
      console.error('\n⚠ This appears to be a TIMEOUT ERROR');
    }
    if (error.message?.includes('authentication')) {
      console.error('\n⚠ This appears to be an AUTHENTICATION ERROR');
    }
    if (error.message?.includes('ENOTFOUND')) {
      console.error('\n⚠ This appears to be a DNS/NETWORK ERROR');
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to save evaluation', 
        details: error.message,
        errorType: error.constructor.name,
        errorCode: error.code
      },
      { status: 500 }
    );
  }
}

// DELETE - Clear all evaluations
export async function DELETE() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  DELETE /api/evaluations REQUEST     ║');
  console.log('╚══════════════════════════════════════╝');
  
  try {
    console.log('→ Clearing all evaluations...');
    const { db } = await connectToDatabase();
    const result = await db.collection('evaluations').deleteMany({});

    console.log(`✓ Deleted ${result.deletedCount} evaluations`);
    return NextResponse.json({ 
      success: true, 
      message: 'All evaluations cleared',
      deletedCount: result.deletedCount 
    });
  } catch (error: any) {
    console.error('╔════════════════════════════════════╗');
    console.error('║ DELETE REQUEST ERROR               ║');
    console.error('╚════════════════════════════════════╝');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to clear evaluations', details: error.message },
      { status: 500 }
    );
  }
}