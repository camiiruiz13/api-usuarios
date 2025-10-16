const path = require('path');
const fs = require('fs');

const aliasPath = path.join(__dirname, 'node_modules/module-alias/register');
if (fs.existsSync(aliasPath)) {
    require(aliasPath);
} else {
    console.warn('module-alias no encontrado, ajustando NODE_PATH manualmente...');
    process.env.NODE_PATH = path.join(__dirname, 'node_modules');
    require('module').Module._initPaths();
}

module.exports = require('./src/index');
