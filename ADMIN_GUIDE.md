# Admin Panel Guide

## 🔐 Admin Login

### Access the Admin Panel

1. **Navigate to Login Page**: [http://localhost:5173/login](http://localhost:5173/login)

2. **Enter Credentials**:
   - Email: `admin@example.com`
   - Password: `password`

3. **OTP Verification**:
   - Click "Sign in"
   - OTP will be sent to the configured admin email
   - Check your email for the 6-digit OTP code
   - Enter the OTP and click "Verify OTP"

4. **Access Admin Dashboard**: After successful login, you'll be redirected to [http://localhost:5173/admin](http://localhost:5173/admin)

---

## 📊 Admin Dashboard Features

### Overview Tab
- **Quick Stats**: View total projects, skills, certificates
- **Quick Actions**: Direct links to manage different content types
- **Recent Content**: Preview of your latest projects

### Hero Section Tab
- Edit the main portfolio title
- Update the subtitle/description
- Changes are saved to local state (integrate with backend as needed)

### About Tab
- Edit your "About Me" description
- Update biographical information

### Content Tab
- Manage contact information (email, phone, location)

### Settings Tab
- Configure dark mode
- Email notifications
- Analytics tracking

---

## ✏️ Managing Portfolio Content

### Projects
1. Navigate to [http://localhost:5173/projects](http://localhost:5173/projects)
2. When logged in, you'll see "Add Project" button
3. Click to add new projects with:
   - Title
   - Description
   - Technologies used
   - GitHub/Live links
   - Image upload (via Cloudinary)

### Skills
1. Go to [http://localhost:5173/skills](http://localhost:5173/skills)
2. Add/Edit/Delete skills
3. Categorize by proficiency level
4. Add icons or badges

### Certificates
1. Visit [http://localhost:5173/certificates](http://localhost:5173/certificates)
2. Add certification details
3. Upload certificate images
4. Add credential links

### Hackathons
1. Go to [http://localhost:5173/hackathons](http://localhost:5173/hackathons)
2. Document your hackathon participation
3. Add achievements and awards

---

## 🔄 Backend Integration

All content is automatically synced with your backend:
- **API Base**: `http://127.0.0.1:8005`
- **Authentication**: JWT tokens stored in localStorage
- **Database**: MongoDB Atlas

### Available Endpoints
- `GET/POST/PUT/DELETE /content/projects`
- `GET/POST/PUT/DELETE /content/skills`
- `GET/POST/PUT/DELETE /content/certificates`
- `GET/POST/PUT/DELETE /content/hackathons`

---

## 🚪 Logout

Click the "Logout" button in the admin sidebar to:
- Clear authentication tokens
- Redirect to login page
- Secure your admin session

---

## 🛡️ Security Notes

- **OTP Authentication**: Two-factor authentication via email OTP
- **Session Management**: Tokens expire after period of inactivity
- **Protected Routes**: Admin routes require valid authentication
- **CORS Enabled**: Only localhost:5173/5174 allowed

---

## 🔧 Troubleshooting

**Can't access /admin directly?**
- You'll be automatically redirected to `/login?redirect=/admin`
- Complete login flow to access admin panel

**OTP not received?**
- Check your email spam folder
- Verify Brevo API configuration in backend
- Check backend logs for email service errors

**Changes not saving?**
- Verify backend is running on port 8005
- Check browser console for API errors
- Ensure valid authentication token exists

**Session expired?**
- Log out and log back in
- Clear localStorage if issues persist
- Check backend token expiration settings

---

## 📝 Quick Reference

| Page | URL | Purpose |
|------|-----|---------|
| Login | `/login` | Admin authentication |
| Dashboard | `/admin` | Admin overview & settings |
| Projects | `/projects` | Manage project portfolio |
| Skills | `/skills` | Manage skill listings |
| Certificates | `/certificates` | Manage certifications |
| Hackathons | `/hackathons` | Document hackathon participation |
| Contact | `/contact` | View contact form submissions |

---

## 🎯 Next Steps

1. ✅ Login with admin credentials
2. ✅ Access admin dashboard
3. ✅ Add your first project
4. ✅ Customize hero section
5. ✅ Update about information
6. ✅ Add skills and certificates
7. ✅ Test content editing workflow

**Your admin panel is ready to use!** 🚀
