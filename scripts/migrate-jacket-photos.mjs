// Run only after the storage migration and compatible UI are deployed.
// Default is read-only inventory. --apply requires a private backup directory.
import { createClient } from '@supabase/supabase-js';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { uploadPhoto, transformPhotos } from '../src/photoStorage.js';
const config = await readFile(new URL('../src/supabase.js', import.meta.url), 'utf8');
const projectUrl = config.match(/https:\/\/[a-z]+\.supabase\.co/)[0];
const key = process.env.SUPABASE_MIGRATION_KEY || config.match(/sb_publishable_[A-Za-z0-9_-]+/)[0];
const client = createClient(projectUrl, key, { auth: { persistSession: false } });
const apply = process.argv.includes('--apply');
const backupArg = process.argv.find(arg => arg.startsWith('--backup='))?.slice(9);
if (apply && !backupArg) throw new Error('--backup=/private/path is required');
const backup = backupArg && resolve(backupArg);
if (backup) await mkdir(backup, { recursive: true, mode: 0o700 });
const counts = { reports: 0, references: 0, uniqueImages: 0, imageBytes: 0, migrated: 0 };
const unique = new Set();
const { data: rows, error } = await client.from('jacket_errors').select('*').order('id');
if (error) throw error;
// Save the complete original before any uploads or database updates.
if (apply) await writeFile(join(backup, 'original-reports.json'), JSON.stringify(rows), { mode: 0o600, flag: 'wx' });
for (const row of rows) {
  const patch = { notes: row.notes, status_history: row.status_history, error_image_url: row.error_image_url };
  let occurrences = 0;
  await transformPhotos(patch, async url => {
    if (/^data:image\/(jpeg|png|webp);base64,/i.test(url)) {
      occurrences++; counts.references++;
      if (!unique.has(url)) { unique.add(url); counts.imageBytes += Buffer.from(url.split(',')[1], 'base64').length; }
    }
    return url;
  });
  if (!occurrences) continue;
  counts.reports++;
  if (!apply) continue;
  const migrated = await transformPhotos(patch, url => uploadPhoto(client, url));
  let update = client.from('jacket_errors').update(migrated).eq('id', row.id).eq('content_fingerprint', row.content_fingerprint);
  update = row.updated_at ? update.eq('updated_at', row.updated_at) : update.is('updated_at', null);
  const result = await update.select('id,content_fingerprint,notes,status_history,error_image_url').single();
  if (result.error) throw new Error(`Report ${row.id}: update failed; originals retained in backup. ${result.error.message}`);
  for (const field of Object.keys(patch)) if (JSON.stringify(result.data[field]) !== JSON.stringify(migrated[field])) throw new Error(`Report ${row.id}: readback mismatch`);
  await writeFile(join(backup, `migrated-${row.id}.json`), JSON.stringify({ id: row.id, content_fingerprint: result.data.content_fingerprint }), { mode: 0o600, flag: 'wx' });
  counts.migrated++;
}
counts.uniqueImages = unique.size;
console.log(JSON.stringify({ mode: apply ? 'applied' : 'read-only', ...counts }));
