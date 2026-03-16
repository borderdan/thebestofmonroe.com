import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { upsertCommunityUpdate, logIngestion } from '../src/lib/community/ingestion';

const API_BASE = 'https://linc.osbm.nc.gov/api/explore/v2.1/catalog/datasets';
const AREA_NAME = 'Union County';

async function fetchLincData(dataset: string, where: string) {
    // Manually construct for LINC'S picky ODSQL
    const encodedWhere = where.replace(/ /g, '%20').replace(/'/g, "%27");
    const url = `${API_BASE}/${dataset}/records?where=${encodedWhere}&order_by=${dataset.includes('labor') ? 'date' : 'year'}%20desc&limit=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`LINC API Error: ${res.status} ${res.statusText}`);
    return await res.json();
}

async function ingestLaborForce() {
    console.log("Fetching Labor Force stats for Union County...");
    try {
        const data = await fetchLincData('monthly-labor-force-linc', `area_name='${AREA_NAME}'`);
        const latest = data.results?.[0];

        if (latest) {
            // Find employment record specifically
            const employedRec = data.results.find((r: any) => r.variable === 'Monthly Employment (Place of Residence)');

            const description = `The latest economic data for ${AREA_NAME} shows ${employedRec?.value.toLocaleString()} residents employed as of ${latest.date}.`;
            
            await upsertCommunityUpdate({
                source_id: `linc-labor-${latest.date}`,
                type: 'event',
                title: `Economy: ${AREA_NAME} Labor Snapshot`,
                description,
                severity: 'low',
                location_name: AREA_NAME,
                event_time: new Date(`${latest.date}-01`).toISOString(),
                raw_data: latest
            });
            console.log("Labor force data ingested.");
        }
        await logIngestion('NC LINC Economy', 'success', 'Ingested labor force data', 1);
    } catch (err: any) {
        console.error("Labor force ingestion failed:", err);
        await logIngestion('NC LINC Economy', 'failure', err.message);
    }
}

async function ingestIncome() {
    console.log("Fetching Income stats for Union County...");
    try {
        // Median Household Income is a high-level stat
        const data = await fetchLincData('employment-and-income-linc', `area_name='${AREA_NAME}' AND variable='Median Household Income'`);
        const latest = data.results?.[0];

        if (latest) {
            await upsertCommunityUpdate({
                source_id: `linc-income-${latest.year}`,
                type: 'event',
                title: `Economy: ${AREA_NAME} Income Data`,
                description: `Latest reported Median Household Income: $${latest.value.toLocaleString()} (${latest.year})`,
                severity: 'low',
                location_name: AREA_NAME,
                event_time: new Date(`${latest.year}-01-01`).toISOString(),
                raw_data: latest
            });
            console.log("Income data ingested.");
        } else {
            console.log("No income data found for the current filter.");
        }
    } catch (err: any) {
        console.error("Income ingestion failed:", err);
    }
}

async function run() {
    await ingestLaborForce();
    await ingestIncome();
}

run().catch(console.error);
