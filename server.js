const express = require('express');
const os = require('os');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for local server connection
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/**
 * Get the LAN IP address of the server
 * @returns {string|null} The LAN IP address or null if not found
 */
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    
    for (const address of addresses) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  
  return null;
}

/**
 * Get client IP address from request
 * Handles proxies and load balancers
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'Unknown';
}

/**
 * Get user agent information (browser/device info)
 */
function getUserAgentInfo(req) {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  return userAgent;
}

// Serve static HTML page
app.get('/', (req, res) => {
  // Get server device name - check environment variable first, then fallback to hostname
  // This allows setting a custom device name (e.g., your local computer name) for live website
  const serverDeviceName = process.env.DEVICE_NAME || os.hostname() || 'Unknown Server';
  const serverLanIP = getLocalIPAddress();
  
  // Get local server URL from environment or use default
  const localServerUrl = process.env.LOCAL_SERVER_URL || 'http://192.168.61.55:3000';
  const isLocalServer = req.hostname === 'localhost' || req.hostname === '127.0.0.1' || req.hostname.includes('192.168');
  
  const serverInfo = {
    deviceName: serverDeviceName,
    lanIP: serverLanIP,
    platform: os.platform(),
    arch: os.arch(),
    networkInterfaces: os.networkInterfaces(),
    localServerUrl: localServerUrl,
    isLocalServer: isLocalServer
  };

  const clientInfo = {
    ip: getClientIP(req),
    userAgent: getUserAgentInfo(req),
    // Note: Client device name cannot be retrieved due to browser security restrictions
    // We can only get IP and User-Agent information
  };

  // Create HTML response
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Device Information</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 800px;
            width: 100%;
            padding: 40px;
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .section {
            margin-bottom: 30px;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 5px solid #667eea;
        }
        .section h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.5em;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .info-item:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: 600;
            color: #555;
        }
        .value {
            color: #333;
            word-break: break-all;
            text-align: right;
            flex: 1;
            margin-left: 20px;
        }
        .note {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 5px;
            padding: 15px;
            margin-top: 15px;
            color: #856404;
            font-size: 0.9em;
        }
        .refresh-btn {
            display: block;
            width: 100%;
            padding: 15px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.1em;
            cursor: pointer;
            margin-top: 20px;
            transition: background 0.3s;
        }
        .refresh-btn:hover {
            background: #5568d3;
        }
        .loading {
            color: #667eea;
            font-style: italic;
        }
        .detected {
            color: #28a745;
            font-weight: 600;
        }
        .not-detected {
            color: #dc3545;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🖥️ Device Information</h1>
        
        <div class="section">
            <h2>Server Information</h2>
            <div class="info-item">
                <span class="label">Device Name:</span>
                <span class="value" style="color: #28a745; font-weight: 600;">${serverInfo.deviceName || 'Unknown'}</span>
            </div>
            <div class="info-item">
                <span class="label">LAN IP Address:</span>
                <span class="value">${serverInfo.lanIP || 'Not found'}</span>
            </div>
            <div class="info-item">
                <span class="label">Platform:</span>
                <span class="value">${serverInfo.platform}</span>
            </div>
            <div class="info-item">
                <span class="label">Architecture:</span>
                <span class="value">${serverInfo.arch}</span>
            </div>
            <div class="note" style="margin-top: 15px;">
                <strong>ℹ️ Note:</strong> This is the server's device name. 
                ${serverInfo.isLocalServer ? 'Running on local server.' : 'Live server. Connecting to local server for device info...'}
            </div>
            ${!serverInfo.isLocalServer ? `
            <div id="localServerStatus" style="margin-top: 10px; padding: 10px; background: #e7f3ff; border-radius: 5px; border-left: 4px solid #2196F3;">
                <strong>🔗 Local Server Connection:</strong> 
                <span id="localServerStatusText">Connecting to ${serverInfo.localServerUrl}...</span>
            </div>
            ` : ''}
        </div>

        <div class="section">
            <h2>Your Information (Client)</h2>
            <div class="info-item">
                <span class="label">Your Public IP Address:</span>
                <span class="value">${clientInfo.ip}</span>
            </div>
            <div class="info-item">
                <span class="label">Device Name:</span>
                <span class="value" id="deviceName"><span class="loading">Detecting...</span></span>
            </div>
            <div class="info-item">
                <span class="label">Local IP Address:</span>
                <span class="value" id="localIP"><span class="loading">Detecting...</span></span>
            </div>
            <div class="info-item">
                <span class="label">Platform:</span>
                <span class="value" id="platform"><span class="loading">Detecting...</span></span>
            </div>
            <div class="info-item">
                <span class="label">Browser:</span>
                <span class="value" id="browser"><span class="loading">Detecting...</span></span>
            </div>
            <div class="info-item">
                <span class="label">Screen Resolution:</span>
                <span class="value" id="screen"><span class="loading">Detecting...</span></span>
            </div>
            <div class="info-item">
                <span class="label">User Agent:</span>
                <span class="value">${clientInfo.userAgent}</span>
            </div>
        </div>

        <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
    </div>

    <script>
        // Global info object to track all detected information
        let deviceInfo = {
            deviceName: null,
            localIP: null,
            platform: null,
            browser: null,
            screen: null
        };

        // Get device information using browser APIs
        function getDeviceInfo() {
            try {
                // Get synchronous information immediately
                const ua = navigator.userAgent || '';
                const platform = navigator.platform || 'Unknown';
                const cores = navigator.hardwareConcurrency || 0;
                
                // Set platform immediately
                deviceInfo.platform = platform;
                
                // Set browser immediately
                deviceInfo.browser = getBrowserInfo();
                
                // Set screen resolution immediately
                deviceInfo.screen = (screen.width || 0) + 'x' + (screen.height || 0);
                
                // Try to infer device name from available information
                let deviceName = null;
                
                // Method 1: Try to extract device model from user agent (for mobile devices)
                const mobileMatch = ua.match(/(iPhone|iPad|iPod|Android|Windows Phone|BlackBerry)/i);
                const modelMatch = ua.match(/(iPhone|iPad|iPod|Android|Windows Phone|BlackBerry)[^;]*/i);
                
                if (modelMatch) {
                    deviceName = modelMatch[0].trim();
                } 
                // Method 2: Try to get more detailed device info from user agent
                else if (ua.includes('Windows NT')) {
                    const winVersion = ua.match(/Windows NT ([0-9.]+)/);
                    if (winVersion) {
                        const version = winVersion[1];
                        let winName = 'Windows';
                        if (version === '10.0') winName = 'Windows 10/11';
                        else if (version === '6.3') winName = 'Windows 8.1';
                        else if (version === '6.2') winName = 'Windows 8';
                        else if (version === '6.1') winName = 'Windows 7';
                        deviceName = winName + (cores ? ' (' + cores + ' cores)' : '');
                    } else {
                        deviceName = 'Windows' + (cores ? ' (' + cores + ' cores)' : '');
                    }
                }
                // Method 3: Try Mac detection
                else if (ua.includes('Mac OS X')) {
                    const macVersion = ua.match(/Mac OS X ([0-9_]+)/);
                    if (macVersion) {
                        deviceName = 'macOS ' + macVersion[1].replace(/_/g, '.') + (cores ? ' (' + cores + ' cores)' : '');
                    } else {
                        deviceName = 'macOS' + (cores ? ' (' + cores + ' cores)' : '');
                    }
                }
                // Method 4: Try Linux detection
                else if (ua.includes('Linux')) {
                    deviceName = 'Linux' + (cores ? ' (' + cores + ' cores)' : '');
                }
                // Method 5: Fallback to platform
                else if (platform && platform !== 'Unknown') {
                    deviceName = platform + (cores ? ' (' + cores + ' cores)' : '');
                } 
                // Method 6: Last resort
                else {
                    deviceName = 'Device' + (cores ? ' (' + cores + ' cores)' : '');
                }
                
                deviceInfo.deviceName = deviceName;
                
                // Log for debugging
                console.log('🔍 Device Detection:', {
                    deviceName: deviceInfo.deviceName,
                    platform: deviceInfo.platform,
                    browser: deviceInfo.browser,
                    screen: deviceInfo.screen
                });
                
                // Update display with synchronous data immediately
                updateDisplay();
                
                // Try to get local IP using WebRTC (async)
                getLocalIPAddress().then(ip => {
                    deviceInfo.localIP = ip;
                    updateDisplay();
                }).catch((err) => {
                    console.log('Local IP detection failed:', err);
                    deviceInfo.localIP = 'Not available (WebRTC blocked or not supported)';
                    updateDisplay();
                });

                // Try to get hostname from WebRTC or other methods (async)
                tryGetHostname().then(hostname => {
                    if (hostname) {
                        // If we got a real hostname, use it
                        deviceInfo.deviceName = hostname;
                        updateDisplay();
                    }
                }).catch((err) => {
                    console.log('Hostname detection failed:', err);
                });
                
            } catch (error) {
                console.error('Error getting device info:', error);
                // Still try to update with whatever we have
                updateDisplay();
            }
        }

        // Get browser information
        function getBrowserInfo() {
            const ua = navigator.userAgent;
            let browser = 'Unknown';
            
            if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
            else if (ua.includes('Firefox')) browser = 'Firefox';
            else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
            else if (ua.includes('Edg')) browser = 'Edge';
            else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
            
            return browser + ' (' + (navigator.appVersion || 'Unknown') + ')';
        }

        // Get local IP address using WebRTC
        function getLocalIPAddress() {
            return new Promise((resolve, reject) => {
                const RTCPeerConnection = window.RTCPeerConnection || 
                                         window.mozRTCPeerConnection || 
                                         window.webkitRTCPeerConnection;
                
                if (!RTCPeerConnection) {
                    reject('WebRTC not supported');
                    return;
                }

                const pc = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                });

                const ips = [];

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        const candidate = event.candidate.candidate;
                        const match = candidate.match(/([0-9]{1,3}(?:\.[0-9]{1,3}){3})/);
                        if (match && match[1]) {
                            const ip = match[1];
                            if (ip !== '127.0.0.1' && !ips.includes(ip)) {
                                ips.push(ip);
                            }
                        }
                    } else {
                        // All candidates collected
                        if (ips.length > 0) {
                            // Prefer non-169.254.x.x (link-local) addresses
                            const preferredIP = ips.find(ip => !ip.startsWith('169.254.')) || ips[0];
                            resolve(preferredIP);
                        } else {
                            reject('No local IP found');
                        }
                        pc.close();
                    }
                };

                // Create a dummy data channel to trigger candidate gathering
                pc.createDataChannel('', { reliable: false });
                
                pc.createOffer()
                    .then(offer => pc.setLocalDescription(offer))
                    .catch(reject);

                // Timeout after 3 seconds
                setTimeout(() => {
                    if (ips.length > 0) {
                        const preferredIP = ips.find(ip => !ip.startsWith('169.254.')) || ips[0];
                        resolve(preferredIP);
                    } else {
                        reject('Timeout waiting for local IP');
                    }
                    pc.close();
                }, 3000);
            });
        }

        // Try to get hostname (limited by browser security)
        async function tryGetHostname() {
            // Try to get hostname from WebRTC (rarely works due to browser security)
            try {
                const RTCPeerConnection = window.RTCPeerConnection || 
                                         window.mozRTCPeerConnection || 
                                         window.webkitRTCPeerConnection;
                
                if (RTCPeerConnection) {
                    const pc = new RTCPeerConnection({ iceServers: [] });
                    return new Promise((resolve) => {
                        pc.onicecandidate = (event) => {
                            if (event.candidate) {
                                // Sometimes hostname appears in candidate
                                const candidate = event.candidate.candidate;
                                // Look for hostname patterns (rare)
                                const hostnameMatch = candidate.match(/host ([a-zA-Z0-9.-]+)/);
                                if (hostnameMatch) {
                                    pc.close();
                                    resolve(hostnameMatch[1]);
                                    return;
                                }
                            } else {
                                pc.close();
                                resolve(null);
                            }
                        };
                        pc.createDataChannel('');
                        pc.createOffer().then(offer => pc.setLocalDescription(offer));
                        setTimeout(() => {
                            pc.close();
                            resolve(null);
                        }, 1000);
                    });
                }
            } catch (e) {
                console.log('WebRTC hostname detection failed:', e);
            }
            
            return null;
        }

        // Update the display with detected information
        function updateDisplay() {
            try {
                const deviceNameEl = document.getElementById('deviceName');
                const localIPEl = document.getElementById('localIP');
                const platformEl = document.getElementById('platform');
                const browserEl = document.getElementById('browser');
                const screenEl = document.getElementById('screen');

                // Update device name
                if (deviceInfo.deviceName) {
                    if (deviceNameEl) {
                        deviceNameEl.innerHTML = '<span class="detected">' + escapeHtml(deviceInfo.deviceName) + '</span>';
                    }
                } else {
                    if (deviceNameEl) {
                        deviceNameEl.innerHTML = '<span class="loading">Detecting...</span>';
                    }
                }

                // Update local IP
                if (deviceInfo.localIP) {
                    if (localIPEl) {
                        localIPEl.innerHTML = '<span class="detected">' + escapeHtml(deviceInfo.localIP) + '</span>';
                    }
                } else if (deviceInfo.localIP === 'Not available (WebRTC blocked or not supported)') {
                    if (localIPEl) {
                        localIPEl.innerHTML = '<span class="not-detected">' + escapeHtml(deviceInfo.localIP) + '</span>';
                    }
                } else {
                    if (localIPEl) {
                        localIPEl.innerHTML = '<span class="loading">Detecting...</span>';
                    }
                }

                // Update platform
                if (deviceInfo.platform) {
                    if (platformEl) {
                        platformEl.innerHTML = '<span class="detected">' + escapeHtml(deviceInfo.platform) + '</span>';
                    }
                } else {
                    if (platformEl) {
                        platformEl.innerHTML = '<span class="loading">Detecting...</span>';
                    }
                }

                // Update browser
                if (deviceInfo.browser) {
                    if (browserEl) {
                        browserEl.innerHTML = '<span class="detected">' + escapeHtml(deviceInfo.browser) + '</span>';
                    }
                } else {
                    if (browserEl) {
                        browserEl.innerHTML = '<span class="loading">Detecting...</span>';
                    }
                }

                // Update screen
                if (deviceInfo.screen) {
                    if (screenEl) {
                        screenEl.innerHTML = '<span class="detected">' + escapeHtml(deviceInfo.screen) + '</span>';
                    }
                } else {
                    if (screenEl) {
                        screenEl.innerHTML = '<span class="loading">Detecting...</span>';
                    }
                }

                // Send info to server (non-blocking)
                if (deviceInfo.deviceName || deviceInfo.platform || deviceInfo.browser) {
                    fetch('/api/client-info', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(deviceInfo)
                    }).catch(err => {
                        // Silently fail - this is not critical
                        console.log('Could not send info to server:', err);
                    });
                }
            } catch (error) {
                console.error('Error updating display:', error);
            }
        }
        
        // Helper function to escape HTML
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Function to fetch data from local server (for live website)
        async function fetchLocalServerData(retryCount = 0) {
            const localServerUrl = '${serverInfo.localServerUrl || "http://192.168.61.55:3000"}';
            const isLocalServer = ${serverInfo.isLocalServer ? 'true' : 'false'};
            const maxRetries = 3;
            
            // Only try to connect if we're on the live server
            if (!isLocalServer) {
                const statusEl = document.getElementById('localServerStatusText');
                if (statusEl && retryCount === 0) {
                    statusEl.innerHTML = 'Connecting to local server...';
                }
                
                try {
                    // Create timeout controller
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    const response = await fetch(localServerUrl + '/api/local-device', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        signal: controller.signal,
                        cache: 'no-cache'
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        const localData = await response.json();
                        
                        // Update ALL server information fields with local server data
                        const serverSection = document.querySelector('.section:first-of-type');
                        if (serverSection) {
                            // Update Device Name
                            const serverDeviceNameEl = serverSection.querySelector('.info-item:nth-of-type(1) .value');
                            if (serverDeviceNameEl && localData.deviceName) {
                                serverDeviceNameEl.innerHTML = '<span style="color: #28a745; font-weight: 600;">' + escapeHtml(localData.deviceName) + '</span> <span style="color: #666; font-size: 0.85em;">(from local)</span>';
                            }
                            
                            // Update LAN IP Address
                            const serverLanIPEl = serverSection.querySelector('.info-item:nth-of-type(2) .value');
                            if (serverLanIPEl && localData.lanIP) {
                                serverLanIPEl.innerHTML = '<span style="color: #28a745;">' + escapeHtml(localData.lanIP) + '</span> <span style="color: #666; font-size: 0.85em;">(from local)</span>';
                            }
                            
                            // Update Platform
                            const serverPlatformEl = serverSection.querySelector('.info-item:nth-of-type(3) .value');
                            if (serverPlatformEl && localData.platform) {
                                serverPlatformEl.innerHTML = '<span style="color: #28a745;">' + escapeHtml(localData.platform) + '</span> <span style="color: #666; font-size: 0.85em;">(from local)</span>';
                            }
                            
                            // Update Architecture
                            const serverArchEl = serverSection.querySelector('.info-item:nth-of-type(4) .value');
                            if (serverArchEl && localData.arch) {
                                serverArchEl.innerHTML = '<span style="color: #28a745;">' + escapeHtml(localData.arch) + '</span> <span style="color: #666; font-size: 0.85em;">(from local)</span>';
                            }
                        }
                        
                        if (statusEl) {
                            statusEl.innerHTML = '<span style="color: #28a745; font-weight: 600;">✓ Connected - Displaying local server data</span>';
                        }
                        
                        console.log('✅ Local server data loaded:', localData);
                    } else {
                        throw new Error('Failed to fetch');
                    }
                } catch (error) {
                    console.log('Local server connection failed:', error);
                    const statusEl = document.getElementById('localServerStatusText');
                    
                    // Retry logic
                    if (retryCount < maxRetries) {
                        if (statusEl) {
                            statusEl.innerHTML = '<span style="color: #ff9800;">Retrying connection... (' + (retryCount + 1) + '/' + maxRetries + ')</span>';
                        }
                        // Retry after 2 seconds
                        setTimeout(() => {
                            fetchLocalServerData(retryCount + 1);
                        }, 2000);
                    } else {
                        // Max retries reached
                        if (statusEl) {
                            statusEl.innerHTML = '<span style="color: #dc3545;">✗ Cannot connect to local server at ' + localServerUrl + '. Make sure:<br>1. Local server is running (npm start)<br>2. Tunnel is active (ngrok/localtunnel)<br>3. LOCAL_SERVER_URL is set in Vercel</span>';
                        }
                    }
                }
            }
        }
        
        // Periodically refresh local server data (every 30 seconds)
        function startLocalServerPolling() {
            const isLocalServer = ${serverInfo.isLocalServer ? 'true' : 'false'};
            if (!isLocalServer) {
                setInterval(() => {
                    fetchLocalServerData();
                }, 30000); // Refresh every 30 seconds
            }
        }
        
        // Auto-initialize device detection immediately
        (function autoDetect() {
            // Try to run immediately if DOM is ready
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                getDeviceInfo();
                fetchLocalServerData();
                startLocalServerPolling();
            } 
            // Wait for DOM to be ready
            else if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    getDeviceInfo();
                    fetchLocalServerData();
                    startLocalServerPolling();
                }, { once: true });
            }
            // Fallback: wait for window load
            window.addEventListener('load', () => {
                // Only run if we haven't detected basic info yet
                if (!deviceInfo.platform || !deviceInfo.browser) {
                    getDeviceInfo();
                }
                fetchLocalServerData();
                startLocalServerPolling();
            }, { once: true });
        })();
    </script>
