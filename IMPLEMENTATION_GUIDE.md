# CadetSphere - Role-Based Access Control Implementation Guide

## 📋 Database Schema

Run these SQL queries in your `cadetsphere` MySQL database:

```sql
-- Consolidated Users Table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'Cadet', 'Staff') DEFAULT 'Cadet',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cadet Details Table (for admin cadet registration)
CREATE TABLE cadet_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  full_name VARCHAR(100) NOT NULL,
  rank VARCHAR(50),
  squad VARCHAR(50),
  batch_year INT,
  phone VARCHAR(15),
  enrollment_number VARCHAR(50) UNIQUE,
  date_of_birth DATE,
  address TEXT,
  registered_by_admin INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (registered_by_admin) REFERENCES users(id)
);

-- Staff Details Table
CREATE TABLE staff_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  full_name VARCHAR(100),
  designation VARCHAR(100),
  department VARCHAR(100),
  contact VARCHAR(15),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🔑 Key Features Implemented

### 1. **Role-Based Authentication**
- Users login with email, password, and role selection
- Login routes to role-specific dashboards
- Role information stored in AsyncStorage for persistence

### 2. **Admin Dashboard** (`admin-dashboard.js`)
✅ **Features:**
- Admin profile display
- Total cadets count
- Quick action to register new cadets
- View recently registered cadets
- Admin functions menu (Access Control, Schedules, Reports, Notifications)
- Logout functionality

✅ **Main Action:** Register New Cadet
- Click "Register New Cadet" button to open modal form
- Fill all required fields
- System automatically creates user account with temporary password
- Cadet details saved in `cadet_details` table
- Temporary password: `Cadet@{enrollmentNumber}`

### 3. **Cadet Dashboard** (`cadet-dashboard.js`)
✅ **Features:**
- Cadet profile with details from database
- Statistics: Attendance, Tasks, Badges, Rating
- My Activities section
- Performance metrics with visual bars
- Upcoming events/schedule
- Quick action buttons (Message Instructor, Leave Request, etc.)

### 4. **Staff Dashboard** (`staff-dashboard.js`)
✅ **Features:**
- Staff profile
- Manage cadets statistics
- Quick action buttons
- List of cadets they manage
- Today's schedule
- Recent reports

---

## 🛠️ New Files Created

| File | Purpose |
|------|---------|
| `components/cadet-register-form.tsx` | Registration form modal for adding new cadets |
| `app/admin-dashboard.js` | Admin-only dashboard |
| `app/cadet-dashboard.js` | Cadet-only dashboard |
| `app/staff-dashboard.js` | Staff-only dashboard |

---

## 📲 Backend Endpoints Added

### **1. Register Cadet (Admin Only)**
```
POST /api/auth/register-cadet
```
**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "enrollmentNumber": "ENR-001",
  "rank": "Cadet",
  "squad": "A Squadron",
  "batchYear": 2024,
  "dob": "2005-06-15",
  "address": "123 Main St",
  "registeredByAdmin": 1
}
```

**Response:**
```json
{
  "message": "Cadet registered successfully",
  "cadet": {
    "id": 5,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Cadet",
    "defaultPassword": "Cadet@ENR-001",
    "note": "Share this temporary password with the cadet. They must change it on first login."
  }
}
```

### **2. Get Cadet Details**
```
GET /api/auth/cadet/:id
```
Returns full cadet profile including details from `cadet_details` table.

### **3. Get All Cadets (Admin)**
```
GET /api/auth/cadets/all
```
Returns list of all registered cadets with their details.

---

## 🎯 User Flow

### **Admin Login Flow:**
```
Login Page (Select "Admin")
    ↓
Enter credentials
    ↓
Admin Dashboard
    ├── View cadet list
    ├── Register new cadet (Form Modal)
    ├── Manage staff
    ├── View reports
    └── Logout → Back to Login
```

