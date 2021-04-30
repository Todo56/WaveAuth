let express = require('express');
let path = require('path');
let logger = require('morgan');
let con = require("./db");
let app = express();
let session = require("express-session");
let config = require("./config.json");

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'qwdklq1oi2eypoqd47382398ecskjldf',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false
    }
}))

let apiRouter = require("./routes/api.js");
let adminRouter = require("./routes/admin");

app.use('/api', apiRouter);
app.use('/admin', adminRouter);


app.listen(config.port);
console.log("Running on port " + config.port + ".")

setInterval(function () {
    let time = new Date().getTime();
    con.query(`DELETE FROM sessions WHERE valid_until < ${time}`);
}, 5000)

module.exports = app;
