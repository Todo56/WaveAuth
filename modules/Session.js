let Account = require("./Account");
class Session {
    session_id = null;
    token = null;
    created_at = null;
    valid_until = null;
    enabled = null;
    user_id = null;
    device_id = null;
    device_name = null;

    constructor(data) {
        this.session_id = data.session_id;
        this.user_id = data.user_id;
        this.token = data.token;
        this.created_at = data.created_at;
        this.valid_until = data.valid_until;
        this.device_id = data.device_id;
        this.device_name = data.device_name;
        this.enabled = data.enabled;
    }

    async destroy(){
        return new Promise(async (resolve, reject) => {
            let con = require("../db");
            con.query("DELETE FROM sessions WHERE token=?", [this.token], (err, res) => {
                if(err) return reject({status: 500, message: "Database error."})
                return resolve({status: 200, message: "The session has been destroyed successfully."})
            })
        })
    }

    async getAccount(){
        return await Account.getAccountById(this.user_id);
    }



    static async hasDeviceSession(deviceId){
        return new Promise(async (resolve, reject) => {
            let con = require("../db");
            con.query("SELECT * FROM sessions WHERE device_id=? AND enabled=1", [deviceId], (err, res) => {
                if(err) return reject({status: 500, message: "Internal Server Error."});
                if(res.length === 0) return resolve(false);
                resolve(new Session(res[0]));
            })
        });
    }

    static async getSessionByToken(token){
        return new Promise(async (resolve, reject) => {
            let con = require("../db");
            con.query("SELECT * FROM sessions WHERE token=?", [token], (err, res) => {
                if(err) return reject({status: 500, message: "Internal Server Error."});
                if(res.length === 0) return reject({status: 400, message: "Invalid Session."});
                resolve(new Session(res[0]));
            })
        });
    }

    static async createSession(account, device_id, device_name){
        return new Promise(async (resolve, reject) => {
            let con = require("../db");
            if(!account instanceof Account) return reject({status: 400, message: "Invalid data passed."});
            let sessions = await account.getActiveSessions();
            if(sessions.length >= account.max_sessions) return reject({status: 403, message: "Too many sessions active."});
            let time = new Date().getTime();
            let valid_time = time + ((60 * 60 * 24 * 30) * 1000);
            let token = this.getRandomToken();
            con.query("INSERT INTO sessions(user_id, token, created_at, valid_until, enabled, device_id, device_name) VALUES (?, ?, ?, ?, ?, ?, ?)", [account.id, token, time, valid_time, 1, device_id, device_name], (err,res, rows) => {
                if(err) return reject({status: 500, message: "Internal Server Error."});
                resolve({status: 200, message: `Your session for ${device_name} has been created and activated! It will last 30 days.`, token: token})
            })
        });
    }

    /* We will not validate this because the chance of getting the same token for each session is VERY VERY VERY big */
    static getRandomToken(){
        let result = '';
        let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < 50; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
}
module.exports = Session;