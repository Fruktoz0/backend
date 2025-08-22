const express = require('express')
const router = express.Router()
const { challenges, userChallenges, users, institutions } = require('../dbHandler')
const authenticateToken = require('../middleware/authMiddleware')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

//Multer conf a képfeltöltéshez
const uploadDir = path.join(__dirname, '..', 'uploads', 'challenges');

// ha nincs meg a könyvtár, hozzuk létre
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Csak képek engedélyezettek!'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 7 // 7MB
    }
});


//Kihívás létrehozása admin/intézményi felhasználónak
router.post('/create', authenticateToken, (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ message: "Hibás képfeltöltés." });
        }

        try {
            const { title, description, category, costPoints, rewardPoints, startDate, endDate, institutionId } = req.body;

            // Jogosultság ellenőrzés
            if (req.user.role !== 'admin' && req.user.role !== 'institution') {
                return res.status(403).json({ message: "Nincs jogosultsága a kihívás létrehozásához." });
            }

            // Kép ellenőrzés
            if (!req.file) {
                return res.status(400).json({ message: "Kép feltöltése kötelező." });
            }

            // Összes mező kitöltésének ellenőrzése
            if (!title || !description || !category || !costPoints || !rewardPoints || !startDate || !endDate) {
                return res.status(400).json({ message: "Minden mező kitöltése kötelező." });
            }

            // Start és End dátum ellenőrzése ne legyen ütközés
            if (new Date(endDate) < new Date(startDate)) {
                return res.status(400).json({ message: "A kihívás befejezési dátuma nem lehet korábbi, mint a kezdési dátum." });
            }

            // Dátumok ellenőrzése active/inactive/archived
            let status = 'active';
            if (new Date(startDate) > new Date()) {
                status = 'inactive';
            } else if (new Date(endDate) < new Date()) {
                status = 'archived';
            }

            // InstitutionId logika
            let finalInstitutionId = null;
            if (req.user.role === 'institution') {
                finalInstitutionId = req.user.institutionId;
            } else if (req.user.role === 'admin') {
                finalInstitutionId = institutionId || null;
            }

            const createChallenge = await challenges.create({
                title,
                description,
                category,
                costPoints,
                rewardPoints,
                startDate,
                endDate,
                status,
                image: `/uploads/challenges/${req.file.filename}`, // kép útvonala
                institutionId: finalInstitutionId
            });

            res.status(201).json(createChallenge);

        } catch (error) {
            console.error("Hiba a kihívás létrehozásakor:", error);
            res.status(500).json({ message: "Szerverhiba a kihívás létrehozásakor." });
        }
    });
});

// Összes aktív challenges lekérése
router.get('/active', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id
        const activeChallengesList = await challenges.findAll({
            where: {
                status: 'active'
            },
            include: [
                {
                    model: userChallenges,
                    where: { userId},
                    required: false,
                    attributes: ['status']
                }
            ]
        })

        const formatted = activeChallengesList.map(challenge => ({
            ...challenge.toJSON(),
            isUnlocked: challenge.userChallenges && challenge.userChallenges.length > 0
                && challenge.userChallenges[0].status === 'unlocked'
        }));

        res.json(formatted);
 
    } catch (err) {
        console.error("Hiba az aktív kihívások lekérésekor:", err)
        res.status(500).json({ message: "Szerverhiba az aktív kihívások lekérésekor." })
    }
})

// Összes inaktív challenges lekérése
router.get('/inactive', authenticateToken, async (req, res) => {
    try {
        //Csak admin/ intézményi felhasználó láthatja
        if (req.user.role !== 'admin' && req.user.role !== 'institution') {
            return res.status(403).json({ message: "Nincs jogosultsága az inaktív kihívások megtekintéséhez." })
        }
        const inactiveChallengesList = await challenges.findAll({
            where: {
                status: 'inactive'
            }
        })
        res.json(inactiveChallengesList)
    } catch (error) {
        console.error("Hiba az inaktív kihívások lekérésekor:", error)
        res.status(500).json({ message: "Szerverhiba az inaktív kihívások lekérésekor." })
    }
})

