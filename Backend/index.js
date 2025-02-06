import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import db from './config/db.js';
import apiRoutes from './routes/api.js';

