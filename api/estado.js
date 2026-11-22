// GET /api/estado → dice si la conexión con Mercado Libre funciona (sin mostrar ninguna clave)
const ml = require('../lib/ml');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const out = { claves_cargadas: !!(process.env.ML_CLIENT_ID && process.env.ML_CLIENT_SECRET) };
  try { await ml.token(); out.token = 'ok'; } catch (e) { out.token = String(e.message || e); return res.end(JSON.stringify(out)); }
  const prueba = async ruta => { try { const r = await ml.get(ruta); return r.status + (r.status === 200 ? '' : ' ' + (r.j.message || r.j.error || '')); } catch (e) { return String(e.message || e); } };
  out.busqueda_general = await prueba('/sites/MLA/search?q=heladera&limit=1');
  out.catalogo = await prueba('/products/search?status=active&site_id=MLA&q=heladera&limit=1');
  res.end(JSON.stringify(out, null, 1));
};
