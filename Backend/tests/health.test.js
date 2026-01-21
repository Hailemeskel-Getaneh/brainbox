import request from 'supertest';
import { app } from '../src/app.js';

describe('Health Check', () => {
    it('should return 200 OK from the health check endpoint', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ status: 'ok', message: 'Backend is running' });
    });

    it('should always pass', () => {
        expect(true).toBe(true);
    });
});
