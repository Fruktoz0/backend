const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const users = require('../dbHandler');
const JWT_SECRET = process.env.JWT_SECRET;
const expireTime = process.env.EXPIRE_TIME;



router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await users.users.findOne({ where: { email } });
        if (existingUser)
            return res.status(409).json({ message: 'Ez az email már regisztrálva van.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await users.users.create({
            username,
            email,
            password: hashedPassword
        });
        const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: expireTime });
        res.status(201).json({ token })

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hiba történt a regisztráció során.' });
    }
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await users.users.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Hibás email vagy jelszó.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Hibás email vagy jelszó.' });
        }
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: expireTime });
        res.status(200).json({ token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hiba történt a bejelentkezés során.' });
    }
})

//Middleware authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

router.get('/user', authenticateToken, async (req, res) => {
  try {
    const user = await users.users.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'points', 'role']
    });
    if (!user) return res.status(404).json({ message: 'Felhasználó nem található.' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Hiba a felhasználói adatok lekérésekor.' });
  }
});


module.exports = router;