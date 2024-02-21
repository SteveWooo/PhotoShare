export default {
    getDeviceInfo: () => {
        const userAgent = window.navigator.userAgent;
        if (userAgent.match(/iPad/i)) {
            return { deviceType: DEVICE_TYPE.PAD };
        } else if (userAgent.match(/Android|webOS|iPhone|iPod|BlackBerry/i)) {
            return { deviceType: DEVICE_TYPE.MOBILE };
        } else {
            return { deviceType: DEVICE_TYPE.PC }
        }
    }
}

export const DEVICE_TYPE = {
    PC: 'pc',
    MOBILE: 'mobile',
    PAD: 'pad'
}

export const DOM_STATUS = {
    NORMAL: 'normal',
    MOUSE_OVER: 'mouseOver',
    MOUSE_DOWN: 'mouseDown',
    MOUSE_LEAVE: 'mouseLeave',
    DISABLE: 'disable'
}
