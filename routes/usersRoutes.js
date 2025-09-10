const express = require('express');
const router = express.Router();
const { users, institutions } = require('../dbHandler');
const authenticateToken = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

const test_y = process.env.TEST_Y;
const { Op } = require('sequelize');


// Admin / Felhasználók adatainak listázása
router.get('/admin/users', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Nincs jogosultság!' });
        }
        const allUsers = await users.findAll({
            attributes: ['id', 'username', 'email', 'isActive', 'role', 'institutionId', 'points', 'createdAt', 'updatedAt']
        });
        res.status(200).json(allUsers);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Hiba történt a jogosultság ellenőrzése során.' });
    }
})


// Admin_FP / Felhasználók db számának listázása
router.get('/admin/user_db', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Nincs jogosultság!' });
        }
        const a_db = await users.findAll()
        res.status(200).json({ found_db: a_db.length });
        if (test_y != '') { console.log("\nFound_db:", a_db.length)};
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Hiba történt a jogosultság ellenőrzése során.' });
    }
})


// Admin_FP / Felhasználók adatainak listázása Usernév/Email cím töredék alapján
router.post('/admin/user_en', authenticateToken, async (req, res) => {
    console.log("\nGet USer Name/Email:", '%' + req.body.name + '%', '%' + req.body.email + '%')
    var allUser = []
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Nincs jogosultság!' });
        }
        allUser = await users.findAll({
            where: { username: { [Op.like]: '%' + req.body.name + '%' }, email: { [Op.like]: '%' + req.body.email + '%' } },
            attributes: ['id', 'username', 'email', 'points', 'role', 'isActive', 'createdAt', 'updatedAt', 'zipCode', 'city', 'address', 'institutionId']
        });
        return res.status(200).json(allUser);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Hiba történt a jogosultság ellenőrzése során.' });
    }
})


// Admin_FP / Foglalt Felhasználói UserName és Email ellenőrzés
router.post('/admin/user_chk', authenticateToken, async (req, res) => {
    if (test_y != '') { console.log("\nGet User Name/Email:", '"' + req.body.username + '"', '"' + req.body.email + '"') }
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Nincs jogosultság!' });
        }
        foundUserName = await users.findOne({
            where: { username: req.body.username },
        });
        foundUserEmail = await users.findOne({
            where: { email: req.body.email },
        });
        msg = foundUserName == null ? "0" : "1"
        msg += foundUserEmail == null ? "0" : "1"
        console.log(msg)
        return res.status(200).json({ message: msg });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Hiba történt a jogosultság ellenőrzése során.' });
    }
})


// Admin / Felhasználó szerepkörének és active/inactive/archived beállítás szerkesztése
router.put('/admin/user/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Nincs jogosultságod hozzá" })
    }

    const userId = req.params.id
    const { role, isActive } = req.body
    if (test_y != '') { console.log("Role, Status: ", role, isActive) }

    const validRoles = ["user", "admin", "worker", "inspector", "institution"]
    const validStatuses = ["active", "inactive", "archived"]

    if (role && !validRoles.includes(role)) {
        return res.status(400).json({ message: "Érvénytelen szerepkör" })
    }

    if (isActive && !validStatuses.includes(isActive)) {
        return res.status(400).json({ message: "Érvénytelen státusz." })
    }
    try {
        const user = await users.findByPk(userId)
        if (!user) {
            return res.status(404).json({ message: "Felhasználó nem található" })
        }
        if (role) user.role = role
        if (isActive) user.isActive = isActive

        await user.save()
        return res.status(200).json({ message: "Felhasználó sikeresen frissítve", user })
    } catch (error) {
        console.error("Hiba a felhasználó frissítésekor", error)
        res.status(500).json({ message: "Szerverhiba a felhasználó frissítésekor" })
    }
})


//ADMIN / Felhasználók kapcsolása intézményekhez
router.put('/admin/user/:id/institution', authenticateToken, async (req, res) => {
    try {
        if (req.body === undefined) {
            return res.status(400).json({ message: "Érvénytelen institution ID található a kérésben." })
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Nincs jogosultságod hozzá" })
        }        

        const userId = req.params.id
        if (test_y != '') { console.log("User.ID: ", userId) }

        const  user = await users.findByPk(userId)
        if (! user) {
            return res.status(404).json({ message: 'Felhasználó nem található' })
        }

        const { institutionId } = req.body 
    // Leválasztás engedése az intézményről
        if (institutionId === null || institutionId === "") {
            await user.update({ institutionId: null });
            return res.status(201).json({ message: "Intézmény leválasztva a felhasználóról." });
        }

        if (test_y != '') { console.log("Sel. Inst.ID: ", institutionId) }        
        const institution = await institutions.findByPk(institutionId)
        if (test_y != '') { console.log("Institution: ", institution) }
        if (!institution) {
            return res.status(400).json({ message: "Érvénytelen institution ID található a kérésben." })
        }

        //user.institutionId = institutionId;
        //await user.save();

        await user.update({ institutionId })
        return res.status(200).json({ message: "Intézmény sikeresen frisítve a felhasználóhoz." })

    } catch (error) {
        console.error("Hiba az intézmények adatainak lekérdezések.", error)
        return res.status(500).json({ message: "Szerverhiba az intézmények lekérdezésekor" })
    }
})


