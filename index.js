const express = require('express');
const pool = require('./db'); // Importar la configuración de la base de datos
require('dotenv').config(); // Cargar las variables de entorno
const app = express();

// Middleware para registrar la actividad
app.use((req, res, next) => {
  console.log(`Se consultó la ruta: ${req.method} ${req.url}`);
  next();
});

// Rutas de la API
app.get('/joyas', async (req, res) => {
  const { limits = 10, page = 1, order_by = 'id_ASC' } = req.query;
  const [orderField, orderDirection] = order_by.split('_');

  try {
    const offset = (page - 1) * limits;
    const query = `SELECT * FROM inventario ORDER BY ${orderField} ${orderDirection} LIMIT $1 OFFSET $2`;
    const values = [parseInt(limits), offset];
    const result = await pool.query(query, values);

    const total = (await pool.query('SELECT COUNT(*) FROM inventario')).rows[0].count;

    res.json({
      total,
      data: result.rows,
      links: {
        next: `/joyas?limits=${limits}&page=${parseInt(page) + 1}&order_by=${order_by}`,
        prev: `/joyas?limits=${limits}&page=${parseInt(page) - 1}&order_by=${order_by}`,
      },
    });
  } catch (error) {
    res.status(500).send('Error en la consulta');
  }
});

app.get('/joyas/filtros', async (req, res) => {
  const { precio_min = 0, precio_max = 9999999, categoria, metal } = req.query;

  try {
    const query = `
      SELECT * FROM inventario
      WHERE precio >= $1 AND precio <= $2
      ${categoria ? `AND categoria = $3` : ''}
      ${metal ? `AND metal = $4` : ''}`;
    const values = [parseInt(precio_min), parseInt(precio_max)];

    if (categoria) values.push(categoria);
    if (metal) values.push(metal);

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    res.status(500).send('Error en la consulta');
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
