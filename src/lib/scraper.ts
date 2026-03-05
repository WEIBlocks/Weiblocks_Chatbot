import * as cheerio from 'cheerio';

// WordPress sitemaps — all sub-sitemaps are discovered from the index
const SITEMAP_URLS = [
  'https://weiblocks.io/sitemap.xml',        // sitemap index (links to sub-sitemaps)
  'https://weiblocks.io/sitemap-misc.xml',
  'https://weiblocks.io/page-sitemap.xml',
  'https://weiblocks.io/post-sitemap.xml',
];

// URLs to skip (utility/system pages that add no useful content)
const SKIP_PATTERNS = [
  /\/wp-json\//,
  /\/wp-admin\//,
  /\/feed\//,
  /\/xmlrpc/,
  /\?/,
];

export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
}

/** Fetch one sitemap XML and return all <loc> URLs inside it */
async function parseSitemap(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WeiblocksChatbot/1.0 (content-sync)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.warn(`[scraper] Sitemap fetch failed (${res.status}): ${url}`);
      return [];
    }

    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const locs: string[] = [];

    $('loc').each((_, el) => {
      locs.push($(el).text().trim());
    });

    return locs;
  } catch (err) {
    console.warn(`[scraper] Error parsing sitemap ${url}:`, err);
    return [];
  }
}

/**
 * Discover all page URLs from the WordPress sitemaps.
 * Handles both sitemap indexes (which link to child sitemaps) and regular sitemaps.
 */
async function discoverUrls(): Promise<string[]> {
  const seen = new Set<string>();
  const pageUrls: string[] = [];

  for (const sitemapUrl of SITEMAP_URLS) {
    const locs = await parseSitemap(sitemapUrl);

    for (const loc of locs) {
      // If a <loc> points to another sitemap XML, recurse into it
      if (loc.endsWith('.xml') && !seen.has(loc)) {
        seen.add(loc);
        const childLocs = await parseSitemap(loc);
        for (const childLoc of childLocs) {
          if (!childLoc.endsWith('.xml') && !seen.has(childLoc)) {
            seen.add(childLoc);
            if (!SKIP_PATTERNS.some(p => p.test(childLoc))) {
              pageUrls.push(childLoc);
            }
          }
        }
      } else if (!loc.endsWith('.xml') && !seen.has(loc)) {
        seen.add(loc);
        if (!SKIP_PATTERNS.some(p => p.test(loc))) {
          pageUrls.push(loc);
        }
      }
    }
  }

  return pageUrls;
}

/** Fetch one page and extract clean text */
async function scrapePage(url: string): Promise<ScrapedPage | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WeiblocksChatbot/1.0 (content-sync)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove noise: nav, footer, scripts, styles, cookie banners, CTAs
    $('nav, footer, script, style, noscript, iframe, [class*="cookie"], [id*="cookie"], [class*="banner"], [class*="popup"]').remove();

    const title = $('title').text().trim() || $('h1').first().text().trim() || url;

    // Extract meaningful text: headings + paragraphs + list items
    const parts: string[] = [];

    $('h1, h2, h3, h4, p, li, td, th, blockquote').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.length > 30) parts.push(text); // skip very short fragments
    });

    const content = parts.join('\n').slice(0, 12000); // cap at 12K chars per page
    if (content.length < 100) return null; // skip empty pages

    return { url, title, content };
  } catch (err) {
    console.warn(`[scraper] Failed to scrape ${url}:`, err);
    return null;
  }
}

/** Discover all pages from sitemaps and scrape them */
export async function scrapeAllPages(): Promise<ScrapedPage[]> {
  console.log('[scraper] Discovering pages from sitemaps...');
  const urls = await discoverUrls();
  console.log(`[scraper] Found ${urls.length} pages to scrape`);

  const results: ScrapedPage[] = [];

  // Scrape in batches of 5 to avoid hammering the server
  for (let i = 0; i < urls.length; i += 5) {
    const batch = urls.slice(i, i + 5);
    const settled = await Promise.allSettled(batch.map(scrapePage));
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value);
    }
    // Small pause between batches
    if (i + 5 < urls.length) await new Promise(r => setTimeout(r, 500));
  }

  console.log(`[scraper] Scraped ${results.length}/${urls.length} pages successfully`);
  return results;
}

/** Split a page's text into overlapping chunks of ~400 tokens (~1600 chars) */
export function chunkText(text: string, chunkSize = 1600, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 80) chunks.push(chunk);
    start += chunkSize - overlap;
  }

  return chunks;
}
