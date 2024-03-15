import React from 'react'
import axios from 'axios'
import FMHeader from './components/Header.jsx'
import FMButton from './components/Button.jsx'
import sha256 from 'js-sha256'
import QRCode from 'qrcode.react';

const config = {
    baseUrl: 'http://deadfishcrypto.tpddns.cn:20000/photo_share'
    // baseUrl: 'http://localhost:2010/photo_share'
}

class LoginPage extends React.Component {
    constructor(p) {
        super(p)

        this.inputRef = React.createRef()
    }

    componentDidMount() {

    }

    Login() {
        const now = +new Date()
        const string = 'fishmint'
        const source = `${string}.${now}.${this.inputRef.current.value}`
        const cry = sha256(source)
        axios.get(`/photo_share/api/login?now=${now}&cry=${cry}`).then(res => {
            this.inputRef.current.value = ''
            if (res.data.status === 2000) {
                this.props.checkLogin()
                return
            }
        })
    }

    render() {
        return (
            <div style={{
                width: '90%',
                display: 'flex',
                justifyContent: 'center',
                height: '7em',
                flexWrap: 'wrap',
                alignContent: 'center',
                alignItems: 'center',
            }}>
                <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '10px 10px 10px 10px'
                }} >
                    <input style={{
                        borderRadius: '5px',
                        height: '3em',
                        fontFamily: 'canger',
                        border: '2px solid #e0c94f'
                    }} ref={this.inputRef} />
                </div>
                <FMButton text="登录" onClick={() => { this.Login() }} />
            </div>
        )
    }
}

class DirPage extends React.Component {
    constructor(p) {
        super(p)
        this.state = {
            currentPath: '/',
            fileList: [],
            showQR: false,
            qrPath: '',

            showBigImg: false,
            bigImgSrc: ''
        }
    }

    componentDidMount() {
        this.updateList()
    }

    updateList() {
        axios.get(`/photo_share/api/get_path?file_path=${this.state.currentPath}`).then(res => {
            if (res.data.status !== 2000) return
            const fileList = res.data.dirs
            for (let i = 0; i < fileList.length; i++) {
                if (fileList[i].indexOf('.') === 0) {
                    fileList.splice(i, 1)
                    i--;
                    continue
                }
            }

            this.setState({
                fileList: res.data.dirs
            })
        })
    }

    onClickItem(name) {
        if (this.isImg(name)) {
            this.setState({
                showBigImg: true,
                bigImgSrc: `${config.baseUrl}/files${this.state.currentPath}${name}`
            })
            return
        }
        this.setState({
            currentPath: this.state.currentPath + encodeURIComponent(name) + '/'
        }, () => {
            this.updateList()
        })
    }

    isImg(name) {
        if (
            name.indexOf('.jpg') !== -1 ||
            name.indexOf('.jpeg') !== -1 ||
            name.indexOf('.JPG') !== -1
        ) {
            return true
        }
        return false
    }

    goBack() {
        let currentPath = this.state.currentPath.split('/')
        let targetPath = ''
        if (currentPath.length === 0) {
            targetPath = '/'
        } else {
            currentPath.pop(1)
            currentPath.pop(1)
            targetPath = currentPath.join('/') + '/'
        }
        this.setState({
            currentPath: targetPath
        }, () => {
            this.updateList()
        })
    }
    showQR() {
        const file_path = encodeURIComponent(this.state.currentPath)
        // const url = config.baseUrl + '/client?file_path=' + file_path
        // this.setState({
        //     qrPath: url,
        //     showQR: true
        // })

        // 创建索引
        axios.get(`/photo_share/api/create_path_index?file_path=${this.state.currentPath}`).then(r => {
            if (r.data.status === 2000) {
                const url = config.baseUrl + '/client?path_index=' + r.data.id
                this.setState({
                    qrPath: url,
                    showQR: true
                })
            }
        })
    }

