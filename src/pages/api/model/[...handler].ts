import type { NextApiRequest, NextApiResponse } from "next";
import { run, generateTitle } from "@/lib/model/worker";
import { DatabaseService } from "@/lib/db/service";
import { ObjectId } from 'mongodb';
import type { Problem, Message } from "@/lib/db/types";
import { authenticateRequest } from '../problemsets';

if(!process.env.OPENAI_API_KEY) {
  throw new Error("Missing required environment variable: OPENAI_API_KEY");
}

type Data = {
  modelResponse: string;
  title?: string;
  problem?: any; 
  messages?: Message[];
};

const QUESTION_MASTER_PROMPT = "\
  You are a teacher that is watching over a student as they do work. You are talking to the student directly, refer to them using the second person. \
  Whenever you receive one of these questions, you are to provide a guiding questions to push the student towards the correct answer. \
  You will be given the problem statement as well as the student's current attempted solution. \
  Under no circumstances are you to provide the direct answer to the student unless they have reached a functional solution. \
  Answer in the same language that the user is using. \
  If the solution is correct, respond with: 'That is correct!' \
  If the solution that you have already been presented with is valid, even if it is the original solution, you are to respond with: 'That is correct!' \
  Only respond with 3 effective guiding questions in the format:\n \
  1.\n \
  2.\n  \
  3.\n  \
  "

const CLARIFY_MASTER_PROMPT = "\
  You are a teacher that is meant to guide students towards correct answers. You are talking to the student directly. \
  In the event that you are asked a question regarding something you formerly said, \
  you are to provide clarification regarding specifically what they asked about. \
  Do not provide extra information beyond what the student needed clarification with.\
  Respond concisely and clearly, ensuring that you are not misleading the student or providing unnecessary context and information. \
  Answer in the same language that the user is using. \
  Under no circumstances do you give the student the answer prematurely. You are only to tell them if they are correct if the answer they provide is valid. \
  Otherwise, you are to guide them towards the correct answer."

async function createProblemAndMessages(
  title: string, 
  problemSetId: string | null, 
  userMessage: { role: 'user', content: string },
  assistantMessage: { role: 'assistant', content: string },
  userId: string
): Promise<{ problem: Problem, messages: Message[] }> {
  const finalProblemSetId = problemSetId ? 
    new ObjectId(problemSetId) : 
    await DatabaseService.createProblemSet({
      title: 'New Problem Set',
      userId: new ObjectId(userId),
      status: 'active'
    });

  const problemId = await DatabaseService.createProblem({
    problemSetId: finalProblemSetId,
    title,
    userId: new ObjectId(userId),
    status: 'unsolved'
  });

  // Create user message
  const userMessageId = await DatabaseService.createMessage({
    problemId,
    userId: new ObjectId(userId),
    ...userMessage
  });

  // Create assistant message
  const assistantMessageId = await DatabaseService.createMessage({
    problemId,
    userId: new ObjectId(userId),
    ...assistantMessage
  });

  // Fetch the created problem and messages
  const [problem, messages] = await Promise.all([
    DatabaseService.getProblem(problemId),
    DatabaseService.getProblemMessages(problemId)
  ]);

  if (!problem) throw new Error("Failed to create problem");

  return { problem, messages };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  console.log('🚀 Model API Request received:');
  console.log('📍 Method:', req.method);
  console.log('🔍 Query:', req.query);
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));

  if (!req.method || req.method !== "POST") {
    console.log('❌ Method not allowed:', req.method);
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ modelResponse: "Method not allowed" });
  }

  const userId = await authenticateRequest(req, res);
  console.log('👤 Authenticated userId:', userId);

  if (!userId) {
    console.log('❌ Unauthorized - No userId');
    return res.status(401).json({ modelResponse: "Unauthorized" });
  }

  if (!req.body || !req.body.interactionMessages) {
    console.log('❌ Bad request - Missing required fields');
    return res.status(400).json({ modelResponse: "Bad request" });
  }

  const { interactionMessages, problemSetId } = req.body;
  const isFirstMessage = interactionMessages.length === 1;

  const handler = req.query.handler;
  
  if (!Array.isArray(handler) || handler.length === 0) {
    console.log('❌ Invalid route');
    return res.status(400).json({ modelResponse: "Invalid route" });
  }

  const routeType = handler[0];
  
  try {
    switch (routeType.toLowerCase()) {
      case "question":
      case "clarify": {
        console.log('🎯 Processing', routeType, 'request');
        const masterPrompt = routeType.toLowerCase() === "question" 
          ? QUESTION_MASTER_PROMPT 
          : CLARIFY_MASTER_PROMPT;

        const { modelResponse } = await run(masterPrompt, interactionMessages);

        if (isFirstMessage) {
          console.log('📝 Processing first message');
          const title = await generateTitle(masterPrompt, interactionMessages[0]);
          
          const { problem, messages } = await createProblemAndMessages(
            title,
            problemSetId,
            interactionMessages[0] as { role: 'user', content: string },
            { role: 'assistant', content: modelResponse },
            userId
          );

          console.log('✅ Created new problem and messages');
          return res.status(200).json({ 
            modelResponse, 
            title,
            problem,
            messages
          });
        } else {
          console.log('📝 Processing follow-up message');
          const problemId = new ObjectId(req.body.problemId);
          
          // Create user message
          const userMessageId = await DatabaseService.createMessage({
            problemId,
            userId: new ObjectId(userId),
            role: 'user',
            content: interactionMessages[interactionMessages.length - 1].content
          });

          // Create assistant message
          const assistantMessageId = await DatabaseService.createMessage({
            problemId,
            userId: new ObjectId(userId),
            role: 'assistant',
            content: modelResponse
          });

          // Fetch the newly created messages
          const messages = await DatabaseService.getProblemMessages(problemId);
          
          console.log('✅ Created follow-up messages');
          return res.status(200).json({ 
            modelResponse,
            messages 
          });
        }
      }
      default:
        console.log('❌ Invalid route type:', routeType);
        return res.status(400).json({ modelResponse: "Invalid route" });
    }
  } catch (error) {
    console.error('❌ Error in handler:', error);
    return res.status(500).json({ 
      modelResponse: "Internal server error" 
    });
  }
}