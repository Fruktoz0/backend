// Auto Generated Test.js file

const express = require('express')
const supertest = require('supertest')
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoriesRoutes')

const server = express()
server.use(express.json())
server.use('/api/auth', authRoutes);
server.use('/api/categories', categoryRoutes);

var token_admin = {};
var logged_admin = {};
var token_user = {};
var logged_user = {};

var cat_all = {};
var del_cat = {};
var new_cat = {};

describe('test for "Login" route', () => {
    test('Login as Admin    s11 [200]', async () => {
        const response = await supertest(server).post('/api/auth/login').send({ email: 'admin@admin.hu', password: 'admin123' })
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

describe('test for "Categories" route', () => {
    test('Get Categories List by any User [200]', async () => {
        const response = await supertest(server).get('/api/categories/list')
        expect(response.statusCode).toBe(200)
        const cat_all = response.body
        console.log("Cat. All: ", cat_all.length, cat_all)
        for (const item of cat_all) {
            if (item.categoryName.indexOf("Aladin") == 0) { del_cat = item }
        }
        console.log("Del. Cat.: ", del_cat.id)
    })
})

describe('test for "Categories" route', () => {
    test('Delete Category IF EXIST by Admin { Aladin Kategória } [404] [200]', async () => {
        const response = await supertest(server).delete('/api/categories/delete/' + del_cat.id)
        .set('Authorization', 'bearer ' + token_admin)
        if (response.statusCode == 404) {
            expect(response.statusCode).toBe(404)
        } else {
            expect(response.statusCode).toBe(200)
        }
    })
})

describe('test for "Categories" route', () => {
    test('Create Category by User - FORBIDDEN [403]', async () => {
        const response = await supertest(server).post('/api/categories/create').send({ categoryName: 'Aladin Kategória', defaultInstitutionId: 'a1040145-7c6c-11f0-9b55-2cf05dad8c1f' })
        .set('Authorization', 'bearer ' + token_user)
        expect(response.statusCode).toBe(403)
    })
})

describe('test for "Categories" route', () => {
    test('Create an Existing Category by Admin - FORBIDDEN [409] [Már létezik ilyen nevű kategória.]', async () => {
        const response = await supertest(server).post('/api/categories/create').send({ categoryName: 'Tömegközlekedési probléma', defaultInstitutionId: '0841b0fc-7c6d-11f0-9b55-2cf05dad8c1f' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(409)
        expect(response.body).toHaveProperty('message', 'Már létezik ilyen nevű kategória.')
    })
})

describe('test for "Categories" route', () => {
    test('Create a New Category by Admin - Hiányzó adatok s00 [400]', async () => {
        const response = await supertest(server).post('/api/categories/create').send({})
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(400)
    })
    test('Create a New Category by Admin - Hiányzó adatok s01 [400]', async () => {
        const response = await supertest(server).post('/api/categories/create').send({ defaultInstitutionId: '0841b0fc-7c6d-11f0-9b55-2cf05dad8c1f' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(400)
    })
    test('Create a New Category by Admin - Hiányzó adatok s10 [400]', async () => {
        const response = await supertest(server).post('/api/categories/create').send({ categoryName: 'Aladin Kategória' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(400)
    })
    test('Create a New Category by Admin - s11 { Aladin Kategória } [201]', async () => {
        const response = await supertest(server).post('/api/categories/create').send({ categoryName: 'Aladin Kategória', defaultInstitutionId: '0841b0fc-7c6d-11f0-9b55-2cf05dad8c1f' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(201)
        new_cat.id = response.body.id;
        console.log("\nnew_cat.id: " + new_cat.id);
    })
})

describe('test for "Categories" route 2', () => {
    test('Delete Category by User Wrong Id - FORBIDDEN [403]', async () => {
        const response = await supertest(server).delete('/api/categories/delete/123456789')
        .set('Authorization', 'bearer ' + token_user)
        expect(response.statusCode).toBe(403)
    })
})

describe('test for "Categories" route 2', () => {
    test('Delete Category by User - FORBIDDEN [403]', async () => {
        const response = await supertest(server).delete('/api/categories/delete/' + new_cat.id)
        .set('Authorization', 'bearer ' + token_user)
        expect(response.statusCode).toBe(403)
    })
})

describe('test for "Categories" route 2', () => {
    test('Delete Category by Admin - Wrong Id [404]', async () => {
        const response = await supertest(server).delete('/api/categories/delete/123456789')
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(404)
    })
})

describe('test for "Categories" route 2', () => {
    test('Delete Category by Admin - Good Id [200]', async () => {
        const response = await supertest(server).delete('/api/categories/delete/' + new_cat.id)
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(200)
    })
})

describe('test for "Categories" route 2', () => {
    test('ReCreate Category by Admin - s11 { Aladin Kategória } [201]', async () => {
        const response = await supertest(server).post('/api/categories/create').send({ categoryName: 'Aladin Kategória', defaultInstitutionId: '0841b0fc-7c6d-11f0-9b55-2cf05dad8c1f' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(201)
    })
})

