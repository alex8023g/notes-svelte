const express = require("express");
const nunjucks = require("nunjucks");


const app = express();

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

app.use('/', require('./auth-router'));
app.use('/notes/', require('./note-router'));
app.set("view engine", "njk");
app.use(express.static('public'));
app.use(express.json());


app.listen(process.env.PORT, () => {
  console.log(`Listening on http://localhost:${process.env.PORT}`)
})
