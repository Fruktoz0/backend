// Auto Generated Test.js file

const express = require('express')
const supertest = require('supertest')
const authRoutes = require('./authRoutes');
const usersRoutes = require('./usersRoutes')

const server = express()
server.use(express.json())
server.use('/api/auth', authRoutes);
server.use('/api', usersRoutes);

var token_admin = {};
var token_user = {};
var logged_admin = {};
var logged_user = {};
var sel_user = {};

describe('Login of "auth" route:', () => {
    test('Login Admin Hiányzó adat s00 - 400 [400]', async () => {
        const response = await supertest(server).post('/api/auth/login').send({})
        expect(response.statusCode).toBe(400)
    })
    test('Login Admin Hiányzó adat s01 - 400 [400]', async () => {
        const response = await supertest(server).post('/api/auth/login').send({ password: 'admin' })
        expect(response.statusCode).toBe(400)
    })
    test('Login Admin Hiányzó adat s10 - 400 [400]', async () => {
        const response = await supertest(server).post('/api/auth/login').send({ email: 'admin@admin.hu' })
        expect(response.statusCode).toBe(400)
    })
})

describe('Login of "auth" route:', () => {
    test('Login Admin Wrong Password - 401 [401]', async () => {
        const response = await supertest(server).post('/api/auth/login').send({ email: 'admin@admin.hu', password: 'adminO' })
        expect(response.statusCode).toBe(401)
    })
})

describe('Login of "auth" route:', () => {
    test('Login Admin Wrong Email - 404 [404]', async () => {
        const response = await supertest(server).post('/api/auth/login').send({ email: 'admin@admin.huH', password: 'admin' })
        expect(response.statusCode).toBe(404)
    })
})

describe('Login of "auth" route:', () => {
    test('Login as Admin     s11 [200]', async () => {
        const response = await supertest(server).post('/api/auth/login').send({ email: 'admin@admin.hu', password: 'admin' })
        expect(response.statusCode).toBe(200)
        token_admin = response.body.token;
        logged_admin = JSON.parse(atob(token_admin.split('.')[1]));
        console.log("Logged Admin: ",logged_admin);
    })
})

