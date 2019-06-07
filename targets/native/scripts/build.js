const sortPackageJson = require('sort-package-json')
const rimraf = require('rimraf')
const path = require('path')
const fs = require('fs-extra')

process.chdir(path.resolve(__dirname, '..'))

// Delete previous builds.
rimraf.sync('dist/src')

// Avoid bundling the "src" directory, because we want proper
// sourcemap support when using Metro.
fs.copySync('src', 'dist/src')
fs.copySync('tsconfig.json', 'dist/tsconfig.json')

// We need to move embedded dependencies after they're installed.
fs.copySync('scripts/_postinstall.js', 'dist/postinstall.js')

// Copy "@react-spring/core" into this package (instead of depending on it)
// because we want proper sourcemap support when using Metro.
fs.copySync('../core/src', 'dist/src/core')
const json = fs.readJsonSync('../core/package.json')
json.main = 'index.ts'
delete json.scripts
delete json.dependencies
fs.writeJsonSync('dist/src/core/package.json', sortPackageJson(json))

// Remove any test files.
rimraf.sync('dist/src/**/__tests__')
rimraf.sync('dist/src/**/*.test.ts')
