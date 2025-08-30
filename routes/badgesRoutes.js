const express = require('express')
const router = express.Router()
const { badges, userBadges } = require('../dbHandler')
const authenticateToken = require('../middleware/authMiddleware');

//Összes létező jelvény lekérdezése  //Admin
router.get('/admin/all', authenticateToken, async (req, res) => {
    try {
        //Jogosultságellnőrzés
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Nincs jogosultságod az összes jelvény megtekintéséhez" })
        }
        const allBadges = await badges.findAll()

        const badgesWithCount = await Promise.all(
            allBadges.map(async (badge) => {
                const count = await userBadges.count({ where: { badgeId: badge.id } })
                return {
                    ...badge.toJSON(),
                    earnedCount: count
                }
            })
        )
        res.json(badgesWithCount)

    } catch (error) {
        console.error('Hiba történt az összes jelvények lekérdezése közben', error)
        res.status(500).json({ message: 'Szerverhiba történt az össszes jelvény lekérdezésekor' })
    }
})

//Összes jelenleg elérhető aktív jelvény lekérdezése
router.get('/all', async (req, res) => {
    try {
        const allBadges = await badges.findAll({
            where: { isActive: true }
        })

        const badgesWithCount = await Promise.all(
            allBadges.map(async (badge) => {
                const count = await userBadges.count({ where: { badgeId: badge.id } })
                return {
                    ...badge.toJSON(),
                    earnedCount: count
                }
            })
        )
        res.json(badgesWithCount)

    } catch (error) {
        console.error('Hiba történt a jelvények lekérdezése közben', error)
        res.status(500).json({ message: 'Szerverhiba történt a jelvények lekérdezésekor' })
    }
})

//Felhasználónál a jelvény státuszainak szerkesztése  //admin
router.put('/admin/:id/status', authenticateToken, async (req, res) => {
    try {
        const badgeId = req.params.id
        const { isActive } = req.body

        //Jogosultságellnőrzés
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Nincs jogosultságod a jelvények szerkesztéséhez" })
        }
        const badge = await badges.findByPk(badgeId)
        if (!badge) {
            return res.status(404).json({ message: "Jelvény nem található" })
        }

        badge.isActive = isActive
        await badge.save()
        res.json({ message: `Jelvény ${isActive ? "aktiválva" : "inaktiválva"}` })

    } catch (error) {
        console.error("Hiba történt a jelvény inaktiválásánál", error)
        res.status(500).json({ message: "Szerverhiba történt a jelvény inaktiválásánál" })
    }
})

//Adott jelvény végeleges törlése, akik megeszerezték azoktól is törlődik.
router.delete('/delete/:id', authenticateToken, async (req, res) => {
    try {
        //Jogosultságellnőrzés
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Nincs jogosultságod a jelvény törléséhez" })
        }
        const badge = await badges.findByPk(req.params.id)
        if (!badge) {
            return res.status(404).json({ message: "Jelvény nem található" })
        }

        await userBadges.destroy({ where: { badgeId: badge.id } })
        await badge.destroy()
        res.json({ message: 'Jelvény sikeresen törölve' })
    } catch (error) {
        console.error('Hiba történt a jelvény törlésekor', error)
        res.status(500).json({ message: 'Szerverhiba történt a jelvények törlésekor' })
    }
})

//Felhasználó megszerzett jelvényeinek lekérdezése
router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id
        const earnedBadges = await userBadges.findAll({
            where: {
                userId,
            },
            include: [badges]
        })
        res.json(earnedBadges)
    } catch (error) {
        console.error("Hiba történt a felhasználó jelvényeinek lekérdezésekor", error)
        res.status(500).json({ message: "Szerverhiba történt a jelvények lekérdezésekor" })
    }
})


module.exports = router;