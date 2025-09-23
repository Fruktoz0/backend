// Auto Generated Test.js file

const express = require('express')
const supertest = require('supertest')
const authRoutes = require('./authRoutes');
const institutionsRoutes = require('./institutionsRoutes')

const server = express()
server.use(express.json())
server.use('/api/auth', authRoutes);
server.use('/api/institutions', institutionsRoutes);

var token_admin = {};
var logged_admin = {};
var token_worker = {};
var logged_worker = {};
var token_user = {};
var logged_user = {};
var inst_id = {};

var exist_inst = {};
var mod_inst = {};
var del_inst = {};

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
    test('Login as Worker     s11 [200]', async () => {
        const response = await supertest(server).post('/api/auth/login').send({ email: 'zoardakarki@gmail.com', password: '123456789' })
        expect(response.statusCode).toBe(200)
        token_worker = response.body.token;
        logged_worker = JSON.parse(atob(token_worker.split('.')[1]));
        console.log("Logged Worker: ",logged_worker);
    })
})

describe('test for "Login" route', () => {
    test('Login as User     s11 [200]', async () => {
        const response = await supertest(server).post('/api/auth/login').send({ email: 'tesztelget2000@gmail.com', password: 'Tesztike#1' })
        expect(response.statusCode).toBe(200)
        token_user = response.body.token;
        logged_user = JSON.parse(atob(token_user.split('.')[1]));
        console.log("Logged User: ",logged_user);
    })
})

describe('GetList of "Institutions" route :', () => {
    test('Get Institutions List [200]', async () => {
        const response = await supertest(server).get('/api/institutions/')
        expect(response.statusCode).toBe(200)
        const inst_all = response.body
        console.log(inst_all.length)
        for (const item of inst_all) {
                if (item.name.indexOf("Álomfejtő") == 0) { del_inst = item }
                if (item.name.indexOf("BKK") == 0) { mod_inst = item }
        }
        console.log("Del. Inst.ID: ", del_inst.id)
        console.log("Mod. Inst: ", mod_inst)
    })
})

describe('DeleteOne of "Institutions" route:', () => {
    test('Delete Institution IF EXIST by Admin { Álomfejtő Hatóság } [404] [200]', async () => {
        const response = await supertest(server).delete('/api/institutions/delete/' + del_inst.id)
        .set('Authorization', 'bearer ' + token_admin)
        if (response.statusCode == 404) {
            expect(response.statusCode).toBe(404)
        } else {
            expect(response.statusCode).toBe(200)
        }
    })
})

describe('GetOne of "Institutions" route:', () => {
    test('Get One Institution by Wrong id: 0123456789 [404]', async () => {
        const response = await supertest(server).get('/api/institutions/0123456789')
        expect(response.statusCode).toBe(404)
    })
})

describe('GetOne of "Institutions" route:', () => {
    test('Get One Institution by Existing id [200]', async () => {
        const response = await supertest(server).get('/api/institutions/' + mod_inst.id)
        expect(response.statusCode).toBe(200)
        exist_inst = response.body
        console.log("\nExist_Inst.name: " + exist_inst.name);
    })
})

