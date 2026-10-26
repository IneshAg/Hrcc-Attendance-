# HackerRank Campus Crew - Meeting Attendance & Member Management

A cross-platform Club Meeting Attendance & Member Management Web & Mobile App for **HackerRank Campus Crew (HRCC)**, built with **React Native + Expo SDK 52** and backed by **Supabase PostgreSQL**.

---

## 🚀 Features

* **Complete SRM Student Credentials**:
  * Name, Reg.No (RA No), SRM Email, Personal Email
  * Pursuing Branch, College Department, Year, Section
  * Faculty Advisor (FA) Name & FA Email
  * LinkedIn & GitHub profile links
* **Crew Structure & Domains**:
  * 💻 **Technical Domain** (Tech Head, Tech Leads, Developers)
  * 🎨 **Creatives Domain** (Creative Head, Creative Leads, Designers)
  * 🤝 **Corporate Domain** (Corporate Head, Corporate Leads)
  * 🏛️ **Executive / Core** (Vice Presidents, Secretary, Joint Secretary)
* **1-Tap Roll Call for Meetings**:
  * 🟢 **Present (P)**, 🔴 **Absent (A)**, 🟡 **Late (L)**, ⚪ **Excused (E)**
  * Real-time turnout percentage & interactive counters
  * Bulk actions: `All Present`, `All Absent`, `Clear`
  * Add remarks/notes per student (e.g. "Lab exam till 5 PM")
* **Full File Export & Sharing**:
  * 📊 **Export as CSV** (Excel / Google Sheets compatible with all student details)
  * 📄 **Export as Text File** (formatted report)
  * 📋 **Copy to Clipboard** (ready for WhatsApp / Slack)
  * 👥 **Export Full Members Roster as CSV**

---

## ⚡ Deployment to Vercel

### Option 1: Automatic Deploy via GitHub (Recommended)
1. Push this repository to GitHub:
   ```bash
   git remote add origin https://github.com/IneshAg/Hrcc-Attendance-.git
   git branch -M main
   git push -u origin main
   ```
2. Go to **[vercel.com/new](https://vercel.com/new)**.
3. Import the repository **`IneshAg/Hrcc-Attendance-`**.
4. The build settings are pre-configured in `vercel.json`:
   * **Build Command**: `npx expo export -p web` (or `npm run build`)
   * **Output Directory**: `dist`
5. Click **Deploy**. Vercel will build and give you a live HTTPS web URL (e.g., `https://hrcc-attendance.vercel.app`) that everyone in the crew can use from their phones or laptops!

---

## 💻 Local Development

Navigate into the project directory:
```bash
cd club-attendance-app
npm install
```

* **Run on Web Browser**:
  ```bash
  npm run web
  ```
* **Run on Mobile (iOS / Android with Expo Go)**:
  ```bash
  npm start
  ```
