require('dotenv').config();
const express = require('express');
const dbHandler = require('./dbHandler');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportsRoutes')
const categoryRoutes = require('./routes/categoriesRoutes')
const reportVotesRoutes = require('./routes/reportVotes');
const userRoutes = require('./routes/usersRoutes');
const summaryRoutes = require('./routes/summaryRoutes')
const institutionsRoutes = require('./routes/institutionsRoutes')
const newsRoutes = require('./routes/newsRoutes');
const challengesRoutes = require('./routes/challengesRoutes');
const badgesRoutes = require('./routes/badgesRoutes')
const cors = require('cors');


const server = express();
const PORT = process.env.PORT;

server.use(cors());
server.use(express.json());
server.use('/api/auth', authRoutes);
server.use('/api/reports', reportRoutes);
server.use('/uploads', express.static('uploads'));
server.use('/api/categories', categoryRoutes);
server.use('/api/votes', reportVotesRoutes);
server.use('/api/summary', summaryRoutes);
server.use('/api/institutions', institutionsRoutes)
server.use('/api/news', newsRoutes)
server.use('/api/challenges', challengesRoutes)
server.use('/api/badges', badgesRoutes)
server.use('/api', userRoutes);



//Adatbázis modellek szinkronizálása és szerver indítása

(async () => {
    try {

        //Hivatkozott táblák szinkronizálása
        await dbHandler.institutions.sync({ alter: true });
        await dbHandler.users.sync({ alter: true });
        await dbHandler.badges.sync({ alter: true });
        await dbHandler.challenges.sync({ alter: true });
        await dbHandler.categories.sync({ alter: true });


        await dbHandler.reports.sync({ alter: true });
        await dbHandler.tasks.sync({ alter: true });
        await dbHandler.reportImages.sync({ alter: true });
        await dbHandler.reportVotes.sync({ alter: true });
        await dbHandler.statusHistories.sync({ alter: true });
        await dbHandler.forwardingLogs.sync({ alter: true });


        await dbHandler.petitions.sync({ alter: true });
        await dbHandler.petitionVotes.sync({ alter: true });

        await dbHandler.userBadges.sync({ alter: true });
        await dbHandler.userChallenges.sync({ alter: true });

        await dbHandler.institutionNews.sync({ alter: true });

        server.listen(PORT, () => {
            console.log(`\n \n Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error syncing database models:', error);
    }

})();










