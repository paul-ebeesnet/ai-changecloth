// Simple script to test FTP connection
const ftp = require('basic-ftp');

const FTP_CONFIG = {
  host: 'ebeesnet.com',
  port: 21,
  user: 'tfunso', // Try with just tfunso
  password: 'PIppen33',
  secure: false
};

async function testConnection() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  
  try {
    await client.access(FTP_CONFIG);
    console.log('Successfully connected to FTP server');
    
    // Try to list files in the root directory
    const files = await client.list();
    console.log('Files in root directory:', files.map(f => f.name));
    
    client.close();
  } catch (err) {
    console.error('FTP Connection Error:', err);
    client.close();
  }
}

testConnection();