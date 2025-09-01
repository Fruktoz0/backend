// Auto Generated Test.js file

const express = require('express')
const supertest = require('supertest')
const authRoutes = require('./authRoutes');
const usersRoutes = require('./usersRoutes')
const institutionsRoutes = require('./institutionsRoutes')

const server = express()
server.use(express.json())
server.use('/api/auth', authRoutes);
server.use('/api/institutions', institutionsRoutes);
server.use('/', usersRoutes);

var token_admin = {};
var logged_admin = {};
var token_worker = {};
var logged_worker = {};
var token_user = {};
var logged_user = {};

var user_all = {};
var validRoles = ["user", "worker", "inspector", "institution"]
var validStatus = ["active", "inactive"]
var new_role = '';
var inst_all = {};
var sel_inst = {};

describe('test for "Login" route', () => {
    test('Login as Admin    s11 [200]', async () => {
        const response = await supertest(server).post('/api/auth/login').send({ email: 'admin@admin.hu', password: 'admin123' })
        expect(response.statusCode).toBe(200)
        token_admin = response.body.token;
        logged_admin = JSON.parse(atob(token_admin.split('.')[1]));
        console.log("Logged Admin: ", logged_admin);
    })
})

describe('test for "Login" route', () => {
    test('Admin Get User Data by Email [200]', async () => {
        const response = await supertest(server).post('/admin/user_en')
        .send({ email: 'pepe2@smd.hu' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(200)
        sel_user = response.body[0]
        console.log(sel_user);
    })
})

describe('test for "Login" route', () => {
    test('Admin modify User to Active [200]', async () => {
        const response = await supertest(server).put('/admin/user/' + sel_user.id)
        .send({ isActive: 'active' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(200)
    })
})

describe('test for "Login" route', () => {
    test('Login as User     s11 [200]', async () => {
        const response = await supertest(server).post('/api/auth/login').send({ email: 'pepe2@smd.hu', password: 'Meki#012345' })
        expect(response.statusCode).toBe(200)
        token_user = response.body.token;
        logged_user = JSON.parse(atob(token_user.split('.')[1]));
        console.log("Logged user: ", logged_user);
    })
})

describe('test for "Login" route', () => {
    test('Login as Worker   s11 [200]', async () => {
        const response = await supertest(server).post('/api/auth/login').send({ email: 'zoardakarki@gmail.com', password: '123456789' })
        expect(response.statusCode).toBe(200)
        token_worker = response.body.token;
        logged_worker = JSON.parse(atob(token_worker.split('.')[1]));
        console.log("Logged Worker: ", logged_worker);
    })
})

describe('User Data of "users" route:', () => {
    test('GetUser Data with token_user FORBIDDEN [403]', async () => {
        const response = await supertest(server).get('/admin/users')
        .set('Authorization', 'bearer ' + token_worker)
        expect(response.statusCode).toBe(403)
        console.log(response.body);
    })
    test('GetUser Data with token_admin [200]', async () => {
        const response = await supertest(server).get('/admin/users')
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(200)
        const user_all = response.body
        console.log("User All: ", user_all.length, user_all)
        for (const item of user_all) {
            if (item.username.indexOf("Meki Admin") == 0) { sel_user = item }
        }
        console.log("Sel. User: ", sel_user)
    })
})

describe('User Data of "users" route:', () => {
    test('Admin mod. Selected User to another Role/Status [200]', async () => {
        new_role = validRoles[(validRoles.indexOf(sel_user.role) + 1) % validRoles.length]
        const response = await supertest(server).put('/admin/user/' + sel_user.id)
        .send({ role: new_role })
        .set('Authorization', 'bearer ' + token_admin)
        console.log(sel_user.username, ":", new_role)
        expect(response.statusCode).toBe(200)
    })
    test('Worker mod. Selected User to another Role/Status - FORBIDDEN [403]', async () => {
        new_role = validRoles[(validRoles.indexOf(sel_user.role) + 2) % validRoles.length]
        const response = await supertest(server).put('/admin/user/' + sel_user.id)
        .send({ role: new_role })
        .set('Authorization', 'bearer ' + token_worker)
        console.log(sel_user.username, ":", new_role)
        expect(response.statusCode).toBe(403)
    })
    test('User mod. Own Role/Status to another Role/Status - FORBIDDEN [403]', async () => {
        new_role = validRoles[(validRoles.indexOf(sel_user.role) + 2) % validRoles.length]
        const response = await supertest(server).put('/admin/user/' + sel_user.id)
        .send({ role: new_role })
        .set('Authorization', 'bearer ' + token_user)
        console.log(sel_user.username, ":", new_role)
        expect(response.statusCode).toBe(403)
    })
})

describe('GetList of "Institutions" route:', () => {
    test('Get Institutions List [200]', async () => {
        const response = await supertest(server).get('/api/institutions/')
        expect(response.statusCode).toBe(200)
        const inst_all = response.body
        sel_inst=inst_all[Math.floor(Math.random() * inst_all.length)]
        console.log("Sel. Inst: ", sel_inst)
    })
})

describe('User Data of "users" route 2:', () => {
    test('User modify own Institution Random - FORBIDDEN [403]', async () => {
        console.log("Mod. Sel. Inst: ", sel_inst)
        console.log("Mod. Sel. Inst.ID: ", sel_inst.id)
        const response = await supertest(server).put('/admin/user/' + logged_user.id + '/institution')
        .send({ institutionId: sel_inst.id })
        .set('Authorization', 'bearer ' + token_user)
        expect(response.statusCode).toBe(403)
    })
    test('Admin modify User Institution Random [200]', async () => {
        const response = await supertest(server).put('/admin/user/' + logged_user.id + '/institution')
        .send({ institutionId: sel_inst.id })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(200)
    })
    test('Admin modify User Institution with Wrong User.ID [404]', async () => {
        const response = await supertest(server).put('/admin/user/123456789/institution')
        .send({ institutionId: sel_inst.id })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(404)
    })
    test('Admin modify User Institution with Wrong Inst.ID [400]', async () => {
        const response = await supertest(server).put('/admin/user/' + logged_user.id + '/institution')
        .send({ institutionId: '0123456789' })
        .set('Authorization', 'bearer ' + token_admin)
        expect(response.statusCode).toBe(400)
    })
})

