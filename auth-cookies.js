// Portable cookie reader from core/runtime/general-auth.ts at
// direcciones507/direcciones507@3576029d97e1d1699b6213451e7eee9a556e1590.
// Caller selects a Mi Contacto cookie; no source cookie or secret is imported.
export function readCookie(req, name) {
 try {
  const parts=(req.headers.get('cookie')??'').split(';').map(s=>s.trim());
  const matches=parts.filter(s=>s.startsWith(name+'='));
  return matches.length===1?decodeURIComponent(matches[0].slice(name.length+1)):null;
 } catch {return null;}
}
