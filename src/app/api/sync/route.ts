import { NextRequest, NextResponse } from 'next/server';
import { scrapeAllPages } from '@/lib/scraper';
import { embedAndStore } from '@/lib/embeddings';

const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * POST /api/sync
 * Scrapes all weiblocks.io pages, embeds them with Google text-embedding-004,
 * and upserts the chunks into MongoDB.
 *
 * Protected by a secret token to prevent unauthorized re-syncs.
 *
 * Usage:
 *   curl -X POST https://your-domain.com/api/sync \
 *        -H "Authorization: Bearer YOUR_SYNC_SECRET"
 *
 * WordPress auto-sync (add to functions.php):
 *   add_action('save_post', function($post_id) {
 *     if (get_post_status($post_id) === 'publish') {
 *       wp_remote_post('https://your-domain.com/api/sync', [
 *         'headers' => ['Authorization' => 'Bearer YOUR_SYNC_SECRET'],
 *         'blocking' => false,
 *       ]);
 *     }
 *   });
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // ── Auth check ────────────────────────────────────────────────────────────
  const syncSecret = process.env.SYNC_SECRET;
  if (syncSecret) {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (token !== syncSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }
  }

  try {
    console.log('[sync] Starting website sync...');

    // Step 1: Scrape all pages
    const pages = await scrapeAllPages();
    if (pages.length === 0) {
      return NextResponse.json(
        { error: 'No pages scraped — check if weiblocks.io is accessible' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Step 2: Embed + store in MongoDB
    const { stored, pages: pageCount } = await embedAndStore(pages);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`[sync] Complete: ${stored} chunks from ${pageCount} pages in ${duration}s`);

    return NextResponse.json(
      {
        success: true,
        pages: pageCount,
        chunks: stored,
        duration: `${duration}s`,
        syncedAt: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error('[sync] Error:', err);
    return NextResponse.json(
      { error: 'Sync failed', details: String(err) },
      { status: 500, headers: corsHeaders }
    );
  }
}
