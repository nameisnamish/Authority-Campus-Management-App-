# 🛡️ AUTHORITY - Campus Management System

**Authority** is a premium, next-generation Campus Management System designed for **RV University**. Built with React Native and Expo, it provides a seamless, integrated experience for both faculty and students to manage academic life, attendance, and campus navigation.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-green.svg)
![Expo](https://img.shields.io/badge/Expo-~54.0.34-lightgrey.svg)

---

## 🚀 Key Features

### 👨‍🏫 For Teachers
- **Dynamic Dashboard**: Real-time overview of schedules and tasks.
- **Attendance Management**: Effortlessly mark and track student attendance by subject.
- **Classroom Scanning**: Smart check-in via QR/Barcode for classroom sessions.
- **AI Assistant**: Integrated intelligent assistant to help with academic queries and scheduling.
- **Analytics Dashboard**: Comprehensive data visualization of student performance and attendance trends.
- **Scheduling Hub**: Complete control over daily and weekly academic schedules.

### 🎓 For Students
- **Smart Attendance Tracking**: View attendance records across all subjects.
- **Face Enrollment**: Biometric face enrollment for secure and automated attendance.
- **Campus Hub**: Access to library check-ins and academic records.
- **Personal Profile**: Detailed academic profile management.

---

## 🛠️ Technology Stack

- **Framework**: React Native with Expo (SDK 54)
- **Navigation**: React Navigation (Native Stack & Bottom Tabs)
- **State Management**: React Context API
- **Styling**: Vanilla React Native StyleSheet with a custom Theme Engine
- **Storage**: AsyncStorage & MMKV for high-performance caching
- **Icons**: Expo Vector Icons (Ionicons, MaterialCommunityIcons)
- **Networking**: Axios for API communication
- **Visualization**: React Native Chart Kit

---

## 💻 Installation Guide (Windows)

Follow these steps to set up the development environment on your Windows machine.

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js** (LTS version recommended)
- **Git** (Download from [git-scm.com](https://git-scm.com/))
- **Java Development Kit (JDK 17)** (Required for Android development)

### 2. Install Expo CLI
Open your terminal (PowerShell or Command Prompt) and run:
```bash
npm install -g expo-cli
```

### 3. Clone the Repository
```bash
git clone https://github.com/nameisnamish/Authority-Campus-Management-App-.git
cd Authority
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Setup Android Studio (For Emulator)
1. Download and install [Android Studio](https://developer.android.com/studio).
2. During installation, ensure **Android SDK**, **Android SDK Platform**, and **Android Virtual Device** are selected.
3. Open Android Studio -> **Settings** -> **Languages & Frameworks** -> **Android SDK**.
4. In the **SDK Tools** tab, ensure **Android SDK Build-Tools**, **Android Emulator**, and **Android SDK Platform-Tools** are installed.
5. Set up Environment Variables:
   - Create a new System Variable `ANDROID_HOME` with the path to your SDK (usually `C:\Users\YourUser\AppData\Local\Android\Sdk`).
   - Add `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\emulator` to your system `Path`.
6. Create an Emulator:
   - Open **Device Manager** in Android Studio.
   - Click **Create Device**, select a modern phone (e.g., Pixel 6), and download a recommended system image (e.g., API 34).

### 6. Environment Configuration
Create a `.env` file in the root directory and add your backend API details:
```env
API_BASE_URL=https://your-api-endpoint.com
# Add other keys as needed
```

### 7. Run the Application
1. Start your Android Emulator.
2. Run the following command:
```bash
npx expo start --android
```
3. The app will build and launch on your emulator.

---

## 📂 Project Structure

```text
Authority/
├── assets/             # Images, fonts, and splash screens
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # Auth and Data Contexts
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Constants and data schemas
│   ├── screens/        # All application screens
│   ├── services/       # API and authentication services
│   ├── theme/          # Design system (colors, typography)
│   └── utils/          # Helper functions and normalizers
├── App.js              # Application entry point
├── app.json            # Expo configuration
└── package.json        # Dependencies and scripts
```

---

## 📝 License
This project is proprietary and built for **RV University**.

Developed by **Namish M S**
