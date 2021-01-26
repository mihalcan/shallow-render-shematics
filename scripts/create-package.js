const fs = require('fs');
const path = require('path');

function cp(from, to) {
  const fromPath = path.join(process.cwd(), from);
  const toPath = path.join(process.cwd(), to);

  if (fs.lstatSync(fromPath).isFile()) {
    !fs.existsSync(path.dirname(toPath)) && fs.mkdirSync(path.dirname(toPath));
    fs.copyFileSync(fromPath, toPath);
    return;
  }

  fs.mkdirSync(toPath, { recursive: true });
  fs.readdirSync(fromPath).forEach((element) => {
    if (fs.lstatSync(path.join(from, element)).isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else {
      cp(path.join(from, element), path.join(to, element));
    }
  });
}

// Copying schemas
cp('src/collection.json', 'dist/collection.json');
cp('src/ng-add/schema.json', 'dist/ng-add/schema.json');
// Copy angular component schema
cp(
  'node_modules/@schematics/angular/component/schema.json',
  'dist/component/schema.json'
);

// Copying template files
cp('src/component/files', 'dist/component/files');

// copying misc files
cp('README.md', 'dist/README.md');

// read original package .json
const pkgJson = require('../package.json');

const targetPkgJson = {};

// copy some of the package.json fields from src to dest
[
  'name',
  'version',
  'description',
  'keywords',
  'author',
  'repository',
  'license',
  'bugs',
  'homepage',
].forEach(function (field) {
  targetPkgJson[field] = pkgJson[field];
});

// add dependencies (use the same versions as in the original package.json)
targetPkgJson.dependencies = {};
[
  '@angular-devkit/core',
  '@angular-devkit/schematics',
  '@schematics/angular',
  'typescript',
].forEach(function (depPkg) {
  targetPkgJson.dependencies[depPkg] = pkgJson.dependencies[depPkg];
});

// add schematics entry
targetPkgJson['schematics'] = './collection.json';

targetPkgJson.keywords = Array.from(
  new Set([
    ...(targetPkgJson.keywords || []),
    'angular-cli',
    'schematics',
    'ng-add',
  ])
);

// write down resulting package.json
fs.writeFileSync(
  'dist/package.json',
  JSON.stringify(targetPkgJson, null, 2),
  'utf-8'
);
