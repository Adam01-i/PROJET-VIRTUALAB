import { useState } from "react"
import { Button } from "./AiButton"
import { Input } from "./AiInput"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./AiCard"
import { MessageCircle, X, Send, Bot, User } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ChatbotProps {
  className?: string
}

export function Chatbot({ className }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setLoading] = useState(false)

  const toggleChat = () => setIsOpen(!isOpen)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    const newMessages = [...messages, { role: "user", content: input }]
    setMessages(newMessages)
    setInput("")

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    if (!res.ok) {
      const error = await res.json();
      setMessages([...newMessages, { role: "assistant", content: error.error || "Erreur" }]);
      setLoading(false);
      return;
    }

    const data = await res.json();

    setMessages([...newMessages, { role: "assistant", content: data.message }])
    setLoading(false)
  }

  return (
    <>
      <motion.div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button onClick={toggleChat} className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg">
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)]"
          >
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bot className="h-5 w-5" />
                  Assistant Chimie
                </CardTitle>
                <p className="text-sm text-blue-100">Posez vos questions sur la chimie !</p>
              </CardHeader>

              <CardContent className="h-80 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                    <p className="text-sm">Je suis votre assistant en chimie. Posez-moi des questions !</p>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex gap-2 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                          }`}
                      >
                        {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div
                        className={`p-3 rounded-lg ${msg.role === "user"
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-800 rounded-bl-sm"
                          }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="bg-gray-100 p-3 rounded-lg rounded-bl-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>

              <CardFooter className="p-4 border-t">
                <form onSubmit={handleSubmit} className="flex w-full gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Posez votre question sur la chimie..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading || !input.trim()} className="bg-blue-600 hover:bg-blue-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
