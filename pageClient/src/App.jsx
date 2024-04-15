import React from 'react'
import FMHeader from './components/Header.jsx'
import axios from 'axios'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import WatchPage from './WatchPage.jsx';
import CustomPage from './CustomPage.jsx';

function escapeHtml(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) { return escapeHtml(pair[1]); }
    }
    return (false);
}

export const config = {
    baseUrl: '/photo_share',
    // baseUrl: 'http://localhost:8081/photo_share'
}

export default class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            router: ''
        }
    }

    componentDidMount() {
        const path_index = getQueryVariable('path_index')
        const custom_path = getQueryVariable('custom_path')
        // 纯看图模式
        if (path_index !== false) {
            this.setState({
                router: 'watch'
            })
            return
        }

        // 客户选图模式
        if (custom_path !== false) {
            this.setState({
                router: 'custom'
            })
            return 
        }
    }

    render() {
        return (
            <div>
                {
                    this.state.router === 'watch' ? <WatchPage config={config} path_index={getQueryVariable('path_index')} /> : null
                }
                {
                    this.state.router === 'custom' ? <CustomPage config={config} custom_path={getQueryVariable('custom_path')} /> : null
                }
            </div>
        )
    }
}