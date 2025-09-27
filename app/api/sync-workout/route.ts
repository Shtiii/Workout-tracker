import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkoutSession } from '@/types';

/**
 * API endpoint for syncing workout data from service worker
 * Handles both new workout creation and updates
 */
export async function POST(request: NextRequest) {
  try {
    const workoutData: WorkoutSession = await request.json();

    // Validate required fields
    if (!workoutData.exercises || !Array.isArray(workoutData.exercises)) {
      return NextResponse.json(
        { error: 'Invalid workout data: exercises array is required' },
        { status: 400 }
      );
    }

    // Check if workout already exists (by offlineId or id)
    const workoutId = workoutData.offlineId || workoutData.id;
    if (workoutId) {
      const existingQuery = query(
        collection(db, 'workoutSessions'),
        where('id', '==', workoutId)
      );
      const existingDocs = await getDocs(existingQuery);

      if (!existingDocs.empty) {
        // Update existing workout
        const existingDoc = existingDocs.docs[0];
        await updateDoc(doc(db, 'workoutSessions', existingDoc.id), {
          ...workoutData,
          syncedAt: new Date(),
          lastModified: new Date()
        });

        return NextResponse.json({
          success: true,
          action: 'updated',
          id: existingDoc.id,
          message: 'Workout updated successfully'
        });
      }
    }

    // Create new workout
    const docRef = await addDoc(collection(db, 'workoutSessions'), {
      ...workoutData,
      syncedAt: new Date(),
      createdAt: new Date(),
      lastModified: new Date()
    });

    return NextResponse.json({
      success: true,
      action: 'created',
      id: docRef.id,
      message: 'Workout synced successfully'
    });

  } catch (error) {
    console.error('Sync workout error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to sync workout',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for checking sync status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workoutId = searchParams.get('id');

    if (!workoutId) {
      return NextResponse.json(
        { error: 'Workout ID is required' },
        { status: 400 }
      );
    }

    const workoutQuery = query(
      collection(db, 'workoutSessions'),
      where('id', '==', workoutId)
    );
    const workoutDocs = await getDocs(workoutQuery);

    if (workoutDocs.empty) {
      return NextResponse.json({
        exists: false,
        message: 'Workout not found'
      });
    }

    const workout = workoutDocs.docs[0].data();
    return NextResponse.json({
      exists: true,
      syncedAt: workout.syncedAt,
      lastModified: workout.lastModified,
      message: 'Workout found'
    });

  } catch (error) {
    console.error('Check sync status error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check sync status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
