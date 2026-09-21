const fs = require('fs-extra');
const path = require('path');

exports.default = async function(context) {
  const appOutDir = context.appOutDir;
  const backendSource = path.join(context.packager.projectDir, 'backend', 'node_modules');
  const backendDest = path.join(appOutDir, 'resources', 'app.asar.unpacked', 'backend', 'node_modules');
  
  console.log('Copying backend node_modules...');
  console.log('From:', backendSource);
  console.log('To:', backendDest);
  
  try {
    await fs.copy(backendSource, backendDest);
    console.log('Backend node_modules copied successfully!');
  } catch (err) {
    console.error('Error copying backend node_modules:', err);
    throw err;
  }
};
