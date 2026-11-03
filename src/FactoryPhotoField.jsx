import { useEffect, useRef, useState } from 'react';
import { cropRectangle, photoScale } from './factoryReport';

export default function FactoryPhotoField({ photo, assign, title, text, upload, disabled }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [scale, setScale] = useState(100);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const canvas = useRef(null);
  useEffect(() => {
    if (!editing || !photo) return;
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active || !canvas.current) return;
      const area = cropRectangle(image.naturalWidth, image.naturalHeight, crop);
      const ratio = Math.min(1, 1200 / Math.max(area.width, area.height));
      const target = canvas.current;
      target.width = Math.max(1, Math.round(area.width * ratio));
      target.height = Math.max(1, Math.round(area.height * ratio));
      target.getContext('2d').drawImage(image, area.x, area.y, area.width, area.height, 0, 0, target.width, target.height);
      setReady(true);
    };
    image.onerror = () => { if (active) setError(text('تعذر فتح الصورة للتعديل', 'Could not open image for editing')); };
    image.src = photo.originalUrl || photo.url;
    return () => { active = false; };
  }, [editing, photo, crop, text]);
  function startEdit() {
    setCrop(photo.crop || { x: 0, y: 0, width: 100, height: 100 });
    setScale(photoScale(photo)); setReady(false); setError(''); setEditing(true); setAdding(false);
  }
  function updateCrop(key, value) {
    setReady(false);
    setCrop(previous => {
      const next = { ...previous, [key]: Number(value) };
      next.width = Math.min(next.width, 100 - next.x);
      next.height = Math.min(next.height, 100 - next.y);
      return next;
    });
  }
  function apply() {
    try {
      const url = canvas.current.toDataURL('image/jpeg', 0.72);
      if (url.length > 700000) throw new Error(text('الصورة كبيرة، قلل مساحة القص', 'Image too large; reduce the crop area'));
      assign({ ...photo, originalUrl: photo.originalUrl || photo.url, url, crop, printScale: scale });
      setEditing(false);
    } catch (e) { setError(e.message); }
  }
  return <div className="je-factory-photo"><strong>{title}</strong>{photo && !editing && <img src={photo.url} alt={title} style={{ width: `${photoScale(photo)}%`, justifySelf: 'center' }} />}
    {!editing && <button type="button" disabled={disabled} onClick={() => photo ? startEdit() : setAdding(!adding)}>{photo ? text('تعديل الصورة', 'Edit image') : text('إضافة صورة', 'Add image')}</button>}
    {editing && <div className="je-photo-editor"><canvas ref={canvas} aria-label={text('معاينة القص', 'Crop preview')} style={{ width: `${scale}%` }} /><p>{text('قص الصورة', 'Crop image')}</p>{[['x', text('البداية أفقيًا', 'Left edge'), 0, 95], ['y', text('البداية عموديًا', 'Top edge'), 0, 95], ['width', text('عرض القص', 'Crop width'), 5, 100 - crop.x], ['height', text('ارتفاع القص', 'Crop height'), 5, 100 - crop.y]].map(([key, label, min, max]) => <label key={key}>{label} · {crop[key]}%<input type="range" min={min} max={max} value={crop[key]} onChange={e => updateCrop(key, e.target.value)} /></label>)}<label>{text('حجم الصورة في التقرير', 'Image size in report')} · {scale}%<input type="range" min="30" max="100" value={scale} onChange={e => setScale(Number(e.target.value))} /></label><div className="je-actions"><button type="button" disabled={!ready || disabled} onClick={apply}>{text('تطبيق', 'Apply')}</button><button type="button" onClick={() => { setCrop({ x: 0, y: 0, width: 100, height: 100 }); setScale(100); setReady(false); }}>{text('إعادة ضبط', 'Reset')}</button><button type="button" onClick={() => setEditing(false)}>{text('إلغاء', 'Cancel')}</button></div></div>}
    {photo && !editing && <details><summary>{text('المزيد', 'More')}</summary><button type="button" onClick={() => setAdding(!adding)}>{text('استبدال الصورة', 'Replace image')}</button><button type="button" onClick={() => { assign(null); setAdding(false); }}>{text('إزالة الصورة', 'Remove image')}</button></details>}
    {adding && !editing && <div className="je-photo-sources"><label>{text('اختيار صورة', 'Choose image')}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { upload(e.target.files?.[0], p => { assign(p); setAdding(false); }); e.target.value = ''; }} /></label><label>{text('التقاط بالكاميرا', 'Take photo')}<input type="file" capture="environment" accept="image/jpeg,image/png,image/webp" onChange={e => { upload(e.target.files?.[0], p => { assign(p); setAdding(false); }); e.target.value = ''; }} /></label></div>}{error && <p role="alert" className="je-error">{error}</p>}</div>;
}
