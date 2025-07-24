const express = require('express');
const router = express.Router();
const { categories, institutions } = require('../dbHandler');
const authenticateToken = require('../middleware/authMiddleware');

//Összes kategória lekérdezése
router.get('/list', async (req, res) => {
    try {
        const categoryList = await categories.findAll({
            attributes: ['id', 'categoryName', "createdAt", "updatedAt"],
            //Meghívom a hozzákapcsolt tábla adatait is a későbbi lekérdezéshez
            include: {
                model: institutions,
                as: 'institution',
                attributes: ['id', "name", "email", "description", "contactInfo", "userId"],
                through: { attributes: [] }
            }
        })
        res.json(categoryList)
    } catch (error) {
        res.status(500).json({ message: 'Hiba a kategóriák lekérésekor' })
    }
})

router.post('/create', authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Nincs jogosultságod kategória létrehozására." })
    }
    const { categoryName, defaultInstitutionId } = req.body
    if (!categoryName || !defaultInstitutionId) {
        return res.status(400).json({ message: "Hiányzó mezők: 'categoryName' vagy 'defaultInstitutionId'" })
    }
    try {
        //Megnézem létezik-e már ilyen kategória
        const existingCategory = await categories.findOne({
            where: { categoryName }
        })
        //Ha igen akkor hibát dobok
        if (existingCategory) {
            return res.status(409).json({ message: "Már létezik ilyen nevű kategória." })
        }
        //Ha nincs ilyen nevű akkor létrehozom
        const newCategory = await categories.create({
            categoryName,
            defaultInstitutionId
        })
        res.status(201).json(newCategory)

    } catch (error) {
        console.error("Hiba a kategoria létrehozásokar:", error)
        res.status(500).json({ message: "Hiba az új kategória létrehozásakor!" })
    }
})

//Kategória törlése
router.delete("/delete/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Nincs jogosultságod kategória törlésére." })
    }
    try {
        const category = await categories.findByPk(req.params.id)
        console.log("Törlésre érkezett kérés:", req.params.id);
        if (!category)
            return res.status(404).json({ message: "Kategória nem található" })

        await category.destroy();
        res.json({ message: "Kategória törölve" })
    } catch (err) {
        console.error("Hiba az kategória törlésekor", err)
        res.status(500).json({ message: "Szerverhiba az kategória törlésekor" })
    }
})


module.exports = router;