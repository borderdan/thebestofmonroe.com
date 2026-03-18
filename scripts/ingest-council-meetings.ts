/**
 * City of Monroe NC — Council Meeting Ingestion
 *
 * Pipeline:
 *   1. Fetch YouTube channel RSS feed for new videos
 *   2. Download audio via yt-dlp
 *   3. Upload to Gemini File API → transcribe + summarize
 *   4. Upsert to council_meetings table
 *
 * Requirements:
 *   - yt-dlp installed and on PATH
 *   - GEMINI_API_KEY in .env.local
 *   - NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage:
 *   npm run ingest:council-meetings
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// City of Monroe NC YouTube channel
// RSS feed: https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
// To find channel ID: visit https://www.youtube.com/@cityofmonroenc, view source, search "channelId"
const YOUTUBE_CHANNEL_ID = 'UCzrGKOKR72fmCEn7D0f9mlg'; // @cityofmonroenc
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;

// Only process videos whose titles suggest a council/board meeting
const MEETING_KEYWORDS = [
  'city council',
  'council meeting',
  'board meeting',
  'work session',
  'public hearing',
  'town hall',
  'planning board',
  'zoning board',
];

// Gemini 2.5 Flash: best free-tier model for audio — 250K TPM, 20 RPD on AI Studio free tier
const GEMINI_MODEL = process.env.GEMINI_TRANSCRIPTION_MODEL || 'gemini-2.5-flash';
const MAX_VIDEOS_PER_RUN = 2; // Avoid long runs; process in batches

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// RSS Parsing (lightweight XML — no heavy dep needed)
// ---------------------------------------------------------------------------

interface RSSVideo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
}

async function fetchNewVideos(): Promise<RSSVideo[]> {
  console.log(`Fetching RSS feed: ${RSS_URL}`);
  const res = await fetch(RSS_URL);
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();

  const videos: RSSVideo[] = [];
  // Simple regex-based XML parsing for YouTube RSS (Atom feed)
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] ?? '';
    const title = entry.match(/<title>(.*?)<\/title>/)?.[1] ?? '';
    const published = entry.match(/<published>(.*?)<\/published>/)?.[1] ?? '';
    const description = entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] ?? '';
    const thumbnail = entry.match(/<media:thumbnail[^>]+url="([^"]+)"/)?.[1] ?? '';

    if (videoId) {
      videos.push({
        videoId,
        title: decodeXMLEntities(title),
        description: decodeXMLEntities(description),
        publishedAt: published,
        thumbnailUrl: thumbnail,
      });
    }
  }

  console.log(`Found ${videos.length} videos in RSS feed`);
  return videos;
}

function decodeXMLEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function isMeetingVideo(title: string): boolean {
  const lower = title.toLowerCase();
  return MEETING_KEYWORDS.some((kw) => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// yt-dlp: Download audio only
// ---------------------------------------------------------------------------

function findBinary(name: string, knownPaths: string[]): string {
  try { execSync(`${name} --version`, { stdio: 'ignore' }); return name; } catch {}
  for (const p of knownPaths) {
    if (fs.existsSync(p)) return `"${p}"`;
  }
  throw new Error(`${name} not found. Install with: winget install ${name}`);
}

function findYtDlp(): string {
  return findBinary('yt-dlp', [
    'C:\\Users\\borde\\AppData\\Local\\Microsoft\\WinGet\\Packages\\yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe\\yt-dlp.exe',
  ]);
}

function findFfmpeg(): string {
  return findBinary('ffmpeg', [
    'C:\\Users\\borde\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe',
    'C:\\Users\\borde\\AppData\\Local\\Microsoft\\WinGet\\Packages\\yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-N-123074-g4e32fb4c2a-win64-gpl\\bin\\ffmpeg.exe',
  ]);
}

function isLiveStream(videoId: string, ytDlp: string): boolean {
  try {
    const output = execSync(
      `${ytDlp} --print is_live --no-warnings "${`https://www.youtube.com/watch?v=${videoId}`}"`,
      { encoding: 'utf8', timeout: 30_000, stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
    return output === 'True';
  } catch {
    return false;
  }
}

function downloadAudio(videoId: string): string {
  const tmpDir = os.tmpdir();
  const outputPath = path.join(tmpDir, `council-${videoId}.m4a`);

  if (fs.existsSync(outputPath)) {
    console.log(`  Audio already downloaded: ${outputPath}`);
    return outputPath;
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const ytDlp = findYtDlp();
  const ffmpeg = findFfmpeg();
  const ffmpegDir = path.dirname(ffmpeg.replace(/"/g, ''));

  console.log(`  Checking if live stream...`);
  if (isLiveStream(videoId, ytDlp)) {
    throw new Error('Video is a live stream — not yet available for download');
  }

  console.log(`  Downloading audio for ${videoId}...`);

  execSync(
    `${ytDlp} -f "bestaudio[ext=m4a]/bestaudio" --extract-audio --audio-format m4a --ffmpeg-location "${ffmpegDir}" -o "${outputPath}" "${url}"`,
    { stdio: 'inherit', timeout: 600_000 }
  );

  if (!fs.existsSync(outputPath)) {
    // yt-dlp sometimes adds extension — check for .m4a.m4a or similar
    const altPath = outputPath.replace('.m4a', '.m4a.m4a');
    if (fs.existsSync(altPath)) {
      fs.renameSync(altPath, outputPath);
    } else {
      throw new Error(`Audio file not found after download: ${outputPath}`);
    }
  }

  const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
  console.log(`  Downloaded: ${sizeMB} MB`);
  return outputPath;
}

// ---------------------------------------------------------------------------
// Gemini: Upload audio → Transcribe + Summarize
// ---------------------------------------------------------------------------

interface MeetingSummary {
  agenda_items: string[];
  decisions: string[];
  votes: { item: string; result: string; details: string }[];
  action_items: string[];
  public_comments_summary: string;
  key_highlights: string[];
}

interface TranscriptionResult {
  transcript: string;
  summary: MeetingSummary;
}

async function transcribeAndSummarize(audioPath: string, title: string): Promise<TranscriptionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const fileManager = new GoogleAIFileManager(apiKey);
  const genAI = new GoogleGenerativeAI(apiKey);

  // 1. Upload audio to Gemini File API
  console.log('  Uploading audio to Gemini File API...');
  const uploadResult = await fileManager.uploadFile(audioPath, {
    mimeType: 'audio/mp4',
    displayName: `council-meeting-${path.basename(audioPath)}`,
  });

  // 2. Wait for file processing
  let file = uploadResult.file;
  while (file.state === 'PROCESSING') {
    console.log('  Waiting for Gemini file processing...');
    await new Promise((r) => setTimeout(r, 10_000));
    file = await fileManager.getFile(file.name);
  }

  if (file.state === 'FAILED') {
    throw new Error('Gemini file processing failed');
  }

  console.log('  File ready. Running transcription + summarization...');

  // 3. Transcribe + Summarize in one call
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const result = await model.generateContent([
    {
      fileData: {
        mimeType: file.mimeType,
        fileUri: file.uri,
      },
    },
    {
      text: `You are a professional meeting minutes transcriber for the City of Monroe, North Carolina.

This audio is from: "${title}"

Please do TWO things:

## 1. TRANSCRIPT
Provide a complete, accurate transcript of the meeting. Include speaker identification where possible (e.g., "Mayor:", "Council Member:", "City Manager:", "Public Speaker:"). Keep it verbatim but clean up filler words.

## 2. SUMMARY
Provide a structured JSON summary with these fields:
- agenda_items: array of agenda items discussed
- decisions: array of decisions made
- votes: array of objects with { item, result, details } for each vote taken
- action_items: array of action items assigned
- public_comments_summary: brief summary of public comment period
- key_highlights: array of 5-10 most important takeaways

Format your response EXACTLY like this:

---TRANSCRIPT---
[full transcript here]
---SUMMARY---
[JSON summary here]`,
    },
  ]);

  const responseText = result.response.text();

  // 4. Parse the response
  const transcriptMatch = responseText.match(/---TRANSCRIPT---\s*([\s\S]*?)\s*---SUMMARY---/);
  const summaryMatch = responseText.match(/---SUMMARY---\s*([\s\S]*)/);

  const transcript = transcriptMatch?.[1]?.trim() ?? responseText;
  let summary: MeetingSummary;

  try {
    let summaryText = summaryMatch?.[1]?.trim() ?? '{}';
    // Strip markdown code fences if present
    summaryText = summaryText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    summary = JSON.parse(summaryText);
  } catch {
    console.warn('  Warning: Could not parse summary JSON, using defaults');
    summary = {
      agenda_items: [],
      decisions: [],
      votes: [],
      action_items: [],
      public_comments_summary: '',
      key_highlights: [],
    };
  }

  // 5. Clean up uploaded file
  try {
    await fileManager.deleteFile(file.name);
  } catch {
    // Non-critical
  }

  console.log(`  Transcript: ${transcript.length} chars, Summary: ${summary.agenda_items.length} agenda items`);
  return { transcript, summary };
}

// ---------------------------------------------------------------------------
// Main Pipeline
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Council Meeting Ingestion ===\n');

  const supabase = getSupabase();

  // 1. Get videos from RSS
  const allVideos = await fetchNewVideos();

  // 2. Filter to meeting-related videos
  const meetingVideos = allVideos.filter((v) => isMeetingVideo(v.title));
  console.log(`${meetingVideos.length} of ${allVideos.length} videos match meeting keywords\n`);

  if (meetingVideos.length === 0) {
    console.log('No new meeting videos found. Checking if any are unfiltered...');
    // Log all titles for debugging
    allVideos.forEach((v) => console.log(`  - ${v.title}`));
    return;
  }

  // 3. Check which are already in DB
  const videoIds = meetingVideos.map((v) => v.videoId);
  const { data: existing } = await supabase
    .from('council_meetings')
    .select('youtube_video_id')
    .in('youtube_video_id', videoIds);

  const existingIds = new Set((existing ?? []).map((r: { youtube_video_id: string }) => r.youtube_video_id));
  const newVideos = meetingVideos.filter((v) => !existingIds.has(v.videoId));
  console.log(`${newVideos.length} new meetings to process (${existingIds.size} already in DB)\n`);

  // 4. Process up to MAX_VIDEOS_PER_RUN
  const toProcess = newVideos.slice(0, MAX_VIDEOS_PER_RUN);
  let successCount = 0;

  for (const video of toProcess) {
    console.log(`\nProcessing: ${video.title}`);
    console.log(`  Video ID: ${video.videoId}`);
    console.log(`  Published: ${video.publishedAt}`);

    // Insert as pending
    const { error: insertError } = await supabase.from('council_meetings').upsert(
      {
        youtube_video_id: video.videoId,
        title: video.title,
        description: video.description,
        published_at: video.publishedAt,
        youtube_url: `https://www.youtube.com/watch?v=${video.videoId}`,
        thumbnail_url: video.thumbnailUrl,
        status: 'processing',
      },
      { onConflict: 'youtube_video_id' }
    );

    if (insertError) {
      console.error(`  DB insert error: ${insertError.message}`);
      continue;
    }

    let audioPath: string | null = null;

    try {
      // Download audio (throws if live stream)
      audioPath = downloadAudio(video.videoId);

      // Transcribe + Summarize
      const { transcript, summary } = await transcribeAndSummarize(audioPath, video.title);

      // Update DB with results
      const { error: updateError } = await supabase
        .from('council_meetings')
        .update({
          transcript,
          summary,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('youtube_video_id', video.videoId);

      if (updateError) throw updateError;

      console.log(`  ✓ Completed successfully`);
      successCount++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const isLive =
        errorMsg.includes('live event will begin') ||
        errorMsg.includes('This live event') ||
        errorMsg.includes('live stream');

      if (isLive) {
        console.log(`  ⏳ Skipping — live stream not yet available`);
        // Remove the pending record so it's retried next run
        await supabase
          .from('council_meetings')
          .delete()
          .eq('youtube_video_id', video.videoId);
        continue;
      }

      console.error(`  ✗ Failed: ${errorMsg}`);
      await supabase
        .from('council_meetings')
        .update({
          status: 'failed',
          error_message: errorMsg,
          updated_at: new Date().toISOString(),
        })
        .eq('youtube_video_id', video.videoId);
    } finally {
      // Clean up temp audio file
      if (audioPath && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
        console.log('  Cleaned up temp audio file');
      }
    }
  }

  console.log(`\n=== Done: ${successCount}/${toProcess.length} meetings processed ===`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
