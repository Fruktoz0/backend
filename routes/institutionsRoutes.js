const express = require("express")
const router = express.Router()
const { institutions, users } = require('../dbHandler');
const authenticateToken = require("../middleware/authMiddleware");


//Összes intézmény lekérdezése
router.get("/", async (req, res) => {
    try {
        const institutionsList = await institutions.findAll({

            //Meghívom a hozzákapcsolt tábla adatait is a későbbi lekérdezéshez
            include: {
                model: users,
                attributes: ['id', "username", "email",]
            }
        });
        res.json(institutionsList)

    } catch (err) {
        console.error("Hiba az intézmények lekérdezésekor:", err)
        res.status(500).json({ message: "Szerverhiba az intézmények lekérdezésekor" })
    }
})

//Intézmények lekérdezése ID alapján
router.get("/:id", async (req, res) => {
    try {
        const institution = await institutions.findByPk(req.params.id, {
            include: {
                model: users,
                attributes: ["id", "username", "email"]
            }
        });
        if (!institution)
            return res.status(404).json({ message: "Nem található ilyen intézmény" })
        res.json(institution)
    } catch (err) {
        console.error("Hiba az intézmény lekérdezésekor", err)
        res.status(500).json({ messeage: "Szerverhiba az intézmény lekérdezésekor" })
    }
})

//Új intézmény létrehozása
router.post("/create", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Nincs jogosultságod intézmény létrehozására" })
    }

    const { name, email, description, contactInfo } = req.body
    if (!name || !email || !description || !contactInfo)
        return res.status(400).json({ message: "Hiányzó adat." })
    try {
        const existingInstitution = await institutions.findOne({ where: { name } })
        if (existingInstitution)
            return res.status(409).json({ message: "Már létezik ilyen intézmény." })
        const newInstitution = await institutions.create({
            name,
            email,
            description,
            contactInfo
        })
        res.status(201).json(newInstitution)
    } catch (err) {
        console.error("Hiba az intézmény létrehozásakor", err)
        res.status(500).json({ message: "Szerverhiba az intézmény létrehozásakor." })
    }
})

//Intézmény módosítása
router.put("/update/:id", authenticateToken, async (req, res) => {

    const { id } = req.params
    const { name, email, description, contactInfo } = req.body
    try {
        const institution = await institutions.findByPk(req.params.id)
        if (!institution)
            return res.status(404).json({ message: "Intézmény nem található" })

        //Jogosultságellnőrzés
        if (req.user.role === "admin") {

        } else if (req.user.role === "institution") {
            const user = await users.findByPk(req.user.id)
            const userInstitutions = await user.getInstitutions({ attributes: ['id'] })
            const institutionIds = userInstitutions.map(i => i.id)

            if (!institutionIds.includes(institution.id)) {
                return res.status(403).json({ message: "Nincs jogosultságod más intézmény szerkesztésére." })
            }
        } else {
            return res.status(403).json({ message: "Nincs jogosultságod intézmény szerkesztésére" })
        }

            institution.name = name,
            institution.email = email,
            institution.description = description,
            institution.contactInfo = contactInfo,

            await institution.save()
        res.json(institution)

    } catch (err) {
        console.error("Hiba az intézmény módosításakor.", err)
        res.status(500).json({ message: "Szerverhiba az intézmény módosításakor" })
    }
})

//Intézmény törlése
router.delete("/delete/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Nincs jogosultságod intézmény törlésére" })
    }

    try {
        const institution = await institutions.findByPk(req.params.id)
        if (!institution)
            return res.status(404).json({ message: "Intézmény nem található" })
        await institution.destroy();
        res.json({ message: "Intézmény törölve" })
    } catch (err) {
        console.error("Hiba az intézmény törlésekor", err)
        res.status(500).json({ message: "Szerverhiba az intézmény törlésekor" })
    }
})

module.exports = router;