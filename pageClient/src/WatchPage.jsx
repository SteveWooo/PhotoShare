import React from 'react'
import FMHeader from './components/Header.jsx'
import axios from 'axios'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

export default class WatchPage extends React.Component {
    constructor(props) {
        super(props)
        this.config = props.config
        this.state = {
            fileList: [],
            showBigImage: false,
            bigImageUrl: '',
            compressed: false
        }
    }

    componentDidMount() {
        // const filePath = getQueryVariable('file_path')
        // const path_index = getQueryVariable('path_index')
        const { path_index } = this.props
        if (!path_index) {
            return
        }
        // axios.get(`${config.baseUrl}/papi/get_path?file_path=${encodeURIComponent(filePath)}`).then(res => {
        //     if (res.data.status !== 2000) {
        //         alert('faile:' + res.data.status)
        //         return
        //     }

        //     const fileList = []
        //     for (let i = 0; i < res.data.dirs.length; i++) {
        //         let compressedPath = ''
        //         if (res.data.basePublicUrl[res.data.basePublicUrl.length - 1] === '/') {
        //             compressedPath = res.data.basePublicUrl.substring(0, res.data.basePublicUrl.length - 1) + '.compressed/'
        //         } else {
        //             compressedPath = res.data.basePublicUrl + '.compressed/'
        //         }
        //         fileList.push({
        //             source: res.data.basePublicUrl + '/' + res.data.dirs[i],
        //             compressed: compressedPath + res.data.dirs[i]
        //         })
        //     }
        //     this.setState({
        //         fileList: fileList,
        //         compressed: res.data.compressed
        //     })
        // })
        axios.get(`${this.config.baseUrl}/papi/get_file_list?path_index=${encodeURIComponent(path_index)}`).then(res => {
            if (res.data.status !== 2000) {
                alert('faile:' + res.data.status)
                return
            }
            const fileList = []
            for (let i = 0; i < res.data.file_list.length; i++) {
                fileList.push({
                    source: this.config.baseUrl + '/papi/get_file?path_index=' + path_index +
                        '&filename=' + encodeURIComponent(res.data.file_list[i])
                })
            }
            this.setState({
                fileList: fileList,
                compressed: res.data.is_compressed
            })
        })
    }

    showBigImage(url) {
        this.setState({
            bigImageUrl: url,
            showBigImage: true
        })
    }

    render() {
        const fileList = this.state.fileList.map(item => {
            return (
                <div key={item.source} style={{
                    width: '8em',
                    height: '8em',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    alignContent: 'center',
                    padding: '0.3em 0.3em 0.3em 0.3em',
                    margin: '0.7em',
                    border: '0px solid #e0c94f',
                    borderRadius: '5px',
                    boxShadow: '5px 5px 10px #666 ',
                }} onClick={() => {
                    this.showBigImage(item.source + '&origin=true')
                }}>
                    <img style={{
                        maxWidth: '90%',
                        maxHeight: '90%'
                    }} src={item.source} alt="" />
                </div>
            )
        })
        return (
            <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap'
            }}>
                <FMHeader />
                <div style={{
                    width: '100%',
                    height: '2em',
                    fontSize: '0.5em',
                    color: '#956847',
                    padding: '0 2em 0 2em',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignContent: 'center',
                    alignItems: 'center',
                    // borderBottom: '1px solid #e0c94f'
                }}>
                    {/* 长按图片可下载原图 */}
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
                {/* 大图 */}
                {
                    this.state.showBigImage ? (
                        <div style={{
                            width: '100vw',
                            height: '100vh',
                            display: 'flex',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            color: '#fff',
                            alignItems: 'center',
                            alignContent: 'center',
                            position: 'fixed',
                            backgroundColor: '#33333399',
                            top: 0,
                            left: 0,
                            overflow: 'scroll'
                        }} onClick={() => {
                            // this.setState({
                            //     showBigImage: false
                            // })
                        }}>
                            <TransformWrapper initialScale={1}
                                minScale={0.5}
                                initialPositionX={0}
                                initialPositionY={0}
                                contentStyle={{
                                    maxWidth: '95vh',
                                    maxheihgt: '95vw',
                                }}
                                onClick={e => {
                                    // e.preventDefault()
                                    // e.stopPropagation()
                                }}>
                                <TransformComponent onClick={e => {
                                    // e.preventDefault()
                                    // e.stopPropagation()
                                }}>
                                    <img style={{
                                        maxWidth: '100%',
                                        maxheight: '100%',
                                        maxWidth: '95vh',
                                        maxheihgt: '95vw',
                                        width: '100%',
                                        height: '100%'
                                    }} src={this.state.bigImageUrl} alt="" onClick={e => {
                                        // console.log(11)
                                        // e.preventDefault()
                                        // e.stopPropagation()
                                    }} />
                                </TransformComponent>
                            </TransformWrapper>

                            {/* 关闭按钮 */}
                            <div style={{
                                position: 'fixed',
                                fontSize: '4em',
                                right: 10,
                                top: 10,
                                cursor: 'pointer'
                            }} onClick={() => {
                                this.setState({
                                    showBigImage: false
                                })
                            }}>
                                X
                            </div>
                            {/* 下载按钮 */}
                            <div style={{
                                position: 'fixed',
                                fontSize: '4em',
                                left: 10,
                                top: 10,
                                cursor: 'pointer'
                            }} onClick={() => {
                                const downloadLink = document.createElement('a');
                                // 设置链接的下载属性，指定下载的文件名为 'image.jpg'
                                // 抠文件名
                                const urls = this.state.bigImageUrl.split('&');
                                urls.map(d => {
                                    if (d.indexOf('filename=') === 0) {
                                        let filename = d.substring(9)
                                        filename = decodeURIComponent(filename)
                                        downloadLink.download = filename;
                                    }
                                })
                                // 设置链接的 href 属性为图片的 URL
                                downloadLink.href = this.state.bigImageUrl;
                                // 将链接添加到文档中
                                document.body.appendChild(downloadLink);
                                // 模拟点击链接来触发下载
                                downloadLink.click();
                                // 下载完成后移除链接元素
                                document.body.removeChild(downloadLink);
                            }}>
                                下载
                            </div>
                        </div>
                    ) : null
                }
            </div>
        )
    }
}