// Összes archivált challenges lekérése
router.get('/archived', authenticateToken, async (req, res) => {
    try {

        //Csak admin/ intézményi felhasználó láthatja
        if (req.user.role !== 'admin' && req.user.role !== 'institution') {
            return res.status(403).json({ message: "Nincs jogosultsága az archivált kihívások megtekintéséhez." })
        }
        const archivedChallengesList = await challenges.findAll({
            where: {
                status: 'archived'
            }
        })
        res.json(archivedChallengesList)
    } catch (err) {
        console.error("Hiba az archivált kihívások lekérésekor:", err)
        res.status(500).json({ message: "Szerverhiba az archív kihívások lekérdezésekor" })
    }
})

// Felhasználó saját kihívásainak lekérése
router.get('/myChallenges', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id
        const myChallengesList = await userChallenges.findAll({
            where: {
                userId: userId
            },
            include: [
                {
                    model: challenges
                }
            ],
            order: [['unlockDate', 'DESC']]
        })
        res.json(myChallengesList)
    } catch (err) {
        console.error("Hiba a felhasználó saját kihívásainak lekérésekor:", err)
        res.status(500).json({ message: "Szerverhiba a felhasználó saját kihívásainak lekérésekor." })
    }
})

// Kihívás feloldása 
router.post('/:id/unlock', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id
        const challengeId = req.params.id

        //Felhasználó lekérése
        const user = await users.findByPk(userId)
        if (!user) {
            return res.status(404).json({ message: "Felhasználó nem található." })
        }

        //Kihívás lekérése
        const challenge = await challenges.findByPk(challengeId)
        if (!challenge || challenge.status !== 'active') {
            return res.status(404).json({ message: "Kihívás nem található vagy már feloldva." })
        }
        //Pontszám lekérése/ellenőrzése
        if (user.points < challenge.costPoints) {
            return res.status(400).json({ message: "Nincs elegendő pont a kihívás feloldásához." })
        }
        //Ellőrzés nem-e lejárt kihívást próbál unlockolni
        if (new Date(challenge.endDate) < new Date()) {
            return res.status(400).json({ message: "Ez a kihívás már lejárt." });
        }
        //Nem unlockolta-e már 
        const existingUserChallenge = await userChallenges.findOne({
            where: {
                userId: userId,
                challengeId: challengeId
            }
        })
        if (existingUserChallenge) {
            return res.status(400).json({ message: "Ezt a kihívást már feloldottad." })
        }
        //Pont levonás feoldás végett
        user.points -= challenge.costPoints
        await user.save()
        //Új kihívás feloldása
        const unlocked = await userChallenges.create({
            userId,
            challengeId,
            unlockDate: new Date(),
            status: 'unlocked',
            pointsEarned: 0,
        })

        res.json({
            message: "Kihívás sikeresen feloldva.",
            userChallenge: unlocked,
            currentPoints: user.points
        })

    } catch (err) {
        console.error("Hiba a kihívás feloldásakor:", err)
        res.status(500).json({ message: "Szerverhiba a kihívás feloldásakor." })
    }
})

// Kihívás teljesítésének beküldése felhasználó által
router.post('/:id/submit', authenticateToken, upload.array('images', 3), async (req, res) => {
    try {
        const userId = req.user.id;
        const challengeId = req.params.id;

        // UserChallenge lekérése
        const userChallenge = await userChallenges.findOne({ where: { userId, challengeId } });
        if (!userChallenge) {
            return res.status(400).json({ message: "Előbb fel kell oldanod a kihívást." });
        }
        if (userChallenge.status !== 'unlocked') {
            return res.status(400).json({ message: "Ezt a kihívást már beküldted vagy lezárult." });
        }

        const { description } = req.body;
        // Ellenörzés kitöltötte-e a description-t
        if (!description) {
            return res.status(400).json({ message: "A leírás megadása kötelező" });
        }

        // Ellenőrzés, hogy van-e feltöltött fájl
        const files = req.files || [];

        // Adatok mentése
        userChallenge.description = description || null;
        userChallenge.image1 = files[0] ? `/uploads/challenges/${files[0].filename}` : null;
        userChallenge.image2 = files[1] ? `/uploads/challenges/${files[1].filename}` : null;
        userChallenge.image3 = files[2] ? `/uploads/challenges/${files[2].filename}` : null;
        userChallenge.status = 'pending';
        userChallenge.submittedAt = new Date();

        await userChallenge.save();

        res.json({
            message: "Kihívás teljesítés beküldve, admin ellenőrzésre vár.",
            userChallenge
        });
    } catch (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: "A fájl mérete túl nagy (max. 7MB)." });
        }
        console.error("Hiba a kihívás teljesítésének küldésekor:", err);
        res.status(500).json({ message: "Szerverhiba a kihívás teljesítésének küldésekor." });
    }
});

