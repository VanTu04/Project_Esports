require('dotenv').config();
const express = require('express');
const app = express();
const routes = require('./routes');
const { sequelize } = require('./models');

app.use(express.json());
app.use('/api', routes);

const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/api`));
}).catch((err) => {
  console.error('Unable to connect to DB:', err);
});
