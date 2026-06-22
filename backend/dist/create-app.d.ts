import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Express } from 'express';
export declare function createApp(): Promise<INestApplication>;
export declare function getExpressInstance(): Promise<Express>;
