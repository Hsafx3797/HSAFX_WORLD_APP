/**
 * Creates a test API key in the database for testing B2B API endpoints.
 * Usage: node node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/cli.mjs scripts/create-test-api-key.ts
 */

import { createHash, randomBytes } from 'crypto';

// Generate a test API key
const KEY_RANDOM_LENGTH = 52;
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const bytes = randomBytes(KEY_RANDOM_LENGTH);
let random = '';
for (let i = 0; i < KEY_RANDOM_LENGTH; i++) {
    random += chars[bytes[i]! % chars.length];
}
const plaintext = `hsafx_test_${random}`;
const hash = createHash('sha256').update(plaintext).digest('hex');
const prefix = plaintext.slice(0, 14);

console.log('=== Test API Key Created ===');
console.log(`Plaintext: ${plaintext}`);
console.log(`Hash:      ${hash}`);
console.log(`Prefix:    ${prefix}`);

// Now insert into DB
import { db, apiKeys } from '@hsafx/db';

async function main() {
    // Get a user ID from the DB first
    const users = await db.query.users.findMany({ limit: 1 });

    let userId: string;
    if (users.length > 0) {
        userId = users[0].id;
        console.log(`Using existing user: ${userId}`);
    } else {
        console.log('No users found. Creating a dummy user first...');
        const result = await db.insert((await import('@hsafx/db')).users).values({
            name: 'Test API User',
            email: 'test-api@hsafx.com',
        }).returning();
        userId = result[0].id;
        console.log(`Created test user: ${userId}`);
    }

    // Insert the API key
    const result = await db.insert(apiKeys).values({
        userId,
        name: 'Test API Key',
        keyHash: hash,
        keyPrefix: prefix,
        rateLimitTier: 'pro',
        metadata: {
            scopes: ['tools:read', 'tools:execute', 'billing:read', 'admin:*'],
        },
        isActive: true,
    }).returning();

    console.log(`\nAPI Key inserted with ID: ${result[0].id}`);
    console.log(`\nUse this key in API requests:`);
    console.log(`  Authorization: Bearer ${plaintext}`);
    console.log(`  -or- X-HSAFX-API-Key: ${plaintext}`);

    process.exit(0);
}

main().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});
