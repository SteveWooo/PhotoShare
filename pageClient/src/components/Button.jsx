import React from 'react'

const BUTTON_STATUS = {
    NORMAL: 'normal',
    MOUSE_ON: 'mouseOn',
    MOUSE_DOWN: 'mouseDown',
    DISABLE: 'disable'
}

export default class FMButton extends React.Component {
    constructor(p) {
        super(p)
        this.state = {
            buttonStatus: BUTTON_STATUS.NORMAL,
        }

        this.buttonRef = React.createRef()
    }

    componentDidMount() {

    }

    render() {
        return (
            <div ref={this.buttonRef}>
               button 
            </div>
        )
    }
}