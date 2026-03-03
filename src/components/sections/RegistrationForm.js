import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useInView } from 'react-intersection-observer';

// --- STYLES (Unchanged) ---
const FormContainer = styled.section`
  padding: 6rem 2rem;
  background-color: #F0F2F5;
`;
const FormContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;
const SectionTitle = styled(motion.h2)`
  font-size: 3rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 3rem;
  color: #1A2B4C;
`;
const Form = styled(motion.form)`
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.07);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 2rem;
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
  color: #334155;
  margin-bottom: 0.6rem;
  font-size: 0.95rem;
  font-weight: 600;
  margin-left: 0.2rem;
`;
const Input = styled.input`
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #1A2B4C;
  padding: 0.8rem 1rem;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.2s ease;
  &:focus {
    outline: none;
    border-color: #1A2B4C;
    background: white;
    box-shadow: 0 0 0 4px rgba(26, 43, 76, 0.1);
  }
`;
const Select = styled.select`
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #1A2B4C;
  padding: 0.8rem 1rem;
  border-radius: 10px;
  font-size: 1rem;
  font-family: inherit;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.25rem;
  &:focus {
    outline: none;
    border-color: #1A2B4C;
    background: white;
    box-shadow: 0 0 0 4px rgba(26, 43, 76, 0.1);
  }
`;
const SubmitButton = styled(motion.button)`
  grid-column: 1 / -1;
  background: #1A2B4C;
  border: none;
  color: #FFFFFF;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.2s;
  &:hover { background: #111d35; transform: translateY(-1px); }
  &:active { transform: translateY(0); }
  &:disabled { background: #94a3b8; cursor: not-allowed; }
`;
const Message = styled.p`
  grid-column: 1 / -1;
  text-align: center;
  color: #1A2B4C;
  min-height: 1.5rem;
  font-weight: 500;
`;
// ---

// ✨ 1. PASTE YOUR WEB APP URL HERE
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwxUaoGqvXwLE191LUYR6sebZDcUv-X_L2jwJj7Xm5L87iuxgjQ1HL-q4CAc9UM3XpcFQ/exec";

const RegistrationForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

  // ✨ 2. UPDATED SUBMIT FUNCTION
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('Submitting...');

    // Get all form data
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      // Send the data to the Google Apps Script
      await fetch(SCRIPT_URL, {
        method: 'POST',
        // 'mode: no-cors' is a temporary workaround for Google Script's CORS behavior
        // We "fire and forget" and assume it worked.
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Since 'no-cors' prevents reading the response, we optimistically show success
      setMessage('Registration successful! We will contact you soon.');
      e.target.reset(); // Clears the form

    } catch (error) {
      console.error('Error submitting form:', error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  return (
    <FormContainer id="register" ref={ref}>
      <FormContent>
        <SectionTitle initial={{ opacity: 0, y: -50 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}>
          Join Sairam NCC
        </SectionTitle>
        <Form variants={formVariants} initial="hidden" animate={inView ? 'visible' : 'hidden'} onSubmit={handleSubmit}>
          {/* Form fields are unchanged */}
          {/* Note: The 'name' attribute (e.g., name="Phone Number") MUST match the script */}
          <FormGroup className="full-width">
            <Label htmlFor="Name">Name</Label>
            <Input type="text" name="Name" id="Name" required />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="Year">Year</Label>
            <Select name="Year" id="Year" defaultValue="I" required>
              <option value="I">I</option>
              <option value="II">II</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="Department">Department</Label>
            <Input type="text" name="Department" id="Department" required />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="Phone Number">Phone Number</Label>
            <Input type="tel" name="Phone Number" id="Phone Number" required />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="Mail ID">Mail ID</Label>
            <Input type="email" name="Mail ID" id="Mail ID" required />
          </FormGroup>
          <Message>{message}</Message>
          <SubmitButton type="submit" disabled={isSubmitting} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {isSubmitting ? 'Registering...' : 'Register Now'}
          </SubmitButton>
        </Form>
      </FormContent>
    </FormContainer>
  );
};
export default RegistrationForm;