// Browser shim for Node.js url module
export const fileURLToPath = (url) => url.replace('file://', '');
export const pathToFileURL = (path) => `file://${path}`;

export default { fileURLToPath, pathToFileURL };
