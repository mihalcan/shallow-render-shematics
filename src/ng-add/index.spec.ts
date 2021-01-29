import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { createTestApp, getFileContent } from '../testing';
import { Schema as NgAddOptions } from './schema';
import * as utils from './utils';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('ng-add', () => {
  let ngRunner: SchematicTestRunner;
  let appTree: Tree;

  beforeEach(async () => {    
    ngRunner = new SchematicTestRunner(
      '@schematics/angular', 
      require.resolve('../../node_modules/@schematics/angular/collection.json')
    );
    appTree = await createTestApp(ngRunner);
  });

  it('should latest shallow-render and schematics version to package.json, install package and set cli collection to shallow-render-schematics by default', async () => {
    jest.spyOn(utils, 'getLatestNpmVersion')
      .mockResolvedValueOnce({ name: 'shallow-render', version: 'test-v1' });
    jest.spyOn(utils, 'getCurrentPackageVersion')
      .mockReturnValue({ name: '@mihalcan/shallow-render-schematics', version: '1.0.0-test' });

    const tree = await ngRunner
      .runExternalSchematicAsync(collectionPath, 'ng-add', {}, appTree)
      .toPromise();

    const packageJson = JSON.parse(getFileContent(tree, '/package.json'));
    const devDependencies = packageJson.devDependencies;

    expect(devDependencies['shallow-render']).toBe('test-v1');
    expect(devDependencies['@mihalcan/shallow-render-schematics']).toBe('1.0.0-test');

    expect(Object.keys(devDependencies)).toEqual(
      Object.keys(devDependencies).sort()
    );
    expect(ngRunner.tasks.some((task) => task.name === 'node-package')).toBe(
      true
    );

    const angularJson = JSON.parse(getFileContent(tree, '/angular.json'));
    expect(angularJson.cli.defaultCollection).toBe('@mihalcan/shallow-render-schematics');
  });

  it('should add specified shallow-render version', async () => {
    const options: NgAddOptions = {
      setAsDefaultCollection: false,
      shallowRenderVersion: '9.2.0',
      skipInstall: true,
    };

    jest.spyOn(utils, 'getCurrentPackageVersion')
      .mockReturnValue({ name: '@mihalcan/shallow-render-schematics', version: '1.0.0-test' });

    const tree = await ngRunner
      .runExternalSchematicAsync(collectionPath, 'ng-add', options, appTree)
      .toPromise();

    const packageJson = JSON.parse(getFileContent(tree, '/package.json'));
    const devDependencies = packageJson.devDependencies;

    expect(devDependencies['shallow-render']).toBe(options.shallowRenderVersion);
  });

  it('should only update package.json when skipInstall=true and setAsDefaultCollection=false', async () => {
    const options: NgAddOptions = {
      setAsDefaultCollection: false,
      skipInstall: true,
    };
    const tree = await ngRunner
      .runExternalSchematicAsync(collectionPath, 'ng-add', options, appTree)
      .toPromise();

    expect(ngRunner.tasks.some((task) => task.name === 'node-package')).toBe(
      false
    );

    const angularJson = JSON.parse(getFileContent(tree, '/angular.json'));
    expect(angularJson.cli).toBeFalsy();
  });
});
