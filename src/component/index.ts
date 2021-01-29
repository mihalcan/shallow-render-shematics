// tslint:disable:linebreak-style
import { JsonObject, Path, strings } from '@angular-devkit/core';
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
import { getWorkspace, buildDefaultPath } from '@schematics/angular/utility/workspace';
import * as findModule from '@schematics/angular/utility/find-module';
import { parseName } from '@schematics/angular/utility/parse-name';

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
  return async (host: Tree, context: SchematicContext) => {
    // no reason to continue if spec file is not required
    if (options.skipTests) {
      return externalSchematic('@schematics/angular', 'component', options);
    }
    
    const workspace = await getWorkspace(host);    
    const project = workspace.projects.get(options.project as string);

    if (options.path === undefined && project) {
      options.path = buildDefaultPath(project);
    }

    const parsedPath = parseName(options.path as string, options.name);
    options.name = parsedPath.name; // component name
    options.path = parsedPath.path; // component path
    // component selector
    options.selector = options.selector || buildSelector(options, project && project.prefix || '');

    const moduleDetails = options.skipImport
      ? defaultModuleDetails
      : getModuleDetails(options, host);

    const specFileTemplateSource = apply(url('./files'), [
      // add template functions and variables
      template({
        ...strings, // provide template functions such as classify and dasherize
        'if-flat': (s: string) => (options.flat ? '' : s), // create component folder or not
        ...options, // provide component variables (name, selector)
        ...moduleDetails, // provide module variables (moduleName, relativePath)
      }),
      move(parsedPath.path)
    ]);
    
    const angularComponentOptions = { 
      ...options, 
      // find default workspace setting 
      ...getAngularComponentExtensions(workspace.extensions),
      // find default project setting 
      ...getAngularComponentExtensions(project?.extensions)
    };

    return chain([
      // create angular component without spec files
      externalSchematic('@schematics/angular', 'component', {
        ...angularComponentOptions,
        skipTests: true
      }),
      // add shallow-render spec file
      mergeWith(specFileTemplateSource, MergeStrategy.Default),
    ]);
  };
}

function getModuleDetails(
  options: ShallowComponentOptions,
  host: Tree
): ModuleDetails {
  const modulePath = findModule.findModuleFromOptions(host, options) as Path;
  // tslint:disable-next-line:prefer-template
  const componentPath = `/${options.path}/` 
    + (options.flat ? '' : strings.dasherize(options.name) + '/') 
    + strings.dasherize(options.name) 
    + '.component';
  const relativePath = findModule.buildRelativePath(componentPath, modulePath);
  const moduleFileName = modulePath.split('/').pop() as string;

  const moduleName = moduleFileName.replace('.module.ts', '')
  const moduleRelativePath = relativePath.replace('.module.ts', '');

  return { relativePath: moduleRelativePath, moduleName };
}


/**
 * Get default angular schematics options from angular.json file.
 * E.g. default ChangeDetection or styles file extension `.scss`
 *
 * @param {*} extensions
 * @returns
 */
function getAngularComponentExtensions(extensions: any) {
  if (extensions?.schematics && extensions.schematics['@schematics/angular:component'])
  {
    return extensions.schematics['@schematics/angular:component']
  }

  return {};
}

function buildSelector(options: ShallowComponentOptions, projectPrefix: string) {
  let selector = strings.dasherize(options.name);
  if (options.prefix) { // use prefix from options if provided
    selector = `${options.prefix}-${selector}`;
  } else if (options.prefix === undefined && projectPrefix) {
    selector = `${projectPrefix}-${selector}`;
  }

  return selector;
}