</body>
</html>
  `;

  res.send(html);
});

// API endpoint for JSON response
app.get('/api', (req, res) => {
  const serverInfo = {
    deviceName: os.hostname(),
    lanIP: getLocalIPAddress(),
    platform: os.platform(),
    arch: os.arch()
  };

  const clientInfo = {
    ip: getClientIP(req),
    userAgent: getUserAgentInfo(req)
  };

  res.json({
    server: serverInfo,
    client: clientInfo,
    timestamp: new Date().toISOString()
  });
});

// Endpoint to receive client-detected device information
app.post('/api/client-info', express.json(), (req, res) => {
  res.json({
    success: true,
    received: req.body,
    timestamp: new Date().toISOString()
  });
});

// Endpoint to expose local server device info (for live website to fetch)
app.get('/api/local-device', (req, res) => {
  const localDeviceInfo = {
    deviceName: process.env.DEVICE_NAME || os.hostname() || 'Unknown Server',
    lanIP: getLocalIPAddress(),
    platform: os.platform(),
    arch: os.arch(),
    networkInterfaces: Object.keys(os.networkInterfaces()),
    timestamp: new Date().toISOString(),
    isLocal: true
  };
  
  res.json(localDeviceInfo);
});

// Export for Vercel
module.exports = app;

// Start server only if not on Vercel
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 Device Info Server is running!');
    console.log('='.repeat(50));
    console.log(`📍 Server running at: http://localhost:${PORT}`);
    console.log(`📍 Network access: http://${getLocalIPAddress()}:${PORT}`);
    console.log('='.repeat(50));
  });
}

