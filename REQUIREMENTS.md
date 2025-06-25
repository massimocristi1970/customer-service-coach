# Customer Service Coach - System Requirements & Setup Guide

## Overview
This document outlines the requirements and setup process for the Customer Service Coach system, enabling deployment on any machine for development or production use.

## System Requirements

### Minimum Hardware Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space (excluding document storage)
- **CPU**: Any modern processor (x64 architecture)
- **Network**: Internet connection for initial setup and updates

### Operating System Support
- **Windows**: Windows 10/11 (Primary development platform)
- **macOS**: macOS 10.14 or later
- **Linux**: Ubuntu 18.04+ or equivalent distributions

### Required Software Dependencies

#### 1. Node.js (Required)
- **Version**: 14.x or higher (18.x recommended)
- **Download**: https://nodejs.org/
- **Installation**: Download LTS version and run installer with default options
- **Verification**: Run `node --version` and `npm --version` in terminal

#### 2. Git (Required for development)
- **Version**: 2.x or higher
- **Download**: https://git-scm.com/
- **Installation**: Install with default options
- **Verification**: Run `git --version`

#### 3. GitHub Desktop (Optional - for easier Git management)
- **Download**: https://desktop.github.com/
- **Purpose**: Simplifies repository management and syncing

### Browser Requirements (for users)
- **Chrome**: Version 80+
- **Firefox**: Version 75+
- **Safari**: Version 13+
- **Edge**: Version 80+

## Quick Setup Checklist

### ✅ Pre-Setup Verification
```bash
# Verify Node.js installation
node --version
npm --version

# Verify Git installation  
git --version
```

### ✅ Repository Setup
```bash
# Clone the repository
git clone https://github.com/massimocristi1970/customer-service-coach.git

# Navigate to project directory
cd customer-service-coach

# Install dependencies
npm install

# Create required directories
mkdir logs uploads

# Initialize log files (Windows)
echo [] > logs\unanswered-questions.json
echo [] > logs\feedback-logs.json  
echo [] > logs\search-logs.json

# Initialize log files (Mac/Linux)
echo "[]" > logs/unanswered-questions.json
echo "[]" > logs/feedback-logs.json
echo "[]" > logs/search-logs.json
```

### ✅ Initial System Test
```bash
# Start the server
node server.js

# Expected output:
# Customer Service Coach running at http://localhost:3000
# Admin Panel available at http://localhost:3000/admin.html
# Knowledge base loaded with X documents
# Ready to help your agents!
```

### ✅ Access Verification
- **Agent Interface**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin.html

## Project Structure

```
customer-service-coach/
├── index.html              # Agent interface
├── admin.html              # Admin panel for content management
├── server.js               # Backend server application
├── package.json            # Node.js dependencies and scripts
├── knowledge-base.json     # Searchable content database
├── README.md               # Project documentation
├── .gitignore              # Git ignore rules
├── uploads/                # Document storage (created during setup)
├── logs/                   # System logs (created during setup)
│   ├── search-logs.json
│   ├── feedback-logs.json
│   └── unanswered-questions.json
└── node_modules/           # Dependencies (created by npm install)
```

## Network Configuration

### For Local Development
- **URL**: http://localhost:3000
- **Port**: 3000 (configurable in server.js)
- **Access**: Local machine only

### For Network Deployment
```bash
# Find machine IP address
# Windows:
ipconfig

# Mac/Linux:
ifconfig
```

- **Agent URL**: http://[MACHINE-IP]:3000
- **Admin URL**: http://[MACHINE-IP]:3000/admin.html
- **Firewall**: Ensure port 3000 is open
- **Network**: All users must be on same network

## Environment Variables (Optional)

Create `.env` file in project root for custom configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# File Upload Limits
MAX_FILE_SIZE=10MB
UPLOAD_PATH=./uploads

# Logging Configuration
LOG_LEVEL=info
LOG_RETENTION_DAYS=30
```

## Production Deployment Considerations

### Process Management (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start server.js --name "customer-service-coach"

# Configure auto-startup
pm2 startup
pm2 save

# Monitor application
pm2 status
pm2 logs customer-service-coach
```

### Security Considerations
- Run on internal network only (not internet-facing)
- Consider adding basic authentication for admin panel
- Regular system updates and dependency updates
- Backup knowledge-base.json and logs regularly

## Maintenance Tasks

### Regular Updates
```bash
# Pull latest code changes
git pull origin main

# Update dependencies
npm update

# Restart application
# With PM2: pm2 restart customer-service-coach
# Without PM2: Ctrl+C then node server.js
```

### Backup Important Data
- **Knowledge Base**: `knowledge-base.json`
- **Usage Logs**: `logs/` directory
- **Uploaded Documents**: `uploads/` directory

### Monitoring
- Check `logs/unanswered-questions.json` for content gaps
- Monitor `logs/search-logs.json` for usage patterns
- Review `logs/feedback-logs.json` for system effectiveness

## Troubleshooting

### Common Issues

#### "npm not recognized"
- **Solution**: Install Node.js from https://nodejs.org/
- **Verification**: Restart terminal, run `npm --version`

#### "Port 3000 in use"
- **Cause**: Another instance is running
- **Solution**: Find and stop other instance, or change port in server.js

#### "Cannot find module"
- **Cause**: Dependencies not installed
- **Solution**: Run `npm install` in project directory

#### Agent interface not loading
- **Check**: Server is running (`node server.js`)
- **Check**: Correct URL (http://localhost:3000)
- **Check**: No firewall blocking port 3000

#### File upload not working
- **Check**: `uploads/` directory exists
- **Check**: File permissions
- **Check**: File type is supported (PDF, TXT)

### Performance Optimization

#### For Large Knowledge Bases (1000+ documents)
- Consider database upgrade from JSON to SQLite/PostgreSQL
- Implement search indexing
- Add pagination to admin interface

#### For High Usage (10+ concurrent users)
- Increase server resources
- Implement caching
- Consider load balancing

## Development Workflow

### Making Changes
1. **Edit files** in your preferred code editor
2. **Test locally** with `node server.js`
3. **Commit changes** with Git
4. **Push to GitHub** for backup/sharing
5. **Deploy to production** machine

### GitHub Integration
```bash
# Add changes
git add .

# Commit with message
git commit -m "Description of changes"

# Push to GitHub
git push origin main

# On production machine, pull updates
git pull origin main
npm install  # if package.json changed
```

## Support Information

### Repository
- **GitHub**: https://github.com/massimocristi1970/customer-service-coach
- **Clone URL**: git@github.com:massimocristi1970/customer-service-coach.git

### Key Files for Customization
- **Categories**: Edit `admin.html` around line 200
- **Quick Buttons**: Edit `index.html` around line 100
- **Server Port**: Edit `server.js` line 9
- **Styling**: Modify CSS sections in HTML files

### Logs Location
- **Search activity**: `logs/search-logs.json`
- **User feedback**: `logs/feedback-logs.json`
- **Missing content**: `logs/unanswered-questions.json`

---

**This document should be kept updated as the system evolves and new requirements are identified.**