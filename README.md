# Mercado Libre · Tus Carts

Conexión con Mercado Libre para las apps de Tus Carts. Busca productos y devuelve precio, cuotas, foto, link, marca, modelo y código de barras con el mismo formato que las otras tiendas.

- `GET /api/buscar?q=heladera&limite=12`: productos.
- `GET /api/estado`: dice si la conexión funciona (sin mostrar claves).

## Claves

Las claves de la aplicación de Mercado Libre van **solo** en Vercel → Settings → Environment Variables:

- `ML_CLIENT_ID`
- `ML_CLIENT_SECRET`

No se ponen en el código, en GitHub ni en mensajes.
