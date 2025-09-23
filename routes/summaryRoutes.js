const express = require('express');
const router = express.Router();
const { users, reports, reportVotes } = require('../dbHandler');
const authenticateToken = require('../middleware/authMiddleware');


router.get('/allCount', authenticateToken, async (req, res) => {
    try {
        const [userCount, reportCount, voteCount] = await Promise.all([
            users.count(),
            reports.count(),
            reportVotes.count()
        ])
        res.json({
            userCount,
            reportCount,
            voteCount
        });
    } catch (err) {
        console.error("Hiba a statisztika lekérdezésénél", err)
        res.status(500).json({ message: "Szerver hiba történt" }).end()
    }
})


module.exports = router;
