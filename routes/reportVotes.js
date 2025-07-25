const express = require('express');
const router = express.Router();
const { reportVotes } = require('../dbHandler');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/vote', authenticateToken, async (req, res) => {
    const { reportId, voteType } = req.body;
    const userId = req.user.id; // Az autentikációs middleware-ből
    if (!['upvote', 'downvote'].includes(voteType)) {
        return res.status(400).json({ message: 'Érvénytelen szavazási típus.' });
    }
    try {
        const existingVote = await reportVotes.findOne({ where: { reportId, userId } });

        if (existingVote) {
            if (existingVote.voteType === voteType) {
                // Ha már szavazott ugyanazzal a típussal, akkor eltávolítjuk a szavazást
                await existingVote.destroy();
                return res.status(200).json({ message: 'Szavazás eltávolítva.' });
            }
            // Ha más típusú szavazás van, akkor frissítjük
            existingVote.voteType = voteType;
            await existingVote.save();
            return res.status(200).json({ message: 'Szavazás frissítve.' });
        } else {
            // Új szavazás létrehozása
            await reportVotes.create({ reportId, userId, voteType });
            return res.status(201).json({ message: 'Szavazás sikeresen rögzítve.' });
        }


    } catch (error) {
        console.error('Hiba a szavazás ellenőrzésekor:', error);
        return res.status(500).json({ message: 'Szerverhiba a szavazás ellenőrzésekor.' });
    }
})

module.exports = router;