//Avatar csere
router.post('/users/changeAvatar', authenticateToken, async (req, res) => {
    // Dicebear stílusok listája
    const dicebearStyles = [
        "adventurer",
        "adventurer-neutral",
        "avataaars",
        "avataaars-neutral",
        "big-ears",
        "big-ears-neutral",
        "big-smile",
        "bottts",
        "croodles",
        "croodles-neutral",
        "fun-emoji",
        "icons",
        "identicon",
        "initials",
        "lorelei",
        "lorelei-neutral",
        "notionists",
        "micah",
        "miniavs",
        "open-peeps",
        "personas",
        "pixel-art",
        "pixel-art-neutral"
    ];

    try {
        const user = await users.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Felhasználó nem található.' });
        }
        const today = new Date().toDateString();
        const lastChange = user.lastAvatarChangeDate ? new Date(user.lastAvatarChangeDate).toDateString() : null;

        if (today !== lastChange) {
            user.avatarChangesToday = 0;
            user.lastAvatarChangeDate = new Date();
        }

        if (user.avatarChangesToday >= 5) {
            return res.status(400).json({ message: 'Már elhasználtad a napi 5 avatar cserédet.' });
        }

        //Ellnőrzöm a felhasználónak van-e elég pontja a vásárláshoz
        if (user.points < 50) {
            return res.status(400).json({ message: 'Nincs elég pontod az avatar cseréjéhez' });
        }

        //Ha van elég pontja, pontlevonás
        user.points -= 50;
        //új random style + seed beállítása avatarnak
        const randomStyle = dicebearStyles[Math.floor(Math.random() * dicebearStyles.length)];
        const randomSeed = uuidv4();

        user.avatarStyle = randomStyle;
        user.avatarSeed = randomSeed;
        user.avatarChangesToday += 1;

        await user.save();

        const avatarUrl = `https://api.dicebear.com/9.x/${randomStyle}/svg?seed=${randomSeed}`;
        res.status(200).json({
            message: 'Avatar sikeresen frissítve.', avatarStyle: randomStyle,
            avatarSeed: randomSeed,
            avatarUrl,
            points: user.points,
            avatarChangesToday: user.avatarChangesToday
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hiba az avatar frissítésekor.' });
    }
})


//Felhasználó saját adataink szerkesztése
router.put('/users/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.id
        if (test_y != '') { console.log("User.ID: ", userId) }

        if (req.user.id !== userId && req.user.role !== "admin") {
            return res.status(403).json({ message: "Nincs jogosultságod a felhasználó adatainak frissítéséhez." });
        }

        const userRecord = await users.findByPk(userId)
        if (!userRecord) {
            return res.status(404).json({ message: "Felhasználó nem található." });
        }

        const { username, zipCode, city, address } = req.body;
        userRecord.username = username ?? userRecord.username;
        userRecord.zipCode = zipCode ?? userRecord.zipCode;
        userRecord.city = city ?? userRecord.city;
        userRecord.address = address ?? userRecord.address;

        await userRecord.save();
        res.status(200).json({ message: "Felhasználó adatai sikeresen frissítve.", user: userRecord });
    } catch (error) {
        console.error("Hiba a felhasználó adatainak frissítésekor", error);
        res.status(500).json({ message: "Szerverhiba a felhasználó adatainak frissítésekor", error: error.message });
    }
})


//Admin_FP Felhasználó összes adatának frissítése
router.put('/admin/user_all', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.id
        if (test_y != '') { console.log("User.ID: ", req.body.id) }

        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Nincs jogosultságod a felhasználó összes adatának a frissítéséhez." });
        }

        const userRecord = await users.findByPk(req.body.id)
        if (!userRecord) {
            return res.status(404).json({ message: "Felhasználó nem található." });
        }

        const { id, username, email, zipCode, city, address, isActive, role, institutionId } = req.body;
        userRecord.username = username;
        userRecord.email = email;
        userRecord.zipCode = zipCode;
        userRecord.city = city;
        userRecord.address = address;
        userRecord.isActive = isActive;
        userRecord.role = role;
        userRecord.institutionId = institutionId;

        await userRecord.save();
        res.status(200).json({ message: "Felhasználó adatai sikeresen frissítve.", user: userRecord });
    } catch (error) {
        console.error("Hiba a felhasználó adatainak frissítésekor", error);
        res.status(500).json({ message: "Szerverhiba a felhasználó adatainak frissítésekor", error: error.message });
    }
})


module.exports = router;
