const express = require('express');
const router = express.Router();
const { users } = require('../dbHandler');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/admin/users', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Nincs jogosultság!' });
        }
        const allUsers = await users.findAll({
            attributes: ['id', 'username', 'email', 'points', 'role', 'isActive', 'createdAt', 'updatedAt']
        });
        res.status(200).json(allUsers);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Hiba történt a jogosultság ellenőrzése során.' });
    }
})


module.exports = router;