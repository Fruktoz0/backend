const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const authenticateToken = require('../middleware/authMiddleware');
const { institutionNews, institutions, users } = require('../dbHandler');

// Multer config
const uploadDir = path.join(__dirname, '..', 'uploads', 'news');

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
    limits: { fileSize: 6 * 1024 * 1024 }
}).single('image');


//FP News db szám lekérdezése Intézményenként
router.post('/news_Inst_db',authenticateToken , async (req, res) => {
    try {
        const { institutionId } = req.body
        const a_db = await institutionNews.count({
            where: { institutionId }         
        })
        res.status(200).json({ found_db: a_db });
    } catch (error) {
        console.error('Hiba a bejelentések lekérésekor:', error);
        res.status(500).json({ message: 'Szerverhiba a bejelentések lekérésekor' });
    }
});


//FP Report db szám lekérdezése Kategóriánként
router.post('/report_Cat_db',authenticateToken , async (req, res) => {
    try {
        const { categoryId } = req.body
        const a_db = await reports.count({
            where: { categoryId }         
        })
        res.status(200).json({ found_db: a_db });
    } catch (error) {
        console.error('Hiba a bejelentések lekérésekor:', error);
        res.status(500).json({ message: 'Szerverhiba a bejelentések lekérésekor' });
    }
});


//  Új hír létrehozása 
router.post('/add', authenticateToken, (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ message: 'Hibás képfeltöltés.' });
        }

        try {
            const { title, content, institutionId } = req.body;
            if (!title || !content) {
                return res.status(400).json({ message: 'A cím és a tartalom kötelező.' });
            }

            const { role, institutionId: userInst, id: userId } = req.user || {};

            // Jogosultság ellenőrzés
            if (role === 'user') {
                return res.status(403).json({ message: 'Nincs jogosultságod hírt létrehozni.' });
            }

            let finalInstitutionId = institutionId;

            if (role === 'institution') {
                finalInstitutionId = userInst;
            } else if (role === 'admin') {
                if (!institutionId) {
                    return res.status(400).json({ message: 'Adminnak ki kell választania egy intézményt.' });
                }
            }

            // kép mentése
            let imageUrl = null;
            if (req.file) {
                imageUrl = path.join('uploads', 'news', req.file.filename);
            }

            // slug automatikus generálása 
            const slug = title
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')       // szóközök helyett kötőjel
                .replace(/[^a-z0-9\-]/g, '') // ékezetek és extra karakterek kiszedése
                .substring(0, 50);           // max 50 karakter

            const newsItem = await institutionNews.create({
                institutionId: finalInstitutionId,
                slug,
                title,
                content,
                imageUrl,
                createdBy: userId,
                status: 'published'
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


// Összes hír lekérdezése 
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


// Hír frissítése 
router.put('/update/:id', authenticateToken, (req, res) => {
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

            const { role, institutionId: userInst } = req.user || {};
            if (!(role === 'admin' || (role === 'institution' && userInst === newsItem.institutionId))) {
                return res.status(403).json({ message: 'Nincs jogosultság a hír szerkesztéséhez.' });
            }

            if (req.file && newsItem.imageUrl) {
                try {
                    fs.unlinkSync(path.join(__dirname, '..', newsItem.imageUrl));
                } catch (err) {
                    console.warn('Nem sikerült törölni a régi képet:', err);
                }
            }

            let imageUrl = newsItem.imageUrl;
            if (req.file) {
                imageUrl = path.join('uploads', 'news', req.file.filename);
            }

            await newsItem.update({
                slug: req.body.slug ?? newsItem.slug,
                title: req.body.title ?? newsItem.title,
                content: req.body.content ?? newsItem.content,
                imageUrl,
                status: req.body.status ?? newsItem.status,
                updatedAt: new Date()
            });

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

        const { role, institutionId: userInst } = req.user || {};
        if (!(role === 'admin' || (role === 'institution' && userInst === newsItem.institutionId))) {
            return res.status(403).json({ message: 'Nincs jogosultság a hír törléséhez.' });
        }

        if (newsItem.imageUrl) {
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


// Kiválasztott hír lekérése 
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
