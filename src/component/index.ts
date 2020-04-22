// tslint:disable:linebreak-style
import { Path, strings } from '@angular-devkit/core';
import {
  apply,
  chain,
  externalSchematic,
  MergeStrategy,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  template,
  Tree,
  url,
} from '@angular-devkit/schematics';
import { Schema as ShallowComponentOptions } from '@schematics/angular/component/schema';
import { getWorkspace } from '@schematics/angular/utility/config';
import * as findModule from '@schematics/angular/utility/find-module';
import { parseName } from '@schematics/angular/utility/parse-name';
import {
  buildDefaultPath,
  getProject,
} from '@schematics/angular/utility/project';

interface ModuleDetails {
  moduleName: string;
  relativePath: string;
}

export const defaultModuleDetails: ModuleDetails = {
  moduleName: '',
  relativePath: '',
};

// tslint:disable-next-line:no-default-export
export default function (options: ShallowComponentOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    // no reason to continue if spec file is not required
    if (!options.spec) {
      return externalSchematic('@schematics/angular', 'component', options);
    }

    if (options.path === undefined) {
      const workspace = getWorkspace(host);
      const projectName = options.project
        ? options.project
        : Object.keys(workspace.projects)[0];
      const project = getProject(host, projectName);
      options.path = buildDefaultPath(project);
    }

    const parsedPath = parseName(options.path, options.name);
    options.name = parsedPath.name;
    options.path = parsedPath.path;

    const moduleDetails = options.skipImport
      ? defaultModuleDetails
      : getModuleDetails(options, host);

    const templateSource = apply(url('./files'), [
      template({
        ...strings,
        'if-flat': (s: string) => (options.flat ? '' : s),
        ...options,
        ...moduleDetails,
      }),
      move(parsedPath.path),
    ]);

    const rule = chain([
      externalSchematic('@schematics/angular', 'component', {
        ...options,
        spec: false,
      }),
      mergeWith(templateSource, MergeStrategy.Default),
    ]);

    return rule(host, context);
  };
}

function getModuleDetails(
  options: ShallowComponentOptions,
  host: Tree
): ModuleDetails {
  const modulePath = findModule.findModuleFromOptions(host, options) as Path;
  // tslint:disable-next-line:prefer-template
  const componentPath =
    `/${options.path}/` +
    (options.flat ? '' : strings.dasherize(options.name) + '/') +
    strings.dasherize(options.name) +
    '.component';
  const relativePath = findModule.buildRelativePath(componentPath, modulePath);
  const moduleFileName = modulePath.split('/').pop() as string;

  const suffixLength = '.module.ts'.length;
  const moduleName = moduleFileName.slice(
    0,
    moduleFileName.length - suffixLength
  );
  const moduleRelativePath = relativePath.slice(
    0,
    relativePath.length - suffixLength
  );

  return { relativePath: moduleRelativePath, moduleName };
}
