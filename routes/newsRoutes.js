const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const authenticateToken = require('../middleware/authMiddleware');
const { institutionNews, institutions, users } = require('../dbHandler');
const { title } = require('process');


//Intézmény hírek létrehozása képfeltöltéssel
router.post('/add', authenticateToken, async (req, res) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, path.join('uploads', 'news')),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, Date.now() + ext);
        }
    })

    const fileFilter = (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Csak képek engedélyezettek!'), false);
        }
    }
    const upload = multer({ storage, fileFilter, limits: { fileSize: 4 * 1024 * 1024 } }).single('image');

    upload(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ message: 'Hibás képfeltöltés.' });
        }
        try {
            const { institutionId, slug, title, content, status = 'published' } = req.body;

            if (!institutionId || !slug || !title || !content) {
                return res.status(400).json({ message: 'Minden mező kitöltése kötelező.' });
            }

            //Jogosultság ellenőrzése
            const { role, institutionId: userInst } = req.user || {};
            if (role !== 'admin' && userInst !== institutionId) {
                return res.status(403).json({ message: 'Nincs jogosultságod hírt létrehozni ebben az intézményben.' });
            }

            let imageUrl = null;
            if (req.file) {
                imageUrl = path.join('uploads', 'news', req.file.filename);
            }

            const newsItem = await institutionNews.create({
                institutionId,
                slug,
                title,
                content,
                imageUrl,
                createdBy: req.user.id,
                status
            });

            const result = await institutionNews.findByPk(newsItem.id, {
                include: [
                    { model: institutions, attributes: ['id', 'name', 'logoUrl'] },
                    { model: users, as: 'author', attributes: ['id', 'username'] }
                ]
            });

            res.status(201).json(result);

        } catch (error) {
            console.error('Hiba a hír hozzáadásakor:', error);
            return res.status(500).json({ message: 'Hiba történt a hír hozzáadásakor.' });
        }


    });
});

//Összes hír lekérdezése
router.get('/allNews', async (req, res) => {
    try {
        const news = await institutionNews.findAll({
            include: [
                { model: institutions, attributes: ['id', 'name', 'logoUrl'] },
                { model: users, as: 'author', attributes: ['id', 'username'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(news);
    } catch (error) {
        console.error('Hiba a hírek lekérésekor:', error);
        return res.status(500).json({ message: 'Hiba történt a hírek lekérésekor.' });
    }
});


// Intézmény híreinek szerkesztése
router.put('/update/:id', authenticateToken, (req, res) => {
    // Multer config
    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, path.join('uploads', 'news')),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, Date.now() + ext);
        }
    });
    const fileFilter = (req, file, cb) => {
        const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
        cb(null, ok);
    };
    const upload = multer({ storage, fileFilter, limits: { fileSize: 4 * 1024 * 1024 } }).single('image');

    upload(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ message: 'Hibás képfeltöltés.' });
        }

        try {
            const newsItem = await institutionNews.findByPk(req.params.id);
            if (!newsItem) {
                return res.status(404).json({ message: 'Hír nem található.' });
            }

            // Jogosultság: admin vagy saját intézmény híre
            const { role, institutionId: userInst } = req.user || {};
            if (!(role === 'admin' || (userInst && userInst === newsItem.institutionId))) {
                return res.status(403).json({ message: 'Nincs jogosultság a hír szerkesztéséhez.' });
            }

            //Régi kép törlése, ha van 
            const fs = require('fs');

            if (req.file && newsItem.imageUrl) {
                try {
                    fs.unlinkSync(path.join(__dirname, '..', newsItem.imageUrl));
                } catch (err) {
                    console.warn('Nem sikerült törölni a régi képet:', err);
                }
            }

            // Új kép beállítása, ha van feltöltve
            let imageUrl = newsItem.imageUrl;
            if (req.file) {
                imageUrl = path.join('uploads', 'news', req.file.filename);
            }

            // Frissíthető mezők
            const fieldsToUpdate = {
                institutionId: req.body.institutionId ?? newsItem.institutionId,
                slug: req.body.slug ?? newsItem.slug,
                title: req.body.title ?? newsItem.title,
                content: req.body.content ?? newsItem.content,
                imageUrl,
                status: req.body.status ?? newsItem.status,
                updatedAt: new Date()
            };

            // Admin esetén szerző is módosítható
            if (role === 'admin' && req.body.createdBy) {
                fieldsToUpdate.createdBy = req.body.createdBy;
            }

            await newsItem.update(fieldsToUpdate);

            // Kapcsolt adatokkal visszaadjuk
            const updated = await institutionNews.findByPk(newsItem.id, {
                include: [
                    { model: institutions, attributes: ['id', 'name', 'logoUrl'] },
                    { model: users, as: 'author', attributes: ['id', 'username'] }
                ]
            });

            res.status(200).json(updated);
        } catch (error) {
            console.error('Hiba történt a hír frissítésekor:', error);
            res.status(500).json({ message: 'Szerver hiba a hír frissítésekor.' });
        }
    });
});

// Hír törlése
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const newsItem = await institutionNews.findByPk(req.params.id);
        if (!newsItem) {
            return res.status(404).json({ message: 'Hír nem található.' });
        }

        // Jogosultság: admin vagy saját intézmény híre
        const { role, institutionId: userInst } = req.user || {};
        if (!(role === 'admin' || (userInst && userInst === newsItem.institutionId))) {
            return res.status(403).json({ message: 'Nincs jogosultság a hír törléséhez.' });
        }

        // Kép törlése, ha van
        if (newsItem.imageUrl) {
            const fs = require('fs');
            const path = require('path');

            try {
                fs.unlinkSync(path.join(__dirname, '..', newsItem.imageUrl));
            } catch (err) {
                console.warn('Nem sikerült törölni a képet:', err);
            }
        }

        await newsItem.destroy();

        res.status(200).json({ message: 'Hír törölve.' });
    } catch (error) {
        console.error('Hiba történt a hír törlésekor:', error);
        res.status(500).json({ message: 'Szerver hiba a hír törlésekor.' });
    }
});

//Kiválasztott hír adataiank lekérdezése
router.get('/:id', async (req, res) => {
    try {
        const newsItem = await institutionNews.findByPk(req.params.id, {
            include: [
                { model: institutions, attributes: ['id', 'name', 'logoUrl'] },
                { model: users, as: 'author', attributes: ['id', 'username'] }
            ]
        });

        if (!newsItem) {
            return res.status(404).json({ message: 'Hír nem található.' });
        }

        res.status(200).json(newsItem);
    } catch (error) {
        console.error('Hiba történt a hír lekérésekor:', error);
        res.status(500).json({ message: 'Szerver hiba a hír lekérésekor.' });
    }
});

module.exports = router;