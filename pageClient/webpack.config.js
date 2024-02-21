const HtmlWebpackPlugin = require("html-webpack-plugin");
const fs = require('fs')

// ========== 插件 =========
const htmlPlugin = new HtmlWebpackPlugin({
    template: "./src/index.html",
    filename: "index.html"
});

// ========= 打包规则 =========
const moduleRule = {
    rules: [{
        test: /\.(jpg|png|gif)$/,
        type: "asset/resource",
        parser: {
            dataUrlCondition: {
                maxSize: 16
            }
        },
        generator: {
            filename: "res/[name][ext]",
            publicPath: "./res"
        },
    }, {
        test: /\.jsx?$/,
        use: "babel-loader",
    }, {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
    }]
}

// const mode = "production";
// const mode = "development";
const mode = process.env.NODE_ENV

const outputPath = `${__dirname}/dist`
// 复制资源目录到目标目录
const sourceResPath = `${__dirname}/src/res`
const targetResPath = `${outputPath}/res`
fs.rmdirSync(outputPath)
fs.mkdirSync(targetResPath, { recursive: true })
const images = fs.readdirSync(sourceResPath)
for(let i = 0; i < images.length; i++) {
    fs.copyFileSync(`${sourceResPath}/${images[i]}`, `${targetResPath}/${images[i]}`)
}

module.exports={
    mode: mode,
    
    entry: "./src/index.js",
    output: {
        filename: "bundle.[hash].js",
        path: `${__dirname}/dist`,
        publicPath: mode === 'production' ? './' : '/'
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    devServer: {
        historyApiFallback: true,
        static: `${__dirname}/src`
	},
    module: moduleRule,
    plugins: [htmlPlugin],
}