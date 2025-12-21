import { useState, useCallback } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chat } from '@/components/ui/chat';
import { type Message } from '@/components/ui/chat-message';
import { useChat } from '@/contexts/ChatContext';
import { cn } from '@/lib/utils';

export function AIChatPanel() {
  const { isOpen, setIsOpen } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = useCallback((event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();

    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    // Simulate AI response (replace with actual API call later)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm your AI assistant! This is a placeholder response. Soon I'll be able to help you with your courses and lessons.",
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsGenerating(false);
    }, 1000);
  }, [input]);

  const append = useCallback((message: { role: 'user'; content: string }) => {
    setInput(message.content);
    handleSubmit();
  }, [handleSubmit]);

  const suggestions = [
    "What courses do I have?",
    "Help me understand this lesson",
    "What should I learn next?",
  ];

  return (
    <div
      className={cn(
        "flex h-full flex-col border-l border-border bg-background transition-all duration-300 ease-in-out",
        isOpen ? "w-[400px] opacity-100" : "w-0 opacity-0 overflow-hidden border-l-0"
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <span className="font-semibold">AI Assistant</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <Chat
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isGenerating={isGenerating}
          append={append}
          suggestions={suggestions}
          setMessages={setMessages}
          className="h-full p-4"
        />
      </div>
    </div>
  );
}

// Toggle button component to use in header
export function AIChatToggle() {
  const { toggle, isOpen } = useChat();

  return (
    <Button
      variant={isOpen ? "secondary" : "ghost"}
      size="icon"
      onClick={toggle}
    >
      <MessageSquare className="h-5 w-5" />
      <span className="sr-only">Toggle AI Chat</span>
    </Button>
  );
}
