require('dotenv').config();
const express = require('express');
const dbHandler = require('./dbHandler');
const authRoutes = require('./routes/authRoutes');

const cors = require('cors');

const server = express();
const PORT = process.env.PORT;

server.use(cors());


dbHandler.users.sync({ alter: true });
dbHandler.reports.sync({ alter: true });
dbHandler.reportVotes.sync({ alter: true });
dbHandler.petitions.sync({ alter: true });
dbHandler.petitionVotes.sync({ alter: true });
dbHandler.badges.sync({ alter: true });
dbHandler.userBadges.sync({ alter: true });
dbHandler.challenges.sync({ alter: true });
dbHandler.userChallenges.sync({ alter: true });
dbHandler.tasks.sync({ alter: true });
dbHandler.categories.sync({ alter: true });
dbHandler.statusHistories.sync({ alter: true });
dbHandler.forwardingLogs.sync({ alter: true });
dbHandler.institutions.sync({ alter: true });



server.use(express.json());
server.use(cors());

server.use('/api/auth', authRoutes);




server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});