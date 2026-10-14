import common from './en/common.json';
import auth from './en/auth.json';
import admin from './en/admin.json';
import candidate from './en/candidate.json';
import company from './en/company.json';
import validation from './en/validation.json';

// Helper to flatten nested objects into dot-notated keys
function flatten(obj, prefix = '') {
  let result = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flatten(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

const enDict = {
  // With namespace prefixes: common.welcome, auth.login, etc.
  ...flatten({ common }),
  ...flatten({ auth }),
  ...flatten({ admin }),
  ...flatten({ candidate }),
  ...flatten({ company }),
  ...flatten({ validation }),

  // Without namespace prefixes: welcome, login, etc.
  ...flatten(common),
  ...flatten(auth),
  ...flatten(admin),
  ...flatten(candidate),
  ...flatten(company),
  ...flatten(validation),

  // Direct access aliases
  ...common,
  ...auth,
  ...admin,
  ...candidate,
  ...company,
  ...validation
};

export default enDict;
export { common, auth, admin, candidate, company, validation };
