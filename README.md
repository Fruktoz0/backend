# Tiszta Város – Mobilalkalmazás

🚀 **Tiszta Város** egy nyílt forráskódú közösségi hibabejelentő és közösségépítő mobilalkalmazás, amely lehetővé teszi a városlakók számára, hogy jelentsék a közterületi problémákat (kátyúk, sérült padok, közvilágítás hibák stb.), és az önkormányzatok / intézmények ezeket kezelni tudják.  

Az alkalmazás **React Native + Expo + Firebase** alapokon fut, és kapcsolódik a [Tiszta Város backendhez](https://github.com/Fruktoz0/backend).  

![Logo](assets/images/tisztavaros_logo.png)

---

## 📱 Funkciók

- **Bejelentések**
  - Új hibabejelentés fotóval, helyszínnel
  - Saját bejelentések nyomon követése
  - Intézményi riportok külön listában

- **Hírek és közlemények**
  - Intézmények híreinek megjelenítése
  - Részletes hírnézet

- **Kihívások és jelvények**
  - Közösségi kihívások teljesítése
  - Badge-ek gyűjtése

- **Felhasználói profil**
  - Regisztráció, bejelentkezés (JWT + Google login)
  - Profiladatok szerkesztése
  - Értesítések kezelése (push notification)

- **Push értesítések**
  - Firebase Cloud Messaging integráció
  - Realtime értesítések státuszváltásról és új hírekről

---

## 🛠 Tech Stack

- **Frontend**: React Native (Expo, EAS)
- **Backend**: Node.js + Express + MySQL (külön repo: [backend](https://github.com/Fruktoz0/backend))
- **State management**: React Hooks, Context
- **Auth**: JWT, AsyncStorage, Google Sign-In
- **Push notification**: Firebase Cloud Messaging
- **Styling**: React Native Paper, custom assets
- **Deployment**: Expo EAS Build (Android APK)

---

## 📂 Projektstruktúra

```
mobile-master/
 ┣ android/            # Android build és Gradle fájlok
 ┣ assets/             # Ikonok, logók, splash screen
 ┣ src/
 ┃ ┣ config/           # API és Map config
 ┃ ┣ hooks/            # Egyedi React hookok (auth, notifications)
 ┃ ┣ navigation/       # Navigációs logika
 ┃ ┣ screens/          # Képernyők (auth, reports, challenges, profil stb.)
 ┃ ┣ services/         # API-hívások és kliens logika
 ┃ ┣ utils/            # Helper függvények
 ┣ App.js              # Belépési pont
 ┣ app.json            # Expo beállítások
 ┣ package.json        # Függőségek
 ┗ eas.json            # Expo EAS build konfiguráció
```

---

## ⚡ Telepítés

### 1. Klónozd a repót

```bash
git clone https://github.com/Fruktoz0/mobile.git
cd mobile
```

### 2. Függőségek telepítése

```bash
npm install
```

### 3. Környezeti változók

Hozz létre egy `.env` fájlt:

```
EXPO_PUBLIC_API_URL=http://<backend-ip>:3000
EXPO_PUBLIC_MAPTILER_KEY=xxxxxx
```

### 4. Futatás fejlesztői módban

```bash
npx expo start
```

### 5. Android build EAS-sel

```bash
eas build -p android --profile production
```

---

## 📸 Képernyőképek

👉 Ide érdemes betenni pár screenshotot az `assets/images/` mappából vagy friss buildből:  
- Login képernyő  
- Hibabejelentés képernyő  
- Hírek részletei  
- Profil oldal  

---

## 🔮 Tervek

- [ ] IOS támogatás  
- [ ] Offline mód (cache-elt bejelentések)  
- [ ] Statisztikai dashboard a felhasználónak  
- [ ] Többnyelvűség (EN/HU)  

---

## 👨‍💻 Fejlesztők

Készítette: **Bacsa József** és csapata  
Backend repo: [Fruktoz0/backend](https://github.com/Fruktoz0/backend)  
