import express from "express";
import "@sdk/api-lib"
import {authController} from "./controller";
import {fakeSessionScheme} from "./validation";
import {Middleware, App} from "@sdk/api-lib";
import process from "process";

// get code
const codeKey = process.env.CODE_KEY || 'code';

// get shortcuts
const {environment : env, validate} = Middleware;

// create router element
const router = express.Router();

// define routes
router.route('/').get(authController.user)
router.route('/login').get(authController.login);
router.route('/logout').get(authController.logout)
router.route(`/${codeKey}`).get(authController.code);
router.route('/fake').get(env(['dev', 'test']), validate(fakeSessionScheme), authController.fake);

// update module
export const ItemModule = App(router);