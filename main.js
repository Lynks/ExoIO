// if (process.argv[1] === '--start-server') {
//   require('./server/index.js')
//   return
// }

// require('./app/index.js')
// require('child_process').spawn(process.execPath, ['--start-server'])

const path = require('path');

require(path.join(__dirname, 'server/index.js'))
require(path.join(__dirname, 'app.js'))
