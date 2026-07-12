# Octane

A modern, TypeScript-based backend API for managing users, authentication, and acknowledgments with admin capabilities. Built with Express.js and PostgreSQL.

🌐 **Live Demo**: [https://octane-nine.vercel.app](https://octane-nine.vercel.app)

## Features

- **Authentication & Authorization**
  - User signup and login with JWT tokens
  - Role-based access control (Admin, User)
  - Secure password management

- **User Management**
  - User profiles with avatar support
  - NFC (Near Field Communication) allocation
  - User suspension capabilities
  - Profile image uploads to Cloudinary

- **Acknowledgments System**
  - Post and retrieve acknowledgments
  - Image attachments for acknowledgments
  - Monthly acknowledgment tracking
  - User acknowledgment statistics

- **Admin Dashboard**
  - Manage users and allocate NFCs
  - Generate and export acknowledgment reports
  - Company management via Excel imports
  - Bulk company data replacement
  - User acknowledgment analytics

- **File Management**
  - Image uploads via Multer
  - Cloudinary integration for cloud storage
  - Excel file processing for bulk operations

- **API Documentation**
  - Swagger/OpenAPI documentation
  - Interactive API explorer

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Storage**: Cloudinary
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Excel Processing**: XLSX
- **API Docs**: Swagger JSDoc

## Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/Khaled-Amr-1/Octane.git
cd Octane
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/octane

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server
PORT=3000
NODE_ENV=development
```

4. **Build the project**
```bash
npm run build
```

## Usage

### Development

Start the development server with hot-reload:
```bash
npm run dev
```

The server will run at `http://localhost:3000`

### Production

Build and start the production server:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - Register a new user
- `POST /login` - Login with credentials

### Users (`/api/users`)
- `GET /nfcs` - Get user's allocated NFCs
- `GET /acknowledgments` - Get user's acknowledgments
- `POST /acknowledgments` - Create a new acknowledgment with image
- `GET /profile` - Get user profile
- `POST /profile/image` - Upload profile image
- `PUT /profile/image` - Update profile image

### Admin (`/api/admin`)
- `POST /users/allocate/:userId` - Allocate NFCs to user
- `POST /users/suspend/:userId` - Suspend user account
- `GET /users` - Get all users
- `GET /users/acknowledgments/:userId` - Get user acknowledgments and stats
- `POST /companies` - Import companies from Excel
- `PUT /companies` - Replace all companies
- `GET /companies` - Get all companies
- `GET /reports` - Get acknowledgment reports
- `DELETE /acknowledgments` - Delete acknowledgments by month
- `GET /report/export` - Export acknowledgments report
- `GET /report/export/user/:userId` - Export user acknowledgments for current month

## Project Structure

```
src/
├── app.ts                 # Express app setup
├── modules/               # Feature modules
│   ├── auth/             # Authentication module
│   ├── user/             # User management module
│   └── admin/            # Admin functionality module
├── routes/               # API route definitions
├── middlewares/          # Custom middleware
│   ├── auth.middleware.ts
│   ├── authorize.middleware.ts
│   └── upload.middleware.ts
└── utils/                # Utility functions
    └── cloudinary.ts     # Cloudinary integration
```

## Middleware

- **JWT Authentication**: Validates JWT tokens on protected routes
- **Role Authorization**: Restricts endpoints to specific user roles
- **File Upload**: Handles image uploads with Multer
- **Excel Processing**: Processes Excel files for bulk operations

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Secure password handling
- File validation for uploads
- Environment variable protection

## Development

### Scripts

- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

### TypeScript Configuration

The project is configured with strict TypeScript settings for type safety.

## License

ISC

## Author

Khaled-Amr-1

---

**Need help?** Check the API documentation at `/api/docs` when running the server, or open an issue on GitHub.
