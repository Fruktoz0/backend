const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { users, institutions, reports } = require('../dbHandler');
const JWT_SECRET = process.env.JWT_SECRET;
const expireTime = process.env.EXPIRE_TIME;
const authenticateToken = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { sendValidationEmail } = require('../utils/mailService');


const loginLimiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 perc
    max: 5, //max 5 próbálkozás IP-nként
    message: (req, res) => {
        const retryAfter = res.getHeader("Retry-After");
        return { message: `Túl sok bejelentkezési próbálkozás. Próbáld újra ${retryAfter} másodperc múlva.` };
    },
    standardHeaders: true, //Modern headerek küldése
    legacyHeaders: false,  //Legacy headert már nem küldünk
});


//min 6 karakter a felhasználónév, password max 20 min 6 karakter
router.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    try {

        //Jelszó megerősítés ellenőrzése
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'A jelszó és a jelszó megerősítése nem egyezik.' });
        }
        //Felhasználónév ellenőrzés
        if (!username || username.length < 4 || username.length > 12) {
            return res.status(400).json({ message: 'A felhasználónév minimum 4 maximum 12 karakter hosszú kell legyen.' });
        }
        //Email formátum ellenőrzés
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ message: 'Érvénytelen email cím formátum.' });
        }
        //Email duplikáció ellenőrzés
        const existingUser = await users.findOne({ where: { email } });
        if (existingUser)
            return res.status(409).json({ message: 'Ez az email már regisztrálva van.' });
        //Jelszó ellenőrzés
        if (!password || password.length < 6 || password.length > 20) {
            return res.status(400).json({ message: 'A jelszó minimum 6 maximum 20 karakter hosszú kell legyen.' });
        }
        //Jelszó hash-elése
        const hashedPassword = await bcrypt.hash(password, 10);
        //Aktivációs token generálása + lejárati idő
        const activationToken = crypto.randomBytes(32).toString('hex');
        const activationExpires = new Date(Date.now() + 3600000);

        const newUser = await users.create({
            username,
            email,
            password: hashedPassword,
            points: 0,
            role: "user",
            isActive: "inactive",
            activationToken,
            activationExpires,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        //Aktiváló email kiküldése
        await sendValidationEmail(email, activationToken);
        res.json({ message: "Regisztráció sikeres! Erősísd meg az emailed." })
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Szerverbiba történt a regisztráció során.', error });
    }
})

//Email megerősítése
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    try {
        const user = await users.findOne({
            where: { activationToken: token }
        })
        if (!user) {
            return res.status(400).json({ message: "Érvénytelen vagy lejárt token." })
        }
        if (user.activationExpires && new Date() > user.activationExpires) {
            return res.status(400).json({ message: "Az aktivációs email lejárt." })
        }
        //Aktiválás
        user.isActive = "active";
        user.activationToken = null;
        user.activationExpires = null;
        await user.save();
        res.status(200).json({ message: "Email sikeresen megerősítve. Most már bejelentkezhetsz." })
    } catch (error) {
        console.error("Hiba történt az email megerősítése során.", error.message);
        res.status(500).json({ message: 'Szerverhiba történt az email megerősítése során.', error });
    }
})

router.post('/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {

        //Email és jelszó ellenőrzés
        if (!email || !password) {
            return res.status(400).json({ message: 'Email és jelszó megadása kötelező.' });
        }
        //Email formátumának ellenőrzése
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Érvénytelen email cím formátum.' });
        }
        //Email létezésének ellenőrzése
        const user = await users.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Email cím nem található.' });
        }
        //Jelszó ellenőrzés
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Helytelen jelszó.' });
        }
        //Fiók státuszának ellenőrzése
        if (user.isActive !== "active") {
            return res.status(403).json({ message: 'A fiók inaktív, kérlek erősítsd meg az emailed.' });
        }
        const token = jwt.sign({ id: user.id, role: user.role, institutionId: user.institutionId }, JWT_SECRET, { expiresIn: expireTime });
        res.status(200).json({ token });

    } catch (error) {
        console.error("Hiba történt a bejelentkezés során.", error.message);
        res.status(500).json({ message: 'Szerverhiba történt a bejelentkezés során.', error });
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
        console.error("Hiba történt a felhasználói adatok lekérésekor.", error.message);
        res.status(500).json({ message: 'Szerverhiba a felhasználói adatok lekérésekor.' });
    }
});




module.exports = router;