let express = require("express");
let router = express.Router();
let con = require("../db");
let bcrypt = require("bcrypt");
let Session = require("../modules/Session");
let Account = require("../modules/Account");
let config = require("../config.json");

router.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
})

router.get("/login", (req, res, next) => {
    if(!req.query.redirect) return res.redirect(config.admin + "/login?redirect="+config.admin);
    res.render("./login.ejs", {
        url: config.admin
    });
})

router.post("/login", (req, res, next) => {
    if(!req.body.username || !req.body.password) return res.redirect(config.admin);
    con.query(`SELECT * FROM accounts WHERE username=? AND permission=1`, [req.body.username], async(err, res1) => {
        if(res1.length === 0) return res.redirect(config.admin + "/login?username=false");
        if(!await bcrypt.compareSync(req.body.password, res1[0].password)) return res.redirect(config.admin + "/login?username=true&password=false");
        req.session.user = req.body.username;
        req.session.user_id = res1[0].id;
        res.redirect(req.query.redirect);
    })
})


router.use((req, res, next) => {
    let session = req.session;
    if(!session.user || !session.user_id) return res.redirect(config.admin + "/login?redirect=" + req.originalUrl);
    con.query("SELECT * FROM accounts WHERE username=? AND id=? AND permission=1", [session.user, session.user_id], async (err, res1) => {
        if(res1.length !== 1) return res.redirect(config.admin + "/login?redirect=" + req.originalUrl);
        next();
    })
});


router.get("/", async(req, res, next) => {
    con.query(` SELECT (SELECT COUNT(*) FROM accounts) AS betas, (SELECT COUNT(*) FROM accounts WHERE permission = 1) AS developers, (SELECT COUNT(*) FROM sessions WHERE enabled=1) AS sessions;`, async(err, res1) => {
        res.render("./index.ejs", {
            info: await getSiteVitalInfo(req),
            data: res1[0],
            url: config.admin
        });
    })
});

router.get("/stats", async(req, res, next) => {
    res.render("./stats.ejs", {
        info: await getSiteVitalInfo(req),
        url: config.admin,
    });
});

router.get("/users", async(req, res, next) => {
    con.query("SELECT * FROM accounts",async  (err, res1) => {
        res.render("./users.ejs", {
            info: await getSiteVitalInfo(req),
            url: config.admin,
            users: res1
        });
    })
});

router.get("/users/add", async(req, res, next) => {
    res.render("./add_user.ejs", {
        info: await getSiteVitalInfo(req),
        url: config.admin
    });
});

router.post("/users/add", async(req, res, next) => {
    let body = req.body;
    con.query(`INSERT INTO accounts(username, password, max_sessions, enabled, permission, created_at) VALUES ('${body.username}','${await bcrypt.hash(body.password, 10)}',${parseInt(body.max_sessions)},${body.enabled === "true"?1:0},${body.developer === "true"?1:0}, '${new Date().getTime()}')`, (err, res1) => {
        if(err) return res.send({"error": true, "message": "An error has occurred."});
        res.send({"error": false, "message": `An account for ${body.username} has been created with password ${body.password}`});
    })
});

router.get("/users/edit/:user", async(req, res, next) => {
    con.query("SELECT * FROM accounts WHERE username=?", [req.params.user],async  (err, res1) => {
        if(res1.length === 0) return res.send("404");
        res.render("./edit_user.ejs", {
            info: await getSiteVitalInfo(req),
            url: config.admin,
            user: res1[0]
        });
    })
});

router.post("/users/edit/:user", async(req, res, next) => {
    let body = req.body;
    con.query(`UPDATE accounts SET password = '${await bcrypt.hash(body.password, 10)}', max_sessions = ${parseInt(body.max_sessions)}, enabled = ${body.enabled === "true"?1:0}, permission = ${body.developer === "true"?1:0} WHERE username=?`, [req.params.user], (err, res1) => {
        if(err) return res.send({"error": true, "message": "An error has occurred."});
        res.send({"error": false, "message": `${req.params.user} has been edited.`});
    })
});

router.get("/users/delete/:user", async(req, res, next) => {
    con.query(`DELETE FROM accounts WHERE username='${req.params.user}'`, (err, res1) => {
        if(err) return res.send({"error": true, "message": "An error has occurred."});
        res.send({"error": false, "message": `${req.params.user} has been deleted successfully.`});
    })
})

router.get("/logout", async(req, res, next) => {
    req.session.destroy();
    res.redirect(config.admin+ "/login");
});

async function getSiteVitalInfo(req){
    let info = {
        session: req.session,
    }
    return info;
}

module.exports = router;
