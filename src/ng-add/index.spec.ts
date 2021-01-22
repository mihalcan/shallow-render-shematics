import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { createTestApp, getFileContent } from '../testing';
import { Schema } from './schema';

import * as path from 'path';
const collectionPath = path.join(__dirname, '../collection.json');

describe('CDK ng-add', () => {
  let ngRunner: SchematicTestRunner;
  let appTree: Tree;

  beforeEach(async () => {    
    ngRunner = new SchematicTestRunner(
      '@schematics/angular', 
      require.resolve('../../node_modules/@schematics/angular/collection.json')
    );
    appTree = await createTestApp(ngRunner);
  });

  it('should update the package.json, install package and set default collection to shallow-render-schematics', async () => {
    const tree = await ngRunner
      .runExternalSchematicAsync(collectionPath, 'ng-add', {}, appTree)
      .toPromise();

    const packageJson = JSON.parse(getFileContent(tree, '/package.json'));
    const devDependencies = packageJson.devDependencies;

    expect(devDependencies['shallow-render']).toBe('9.0.4');
    expect(Object.keys(devDependencies)).toEqual(
      Object.keys(devDependencies).sort()
    );
    expect(ngRunner.tasks.some((task) => task.name === 'node-package')).toBe(
      true
    );

    const angularJson = JSON.parse(getFileContent(tree, '/angular.json'));
    expect(angularJson.cli.defaultCollection).toBe('shallow-render-schematics');
  });

  it('should only update package.json when other options are deselected', async () => {
    const options: Schema = {
      setAsDefaultCollection: false,
      skipInstall: true,
    };
    const tree = await ngRunner
      .runExternalSchematicAsync(collectionPath, 'ng-add', options, appTree)
      .toPromise();

    const packageJson = JSON.parse(getFileContent(tree, '/package.json'));
    const devDependencies = packageJson.devDependencies;

    expect(devDependencies['shallow-render']).toBe('9.0.4');
    expect(ngRunner.tasks.some((task) => task.name === 'node-package')).toBe(
      false
    );

    const angularJson = JSON.parse(getFileContent(tree, '/angular.json'));
    expect(angularJson.cli).toBeFalsy();
  });
});
