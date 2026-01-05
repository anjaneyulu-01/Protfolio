import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import '../styles/Content.css';

export const Contact = () => {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8005/content/contact');
      const data = await response.json();
      setContacts(data || []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      // Fallback to default contacts
      setContacts([
        { icon: '📧', title: 'Email', info: 'anjaneyulu.dev01@gmail.com', link: 'mailto:anjaneyulu.dev01@gmail.com' },
        { icon: '💼', title: 'LinkedIn', info: 'linkedin.com/in/anjaneyulu', link: 'https://linkedin.com/in/anjaneyulu' },
        { icon: '💻', title: 'GitHub', info: 'github.com/anjaneyulu', link: 'https://github.com/anjaneyulu' },
        { icon: '📱', title: 'Phone', info: '+1 (555) 123-4567', link: 'tel:+15551234567' }
      ]);
    }
  };

  return (
    <div className="content-page">
      <Header />
      <div className="container">
        <div className="content-header">
          <h1>📬 Get In Touch</h1>
          <p>Let's connect and discuss opportunities, collaborations, or just have a friendly chat!</p>
        </div>

        <div className="contact-grid">
          {contacts.map((contact, index) => (
            <div key={index} className="contact-card">
              <div className="contact-icon">{contact.data?.icon || contact.icon}</div>
              <div className="contact-title">{contact.data?.title || contact.title}</div>
              <div className="contact-info">{contact.data?.info || contact.info}</div>
              <a 
                href={contact.data?.link || contact.link} 
                className="contact-link"
                target={(contact.data?.link || contact.link).startsWith('http') ? '_blank' : undefined}
                rel={(contact.data?.link || contact.link).startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {(contact.data?.link || contact.link).startsWith('http') ? 'Visit' : 'Contact'}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
