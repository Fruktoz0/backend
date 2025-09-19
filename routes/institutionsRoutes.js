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
        res.json(institutionsList).end()

    } catch (err) {
        console.error("Hiba az intézmények lekérdezésekor:", err)
        res.status(500).json({ message: "Szerverhiba az intézmények lekérdezésekor" }).end()
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
            return res.status(404).json({ message: "Nem található ilyen intézmény" }).end()
        res.json(institution)
    } catch (err) {
        console.error("Hiba az intézmény lekérdezésekor", err)
        res.status(500).json({ messeage: "Szerverhiba az intézmény lekérdezésekor" }).end()
    }
})


//Új intézmény létrehozása
router.post("/create", authenticateToken, async (req, res) => {
    if (test_y != '') { console.log(req.body) }
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Nincs jogosultságod intézmény létrehozására" }).end()
    }

    const { name, email, description, contactInfo, logoUrl } = req.body
    if (test_y != '') { console.log("Inst Name:", name) }
    if (!name || !email || !description || !contactInfo )
        return res.status(401).json({ message: "Hiányzó adat." })
    try {
        const existingInstitution = await institutions.findOne({ where: { name } })
        if (existingInstitution)
            return res.status(409).json({ message: "Már létezik ilyen intézmény." }).end()
        const newInstitution = await institutions.create({
            name,
            email,
            description,
            contactInfo,
            logoUrl
        })
        res.status(201).json(newInstitution)
    } catch (err) {
        console.error("Hiba az intézmény létrehozásakor", err)
        res.status(500).json({ message: "Szerverhiba az intézmény létrehozásakor." }).end()
    }
})


//Intézmény módosítása
router.put("/update/:id", authenticateToken, async (req, res) => {

    const { id } = req.params
    const { name, email, description, contactInfo, logoUrl } = req.body
    try {
        const institution = await institutions.findByPk(id)
        if (!institution)
            return res.status(404).json({ message: "Intézmény nem található" }).end()

        //Jogosultságellenőrzés
        const user = await users.findByPk(req.user.id)
        if (req.user.role !== "admin" && req.user.role !== "Institution" && user.institutionId !== institution.id) {
            console.log("403: ", user.role);
            return res.status(403).json({ message: "Nincs jogosultságod az intézmény szerkesztésére" }).end()
        }
        //Adatok frissítése
        institution.name = name
        institution.email = email
        institution.description = description
        institution.contactInfo = contactInfo
        institution.logoUrl = logoUrl
        await institution.save()
        res.status(200).json({ message: "Intézmény sikeresen frissítve", institution }).end()

    } catch (err) {
        console.error("Hiba az intézmény módosításakor.", err)
        res.status(500).json({ message: "Szerverhiba az intézmény módosításakor", error: err.message }).end()
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
            return res.status(404).json({ message: "Intézmény nem található" }).end()
        
        const inst_users = await users.findAll({ where: { institutionId: req.params.id } })
        if(!inst_users){ return res.status(403).json({ message: "Intézmény Használatban van!" }).end() }
        
        await institution.destroy();
        res.json({ message: "Intézmény törölve" })
    } catch (err) {
        console.error("Hiba az intézmény törlésekor", err)
        res.status(500).json({ message: "Szerverhiba az intézmény törlésekor" }).end()
    }
})


module.exports = router;
