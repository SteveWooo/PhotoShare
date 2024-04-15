import React from 'react'
import FMHeader from './components/Header.jsx'
import axios from 'axios'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import FMButton from './components/Button.jsx';

export default class CustomPage extends React.Component {
    constructor(props) {
        super(props)
        this.config = props.config
        this.state = {
            fileList: [],
            selectedFiles: {},
            showBigImage: false,
            bigImageUrl: '',
            bigImageFileName: '',

            // 是否显示已选择的内容
            showSelected: 'false',
            // 是否只看已经选择的图片
            onlyShowSelected: false,

            // 操作中
            loading: false
        }
    }

    componentDidMount() {
        this.updateFileList()
    }

    updateFileList() {
        const { custom_path } = this.props
        this.setState({
            loading: true
        })
        axios.get(`${this.config.baseUrl}/papi/get_custom_files?is_selected=${this.state.showSelected}&custom_path=${encodeURIComponent(custom_path)}`).then(res => {
            if (res.data.status !== 2000) {
                alert('faile:' + res.data.status)
                return
            }
            const fileList = []
            for (let i = 0; i < res.data.file_list.length; i++) {
                fileList.push({
                    source: this.config.baseUrl + `/papi/get_custom_file?is_selected=${this.state.showSelected}&custom_path=` + encodeURIComponent(custom_path) +
                        '&file_name=' + encodeURIComponent(res.data.file_list[i]),
                    fileName: res.data.file_list[i],
                })
            }
            // 处理已经选择了的文件
            const selectedFiles = {}

            for (let i = 0; i < res.data.selected_files.length; i++) {
                selectedFiles[res.data.selected_files[i]] = true
            }
            this.setState({
                fileList: fileList,
                loading: false,
                selectedFiles: selectedFiles
            })
        })
    }

    showBigImage(url, fileName) {
        this.setState({
            bigImageUrl: url,
            bigImageFileName: fileName,
            showBigImage: true
        })
    }

    selectImg(fileName) {
        const { custom_path } = this.props
        this.setState({
            loading: true
        })
        axios.get(`${this.config.baseUrl}/papi/select_custom_file?custom_path=${encodeURIComponent(custom_path)}&file_name=${fileName}`).then(res => {
            if (res.data.status !== 2000) {
                alert('faile:' + res.data.status)
                return
            }
            this.updateFileList()
        })
    }

    unselectImg(fileName) {
        const { custom_path } = this.props
        this.setState({
            loading: true
        })
        axios.get(`${this.config.baseUrl}/papi/unselect_custom_file?custom_path=${encodeURIComponent(custom_path)}&file_name=${fileName}`).then(res => {
            if (res.data.status !== 2000) {
                alert('faile:' + res.data.status)
                return
            }
            this.updateFileList()
        })
    }

    render() {
        const fileList = this.state.fileList.map(item => {
            if (this.state.onlyShowSelected && !this.state.selectedFiles[item.fileName]) {
                return 
            }
            return (
                <div key={item.source} style={{
                    width: '40%',
                    height: '40vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    alignContent: 'center',
                    padding: '0.3em 0.3em 1em 0.3em',
                    margin: '0.7em',
                    border: '0px solid #e0c94f',
                    borderRadius: '5px',
                    boxShadow: '5px 5px 10px #666 ',
                }} >
                    <div style={{
                        height: '80%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <img style={{
                            width: '90%', 
                            height: 'auto',
                            maxWidth: '90%',
                            maxHeight: '90%'
                        }} src={item.source} alt="" onClick={() => {
                            this.showBigImage(item.source, item.fileName)
                        }} />
                    </div>
                    <div style={{
                        height: '20%',
                        display: 'flex',
                        alignItems: 'center',
                        flexDirection: 'column',
                        justifyContent: 'flex-end'
                    }}>
                        {
                            this.state.loading && (
                                <div style={{
                                    width: '6em',
                                    height: '2em',
                                    lineHeight: '2em',
                                    textAlign: 'center',
                                }}>
                                    loading ....
                                </div>
                            )
                        }
                        {
                            !this.state.loading && !this.state.selectedFiles[item.fileName] && (
                                <div style={{
                                    width: '6em',
                                    height: '2em',
                                    lineHeight: '2em',
                                    textAlign: 'center',
                                    backgroundColor: '#FEEA83',
                                    borderRadius: '0.5em',
                                    cursor: 'pointer'
                                }} onClick={() => {
                                    this.selectImg(item.fileName)
                                }}>
                                    选中
                                </div>
                            )
                        }
                        {
                            !this.state.loading && this.state.selectedFiles[item.fileName] === true && (
                                <div style={{
                                    width: '6em',
                                    height: '2em',
                                    lineHeight: '2em',
                                    textAlign: 'center',
                                    backgroundColor: '#d94433',
                                    borderRadius: '0.5em',
                                    cursor: 'pointer'
                                }} onClick={() => {
                                    this.unselectImg(item.fileName)
                                }}>
                                    取消选择
                                </div>
                            )
                        }
                    </div>
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
                <FMHeader style={{
                    position: 'fixed',
                    top: 0
                }} />
                <div style={{
                    position: 'fixed',
                    top: '50px',
                    width: '100%',
                    height: '2em',
                    lineHeihgt: '2em',
                    padding: '1em 1em 0em 1em',
                    fontSize: '1.2em',
                    backgroundColor: '#fff',
                    
                }}>
                    已选：{this.state.selectedFiles && Object.keys(this.state.selectedFiles).length}
                    (
                        只看已选 <input type="checkbox" checked={this.state.onlyShowSelected} onChange={() => {
                            this.setState({
                                onlyShowSelected: !this.state.onlyShowSelected
                            })
                        }} />
                    )
                </div>
                <div style={{
                    width: '100%',
                    display: 'flex',
                    marginTop: '110px',
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
                            backgroundColor: '#333333ee',
                            top: 0,
                            left: 0,
                            overflow: 'scroll'
                        }} onClick={() => {
                            this.setState({
                                showBigImage: false
                            })
                        }}>
                            <TransformWrapper initialScale={1}
                                minScale={0.5}
                                maxScale={3}
                                initialPositionX={0}
                                initialPositionY={0}
                                contentStyle={{
                                    maxWidth: '95vh',
                                    maxheihgt: '95vw',
                                }}
                                onClick={e => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                }}>
                                <TransformComponent onClick={e => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                }}>
                                    <img src={this.state.bigImageUrl} alt="" onClick={e => {
                                        e.preventDefault()
                                        e.stopPropagation()
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
                        </div>
                    ) : null
                }
            </div>
        )
    }
}