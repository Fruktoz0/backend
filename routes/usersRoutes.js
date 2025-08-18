const express = require('express');
const router = express.Router();
const { users, institutions } = require('../dbHandler');
const authenticateToken = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

// Admin / Felhasználók adatainak listázása
router.get('/admin/users', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Nincs jogosultság!' });
        }
        const allUsers = await users.findAll({
            attributes: ['id', 'username', 'email', 'points', 'role', 'isActive', 'createdAt', 'updatedAt']
        });
        res.status(200).json(allUsers);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Hiba történt a jogosultság ellenőrzése során.' });
    }
})

// Admin / Felhasználó adatainak szerkesztése
router.put('/admin/user/:id', authenticateToken, async (req, res) => {
    const userId = req.params.id
    const { role, isActive } = req.body

    const validRoles = ["user", "admin", "worker", "compliance", "institution"]
    const validStatuses = ["active", "inactive"]

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
router.put('/admin/user/:id/institutions', authenticateToken, async (req, res) => {
    const userId = req.params.id
    const { institutionIds } = req.body
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Nincs jogosultságod hozzá" })
    }
    try {
        const user = await users.findByPk(userId)
        if (!user) {
            return res.status(404).json({ message: 'Felhasználó nem található' })
        }
        const validInstitutions = await institutions.findAll({
            where: { id: institutionIds }
        })

        if (validInstitutions.length !== institutionIds.length) {
            return res.status(400).json({ message: "Érvénytelen institution ID található a kérésben." })
        }
        await user.setInstitutions(institutionIds)
        const updated = await user.getInstitutions();

        return res.status(200).json({ message: "Intézmények sikeresen frisítve a felhasználóhoz." })

    } catch (error) {
        console.error("Hiba az intézmények adatainak lekérdezések.", error)
        return res.status(500).json({ message: "Szerverhiba az intézmények lekérdezésekor" })
    }
})

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

        await user.save();

        const avatarUrl = `https://api.dicebear.com/9.x/${randomStyle}/svg?seed=${randomSeed}`;
        res.status(200).json({
            message: 'Avatar sikeresen frissítve.', avatarStyle: randomStyle,
            avatarSeed: randomSeed,
            avatarUrl,
            points: user.points
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hiba az avatar frissítésekor.' });
    }
})


module.exports = router;