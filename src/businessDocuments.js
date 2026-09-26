export const DOCUMENT_DEFAULTS = {
  seller: 'BLOZA FIRST LINE GARMENT TRADING L.L.C\nAJMAN, UNITED ARAB EMIRATES',
  buyer: 'SULTAN ALJAHDHAMI PROJECTS\nSULTANATE OF OMAN',
  company: 'Sultan Aljahdhami Projects',
  registration: '1595371',
  address: 'Alamirat, Muscat, Oman',
  phone: '92266597',
  signatory: 'SULTAN MOHAMMED ALJAHDHAMI',
};
export const titleFor = type => type === 'quotation' ? 'Quotation' : 'Invoice';
export const digitsFor = currency => currency === 'OMR' ? 3 : 2;
export const money = (amount, currency) => `${currency} ${Number(amount).toLocaleString('en-US', {minimumFractionDigits: digitsFor(currency), maximumFractionDigits: digitsFor(currency)})}`;
export function newDocument(type = 'quotation') {
  const id = crypto.randomUUID();
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  return {id, type, number: `${type === 'quotation' ? 'QUO' : 'INV'}-${date.replaceAll('-','')}-${id.slice(0,8).toUpperCase()}`, date, currency: 'OMR', ...DOCUMENT_DEFAULTS,
    items: [{id: crypto.randomUUID(), description: 'JACKETS', quantity: '', unitPrice: ''}], vatRate: '0', notes: ''};
}
export function totalsFor(doc) {
  const factor = 10 ** digitsFor(doc.currency);
  const lineMinor = doc.items.map(item => Math.round((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) * factor));
  const subtotalMinor = lineMinor.reduce((sum, value) => sum + value, 0);
  const vatMinor = Math.round(subtotalMinor * (Number(doc.vatRate) || 0) / 100);
  return {lines: lineMinor.map(value => value / factor), subtotal: subtotalMinor / factor, vat: vatMinor / factor, total: (subtotalMinor + vatMinor) / factor};
}
export function validateDocument(doc) {
  if (!['invoice','quotation'].includes(doc.type) || !['AED','OMR'].includes(doc.currency)) return 'Choose a document type and currency.';
  if (!doc.number.trim() || doc.number.length > 70) return 'Enter a document number (up to 70 characters).';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(doc.date) || Number.isNaN(Date.parse(doc.date)) || new Date(doc.date).toISOString().slice(0,10) !== doc.date) return 'Enter a valid date.';
  for (const key of ['seller','buyer','company','registration','address','phone','signatory']) {
    if (!doc[key]?.trim()) return 'Complete the seller, buyer and company details.';
    if (doc[key].length > (['seller','buyer'].includes(key)?500:100)) return 'Seller and buyer details must be at most 500 characters; company fields at most 100.';
  }
  if (!doc.items.length) return 'Add at least one item.';
  for (const item of doc.items) {
    if (!item.description.trim() || item.description.length > 1500) return 'Enter an item description (up to 1,500 characters).';
    if (String(item.quantity).trim() === '' || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0 || Number(item.quantity) > 1000000) return 'Enter a whole quantity between 1 and 1,000,000 for every item.';
    if (String(item.unitPrice).trim() === '' || !Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) < 0 || Number(item.unitPrice) > 1000000) return 'Enter a unit price between 0 and 1,000,000 for every item.';
    if (!new RegExp(`^\\d+(?:\\.\\d{1,${digitsFor(doc.currency)}})?$`).test(String(Number(item.unitPrice)))) return `Unit prices in ${doc.currency} support up to ${digitsFor(doc.currency)} decimal places.`;
  }
  if (String(doc.vatRate).trim() === '' || !Number.isFinite(Number(doc.vatRate)) || Number(doc.vatRate) < 0 || Number(doc.vatRate) > 100) return 'Enter a VAT percentage between 0 and 100.';
  if (doc.notes.length > 3000) return 'Notes must be 3,000 characters or fewer.';
  if (!Number.isSafeInteger(Math.round(totalsFor(doc).total * 10 ** digitsFor(doc.currency)))) return 'The total is too large.';
  return '';
}
// Local persistence avoids exposing documents through the application's legacy
// anonymous database access. Each document has its own key and revision.
const STORAGE_PREFIX = 'thawb_business_document_v1:';
export function listDocuments(storage) {
  const rows=[];
  for(let i=0;i<storage.length;i++) {
    const key=storage.key(i);
    if(!key?.startsWith(STORAGE_PREFIX))continue;
    const row=JSON.parse(storage.getItem(key));
    if(!row?.document || row.id!==row.document.id || validateDocument(row.document)) throw new Error('A saved document could not be read. Your saved data has been kept.');
    rows.push(row);
  }
  return rows.sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
}
export function saveDocument(storage, doc, version, createdBy) {
  const invalid=validateDocument(doc);
  if(invalid)throw new Error(invalid);
  const rows=listDocuments(storage);
  const existing=rows.find(row=>row.id===doc.id);
  if((existing?.version||null)!==version) throw new Error('This document changed in another tab. Reopen the saved document before editing.');
  const number=doc.number.trim();
  if(rows.some(row=>row.id!==doc.id && row.type===doc.type && row.number===number)) throw new Error('This document number already exists. Choose another number.');
  const now=new Date().toISOString();
  const row={id:doc.id,type:doc.type,number,document:{...doc,number},version:(version||0)+1,created_by:existing?.created_by||createdBy,created_at:existing?.created_at||now,updated_at:now};
  storage.setItem(STORAGE_PREFIX+doc.id,JSON.stringify(row));
  return row;
}
