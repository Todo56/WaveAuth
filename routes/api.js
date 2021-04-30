let express = require("express");
let router = express.Router();
let con = require("../db");
let bcrypt = require("bcrypt");
let Session = require("../modules/Session");
let Account = require("../modules/Account");

let injectionsCooldown = new Set();

setInterval(function(){
    injectionsCooldown = new Set();
}, 10000);

router.post("/session/create", (req, res, next) => {
    let body = req.body;
    if(body.username && body.password && body.deviceId && body.deviceName){
        con.query("SELECT * FROM accounts WHERE username=?", [body.username], async (err, rows) => {
            if(err) return res.send({status: 500, message: "Internal server error."}).status(500);
            if(rows.length === 0) return res.send({status: 401, message: "Incorrect username."}).status(401);
            let row = rows[0];
            if(!await bcrypt.compareSync(body.password, row["password"])) return res.send({status: 401, message: "Incorrect password"}).status(401);
            if(row.enabled !== 1) return res.send({status: 403, message: "Your account is not enabled."});
            let currentAccount = new Account(row);
            let session = await Session.hasDeviceSession(body.deviceId);
            if(session){
                res.send({status: 200, message: `Token for this device already found.`, token: session.token})
            } else {
                Session.createSession(currentAccount, body.deviceId, body.deviceName).then(r => res.send(r).status(r.status)).catch(e => res.send(e).status(e.status))
            }
        });
    } else {
        res.send({status: 400, message: "Not every required value has been passed."}).status(400);
    }
});

router.post("/session/validate", (req, res, next) => {
    let body = req.body;
    if(body.username && body.token && body.deviceId){
        Session.getSessionByToken(body.token).then(async session => {
            if(session.enabled !== 1) return res.send({status: 200, valid: false, message: "Session disabled."});
            let account = await session.getAccount();
            if(!account.isEnabled()) return res.send({status: 200, valid: false, message: "Your account is not enabled."});
            if(account.username !== body.username) return res.send({status: 200, valid: false, message: "Bad request."});
            if(body.deviceId !== session.device_id) return res.send({status: 200, valid: false, message: "Bad request."});
            return res.send({status: 200, valid: true, message: "All good, go ahead."});
        }).catch(e => res.send(e).status(e.status));
    } else {
        res.send({status: 200, message: "Not every required value has been passed.", valid: false});
    }
});

router.post("/session/destroy", (req, res, next) => {
    let body = req.body;
    if(body.username && body.token && body.deviceId){
        Session.getSessionByToken(body.token).then(async session => {
            if(session.enabled !== 1) return res.send({status: 403, message: "Session disabled."});
            let account = await session.getAccount();
            if(!account.isEnabled()) return res.send({status: 403, message: "Your account is not enabled."});
            if(account.username !== body.username) return res.send({status: 401, message: "Bad request."});
            if(body.deviceId !== session.device_id) return res.send({status: 401, message: "Bad request."});
            session.destroy().then(r => res.send(r).status(r.status)).catch(e => res.send(e).status(e.status));
        }).catch(e => res.send(e).status(e.status));
    } else {
        res.send({status: 200, message: "Not every required value has been passed.", valid: false});
    }
});

router.post("/inject", async(req, res, next) => {
    let body = req.body;
    if(body.username && body.token && body.deviceId){
        if(!injectionsCooldown.has(body.token)){
            Session.getSessionByToken(body.token).then(async session => {
                if(session.enabled !== 1) return res.send({status: 403, message: "Session disabled."});
                let account = await session.getAccount();
                if(!account.isEnabled()) return res.send({status: 403, message: "Your account is not enabled."});
                if(account.username !== body.username) return res.send({status: 401, message: "Bad request."});
                if(body.deviceId !== session.device_id) return res.send({status: 401, message: "Bad request."});
                let fs = require("fs");
                let injections = require("../data/injections.json");
                injections.injections++;
                fs.writeFileSync("./data/injections.json", JSON.stringify(injections));
                injectionsCooldown.add(body.token);
                res.send({status: 200, message: "Your inject has been registered."})
            }).catch(e => res.send(e).status(e.status));
        } else {
            res.send({status: 429, message: "Too fast cowboy."}).status(429);
        }
    } else {
        res.send({status: 400, message: "Not every required value has been passed."});
    }
})

router.get("/downloads/beta", async (req, res, next) => {
    if (!req.headers.auth) return res.status(403).send({status: 403, message: "No creds provided."});
    Session.getSessionByToken(req.headers.auth).then(r => {
        res.setHeader('Content-disposition', 'attachment; filename=Beta.dll');
        res.download("./data/beta_release/latest/Beta.dll", "Beta.dll");
    }).catch(e => res.send(e).status(e.status));
})

router.get("/users/:id", async (req, res, next) => {
    let authCodeType = req.query.t;
    let data = req.params.id;
    if (!authCodeType) return res.send({status: 400, message: "Not every required value has been passed."}).status(400);
    switch (authCodeType) {
        case "token":
            Session.getSessionByToken(data).then(async session => {
                await session.getAccount().then(async account => {
                    await sendAccountData(account)
                }).catch(e => res.send(e).status(e.status));
            }).catch(e => res.send(e).status(e.status));
            break;
        case "id":
            Account.getAccountById(data).then(async account => {
                await sendAccountData(account)
            }).catch(e => res.send(e).status(e.status));
            break;
        default:
            return res.send({status: 400, message: "Not every required value has been passed."}).status(400);
    }
    async function sendAccountData(account) {
        res.send({
            status: 200,
            message: "All good.",
            data: {
                id: account.id,
                username: account.username,
                max_sessions: account.max_sessions,
                enabled: account.enabled === 1,
                permission: account.permission,
                active_sessions: await account.getActiveSessions(),
                created_at: account.created_at
            }
        })
    }
})

router.get("/hash", async (req, res, next) => {
    if(req.query.hash) return res.send(await bcrypt.hashSync(req.query.hash, 10));
})


module.exports = router;
