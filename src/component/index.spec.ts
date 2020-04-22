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
    spec: true,
    flat: false,
    project: 'bar',
  };
  const appPath = `/projects/${appOptions.name}/src/app`;

  let runner: SchematicTestRunner;
  let appTree: UnitTestTree;

  beforeEach(async () => {
    runner = new SchematicTestRunner(
      'schematics',
      require.resolve('../collection.json')
    );
    appTree = await createTestApp(runner, appOptions);
  });

  it('should create component files', () => {
    const options: ShallowComponentOptions = { ...defaultOptions, spec: true };
    const expectedFiles = [
      `${appPath}/foo/foo.component.spec.ts`,
      `${appPath}/foo/foo.component.ts`,
      `${appPath}/foo/foo.component.html`,
      `${appPath}/foo/foo.component.css`,
    ];

    const tree = runner.runSchematic('component', options, appTree);

    expectedFiles.forEach((expectedFile) =>
      expect(tree.files).toContain(expectedFile)
    );
  });

  it('should not create a component spec file when spec option is false', () => {
    const options = { ...defaultOptions, spec: false };
    const specFile = `${appPath}/foo/foo.component.spec.ts`;

    const tree = runner.runSchematic('component', options, appTree);

    expect(tree.files).not.toContain(specFile);
  });

  it('should generate a correct template for a spec file', () => {
    const expectedImports = [
      `import { FooComponent } from './foo.component';`,
      `import { AppModule } from '../app.module';`,
      `import { Shallow } from 'shallow-render';`,
    ];
    const expectedTemplateLines = [
      `describe('FooComponent', () => {`,
      `let shallow: Shallow<FooComponent>;`,
      `shallow = new Shallow(FooComponent, AppModule);`,
      `const { find } = await shallow.render('<foo></foo>');`,
      `expect(find('p')).toHaveFound(1);`,
    ];
    const options: ShallowComponentOptions = {
      ...defaultOptions,
      module: 'app.module.ts',
    };

    const tree = runner.runSchematic('component', options, appTree);

    const content = tree.readContent(`${appPath}/foo/foo.component.spec.ts`);

    expectedImports.forEach((expectedImport) =>
      expect(content).toContain(expectedImport)
    );
    expectedTemplateLines.forEach((expectedTmpl) =>
      expect(content).toContain(expectedTmpl)
    );
  });

  it('should not set module details when skipImport is used', () => {
    const options = { ...defaultOptions, skipImport: true };
    const tree = runner.runSchematic('component', options, appTree);
    const content = tree.readContent(`${appPath}/foo/foo.component.spec.ts`);

    expect(content).not.toContain(`import { AppModule } from '../app.module';`);
    expect(content).toContain(`shallow = new Shallow(FooComponent, Module);`);
  });

  it('should set correct module import when module is in another folder', () => {
    appTree = runner.runExternalSchematic(
      '@schematics/angular',
      'module',
      { name: 'FooFeature', project: 'bar' },
      appTree
    );
    const options = { ...defaultOptions, module: 'foo-feature' };
    const tree = runner.runSchematic('component', options, appTree);
    const content = tree.readContent(`${appPath}/foo/foo.component.spec.ts`);

    expect(content).toContain(
      `import { FooFeatureModule } from '../foo-feature/foo-feature.module';`
    );
  });

  it('should set correct module import when module is in another folder as flat option is used', () => {
    appTree = runner.runExternalSchematic(
      '@schematics/angular',
      'module',
      { name: 'FooFeature', project: 'bar' },
      appTree
    );
    const options: ShallowComponentOptions = {
      ...defaultOptions,
      module: 'foo-feature',
      flat: true,
    };

    const tree = runner.runSchematic('component', options, appTree);
    const content = tree.readContent(`${appPath}/foo.component.spec.ts`);

    expect(content).toContain(
      `import { FooFeatureModule } from './foo-feature/foo-feature.module';`
    );
  });
});
