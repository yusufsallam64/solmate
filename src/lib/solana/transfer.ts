import { PublicKey, Connection, clusterApiUrl, Transaction, SystemProgram, LAMPORTS_PER_SOL, Commitment } from '@solana/web3.js';

interface ToolCallResult {
  tool: string;
  result?: string;
  error?: string;
}

export async function handleToolCalls(toolCalls: Array<{ name: string; arguments: Record<string, any> }>): Promise<ToolCallResult[]> {
  console.log('Handling tool calls:', toolCalls);
  console.log(toolCalls[0].arguments)
  if (!toolCalls?.length) return [];
  const results: ToolCallResult[] = [];
  
  for (const toolCall of toolCalls) {
    try {
      switch (toolCall.name) {
        case 'transferSol': {
          let { address, recipient, amount, network } = toolCall.arguments;
          
          // Additional validation
          if (!recipient && !address) {
            console.error('Missing recipient address');
            throw new Error('Recipient address is required');
          }

          recipient = recipient || address;
          
          if (amount === undefined || amount === null) {
            console.error('Missing amount');
            throw new Error('Transfer amount is required');
          }

          // Log the values we're working with
          console.log('Transfer details:', {
            recipient,
            amount,
            network
          });
          
          // Validate recipient address
          try {
            const recipientPubKey = new PublicKey(recipient);
            console.log('Valid recipient public key:', recipientPubKey.toString());
          } catch (e) {
            console.error('Invalid recipient address:', e);
            throw new Error(`Invalid recipient address: ${recipient}`);
          }

          // Validate amount
          const parsedAmount = parseFloat(amount);
          if (isNaN(parsedAmount) || parsedAmount <= 0) {
            throw new Error('Amount must be greater than 0');
          }

          // Get Phantom wallet
          const phantom = (window as any).solana;
          if (!phantom) {
            throw new Error('Phantom wallet is not available');
          }

          // Connect to wallet
          console.log('Connecting to Phantom wallet...');
          const connection = await phantom.connect();
          const senderPublicKey = connection.publicKey.toString();
          console.log('Connected with public key:', senderPublicKey);

          // Setup RPC connection
          const rpcUrl = network === 'mainnet'
            ? (process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com')
            : clusterApiUrl(network as 'devnet' | 'testnet');
          
          console.log('Using RPC URL:', rpcUrl);
          const rpcConnection = new Connection(rpcUrl, 'confirmed' as Commitment);

          // Get latest blockhash
          const { blockhash, lastValidBlockHeight } = await rpcConnection.getLatestBlockhash();
          console.log('Got blockhash:', blockhash);

          // Create transaction
          const lamports = parsedAmount * LAMPORTS_PER_SOL;
          const transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: new PublicKey(senderPublicKey),
              toPubkey: new PublicKey(recipient),
              lamports,
            })
          );

          // Set transaction params
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = new PublicKey(senderPublicKey);

          // Sign and send transaction
          console.log('Requesting transaction signature...');
          const signedTx = await phantom.signTransaction(transaction);
          const rawTransaction = signedTx.serialize();
          const txSignature = await rpcConnection.sendRawTransaction(rawTransaction);
          console.log('Transaction sent with signature:', txSignature);

          // Confirm transaction
          console.log('Waiting for confirmation...');
          await rpcConnection.confirmTransaction({
            signature: txSignature,
            blockhash,
            lastValidBlockHeight
          }, 'confirmed');
          console.log('Transaction confirmed!');

          results.push({
            tool: toolCall.name,
            result: `Successfully transferred ${parsedAmount} SOL to ${recipient}. Transaction ID: ${txSignature}`
          });
          break;
        }
        default:
          results.push({
            tool: toolCall.name,
            error: 'Unknown tool'
          });
      }
    } catch (error) {
      console.error('Tool call error:', error);
      results.push({
        tool: toolCall.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  return results;
}