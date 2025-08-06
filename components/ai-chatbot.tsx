"use client"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"
import { useAuth } from "@/context/Auth/AuthContext"

export function AIChatbot() {
  const { user, loading: authLoading } = useAuth()

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    headers: {
      Authorization: user ? `Bearer ${user.token}` : "",
    },
  })

  if (authLoading) {
    return (
      <Card className="flex flex-col h-[500px] items-center justify-center text-lg text-muted-foreground">
        Loading AI Chatbot...
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="flex flex-col h-[500px] items-center justify-center text-lg text-muted-foreground">
        Please log in to use the AI Assistant.
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader>
        <CardTitle>TaskZen AI Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground">
              Ask me anything about productivity, tasks, or general knowledge!
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`mb-4 ${m.role === "user" ? "text-right" : "text-left"}`}>
              <div
                className={`inline-block p-2 rounded-lg max-w-[80%] ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-center text-muted-foreground">AI is thinking...</div>}
          {error && <div className="text-center text-red-500">Error: {error.message}</div>}
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
