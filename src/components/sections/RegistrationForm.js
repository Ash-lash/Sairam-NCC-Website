import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { useInView } from 'react-intersection-observer';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { CheckCircle, AlertCircle, Send, User, Instagram, MessageCircle } from 'lucide-react';

// --- STYLES ---
const FormContainer = styled.section`
  padding: 6rem 2rem;
  background-color: #f8fafc;
`;

const FormContent = styled.div`
  max-width: 850px;
  margin: 0 auto;
`;

const SectionTitle = styled(motion.h2)`
  font-size: 3rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 3rem;
  color: #1a2b4c;
  
  @media (max-width: 768px) {
    font-size: 2.2rem;
  }
`;

const Form = styled(motion.form)`
  background: #FFFFFF;
  border-radius: 24px;
  padding: 3.5rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 6px;
    height: 100%;
    background: #1a2b4c;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 2.5rem;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  &.full-width {
    grid-column: 1 / -1;
  }
`;

const Label = styled.label`
  color: #475569;
  margin-bottom: 0.8rem;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  background: #f1f5f9;
  border: 2px solid transparent;
  color: #1a2b4c;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s;
  
  &:focus {
    outline: none;
    border-color: #1a2b4c;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(26, 43, 76, 0.05);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const Select = styled.select`
  background: #f1f5f9;
  border: 2px solid transparent;
  color: #1a2b4c;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #1a2b4c;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(26, 43, 76, 0.05);
  }

  /* Optional: Make the placeholder text look like the input placeholders */
  &:invalid {
    color: #94a3b8;
  }
`;

const SubmitButton = styled(motion.button)`
  grid-column: 1 / -1;
  background: #1a2b4c;
  border: none;
  color: #FFFFFF;
  padding: 1.25rem;
  border-radius: 12px;
  font-weight: 800;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  
  &:disabled {
    background: #94a3b8;
    cursor: not-allowed;
  }
`;

const SuccessOverlay = styled(motion.div)`
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05);
`;

const RegistrationForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [headers, setHeaders] = useState([]);
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  useEffect(() => {
    const fetchHeaders = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'config', 'registration'));
        if (docSnap.exists() && docSnap.data().headers && docSnap.data().headers.length > 0) {
          setHeaders(docSnap.data().headers);
        } else {
          setHeaders(['Name', 'Year', 'Department', 'Phone Number', 'Mail ID']);
        }
      } catch (err) {
        setHeaders(['Name', 'Year', 'Department', 'Phone Number', 'Mail ID']);
      }
    };
    fetchHeaders();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.createdAt = new Date().toISOString(); // Simple string for external webhook

    try {
      // 1. Save to Local Firestore (Backup)
      await addDoc(collection(db, 'registrations'), {
        ...data,
        createdAt: serverTimestamp()
      });

      // 2. Direct Save to Google Sheet if configured
      const docSnap = await getDoc(doc(db, 'config', 'registration'));
      if (docSnap.exists() && docSnap.data().webhookUrl) {
        await fetch(docSnap.data().webhookUrl, {
          method: 'POST',
          mode: 'no-cors', // Essential for Google Apps Script Web Apps
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <FormContainer id="register">
        <FormContent>
          <SuccessOverlay
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle size={64} color="#059669" style={{ marginBottom: '2rem' }} />
            <h2 style={{ fontSize: '2.5rem', color: '#1a2b4c', marginBottom: '1rem', fontWeight: 800 }}>Registration Successful!</h2>
            <p style={{ color: '#64748b', fontSize: '1.2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
              Your details have been securely recorded in our database. We will notify you about the next steps soon.
            </p>

            <div style={{ marginBottom: '2.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#1a2b4c', marginBottom: '1.5rem', fontWeight: 800 }}>Stay Connected</h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <a 
                  href="https://www.whatsapp.com/channel/0029Va8Rd1D7z4kWvsDyw23K" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', background: '#25D366', color: 'white', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', padding: '0.8rem 1.5rem', borderRadius: '12px', marginBottom: '0.8rem', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(37, 211, 102, 0.2)' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <MessageCircle size={22} /> Join our Official WhatsApp Channel
                </a>
                <p style={{ color: '#475569', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
                  Join the WhatsApp channel to get instant updates about the enrollment process and Sairam NCC information!
                </p>
              </div>

              <div>
                <a 
                  href="https://www.instagram.com/sairam_ncc?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw%3D%3D" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: 'white', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', padding: '0.8rem 1.5rem', borderRadius: '12px', marginBottom: '0.8rem', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(225, 48, 108, 0.2)' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Instagram size={22} /> Follow us on Instagram
                </a>
                <p style={{ color: '#475569', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
                  Discover life at NCC! Check out our camps, training sessions, and cadet achievements.
                </p>
              </div>
            </div>

            <PrimaryButton onClick={() => setSubmitted(false)}>Register Another User</PrimaryButton>
          </SuccessOverlay>
        </FormContent>
      </FormContainer>
    );
  }

  return (
    <FormContainer id="register" ref={ref}>
      <FormContent>
        <SectionTitle
          initial={{ opacity: 0, y: -30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          Join Sairam NCC
        </SectionTitle>

        <Form
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          onSubmit={handleSubmit}
        >
          {headers.map((header) => {
            const hLower = header.toLowerCase();
            const isDept = hLower.includes('department') || hLower.includes('dept');
            const isSec = hLower.includes('section') || hLower === 'sec';

            return (
              <FormGroup 
                key={header} 
                className={hLower.includes('mail') || hLower.includes('name') ? 'full-width' : ''}
              >
                <Label htmlFor={header}>{header}</Label>

                {isDept ? (
                  <Select name={header} id={header} required defaultValue="">
                    <option value="" disabled>Select {header}</option>
                    <option value="AI&DS">AI&DS</option>
                    <option value="AI&ML">AI&ML</option>
                    <option value="CCE">CCE</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="CSBS">CSBS</option>
                    <option value="CSE">CSE</option>
                    <option value="CYBER SECURITY">CYBER SECURITY</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="EIE">EIE</option>
                    <option value="IOT">IOT</option>
                    <option value="IT">IT</option>
                    <option value="M TECH CSE">M TECH CSE</option>
                    <option value="MECH">MECH</option>
                    <option value="MECHATRONICS">MECHATRONICS</option>
                  </Select>
                ) : isSec ? (
                  <Select name={header} id={header} required defaultValue="">
                    <option value="" disabled>Select {header}</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                    <option value="F">F</option>
                    <option value="G">G</option>
                    <option value="H">H</option>
                    <option value="I">I</option>
                    <option value="J">J</option>
                    <option value="K">K</option>
                    <option value="L">L</option>
                    <option value="M">M</option>
                    <option value="N">N</option>
                    <option value="O">O</option>
                  </Select>
                ) : (
                  <Input 
                    type={hLower.includes('mail') ? 'email' : (hLower.includes('phone') || hLower.includes('number') ? 'tel' : 'text')} 
                    name={header} 
                    id={header} 
                    placeholder={`Enter ${header}`} 
                    required 
                  />
                )}
              </FormGroup>
            );
          })}

          <SubmitButton
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? 'Processing...' : 'Submit Registration'}
            <Send size={18} />
          </SubmitButton>
        </Form>
      </FormContent>
    </FormContainer>
  );
};

const PrimaryButton = styled.button`
  background: #1a2b4c;
  color: white;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;

  &:hover {
    background: #111d35;
    transform: translateY(-2px);
  }
`;

export default RegistrationForm;