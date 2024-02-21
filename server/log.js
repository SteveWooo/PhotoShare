const log = {
    succ: msg => {
        console.log(`- success - ( ${msg} )`)
    },
    err: msg => {
        console.error(`- error - ( ${msg} )`)
    },
    warn: msg => {
        console.warn(`- warning - ( ${msg} )`)
    }
}
exports.log = log