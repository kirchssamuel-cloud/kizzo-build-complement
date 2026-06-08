import { describe, expect, it } from 'vitest';
import { api } from './helpers';

describe('GET /api/health', () => {
  it('répond 200', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
  });
});

describe('Route inconnue', () => {
  it('renvoie 404 via notFoundHandler', async () => {
    const res = await api().get('/api/route-qui-nexiste-pas');
    expect(res.status).toBe(404);
  });
});
