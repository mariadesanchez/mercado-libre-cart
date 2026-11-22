// Mercado Libre: acceso con la aplicación de Tus Carts (ML_CLIENT_ID y ML_CLIENT_SECRET, solo en las variables de Vercel).
// Mercado Libre ya no deja buscar sin clave de acceso, así que primero se pide un token de la aplicación.
const API = 'https://api.mercadolibre.com';
let cache = { token: '', vence: 0, error: '' };

async function token() {
  if (cache.token && Date.now() < cache.vence) return cache.token;
  const id = process.env.ML_CLIENT_ID, secret = process.env.ML_CLIENT_SECRET;
  if (!id || !secret) { cache.error = 'Faltan ML_CLIENT_ID y ML_CLIENT_SECRET en Vercel'; throw new Error(cache.error); }
  const r = await fetch(API + '/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret }).toString(),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) { cache.error = 'Token: ' + r.status + ' ' + (j.message || j.error || ''); throw new Error(cache.error); }
  cache = { token: j.access_token, vence: Date.now() + Math.max(60, (j.expires_in || 21600) - 300) * 1000, error: '' };
  return cache.token;
}

async function get(ruta) {
  const t = await token();
  const r = await fetch(API + ruta, { headers: { authorization: 'Bearer ' + t, accept: 'application/json' } });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, j };
}

const atributo = (attrs, id) => { const a = (attrs || []).find(x => x.id === id); return a ? String(a.value_name || '') : ''; };
const https = u => String(u || '').replace(/^http:/, 'https:').replace(/-I\.jpg$/, '-O.jpg');
const cuotas = ins => ins && ins.quantity > 1 && ins.rate === 0 ? ins.quantity + ' cuotas sin interés de $ ' + Math.round(ins.amount).toLocaleString('es-AR') : '';

// Publicaciones (búsqueda general de Mercado Libre)
function deItems(results) {
  return (results || []).filter(x => x.price > 0 && x.condition !== 'used').map(x => ({
    nombre: String(x.title || '').replace(/\s+/g, ' ').trim(),
    marca: atributo(x.attributes, 'BRAND'),
    ean: (atributo(x.attributes, 'GTIN').match(/\d{8,14}/) || [''])[0],
    precio: x.price,
    precio_lista: x.original_price && x.original_price > x.price ? x.original_price : null,
    precio_promo: null, promo: x.original_price > x.price ? Math.round((1 - x.price / x.original_price) * 100) + '% OFF' : '', promo_condicion: '',
    nota: [cuotas(x.installments), x.official_store_name ? 'Tienda oficial ' + x.official_store_name : ''].filter(Boolean).join('. '),
    por_peso: false, precio_por_medida: null, medida: '',
    imagen: https(x.thumbnail), exacto: false, sin_stock: false, rubro: '',
    link: x.permalink || '', modelo: atributo(x.attributes, 'MODEL'), sku: String(x.id || ''), seller: String((x.seller && x.seller.id) || ''),
  }));
}

// Productos de catálogo (si la búsqueda general no está habilitada para la aplicación)
async function deCatalogo(q, limite) {
  const r = await get('/products/search?status=active&site_id=MLA&q=' + encodeURIComponent(q) + '&limit=' + Math.min(limite, 20));
  if (r.status !== 200) throw new Error('Catálogo: ' + r.status + ' ' + (r.j.message || ''));
  const out = [];
  await Promise.all((r.j.results || []).map(async p => {
    const d = await get('/products/' + p.id);
    const w = d.status === 200 && d.j.buy_box_winner;
    if (!w || !(w.price > 0)) return;
    out.push({
      nombre: String(p.name || '').trim(), marca: atributo(p.attributes, 'BRAND'),
      ean: (atributo(p.attributes, 'GTIN').match(/\d{8,14}/) || [''])[0],
      precio: w.price, precio_lista: w.original_price && w.original_price > w.price ? w.original_price : null,
      precio_promo: null, promo: '', promo_condicion: '', nota: cuotas(w.installments),
      por_peso: false, precio_por_medida: null, medida: '',
      imagen: https((d.j.pictures && d.j.pictures[0] && d.j.pictures[0].url) || ''), exacto: false, sin_stock: false, rubro: '',
      link: d.j.permalink || ('https://www.mercadolibre.com.ar/p/' + p.id), modelo: atributo(p.attributes, 'MODEL'), sku: p.id, seller: String(w.seller_id || ''),
    });
  }));
  return out;
}

async function buscar(q, limite = 24) {
  const r = await get('/sites/MLA/search?q=' + encodeURIComponent(q) + '&limit=' + Math.min(limite, 50));
  if (r.status === 200) return { fuente: 'busqueda', productos: deItems(r.j.results) };
  return { fuente: 'catalogo', aviso: 'Búsqueda general: ' + r.status, productos: await deCatalogo(q, limite) };
}

module.exports = { buscar, token, get, estadoToken: () => ({ tiene: !!cache.token, error: cache.error }) };
