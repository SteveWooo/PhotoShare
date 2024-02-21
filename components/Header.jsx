import React from 'react'
import FMLabel from './Label.jsx';

export default class FMHEADER extends React.Component {
    constructor(p) {
        super(p)

    }

    componentDidMount() {

    }

    itemStyle() {
        return {
            width: '10em',
            height: '100%',
            display: 'flex',
            alignContent: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1em',
            padding: '0 0.2em 0 0.2em',
            color: '#956847',
            // border: '1px solid #fff',
        }
    }

    titleStyle() {
        const itemStyle = this.itemStyle();
        itemStyle.fontSize = '1.5em';
        itemStyle.marginLeft = '0.5em';
        itemStyle.justifyContent = 'flex-start'
        return itemStyle
    }

    iconStyle() {
        const itemStyle = this.itemStyle()
        itemStyle.backgroundImage = 'url("res/icon.compressed.png")'
        itemStyle.backgroundSize = '80%'
        itemStyle.backgroundRepeat = 'no-repeat'
        itemStyle.backgroundPosition = 'center'
        itemStyle.height = '100%'
        itemStyle.width = '4em'
        return itemStyle
    }

    render() {
        return (
            <div style={{
                width: '100%',
                height: '80px',
                backgroundColor: '#eadec4',
                // backgroundColor: '#95a9df',
                boxShadow: '0em 0.1em 3px #c4f2f3',
                // borderBottom: '1px solid #fff',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                alignContent: 'center',
                justifyContent: 'flex-start',
            }}>
                {/* <div style={this.iconStyle()}></div> */}
                <FMLabel
                    text={'鱼昕草™Studio'}
                    style={this.titleStyle()}
                    onMouseOver={e => { console.log(e.target.className) }} />
            </div>
        )
    }
}