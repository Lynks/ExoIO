const { app } = require('electron');
if (require('electron-squirrel-startup')) return app.quit();

const path = require('path');

require(path.join(__dirname, 'server/index.js'))
require(path.join(__dirname, 'app.js'))
