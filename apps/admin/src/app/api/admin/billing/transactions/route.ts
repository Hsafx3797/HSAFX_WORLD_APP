/**
 * Billing Transactions API Routes
 * GET /api/admin/billing/transactions
 * 
 * Real database implementation using Drizzle ORM
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, users, coinTransactions, tools, eq, and, or, sql, desc, asc } from '@hsafx/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search')?.toLowerCase();
    const type = searchParams.get('type');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    
    // Type filter
    if (type) {
      conditions.push(eq(coinTransactions.type, type));
    }

    // Build where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Query transactions with user info
    const transactionsQuery = db
      .select({
        id: coinTransactions.id,
        userId: coinTransactions.userId,
        userEmail: users.email,
        type: coinTransactions.type,
        amount: coinTransactions.amount,
        balanceAfter: coinTransactions.balanceAfter,
        reason: coinTransactions.reason,
        resourceType: coinTransactions.resourceType,
        resourceId: coinTransactions.resourceId,
        metadata: coinTransactions.metadata,
        createdAt: coinTransactions.createdAt,
      })
      .from(coinTransactions)
      .innerJoin(users, eq(coinTransactions.userId, users.id))
      .where(whereClause)
      .orderBy(
        sortOrder === 'desc'
          ? desc(coinTransactions.createdAt)
          : asc(coinTransactions.createdAt)
      )
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(coinTransactions)
      .where(whereClause);

    // Execute queries in parallel
    const [transactionResults, countResults] = await Promise.all([
      transactionsQuery,
      countQuery,
    ]);

    // Enrich transactions with tool info if applicable
    const enrichedTransactions = await Promise.all(
      transactionResults.map(async (tx) => {
        let toolName: string | undefined;
        let toolId: string | undefined;

        // If this is a tool usage transaction, get tool info
        if (tx.resourceType === 'tool' && tx.resourceId) {
          const [tool] = await db
            .select({ name: tools.name, slug: tools.slug })
            .from(tools)
            .where(eq(tools.id, tx.resourceId))
            .limit(1);
          
          toolName = tool?.name;
          toolId = tool?.slug;
        }

        // Extract admin info from metadata if it's an adjustment
        const metadata = (tx.metadata || {}) as Record<string, unknown>;

        return {
          id: tx.id,
          userId: tx.userId,
          userEmail: tx.userEmail,
          type: tx.type,
          amount: tx.amount,
          balanceAfter: tx.balanceAfter,
          description: tx.reason,
          toolId,
          toolName,
          adminId: metadata.adminId as string | undefined,
          adminEmail: metadata.adminEmail as string | undefined,
          metadata: tx.metadata,
          createdAt: tx.createdAt?.toISOString(),
        };
      })
    );

    // Apply search filter (after enrichment)
    let filteredTransactions = enrichedTransactions;
    if (search) {
      filteredTransactions = enrichedTransactions.filter(
        (t) =>
          (t.userEmail?.toLowerCase() || '').includes(search) ||
          (t.description?.toLowerCase() || '').includes(search) ||
          (t.toolName?.toLowerCase() || '').includes(search)
      );
    }

    const total = countResults[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: filteredTransactions,
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json(
      { code: 'FETCH_ERROR', message: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