    render() {
        const fileList = this.state.fileList.map(filename => {
            if (
                filename.indexOf('.NEF') !== -1 ||
                filename.indexOf('.acr') !== -1 ||
                filename.indexOf('.xmp') !== -1 ||
                filename.indexOf('.dng') !== -1
            ) {
                return
            }
            return (
                <div key={filename} style={{
                    width: '7em',
                    margin: '1em',
                    fontSize: '0.8em',
                    height: '7em',
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '0 0.2em 0 0.2em',
                    alignContent: 'center',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    border: '1px solid #e0c94f',
                    borderRadius: '5px',
                    boxShadow: '2px 5px 5px #f30ba4',
                    cursor: 'default',
                    userSelect: 'none'
                }} onClick={() => {
                    this.onClickItem(filename)
                }}>
                    {
                        this.isImg(filename) ? (
                            <img style={{
                                maxWidth: '95%',
                                maxHeight: '95%'
                            }} src={`${config.baseUrl}/files${this.state.currentPath}${filename}`} />
                        ) : (
                            <div >
                                {filename}
                            </div>
                        )
                    }
                </div >
            )
        })
        return (
            <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap'
            }}>
                <div style={{
                    width: '100%',
                    height: '3em',
                    padding: '0 2em 0 2em',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignContent: 'center',
                    alignItems: 'center',
                    borderBottom: '1px solid #e0c94f'
                }}>
                    <div>
                        {
                            this.state.currentPath === '/' ? '' : (
                                <FMButton text="返回" onClick={() => { this.goBack() }}></FMButton>
                            )
                        }
                    </div>
                    <div>
                        <FMButton text="二维码" onClick={() => { this.showQR() }}></FMButton>
                    </div>
                </div>
                <div style={{
                    width: '100%',
                    display: 'flex',
                    marginTop: '1em',
                    flexWrap: 'wrap',
                    justifyContent: 'space-around',
                }}>
                    {fileList}
                </div>
                {
                    this.state.showQR ? (
                        <div style={{
                            width: '100vw',
                            height: '100vh',
                            display: 'flex',
                            justifyContent: 'center',
                            alignContent: 'center',
                            alignItems: 'center',
                            position: 'absolute',
                            backgroundColor: '#33333399',
                            top: 0,
                            left: 0
                        }} onClick={() => {
                            this.setState({
                                showQR: false,
                                qrPath: ''
                            })
                        }}>
                            <QRCode
                                value={this.state.qrPath}// 生成二维码的内容
                                size={300} // 二维码的大小
                                fgColor="#000000" // 二维码的颜色
                                imageSettings={{ // 中间有图片logo
                                    height: 60,
                                    width: 60,
                                    excavate: true
                                }}
                            />
                        </div>
                    ) : null
                }
                {/* 大图 */}
                {
                    this.state.showBigImg ? (
                        <div style={{
                            width: '100vw',
                            height: '100vh',
                            display: 'flex',
                            justifyContent: 'center',
                            alignContent: 'center',
                            alignItems: 'center',
                            position: 'absolute',
                            backgroundColor: '#33333399',
                            top: 0,
                            left: 0
                        }} onClick={() => {
                            this.setState({
                                showBigImg: false
                            })
                        }}>
                            <img style={{
                                maxWidth: '95%',
                                maxHeight: '95%'
                            }} src={this.state.bigImgSrc} />
                        </div>
                    ) : null
                }
            </div >
        )
    }
}

export default class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            doneLoad: false,
            logined: false
        }
    }

    componentDidMount() {
        this.checkLogin()
    }

    checkLogin() {
        axios.get('/photo_share/api/check_login').then(res => {
            if (res.data.status === 2000) {
                this.setState({
                    logined: true,
                    doneLoad: true
                })
            } else {
                this.setState({
                    logined: false,
                    doneLoad: true
                })
            }
        })
    }

    render() {
        return (
            <div style={{
                display: 'flex',
                width: '100%',
                flexWrap: 'wrap',
                alignContent: 'center',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <FMHeader />
                {
                    this.state.doneLoad ?
                        (
                            this.state.logined === true ?
                                <DirPage /> : <LoginPage checkLogin={() => { this.checkLogin() }} />
                        )
                        : undefined
                }
            </div>
        )
    }
}