import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import {
  Schema as ApplicationOptions,
  Style,
} from '@schematics/angular/application/schema';
import { Schema as ShallowComponentOptions } from '@schematics/angular/component/schema';
import { createTestApp } from '../testing';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('Schematics: component', () => {
  const appOptions: ApplicationOptions = {
    name: 'bar',
    inlineStyle: false,
    inlineTemplate: false,
    routing: false,
    style: Style.Css,
    skipTests: false,
    skipPackageJson: false,
  };

  const defaultOptions: ShallowComponentOptions = {
    name: 'foo',
    skipTests: false,
    flat: false,
    project: 'bar',
  };
  const appPath = `/projects/${appOptions.name}/src/app`;

  let ngRunner: SchematicTestRunner;
  let appTree: UnitTestTree;

  beforeEach(async () => {
    ngRunner = new SchematicTestRunner(
      '@schematics/angular', 
      require.resolve('../../node_modules/@schematics/angular/collection.json')
    );
    appTree = await createTestApp(ngRunner, appOptions);
  });

  it('should create component files', async () => {    
    const options: ShallowComponentOptions = { ...defaultOptions, skipTests: false };
    const expectedFiles = [
      `${appPath}/foo/foo.component.spec.ts`,
      `${appPath}/foo/foo.component.ts`,
      `${appPath}/foo/foo.component.html`,
      `${appPath}/foo/foo.component.css`,
    ];

    const tree = await ngRunner.runExternalSchematicAsync(collectionPath, 'component', options, appTree)
      .toPromise();

    expectedFiles.forEach((expectedFile) =>
      expect(tree.files).toContain(expectedFile)
    );
  });

  it('should not create a component spec file when skipTests option is true', async () => {
    const options = { ...defaultOptions, skipTests: true };
    const specFile = `${appPath}/foo/foo.component.spec.ts`;

    const tree = await ngRunner.runExternalSchematicAsync(collectionPath, 'component', options, appTree).toPromise();
    expect(tree.files).not.toContain(specFile);
  });

  it('should generate a correct template for a spec file', async () => {
    const expectedImports = [
      `import { FooComponent } from './foo.component';`,
      `import { AppModule } from '../app.module';`,
      `import { Shallow } from 'shallow-render';`,
    ];
    const expectedTemplateLines = [
      `describe('FooComponent', () => {`,
      `let shallow: Shallow<FooComponent>;`,
      `shallow = new Shallow(FooComponent, AppModule);`,
      `const { find } = await shallow.render('<app-foo></app-foo>');`,
      `expect(find('p')).toHaveFound(1);`,
    ];
    const options: ShallowComponentOptions = {
      ...defaultOptions,
      module: 'app.module.ts',
    };

    const tree = await ngRunner.runExternalSchematicAsync(collectionPath,'component', options, appTree).toPromise();

    const content = tree.readContent(`${appPath}/foo/foo.component.spec.ts`);
    expectedImports.forEach((expectedImport) =>
      expect(content).toContain(expectedImport)
    );
    expectedTemplateLines.forEach((expectedTmpl) =>
      expect(content).toContain(expectedTmpl)
    );
  });

  it('should not set module details when skipImport is used', async () => {
    const options = { ...defaultOptions, skipImport: true };

    const tree = await ngRunner.runExternalSchematicAsync(collectionPath, 'component', options, appTree).toPromise();

    const content = tree.readContent(`${appPath}/foo/foo.component.spec.ts`);
    expect(content).not.toContain(`import { AppModule } from '../app.module';`);
    expect(content).toContain(`shallow = new Shallow(FooComponent, Module);`);
  });

  it('should set correct module import when module is in another folder', async () => {
    appTree = await ngRunner.runSchematicAsync(
        'module',
        { name: 'FooFeature', project: 'bar' },
        appTree
      ).toPromise();
    const options = { ...defaultOptions, module: 'foo-feature' };

    const tree = await ngRunner.runExternalSchematicAsync(collectionPath, 'component', options, appTree).toPromise();

    const content = tree.readContent(`${appPath}/foo/foo.component.spec.ts`);
    expect(content).toContain(
      `import { FooFeatureModule } from '../foo-feature/foo-feature.module';`
    );
  });

  it('should set correct module import when module is in another folder as flat option is used', async () => {
    appTree = await ngRunner.runSchematicAsync(
      'module',
      { name: 'FooFeature', project: 'bar' },
      appTree
    ).toPromise();
    const options: ShallowComponentOptions = {
      ...defaultOptions,
      module: 'foo-feature',
      flat: true,
    };

    const tree = await ngRunner.runExternalSchematicAsync(collectionPath, 'component', options, appTree).toPromise();

    const content = tree.readContent(`${appPath}/foo.component.spec.ts`);
    expect(content).toContain(
      `import { FooFeatureModule } from './foo-feature/foo-feature.module';`
    );
  });
});
