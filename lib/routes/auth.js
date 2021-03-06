const router = require('express').Router();
const { respond } = require('./route-helpers');
const User = require('../models/User');
const { sign } = require('../util/token-service');
const createEnsureAuth = require('../util/ensure-auth');

const hasEmailAndPassword = ({ body }, res, next) => {
    const { email, password } = body;
    if(!email || !password) {
        throw {
            status: 400,
            error: 'Email and Password are Required'
        };
    }
    next();
};

module.exports = router

    .get('/verify', createEnsureAuth(), respond(
        () => Promise.resolve({ verified: true })
    ))

    .post('/signup', hasEmailAndPassword, respond(
        ({ body }) => {
            const { email, password } = body;
            delete body.password;
            return User.exists({ email })
                .then(exists => {
                    if(exists) {
                        throw {
                            status: 400,
                            error: 'Email Already Exists'
                        };
                    }
                    const user = new User(body);
                    user.name = user.name.toLowerCase();
                    user.generateHash(password);
                    return user.save();
                })
                .then(user => {
                    return { token: sign(user) };
                });
        }
    ))

    .post('/signin', hasEmailAndPassword, respond(
        ({ body }) => {
            const { email, password } = body;
            delete body.password;

            return User.findOne({ email })
                .then(user => {
                    if(!user || !user.comparePassword(password)) {
                        throw {
                            status: 401,
                            error: 'Invalid Email or Password'
                        };
                    }
                    return { token: sign(user) };
                });
        }
    ));