import { <%= classify(name) %>Component } from './<%= dasherize(name) %>.component';<% if (moduleName) { %>
import { <%= classify(moduleName) %>Module } from '<%= dasherize(relativePath) %>.module';<% } %>
import { Shallow } from 'shallow-render';

describe('<%= classify(name) %>Component', () => {
  let shallow: Shallow<<%= classify(name) %>Component>;

  beforeEach(() => {
    shallow = new Shallow(<%= classify(name) %>Component, <%= classify(moduleName) %>Module);
  });

  it('should create', async () => {
    const { find } = await shallow.render('<<%= dasherize(name) %>></<%= dasherize(name) %>>');
    expect(find('p')).toHaveFound(1);
  });
});
