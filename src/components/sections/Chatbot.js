import React, { useState, useEffect, useRef } from "react";
import { FaRobot, FaTimes, FaStar } from "react-icons/fa";
import { IoMdSend } from "react-icons/io";
import { motion, AnimatePresence } from "framer-motion";
import "./Chatbot.css";

/* 
 🤖 AI-POWERED NCC CHATBOT
 Uses Hugging Face Inference API (FREE!)
 Supports: Llama, Mistral, DeepSeek, and more
*/

// NCC Knowledge Context
const nccContext = `You are an expert NCC (National Cadet Corps) assistant. Provide helpful, accurate, and concise responses about NCC.

Key NCC Information:
- Full Name: National Cadet Corps
- Established: 15 July 1948
- Motto: "Unity and Discipline"
- Three Wings: Army, Navy, Air Force
- Certificates: A (Basic), B (Intermediate), C (Advanced)
- Benefits: Leadership, fitness, defense preference, extra marks in govt jobs
- Eligibility: Students from Class 8 onwards, Age 13-26 years

Keep responses brief (2-3 sentences) and helpful. Use emojis occasionally.`;

// Call Hugging Face Inference API (FREE!)
const callHuggingFaceAPI = async (userMessage) => {
  const apiKey = process.env.REACT_APP_HUGGINGFACE_API_KEY;

  if (!apiKey || apiKey === 'your_huggingface_api_key_here') {
    throw new Error('API key not configured');
  }

  // Using Meta's Llama model (free and powerful!)
  const model = "meta-llama/Llama-3.2-3B-Instruct";

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `${nccContext}\n\nUser: ${userMessage}\n\nAssistant:`,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false,
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Hugging Face API Error:', error);
    throw new Error(`API failed: ${response.status}`);
  }

  const data = await response.json();

  // Handle different response formats
  if (Array.isArray(data) && data[0]?.generated_text) {
    return data[0].generated_text.trim();
  } else if (data.generated_text) {
    return data.generated_text.trim();
  } else {
    throw new Error('Invalid API response format');
  }
};

// Local fallback responses
const getLocalResponse = (input) => {
  const lower = input.toLowerCase();

  if (lower.includes('history') || lower.includes('established') || lower.includes('founded')) {
    return "📜 NCC was established on 15 July 1948 under the National Cadet Corps Act. It succeeded the University Officers Training Corps (UOTC) from 1942. The Girls division started in 1950, Air Wing in 1952, and Naval Wing in 1953. Today, NCC has over 13 lakh cadets across India!";
  }

  if (lower.includes('what is ncc') || lower.includes('about ncc')) {
    return "🎖️ NCC stands for National Cadet Corps, established in 1948. Our motto is 'Unity and Discipline'. We develop character, discipline, and leadership among young citizens through military training and social service.";
  }

  if (lower.includes('certificate')) {
    return "📜 NCC offers three certificates: A (Basic for Junior Division), B (Intermediate after 2 years), and C (Advanced with defense benefits including CDS exam exemption).";
  }

  if (lower.includes('benefit') || lower.includes('advantage')) {
    return "✨ NCC Benefits: Leadership development, physical fitness, extra marks in government jobs (up to 15%), preference in defense services recruitment, and CDS exam exemption for C certificate holders!";
  }

  if (lower.includes('join') || lower.includes('eligibility')) {
    return "🎓 Students from Class 8 onwards (Junior Division) and college students (Senior Division) can join. Age: 13-26 years. Participation is voluntary! Contact your school/college NCC officer to enroll.";
  }

  if (lower.includes('wing')) {
    return "⚔️ NCC has three wings: Army Wing, Navy Wing, and Air Force Wing. Each provides specialized training related to its respective service.";
  }

  if (lower.includes('camp') || lower.includes('training')) {
    return "🏕️ NCC conducts various camps: ATC (Annual Training Camp), RDC (Republic Day Camp), NIC (National Integration Camp), and specialized wing camps. Training includes drill, weapon training, map reading, field craft, and first aid.";
  }

  return "🤔 I can help with: NCC history, structure, wings, certificates, training, camps, benefits, and eligibility. What would you like to know?";
};

// Main response generator
const generateResponse = async (userMessage, setIsTyping, setModel) => {
  setIsTyping(true);

  try {
    console.log('🤖 Trying Llama AI via Hugging Face...');
    setModel('🦙 Llama AI');
    const response = await callHuggingFaceAPI(userMessage);
    setIsTyping(false);
    console.log('✅ Success with Llama AI!');
    return { text: response, model: '🦙 Llama AI' };
  } catch (error) {
    console.log('❌ AI failed:', error.message);
    console.log('💡 Using local knowledge base');
    setModel('💡 Local Knowledge');
    setIsTyping(false);
    return { text: getLocalResponse(userMessage), model: '💡 Local Knowledge' };
  }
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{
    sender: "bot",
    text: "👋 Hello! I'm your AI-powered NCC Assistant using Llama AI. Ask me anything about the National Cadet Corps!",
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentModel, setCurrentModel] = useState("");
  const messagesEndRef = useRef(null);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      const newParticles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5,
      }));
      setParticles(newParticles);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    const aiResult = await generateResponse(currentInput, setIsTyping, setCurrentModel);
    const botMsg = { sender: "bot", text: aiResult.text, timestamp: new Date(), model: aiResult.model };
    setMessages(prev => [...prev, botMsg]);
    setCurrentModel("");
  };

  const quickQuestions = ["What is NCC?", "NCC history", "Benefits of NCC", "How to join NCC?"];

  return (
    <>
      <motion.div
        className="chatbot-button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            "0 0 20px rgba(59, 130, 246, 0.5)",
            "0 0 40px rgba(59, 130, 246, 0.8)",
            "0 0 20px rgba(59, 130, 246, 0.5)",
          ],
        }}
        transition={{ boxShadow: { duration: 2, repeat: Infinity } }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <FaTimes size={28} />
            </motion.div>
          ) : (
            <motion.div key="robot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <FaRobot size={28} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chatbot-window"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="chatbot-particles">
              {particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="particle"
                  style={{ left: `${particle.x}%`, top: `${particle.y}%`, width: particle.size, height: particle.size }}
                  animate={{ y: [0, -100, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: particle.duration, repeat: Infinity, delay: particle.delay }}
                />
              ))}
            </div>

            <motion.div className="chatbot-header" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <div className="header-content">
                <FaStar className="header-icon" />
                <div>
                  <h3>NCC AI Assistant</h3>
                  <span className="status-badge">
                    <span className="status-dot"></span>
                    {isTyping ? currentModel || 'Thinking...' : 'Online'}
                  </span>
                </div>
              </div>
            </motion.div>

            <div className="chatbot-messages">
              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    className={`message-wrapper ${msg.sender}`}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300, delay: idx * 0.05 }}
                  >
                    <motion.div className={`message ${msg.sender}`} whileHover={{ scale: 1.02 }}>
                      {msg.text}
                      <div className="message-time">
                        {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.model && <span className="model-badge"> • {msg.model}</span>}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div className="message-wrapper bot" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="message bot typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && (
              <motion.div className="quick-questions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <p>Quick questions:</p>
                <div className="quick-buttons">
                  {quickQuestions.map((q, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => { setInput(q); setTimeout(() => handleSend(), 100); }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                    >
                      {q}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div className="chatbot-input" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask me anything about NCC..."
                disabled={isTyping}
              />
              <motion.button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={input.trim() ? "active" : ""}
              >
                <IoMdSend size={20} />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
