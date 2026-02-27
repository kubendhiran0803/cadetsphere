# CadetSphere - Admin Registration SQL Schema

## Database: `cadetsphere`

### Admin Table Structure

Run this SQL query to create the **admin** table:

```sql
CREATE TABLE admin (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  department VARCHAR(100),
  role ENUM('Admin') DEFAULT 'Admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Column Details

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for admin |
| `full_name` | VARCHAR(100) | NOT NULL | Administrator's full name |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL | Email address (must be unique) |
| `password` | VARCHAR(255) | NOT NULL | Hashed password (bcrypt) |
| `phone` | VARCHAR(15) | NOT NULL | Contact phone number |
| `department` | VARCHAR(100) | NULL | Department/Organization name |
| `role` | ENUM('Admin') | DEFAULT 'Admin' | User role (always Admin) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation date |
| `updated_at` | TIMESTAMP | DEFAULT on update | Last update timestamp |

---

## Sample Data Insert

```sql
-- Example admin account (password: hashed during signup)
INSERT INTO admin (full_name, email, password, phone, department, role)
VALUES ('John Administrator', 'john.admin@example.com', '[HASHED_PASSWORD]', '9876543210', 'Training', 'Admin');
```

---

## Admin Registration Flow

### Step 1: Admin Signup Page (`/admin` route)
Admin fills in:
- Full Name (required)
- Email (required, unique)
- Phone Number (required)
- Department (optional)
- Password (required, min 6 chars)
- Confirm Password (required, must match)

### Step 2: Backend Validation
- Check all required fields
- Hash password using bcrypt
- Insert into `admin` table

### Step 3: Success Response
- Show "Admin account created successfully" alert
- Redirect to login page: `/login`

### Step 4: Admin Login
- Go to login page
- Select "Admin" role
- Enter email and password
- Routes to `/admin-dashboard`

---

## Login Route Mapping

After successful login, users are routed based on their role:

```javascript
Admin   → /admin-dashboard
Cadet   → /cadet-dashboard
Staff   → /staff-dashboard
```

---

## Database Queries for Admin

### Get all admins
```sql
SELECT * FROM admin;
```

### Get specific admin by email
```sql
SELECT * FROM admin WHERE email = 'john.admin@example.com';
```

### Update admin phone
```sql
UPDATE admin SET phone = '9999999999' WHERE email = 'john.admin@example.com';
```

### Delete admin account
```sql
DELETE FROM admin WHERE id = 1;
```

### Get admin count
```sql
SELECT COUNT(*) as total_admins FROM admin;
```

---

## Security Notes

1. **Passwords**: Stored as bcrypt hashes (never plain text)
2. **Email**: Unique constraint prevents duplicate accounts
3. **Role**: Fixed as 'Admin' for this table
4. **Timestamps**: Auto-tracked for audit purposes

---

## Integration Summary

### Files Updated:
1. **`app/admin.js`** - Admin signup form (beautiful UI)
2. **`backend/routes/authRoutes.js`** - Admin signup endpoint
3. **`app/login.js`** - Role-based routing + AsyncStorage

### New Endpoint:
```
POST /api/auth/admin-signup
```

**Request:**
```json
{
  "fullName": "John Admin",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "phone": "9876543210",
  "department": "Training"
}
```

**Response:**
```json
{
  "message": "Admin account created successfully"
}
```

---

## Testing Checklist

- [ ] Create admin table with SQL above
- [ ] Fill admin form with valid data
- [ ] Click "Create Admin Account"
- [ ] Redirected to login page
- [ ] Select "Admin" and login
- [ ] Verify redirect to `/admin-dashboard`
- [ ] Check admin details saved in database
- [ ] Verify password is hashed (not plain text)

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| "Email already exists" | Duplicate email | Use different email |
| "All required fields must be filled" | Missing field | Fill full_name, email, phone, password |
| "Passwords do not match" | Password mismatch | Ensure passwords are identical |
| "Server not reachable" | Backend down | Check if server is running |
| "Database error" | SQL error | Check table structure |

---

## Admin Dashboard Features

Once logged in as Admin:
- Register new cadets
- View all registered cadets
- Manage staff
- Generate reports
- Access control settings
- View statistics

---

**Last Updated:** January 2026
**Version:** 1.0
