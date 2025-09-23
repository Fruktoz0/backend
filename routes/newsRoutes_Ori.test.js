//
//     newsRoutes_Ori.test.js
//
// Excel+VB6 Program Generated Test.js file, using own mnemonic system

const express = require('express')
const supertest = require('supertest')
const authRoutes = require('./authRoutes');
const newsRoutes = require('./newsRoutes')

const server = express()
server.use(express.json())
server.use('/api/auth', authRoutes);
server.use('/api/news', newsRoutes);

var token_admin = {};
var logged_admin = {};
var token_user = {};
var logged_user = {};
var token_wrong = {};

describe('test for "Login" route', () => {
    test('Login as Admin    s11 [200]', async () => {
        const response = await supertest(server).post('/api/auth/login').send({ email: 'admin@admin.hu', password: 'admin' })
        expect(response.statusCode).toBe(200)
        token_admin = response.body.token;
        logged_admin = JSON.parse(atob(token_admin.split('.')[1]));
        console.log("Logged Admin: ",logged_admin);
    })
})

describe('test for "Login" route', () => {
    test('Login as User     s11 [200]', async () => {
        const response = await supertest(server).post('/api/auth/login').send({ email: 'zoardakarki@gmail.com', password: '123456789' })
        expect(response.statusCode).toBe(200)
        token_user = response.body.token;
        logged_user = JSON.parse(atob(token_user.split('.')[1]));
        console.log("Logged User: ",logged_user);
    })
})

describe('GetList of "News" route :', () => {
    test('Get All News List by Admin [200]', async () => {
        const response = await supertest(server).get('/api/news/allNews')
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(200)
    })
})

describe('GetList of "News" route :', () => {
    test('Get All News List by User [200]', async () => {
        const response = await supertest(server).get('/api/news/allNews')
        .set('Authorization', 'bearer ' + token_user)
        expect(response.statusCode).toBe(200)
    })
})

