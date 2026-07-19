import { useState } from 'react';
import { Header } from '../components/Header';
import '../styles/Chat.css';

export const Chat = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your AI assistant. Ask me anything about this portfolio!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const responses = [
        'That\'s a great question! This portfolio showcases various projects and skills.',
        'I can help you navigate through the portfolio sections. What would you like to know?',
        'This portfolio is built with React and features interactive components.',
        'Feel free to explore the projects, skills, and contact sections!'
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { role: 'assistant', content: randomResponse }]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="content-page chat-page">
      <Header />
      <div className="chat-container">
        <div className="chat-header">
          <h1>💬 Chat with AI</h1>
          <p>Ask me anything about this portfolio</p>
        </div>

        <div className="messages-container">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-avatar">
                {message.role === 'assistant' ? '🤖' : '👤'}
              </div>
              <div className="message-content">
                {message.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="chat-input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="chat-input"
            disabled={loading}
          />
          <button type="submit" className="chat-send-btn" disabled={loading || !input.trim()}>
            ➤
          </button>
        </form>
      </div>
    </div>
  );
};
