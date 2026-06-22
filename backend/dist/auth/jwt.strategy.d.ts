import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { JwtPayload } from './interfaces/user.interface';
import { UsersService } from './users.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private usersService;
    constructor(config: ConfigService, usersService: UsersService);
    validate(payload: JwtPayload): Promise<import("./interfaces/user.interface").UserProfile>;
}
export {};
