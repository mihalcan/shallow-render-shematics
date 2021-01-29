import * as fs from 'fs';
import { Tree, Rule } from '@angular-devkit/schematics';
import { get } from 'http';
import * as path from 'path';

export interface NodePackage {
    name: string;
    version: string;
  }

export function getCurrentPackageVersion(): NodePackage {
    const packagePath = path.join(__dirname, '../package.json');
    const packageJson =  JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return {
        name: packageJson.name,
        version: packageJson.version
    };
}

export function readJsonInTree(host: Tree, filePath: string) {
    if (!host.exists(filePath)) {
        throw new Error(`Cannot find ${filePath}`);
    }

    const json = JSON.parse((host.read(filePath) as any).toString('utf-8'));
    return json;
}

export function updateJsonInTree(
    filePath: string,
    callback: (json: any) => any
): Rule {
    return (host: Tree): Tree => {
        const updatedJson = callback(readJsonInTree(host, filePath));
        host.overwrite(filePath, JSON.stringify(updatedJson, undefined, 2));
        return host;
    };
}

export function getLatestNpmVersion(packageName: string, defaultVersion: string): Promise<NodePackage> {
    return new Promise((resolve) => {
      return get(`http://registry.npmjs.org/${packageName}`, (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          try {
            const response = JSON.parse(rawData);
            const version = (response && response['dist-tags']) || {};
  
            resolve(buildPackage(packageName, version.latest));
          } catch (e) {
            resolve(buildPackage(packageName));
          }
        });
      }).on('error', () => resolve(buildPackage(packageName)));
    });
  
    function buildPackage(name: string, version: string = defaultVersion): NodePackage {
      return { name, version };
    }
  }