describe('CreateOne of "Institutions" route:', () => {
    test('Create Institution by User s1111 - FORBIDDEN 403 [403]', async () => {
        const response = await supertest(server).post('/api/institutions/create').send({ name: 'Álomfejtő Hatóság', email: 'a_dream@dream_all.hu', description: 'Rosz Álmokat Elűző Központi hatóság', contactInfo: '2201 Budapest, Áloműzők utca 1.' })
        .set('Authorization', 'bearer ' + token_user)
        expect(response.statusCode).toBe(403)
        del_inst = response.body
    })
    test('Create Institution by Admin - Hiányzó adat s0000 [401]', async () => {
        const response = await supertest(server).post('/api/institutions/create').send({})
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(401)
    })
    test('Create Institution by Admin - Hiányzó adat s0001 [401]', async () => {
        const response = await supertest(server).post('/api/institutions/create').send({ contactInfo: '2201 Budapest, Áloműzők utca 1.' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(401)
    })
    test('Create Institution by Admin - Hiányzó adat s0010 [401]', async () => {
        const response = await supertest(server).post('/api/institutions/create').send({ description: 'Rosz Álmokat Elűző Központi hatóság' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(401)
    })
    test('Create Institution by Admin - Hiányzó adat s0011 [401]', async () => {
        const response = await supertest(server).post('/api/institutions/create').send({ description: 'Rosz Álmokat Elűző Központi hatóság', contactInfo: '2201 Budapest, Áloműzők utca 1.' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(401)
    })
    test('Create Institution by Admin - Hiányzó adat s0100 [401]', async () => {
        const response = await supertest(server).post('/api/institutions/create').send({ email: 'a_dream@dream_all.hu' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(401)
    })
    test('Create Institution by Admin - Hiányzó adat s0101 [401]', async () => {
        const response = await supertest(server).post('/api/institutions/create').send({ email: 'a_dream@dream_all.hu', contactInfo: '2201 Budapest, Áloműzők utca 1.' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(401)
    })
    test('Create Institution by Admin - Hiányzó adat s0110 [401]', async () => {
        const response = await supertest(server).post('/api/institutions/create').send({ email: 'a_dream@dream_all.hu', description: 'Rosz Álmokat Elűző Központi hatóság' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(401)
    })
    test('Create Institution by Admin - Hiányzó adat s0111 [401]', async () => {
        const response = await supertest(server).post('/api/institutions/create').send({ email: 'a_dream@dream_all.hu', description: 'Rosz Álmokat Elűző Központi hatóság', contactInfo: '2201 Budapest, Áloműzők utca 1.' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(401)
    })
    test('Create Institution by Admin - Hiányzó adat s1000 [401]', async () => {
        const response = await supertest(server).post('/api/institutions/create').send({ name: 'Álomfejtő Hatóság' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(401)
    })
    test('Create Institution by Admin - Hiányzó adat s1001 [401]', async () => {
        const response = await supertest(server).post('/api/institutions/create').send({ name: 'Álomfejtő Hatóság', contactInfo: '2201 Budapest, Áloműzők utca 1.' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(401)
    })
    test('Create Institution by Admin - Hiányzó adat s1010 [401]', async () => {
        const response = await supertest(server).post('/api/institutions/create').send({ name: 'Álomfejtő Hatóság', description: 'Rosz Álmokat Elűző Központi hatóság' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(401)
    })
    test('Create Institution by Admin - Hiányzó adat s1011 [401]', async () => {
        const response = await supertest(server).post('/api/institutions/create').send({ name: 'Álomfejtő Hatóság', description: 'Rosz Álmokat Elűző Központi hatóság', contactInfo: '2201 Budapest, Áloműzők utca 1.' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(401)
    })
    test('Create Institution by Admin - Hiányzó adat s1100 [401]', async () => {
        const response = await supertest(server).post('/api/institutions/create').send({ name: 'Álomfejtő Hatóság', email: 'a_dream@dream_all.hu' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(401)
    })
    test('Create Institution by Admin - Hiányzó adat s1101 [401]', async () => {
        const response = await supertest(server).post('/api/institutions/create').send({ name: 'Álomfejtő Hatóság', email: 'a_dream@dream_all.hu', contactInfo: '2201 Budapest, Áloműzők utca 1.' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(401)
    })
    test('Create Institution by Admin - Hiányzó adat s1110 [401]', async () => {
        const response = await supertest(server).post('/api/institutions/create').send({ name: 'Álomfejtő Hatóság', email: 'a_dream@dream_all.hu', description: 'Rosz Álmokat Elűző Központi hatóság' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(401)
    })
})

describe('CreateOne of "Institutions" route s1111:', () => {
    test('Create Institution by Amin { Álomfejtő Hatóság } [201]', async () => {
        const response = await supertest(server).post('/api/institutions/create').send({ name: 'Álomfejtő Hatóság', email: 'a_dream@dream_all.hu', description: 'Rosz Álmokat Elűző Központi hatóság', contactInfo: '2201 Budapest, Áloműzők utca 1.' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(201)
        del_inst = response.body
    })
})

describe('ModifyOne of "Institutions" route:', () => {
    test('Modify Institution by Admin  - Adat Módosítás BKK [200]', async () => {
        mod_inst.name = mod_inst.name+" - Admin Modified"
        console.log("To Modify:", mod_inst)
        const response = await supertest(server).put('/api/institutions/update/' + mod_inst.id)
        .set('Authorization', 'bearer ' + token_admin).send(mod_inst)
        expect(response.statusCode).toBe(200)
    })
    test('Modify Institution by Worker - Adat Módosítás BKK [200]', async () => {
        mod_inst.name = mod_inst.name+" - Worker Modified"
        const response = await supertest(server).put('/api/institutions/update/' + mod_inst.id)
        .set('Authorization', 'bearer ' + token_worker).send(mod_inst)
        expect(response.statusCode).toBe(200)
    })
    test('Modify Institution by User   - Adat Módosítás BKK - FORBIDDEN [403]', async () => {
        mod_inst.name = mod_inst.name+" - User Modified"
        const response = await supertest(server).put('/api/institutions/update/' + mod_inst.id)
        .set('Authorization', 'bearer ' + token_user).send(mod_inst)
        expect(response.statusCode).toBe(403)
    })
})

