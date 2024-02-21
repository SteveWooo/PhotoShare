const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')
const cookirParser = require('cookie-parser')
const sha256 = require('js-sha256')
const { DataBase } = require('./database')
const { log } = require('./log')


class PhotoShareServer {
    expressApp = null
    config = {}
    database = {}

    cookie = ''

    constructor(config) {
        this.config = config
        this.database = new DataBase(config)
    }

    async Init() {
        this.expressApp = express()
        this.expressApp.use(cookirParser())
        await this.database.Init()
        if (!fs.existsSync(`${__dirname}/cookie`)) {
            fs.writeFileSync(`${__dirname}/cookie`, '')
        }

        // 静态文件
        this.expressApp.use(`${this.config.basePath}/files`, express.static(this.config.photoRoot))
        this.expressApp.use(`${this.config.basePath}/client`, express.static(`${__dirname}/../pageClient/dist`))
        this.expressApp.use(`${this.config.basePath}/handle`, express.static(`${__dirname}/../pageAdmin/dist`))

        this.cookie = fs.readFileSync(`${__dirname}/cookie`).toString()
        // 路由
        this.expressApp.get(`${this.config.basePath}/api/login`, (req, res) => {
            const { now, cry } = req.query
            const source = `fishmint.${now}.${this.config.password}`
            const checkCry = sha256(source)
            if (checkCry === cry) {
                this.cookie = checkCry
                fs.writeFileSync(`${__dirname}/cookie`, checkCry)
                res.cookie('ses', checkCry, {
                    httpOnly: true,
                    maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
                })
                res.send({
                    status: 2000
                })
                return
            }
            res.send({
                status: 4003
            })
        })
        // 基本鉴权
        this.expressApp.get(`${this.config.basePath}/api/check_login`, this.midAuth.bind(this), (req, res) => {
            res.send({
                status: 2000
            })
        })
        // 获取目录
        this.expressApp.get(`${this.config.basePath}/api/get_path`, this.midAuth.bind(this), (req, res) => {
            const { file_path } = req.query
            const realPath = path.join(this.config.photoRoot, file_path)
            const dir = fs.readdirSync(realPath)
            res.send({
                status: 2000,
                dirs: dir
            })
        })
        // 创建目录索引
        this.expressApp.get(`${this.config.basePath}/api/create_path_index`, this.midAuth.bind(this), async (req, res) => {
            let { file_path } = req.query
            file_path.replace(/\%/g, '').replace(/\'/g, '').replace(/\"/g, '').replace(/\;/g, '')
            try {
                const result = await this.database.GetkeyByPhotoPath(file_path)
                if (result.status !== 2000) {
                    res.send(result)
                    return 
                }
                const id = sha256(file_path)
                if (result.data.length === 0) {
                    // 创建目录索引
                    const createRes = await this.database.AddPhotoIndex(id, file_path)
                    res.send(createRes)
                    return 
                } else {
                    // 返回现成
                    res.send({
                        status: 2000,
                        id: id
                    })
                }
             } catch(e) {
                res.send({
                    status: 5000,
                    message: e.message
                })
            }
        })
        // (公开)获取目录
        this.expressApp.get(`${this.config.basePath}/papi/get_path`, async (req, res) => {
            let { file_path } = req.query
            file_path = file_path.replace(/\./g, '') // 限制范围
            const realPath = path.join(this.config.photoRoot, file_path)
            try {
                const dir = fs.readdirSync(realPath)
                // 没有图片的目录不能返回
                if (dir.length === 0 || (
                    dir[0].indexOf('.jpg') === -1 &&
                    dir[0].indexOf('.nef') === -1 &&
                    dir[0].indexOf('.jpeg') === -1
                )) {
                    res.send({
                        status: 4003
                    })
                    return 
                }
                res.send({
                    status: 2000,
                    dirs: dir
                })
            } catch(e) {
                res.send({
                    status: 4004,
                    message: e.message
                })
            }
        })
    }

    async midAuth(req, res, next) {
        if (req.cookies && req.cookies.ses !== undefined) {
            if (this.cookie === req.cookies.ses) {
                next()
                return
            }
        }
        res.send({
            status: 4003
        })
    }

    async Run() {
        this.expressApp.listen(this.config.port, () => {
            console.log(`Photo Share service listened at: ${this.config.port}`)
        })

        // test:
        // const res = await this.database.AddPhotoIndex('test', 'Deadfish')
        // console.log(res)
        // const row = await this.database.GetPhotoPathByKey('test')
        // console.log(row)
    }
}

exports.PhotoShareServer = PhotoShareServer