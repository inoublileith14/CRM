import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';
import { AppModule } from './app.module';

let cachedApp: INestApplication | null = null;

export async function createApp(): Promise<INestApplication> {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  expressApp.use(express.json({ limit: '10mb' }));
  expressApp.use(express.urlencoded({ limit: '10mb', extended: true }));

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  await app.init();
  cachedApp = app;
  return app;
}

export async function getExpressInstance(): Promise<Express> {
  const app = await createApp();
  return app.getHttpAdapter().getInstance() as Express;
}
