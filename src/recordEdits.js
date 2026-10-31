import { persistReport, reportArrays } from './jacketWorkflow.js';
export async function updateRecord(client, table, id, payload) {
  if (id === undefined || id === null || id === '') throw new Error('Record ID is missing');
  const {
    data,
    error
  } = await client.from(table).update(payload).eq('id', id).select().single();
  if (error) throw error;
  if (!data) throw new Error('The changes were not saved');
  return data;
}
export function jacketErrorPatch(record, form, orderJackets, by, now = new Date().toISOString()) {
  const count = Number(form.affected_jackets);
  if (!Number.isInteger(count) || count < 1 || count > Number(orderJackets)) throw new Error(`عدد الجاكيتات المتأثرة / Affected jackets: 1–${orderJackets}`);
  // Old installations stored the count in notes. Keep it in sync so reloads
  // cannot resurrect the previous count, and preserve every ordinary note.
  const stored = reportArrays(record);
  const notes = stored.notes.map(n => n.type === 'affected_jackets' ? {
    ...n,
    value: count,
    by,
    at: now
  } : n);
  const history = [...stored.history, {
    type: 'edit',
    status: Number(form.status ?? record.status),
    by,
    at: now,
    note: 'تصحيح بيانات البلاغ / Report corrected',
    before: {
      order_id: record.order_id,
      jacket_owner: record.jacket_owner,
      jacket_type: record.jacket_type,
      jacket_size: record.jacket_size,
      affected_jackets: record.affectedJackets ?? record.affected_jackets,
      error_description: record.error_description,
      error_image_url: record.error_image_url,
      status: record.status
    }
  }];
  return {
    ...form,
    affected_jackets: count,
    status: Number(form.status ?? record.status),
    notes: JSON.stringify(notes),
    status_history: JSON.stringify(history),
    updated_at: now
  };
}
export async function saveJacketCorrection(client, record, form, orderJackets, by) {
  const patch = jacketErrorPatch(record, form, orderJackets, by);
  let data;
  try {
    data = await persistReport(client, record, patch);
  } catch (error) {
    if (!['PGRST204', '42703'].includes(error.code) || !String(error.message).includes('affected_jackets')) throw error;
    const legacy = {
      ...patch
    };
    delete legacy.affected_jackets;
    const notes = JSON.parse(patch.notes).filter(n => n.type !== 'affected_jackets');
    legacy.notes = JSON.stringify([...notes, {
      type: 'affected_jackets',
      value: patch.affected_jackets,
      by,
      at: patch.updated_at
    }]);
    data = await persistReport(client, record, legacy);
  }
  const parse = value => typeof value === 'string' ? JSON.parse(value) : value || [];
  return {
    ...data,
    affectedJackets: patch.affected_jackets,
    notes: parse(data.notes),
    statusHistory: parse(data.status_history)
  };
}
export async function saveJacketNoteEdit(client, record, index, text, by, now = new Date().toISOString()) {
  const stored = reportArrays(record);
  if (!text.trim() || !Number.isInteger(index) || !stored.notes[index] || ['workflow', 'affected_jackets', 'original_date_unknown','contact','merge'].includes(stored.notes[index].type)) throw new Error('Invalid note edit');
  const original = stored.notes[index];
  const notes = stored.notes.map((note, i) => i === index ? {
    ...note,
    text: text.trim(),
    edited_by: by,
    edited_at: now
  } : note);
  const history = [...stored.history, {
    type: 'note_edit',
    by,
    at: now,
    note: 'تم تصحيح ملاحظة / Note corrected',
    before: {
      index,
      text: original.text,
      by: original.by,
      at: original.at
    }
  }];
  return persistReport(client, record, {
    notes: JSON.stringify(notes),
    status_history: JSON.stringify(history),
    updated_at: now
  });
}
