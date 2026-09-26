import {useEffect, useRef, useState} from 'react';
import {hasPermission} from './permissions';
import {digitsFor, listDocuments, money, newDocument, saveDocument, titleFor, totalsFor, validateDocument} from './businessDocuments';
import stampUrl from './assets/documents/stamp.jpeg';
import signatureUrl from './assets/documents/signature.jpeg';
import './BusinessDocuments.css';

const imageData = url => new Promise((resolve,reject) => {
  const image = new Image();
  image.onload=()=>resolve(image);
  image.onerror=()=>reject(new Error('The stamp or signature could not load. Please try again.'));
  image.src=url;
});
function Field({label,value,onChange,multiline=false,...props}) {
  const Input=multiline?'textarea':'input';
  return <label className="bd-field"><span>{label}</span><Input {...props} value={value} onChange={event=>onChange(event.target.value)}/></label>;
}
export default function BusinessDocuments({currentUser,dark}) {
  const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[loadError,setLoadError]=useState('');
  const [doc,setDoc]=useState(null),[version,setVersion]=useState(null),[baseline,setBaseline]=useState('');
  const [filter,setFilter]=useState('all'),[search,setSearch]=useState('');
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  const [preview,setPreview]=useState('');
  const busyRef=useRef(false),previewRef=useRef('');
  const allowed=hasPermission(currentUser,'documents');
  const dirty=doc && JSON.stringify(doc)!==baseline;
  async function load() {
    setLoading(true);setLoadError('');
    try {
      setRows(listDocuments(window.localStorage));
    } catch(error) {setLoadError(`Could not load documents. ${error.message}`);}
    finally {setLoading(false);}
  }
  useEffect(()=>{
    const refresh=()=>{if(allowed)load();};
    const timer=window.setTimeout(refresh,0);
    window.addEventListener('storage',refresh);
    return ()=>{window.clearTimeout(timer);window.removeEventListener('storage',refresh);};
  },[allowed]);
  useEffect(()=>()=>{if(previewRef.current)URL.revokeObjectURL(previewRef.current);},[]);
  useEffect(()=>{
    const warn=event=>{if(dirty){event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',warn);
    return ()=>window.removeEventListener('beforeunload',warn);
  },[dirty]);
  function clearPreview(){if(previewRef.current)URL.revokeObjectURL(previewRef.current);previewRef.current='';setPreview('');}
  function change(patch){setDoc(previous=>({...previous,...patch}));setMessage('');setError('');clearPreview();}
  function open(row) {
    if(dirty&&!window.confirm('Discard unsaved changes?'))return;
    const next=row?structuredClone(row.document):newDocument();
    setDoc(next);setVersion(row?.version||null);setBaseline(row?JSON.stringify(next):'');setError('');setMessage('');clearPreview();
  }
  async function save(event) {
    event.preventDefault();if(busyRef.current||!allowed)return;
    const invalid=validateDocument(doc);if(invalid){setError(invalid);return;}
    busyRef.current=true;setBusy(true);setError('');setMessage('');
    try {
      const saved=await saveDocument(window.localStorage,doc,version,currentUser.name);
      setRows(previous=>[saved,...previous.filter(row=>row.id!==saved.id)]);setDoc(saved.document);setVersion(saved.version);setBaseline(JSON.stringify(saved.document));setMessage(`${titleFor(doc.type)} saved.`);
    } catch(error) {setError(error.name==='QuotaExceededError'?'Browser storage is full. Download a PDF to keep your document.':error.message);}
    finally {busyRef.current=false;setBusy(false);}
  }
  async function exportPdf(download) {
    if(busyRef.current)return;
    const invalid=validateDocument(doc);if(invalid){setError(invalid);return;}
    busyRef.current=true;setBusy(true);setError('');
    try {
      const [stamp,signature]=await Promise.all([imageData(stampUrl),imageData(signatureUrl)]);
      const {buildDocumentPdf}=await import('./businessDocumentPdf');
      const pdf=buildDocumentPdf(doc,{stamp,signature});
      if(download)pdf.save(`${titleFor(doc.type)}-${doc.number.replace(/[^a-zA-Z0-9_-]/g,'_')}.pdf`);
      else {clearPreview();const url=URL.createObjectURL(pdf.output('blob'));previewRef.current=url;setPreview(url);}
    } catch(error){setError(error.message);}
    finally{busyRef.current=false;setBusy(false);}
  }
  function duplicate(type) {
    const next={...structuredClone(doc),...Object.fromEntries(Object.entries(newDocument(type)).filter(([key])=>['id','number','date','type'].includes(key)))};
    if(dirty&&!window.confirm('Copy the current details into a new document? Unsaved changes to the original will not be saved.'))return;
    setDoc(next);setVersion(null);setBaseline('');clearPreview();setMessage('New copy created. Review and save it.');setError('');
  }
  if(!allowed)return null;
  const totals=doc?totalsFor(doc):null;
  const filtered=rows.filter(row=>(filter==='all'||row.type===filter)&&`${row.number} ${row.document.buyer}`.toLowerCase().includes(search.toLowerCase()));
  return <section className={`business-documents${dark?' bd-dark':''}`} dir="ltr" lang="en">
    <header className="bd-heading"><div><p className="bd-eyebrow">THAWB / DOCUMENTS</p><h1>Invoices & Quotations</h1><p>Create, save and download your business documents.</p></div><button type="button" className="bd-primary" disabled={busy} onClick={()=>open(null)}>+ New document</button></header>
    <p className="bd-storage-note">Saved on this device and browser only. Download PDFs to keep a copy; documents do not sync between devices.</p>
    <div className="bd-toolbar"><input aria-label="Search documents" placeholder="Search number or buyer..." value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="Filter document type" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All documents</option><option value="quotation">Quotations</option><option value="invoice">Invoices</option></select><button type="button" disabled={loading} onClick={load}>Refresh</button></div>
    {loadError&&<p className="bd-error" role="alert">{loadError}</p>}
    {loading?<p role="status">Loading documents...</p>:<div className="bd-list">
      {filtered.length?<table><thead><tr><th>Document</th><th>Buyer</th><th>Date</th><th>Total</th><th/></tr></thead><tbody>{filtered.map(row=><tr key={row.id}><td><span className={`bd-tag ${row.type}`}>{titleFor(row.type)}</span><strong>{row.number}</strong></td><td className="bd-buyer-cell">{row.document.buyer}</td><td>{row.document.date}</td><td>{money(totalsFor(row.document).total,row.document.currency)}</td><td><button disabled={busy} onClick={()=>open(row)}>Open</button></td></tr>)}</tbody></table>:<div className="bd-empty">{search||filter!=='all'?'No matching documents.':'Your saved invoices and quotations will appear here.'}</div>}
    </div>}
    {doc&&<form onSubmit={save} className="bd-editor">
      <div className="bd-editor-title"><div><h2>{version?'Edit':'New'} {titleFor(doc.type).toLowerCase()}</h2><span>{dirty?'Unsaved changes':'All changes saved'}</span></div><button type="button" disabled={busy} onClick={()=>{if(!dirty||window.confirm('Discard unsaved changes?')){setDoc(null);clearPreview();}}}>Close</button></div>
      <fieldset disabled={busy}>
        <div className="bd-grid bd-meta">
          <label className="bd-field"><span>Document type</span><select aria-label="Document type" value={doc.type} onChange={e=>{const type=e.target.value;change({type,...(!version?{number:newDocument(type).number}:{})});}}><option value="quotation">Quotation</option><option value="invoice">Invoice</option></select></label>
          <Field label="Document number" value={doc.number} maxLength={70} onChange={number=>change({number})}/>
          <Field label="Date" type="date" value={doc.date} onChange={date=>change({date})}/>
          <label className="bd-field"><span>Currency</span><select aria-label="Currency" value={doc.currency} onChange={e=>change({currency:e.target.value})}><option value="OMR">OMR — Omani Rial</option><option value="AED">AED — UAE Dirham</option></select></label>
        </div>
        <p className="bd-hint">Enter prices in the selected currency. Changing currency does not convert amounts.</p>
        <div className="bd-grid"><Field label="Seller" multiline rows={3} maxLength={500} value={doc.seller} onChange={seller=>change({seller})}/><Field label="Buyer" multiline rows={3} maxLength={500} value={doc.buyer} onChange={buyer=>change({buyer})}/></div>
        <div className="bd-section-heading"><h3>Products</h3><button type="button" onClick={()=>change({items:[...doc.items,{id:crypto.randomUUID(),description:'JACKETS',quantity:'',unitPrice:''}]})}>+ Add item</button></div>
        <div className="bd-items">{doc.items.map((item,index)=><div className="bd-item" key={item.id}>
          <Field label={`Item ${index+1} / description`} multiline rows={2} maxLength={1500} value={item.description} onChange={description=>change({items:doc.items.map(x=>x.id===item.id?{...x,description}:x)})}/>
          <Field label="Quantity" type="number" min="1" max="1000000" step="1" value={item.quantity} onChange={quantity=>change({items:doc.items.map(x=>x.id===item.id?{...x,quantity}:x)})}/>
          <Field label={`Unit price (${doc.currency})`} type="number" min="0" max="1000000" step={doc.currency==='OMR'?'0.001':'0.01'} value={item.unitPrice} onChange={unitPrice=>change({items:doc.items.map(x=>x.id===item.id?{...x,unitPrice}:x)})}/>
          <div className="bd-line-total"><span>Amount</span><strong>{money(totals.lines[index],doc.currency)}</strong></div>
          <button type="button" aria-label={`Remove item ${index+1}`} disabled={doc.items.length===1} onClick={()=>change({items:doc.items.filter(x=>x.id!==item.id)})}>×</button>
        </div>)}</div>
        <div className="bd-grid bd-summary"><Field label="Notes / terms (optional)" multiline rows={4} maxLength={3000} value={doc.notes} onChange={notes=>change({notes})}/><div><Field label="VAT (%)" type="number" min="0" max="100" step="0.01" value={doc.vatRate} onChange={vatRate=>change({vatRate})}/><p><span>Subtotal</span><strong>{money(totals.subtotal,doc.currency)}</strong></p><p><span>VAT</span><strong>{money(totals.vat,doc.currency)}</strong></p><p className="bd-grand-total"><span>{doc.type==='invoice'?'Total amount due':'Quotation total'}</span><strong>{money(totals.total,doc.currency)}</strong></p><small>{digitsFor(doc.currency)} decimal places · {doc.currency}</small></div></div>
        <details className="bd-company"><summary>Company, registration & signature details</summary><p className="bd-hint">Prefilled from your reference invoice. Changes apply to this document.</p><div className="bd-grid">{[['company','Company name'],['registration','Commercial registration (RN)'],['address','Address'],['phone','Phone / GSM'],['signatory','Authorized signatory']].map(([key,label])=><Field key={key} label={label} maxLength={100} value={doc[key]} onChange={value=>change({[key]:value})}/>)}</div><div className="bd-signatures"><img src={stampUrl} alt="Fixed company stamp"/><img src={signatureUrl} alt="Fixed authorized signature"/><p>The original stamp and signature are included on every invoice and quotation.</p></div></details>
      </fieldset>
      {error&&<p className="bd-error" role="alert">{error}</p>}{message&&<p className="bd-success" role="status">{message}</p>}
      <div className="bd-actions"><button type="submit" disabled={busy} className="bd-primary">{busy?'Please wait...':'Save document'}</button><button type="button" disabled={busy} onClick={()=>exportPdf(false)}>Preview PDF</button><button type="button" disabled={busy} onClick={()=>exportPdf(true)}>Download PDF</button>{version&&<button type="button" disabled={busy} onClick={()=>duplicate(doc.type==='quotation'?'invoice':doc.type)}>{doc.type==='quotation'?'Create invoice copy':'Duplicate invoice'}</button>}</div>
      <p className="bd-hint">PDF downloads include the current details. Save to keep them in your document history.</p>
      {preview&&<div className="bd-preview"><a href={preview} target="_blank" rel="noreferrer">Open PDF in a new tab / Print</a><iframe src={preview} title="Document PDF preview"/></div>}
    </form>}
  </section>;
}
