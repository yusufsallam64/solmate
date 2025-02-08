import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardContent } from '@/lib/components/ui/card';
import { LoaderCircle, Download } from 'lucide-react';
import SettingsLayout from '@/lib/layouts/SettingsLayout';
import Modal from '@/lib/components/ui/Modal';
import toast from 'react-hot-toast';

interface SubscriptionInfo {
   status: string;
   currentPeriodEnd: string;
   trialEnd: string | null;
   cancelAtPeriodEnd?: boolean;
}

interface Invoice {
   id: string;
   amount: number;
   status: string;
   date: number;
   pdfUrl: string | null;
   periodStart: number;
   periodEnd: number;
}

export default function BillingSettings() {
   const { data: session } = useSession();
   const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
   const [invoices, setInvoices] = useState<Invoice[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [showConfirmModal, setShowConfirmModal] = useState(false);

   useEffect(() => {
      async function fetchData() {
         try {
            const [subResponse, invoicesResponse] = await Promise.all([
               fetch('/api/user/subscription'),
               fetch('/api/stripe/get-invoices')
            ]);

            if (subResponse.ok) {
               const subData = await subResponse.json();
               setSubscription(subData);
            }

            if (invoicesResponse.ok) {
               const invoicesData = await invoicesResponse.json();
               setInvoices(invoicesData);
            }
         } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load billing information');
         } finally {
            setIsLoading(false);
         }
      }

      if (session) {
         fetchData();
      }
   }, [session]);

   const handleSubscriptionAction = async () => {
      const isReactivating = subscription?.cancelAtPeriodEnd;
      try {
         const endpoint = isReactivating ? '/api/stripe/reactivate-subscription' : '/api/stripe/cancel-subscription';
         const response = await fetch(endpoint, {
            method: 'POST',
         });

         if (!response.ok) throw new Error(`Failed to ${isReactivating ? 'reactivate' : 'cancel'} subscription`);

         // Refresh the subscription data
         const newSubResponse = await fetch('/api/user/subscription');
         if (newSubResponse.ok) {
            const data = await newSubResponse.json();
            setSubscription(data);
         }

         setShowConfirmModal(false);
         toast.success(`Subscription ${isReactivating ? 'reactivated' : 'cancelled'} successfully`);
      } catch (error) {
         console.error('Error:', error);
         toast.error(`Failed to ${isReactivating ? 'reactivate' : 'cancel'} subscription`);
      }
   };

   const handleUpdatePayment = async () => {
      try {
         const response = await fetch('/api/stripe/update-payment', {
            method: 'POST',
         });

         if (!response.ok) {
            throw new Error('Failed to access payment update');
         }

         const data = await response.json();
         window.location.href = data.url;
      } catch (error) {
         console.error('Error:', error);
         toast.error('Failed to access payment settings');
      }
   };

   const getStatusDisplay = (status: string, cancelAtPeriodEnd?: boolean) => {
      if (status === 'trialing') return 'Trial Period';
      if (cancelAtPeriodEnd) return 'Active (Cancels at period end)';
      if (status === 'active') return 'Active';
      return status.charAt(0).toUpperCase() + status.slice(1);
   };

   return (
      <SettingsLayout>
         <div className="space-y-6">
            <Card>
               <CardHeader>
                  <h1 className="text-2xl font-bold text-primary-100">Subscription Details</h1>
               </CardHeader>
               <CardContent>
                  {isLoading ? (
                     <div className="flex justify-center py-4">
                        <LoaderCircle className="animate-spin text-accent-400 w-6 h-6" />
                     </div>
                  ) : subscription ? (
                     <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <h3 className="text-sm font-medium text-primary-200 mb-1">Status</h3>
                              <p className="text-primary-100">
                                 {getStatusDisplay(subscription.status, subscription.cancelAtPeriodEnd)}
                              </p>
                           </div>
                           <div>
                              <h3 className="text-sm font-medium text-primary-200 mb-1">Current Period End</h3>
                              <p className="text-primary-100">
                                 {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                              </p>
                           </div>
                        </div>
                     </div>
                  ) : (
                     <p className="text-primary-200 py-2">No active subscription found.</p>
                  )}
               </CardContent>
               {subscription?.status === 'trialing' && (
                  <div className="px-6 py-4 border-t border-accent/10 bg-accent-400/5">
                     <p className="text-accent-400">
                        Your free trial ends on {new Date(subscription.trialEnd!).toLocaleDateString()}
                     </p>
                  </div>
               )}
            </Card>

            {subscription && (
               <div className="space-y-6">
                  <Card>
                     <CardHeader>
                        <h2 className="text-xl font-bold text-primary-100">Payment Method</h2>
                     </CardHeader>
                     <CardContent>
                        <div className="flex items-center justify-between">
                           <p className="text-primary-100">Update Payment in <span className="font-semibold italic">Stripe</span></p>
                           <button
                              onClick={handleUpdatePayment}
                              className="px-4 py-2 rounded-lg bg-accent/10 text-primary-100 hover:bg-accent/20 transition-colors duration-200"
                           >
                              Update
                           </button>
                        </div>
                     </CardContent>
                  </Card>

                  <Card>
                     <CardHeader>
                        <h2 className="text-xl font-bold text-primary-100">Billing History</h2>
                     </CardHeader>
                     <CardContent>
                        {invoices.length > 0 ? (
                           <div className="overflow-x-auto">
                              <table className="w-full">
                                 <thead>
                                    <tr className="text-left border-b border-accent/10">
                                       <th className="pb-2 text-primary-200 font-medium">Date</th>
                                       <th className="pb-2 text-primary-200 font-medium">Amount</th>
                                       <th className="pb-2 text-primary-200 font-medium">Status</th>
                                       <th className="pb-2 text-primary-200 font-medium">Invoice</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {invoices.map((invoice) => (
                                       <tr key={invoice.id} className="border-b border-accent/10">
                                          <td className="py-3 text-primary-100">
                                             {new Date(invoice.date * 1000).toLocaleDateString()}
                                          </td>
                                          <td className="py-3 text-primary-100">
                                             ${(invoice.amount / 100).toFixed(2)}
                                          </td>
                                          <td className="py-3 text-primary-100 capitalize">
                                             {invoice.status}
                                          </td>
                                          <td className="py-3">
                                             {invoice.pdfUrl && (
                                                <a
                                                   href={invoice.pdfUrl}
                                                   target="_blank"
                                                   rel="noopener noreferrer"
                                                   className="text-accent-400 hover:text-accent-500 inline-flex items-center gap-1"
                                                >
                                                   <Download size={16} />
                                                   <span>PDF</span>
                                                </a>
                                             )}
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        ) : (
                           <p className="text-primary-200 py-2">No invoices found.</p>
                        )}
                     </CardContent>
                  </Card>

                  {(subscription.status === 'active' || subscription.status === 'trialing') && (
                     <button
                        onClick={() => setShowConfirmModal(true)}
                        className={`w-full py-2 px-4 rounded-lg transition-colors duration-200 ${subscription.cancelAtPeriodEnd
                              ? 'bg-accent-500/10 text-accent-500 hover:bg-accent-500/20'
                              : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500'
                           }`}
                     >
                        {subscription.cancelAtPeriodEnd ? 'Reactivate Subscription' : 'Cancel Subscription'}
                     </button>
                  )}
               </div>
            )}
         </div>

         {/* Confirmation Modal */}
         <Modal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            title={subscription?.cancelAtPeriodEnd ? 'Reactivate Subscription' : 'Cancel Subscription'}
         >
            <div className="space-y-4">
               <p className="text-primary-200">
                  {subscription?.cancelAtPeriodEnd
                     ? 'Are you sure you want to reactivate your subscription? You will continue to be billed after your current period ends.'
                     : 'Are you sure you want to cancel your subscription? You will still have access until the end of your current billing period.'}
               </p>
               <div className="flex justify-end space-x-3 mt-6">
                  <button
                     onClick={() => setShowConfirmModal(false)}
                     className="bg-accent/10 text-primary-200 hover:bg-accent/20 px-4 py-2 rounded-sm"
                  >
                     Cancel
                  </button>
                  <button
                     onClick={handleSubscriptionAction}
                     className={subscription?.cancelAtPeriodEnd
                        ? 'bg-accent-500/10 text-accent-500 hover:bg-accent-500/20 px-4 py-2 rounded-sm'
                        : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2 rounded-sm'}
                  >
                     {subscription?.cancelAtPeriodEnd ? 'Yes, Reactivate' : 'Yes, Cancel'}
                  </button>
               </div>
            </div>
         </Modal>
      </SettingsLayout>
   );
}