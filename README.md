# 💸 MoneyFlow

MoneyFlow is a sleek, premium, and **vibe-coded** personal expense manager app. Built with React Native and Expo, it provides a beautiful interface with local SQLite database storage for mobile and localStorage fallback for web, allowing you to seamlessly track your expenses, manage custom categories, and set budgets.

---

## 🎨 Features & Design Philosophy

MoneyFlow was built with the **vibe-coding** philosophy: focusing on clean aesthetics, smooth interactions, and a delightful user experience.
* **Smart Seeding & Migrations:** Default categories like Food, Transport, Shopping, Utilities, Mobile, and Wifi/Internet are automatically seeded.
* **Flexible Budgets:** Track and copy budgets month-over-month.
* **Cross-Platform:** Works on Android, iOS, and Web out of the box.
* **Data Privacy:** All data remains locally on your device in a SQLite database (or localStorage on Web).

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18 or v20 recommended)
* [Expo CLI](https://docs.expo.dev/get-started/installation/)
* Android Studio (for Android emulator) or Xcode (for iOS simulator) if testing native builds.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Balajijagan2000/personal-expense-tracker-app.git
   cd expense-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Running Locally

You can run the app locally using the following scripts:

* **Web Preview:**
  ```bash
  npm run web
  ```
  *Runs the app in your local browser using React Native Web.*

* **Start Expo Go Server:**
  ```bash
  npm run start
  ```
  *Opens the Expo developer tool, letting you scan a QR code to run the app on your physical device via the Expo Go app.*

* **Run on Android Emulator:**
  ```bash
  npm run android
  ```

* **Run on iOS Simulator:**
  ```bash
  npm run ios
  ```

---

## 🤖 Build & Deploy (EAS)

The project uses Expo Application Services (EAS) for cloud builds.

* **Android Preview Build (APK):**
  ```bash
  npm run build:android
  ```
* **Android Production Build:**
  ```bash
  npm run build:android-prod
  ```
* **iOS Production Build:**
  ```bash
  npm run build:ios-prod
  ```

---

## 📦 How to Download the APK from GitHub Actions

This project runs an automated CI pipeline on GitHub Actions that builds and compiles the Android Release APK on every push to the `master` branch.

To download the latest build artifact (APK):

1. Navigate to the GitHub repository:  
   👉 **[GitHub Repo](https://github.com/Balajijagan2000/personal-expense-tracker-app)**
2. Click on the **Actions** tab at the top of the page.
3. In the left sidebar under workflows, click on **Build Android Release APK** (or just look at the list of workflow runs).
4. Click on the most recent completed run (marked with a green checkmark check).
5. Scroll down to the very bottom of the run details page to the **Artifacts** section.
6. Click on the **`app-release-apk`** download link.
7. This downloads a `.zip` archive. Extract/unzip it to get the **`app-release.apk`** file.
8. Transfer the `.apk` file to your Android device and install it (make sure you allow installing from unknown sources in your Android security settings).

---

## 🛠️ Technology Stack

* **Framework:** React Native & Expo (v56.0.0)
* **Icons:** Feather (via `@expo/vector-icons`)
* **Local Database:** `expo-sqlite` (Mobile) / `localStorage` (Web)
* **Language:** TypeScript
* **Data Export:** Excel (`xlsx`)
