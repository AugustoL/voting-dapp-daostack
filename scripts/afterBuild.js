const replace = require('replace-in-file');
const path = require("path");
const basePath = path.resolve(process.cwd(), '../');
console.log(basePath)
const options = {
  files: ['dist/bundle.js','dist/1.bundle.js'],
  from: new RegExp(basePath, 'g'),
  to: '',
};

replace(options)
  .then(results => {
    console.log('Replacement results:', results);
  })
  .catch(error => {
    console.error('Error occurred:', error);
  });