### **Cadet Registration Flow (Admin):**
```
Admin Dashboard
    ↓
Click "Register New Cadet"
    ↓
Fill Cadet Form
    - Full Name (required)
    - Email (required)
    - Phone (required)
    - Enrollment Number (required)
    - Rank (optional)
    - Squad (optional)
    - Batch Year (optional)
    - DOB (optional)
    - Address (optional)
    ↓
Submit → Create User Account + Save Cadet Details
    ↓
Show Success Alert with Temporary Password
    ↓
Cadet List Updates
```

### **Cadet Login Flow:**
```
Login Page (Select "Cadet")
    ↓
Enter credentials (using admin-provided email)
    ↓
Cadet Dashboard
    ├── View profile with details
    ├── Check attendance
    ├── View tasks
    ├── View badges
    ├── Check upcoming events
    └── Logout → Back to Login
```

### **Staff Login Flow:**
```
Login Page (Select "Staff")
    ↓
Enter credentials
    ↓
Staff Dashboard
    ├── Manage cadets
    ├── Mark attendance
    ├── View schedule
    ├── Create reports
    └── Logout → Back to Login
```

---

## 🔐 Default Password for New Cadets

When admin registers a cadet with enrollment number "ENR-001", the system generates:
- **Username:** cadet_email@example.com
- **Temporary Password:** Cadet@ENR-001

The cadet should change this password on first login.

---

## 📝 Implementation Checklist

- [x] Database schema with users and cadet_details tables
- [x] Admin dashboard with cadet management
- [x] Cadet registration form component
- [x] Backend endpoints for cadet registration
- [x] Role-based routing after login
- [x] Cadet dashboard with profile data
- [x] Staff dashboard
- [x] Logout functionality
- [x] AsyncStorage for session management

---

## 🚀 How to Use

### **Step 1: Update Database**
Run the SQL schema queries provided above.

### **Step 2: Update Login Route (Already Done)**
The login.js has been updated to:
- Route to admin-dashboard for Admin role
- Route to cadet-dashboard for Cadet role
- Route to staff-dashboard for Staff role

### **Step 3: Test Admin Registration**
1. Login as Admin
2. Click "Register New Cadet"
3. Fill the form and submit
4. Check cadet_details table to verify data

### **Step 4: Test Cadet Login**
1. Login as the newly registered cadet
2. Verify cadet dashboard displays their information
3. Check that profile data matches registered details

---

## 📧 Email Structure

When displaying names or usernames, the system uses:
- **Admin:** admin email prefix (e.g., "admin@example.com" → "admin")
- **Cadet:** first part of email (e.g., "john.doe@example.com" → "john")
- **Staff:** staff email prefix

---

## 🔄 Database Queries Reference

### Get all cadets registered by an admin:
```sql
SELECT * FROM cadet_details WHERE registered_by_admin = 1;
```

### Get cadet with user details:
```sql
SELECT u.*, cd.enrollment_number, cd.rank, cd.squad 
FROM users u 
LEFT JOIN cadet_details cd ON u.id = cd.user_id 
WHERE u.id = ? AND u.role = 'Cadet';
```

### Get staff managing cadets:
```sql
SELECT * FROM staff_details WHERE department = 'Training';
```

---

## ✅ Verification Steps

After implementation, verify:

1. **Admin can register cadets** → Check cadet_details table
2. **Cadet receives temporary password** → Alert shows password
3. **Cadet can login with new account** → Routes to cadet-dashboard
4. **Cadet profile displays correctly** → Shows enrolled details
5. **Staff has separate dashboard** → Different UI from cadet
6. **Logout works for all roles** → Returns to login page
7. **AsyncStorage persists user** → App remembers login session

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Email already exists" error | Registration email must be unique |
| Cadet details not showing | Ensure cadet_details has matching user_id |
| Wrong dashboard loads | Check AsyncStorage user.role is set correctly |
| Password reset needed | Use forgot password page (already implemented) |

---

## 📞 Support

For issues with:
- **Database:** Check MySQL connection in db.js
- **Routes:** Verify all endpoints in authRoutes.js
- **UI:** Check component imports in dashboards
- **AsyncStorage:** Verify React Native AsyncStorage is imported

---

**Last Updated:** January 2026
**Version:** 1.0
