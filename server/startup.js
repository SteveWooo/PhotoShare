const fs = require('fs')
const {PhotoShareServer} = require('./service')

class FishMint {
    constructor() {}
    Init() {}
}

// Enter
async function main() {
    global.fishMint = new FishMint()
    global.fishMint.Init()

    const photoShareServer = new PhotoShareServer(JSON.parse(fs.readFileSync(`${__dirname}/config.json`)))
    await photoShareServer.Init()
    await photoShareServer.Run()
}
main()