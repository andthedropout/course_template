// Browser shim for Node.js path module
export const sep = '/';
export const dirname = (p) => p.split('/').slice(0, -1).join('/') || '/';
export const basename = (p) => p.split('/').pop() || '';
export const join = (...args) => args.join('/').replace(/\/+/g, '/');
export const resolve = (...args) => join(...args);
export const relative = (from, to) => to;
export const isAbsolute = (p) => p.startsWith('/');

export default { sep, dirname, basename, join, resolve, relative, isAbsolute };
