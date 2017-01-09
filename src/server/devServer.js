const path = require('path')
const express = require('express')
const webpack = require('webpack')
const webpackHotMiddleware = require('webpack-hot-middleware')
const webpackDevMiddleware = require('webpack-dev-middleware')
const config = require('../../webpack.config.dev')
const constants = require('../../webpack/constants')

const app = express()
const compiler = webpack(config)

app.use(webpackDevMiddleware(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath,
  output: {
    path: '/'
  },
  stats: {
    colors: true
  }
}))

app.use(webpackHotMiddleware(compiler))

const serveHtmlFromFileSystem = (compiler, fileName, response, next) => {
  compiler.outputFileSystem.readFile(fileName, (err, result) => {
    if (err) {
      return next(err)
    }

    response.set('content-type', 'text/html')
    response.send(result)
    response.end()
  })
}

//explicitly serving all .dll.js since  they are not handled by webpack dev server automatically since are not part
  //of the current webpack build (dlls are separate webpack build)
app.get(/\.dll\.js$/, (req, res) => {
  const filename = req.path.replace(/^\//, '')
  const filePath = path.join(process.cwd(), filename)
  res.sendFile(filePath)
})

//serving different index.html for widgets
app.get('/widgets/*', function(req, res, next) {
  const filename = path.join(compiler.outputPath, '/widgets/index.html')
  serveHtmlFromFileSystem(compiler, filename, res, next)
})



app.get('*', function(req, res, next) {
  //this reads index.html from webpacks file system which is "in-memory" in case of dev server
  //also note that "index.html" is generated by HtmlWebpackPlugin from template
  const filename = path.join(compiler.outputPath, constants.INDEX_HTML)
  serveHtmlFromFileSystem(compiler, filename, res, next)
})

app.listen(constants.DEV_SERVER_PORT, 'localhost', function(err) {
  if (err) {
    console.log(err) // eslint-disable-line  no-console
    return
  }

  console.info('Listening at http://localhost:' + constants.DEV_SERVER_PORT) // eslint-disable-line  no-console
})
