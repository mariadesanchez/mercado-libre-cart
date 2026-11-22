// GET /api/buscar?q=heladera&limite=12 → productos de Mercado Libre con el mismo formato que las otras tiendas de Tus Carts
const ml = require('../lib/ml');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const q = String((req.query && req.query.q) || '').trim().slice(0, 100);
  const limite = Math.min(Math.max(parseInt(req.query && req.query.limite, 10) || 24, 1), 50);
  if (!q) { res.statusCode = 400; return res.end(JSON.stringify({ ok: false, error: 'Falta qué buscar' })); }
  try {
    const r = await ml.buscar(q, limite);
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.end(JSON.stringify(Object.assign({ ok: true, super: 'Mercado Libre', total: r.productos.length }, r)));
  } catch (e) {
    res.statusCode = 502;
    return res.end(JSON.stringify({ ok: false, error: 'No se pudo consultar Mercado Libre', detalle: String(e.message || e).slice(0, 200) }));
  }
};