// Kihívás jóváhagyása, elutasítása
router.put('/:userChallengeId/approve', authenticateToken, async (req, res) => {
    try {
        //Jogosultságellenőrzés
        if (!req.user.role !== 'admin' && req.user.role !== 'institution') {
            return res.status(403).json({ message: "Nincs jogosultságod a művelet végrehajtásához." });
        }
        const { decision } = req.body; //Elfogadva vagy elutasítva
        const { userChallengeId } = req.params

        //Lekérjük a userChallenge adatokat
        const userChallenge = await userChallenges.findByPk(userChallengeId, {
            include: [
                { model: challenges },
                { model: users }
            ]
        })
        if (!userChallenge) {
            return res.status(404).json({ message: "Ez a kihívás nem található" })
        }
        if (userChallenge.status !== 'pending') {
            return res.status(400).json({ message: "Ez a kihívás már el lett bírálva." })
        }
        //Ellenörzés kihívás lejárt-e
        if (new Date(userChallenge.challenge.endDate) < new Date()) {
            return res.status(400).json({ message: "Ez a kihívás már lejárt, nem bírálható el." });
        }
        if (decision === 'approved') {
            userChallenge.status = 'approved';
            userChallenge.approvedAt = new Date();
            userChallenge.pointsEarned = userChallenge.challenge.rewardPoints; // A kihívás pontszáma
            //Felhasználó pontjainak növelése
            const user = await users.findByPk(userChallenge.userId);
            if (user) {
                user.points += userChallenge.pointsEarned;
                await user.save();
            } else {
                return res.status(400).json({ message: "Érvénytelen döntés. Elfogadva vagy elutasítva lehet." })
            }
            await userChallenge.save();

            res.json({
                message: `Kihívás ${decision === 'approved' ? 'jóváhagyva' : 'elutasítva'}.`, userChallenge
            })
        }

    } catch (err) {
        console.error("Hiba a kihívás jóváhagyása, elutasítása során:", err)
        res.status(500).json({ message: "Szerverhiba a kihívás jóváhagyása, elutasítása során." })
    }
})

router.delete('/delete', authenticateToken, async (req, res) => {
    try {
        //Jogosultság ellenörzés
        if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'institution')) {
            return res.status(403).json({ message: "Nincs jogosultságod a kihívás törléséhez." })
        }
        const challengeId = req.params.id

        //Kihívás lekérése
        const challenge = await challenges.findByPk(challengeId)
        if (!challenge) {
            res.status(404).json({ message: "Kihavás nem található" })
        }
        //Kapcsolódó userChallenge lekérése képek törléséhez
        const relatedUserChallenge = await userChallenges.findOne(
            {
                where: {
                    challengeId
                }
            }
        )
        //Felhasználó által csatolt képek törlése
        if (relatedUserChallenge) {
            for (const imgPath of [relatedUserChallenge.image1, relatedUserChallenge.image2, relatedUserChallenge.image3]) {
                if (imgPath) {
                    const filePath = path.join(__dirname, '..', imgPath);
                    try {
                        await fs.promises.unlink(filePath);
                    } catch (err) {
                        if (err.code !== 'ENOENT') {
                            console.error("Kép törlés hiba:", err);
                        }
                    }
                }
            }
        }
        //Challenge képeinek törlése
        if (challenge.image) {
            const challengeImgPath = path.join(__dirname, '..', challenge.image);
            try {
                await fs.promises.unlink(challengeImgPath);
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.error("Kép törlés hiba:", err);
                }
            }
        }
        // Kapcsolódó userChallenges törlése
        await userChallenges.destroy({ where: { challengeId } });
        //Kihívás törlése
        await challenge.destroy()
        res.json({ message: "Kihívás sikeresen törölve." })

    } catch (err) {
        console.error("Hiba a kihívás törlése során:", err)
        res.status(500).json({ message: "Szerverhiba a kihívás törlése során." })
    }
})


module.exports = router

