import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { resolvePhoto, storedPhotoPath } from './photoStorage';
export default function StoredPhoto({ src, alt = '', ...props }) {
  const [resolved, setResolved] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const refresh = () => resolvePhoto(supabase, src).then(url => {
      if (active) { setResolved({ source: src, url }); setFailed(false); }
    }).catch(() => { if (active) setFailed(true); });
    refresh();
    const timer = setInterval(refresh, 2400000);
    return () => { active = false; clearInterval(timer); };
  }, [src]);
  const url = storedPhotoPath(src) ? (resolved?.source === src ? resolved.url : undefined) : src;
  return failed ? <span role="alert">تعذر تحميل الصورة / Image unavailable</span> : <img {...props} src={url} alt={alt} />;
}
