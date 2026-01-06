import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import '../styles/Content.css';

export const Fun = () => {
  const [funFacts, setFunFacts] = useState([]);

  useEffect(() => {
    fetchFun();
  }, []);

  const fetchFun = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8005/content/fun');
      const data = await response.json();
      setFunFacts(data || []);
    } catch (error) {
      // ...existing code...
      // Fallback
      setFunFacts([
        { data: { icon: '🎮', title: 'Gamer', description: 'Love playing strategy and puzzle games' } },
        { data: { icon: '📚', title: 'Reader', description: 'Always learning from tech books and blogs' } },
        { data: { icon: '🎵', title: 'Music Lover', description: 'Coding is better with good music' } },
        { data: { icon: '☕', title: 'Coffee Enthusiast', description: 'Powered by coffee and curiosity' } },
        { data: { icon: '🌍', title: 'Explorer', description: 'Love discovering new places and cultures' } },
        { data: { icon: '🎨', title: 'Creative', description: 'Enjoy design and creative problem solving' } }
      ]);
    }
  };

  return (
    <div className="content-page">
      <Header />
      <div className="container">
        <div className="content-header">
          <h1>🎉 Fun Facts</h1>
          <p>A little bit about my hobbies and interests</p>
        </div>

        <div className="fun-grid">
          {funFacts.map((fact, index) => (
            <div key={index} className="fun-card">
              <div className="fun-icon">{fact.data?.icon || fact.icon}</div>
              <h3>{fact.data?.title || fact.title}</h3>
              <p>{fact.data?.description || fact.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
