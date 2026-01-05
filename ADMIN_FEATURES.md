# 🎯 Portfolio Admin Features - Complete Guide

## 🔐 How to Login

### Step 1: Access Login Page
Navigate to: **http://localhost:5173/login**

### Step 2: Enter Credentials
- **Email**: `admin@example.com`
- **Password**: `password`
- Click "Sign in"

### Step 3: Verify OTP
- Check your email for the 6-digit OTP code
- Enter the OTP in the verification form
- Click "Verify OTP"

### Step 4: Success!
You'll be redirected to the homepage (or `/admin` if you came from there).

---

## ✏️ Edit Buttons Location

### On the Modern Homepage (http://localhost:5173/)

When logged in, you'll see **Edit buttons** (✏️ icon) next to:

1. **Skills & Expertise** heading
   - Click to manage skills at `/skills`
   
2. **Featured Projects** heading
   - Click to manage projects at `/projects`

3. **Navigation Bar** (top right)
   - **⚙️ Settings icon** → Goes to Admin Dashboard
   - **🚪 Logout icon** → Sign out

### Content Management Pages

After logging in, visit these pages to add/edit content:

| Page | URL | What You Can Edit |
|------|-----|-------------------|
| **Projects** | `/projects` | Add/Edit/Delete project portfolio items |
| **Skills** | `/skills` | Add/Edit/Delete skills and expertise |
| **Certificates** | `/certificates` | Add/Edit/Delete certifications |
| **Hackathons** | `/hackathons` | Add/Edit/Delete hackathon participation |
| **About** | `/about` | Edit your about information |
| **Contact** | `/contact` | View contact form submissions |

---

## 📱 What You'll See When Logged In

### On Homepage (/)
- **Admin Login button** changes to **Settings ⚙️** and **Logout 🚪** buttons
- **Edit icons (✏️)** appear next to section headings
- Navigation includes **Hackathons** link

### On Content Pages (/projects, /skills, etc.)
- **"➕ Add [Content]" button** at the top
- **Edit (✏️)** and **Delete (🗑️)** buttons on each card
- Full CRUD (Create, Read, Update, Delete) functionality

### On Admin Dashboard (/admin)
- **Overview statistics** (project count, skills count, etc.)
- **Quick Actions** to jump to different content pages
- **Recent Content** preview
- **Sidebar navigation** for different admin sections

---

## 🎨 Available Admin Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/login` | Admin login with OTP | No |
| `/admin` | Admin dashboard overview | Yes ✅ |
| `/projects` | Manage projects (has edit buttons when logged in) | Partial* |
| `/skills` | Manage skills | Partial* |
| `/certificates` | Manage certificates | Partial* |
| `/hackathons` | Manage hackathons | Partial* |
| `/about` | Edit about section | Partial* |
| `/contact` | View messages | Partial* |

*Partial = Page visible to everyone, but edit/add buttons only show when logged in

---

## 🚀 Quick Edit Workflow

### Adding New Content

1. **Login** at `/login`
2. Click **Navigation → Hackathons** (or Projects/Skills)
3. Click **"➕ Add [Content]"** button
4. Fill in the form:
   - Title
   - Description
   - Date/Technologies/etc.
   - Upload image (optional)
5. Click **Save**
6. Content appears immediately!

### Editing Existing Content

1. **Login** at `/login`
2. Navigate to content page (`/projects`, `/skills`, etc.)
3. Find the card you want to edit
4. Click **✏️ Edit** button on the card
5. Update the information
6. Click **Save**

### Deleting Content

1. **Login** at `/login`
2. Navigate to content page
3. Click **🗑️ Delete** button on the card
4. Confirm deletion
5. Content removed immediately!

---

## 📂 Content Sections Available

### ✅ Already Have Edit Functionality

1. **Projects** - Full CRUD
   - Title, description, technologies
   - GitHub/live links
   - Image upload via Cloudinary

2. **Skills** - Full CRUD
   - Skill name, level, icon
   - Category grouping

3. **Certificates** - Full CRUD
   - Certificate name, issuer
   - Date, credential link
   - Image upload

4. **Hackathons** - Full CRUD ✨
   - Hackathon name, description
   - Date, achievement, role
   - Link, image upload

5. **About** - Edit functionality
   - Personal information
   - Biography

6. **Contact** - View submissions
   - Read messages from contact form

---

## 🔒 Authentication Features

✅ **OTP-based login** (Email verification)  
✅ **JWT token** authentication  
✅ **Session persistence** (stays logged in)  
✅ **Auto-redirect** to login when accessing protected routes  
✅ **Logout functionality** clears session  
✅ **Backend auth check** on page load  

---

## 🎯 Hackathons Section - NEW!

### How to Access
1. Click **"Hackathons"** in the main navigation
2. Or visit: **http://localhost:5173/hackathons**

### What You Can Add
- **Title**: Name of the hackathon
- **Description**: What you built/participated in
- **Date**: When it happened
- **Achievement**: Awards/recognition (e.g., "🏆 1st Place Winner")
- **Role**: Your role in the team
- **Link**: Project demo/GitHub link
- **Image**: Upload hackathon photo/project screenshot

### Special Features
- **Achievement badge** displays prominently with 🏆 icon
- **Image upload** via Cloudinary
- **Edit/Delete buttons** when logged in
- Integrated with backend API

---

## 🛠️ Troubleshooting

### "I don't see edit buttons"
✅ Make sure you're logged in (check for Settings/Logout icons in nav)  
✅ Visit `/login` and complete the OTP verification  
✅ Refresh the page after logging in  

### "Edit buttons don't work"
✅ Check if backend is running on port 8005  
✅ Open browser console (F12) to check for errors  
✅ Verify authentication token exists (localStorage)  

### "Can't access /admin"
✅ You must be logged in first  
✅ System will auto-redirect you to `/login?redirect=/admin`  
✅ Complete login flow, then you'll reach admin dashboard  

### "Changes don't save"
✅ Ensure backend server is running  
✅ Check MongoDB connection status  
✅ Look for error messages in browser console  

---

## 📋 Admin Checklist

- [x] Login functionality with OTP
- [x] Admin dashboard at `/admin`
- [x] Edit buttons on homepage (Skills & Projects)
- [x] Login/Logout buttons in navigation
- [x] Projects CRUD operations
- [x] Skills CRUD operations
- [x] Certificates CRUD operations
- [x] Hackathons CRUD operations ✨ NEW!
- [x] About editing
- [x] Contact form viewing
- [x] Image uploads via Cloudinary
- [x] Backend integration (MongoDB)
- [x] Protected routes with auto-redirect

---

## 🎉 You're All Set!

Your portfolio now has full admin functionality:
- **Login** with OTP authentication
- **Edit** all content sections
- **Add** new projects, skills, certificates, hackathons
- **Delete** unwanted content
- **Manage** everything from one dashboard

**Start managing your portfolio at: http://localhost:5173/login** 🚀
