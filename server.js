require('dotenv').config();
const express = require('express');
const dbHandler = require('./dbHandler');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportsRoutes')
const categoryRoutes = require('./routes/categoriesRoutes')
const reportVotesRoutes = require('./routes/reportVotes');

const cors = require('cors');

const server = express();
const PORT = process.env.PORT;

server.use(cors());
server.use(express.json());
server.use('/api/auth', authRoutes);
server.use('/api/reports', reportRoutes);
server.use('/uploads', express.static('uploads'));
server.use('/api/categories', categoryRoutes);
server.use('/api/votes',reportVotesRoutes);


//Adatbázis modellek szinkronizálása és szerver indítása

(async () => {
    try {
        await dbHandler.users.sync({ alter: true });
        await dbHandler.institutions.sync({ alter: true });
        await dbHandler.categories.sync({ alter: true });
        await dbHandler.reports.sync({ alter: true });
        await dbHandler.reportVotes.sync({ alter: true });
        await dbHandler.petitions.sync({ alter: true });
        await dbHandler.petitionVotes.sync({ alter: true });
        await dbHandler.badges.sync({ alter: true });
        await dbHandler.userBadges.sync({ alter: true });
        await dbHandler.challenges.sync({ alter: true });
        await dbHandler.userChallenges.sync({ alter: true });
        await dbHandler.tasks.sync({ alter: true });
        await dbHandler.statusHistories.sync({ alter: true });
        await dbHandler.forwardingLogs.sync({ alter: true });
        await dbHandler.reportImages.sync({ alter: true });

        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error syncing database models:', error);
    }

})();










