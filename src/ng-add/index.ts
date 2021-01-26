import {
  chain,
  noop,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { version } from 'process';
import { addPackageToPackageJson } from './package-config';
import { Schema as NgAddOptions } from './schema';
import { getLatestNodeVersion, getCurrentPackageVersion, updateJsonInTree } from './utils';

const DEFAULT_SHALLOW_RENDER_VERSION = '11.0.0';

function addShallowRenderDependency(options: NgAddOptions) {
  return async (host: Tree, ctx: SchematicContext) => {
    let versionToInstall: string;

    if (!options.shallowRenderVersion) {
      const { version } = await getLatestNodeVersion('shallow-render', DEFAULT_SHALLOW_RENDER_VERSION);
      versionToInstall = version;
    } else {
      versionToInstall = options.shallowRenderVersion;
    }
    ctx.logger.info(`Adding shallow-render@${versionToInstall} to package.json`);
    addPackageToPackageJson(host, 'shallow-render', versionToInstall);

    const schematicsPackage = getCurrentPackageVersion();
    ctx.logger.info(`Adding ${schematicsPackage.name}@${schematicsPackage.version} to package.json`);
    addPackageToPackageJson(host, schematicsPackage.name, schematicsPackage.version);
  };
}

function setDefaultCollection(options: NgAddOptions) {
  if (options.setAsDefaultCollection) {
    return updateJsonInTree('angular.json', (angularJson) => ({
      ...angularJson,
      cli: {
        defaultCollection: '@mihalcan/shallow-render-schematics',
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
    addShallowRenderDependency(options),
    setDefaultCollection(options),
    addInstallTask(options),
  ]);
}
