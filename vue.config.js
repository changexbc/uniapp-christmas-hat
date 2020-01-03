const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
function resolve (dir) {
    return path.join(__dirname, dir)
}

module.exports = {
    configureWebpack: {
        plugins: [
            new CopyWebpackPlugin([
                {
                    from: path.join(__dirname, 'cloudfunctions'),
                    to: path.join(__dirname, 'unpackage/dist', process.env.NODE_ENV === 'production' ? 'build' : 'dev', process.env.UNI_PLATFORM, 'cloudfunctions')
                }
            ])
        ]
    },
    chainWebpack: (config)=>{
        config.resolve.alias
            .set('@static',resolve('static'))
    }
}