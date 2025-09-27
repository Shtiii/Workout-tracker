import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Program } from '@/types';

/**
 * API endpoint for syncing program data from service worker
 * Handles both new program creation and updates
 */
export async function POST(request: NextRequest) {
  try {
    const programData: Program = await request.json();

    // Validate required fields
    if (!programData.name || typeof programData.name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid program data: name is required' },
        { status: 400 }
      );
    }

    // Check if program already exists (by offlineId or id)
    const programId = programData.offlineId || programData.id;
    if (programId) {
      const existingQuery = query(
        collection(db, 'programs'),
        where('id', '==', programId)
      );
      const existingDocs = await getDocs(existingQuery);

      if (!existingDocs.empty) {
        // Update existing program
        const existingDoc = existingDocs.docs[0];
        await updateDoc(doc(db, 'programs', existingDoc.id), {
          ...programData,
          syncedAt: new Date(),
          lastModified: new Date()
        });

        return NextResponse.json({
          success: true,
          action: 'updated',
          id: existingDoc.id,
          message: 'Program updated successfully'
        });
      }
    }

    // Create new program
    const docRef = await addDoc(collection(db, 'programs'), {
      ...programData,
      syncedAt: new Date(),
      createdAt: new Date(),
      lastModified: new Date()
    });

    return NextResponse.json({
      success: true,
      action: 'created',
      id: docRef.id,
      message: 'Program synced successfully'
    });

  } catch (error) {
    console.error('Sync program error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to sync program',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for checking program sync status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('id');

    if (!programId) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    const programQuery = query(
      collection(db, 'programs'),
      where('id', '==', programId)
    );
    const programDocs = await getDocs(programQuery);

    if (programDocs.empty) {
      return NextResponse.json({
        exists: false,
        message: 'Program not found'
      });
    }

    const program = programDocs.docs[0].data();
    return NextResponse.json({
      exists: true,
      syncedAt: program.syncedAt,
      lastModified: program.lastModified,
      message: 'Program found'
    });

  } catch (error) {
    console.error('Check program sync status error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check program sync status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
