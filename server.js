// Optional static server. The app is fully client-side (public/), so this is
// only a convenience for `npm start` — you can also just open public/index.html.
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Liam's Sauce running at http://localhost:${PORT}`);
});
