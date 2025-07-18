const express = require('express');
const router = express.Router();
const { categories, institutions } = require('../dbHandler');

//Összes kategória lekérdezése
router.get('/list', async (req, res) => {
    try {
        const categoryList = await categories.findAll({
            attributes: ['id', 'categoryName', "createdAt", "updatedAt"],
            //Meghívom a hozzákapcsolt tábla adatait is a későbbi lekérdezéshez
            include: {
                model: institutions,
                attributes: ['id', "name", "email", "description", "contactInfo", "userId"]
            }
        })
        res.json(categoryList)
    } catch (error) {
        res.status(500).json({ message: 'Hiba a kategóriák lekérésekor' })
    }
})

router.post('/create', async (req, res) => {
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


module.exports = router;