describe('Admin activity in "User" route', () => {
    test('Admin Get User Data by Email [200]', async () => {
        const response = await supertest(server).post('/api/admin/user_en')
        .send({ email: 'pepe@smd.hu' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(200)
        sel_user = response.body[0]
        console.log("SlUser:", sel_user);
    })
})

describe('Admin activity in "User" route', () => {
    test('Admin modify User to Active [200]', async () => {
        const response = await supertest(server).put('/api/admin/user/' + sel_user.id)
        .send({ isActive: 'active' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(200)
    })
})

describe('Login of "auth" route:', () => {
    test('Login as User     s11 [200]', async () => {
        const response = await supertest(server).post('/api/auth/login').send({ email: 'zoardakarki@gmail.com', password: '123456789' })
        expect(response.statusCode).toBe(200)
        token_user = response.body.token;
        logged_user = JSON.parse(atob(token_user.split('.')[1]));
        console.log("Logged User: ",logged_user);
    })
})

describe('User Data of "auth" route:', () => {
    test('GetUser Data with token_admin [200]', async () => {
        const response = await supertest(server).get('/api/auth/user')
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(200)
        console.log(response.body);
    })
})

describe('User Data of "auth" route:', () => {
    test('GetUser Data with token_user [200]', async () => {
        const response = await supertest(server).get('/api/auth/user')
        .set('Authorization', 'bearer ' + token_user)
        expect(response.statusCode).toBe(200)
        console.log(response.body);
    })
})

describe('Register of "auth" route All data:', () => {
    test('Register User Hiányzó adat s0000 Mekk Elek [400]', async () => {
        const response = await supertest(server).post('/api/auth/register').send({})
        expect(response.statusCode).toBe(400)
    })
    test('Register User Hiányzó adat s0001 Mekk Elek [400]', async () => {
        const response = await supertest(server).post('/api/auth/register').send({ confirmPassword: 'Meki#012345' })
        expect(response.statusCode).toBe(400)
    })
    test('Register User Hiányzó adat s0010 Mekk Elek [400]', async () => {
        const response = await supertest(server).post('/api/auth/register').send({ password: 'Meki#012345' })
        expect(response.statusCode).toBe(400)
    })
    test('Register User Hiányzó adat s0011 Mekk Elek [400]', async () => {
        const response = await supertest(server).post('/api/auth/register').send({ password: 'Meki#012345', confirmPassword: 'Meki#012345' })
        expect(response.statusCode).toBe(400)
    })
    test('Register User Hiányzó adat s0100 Mekk Elek [400]', async () => {
        const response = await supertest(server).post('/api/auth/register').send({ email: 'mindent_is_tudok@gmail.com' })
        expect(response.statusCode).toBe(400)
    })
    test('Register User Hiányzó adat s0101 Mekk Elek [400]', async () => {
        const response = await supertest(server).post('/api/auth/register').send({ email: 'mindent_is_tudok@gmail.com', confirmPassword: 'Meki#012345' })
        expect(response.statusCode).toBe(400)
    })
    test('Register User Hiányzó adat s0110 Mekk Elek [400]', async () => {
        const response = await supertest(server).post('/api/auth/register').send({ email: 'mindent_is_tudok@gmail.com', password: 'Meki#012345' })
        expect(response.statusCode).toBe(400)
    })
    test('Register User Hiányzó adat s0111 Mekk Elek [400]', async () => {
        const response = await supertest(server).post('/api/auth/register').send({ email: 'mindent_is_tudok@gmail.com', password: 'Meki#012345', confirmPassword: 'Meki#012345' })
        expect(response.statusCode).toBe(400)
    })
    test('Register User Hiányzó adat s1000 Mekk Elek [400]', async () => {
        const response = await supertest(server).post('/api/auth/register').send({ username: 'Mekk Elek' })
        expect(response.statusCode).toBe(400)
    })
    test('Register User Hiányzó adat s1001 Mekk Elek [400]', async () => {
        const response = await supertest(server).post('/api/auth/register').send({ username: 'Mekk Elek', confirmPassword: 'Meki#012345' })
        expect(response.statusCode).toBe(400)
    })
    test('Register User Hiányzó adat s1010 Mekk Elek [400]', async () => {
        const response = await supertest(server).post('/api/auth/register').send({ username: 'Mekk Elek', password: 'Meki#012345' })
        expect(response.statusCode).toBe(400)
    })
    test('Register User Hiányzó adat s1011 Mekk Elek [400]', async () => {
        const response = await supertest(server).post('/api/auth/register').send({ username: 'Mekk Elek', password: 'Meki#012345', confirmPassword: 'Meki#012345' })
        expect(response.statusCode).toBe(400)
    })
    test('Register User Hiányzó adat s1100 Mekk Elek [400]', async () => {
        const response = await supertest(server).post('/api/auth/register').send({ username: 'Mekk Elek', email: 'mindent_is_tudok@gmail.com' })
        expect(response.statusCode).toBe(400)
    })
    test('Register User Hiányzó adat s1101 Mekk Elek [400]', async () => {
        const response = await supertest(server).post('/api/auth/register').send({ username: 'Mekk Elek', email: 'mindent_is_tudok@gmail.com', confirmPassword: 'Meki#012345' })
        expect(response.statusCode).toBe(400)
    })
    test('Register User Hiányzó adat s1110 Mekk Elek [400]', async () => {
        const response = await supertest(server).post('/api/auth/register').send({ username: 'Mekk Elek', email: 'mindent_is_tudok@gmail.com', password: 'Meki#012345' })
        expect(response.statusCode).toBe(400)
    })
})

describe('Register of "auth" route All data:', () => {
    test('Delete IF EXIST New Registered User: "Mekk Elek" [402] [201]', async () => {
        const response = await supertest(server).delete('/api/auth/delete/mindent_is_tudok@gmail.com')
        .set('Authorization', 'bearer ' + token_admin)
        if (response.statusCode == 402) {
            expect(response.statusCode).toBe(402)
        } else {
            expect(response.statusCode).toBe(201)
        }
    })
})

describe('Register of "auth" route All data:', () => {
    test('Register User adat s111 Mekk Elek [201]', async () => {
        const response = await supertest(server).post('/api/auth/register').send({ username: 'Mekk Elek', email: 'mindent_is_tudok@gmail.com', password: 'Meki#012345', confirmPassword: 'Meki#012345' })
        expect(response.statusCode).toBe(201)
    })
})

