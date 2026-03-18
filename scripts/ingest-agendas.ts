/**
 * City of Monroe NC — Agenda & Minutes Ingestion
 *
 * Source: CivicClerk public API (monroenc.api.civicclerk.com)
 * Fetches meeting events, downloads agenda PDFs, summarizes with Gemini.
 *
 * Usage: npm run ingest:agendas
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const API_BASE = 'https://monroenc.api.civicclerk.com/v1';
const FILE_BASE = 'https://monroenc.portal.civicclerk.com';
const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_PER_RUN = 3;

type CivicFile = { id: number; fileId: number; url: string; type: string; name: string; publishOn: string; fileType: number };

type CivicEvent = {
  id: number;
  eventName: string;
  eventDescription: string;
  categoryName: string;
  startDateTime: string;
  eventDate: string;
  youtubeVideoId: string | null;
  publishedFiles: CivicFile[];
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

async function fetchRecentEvents(limit = 50): Promise<CivicEvent[]> {
  const today = new Date().toISOString().split('T')[0];
  const url = `${API_BASE}/Events?$filter=startDateTime+lt+${today}&$orderby=startDateTime+desc&$top=${limit}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`CivicClerk API error: ${res.status}`);
  const data = await res.json();
  return (data.value ?? []) as CivicEvent[];
}

async function summarizeWithGemini(
  pdfUrl: string,
  title: string
): Promise<{ summary: object; status: 'completed' | 'failed'; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { summary: {}, status: 'failed', error: 'No GEMINI_API_KEY' };

  const fileManager = new GoogleAIFileManager(apiKey);
  const genAI = new GoogleGenerativeAI(apiKey);
  const tmpPath = path.join(os.tmpdir(), `agenda-${Date.now()}.pdf`);

  try {
    const res = await fetch(pdfUrl, { headers: { 'User-Agent': 'TheBestOfMonroe/1.0' } });
    if (!res.ok) return { summary: {}, status: 'failed', error: `PDF download failed: ${res.status} ${pdfUrl}` };
    const buf = await res.arrayBuffer();
    fs.writeFileSync(tmpPath, Buffer.from(buf));

    const upload = await fileManager.uploadFile(tmpPath, { mimeType: 'application/pdf', displayName: title });
    let file = upload.file;
    while (file.state === 'PROCESSING') {
      await new Promise((r) => setTimeout(r, 5_000));
      file = await fileManager.getFile(file.name);
    }
    if (file.state === 'FAILED') return { summary: {}, status: 'failed', error: 'Gemini file processing failed' };

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent([
      { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
      {
        text: `This is a City of Monroe, NC government meeting document titled "${title}".

Extract and return a JSON object with:
- meeting_body: name of the governing body (e.g. "City Council", "Planning Board")
- meeting_date: date in YYYY-MM-DD format
- agenda_items: array of agenda item titles/descriptions
- key_decisions: array of decisions made
- votes: array of {item, result, vote_count} for any votes recorded
- action_items: array of follow-up items assigned
- key_highlights: array of 5 most important takeaways for residents
- public_comments: brief summary of any public comment period

Return only valid JSON.`,
      },
    ]);

    const text = result.response.text().trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const summary = JSON.parse(text);
    try { await fileManager.deleteFile(file.name); } catch {}
    return { summary, status: 'completed' };
  } catch (err) {
    return { summary: {}, status: 'failed', error: err instanceof Error ? err.message : String(err) };
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
}

async function main() {
  console.log('=== City Agendas Ingestion (CivicClerk) ===\n');
  const supabase = getSupabase();

  console.log('Fetching recent events from CivicClerk API...');
  const events = await fetchRecentEvents(50);
  console.log(`Found ${events.length} events`);

  // Find events that have published agenda/minutes PDFs
  const docsToProcess: {
    sourceId: string; title: string; date: string; body: string;
    pdfUrl: string; type: 'agenda' | 'minutes'; youtubeId: string | null;
  }[] = [];

  for (const event of events) {
    const files = event.publishedFiles ?? [];
    for (const file of files) {
      if (!file.url?.includes('.pdf')) continue;
      const fileType = file.type?.toLowerCase();
      const isMinutes = fileType?.includes('minute') || file.name?.toLowerCase().includes('minute');
      const type: 'agenda' | 'minutes' = isMinutes ? 'minutes' : 'agenda';

      // Build full PDF URL using GetMeetingFileStream endpoint (requires fileId)
      const pdfUrl = file.fileId
        ? `${API_BASE}/Meetings/GetMeetingFileStream(fileId=${file.fileId},plainText=false)`
        : (file.url.startsWith('http') ? file.url : `${FILE_BASE}/${file.url}`);
      const sourceId = Buffer.from(`${event.id}-${file.url}`).toString('base64').slice(0, 60);

      docsToProcess.push({
        sourceId,
        title: `${event.eventName} — ${file.name || file.type}`,
        date: event.startDateTime || event.eventDate,
        body: event.categoryName || event.eventName,
        pdfUrl,
        type,
        youtubeId: event.youtubeVideoId || null,
      });
    }
  }

  console.log(`${docsToProcess.length} documents with PDFs found`);

  // Check which are already processed
  const sourceIds = docsToProcess.map((d) => d.sourceId);
  const { data: existing } = await supabase
    .from('city_agendas')
    .select('source_id, status')
    .in('source_id', sourceIds);
  const doneIds = new Set((existing ?? []).filter((r: { status: string }) => r.status === 'completed').map((r: { source_id: string }) => r.source_id));

  const newDocs = docsToProcess.filter((d) => !doneIds.has(d.sourceId)).slice(0, MAX_PER_RUN);
  console.log(`${newDocs.length} new documents to process\n`);

  for (const doc of newDocs) {
    console.log(`Processing: ${doc.title}`);

    let meetingDate = doc.date;
    try { meetingDate = new Date(doc.date).toISOString().split('T')[0]; } catch {}

    await supabase.from('city_agendas').upsert({
      source_id: doc.sourceId,
      title: doc.title,
      meeting_date: meetingDate,
      meeting_body: doc.body,
      document_url: doc.pdfUrl,
      document_type: doc.type,
      status: 'processing',
    }, { onConflict: 'source_id' });

    const { summary, status, error } = await summarizeWithGemini(doc.pdfUrl, doc.title);

    const summaryDate = (summary as { meeting_date?: string }).meeting_date;
    if (summaryDate) {
      try { meetingDate = new Date(summaryDate).toISOString().split('T')[0]; } catch {}
    }

    await supabase.from('city_agendas').update({
      summary: status === 'completed' ? summary : null,
      status,
      error_message: error,
      meeting_date: meetingDate,
      updated_at: new Date().toISOString(),
    }).eq('source_id', doc.sourceId);

    console.log(`  ${status === 'completed' ? '✓' : '✗'} ${status}${error ? ': ' + error.substring(0, 200) : ''}`);
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);
