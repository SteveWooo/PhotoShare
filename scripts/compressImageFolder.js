const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = '/mnt/home_sweet_home/Images/DeadFish/Friends/ZhaoQing/20240414-bohaiPark';
const outputDir = '/mnt/home_sweet_home/Images/DeadFish/Friends/ZhaoQing/20240414-bohaiPark.compressed';

if (fs.existsSync(outputDir) === true) {
    console.log('already compressed.')
    return ;
} else {
    fs.mkdirSync(outputDir);
}

fs.readdir(inputDir, (err, files) => {
    if (err) throw err;

    files.forEach(file => {
        sharp(path.join(inputDir, file))
            .resize(128) // 设置图片宽度
            .toFile(path.join(outputDir, file), (err, info) => {
                if (err) throw err;
                console.log(info);
            });
    });
});