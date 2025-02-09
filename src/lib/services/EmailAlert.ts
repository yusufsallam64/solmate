// lib/services/EmailAlert.ts
export class EmailAlert {
   async sendAlert(
     recipientEmail: string,
     subject: string,
     body: string
   ): Promise<boolean> {
     try {
       const response = await fetch('/api/email/send', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           recipientEmail,
           subject,
           body,
         }),
       });
 
       if (!response.ok) {
         throw new Error('Failed to send email');
       }
 
       console.log(`Email alert sent to ${recipientEmail}`);
       return true;
     } catch (error) {
       console.error('Failed to send email alert:', error);
       return false;
     }
   }
 
   async sendPriceAlert(
     recipientEmail: string,
     symbol: string,
     currentPrice: number,
     targetPrice: number,
     condition: string
   ): Promise<boolean> {
     const subject = `$${symbol} ${condition} ${targetPrice.toFixed(2)}`;
 
     const body = `
       Price Alert for ${symbol}!
 
       Target Price: $${targetPrice.toFixed(2)}
       Current Price: $${currentPrice.toFixed(2)}
       Condition: Price went ${condition} target
 
       Time: ${new Date().toISOString()}
     `;
 
     return this.sendAlert(recipientEmail, subject, body);
   }
 }
 
 // Create a singleton instance
 export const emailAlert = new EmailAlert();