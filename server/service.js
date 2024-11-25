const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')
const cookirParser = require('cookie-parser')
const sha256 = require('js-sha256')
const { DataBase } = require('./database')
const { log } = require('./log')
const sharp = require('sharp');


class PhotoShareServer {
    expressApp = null
    config = {}
    database = {}

    cookie = ''

    indexCache = {} // 缓存索引 -> 目录路径

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
        this.expressApp.use(`${this.config.basePath}/files`, express.static(this.config.photoRoot, {
            maxAge: '1d', // 1 day
            setHeaders: (res) => {
                res.setHeader('Cache-Control', 'public, max-age=86400');
            }
        }))
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
                // 压缩目录下的文件
                await this._compressFiles(file_path)
                if (result.row.length === 0) {
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
            } catch (e) {
                res.send({
                    status: 5000,
                    message: e.message
                })
            }
        })
        // (公开)获取目录 🚮废弃
        // this.expressApp.get(`${this.config.basePath}/papi/get_path`, async (req, res) => {
        //     let { file_path } = req.query
        //     file_path = file_path.replace(/\./g, '') // 限制范围
        //     for (let i = 0; i < 5; i++) {
        //         let nextFilePath = decodeURIComponent(file_path)
        //         if (nextFilePath === file_path) {
        //             file_path = nextFilePath
        //             break
        //         }
        //         file_path = nextFilePath
        //     }
        //     let realPath = path.join(this.config.photoRoot, file_path)
        //     if (realPath[realPath.length - 1] === '/') {
        //         realPath = realPath.substring(0, realPath.length - 1)
        //     }
        //     try {
        //         const dir = fs.readdirSync(realPath)
        //         // 没有图片的目录不能返回
        //         if (dir.length === 0 || (
        //             dir[0].indexOf('.jpg') === -1 &&
        //             dir[0].indexOf('.nef') === -1 &&
        //             dir[0].indexOf('.jpeg') === -1 &&
        //             dir[0].indexOf('.JPG') === -1
        //         )) {
        //             res.send({
        //                 status: 4003
        //             })
        //             return
        //         }
        //         const compressed = fs.existsSync(realPath + '.compressed')
        //         res.send({
        //             status: 2000,
        //             basePublicUrl: `${this.config.basePublicUrl}${this.config.basePath}/files${file_path}`,
        //             dirs: dir,
        //             compressed: compressed
        //         })
        //     } catch (e) {
        //         console.log(e)
        //         res.send({
        //             status: 4004,
        //             // message: e.message
        //         })
        //     }
        // })


        // 公开：获取文件列表
        this.expressApp.get(`${this.config.basePath}/papi/get_file_list`, async (req, res) => {
            const { path_index } = req.query
            const indexCacheInfo = await this._getFileDirByIndex(path_index)
            if (indexCacheInfo === undefined) {
                res.sendStatus(404)
                return
            }

            // 返回目标目录下的文件列表
            const fileList = fs.readdirSync(indexCacheInfo.realPath)
            res.send({
                status: 2000,
                file_list: fileList,
                is_compressed: indexCacheInfo.isCompressed
            })

        })

        // 公开：获取具体文件，这里一般直接给img来设置src
        /**
         * @param origin 是否获取原图
         * @param path_index 目录索引
         * @param filename 文件名
         */
        this.expressApp.get(`${this.config.basePath}/papi/get_file`, async (req, res) => {
            let { filename, path_index, origin } = req.query
            filename = filename.replace(/\//g, '').replace(/\\/g, '').replace(/\.\./g, '')
            const indexCacheInfo = await this._getFileDirByIndex(path_index)
            if (indexCacheInfo === undefined) {
                res.send(404)
                return
            }
            // 获取文件
            let filePath
            if (indexCacheInfo.isCompressed && !origin) {
                filePath = path.join(indexCacheInfo.dirname, indexCacheInfo.basename + '.compressed', decodeURIComponent(filename))
            } else {
                filePath = path.join(indexCacheInfo.realPath, decodeURIComponent(filename))
            }
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.sendStatus(403)
                    return
                }
                res.send(data)
            })
        })

        /**
         * 选片目录获取
         * @param custom_path 客户目录
         */
        this.expressApp.get(`${this.config.basePath}/papi/get_custom_files`, async (req, res) => {
            let { custom_path, is_selected } = req.query
            custom_path = custom_path.replace(/\//g, '').replace(/\\/g, '').replace(/\./g, '')
            // 检查目录是否存在
            if (!fs.existsSync(path.join(this.config.photoRoot, 'Custom', custom_path))) {
                res.sendStatus(404)
                return
            }

            // 创建一下已选目录
            if (!fs.existsSync(
                path.join(this.config.photoRoot, 'Custom', custom_path, 'selected')
            )) {
                fs.mkdirSync(
                    path.join(this.config.photoRoot, 'Custom', custom_path, 'selected')
                )
            }
            // 并且返回已选目录
            const selectedFiles = fs.readdirSync(
                path.join(this.config.photoRoot, 'Custom', custom_path, 'selected')
            )

            try {
                const fileList = fs.readdirSync(
                    path.join(
                        this.config.photoRoot, 'Custom', custom_path,
                        is_selected === 'true' ? 'selected' : ''
                    )
                )
                for (let i = 0; i < fileList.length; i++) {
                    if (!(await this._isImage(fileList[i]))) {
                        fileList.splice(i, 1)
                        i--;
                        continue
                    }
                }
                for (let i = 0; i < selectedFiles.length; i++) {
                    if (!(await this._isImage(selectedFiles[i]))) {
                        selectedFiles.splice(i, 1)
                        i--;
                        continue
                    }
                }
                res.send({
                    status: 2000,
                    file_list: fileList,
                    selected_files: selectedFiles,
                })
            } catch (e) {
                res.sendStatus(404)
            }
        })
        /**
         * 返回图片文件
         */
        this.expressApp.get(`${this.config.basePath}/papi/get_custom_file`, async (req, res) => {
            let { custom_path, is_selected, file_name, origin } = req.query
            custom_path = custom_path.replace(/\//g, '').replace(/\\/g, '').replace(/\./g, '')
            file_name = file_name.replace(/\//g, '').replace(/\\/g, '').replace(/\.\./g, '')
            try {
                let sourceFilePath = path.join(
                    this.config.photoRoot, 'Custom', custom_path,
                    is_selected === 'true' ? 'selected' : '', file_name
                )
                if (!fs.existsSync(sourceFilePath)) {
                    res.sendStatus(404)
                    return
                }

                // 尝试找压缩的文件
                if (!origin) {
                    sourceFilePath = path.join(
                        this.config.photoRoot, 'Custom', custom_path + '.compressed', file_name
                    )
                }

                fs.readFile(sourceFilePath, (err, data) => {
                    if (err) {
                        res.sendStatus(403)
                        return
                    }
                    res.send(data)
                })
            } catch (e) {
                console.log(e)
                res.sendStatus(404)
            }
        })

        /**
         * 选片操作
         */
        this.expressApp.get(`${this.config.basePath}/papi/select_custom_file`, async (req, res) => {
            let { custom_path, file_name } = req.query
            custom_path = custom_path.replace(/\//g, '').replace(/\\/g, '').replace(/\./g, '')
            file_name = file_name.replace(/\//g, '').replace(/\\/g, '').replace(/\.\./g, '')
            try {
                const sourceFilePath = path.join(
                    this.config.photoRoot, 'Custom', custom_path, file_name
                )
                const targetFilePath = path.join(
                    this.config.photoRoot, 'Custom', custom_path, 'selected', file_name
                )
                if (!fs.existsSync(sourceFilePath)) {
                    res.sendStatus(404)
                    return
                }

                // 选片，放入目录
                fs.cpSync(sourceFilePath, targetFilePath)

                // 写Log
                const logPath = path.join(
                    this.config.photoRoot, 'Custom', custom_path, 'selected', 'log.txt'
                )
                if (!fs.existsSync(logPath)) {
                    fs.writeFileSync(logPath, '')
                }
                fs.appendFileSync(logPath, `select ${file_name}\n`)

                res.send({
                    status: 2000
                })
            } catch (e) {
                console.log(e)
                res.sendStatus(404)
            }
        })

        /**
         * 弃片操作
         */
        this.expressApp.get(`${this.config.basePath}/papi/unselect_custom_file`, async (req, res) => {
            let { custom_path, file_name } = req.query
            custom_path = custom_path.replace(/\//g, '').replace(/\\/g, '').replace(/\./g, '')
            file_name = file_name.replace(/\//g, '').replace(/\\/g, '').replace(/\.\./g, '')
            try {
                const targetFilePath = path.join(
                    this.config.photoRoot, 'Custom', custom_path, 'selected', file_name
                )
                if (!fs.existsSync(targetFilePath)) {
                    res.sendStatus(404)
                    return
                }

                // 删片
                fs.rmSync(targetFilePath)
                // 写Log
                const logPath = path.join(
                    this.config.photoRoot, 'Custom', custom_path, 'selected', 'log.txt'
                )
                if (!fs.existsSync(logPath)) {
                    fs.writeFileSync(logPath, '')
                }
                fs.appendFileSync(logPath, `unselect ${file_name}\n`)

                res.send({
                    status: 2000
                })
            } catch (e) {
                console.log(e)
                res.sendStatus(404)
            }
        })
    }

    async _isImage(fileName) {
        if (
            fileName.indexOf('jpg') === -1 &&
            fileName.indexOf('jpeg') === -1 &&
            fileName.indexOf('png') === -1 &&
            fileName.indexOf('JPG') === -1 &&
            fileName.indexOf('JPEG') === -1
        ) {
            return false
        }
        return true
    }

    async _getFileDirByIndex(path_index) {
        // 检查是否有缓存
        let filepathRes
        if (this.indexCache[path_index] === undefined) {
            filepathRes = await this.database.GetPhotoPathByKey(path_index)
            if (filepathRes.status !== 2000 || filepathRes.row.length <= 0) {
                return undefined
            }
            // 建立缓存
            // 获取目标文件夹下的图片文件
            const filePath = filepathRes.row[0].path
            let realPath = path.join(this.config.photoRoot, filePath)
            const basename = path.basename(realPath) // 目标文件夹名
            const dirname = path.dirname(realPath) // 目标目录名
            // 检查是否有压缩目录：
            let isCompressed = false
            if (fs.existsSync(path.join(dirname, basename + '.compressed'))) {
                isCompressed = true
            }

            this.indexCache[path_index] = {
                filePath, realPath, basename, dirname, isCompressed
            }
        }

        return this.indexCache[path_index]
    }

    async _compressFiles(inputDir) {
        return new Promise(resolve => {
            const outputDir = path.join(this.config.photoRoot, path.dirname(inputDir), path.basename(inputDir) + '.compressed')
            if (inputDir.indexOf('.compressed') !== -1) {
                resolve()
                return
            }

            const files = fs.readdirSync(path.join(this.config.photoRoot, inputDir));
            // 只有全部都是jpg的图片或者jpeg的图片，才能压缩
            const regex = /\.(jpeg|jpg)$/i
            for (let i = 0; i < files.length; i++) {
                if (!regex.test(files[i])) {
                    resolve()
                    return
                }
            }

            if (fs.existsSync(outputDir) === true) {
                resolve()
                return;
            } else {
                fs.mkdirSync(outputDir, {mode: 0o777});
            }

            let counter = 0
            files.forEach(file => {
                sharp(path.join(this.config.photoRoot, inputDir, file))
                    .resize(128) // 设置图片宽度
                    .toFile(path.join(outputDir, file), (err, info) => {
                        if (err) {
                            console.error(err)
                        } else {
                            
                        }
                        // console.log(info);
                        counter++
                        if (counter >= files.length) {
                            fs.chmodSync(outputDir, 0o777);
                            resolve()
                            return
                        }
                    });
            });
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