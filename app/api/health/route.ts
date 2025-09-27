import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

/**
 * Health check endpoint for service worker and application monitoring
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check Firebase connection
    let firebaseStatus = 'unknown';
    try {
      // Simple Firebase connectivity test
      if (db) {
        firebaseStatus = 'connected';
      } else {
        firebaseStatus = 'disconnected';
      }
    } catch (error) {
      firebaseStatus = 'error';
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        firebase: firebaseStatus,
        api: 'healthy'
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        services: {
          firebase: 'error',
          api: 'error'
        }
      },
      { status: 503 }
    );
  }
}

/**
 * POST endpoint for service worker to report status
 */
export async function POST(request: NextRequest) {
  try {
    const statusData = await request.json();
    
    // Log service worker status for monitoring
    console.log('Service Worker Status:', {
      timestamp: new Date().toISOString(),
      ...statusData
    });

    return NextResponse.json({
      success: true,
      message: 'Status received',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Service worker status error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
