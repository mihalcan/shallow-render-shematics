# Schematics for shallow-render
Add [shallow-render](https://github.com/getsaf/shallow-render) to an Angular CLI project

This schematic will:

- install shallow-render
- override [Angular component schematics](https://angular.io/cli/generate#component) to use shallow-render instead of TestBed

## Usage 🚀

Run as one command in an Angular CLI app directory. Note this will add the schematic as a dev dependency to your project.

```shell
ng add @mihalcan/shallow-render-schematics
```

Script will prompt for shallow-render version to install (by default the latest version is installed). Please check [Angular and shallow-render compatibility list](https://github.com/getsaf/shallow-render#angular-version-support). 

```shell script
Please provide shallow-render version to install or hit Enter to install the latest:
```

After installation, executing `ng g c test-component` or `ng generate component test-component` will generate spec file with the following content:
```typescript
import { TestComponentComponent } from './test-component.component';
import { AppModule } from '../app.module';
import { Shallow } from 'shallow-render';

describe('TestComponentComponent', () => {
  let shallow: Shallow<TestComponentComponent>;

  beforeEach(() => {
    shallow = new Shallow(TestComponentComponent, AppModule);
  });

  it('should create', async () => {
    const { find } = await shallow.render('<app-test-component></app-test-component>');
    expect(find('p')).toHaveFound(1);
  });
});

```
## ng add options

| Option | Description |
| ------- | -------------- |
| skipInstall     | If `true` package.json will be update but packages won't be installed. Default is `false`.             |
| setAsDefaultCollection     | If `false` will not set cli default collection. In this case you need to reference package name `ng g @mihalcan/shallow-render-schematics:component`. Default is `true`.             |

