'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSubscription } from '@/hooks/use-subscription';
import { useCoins } from '@/hooks/use-coins';

const PLAN_DETAILS: Record<string, { name: string; price: number; emoji: string }> = {
  guest: { name: 'Guest', price: 0, emoji: '👤' },
  free: { name: 'Free', price: 0, emoji: '🆓' },
  pro: { name: 'Pro', price: 10, emoji: '⚡' },
  advance: { name: 'Advance', price: 20, emoji: '🚀' },
};

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  downloadUrl: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  email?: string;
  isDefault: boolean;
}

export default function BillingSettingsPage() {
  const { subscription, isLoading: subLoading } = useSubscription();
  const { balance } = useCoins();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);

  useEffect(() => {
    // TODO: Fetch real invoices + payment methods from Stripe API when integration is built
    setLoading(false);
  }, []);

  const handleSetDefault = async (methodId: string) => {
    setPaymentMethods((prev) =>
      prev.map((pm) => ({
        ...pm,
        isDefault: pm.id === methodId,
      }))
    );
  };

  const handleRemoveMethod = async (methodId: string) => {
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== methodId));
  };

  if (loading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/settings" className="hover:text-foreground">Settings</Link>
            <span>/</span>
            <span>Billing</span>
          </div>
          <h1 className="text-3xl font-bold">Billing & Payments</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription, payment methods, and view invoices
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl space-y-8">
          {/* Current Plan Overview */}
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Current Plan</h2>
              <Link
                href="/pricing"
                className="text-sm text-primary hover:underline"
              >
                Change Plan
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {PLAN_DETAILS[subscription?.plan || 'free']?.emoji || '🆓'}
                  </span>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {PLAN_DETAILS[subscription?.plan || 'free']?.name || 'Free'} Plan
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {subscription?.status === 'active' 
                        ? `Renews on ${new Date(subscription.currentPeriodEnd || '').toLocaleDateString()}`
                        : 'No active subscription'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  ${PLAN_DETAILS[subscription?.plan || 'free']?.price || 0}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
              </div>
            </div>

            {/* Coin Balance */}
            <div className="mt-4 p-4 bg-muted/50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🪙</span>
                <div>
                  <h3 className="font-medium">Coin Balance</h3>
                  <p className="text-sm text-muted-foreground">For premium tool usage</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold">{balance}</span>
                <Link
                  href="/dashboard/coins"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Buy Coins
                </Link>
              </div>
            </div>
          </section>

          {/* Payment Methods */}
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Payment Methods</h2>
              <button
                onClick={() => setShowAddPayment(true)}
                className="text-sm text-primary hover:underline"
              >
                + Add New
              </button>
            </div>

            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">
                      {method.type === 'card' ? '💳' : '🅿️'}
                    </span>
                    <div>
                      {method.type === 'card' ? (
                        <>
                          <p className="font-medium">
                            {method.brand} •••• {method.last4}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expires {method.expiryMonth}/{method.expiryYear}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium">PayPal</p>
                          <p className="text-sm text-muted-foreground">{method.email}</p>
                        </>
                      )}
                    </div>
                    {method.isDefault && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <button
                        onClick={() => handleSetDefault(method.id)}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveMethod(method.id)}
                      className="text-sm text-destructive hover:text-destructive/80"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {paymentMethods.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No payment methods added yet.</p>
                  <button
                    onClick={() => setShowAddPayment(true)}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Add Payment Method
                  </button>
                </div>
              )}
            </div>

            {/* Add Payment Modal */}
            {showAddPayment && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
                  <h3 className="text-lg font-semibold mb-6">Add Payment Method</h3>
                  
                  <div className="space-y-4">
                    <button className="w-full p-4 border border-border rounded-lg flex items-center gap-4 hover:bg-muted/50 transition-colors">
                      <span className="text-2xl">💳</span>
                      <div className="text-left">
                        <p className="font-medium">Credit/Debit Card</p>
                        <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex</p>
                      </div>
                    </button>
                    
                    <button className="w-full p-4 border border-border rounded-lg flex items-center gap-4 hover:bg-muted/50 transition-colors">
                      <span className="text-2xl">🅿️</span>
                      <div className="text-left">
                        <p className="font-medium">PayPal</p>
                        <p className="text-sm text-muted-foreground">Pay with PayPal account</p>
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowAddPayment(false)}
                    className="w-full mt-6 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Billing History */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-6">Billing History</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-border last:border-0">
                      <td className="py-4 px-4 text-sm">
                        {new Date(invoice.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-sm">{invoice.description}</td>
                      <td className="py-4 px-4 text-sm font-medium">
                        ${invoice.amount.toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                            invoice.status === 'paid'
                              ? 'bg-success/10 text-success'
                              : invoice.status === 'pending'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <a
                          href={invoice.downloadUrl}
                          className="text-sm text-primary hover:underline"
                        >
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {invoices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No invoices yet.</p>
              </div>
            )}
          </section>

          {/* Billing Address */}
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Billing Address</h2>
              <button className="text-sm text-primary hover:underline">
                Edit
              </button>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
              <p>No billing address on file.</p>
            </div>
          </section>

          {/* Cancel Subscription */}
          {subscription?.status === 'active' && (
            <section className="bg-card border border-destructive/30 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 text-destructive">Cancel Subscription</h2>
              <p className="text-sm text-muted-foreground mb-4">
                If you cancel your subscription, you&apos;ll lose access to premium features at the end of your current billing period.
              </p>
              <button className="px-4 py-2 border border-destructive text-destructive rounded-lg text-sm font-medium hover:bg-destructive/10 transition-colors">
                Cancel Subscription
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
