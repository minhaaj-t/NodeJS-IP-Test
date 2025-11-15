const os = require('os');

/**
 * Get the LAN IP address of the device
 * @returns {string|null} The LAN IP address or null if not found
 */
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  // Check all network interfaces
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    
    for (const address of addresses) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  
  return null;
}

/**
 * Get the device name (hostname)
 * @returns {string} The hostname of the device
 */
function getDeviceName() {
  return os.hostname();
}

/**
 * Display device information
 */
function displayDeviceInfo() {
  console.log('='.repeat(50));
  console.log('Device Information');
  console.log('='.repeat(50));
  
  const deviceName = getDeviceName();
  const ipAddress = getLocalIPAddress();
  
  console.log(`Device Name: ${deviceName}`);
  
  if (ipAddress) {
    console.log(`LAN IP Address: ${ipAddress}`);
  } else {
    console.log('LAN IP Address: Not found');
  }
  
  console.log('='.repeat(50));
  
  // Additional network information
  console.log('\nNetwork Interfaces:');
  console.log('-'.repeat(50));
  const interfaces = os.networkInterfaces();
  
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    console.log(`\n${interfaceName}:`);
    
    addresses.forEach(address => {
      console.log(`  ${address.family} - ${address.address}${address.internal ? ' (internal)' : ''}`);
    });
  }
}

// Run the display function
displayDeviceInfo();

