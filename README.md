# Customer Service Coach

A knowledge-based chatbot system designed to help customer service agents find instant answers to customer questions using company policies and procedures.

## Features

- **Instant Search**: Agents can search company knowledge base in real-time
- **Document Upload**: Upload PDF and text files to automatically create searchable content
- **Manual Content Entry**: Add policies and procedures through simple web forms
- **Analytics Dashboard**: Track unanswered questions and system usage
- **Quick Access Buttons**: One-click access to common topics
- **Feedback System**: Agents can mark answers as helpful or not helpful

## System Requirements

- Node.js (v14 or higher)
- Web browser (Chrome, Firefox, Edge, Safari)
- Network access for agents

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/massimocristi1970/customer-service-coach.git
   cd customer-service-coach
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   node server.js
   ```

4. **Access the application:**
   - Agent Interface: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin.html

## Usage

### For Administrators

1. **Access Admin Panel:** Go to http://localhost:3000/admin.html
2. **Add Content:**
   - Upload PDF documents for automatic text extraction
   - Manually enter policies and procedures
   - Organize content by categories and keywords
3. **Monitor Usage:**
   - View analytics and usage statistics
   - See unanswered questions to identify knowledge gaps

### For Agents

1. **Access Agent Interface:** Go to http://localhost:3000
2. **Search for Information:**
   - Type questions in natural language
   - Use quick access buttons for common topics
   - Review source documents for verification
3. **Provide Feedback:**
   - Mark answers as helpful or not helpful
   - Help improve the system for everyone

## File Structure

```
customer-service-coach/
├── index.html              # Agent interface
├── admin.html              # Admin panel for content management
├── server.js               # Backend server
├── package.json            # Node.js dependencies
├── knowledge-base.json     # Searchable content database
├── uploads/                # Uploaded document storage
├── logs/                   # Usage logs and analytics
│   ├── search-logs.json
│   ├── feedback-logs.json
│   └── unanswered-questions.json
└── README.md               # This file
```

## Configuration

### Changing Categories

Edit the category options in `admin.html` around line 200:

```html
<select id="category">
    <option value="general">General</option>
    <option value="your-category">Your Category</option>
    <!-- Add your company-specific categories -->
</select>
```

### Customizing Quick Access Buttons

Edit the quick access buttons in `index.html`:

```html
<div class="quick-btn" onclick="quickSearch('your topic')">🔧 Your Topic</div>
```

## Network Deployment

### For Local Network Access

1. **Find your server's IP address:**
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```

2. **Share the URL with agents:**
   ```
   http://YOUR-IP-ADDRESS:3000
   ```

### For Persistent Running

Use PM2 to keep the server running:

```bash
npm install -g pm2
pm2 start server.js --name "customer-service-coach"
pm2 startup
pm2 save
```

## Supported File Types

- **PDF**: Automatic text extraction
- **TXT**: Plain text files
- **Manual Entry**: Direct input through web interface

## Security Notes

- This system is designed for internal network use
- No authentication is implemented by default
- Ensure proper network security measures are in place
- Consider adding authentication for production use

## Troubleshooting

### Server Won't Start
- Check if Node.js is installed: `node --version`
- Ensure all dependencies are installed: `npm install`
- Check if port 3000 is available

### Can't Upload Files
- Ensure the `uploads/` directory exists
- Check file permissions
- Verify supported file types (PDF, TXT)

### Search Not Working
- Check if `knowledge-base.json` contains valid data
- Verify server is running and accessible
- Check browser console for errors

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review server logs for error messages
3. Ensure all files are properly configured

## License

Internal company use only.

---

**Built for efficient customer service support and knowledge management.**