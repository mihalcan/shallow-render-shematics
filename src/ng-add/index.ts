import {
  chain,
  noop,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { addPackageToPackageJson } from './package-config';
import { Schema as NgAddOptions } from './schema';
import { updateJsonInTree } from './utils';

function addShallowRenderDependency() {
  return (host: Tree, _: SchematicContext) => {
    addPackageToPackageJson(host, 'shallow-render', '9.0.4');
    addPackageToPackageJson(host, 'shallow-render-schematics', '1.0.0');
  };
}

function setDefaultCollection(options: NgAddOptions) {
  if (options.setAsDefaultCollection) {
    return updateJsonInTree('angular.json', (angularJson) => ({
      ...angularJson,
      cli: {
        defaultCollection: 'shallow-render-schematics',
      },
    }));
  }

  return noop();
}

function addInstallTask(options: NgAddOptions) {
  return (host: Tree, context: SchematicContext) => {
    if (!options.skipInstall) {
      context.addTask(new NodePackageInstallTask());
    } else {
      context.logger.warn(`Do not forget to run 'npm install'`);
    }
    return host;
  };
}

// tslint:disable-next-line:no-default-export
export default function (options: NgAddOptions): Rule {
  return chain([
    addShallowRenderDependency(),
    setDefaultCollection(options),
    addInstallTask(options),
  ]);
}
