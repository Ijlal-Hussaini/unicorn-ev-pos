const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'frontend/src/assets/Logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Allow loading images from Cloudinary
    }
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    const indexPath = path.join(__dirname, 'frontend', 'dist', 'index.html');
    console.log('Loading frontend from:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  // Log any errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  // Determine the correct backend path based on whether app is packaged
  const backendPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'server.js')
    : path.join(__dirname, 'backend', 'server.js');

  console.log('='.repeat(60));
  console.log('Starting Backend Process');
  console.log('='.repeat(60));
  console.log('Backend path:', backendPath);
  console.log('App is packaged:', app.isPackaged);
  console.log('Resources path:', process.resourcesPath);
  console.log('Electron execPath:', process.execPath);
  console.log('='.repeat(60));

  // Set environment variables for production
  const env = { ...process.env };
  if (app.isPackaged) {
    // Load .env.production file
    const dotenv = require('dotenv');
    const envPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', '.env.production');
    console.log('Loading env from:', envPath);
    
    const envConfig = dotenv.config({ path: envPath });
    if (envConfig.error) {
      console.error('Error loading .env.production:', envConfig.error);
    } else {
      console.log('.env.production loaded successfully');
      console.log('Parsed env vars:', Object.keys(envConfig.parsed || {}).join(', '));
      // Merge loaded env vars
      Object.assign(env, envConfig.parsed);
    }
    
    env.NODE_ENV = 'production';
    env.ELECTRON_APP = 'true'; // Flag to identify Electron environment
    env.PORT = env.PORT || '5000';
    // Set uploads directory to a writable location
    env.UPLOADS_DIR = path.join(app.getPath('userData'), 'uploads');
    // Set NODE_PATH to include backend node_modules
    const backendNodeModules = path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'node_modules');
    env.NODE_PATH = backendNodeModules;
    
    // Log sanitized MongoDB URI
    if (env.MONGO_URI) {
      const sanitizedUri = env.MONGO_URI.replace(/:[^:@]+@/, ':****@');
      console.log('MongoDB URI loaded:', sanitizedUri);
    } else {
      console.error('WARNING: MONGO_URI not found in environment!');
    }
  }

  // Use system node
  const nodeExecutable = 'node';
  console.log('Using Node executable:', nodeExecutable);

  try {
    backendProcess = spawn(nodeExecutable, [backendPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: env,
      cwd: app.isPackaged 
        ? path.join(process.resourcesPath, 'app.asar.unpacked', 'backend')
        : path.join(__dirname, 'backend')
    });

    let backendOutput = '';
    let backendErrors = '';

    // Log backend output
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      backendOutput += output;
      console.log('[Backend]:', output);
    });

    backendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      backendErrors += error;
      console.error('[Backend Error]:', error);
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      // Only show error dialog for critical errors after a delay
      setTimeout(() => {
        if (!backendProcess || backendProcess.killed) {
          const { dialog } = require('electron');
          dialog.showErrorBox('Backend Error', 
            `Failed to start backend server.\n\nError: ${err.message}\n\nPlease ensure Node.js is installed on your system.`);
        }
      }, 1000);
    });

    backendProcess.on('exit', (code, signal) => {
      console.log(`Backend process exited with code ${code} and signal ${signal}`);
      if (code !== 0 && code !== null) {
        const { dialog } = require('electron');
        const errorDetails = backendErrors || backendOutput || 'No error details available';
        console.error('Backend exit details:', errorDetails);
        dialog.showErrorBox('Backend Stopped', 
          `Backend server stopped unexpectedly.\nExit code: ${code}\n\nError: ${errorDetails.substring(0, 200)}`);
      }
    });
  } catch (err) {
    console.error('Exception starting backend:', err);
    const { dialog } = require('electron');
    dialog.showErrorBox('Backend Error', `Failed to start backend: ${err.message}`);
  }
}

app.whenReady().then(() => {
  // Give backend a moment to start before opening window
  startBackend();
  setTimeout(() => {
    createWindow();
  }, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
