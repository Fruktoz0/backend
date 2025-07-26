const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { reports, reportImages, users, categories, reportVotes, institutions, statusHistories } = require('../dbHandler');

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
        if (!cat) {
            return res.status(400).json({ message: "Érvénytelen kategória" })
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

//Adott intézményhez tartozó bejelentések lekérdezése
router.get('/assignedReports', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'institution') {
            return res.status(403).json({ message: 'Csak intézményi felhasználó kérheti le.' })
        }
        const user = await users.findByPk(req.user.id)

        const assignedReports = await reports.findAll({
            where: { institutionId: user.institutionId },
            include: [
                { model: users, attributes: ['username'] },
                { model: categories, attributes: ['categoryName'] },
                { model: institutions, attributes: ['name'] },
                { model: reportImages, attributes: ['imageUrl'] }
            ],
            order: [['createdAt', 'DESC']]
        })
        res.json(assignedReports)

    } catch (error) {
        console.error("Hiba az intézményei bejelentkezések során", error)
        res.status(500).json({ message: "Szerverhiba az intézményi bejelentések lekérdezésekor" })
    }
})

//Report státusz váltás (admin vagy saját intézmény)
router.post('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { statusId, comment } = req.body
        const report = await reports.findByPk(req.params.id)
        if (!report)
            return res.status(404).json({ message: 'Bejelentés nem található' })
        //Jogosultság ellenőrzése
        if (req.user.role !== 'admin' && req.user.institutionId !== report.institutionId) {
            return res.status(403).json({ message: 'Nincs jogosultságod a log megtekintéséhez.' })
        }
        //Komment megadása, kivéve open-> in_progressnél
        if (!(report.status === 'open' && statusId === 'in_progress') && !comment) {
            return res.status(400).json({ message: 'Komment megadása kötelező ennél a státusz váltásnál!' })
        }
        report.status = statusId
        await report.save()

        await statusHistories.create({
            reportId: report.id,
            statusId,
            setByUserId: req.user.id,
            comment: comment || null,
            changedAt: new Date()
        })
        res.json({ message: 'Státusz frissítve' })

    } catch (error) {
        console.error("Hiba történt a státuszváltáskor", error)
        return res.status(500).json({ message: "Szerverhiba történt státuszváltáskor" })
    }
})

// Státusz történet lekérdezése
router.get('/:id/status-history', authenticateToken, async (req, res) => {
    try {
        const report = await reports.findByPk(req.params.id);
        if (!report)
            return res.status(404).json({ message: 'Bejelentés nem található' });

        // Jogosultság ellenőrzése
        if (req.user.role !== 'admin' && req.user.institutionId !== report.institutionId) {
            return res.status(403).json({ message: 'Nincs jogosultságod a státusz történet megtekintéséhez.' });
        }

        const history = await statusHistories.findAll({
            where: { reportId: report.id },
            include: [
                {
                    model: users,
                    as: 'setByUser',
                    attributes: ['username']
                }
            ],
            order: [['changedAt', 'ASC']]
        });

        const formatted = history.map(entry => ({
            status: entry.statusId,
            changedAt: entry.changedAt,
            changedBy: entry.setByUser?.username || 'Ismeretlen',
            comment: entry.comment || null
        }));

        res.json(formatted);
    } catch (error) {
        console.error("Hiba a státusz történet lekérdezésénél:", error);
        res.status(500).json({ message: "Szerverhiba a státusz történet lekérdezésekor" });
    }
});


module.exports = router;
