![Tiszta Város logó](tisztavaros_logo.png)

# Tiszta Város – Backend

## A projekt célja
A Tiszta Város egy olyan alkalmazás, amelynek célja, hogy a lakosság és az önkormányzati intézmények együttműködésével tisztábbá tegye a várost. A rendszer lehetővé teszi a felhasználóknak, hogy mobilalkalmazáson vagy weben keresztül bejelentsék a városban tapasztalt problémákat (például illegális hulladéklerakás, graffiti, kátyú stb.). A bejelentéseket a háttérrendszer továbbítja az illetékes városi szerveknek, nyomon követi azok státuszát, és visszajelzést ad a bejelentőknek. Emellett a rendszer gamifikációs elemeket (kihívások, pontok, jelvények) is tartalmaz, hogy ösztönözze a lakosokat az aktív részvételre és a közösség motiválását szolgálja.

## Funkcionalitások
A Tiszta Város backendje egy **REST API**, amely a következő főbb szolgáltatásokat nyújtja:

- **Felhasználókezelés és autentikáció**
- **Bejelentés-kezelés**
- **Visszajelzések (szavazatok, megerősítések)**
- **Kategóriák és intézmények kezelése**
- **Hírközlés (városi hírek)**
- **Gamifikáció (kihívások és jelvények)**
- **Értesítések**
- **Összefoglaló statisztikák**

## Telepítés (lokális fejlesztői környezet)
**Előfeltételek:**
- Node.js (LTS)
- MySQL adatbázis
- npm

**Lépések:**
```bash
git clone https://github.com/Fruktoz0/backend.git tisztavaros-backend
cd tisztavaros-backend
npm install
```

**Környezeti változók beállítása:**
A konfigurációhoz hozz létre egy .env fájlt a projekt gyökerében. A .env fájl tartalmazza az érzékeny adatokat és beállításokat (adatbázis csatlakozáshoz adatok, JWT titok, külső API kulcsok, stb.). Készíts egy másolatot a példából, és töltsd ki a saját adataiddal:

PORT=3000
DB_HOST=localhost
DB_NAME=tisztavaros_db       # A MySQL adatbázis neve
DB_USER=tisztavaros_user     # MySQL felhasználó
DB_PASS=eros_jelszo          # MySQL jelszó
JWT_SECRET=valami_hosszú_random_szöveg  # JWT tokenek aláírásához
EXPIRE_TIME=1h               # JWT lejárati idő (pl. 1h, 24h, 7d)
TRY_MAX=5                    # Maximális belépési próbálkozások (rate limit)
MAILJET_API_KEY=***          # Mailjet API kulcs (aktivációs email küldéshez)
MAILJET_API_SECRET=***       # Mailjet API titok
MAILJET_SENDER_EMAIL=no-reply@tisztavaros.hu  # Aktivációs email feladó címe
MAILJET_SENDER_NAME=Tiszta Város          # Feladó neve az emaileken
FIREBASE_PROJECT_ID=***      # Firebase projekt azonosító (értesítésekhez)
FIREBASE_PRIVATE_KEY_ID=***  # Firebase privát kulcs azonosítója
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n***\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=***    # Firebase kliens email (service account)
FIREBASE_CLIENT_ID=***       # Firebase kliens azonosító
TEST_Y=1                     # Teszt mód engedélyezése (1 vagy üres). Teszt módban egyes    műveletek (pl. törlés) véglegesek.


**Adatbázis inicializálás:**
```sql
CREATE DATABASE tisztavaros_db CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci;
```

**Szerver indítás:**
```bash
npm start
```

## Adatbázis felépítés
- **users**: felhasználók, szerepkörök, pontok, intézménykapcsolat
- **institutions**: intézmények adatai
- **categories**: bejelentés kategóriák
- **reports**: bejelentések státusszal és képekkel
- **votes / confirmations**: szavazatok, megerősítések
- **challenges / userChallenges**: kihívások és részvétel
- **badges / userBadges**: jelvények
- **institutionNews**: hírek

## API végpontok
- **Auth**: regisztráció, e-mail verifikáció, login, user adat, admin user létrehozás/törlés
- **Users**: listázás, keresés, módosítás, avatar váltás, push token
- **Reports**: bejelentés létrehozása, státusz, képek, továbbítás, megerősítés, statisztikák
- **Votes**: szavazás logika
- **Categories**: kategóriák listázása, létrehozása, módosítása, törlése
- **Institutions**: intézmények CRUD
- **News**: hírek CRUD
- **Challenges**: kihívások CRUD, feloldás, beküldés, elbírálás
- **Badges**: jelvények listázása, állapot, törlés

## Fejlesztői workflow
- Branch kezelés (feature/bugfix branch-ek)
- Pull Request és code review folyamat
- Commit üzenet konvenciók
- Tesztelés (Jest, Supertest)
- CI/CD pipeline
- Deployment GitHub Actions-szel (main branch -> VPS deploy)

## Deployment workflow
A repó GitHub Actions segítségével van bekötve automatikus szerverre telepítéshez.  
Minden push a `main` branch-re triggereli a buildet és a Docker-compose újraindítást a VPS-en.


