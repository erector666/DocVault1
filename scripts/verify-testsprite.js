#!/usr/bin/env node

/**
 * TestSprite MCP Verification Script
 * Verifies that TestSprite MCP server is properly installed and configured
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 TestSprite MCP Verification Script');
console.log('=====================================\n');

// Check 1: Package installation
console.log('1. Checking package installation...');
try {
  const packageInfo = execSync('npm list @testsprite/testsprite-mcp', { encoding: 'utf8' });
  console.log('✅ Package installed successfully');
  console.log(packageInfo.split('\n')[0]);
} catch (error) {
  console.log('❌ Package not found');
  process.exit(1);
}

// Check 2: MCP server executable
console.log('\n2. Checking MCP server executable...');
try {
  const helpOutput = execSync('npx @testsprite/testsprite-mcp@latest --help', { encoding: 'utf8' });
  console.log('✅ MCP server executable');
  console.log('Available commands:', helpOutput.split('\n').filter(line => line.includes('Commands:')).join(''));
} catch (error) {
  console.log('❌ MCP server not executable');
  console.log('Error:', error.message);
}

// Check 3: Configuration files
console.log('\n3. Checking configuration files...');
const userConfig = path.join(process.env.USERPROFILE, '.cursor', 'mcp_servers.json');
const projectConfig = path.join(process.cwd(), '.cursor', 'mcp_servers.json');

if (fs.existsSync(userConfig)) {
  console.log('✅ Global MCP configuration found');
} else {
  console.log('❌ Global MCP configuration missing');
}

if (fs.existsSync(projectConfig)) {
  console.log('✅ Project MCP configuration found');
} else {
  console.log('❌ Project MCP configuration missing');
}

// Check 4: API key configuration
console.log('\n4. Checking API key configuration...');
try {
  const userConfigContent = fs.existsSync(userConfig) ? fs.readFileSync(userConfig, 'utf8') : '';
  const projectConfigContent = fs.existsSync(projectConfig) ? fs.readFileSync(projectConfig, 'utf8') : '';
  
  if (userConfigContent.includes('your-api-key-here') || projectConfigContent.includes('your-api-key-here')) {
    console.log('⚠️  API key needs to be configured');
    console.log('   Visit: https://www.testsprite.com/dashboard/settings/apikey');
  } else {
    console.log('✅ API key appears to be configured');
  }
} catch (error) {
  console.log('❌ Error reading configuration files');
}

console.log('\n=====================================');
console.log('Verification complete!');
console.log('\nNext steps:');
console.log('1. Get your API key from TestSprite dashboard');
console.log('2. Update the API key in configuration files');
console.log('3. Restart Cursor to load MCP configuration');
console.log('4. Test with: "Help me test this project with TestSprite"');
console.log('\nDocumentation: https://docs.testsprite.com');
