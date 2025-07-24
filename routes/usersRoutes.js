const express = require('express');
const router = express.Router();
const { users, institutions } = require('../dbHandler');
const authenticateToken = require('../middleware/authMiddleware');

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


module.exports = router;