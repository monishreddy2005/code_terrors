#Problem Statement-1 
# Skill Swap Platform

#Team:
1.Chennareddy Monish.
2.Maram Ruthvi.
3.B Harshitha.
4.Parvathy Rajesh.


# Skill Swap Backend

A Node.js backend API for a skill swapping platform built with Express.js and PostgreSQL.

## Features

- User authentication with JWT tokens
- User profile management
- Skill management (offered/wanted skills)
- Swap request system
- Rating and feedback system
- Admin functionality for user management

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

1. **Install PostgreSQL** 
2. **Create a new database**:
   ```sql
   CREATE DATABASE odoo_hackathon;
   ```

3. **Import the database schema**:
   ```bash
   psql -d odoo_hackathon -f odoo_hackathon.sql
   ```

### 3. Environment Configuration

1. **Copy the config template**:
   ```bash
   cp config.env .env
   ```

2. **Edit the `.env` file** with your database credentials:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=odoo_hackathon
   DB_USER=your_username
   DB_PASSWORD=your_password

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=24h

   # CORS Configuration
   CORS_ORIGIN=http://localhost:5500
   ```

### 4. Start the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users/swappers` - Get all public swappers
- `GET /api/users/profile/:userId` - Get user profile by ID
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/availability` - Update user availability
- `POST /api/users/skills/offered` - Add skill offered
- `POST /api/users/skills/wanted` - Add skill wanted
- `DELETE /api/users/skills/offered/:skillId` - Remove skill offered
- `DELETE /api/users/skills/wanted/:skillId` - Remove skill wanted

### Skills
- `GET /api/skills` - Get all skills
- `GET /api/skills/:skillId` - Get skill by ID
- `POST /api/skills` - Create new skill (admin)
- `PUT /api/skills/:skillId` - Update skill (admin)
- `DELETE /api/skills/:skillId` - Delete skill (admin)
- `GET /api/skills/categories/list` - Get skill categories
- `GET /api/skills/category/:category` - Get skills by category

### Swaps
- `POST /api/swaps` - Create swap request
- `GET /api/swaps/my-requests` - Get user's swap requests
- `GET /api/swaps/:swapId` - Get swap request by ID
- `PUT /api/swaps/:swapId/accept` - Accept swap request
- `PUT /api/swaps/:swapId/reject` - Reject swap request
- `PUT /api/swaps/:swapId/cancel` - Cancel swap request
- `POST /api/swaps/:swapId/rate` - Rate completed swap

### Health Check
- `GET /health` - Server health check

## Database Schema

The application uses the following main tables:
- `users` - User profiles and authentication
- `skills` - Available skills in the system
- `user_skills_offered` - Skills users offer to teach
- `user_skills_wanted` - Skills users want to learn
- `swap_requests` - Skill swap requests between users
- `user_ratings` - User ratings and feedback
- `user_ban_logs` - Admin actions for user management
- `platform_policies` - Platform policies and rules

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation with express-validator
- Rate limiting
- CORS protection
- Helmet.js for security headers

## Error Handling

The API returns consistent error responses:
```json
{
  "error": "Error message",
  "message": "Additional details"
}
```

## Development

### Project Structure
```
├── server.js              # Main server file
├── config.env             # Environment configuration
├── package.json           # Dependencies and scripts
├── db/
│   └── database.js        # Database connection
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── users.js          # User management routes
│   ├── skills.js         # Skill management routes
│   └── swaps.js          # Swap request routes
└── odoo_hackathon.sql    # Database schema
```

### Adding New Routes

1. Create a new route file in the `routes/` directory
2. Import and use it in `server.js`
3. Follow the existing pattern for middleware and error handling

### Database Functions

The application uses PostgreSQL functions for complex operations:
- `insert_user()` - User registration
- `get_swappers()` - Search for available swappers
- `update_about_and_privacy()` - Update user profile
- `update_availability()` - Update user availability
- `add_skill_offered()` / `remove_skill_offered()` - Manage offered skills
- `add_skill_wanted()` / `remove_skill_wanted()` - Manage wanted skills

## Testing the API

You can test the API using tools like Postman or curl:

```bash
# Health check
curl http://localhost:3000/health

# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify database credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing process on port 3000

3. **JWT Secret Missing**
   - Set JWT_SECRET in `.env` file
   - Use a strong, random string

4. **CORS Errors**
   - Update CORS_ORIGIN in `.env` to match your frontend URL

### Logs

The server logs all database queries and errors. Check the console output for debugging information.

## License

ISC License 
