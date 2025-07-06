const express = require('express');
const router = express.Router();
const multer = require('multer');
// A multer beállítása: ide mentjük a feltöltött fájlokat az uploads mappába
const upload = multer({ dest: 'uploads/' });
// Az autentikáció middleware – ez olvassa ki a JWT-t a headerből, és req.user-be teszi a user adatokat
const authenticateToken = require('../middleware/authMiddleware');
// Sequelize modellek importja
const { reports, reportImages } = require('../dbHandler');

// POST /api/reports végpont: új bejelentés létrehozása képfeltöltéssel
router.post('/sendReport', authenticateToken, upload.array("images", 3), async (req, res) => {
    try {
        const { title, description, categoryId, locationLat, locationLng } = req.body;

        // Ellenőrizzük, hogy van-e legalább 1 kép
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Legalább 1 kép feltöltése kötelező.' });
        }
        // Új report létrehozása az adatbázisban
        const newReport = await reports.create({
            userId: req.user.id,              // authenticate middleware-ből
            title,
            description,
            categoryId,
            locationLat,
            locationLng,
            status: 'open',
            imageUrl: '',                     // Nem használjuk, mert több kép van
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

module.exports = router;
