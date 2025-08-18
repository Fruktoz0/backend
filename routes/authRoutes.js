const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { users, institutions, reports } = require('../dbHandler');
const JWT_SECRET = process.env.JWT_SECRET;
const expireTime = process.env.EXPIRE_TIME;
const authenticateToken = require('../middleware/authMiddleware');


//min 6 karakter a felhasználónév, password max 20 min 6 karakter
router.post('/register', async (req, res) => {
    const { username, email, password, points, role, isActive, createdAt, updatedAt } = req.body;
    try {
        const existingUser = await users.findOne({ where: { email } });
        if (existingUser)
            return res.status(409).json({ message: 'Ez az email már regisztrálva van.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await users.create({
            username,
            email,
            password: hashedPassword,
            points,
            role,
            isActive,
            createdAt,
            updatedAt
        });
        const token = jwt.sign({ id: newUser.id, }, JWT_SECRET, { expiresIn: expireTime });
        res.status(201).json({ token })

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hiba történt a regisztráció során.' });
    }
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await users.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Hibás email vagy jelszó.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Hibás email vagy jelszó.' });
        }
        const token = jwt.sign({ id: user.id, role: user.role, institutionId: user.institutionId }, JWT_SECRET, { expiresIn: expireTime });
        res.status(200).json({ token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hiba történt a bejelentkezés során.' });
    }
})

//Felhasználó adatainak lekérdezése
router.get('/user', authenticateToken, async (req, res) => {
    try {
        const user = await users.findByPk(req.user.id, {
            attributes: [
                'id', 'username', 'email', 'points', 'role', 'isActive', 'createdAt', 'updatedAt', "institutionId", 'zipCode', 'city', 'address', 'avatarSeed', 'avatarStyle', 'avatarChangesToday', 'lastAvatarChangeDate'
            ],
            include: [
                {
                    model: institutions,
                    attributes: ['name']
                }
            ]
        });
        if (!user) {
            return res.status(404).json({ message: 'Felhasználó nem található.' });
        }
        //Felhasználó reportjainak megszámlálása
        const reportCount = await reports.count({
            where: { userId: req.user.id }
        })

        res.json({
            ...user.toJSON(),
            reportCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hiba a felhasználói adatok lekérésekor.' });
    }
});




module.exports = router;