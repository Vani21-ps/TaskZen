import { streamText } from "ai"
import { groq } from "@ai-sdk/groq"
import jwt from "jsonwebtoken"

async function verifyToken(token: string) {
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error("JWT_SECRET is not defined in environment variables.")
    }
    const decoded = jwt.verify(token, secret)
    return decoded // Contains user ID and other payload data
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ message: "Not authorized, no token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const token = authHeader.split(" ")[1]
  const decodedUser = await verifyToken(token)

  if (!decodedUser) {
    return new Response(JSON.stringify({ message: "Not authorized, token failed" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { messages } = await req.json()

  try {
    const result = await streamText({
      model: groq("llama3-8b-8192"),
      messages,
      system:
        "You are a helpful assistant for a productivity app called TaskZen. You can answer questions about tasks, productivity, and general knowledge. Keep your responses concise and helpful.",
    })

    return result.toAIStreamResponse() // Corrected method for AI SDK v3
  } catch (error) {
    console.error("API Chat - Error calling AI model:", error)
    return new Response(JSON.stringify({ message: "Error generating AI response" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
