# Construction Monitoring Backend API

A comprehensive Node.js backend API for construction monitoring, auditing, and inspection mobile applications. Built with Express.js, PostgreSQL, and Sequelize ORM.

## Features

### 🏗️ Core Functionality
- **Dual User Types**: Individual users and Organization-based users with role management
- **Three Operation Types**: Progress Monitoring, Auditing, and Inspection
- **Media Capture**: Image and video capture with comprehensive metadata logging
- **AI Analysis**: Integration with OpenAI and Gemini APIs for automated defect detection
- **Cloud Storage**: AWS S3 integration for media storage and synchronization
- **Real-time Processing**: Asynchronous AI analysis with status tracking

### 🔐 Security & Access Control
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Permissions**: Granular permission system for organization users
- **Site-Based Access Control**: Scope-limited access to projects and sites
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive request validation

### 📊 Data Management
- **Project & Site CRUD**: Complete management of construction projects and sites
- **Sensor Data Logging**: GPS coordinates, camera parameters, accelerometer, gyroscope
- **Annotation System**: Custom annotations and measurements with depth mapping
- **Report Generation**: Automated report creation based on operation types
- **Sharing Capabilities**: WhatsApp and Email integration for capture sharing

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Storage**: AWS S3 for media files
- **AI Processing**: OpenAI GPT-4 Vision / Google Gemini
- **Authentication**: JWT tokens
- **File Processing**: Sharp for image manipulation
- **Logging**: Winston for comprehensive logging
- **Validation**: Express-validator and Joi

## Quick Start

### Prerequisites
- Node.js (>=16.0.0)
- PostgreSQL (>=12.0)
- AWS S3 bucket
- OpenAI or Gemini API access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd construction-monitoring-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb construction_monitoring
   
   # Run migrations (in development)
   npm run migrate
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration (Individual/Organization)
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Sites
- `POST /api/sites` - Create site
- `GET /api/sites` - List sites
- `GET /api/sites/:id` - Get site details
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Delete site
- `POST /api/sites/assign-user` - Assign user to site

### Captures
- `POST /api/captures` - Upload media capture
- `GET /api/captures` - List captures
- `GET /api/captures/:id` - Get capture details
- `POST /api/captures/:id/ai-analysis/redo` - Redo AI analysis
- `POST /api/captures/:id/share` - Share capture
- `POST /api/captures/:id/annotations` - Add annotations

## Database Schema

### Key Models
- **Users**: Individual and organization users with role assignments
- **Organizations**: Company/organization management
- **Roles**: Custom role definitions with permissions and scope
- **Projects**: Construction project management
- **Sites**: Site-specific data with operation type binding
- **Captures**: Media files with comprehensive metadata
- **Annotations**: Custom annotations and measurements
- **Reports**: Generated reports based on captures

## Configuration

### Environment Variables
All configuration is managed through environment variables. See `.env.example` for required variables.

### AI Integration
The system supports both OpenAI and Gemini APIs:

```javascript
AI_PROVIDER=openai  # or 'gemini'
OPENAI_API_KEY=your_key
GEMINI_API_KEY=your_key
```

### AWS S3 Setup
Configure S3 for media storage:

```javascript
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket_name
```

## User Flow

### Individual Users
1. Register → Login → Create Captures → AI Analysis → Share

### Organization Users
1. Org Admin registers organization
2. Admin creates projects, sites, and user roles
3. Admin assigns users to sites with specific permissions
4. Users capture media within their assigned sites
5. AI processes captures automatically
6. Users can annotate, share, and generate reports

## Security Features

- **Input Validation**: All inputs validated using express-validator
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable allowed origins
- **Helmet.js**: Security headers
- **JWT Expiration**: Configurable token expiration
- **Role-Based Access**: Granular permission system

## Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure secure JWT secret
- [ ] Set up SSL/TLS certificates
- [ ] Configure production database
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Set up environment-specific variables

### Docker Support
```dockerfile
# Basic Dockerfile structure
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Monitoring & Logging

- **Winston Logging**: Comprehensive logging to files and console
- **Error Tracking**: Structured error handling and reporting
- **Health Checks**: `/health` endpoint for monitoring
- **Performance Metrics**: Request timing and database query logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact [your-email@domain.com] or open an issue in the repository.