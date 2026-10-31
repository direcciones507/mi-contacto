/** Enlaces personales: lógica pura. La reserva real exige UNIQUE transaccional en PostgreSQL. */
export function normalizeSlug(value) {
  if (typeof value !== "string") return "";
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
}
export function validateSlug(value) {
  const slug = normalizeSlug(value);
  if (slug.length < 3 || slug.length > 60) return {ok:false,code:"INVALID_SLUG",message:"El nombre del enlace debe tener entre 3 y 60 caracteres."};
  if (new Set(["admin","api","auth","directorio","mi-perfil","login","registro","p","ayuda","robots","sitemap","www"]).has(slug))
    return {ok:false,code:"RESERVED_SLUG",message:"Este nombre de enlace no está disponible. Elige otro."};
  return {ok:true,slug};
}
export const DUPLICATE_SLUG_MESSAGE = "Este nombre de enlace ya existe. Por favor, elige otro nombre para continuar.";
export function profileUrl(slug, origin="https://micontacto.online") {
  const v=validateSlug(slug);if(!v.ok || v.slug!==slug) throw Error("INVALID_SLUG");
  return new URL("/"+slug,origin).href;
}
