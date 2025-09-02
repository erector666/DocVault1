# TestSprite MCP Integration Setup Guide

## Overview
TestSprite MCP server has been successfully installed and configured for your DOCVAULT1.0 project. This integration enables AI-assisted automated testing directly in your IDE.

## What Was Installed
- **Package**: `@testsprite/testsprite-mcp@0.0.13`
- **Type**: MCP (Model Context Protocol) Server
- **Purpose**: Automated software testing with AI assistance

## Configuration Files Created
1. **Global Configuration**: `%USERPROFILE%\.cursor\mcp_servers.json`
2. **Project Configuration**: `.cursor/mcp_servers.json`

## Next Steps Required

### 1. Get Your TestSprite API Key
- Visit: [https://www.testsprite.com/dashboard/settings/apikey](https://www.testsprite.com/dashboard/settings/apikey)
- Sign up for a free account if you don't have one
- Copy your API key

### 2. Update Configuration Files
Replace `"your-api-key-here"` with your actual API key in both:
- `%USERPROFILE%\.cursor\mcp_servers.json`
- `.cursor/mcp_servers.json`

### 3. Restart Cursor
After updating the API key, restart Cursor to load the new MCP configuration.

## Usage

### Basic Testing Command
Once configured, simply say in your AI chat:
```
Help me test this project with TestSprite
```

### What TestSprite Will Do
1. **Analyze** your code structure
2. **Generate** test plans and test code
3. **Execute** tests in secure cloud environments
4. **Provide** detailed results and fix suggestions

## Supported Testing Types
- ✅ Functional Testing
- ✅ Error Handling Testing
- ✅ Security Testing
- ✅ Authentication & Authorization
- ✅ Boundary Testing
- ✅ Edge Case Testing
- ✅ Response Content Testing
- ✅ UI/UX Testing

## Supported Technologies
- **Frontend**: React, Vue, Angular, Svelte, Next.js
- **Backend**: Node.js, Python, Java, Go
- **Frameworks**: Express, FastAPI, Spring Boot
- **APIs**: REST APIs, GraphQL

## Troubleshooting

### Common Issues
1. **MCP Server Not Connecting**
   - Verify API key is correct
   - Restart Cursor after configuration changes
   - Check `npm list -g @testsprite/testsprite-mcp`

2. **API Key Issues**
   - Verify key at [TestSprite API Key Page](https://www.testsprite.com/dashboard/settings/apikey)
   - Ensure account is active

### Verification Commands
```bash
# Check if package is installed
npm list @testsprite/testsprite-mcp

# Check global installation
npm list -g @testsprite/testsprite-mcp

# Test MCP server
npx @testsprite/testsprite-mcp@latest --help
```

## Documentation & Support
- **Full Documentation**: [docs.testsprite.com](https://docs.testsprite.com)
- **Demo Video**: [10-Minute Demo](https://youtu.be/yLQdORqPl3s)
- **Support**: [Schedule a call](https://calendly.com/contact-hmul/schedule)
- **Email**: contact@testsprite.com

## Project Integration Benefits
- **Automated Test Generation**: No manual test writing required
- **AI-Driven Testing**: Intelligent test planning based on your code
- **Cloud Execution**: Tests run in secure TestSprite environments
- **IDE Integration**: Seamless workflow within Cursor
- **Comprehensive Coverage**: 90%+ designed features delivered

## Security Notes
- API keys are stored locally in configuration files
- Tests run in isolated cloud environments
- No sensitive code is transmitted to TestSprite servers
- All communications are encrypted

---
*TestSprite MCP Integration completed on: $(Get-Date)*
*Package Version: @testsprite/testsprite-mcp@0.0.13*
