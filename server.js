const express = require('express');
const os = require('os');
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Get the LAN IP address of the server
 * @returns {string|null} The LAN IP address or null if not found
 */
function getLocalIPAddress() {
  // On Vercel/serverless, network interfaces may not be meaningful
  if (process.env.VERCEL) {
    return 'N/A (Serverless Environment)';
  }
  
  const interfaces = os.networkInterfaces();
  
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    
    for (const address of addresses) {
      // Skip internal, loopback, and link-local addresses
      if (address.family === 'IPv4' && 
          !address.internal && 
          !address.address.startsWith('169.254.')) {
        return address.address;
      }
    }
  }
  
  return null;
}

/**
 * Get server device name (handles Vercel/serverless environments)
 * @returns {string} The device name or server identifier
 */
function getServerDeviceName() {
  // On Vercel, use environment variable or a friendly name
  if (process.env.VERCEL) {
    return process.env.VERCEL_URL ? 
           `Vercel Server (${process.env.VERCEL_URL.replace('https://', '').replace('.vercel.app', '')})` : 
           'Vercel Serverless Function';
  }
  
  const hostname = os.hostname();
  
  // If hostname is an IP address (common in containers/serverless), use a fallback
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipPattern.test(hostname)) {
    return `Server (${hostname})`;
  }
  
  return hostname;
}

/**
 * Get client IP address from request
 * Handles proxies and load balancers (especially Vercel)
 */
function getClientIP(req) {
  // Vercel uses x-forwarded-for header
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, get the first one (client's real IP)
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0] || 'Unknown';
  }
  
  // Fallback to other headers
  return req.headers['x-real-ip'] ||
         req.headers['cf-connecting-ip'] || // Cloudflare
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

/**
 * Escape HTML to prevent XSS attacks (server-side)
 */
function escapeHtml(text) {
  if (typeof text !== 'string') {
    text = String(text);
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Serve static HTML page
app.get('/', (req, res) => {
  const serverInfo = {
    deviceName: getServerDeviceName(),
    lanIP: getLocalIPAddress(),
    platform: os.platform(),
    arch: os.arch()
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
                <span class="value">${escapeHtml(serverInfo.deviceName || 'Unknown')}</span>
            </div>
            <div class="info-item">
                <span class="label">LAN IP Address:</span>
                <span class="value">${escapeHtml(serverInfo.lanIP || 'Not found')}</span>
            </div>
            <div class="info-item">
                <span class="label">Platform:</span>
                <span class="value">${escapeHtml(serverInfo.platform || 'Unknown')}</span>
            </div>
            <div class="info-item">
                <span class="label">Architecture:</span>
                <span class="value">${escapeHtml(serverInfo.arch || 'Unknown')}</span>
            </div>
        </div>

        <div class="section">
            <h2>Your Information (Client)</h2>
            <div class="info-item">
                <span class="label">Your Public IP Address:</span>
                <span class="value">${escapeHtml(clientInfo.ip || 'Unknown')}</span>
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
                <span class="value">${escapeHtml(clientInfo.userAgent || 'Unknown')}</span>
            </div>
        </div>

        <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
    </div>

    <script>
        // Get device information using browser APIs
        function getDeviceInfo() {
            const info = {
                deviceName: null,
                localIP: null,
                platform: navigator.platform || 'Unknown',
                browser: getBrowserInfo(),
                screen: screen.width + 'x' + screen.height,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                cpuCores: navigator.hardwareConcurrency || 'Unknown',
                memory: navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'Unknown'
            };

            // Try to infer device name from available information
            let deviceName = null;
            
            // Check if we can get more specific device info
            const ua = navigator.userAgent;
            const platform = navigator.platform || '';
            
            // Try to extract device model from user agent (for mobile devices)
            const mobileMatch = ua.match(/(iPhone|iPad|iPod|Android|Windows Phone|BlackBerry)/i);
            const modelMatch = ua.match(/(iPhone|iPad|iPod|Android|Windows Phone|BlackBerry)[^;]*/i);
            
            if (modelMatch) {
                deviceName = modelMatch[0].trim();
            } else if (platform) {
                // For desktop, use platform as device identifier
                // Combine with other info for uniqueness
                const cores = navigator.hardwareConcurrency || '';
                const mem = navigator.deviceMemory || '';
                deviceName = platform + (cores ? ' (' + cores + ' cores)' : '');
            } else {
                deviceName = 'Unknown Device';
            }
            
            info.deviceName = deviceName;
            
            // Display device name immediately (before async operations)
            updateDisplay(info);

            // Try to get local IP using WebRTC
            getLocalIPAddress().then(ip => {
                info.localIP = ip;
                updateDisplay(info);
            }).catch(() => {
                info.localIP = 'Not available (WebRTC blocked or not supported)';
                updateDisplay(info);
            });

            // Try to get hostname from WebRTC or other methods
            tryGetHostname().then(hostname => {
                if (hostname) {
                    // If we got a real hostname, use it
                    info.deviceName = hostname;
                    updateDisplay(info);
                }
            });

            return info;
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
        function updateDisplay(info) {
            const deviceNameEl = document.getElementById('deviceName');
            const localIPEl = document.getElementById('localIP');
            const platformEl = document.getElementById('platform');
            const browserEl = document.getElementById('browser');
            const screenEl = document.getElementById('screen');

            // Always update device name if available
            if (info.deviceName) {
                deviceNameEl.innerHTML = '<span class="detected">' + escapeHtml(info.deviceName) + '</span>';
            } else {
                deviceNameEl.innerHTML = '<span class="not-detected">Not detected</span>';
            }

            if (info.localIP) {
                localIPEl.innerHTML = '<span class="detected">' + escapeHtml(info.localIP) + '</span>';
            } else if (info.localIP === 'Not available (WebRTC blocked or not supported)') {
                localIPEl.innerHTML = '<span class="not-detected">' + escapeHtml(info.localIP) + '</span>';
            }

            if (info.platform) {
                platformEl.innerHTML = '<span class="detected">' + escapeHtml(info.platform) + '</span>';
            }

            if (info.browser) {
                browserEl.innerHTML = '<span class="detected">' + escapeHtml(info.browser) + '</span>';
            }

            if (info.screen) {
                screenEl.innerHTML = '<span class="detected">' + escapeHtml(info.screen) + '</span>';
            }

            // Send info to server
            fetch('/api/client-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(info)
            }).catch(err => console.log('Could not send info to server:', err));
        }
        
        // Helper function to escape HTML
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Initialize on page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                getDeviceInfo();
            }, 100);
        });
    </script>
</body>
</html>
  `;

  res.send(html);
});

// API endpoint for JSON response
app.get('/api', (req, res) => {
  const serverInfo = {
    deviceName: getServerDeviceName(),
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

