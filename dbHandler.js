const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const dbConnection = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        dialect: 'mysql',
        host: process.env.DB_HOST
    });

const users = dbConnection.define('user', {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    'username': {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    'password': {
        type: DataTypes.STRING,
        allowNull: false
    },
    'email': {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    'zipCode': {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    'city': {
        type: DataTypes.STRING,
        allowNull: true,
    },
    'address': {
        type: DataTypes.STRING,
        allowNull: true
    },
    'points': {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    'role': {
        type: DataTypes.ENUM('user', 'admin', 'worker', 'institution', 'compliance'),
        defaultValue: 'user'
    },
    'isActive': {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    },
    'institutionId': {
        type: DataTypes.UUID,
        allowNull: true,
    }
})

const categories = dbConnection.define('category', {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    'categoryName': {
        type: DataTypes.STRING,
        allowNull: false,
    },
    'defaultInstitutionId': {
        type: DataTypes.UUID,
        allowNull: false,
    }
})

const reports = dbConnection.define('report', {
    'id': {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    'userId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'title': {
        type: DataTypes.STRING,
        allowNull: false,
    },
    'description': {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    'categoryId': {
        type: DataTypes.UUID,
        allowNull: false
    },
    'address': {
        type: DataTypes.STRING,
        allowNull: true
    },
    'zipCode': {
        type: DataTypes.STRING,
        allowNull: true
    },
    'city': {
        type: DataTypes.STRING,
        allowNull: true
    },
    'locationLat': {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    'locationLng': {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    'status': {
        type: DataTypes.ENUM,
        values: ['open', 'rejected', 'in_progress', 'resolved'],
        defaultValue: 'open'
    },
    'institutionId': {
        type: DataTypes.UUID,
        allowNull: false
    }
})

const reportImages = dbConnection.define('reportImage', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    reportId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
});

const statusHistories = dbConnection.define('statusHistory', {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    'reportId': {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    'statusId': {
        type: DataTypes.ENUM('open', 'rejected', 'in_progress', 'resolved', 'forwarded', 'reopened'),
        allowNull: false,
    },
    'changedAt': {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    'comment': {
        type: DataTypes.STRING,
        allowNull: true
    },
    'setByUserId': {
        type: DataTypes.UUID,
        allowNull: false,
    }
})

const forwardingLogs = dbConnection.define('forwardingLog', {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    'reportId': {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    'forwardedToId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'forwardedFromId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'forwardedByUserId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'forwardedAt': {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    'reason': {
        type: DataTypes.STRING,
        allowNull: false
    },
})

const reportVotes = dbConnection.define('reportVote', {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    'reportId': {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    'userId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'voteType': {
        type: DataTypes.ENUM('upvote', 'downvote'),
        allowNull: false
    }
})

const petitions = dbConnection.define('petition', {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    'userId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'title': {
        type: DataTypes.STRING,
        allowNull: false
    },
    'description': {
        type: DataTypes.TEXT,
        allowNull: false
    },
    'category': {
        type: DataTypes.STRING,
        allowNull: false
    },
    'createdAt': {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    'status': {
        type: DataTypes.ENUM('open', 'closed', 'in_progress'),
        defaultValue: 'open'
    }
})

const petitionVotes = dbConnection.define('petitionVote', {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    'petitionId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'userId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'voteType': {
        type: DataTypes.ENUM('upvote', 'downvote'),
        allowNull: false
    }
})
const badges = dbConnection.define('badge', {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    'name': {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    'description': {
        type: DataTypes.STRING,
        allowNull: false
    },
    'iconUrl': {
        type: DataTypes.STRING,
        allowNull: false
    },
})
const userBadges = dbConnection.define('userBadge', {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    'userId': {
        type: DataTypes.UUID,
        allowNull: false,
        foreignKey: true
    },
    'badgeId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'earnedAt': {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
})

const challenges = dbConnection.define('challenge', {
    'id': {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    'name': {
        type: DataTypes.STRING,
        allowNull: false
    },
    'description': {
        type: DataTypes.TEXT,
        allowNull: false
    },
    'category': {
        type: DataTypes.STRING,
        allowNull: false
    },
    'points': {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    'status': {
        type: DataTypes.ENUM('active', 'completed', 'expired'),
        defaultValue: 'active'
    },
    'startDate': {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    'endDate': {
        type: DataTypes.DATE,
        allowNull: false
    }
})

const userChallenges = dbConnection.define('userChallenge', {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    'userId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'challengeId': {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    'status': {
        type: DataTypes.ENUM('active', 'completed', 'failed'),
        defaultValue: 'active'
    },
    'pointsEarned': {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
})

const tasks = dbConnection.define('task', {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    'reportId': {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    'workerId': {
        type: DataTypes.UUID,
        allowNull: true,
    },
    'assignedAt': {
        type: DataTypes.DATE,
        allowNull: true,
    },
    'completedAt': {
        type: DataTypes.DATE,
        allowNull: true,
    },
    'status': {
        type: DataTypes.ENUM('assigned', 'in_progress', 'completed'),
        defaultValue: 'assigned'
    },
    'feedback': {
        type: DataTypes.STRING,
        allowNull: true
    }
})
const institutions = dbConnection.define('institution', {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    'name': {
        type: DataTypes.STRING,
        allowNull: false
    },
    'email': {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    'description': {
        type: DataTypes.STRING,
        allowNull: false
    },
    'contactInfo': {
        type: DataTypes.TEXT,
    },
    'logoUrl': {
        type: DataTypes.STRING,
        allowNull: true
    }
})

const institutionNews = dbConnection.define('institutionNews', {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    'institutionId': {
        type: DataTypes.UUID,
        allowNull: false,
        foreignKey: true
    },
    'slug': {
        type: DataTypes.STRING,
        allowNull: false
    },
    'title': {
        type: DataTypes.STRING,
        allowNull: false
    },
    'content': {
        type: DataTypes.STRING,
        allowNull: false
    },
    'imageUrl': {
        type: DataTypes.STRING,
        allowNull: true
    },
    'createdAt': {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    'createdBy': {
        type: DataTypes.UUID,
        allowNull: false
    },
    'updatedAt': {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    'status': {
        type: DataTypes.ENUM('published', 'archived'),
        defaultValue: 'published'
    }
})

const userInstitutions = dbConnection.define("userInstitution", {
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true
    },
    institutionId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true
    }
})

//Összekapcsolások

// USER -> REPORT
users.hasMany(reports, { foreignKey: 'userId' });
reports.belongsTo(users, { foreignKey: 'userId' });

// USER -> REPORT VOTES
users.hasMany(reportVotes, { foreignKey: 'userId' });
reportVotes.belongsTo(users, { foreignKey: 'userId' });

// USER -> PETITIONS
users.hasMany(petitions, { foreignKey: 'userId' });
petitions.belongsTo(users, { foreignKey: 'userId' });

// USER -> PETITION VOTES
users.hasMany(petitionVotes, { foreignKey: 'userId' });
petitionVotes.belongsTo(users, { foreignKey: 'userId' });

// USER -> USER BADGES
users.hasMany(userBadges, { foreignKey: 'userId' });
userBadges.belongsTo(users, { foreignKey: 'userId' });

// USER -> USER CHALLENGES
users.hasMany(userChallenges, { foreignKey: 'userId' });
userChallenges.belongsTo(users, { foreignKey: 'userId' });

// USER -> TASKS (workerId)
users.hasMany(tasks, { foreignKey: 'workerId' });
tasks.belongsTo(users, { foreignKey: 'workerId' });

// USER -> FORWARDINGLOGS (ki továbbította)
users.hasMany(forwardingLogs, { foreignKey: 'forwardedByUserId' });
forwardingLogs.belongsTo(users, { foreignKey: 'forwardedByUserId' });
forwardingLogs.belongsTo(institutions, { foreignKey: 'forwardedFromId', as: 'forwardedFrom' });
forwardingLogs.belongsTo(institutions, { foreignKey: 'forwardedToId', as: 'forwardedTo' });
forwardingLogs.belongsTo(reports, { foreignKey: 'reportId', as: 'report' });

// USER -> INSTITUTIONS
users.belongsTo(institutions, { foreignKey: 'institutionId' });
institutions.hasMany(users, { foreignKey: 'institutionId' });

// PETITION -> PETITION VOTES
petitions.hasMany(petitionVotes, { foreignKey: 'petitionId' });
petitionVotes.belongsTo(petitions, { foreignKey: 'petitionId' });

// BADGE -> USER BADGES
badges.hasMany(userBadges, { foreignKey: 'badgeId' });
userBadges.belongsTo(badges, { foreignKey: 'badgeId' });

// CHALLENGE -> USER CHALLENGES
challenges.hasMany(userChallenges, { foreignKey: 'challengeId' });
userChallenges.belongsTo(challenges, { foreignKey: 'challengeId' });

// INSTITUTIONS -> CATEGORIES
institutions.hasMany(categories, { foreignKey: 'defaultInstitutionId' })
categories.belongsTo(institutions, { foreignKey: 'defaultInstitutionId' })

//CATEGORY -> REPORTS
categories.hasMany(reports, { foreignKey: 'categoryId' });
reports.belongsTo(categories, { foreignKey: 'categoryId' });

//REPORTS -> REPORTIMAGES
reports.hasMany(reportImages, { foreignKey: 'reportId' });
reportImages.belongsTo(reports, { foreignKey: 'reportId' });

//REPORT -> FORWARDINGLOGS
reports.hasMany(forwardingLogs, { foreignKey: 'reportId' });

//REPORT -> REPORT VOTES
reports.hasMany(reportVotes, { foreignKey: 'reportId' });
reportVotes.belongsTo(reports, { foreignKey: 'reportId' });

//REPORT -> INSTITUTIONS 
reports.belongsTo(institutions, { foreignKey: 'institutionId' })
institutions.hasMany(reports, { foreignKey: 'institutionId' })

//REPORT -> TASKS
reports.hasMany(tasks, { foreignKey: 'reportId' });
tasks.belongsTo(reports, { foreignKey: 'reportId' });

//Report -> STATUS HISTORY
reports.hasMany(statusHistories, { foreignKey: 'reportId' });
statusHistories.belongsTo(reports, { foreignKey: 'reportId' });

//STATUSHISTORIES -> USER
statusHistories.belongsTo(users, { foreignKey: 'setByUserId', as: 'setByUser' });
users.hasMany(statusHistories, { foreignKey: 'setByUserId' });

//INSTITUTION -> INSTITUTION NEWS
institutions.hasMany(institutionNews, { foreignKey: 'institutionId' });
institutionNews.belongsTo(institutions, { foreignKey: 'institutionId' });

//USER -> INSTITUTION NEWS
users.hasMany(institutionNews, { foreignKey: 'createdBy' });
institutionNews.belongsTo(users, { foreignKey: 'createdBy', as: 'author' });

module.exports = {
    users,
    categories,
    reports,
    reportVotes,
    petitions,
    challenges,
    petitionVotes,
    badges,
    userBadges,
    userChallenges,
    tasks,
    statusHistories,
    forwardingLogs,
    institutions,
    reportImages,
    institutionNews,

};