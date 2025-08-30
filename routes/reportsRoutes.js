const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { reports, reportImages, users, categories, reportVotes, institutions, statusHistories, forwardingLogs } = require('../dbHandler');

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
        //10 pont hozzáadása a felhasználóhoz
        await users.increment('points',
            {
                by: 10,
                where: { id: req.user.id }
            });
        const updatedUser = await users.findByPk(req.user.id, {
            attributes: ['id', 'points']
        });

        await Promise.all(imagePromises);
        // A válasz a frontendnek
        res.status(201).json({
            message: 'Report sikeresen létrehozva',
            reportId: newReport.id,
            images: req.files.map(f => `/uploads/${f.filename}`),
            newPoints: updatedUser.points
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
                attributes: ['username', 'avatarStyle', 'avatarSeed'],
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
            include: [
                { model: reportImages, attributes: ['imageUrl'] },
                { model: users, attributes: ['username', 'avatarStyle', 'avatarSeed'] },
                { model: categories, attributes: ['categoryName'] },
                { model: institutions, attributes: ['name'] },
                { model: reportVotes, attributes: ['voteType', 'userId'] }
            ],
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
                { model: users, attributes: ['username', 'avatarStyle', 'avatarSeed'] },
                { model: categories, attributes: ['categoryName'] },
                { model: institutions, attributes: ['name'] },
                { model: reportImages, attributes: ['imageUrl'] },
                { model: statusHistories, include: [{ model: users, as: 'setByUser', attributes: ['username'] }] }
            ],
            order: [['createdAt', 'DESC']]
        })
        res.json(assignedReports)

    } catch (error) {
        console.error("Hiba az intézményei bejelentkezések során", error)
        res.status(500).json({ message: "Szerverhiba az intézményi bejelentések lekérdezésekor" })
    }
})

//Bejelentkezett felhasználó bejelentéseinek száma
router.get('/userReportCount', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id
        const count = await reports.count({
            where: { userId }
        })
        res.json({ reportCount: count })

    } catch (error) {
        console.error("Hiba történt a felhasználó bejelentéseinek száma lekérdezésekor", error)
        res.status(500).json({ message: "Szerverhiba a felhasználó bejelentéseinek száma lekérdezésekor" })
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
            return res.status(403).json({ message: 'Nincs jogosultságod a státusz váltzáshoz.' })
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
                    attributes: ['username', 'avatarStyle', 'avatarSeed']
                }
            ],
            order: [['changedAt', 'ASC']]
        });

        const formatted = history.map(entry => ({
            status: entry.statusId,
            changedAt: entry.changedAt,
            changedBy: {
                username: entry.setByUser?.username || 'Ismeretlen',
                avatarStyle: entry.setByUser?.avatarStyle || null,
                avatarSeed: entry.setByUser?.avatarSeed || null
            },
            comment: entry.comment || null
        }));

        res.json(formatted);
    } catch (error) {
        console.error("Hiba a státusz történet lekérdezésénél:", error);
        res.status(500).json({ message: "Szerverhiba a státusz történet lekérdezésekor" });
    }
});
//Adott bejelentés továbbításainak lekérdezése
router.get("/:id/forwardLogs", authenticateToken, async (req, res) => {
    const { id } = req.params
    try {
        //Report ellenőrzés
        const report = await reports.findByPk(id);
        if (!report) {
            return res.status(404).json({ message: "Bejelentés nem található" });
        }

        //Jogosultság ellenőrzés
        if (req.user.role !== "admin") {
            if (req.user.role === "institution") {
                if (report.institutionId !== req.user.institutionId) {
                    return res.status(403).json({ message: "Nincs jogosultságod a logok megtekintésére." });
                }
            } else {
                return res.status(403).json({ message: "Nincs jogosultságod a logok megtekintésére." });
            }
        }
        //Lekérdezés a logokkal
        const logs = await forwardingLogs.findAll({
            where: { reportId: id },
            include: [
                { model: institutions, as: "forwardedFrom", attributes: ["id", "name"] },
                { model: institutions, as: "forwardedTo", attributes: ["id", "name"] },
                { model: users, as: "forwardedByUser", attributes: ["id", "username", "email"] }
            ],
            order: [["forwardedAt", "DESC"]]
        });

        res.json(logs);
    } catch (error) {
        console.error("Hiba történt a továbbítási logok lekérdezésénél", error)
        res.status(500).json({ message: "Szerverhiba a logok lekérdezése során." })
    }
})

