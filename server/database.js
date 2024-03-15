const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')
const {log} = require('./log')
class DataBase {
    config = {}
    db = null
    constructor(c) {
        this.config = c
    }
    async Init() {
        return new Promise(async resolve => {
            var createDbPromise = new Promise(resolve => {
                const db = new sqlite3.Database(
                    path.resolve(__dirname, 'database.db'),
                    err => {
                        resolve()
                        if (err) {
                            log.err(err.message)
                            return
                        }
                        log.succ('Sqlite Init.')
                    }
                )
                this.db = db
            })
    
            // 创建图片索引表
            var createTablePromise = new Promise(resolve => {
                this.db.run(`CREATE TABLE PhotoIndex (id VARCHAR (32) PRIMARY KEY, path text)`, err => {
                    resolve()
                    if (err) {
                        log.warn(err.message)
                        return
                    }
                    log.succ('PhotoIndex Table Init.')
                })
            })
            
            await createDbPromise
            await createTablePromise
            resolve()
        })
    }

    AddPhotoIndex(id, path) {
        return new Promise(resolve => {
            this.db.run(`INSERT INTO PhotoIndex VALUES(?, ?)`, id, path, err => {
                if (err) {
                    resolve({
                        status: 4010,
                        message: err.message
                    })
                    return
                }
                resolve({
                    status: 2000,
                    id: id
                })
            })
        })
    }
    GetPhotoPathByKey(id) {
        return new Promise(resolve => {
            id = id.replace(/[^a-zA-Z0-9]/g, '')
            this.db.all(`SELECT * FROM PhotoIndex WHERE id = ?`, [id], (err, row) => {
                if (err) {
                    log.err(err.message)
                    resolve({
                        status: 5000,
                        message: err.message
                    })
                }
                resolve({
                    status: 2000,
                    row: row
                })
            })
        })
    }
    GetkeyByPhotoPath(path) {
        return new Promise(resolve => {
            this.db.all(`SELECT * FROM PhotoIndex WHERE path = ?`, [path], (err, row) => {
                if (err) {
                    log.err(err.message)
                    resolve({
                        status: 5000,
                        message: err.message
                    })
                }
                resolve({
                    status: 2000,
                    row: row
                })
            })
        })
    }
}

exports.DataBase = DataBase