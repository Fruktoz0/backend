const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { reports, reportImages, users, categories, reportVotes, institutions } = require('../dbHandler');

// Multer storage beállítás kiterjesztéssel
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); // eredeti fájl kiterjesztése
        cb(null, Date.now() + ext); // pl.: 1689087900000.jpg
    },
});

const upload = multer({ storage }); // storage használata itt

const authenticateToken = require('../middleware/authMiddleware'); // Az autentikáció middleware – ez olvassa ki a JWT-t a headerből, és req.user-be teszi a user adatokat


// Új bejelentés létrehozása képfeltöltéssel
router.post('/sendReport', authenticateToken, upload.array("images", 3), async (req, res) => {
    try {
        const { title, description, categoryId, address, zipCode, city, locationLat, locationLng } = req.body;

        //Kategória lekérése
        const cat = await categories.findByPk(categoryId)
        if(!cat){
            return res.status(400).json({message: "Érvénytelen kategória"})
        }
        const institutionId = cat.defaultInstitutionId

        // Ellenőrizzük, hogy van-e legalább 1 kép
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Legalább 1 kép feltöltése kötelező.' });
        }
        // Új report létrehozása az adatbázisban
        const newReport = await reports.create({
            userId: req.user.id, // authenticate middleware-ből
            title,
            description,
            categoryId,
            institutionId,
            address,
            zipCode,
            city,
            locationLat,
            locationLng,
            status: 'open',
        });
        // A képek mentése a report_images táblába
        const imagePromises = req.files.map(file =>
            reportImages.create({
                reportId: newReport.id,
                imageUrl: `/uploads/${file.filename}`, // a fájl relatív URL-je
            })
        );
        await Promise.all(imagePromises);
        // A válasz a frontendnek
        res.status(201).json({
            message: 'Report sikeresen létrehozva',
            reportId: newReport.id,
            images: req.files.map(f => `/uploads/${f.filename}`)
        });
    } catch (error) {
        console.error('Hiba a report létrehozásakor:', error);
        res.status(500).json({ message: 'Szerverhiba a report mentésekor' });
    }
});

//Összes reports lekérdezése
router.get('/getAllReports', async (req, res) => {
    try {
        const allReports = await reports.findAll({
            include: [{
                model: reportImages,
                attributes: ['imageUrl']
            },
            {
                model: users,
                attributes: ['username'],
            },
            {
                model: categories,
                attributes: ['categoryName'],
            },
            {
                model: reportVotes,
                attributes: ['voteType', 'userId']
            },
            {
                model: institutions,
                attributes: ['name']
            }
            ],
            order: [['createdAt', 'DESC']], // Legutóbb létrehozott jelentések előre
        });

        res.status(200).json(allReports);
    } catch (error) {
        console.error('Hiba a bejelentések lekérésekor:', error);
        res.status(500).json({ message: 'Szerverhiba a bejelentések lekérésekor' });
    }
});

//Bejelentkezett felhasználó reportjainak lekérdezése
router.get('/userReports', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id
        const userReports = await reports.findAll({
            where: { userId },
            include: [{
                model: categories,
                attributes: ['categoryName']
            }],
            order: [['createdAt', 'DESC']]

        })
        res.json(userReports)
    } catch (error) {
        console.error("Hiba a felhasználó bejelentések lekérdezésekor", error)
        res.status(500).json({ message: "Szerverhiba a felhasználó bejelentéseinek lekérdezésekor" })
    }
})

module.exports = router;