//Adott bejelentés hozzárendelése más intézményhez Admin/Intézményi felhasználó
router.put("/forward/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { institutionId, categoryId, reason } = req.body;

    try {
        const report = await reports.findByPk(id);
        if (!report) {
            return res.status(404).json({ message: "Bejelentés nem található" });
        }

        // Jogosultság ellenőrzés
        if (req.user.role !== "admin") {
            if (req.user.role === "institution") {
                if (report.institutionId !== req.user.institutionId) {
                    return res.status(403).json({ message: "Nincs jogosultságod a bejelentés továbbítására." });
                }
            } else {
                return res.status(403).json({ message: "Nincs jogosultságod a bejelentés továbbítására." });
            }
        }

        if (!reason) {
            return res.status(409).json({ message: "Indok megadása kötelező!" });
        }

        // Forward log
        const fromInstitutionId = report.institutionId;

        // Report update
        report.institutionId = institutionId;
        report.categoryId = categoryId;
        await report.save();

        // Mentés a forwardingLogs-ba
        await forwardingLogs.create({
            reportId: report.id,
            forwardedFromId: fromInstitutionId,
            forwardedToId: institutionId,
            forwardedByUserId: req.user.id,
            reason: reason
        });

        res.json({ message: "Bejelentés sikeresen továbbítva." });

    } catch (error) {
        console.error("Hiba történt a bejelentés továbbítása során", error);
        res.status(500).json({ message: "Szerverhiba történt a bejelentés továbbítása során" });
    }
});

//Összes bejelentés státuszaiban töltött idejének megjelenítése
router.get("/status-duration/average", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.role !== "institution") {
            return res.status(403).json({ message: "Nincs jogosultságod." });
        }

        const histories = await statusHistories.findAll({
            order: [["reportId", "ASC"], ["changedAt", "ASC"]],
        });

        if (histories.length === 0) {
            return res.json({ message: "Nincs adat a statisztikához." });
        }

        const durations = {};
        const counts = {};

        for (let i = 0; i < histories.length; i++) {
            const current = histories[i];
            const next = histories[i + 1];

            // ha van következő ugyanahhoz a reporthoz, addig tart
            // ha nincs, akkor mostanáig számoljuk
            const endTime =
                next && next.reportId === current.reportId
                    ? new Date(next.changedAt)
                    : new Date();

            const startTime = new Date(current.changedAt);
            const durationMs = endTime - startTime;

            if (!durations[current.statusId]) {
                durations[current.statusId] = 0;
                counts[current.statusId] = 0;
            }

            durations[current.statusId] += durationMs;
            counts[current.statusId] += 1;
        }

        // Átlag számítás
        const averages = {};
        Object.keys(durations).forEach((statusId) => {
            const avgMs = durations[statusId] / counts[statusId];
            averages[statusId] = {
                avgMs,
                avgHours: (avgMs / (1000 * 60 * 60)).toFixed(2),
                avgDays: (avgMs / (1000 * 60 * 60 * 24)).toFixed(2),
            };
        });

        res.json(averages);
    } catch (error) {
        console.error("Hiba az átlag státusz idők számításánál:", error);
        res.status(500).json({ message: "Szerverhiba az átlag számításánál." });
    }
});

//Bejelentések státuszainak darabszáma
router.get("/stats", authenticateToken, async (req, res) => {
    try {
        // Jogosultság ellenőrzése
        if (req.user.role !== 'admin' && req.user.role !== "institution") {
            return res.status(403).json({ message: 'Nincs jogosultságod a státuszok mennyiségének megtekintéséhez.' });
        }
        const stats = await reports.count({
            group: "status"
        })
        res.json(stats)
    } catch (error) {
        console.error("Hiba történt a statok lekérdezése során.", error)
        res.status(500).json({ message: "Szerverhiba a statok lekérdezése során." })
    }
})

//Adott bejelentés státuszban töltött idejének megjelenítése  // Ez legyen mindig az utolsó vagy rosszul fut el!!!
router.get("/status-duration/:id", authenticateToken, async (req, res) => {
    try {
        //Jogosultság ellenőrzés, admin vagy instituton felhasználó
        if (req.user.role !== 'admin' && req.user.role !== 'institution') {
            return res.status(403).json({ message: "Nincs jogosultságod a státuszban töltött idő megtekintéséhez." })
        }
        const reportId = req.params.id
        const histories = await statusHistories.findAll({
            where: { reportId },
            order: [["changedAt", "ASC"]],
        })
        if (histories.length === 0) {
            return res.json({ message: "Nincs státuszváltás ehhez a reporthoz" })
        }
        const durations = []
        for (let i = 0; i < histories.length; i++) {
            const current = histories[i]
            const next = histories[i + 1]

            //Ha van következő státusz addig tart
            const endTime = next ? next.changedAt : new Date();
            const durationMs = new Date(endTime) - new Date(current.changedAt)

            durations.push({
                status: current.statusId,
                from: current.changedAt,
                to: endTime,
                durationMs,
                durationHours: (durationMs / (1000 * 60 * 60)).toFixed(2)
            })
        }
        res.json(durations)
    } catch {
        console.error("Hiba történt a státusz idők lekérdezésekor", error)
        res.status(500).json({ message: "Szerverhiba történt a státusz idők lekérdezésekor" })
    }
})


module.exports = router;
