class Account {
    id = null;
    username = null;
    hash = null;
    max_sessions = 3;
    enabled = 1;
    permission = 1;
    created_at = null;
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.hash = data.password;
        this.max_sessions = data.max_sessions;
        this.enabled = data.enabled;
        this.permission = data.permission;
        this.created_at = data.created_at
        this.con = require("../db");
    }
    async getActiveSessions(){
        return new Promise(resolve => {
            this.con.query("SELECT * FROM sessions WHERE user_id=? AND enabled=1", [this.id], (err, res) => {
                resolve(res);
            })
        })
    }
    isEnabled(){
        return this.enabled === 1;
    }

    static async getAccountById(id){
        return new Promise(async (resolve, reject) => {
            let con = require("../db");
            con.query("SELECT * FROM accounts WHERE id=?", [id], (err, res) => {
                if(err) return reject({status: 500, message: "Internal Server Error."});
                if(res.length === 0) return reject({status: 400, message: "Invalid Account."});
                resolve(new Account(res[0]));
            })
        });
    }
}
module.exports = Account;