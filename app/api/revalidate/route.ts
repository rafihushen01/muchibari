import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * On-demand revalidation endpoint for ISR
 * Called by the backend when products, categories, or banners are updated
 * 
 * Usage:
 * POST /api/revalidate
 * Headers: { 'Content-Type': 'application/json' }
 * Body: { secret: "REVALIDATE_SECRET", paths: ["/"] }
 */
export async function POST(request: NextRequest) {
  try {
    const { secret, paths = ['/'] } = await request.json()

    // Verify the secret token for security
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
    }

    // Revalidate the specified paths
    if (!Array.isArray(paths)) {
      return NextResponse.json(
        { message: 'Paths must be an array' },
        { status: 400 }
      )
    }

    for (const path of paths) {
      if (typeof path !== 'string') {
        return NextResponse.json(
          { message: 'Each path must be a string' },
          { status: 400 }
        )
      }
      revalidatePath(path)
    }

    console.log(`[ISR] Revalidated paths: ${paths.join(', ')}`)

    return NextResponse.json(
      {
        revalidated: true,
        message: `Successfully revalidated ${paths.length} path(s)`,
        paths,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[ISR] Revalidation error:', error)
    return NextResponse.json(
      { message: 'Revalidation failed' },
      { status: 500 }
    )
  }
}
