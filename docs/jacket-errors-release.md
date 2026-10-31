# Jacket error workflow release

## Data compatibility and safety

- Reports stay in `jacket_errors`; no existing report, order, note, image link, or history is migrated or deleted. Workflow snapshots are tagged entries inside existing notes. Original JSON representation is retained when loading.
- Legacy report statuses and order sub-statuses are classified at display time. Conflicts remain in follow-up until explicitly confirmed. Orders without detailed reports remain visible with an unknown registration date.
- `content_fingerprint` is an additive, database-generated comparison token over notes and status history. Save operations match both this token and the original `updated_at`, preventing stale clients of the new UI from overwriting changes. Large image contents are never placed in update filter URLs.
- Every current report-writing path, including admin corrections and note edits, advances `updated_at`. The editor retains the snapshot from opening time. On conflict or failed save, the draft stays open; refresh and reconcile before retrying.
- Raw notes/history that cannot be decoded are preserved and cannot be overwritten by these editors. Notes retain original authorship and images; corrections record the previous text in history.
- Date/quantity validation, explicit resolved state, required hold/rejection reasons, and UI permission checks remain in place. Database policies and login behavior are unchanged. Existing older browser tabs should reload after release; legacy code itself cannot acquire the new client's stale-write protection.
- Uploaded images are resized to 1200px and stored under existing report access rules; at most six images are accepted per attachment action. Existing external image URLs remain supported.
- If orders or reports cannot load, report operations are disabled with a retry prompt. The app no longer shows seeded sample orders when the production order query is empty or fails.

## Verification

- Full release test suite, production build, targeted ESLint, and whitespace checks.
- Tests cover classification/conflicts, independent reports, filters, count compatibility, permission/zero-row errors, malformed data, stale writes, note corrections, attachment preservation, and bounded filters with large images.
- Browser checks use disposable in-memory fixtures, including Arabic/English, mobile layout, minimal registration, required hold reason, note creation, attachments, and enlarged gallery view. No business records are edited by UI tests.
- Read-only production compatibility check: 268 orders, 17 detailed reports, 25 displayed cases including order-only cases. All 17 reports decode and have valid comparison tokens. API filter matching was verified using the same publishable client as the app.
- Content fingerprints before/after the additive migration matched exactly (excluding the new generated field). Supabase security advisors returned no findings.

## Deployment and rollback

Deploy only the reviewed release files through the existing GitHub → Cloudflare Pages integration. Exclude unrelated local design previews and keyboard work. Verify the Cloudflare check for the exact commit and confirm the deployed asset contains the workflow.

To roll back the UI, redeploy the previous known-good commit `4a0b3e570f7bf632987557d81bddacc9c22c539a` (or the immediate preceding production commit if another release happens first). Keep the additive fingerprint column and all saved report data; do not delete workflow metadata or images. No data rollback is required for a UI rollback.
