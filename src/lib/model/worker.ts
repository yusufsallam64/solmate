import { AIRequest, AIResponse, Message } from "./types";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing required environment variable: OPENAI_API_KEY");
}

type Data = {
  modelResponse: string;
  title?: string | undefined;
};



export async function runImage(masterPrompt: string, imageUrl: string): Promise<Data> {
  let messages: any = [
    {
      role: "system",
      content: masterPrompt,
    },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: imageUrl,
            detail: process.env.OPENAI_IMAGE_DETAIL ?? "low",
          }
        }
      ]
    }
  ]

  let modelResponse = await sendLLMRequest({ messages });

  if (!modelResponse.success) {
    console.error("Model failed to generate a response");
    return { modelResponse: modelResponse.errors.map((error) => error.message).join(", ") }
  }

  // TODO --> might want to return the messages from this as well
  return { modelResponse: modelResponse.result.response };
}

export async function generateTitle(masterPrompt: string, firstMessage: Message): Promise<string> {
  const titlePrompt = "Create a concise, 3-5 word phrase as a header for the following query, strictly adhering to the 3-5 word limit and avoiding the use of the word 'title' and any punctuation or formatting.";
  
  let messages: Message[] = [
    {
      role: "system",
      content: titlePrompt,
    },
    firstMessage
  ];

  let modelResponse = await sendLLMRequest({ messages });

  if (!modelResponse.success) {
    return "New Conversation";
  }

  return modelResponse.result.response.trim();
}

export async function run(masterPrompt: string, interactionMessages: Message[]): Promise<Data> {
  let messages: Message[] = [
    {
      role: "system",
      content: masterPrompt,
    },
    ...interactionMessages.slice(-16).map((message: any) => {
      return {
        role: message.role,
        content: message.content,
      };
    })
  ];

  let modelResponse = await sendLLMRequest({ messages });

  if (!modelResponse.success) {
    console.error("Model failed to generate a response");
    return { modelResponse: modelResponse.errors.map((error) => error.message).join(", ") };
  }

  return { modelResponse: modelResponse.result.response };
}

async function sendLLMRequest(input: AIRequest): Promise<AIResponse> {
  try {
    console.log("sending over messages: ");
    input.messages.map((message) => console.log({ role: message.role, content: message.content }));

    const response = await fetch(
      `https://api.openai.com/v1/chat/completions`,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          messages: input.messages.map((message) => { return { role: message.role, content: message.content } }),
        }),
      }
    );

    if (!response.ok) {
      console.error("res: ", response)
      console.error("status text: ", response.statusText)
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: any = await response.json();
    console.log("Model response:", result.choices[0].message);
    return {
      result: {
        response: result.choices[0].message.content,
      },
      success: result.choices[0].message.refusal === null,
      errors: [],
      messages: [], // is this an issue?
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to run AI model: ${error.message}`);
    }
    throw error;
  }
}

