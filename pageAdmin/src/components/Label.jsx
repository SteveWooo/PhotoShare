import React from 'react'
import { DOM_STATUS } from '../utils/utils'
export default class FMLabel extends React.Component {
    constructor(p) {
        super(p)
        this.state = {
            status: DOM_STATUS.NORMAL,
        }

        this.ref = React.createRef()
    }

    componentDidMount() {

    }

    render() {
        return (
            <div
                ref={this.ref}
                style={this.props.style}
                className={'fm-label'}
            >
                {this.props.text}
            </div>
        )
    }
}