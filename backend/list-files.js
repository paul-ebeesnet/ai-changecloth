// Simple script to list files in the FTP directory
const ftp = require('basic-ftp');

const FTP_CONFIG = {
  host: 'ebeesnet.com',
  port: 21,
  user: 'tfunso',
  password: 'PIppen33',
  secure: false
};

async function listFiles() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  
  try {
    await client.access(FTP_CONFIG);
    
    // Check the wynn-mif.ebeesnet.com/public_html directory
    try {
      console.log(`\nTrying to list files in: domains/wynn-mif.ebeesnet.com/public_html`);
      await client.cd('domains/wynn-mif.ebeesnet.com/public_html');
      const files = await client.list();
      console.log(`Files in domains/wynn-mif.ebeesnet.com/public_html:`, files.map(f => `${f.name} (${f.isDirectory ? 'dir' : 'file'})`));
    } catch (err) {
      console.log(`Could not access domains/wynn-mif.ebeesnet.com/public_html:`, err.message);
    }
    
    client.close();
  } catch (err) {
    console.error('Error:', err);
    client.close();
  }
}

listFiles();