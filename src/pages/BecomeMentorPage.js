import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, 
  User, 
  GraduationCap, 
  Award, 
  Briefcase, 
  MapPin, 
  Mail, 
  Linkedin, 
  Phone, 
  Calendar, 
  Globe, 
  BookOpen, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  ShieldAlert, 
  ChevronDown
} from 'lucide-react';
import { collection, query, where, getDocs, getDoc, addDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import SEO from '../components/common/SEO';

// ─── NCC Colors & Theme ───
const NCC = {
  navy: '#1A2B4C',
  navyLight: '#2D4A7C',
  gold: '#FFBF00',
  goldLight: '#FFD700',
  bg: '#f4f6fb',
  white: '#ffffff',
  text: '#1e293b',
  textMid: '#475569',
  textLight: '#94a3b8',
  army: '#DC2626',
  navyWing: '#1E3A8A',
  air: '#0284c7',
  success: '#10B981',
};

const PageContainer = styled.div`
  min-height: 100vh;
  padding: 140px 2rem 4rem;
  background: ${NCC.bg};
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 450px;
    background: linear-gradient(135deg, ${NCC.navy} 0%, ${NCC.navyLight} 100%);
    clip-path: ellipse(120% 80% at 50% 0%);
    z-index: 1;
  }
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 900px;
  position: relative;
  z-index: 2;
`;

const HeaderGroup = styled.div`
  text-align: center;
  color: white;
  margin-bottom: 3rem;
`;

const FormSubtitle = styled.div`
  font-size: 0.9rem;
  font-weight: 800;
  color: ${NCC.gold};
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 0.5rem;
`;

const FormTitle = styled.h1`
  font-size: 2.8rem;
  font-weight: 900;
  margin-bottom: 1rem;
  letter-spacing: -1px;
  
  span {
    color: ${NCC.gold};
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const FormDescription = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.85);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

// ─── Stepper Component ───
const StepperContainer = styled.div`
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(26, 43, 76, 0.05);
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  
  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
`;

const ProgressLine = styled.div`
  position: absolute;
  top: 50px;
  left: 10%;
  right: 10%;
  height: 4px;
  background: #e2e8f0;
  z-index: 1;
  transform: translateY(-50%);
  
  @media (max-width: 768px) {
    top: 40px;
  }
`;

const ActiveProgressLine = styled(motion.div)`
  position: absolute;
  top: 50px;
  left: 10%;
  height: 4px;
  background: ${NCC.navy};
  z-index: 1;
  transform: translateY(-50%);
  transform-origin: left;
  
  @media (max-width: 768px) {
    top: 40px;
  }
`;

const StepItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  flex: 1;
`;

const StepCircle = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${props => props.$active ? NCC.navy : props.$completed ? NCC.success : '#f1f5f9'};
  color: ${props => props.$active || props.$completed ? 'white' : NCC.textLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border: 4px solid white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    font-size: 0.9rem;
  }
`;

const StepLabel = styled.div`
  margin-top: 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${props => props.$active ? NCC.navy : props.$completed ? NCC.text : NCC.textLight};
  text-align: center;

  .subtitle {
    font-size: 0.7rem;
    font-weight: 500;
    color: ${NCC.textLight};
    margin-top: 0.1rem;
    
    @media (max-width: 600px) {
      display: none;
    }
  }
`;

// ─── Form Card ───
const FormCard = styled(motion.div)`
  background: white;
  border-radius: 32px;
  padding: 3rem;
  box-shadow: 0 20px 50px rgba(26, 43, 76, 0.08);
  border: 1px solid #edf2f7;
  
  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }
`;

const FormSection = styled.div`
  h2 {
    color: ${NCC.navy};
    font-size: 1.8rem;
    font-weight: 800;
    margin-top: 0;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .subtitle {
    color: ${NCC.textMid};
    font-size: 0.95rem;
    margin-bottom: 2rem;
  }
`;

const InfoBox = styled.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 16px;
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  color: #0369a1;
  font-size: 0.9rem;
  font-weight: 500;

  span {
    line-height: 1.4;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  grid-column: ${props => props.$fullWidth ? 'span 2' : 'auto'};

  @media (max-width: 768px) {
    grid-column: auto;
  }
`;

const Label = styled.label`
  font-size: 0.88rem;
  font-weight: 700;
  color: ${NCC.navy};
  text-transform: uppercase;
  letter-spacing: 0.5px;

  span {
    color: ${NCC.army};
  }
`;

const Input = styled.input`
  padding: 0.95rem 1.2rem;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  font-size: 1rem;
  color: ${NCC.text};
  background: #f8fafc;
  transition: all 0.25s;

  &:focus {
    outline: none;
    border-color: ${NCC.navy};
    background: white;
    box-shadow: 0 0 0 4px rgba(26, 43, 76, 0.06);
  }

  &::placeholder {
    color: ${NCC.textLight};
  }

  &:disabled {
    background: #e2e8f0;
    cursor: not-allowed;
  }
`;

const SelectWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  
  svg {
    position: absolute;
    right: 1.2rem;
    pointer-events: none;
    color: ${NCC.textMid};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.95rem 1.2rem;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  font-size: 1rem;
  color: ${NCC.text};
  background: #f8fafc;
  appearance: none;
  cursor: pointer;
  transition: all 0.25s;

  &:focus {
    outline: none;
    border-color: ${NCC.navy};
    background: white;
  }
`;

// ─── Multi-select Chips ───
const ChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.5rem;
`;

const Chip = styled.div`
  padding: 0.6rem 1.2rem;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border: 2px solid ${props => props.$selected ? NCC.navy : '#e2e8f0'};
  background: ${props => props.$selected ? NCC.navy : 'white'};
  color: ${props => props.$selected ? 'white' : NCC.textMid};

  &:hover {
    border-color: ${NCC.navy};
    color: ${props => props.$selected ? 'white' : NCC.navy};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #f1f5f9;
`;

const Button = styled(motion.button)`
  padding: 0.9rem 2rem;
  border-radius: 14px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  transition: all 0.2s;

  ${props => props.$primary ? `
    background: linear-gradient(135deg, ${NCC.navy} 0%, ${NCC.navyLight} 100%);
    color: white;
    box-shadow: 0 8px 24px rgba(26, 43, 76, 0.15);
    &:hover {
      box-shadow: 0 12px 30px rgba(26, 43, 76, 0.25);
    }
  ` : `
    background: #f1f5f9;
    color: ${NCC.textMid};
    &:hover {
      background: #e2e8f0;
      color: ${NCC.navy};
    }
  `}

  &:disabled {
    background: #cbd5e1;
    color: #94a3b8;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const SuccessOverlay = styled.div`
  text-align: center;
  padding: 3rem 1rem;

  h2 {
    color: ${NCC.navy};
    font-size: 2.2rem;
    font-weight: 900;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
  }

  p {
    color: ${NCC.textMid};
    font-size: 1.1rem;
    margin-bottom: 2.5rem;
    line-height: 1.6;
  }
`;

const SuccessIconWrapper = styled.div`
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: #d1fae5;
  color: ${NCC.success};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;

  svg {
    width: 44px;
    height: 44px;
  }
`;

// ─── Technical & Defence Exam options ───
const technicalSkillsList = [
  'Software Development', 'Web Development', 'Mobile App Development', 'Artificial Intelligence & ML',
  'Data Science & Analytics', 'Cloud Computing', 'Cybersecurity', 'Internet of Things (IoT)', 
  'VLSI & Embedded Systems', 'Robotics & Automation', 'Mechanical Design (CAD/CAM)', 
  'Civil/Structural Engineering', 'Power Systems & Electricals', 'Product Management'
];

const defenceSkillsList = [
  'NDA Exam Preparation', 'CDS Exam Preparation', 'SSB Interview Guidance', 
  'AFCAT Preparation', 'CAPF Exam Preparation', 'Armed Forces Entry Exams', 
  'Personality Development', 'Public Speaking & Communication', 'Physical Fitness & Sports Training', 
  'Drill & Ceremonial Training', 'Weapon & Shooting Training', 'Leadership & Group Tasks'
];

const domainExpertiseList = [
  'Engineering & Technology', 'Indian Armed Forces (Army/Navy/Air Force)', 'Civil Services / UPSC',
  'Public Sector Undertakings (PSUs)', 'Higher Studies & Research (India/Abroad)', 
  'Management & Consulting', 'Entrepreneurship & Startups', 'Social Work & NGOs'
];

const BecomeMentorPage = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [isAlumniPreFilled, setIsAlumniPreFilled] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Step 1: Work Details
    companyName: '',
    companyWebsite: '',
    companySize: '1-10',
    industryDomain: '',
    designation: '',
    yearsOfExperience: '',
    currentLocation: '',

    // Step 2: Personal Info
    fullName: '',
    phoneNumber: '',
    alternatePhone: '',
    primaryEmail: '',
    secondaryEmail: '',
    linkedinUrl: '',

    // Step 3: Alumni Status
    isSairamAlumni: 'Yes',
    batchYears: '',
    wingType: 'Army',
    department: '',
    isSairamParent: 'No',

    // Step 4: Preferences
    willingnessToMentor: 'Monthly',
    technicalSkills: [],
    defenceSkills: [],
    domainExpertise: []
  });

  // Listen to Auth State to fetch alumni profiles
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoadingProfile(true);
        try {
          // Query alumni collection
          const q = query(collection(db, 'alumni'), where('userId', '==', user.uid));
          const snap = await getDocs(q);
          let profileData = null;

          if (!snap.empty) {
            profileData = snap.docs[0].data();
          } else if (user.email) {
            const qEmail = query(collection(db, 'alumni'), where('email', '==', user.email));
            const snapEmail = await getDocs(qEmail);
            if (!snapEmail.empty) {
              profileData = snapEmail.docs[0].data();
            }
          }

          if (profileData) {
            setFormData(prev => ({
              ...prev,
              fullName: profileData.name || user.displayName || prev.fullName,
              primaryEmail: profileData.email || user.email || prev.primaryEmail,
              phoneNumber: profileData.phone || prev.phoneNumber,
              companyName: profileData.company || prev.companyName,
              designation: profileData.currentPosition || prev.designation,
              linkedinUrl: profileData.linkedin || prev.linkedinUrl,
              wingType: profileData.wing || prev.wingType,
              batchYears: profileData.batch || prev.batchYears,
              department: profileData.department || prev.department
            }));
            setIsAlumniPreFilled(true);
          } else {
            // Fallback just to prefill from Firebase user details
            setFormData(prev => ({
              ...prev,
              fullName: user.displayName || prev.fullName,
              primaryEmail: user.email || prev.primaryEmail
            }));
          }
        } catch (err) {
          console.error("Error loading alumnus profile for mentor form:", err);
        } finally {
          setLoadingProfile(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleTechnicalSkill = (skill) => {
    setFormData(prev => {
      const exist = prev.technicalSkills.includes(skill);
      return {
        ...prev,
        technicalSkills: exist 
          ? prev.technicalSkills.filter(s => s !== skill) 
          : [...prev.technicalSkills, skill]
      };
    });
  };

  const toggleDefenceSkill = (skill) => {
    setFormData(prev => {
      const exist = prev.defenceSkills.includes(skill);
      return {
        ...prev,
        defenceSkills: exist 
          ? prev.defenceSkills.filter(s => s !== skill) 
          : [...prev.defenceSkills, skill]
      };
    });
  };

  const toggleDomainExpertise = (domain) => {
    setFormData(prev => {
      const exist = prev.domainExpertise.includes(domain);
      return {
        ...prev,
        domainExpertise: exist 
          ? prev.domainExpertise.filter(d => d !== domain) 
          : [...prev.domainExpertise, domain]
      };
    });
  };

  const validateStep = (step) => {
    if (step === 1) {
      return formData.companyName && formData.designation && formData.yearsOfExperience;
    }
    if (step === 2) {
      return formData.fullName && formData.phoneNumber && formData.primaryEmail;
    }
    if (step === 3) {
      if (formData.isSairamAlumni === 'Yes') {
        return formData.batchYears && formData.department;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
      window.scrollTo({ top: 150, behavior: 'smooth' });
    } else {
      alert("Please fill in all required fields (*) before moving to the next stage.");
    }
  };

  const prevStep = () => {
    setActiveStep(prev => prev - 1);
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setSubmitting(true);
    try {
      // 1. Save to Firestore
      const docRef = await addDoc(collection(db, 'mentor_registrations'), {
        ...formData,
        createdAt: new Date()
      });

      // 2. Fetch Sync Hook if exists
      const configSnap = await getDoc(doc(db, 'config', 'mentor_registration'));
      if (configSnap.exists()) {
        const configData = configSnap.data();
        if (configData.webhookUrl) {
          await fetch(configData.webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: docRef.id,
              ...formData,
              createdAt: new Date().toISOString()
            })
          });
        }
      }

      setSubmitSuccess(true);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to submit mentorship application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const progressPercent = ((activeStep - 1) / 3) * 80;

  return (
    <>
      <SEO title="Become a Cadet Mentor" description="Join the Sairam NCC Mentor network and share your valuable expertise with young cadets." />
      
      <PageContainer>
        <ContentWrapper>
          <HeaderGroup>
            <FormSubtitle>Industry Engagement & Cadet Support</FormSubtitle>
            <FormTitle>Become a <span>Cadet Mentor</span></FormTitle>
            <FormDescription>
              Share your professional expertise, engineering skills, and defence preparation insights with NCC cadets. Help guide the next generation of leaders.
            </FormDescription>
          </HeaderGroup>

          {/* Stepper Progress Bar */}
          {!submitSuccess && (
            <StepperContainer>
              <ProgressLine />
              <ActiveProgressLine animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.4 }} />
              
              <StepItem onClick={() => activeStep > 1 && setActiveStep(1)}>
                <StepCircle $active={activeStep === 1} $completed={activeStep > 1}>
                  {activeStep > 1 ? <Check size={20} /> : '1'}
                </StepCircle>
                <StepLabel $active={activeStep === 1} $completed={activeStep > 1}>
                  Company
                  <div className="subtitle">Work details</div>
                </StepLabel>
              </StepItem>

              <StepItem onClick={() => activeStep > 2 && setActiveStep(2)}>
                <StepCircle $active={activeStep === 2} $completed={activeStep > 2}>
                  {activeStep > 2 ? <Check size={20} /> : '2'}
                </StepCircle>
                <StepLabel $active={activeStep === 2} $completed={activeStep > 2}>
                  Personal
                  <div className="subtitle">Your info</div>
                </StepLabel>
              </StepItem>

              <StepItem onClick={() => activeStep > 3 && setActiveStep(3)}>
                <StepCircle $active={activeStep === 3} $completed={activeStep > 3}>
                  {activeStep > 3 ? <Check size={20} /> : '3'}
                </StepCircle>
                <StepLabel $active={activeStep === 3} $completed={activeStep > 3}>
                  Alumni
                  <div className="subtitle">NCC Background</div>
                </StepLabel>
              </StepItem>

              <StepItem>
                <StepCircle $active={activeStep === 4} $completed={activeStep > 4}>
                  4
                </StepCircle>
                <StepLabel $active={activeStep === 4} $completed={activeStep > 4}>
                  Mentorship
                  <div className="subtitle">Preferences</div>
                </StepLabel>
              </StepItem>
            </StepperContainer>
          )}

          <FormCard
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {loadingProfile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: NCC.navyLight }}>
                <div className="skeleton-spinner" style={{ width: '20px', height: '20px', borderWidth: '3px' }} />
                <span>Checking for registered alumni profiles...</span>
              </div>
            )}

            {isAlumniPreFilled && !loadingProfile && activeStep === 1 && (
              <InfoBox>
                <Check size={24} style={{ flexShrink: 0 }} />
                <span>We found your registered Sairam NCC alumni profile and have pre-filled your details! Feel free to review or update them.</span>
              </InfoBox>
            )}

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {/* STEP 1: COMPANY & PROFESSIONAL DETAILS */}
                {activeStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FormSection>
                      <h2><Building size={24} /> Company & Professional Details</h2>
                      <p className="subtitle font-medium">Please share your current professional status and work location.</p>
                      
                      <Grid>
                        <FormGroup>
                          <Label>Company Name <span>*</span></Label>
                          <Input 
                            type="text" 
                            name="companyName" 
                            value={formData.companyName} 
                            onChange={handleInputChange} 
                            placeholder="e.g. Zoho, Indian Army, TCS"
                            required
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label>Company Website</Label>
                          <Input 
                            type="url" 
                            name="companyWebsite" 
                            value={formData.companyWebsite} 
                            onChange={handleInputChange} 
                            placeholder="e.g. https://company.com"
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label>Company Size</Label>
                          <SelectWrapper>
                            <Select name="companySize" value={formData.companySize} onChange={handleInputChange}>
                              <option value="1-10">1-10 Employees</option>
                              <option value="11-50">11-50 Employees</option>
                              <option value="51-200">51-200 Employees</option>
                              <option value="201-500">201-500 Employees</option>
                              <option value="500+">500+ Employees</option>
                            </Select>
                            <ChevronDown size={18} />
                          </SelectWrapper>
                        </FormGroup>

                        <FormGroup>
                          <Label>Industry Domain</Label>
                          <Input 
                            type="text" 
                            name="industryDomain" 
                            value={formData.industryDomain} 
                            onChange={handleInputChange} 
                            placeholder="e.g. Software, Core Engineering, Defence"
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label>Designation <span>*</span></Label>
                          <Input 
                            type="text" 
                            name="designation" 
                            value={formData.designation} 
                            onChange={handleInputChange} 
                            placeholder="e.g. Project Lead, Lieutenant, Senior Dev"
                            required
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label>Years of Experience <span>*</span></Label>
                          <Input 
                            type="number" 
                            name="yearsOfExperience" 
                            value={formData.yearsOfExperience} 
                            onChange={handleInputChange} 
                            placeholder="e.g. 3"
                            min="0"
                            required
                          />
                        </FormGroup>

                        <FormGroup $fullWidth>
                          <Label>Current Location</Label>
                          <Input 
                            type="text" 
                            name="currentLocation" 
                            value={formData.currentLocation} 
                            onChange={handleInputChange} 
                            placeholder="e.g. Chennai, Tamil Nadu, India"
                          />
                        </FormGroup>
                      </Grid>
                    </FormSection>
                  </motion.div>
                )}

                {/* STEP 2: PERSONAL DETAILS */}
                {activeStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FormSection>
                      <h2><User size={24} /> Personal Details</h2>
                      <p className="subtitle font-medium">How should Sairam NCC coordinate and reach out to you?</p>
                      
                      <Grid>
                        <FormGroup $fullWidth>
                          <Label>Full Name <span>*</span></Label>
                          <Input 
                            type="text" 
                            name="fullName" 
                            value={formData.fullName} 
                            onChange={handleInputChange} 
                            placeholder="Enter your full name"
                            required
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label>Phone Number <span>*</span></Label>
                          <Input 
                            type="tel" 
                            name="phoneNumber" 
                            value={formData.phoneNumber} 
                            onChange={handleInputChange} 
                            placeholder="e.g. +91 9876543210"
                            required
                          />
                        </FormGroup>

                        <FormGroup>
                          <Label>Alternate Phone</Label>
                          <Input 
                            type="tel" 
                            name="alternatePhone" 
                            value={formData.alternatePhone} 
                            onChange={handleInputChange} 
                            placeholder="Optional backup number"
                          />
                        </FormGroup>

                        <FormGroup $fullWidth>
                          <Label>Primary Email Address <span>*</span></Label>
                          <Input 
                            type="email" 
                            name="primaryEmail" 
                            value={formData.primaryEmail} 
                            onChange={handleInputChange} 
                            placeholder="e.g. name@domain.com"
                            required
                          />
                        </FormGroup>

                        <FormGroup $fullWidth>
                          <Label>Secondary Email Address</Label>
                          <Input 
                            type="email" 
                            name="secondaryEmail" 
                            value={formData.secondaryEmail} 
                            onChange={handleInputChange} 
                            placeholder="Optional backup email"
                          />
                        </FormGroup>

                        <FormGroup $fullWidth>
                          <Label>LinkedIn Profile URL</Label>
                          <Input 
                            type="url" 
                            name="linkedinUrl" 
                            value={formData.linkedinUrl} 
                            onChange={handleInputChange} 
                            placeholder="https://linkedin.com/in/username"
                          />
                        </FormGroup>
                      </Grid>
                    </FormSection>
                  </motion.div>
                )}

                {/* STEP 3: ALUMNI & NCC BACKGROUND */}
                {activeStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FormSection>
                      <h2><GraduationCap size={24} /> Alumni & NCC Background</h2>
                      <p className="subtitle font-medium">Verify your relationship with Sri Sairam Engineering College NCC.</p>
                      
                      <Grid>
                        <FormGroup>
                          <Label>Sairam Alumni? <span>*</span></Label>
                          <SelectWrapper>
                            <Select name="isSairamAlumni" value={formData.isSairamAlumni} onChange={handleInputChange}>
                              <option value="Yes">Yes, I am a Sairam Alumnus</option>
                              <option value="No">No, I am an External Expert</option>
                            </Select>
                            <ChevronDown size={18} />
                          </SelectWrapper>
                        </FormGroup>

                        {formData.isSairamAlumni === 'Yes' && (
                          <>
                            <FormGroup>
                              <Label>Batch (Years) <span>*</span></Label>
                              <Input 
                                type="text" 
                                name="batchYears" 
                                value={formData.batchYears} 
                                onChange={handleInputChange} 
                                placeholder="e.g. 2018-2022"
                                required
                              />
                            </FormGroup>

                            <FormGroup>
                              <Label>NCC Wing <span>*</span></Label>
                              <SelectWrapper>
                                <Select name="wingType" value={formData.wingType} onChange={handleInputChange}>
                                  <option value="Army">Army Wing</option>
                                  <option value="Navy">Navy Wing</option>
                                  <option value="Air">Air Wing</option>
                                  <option value="None">None (Only College Alumnus)</option>
                                </Select>
                                <ChevronDown size={18} />
                              </SelectWrapper>
                            </FormGroup>

                            <FormGroup>
                              <Label>College Department <span>*</span></Label>
                              <Input 
                                type="text" 
                                name="department" 
                                value={formData.department} 
                                onChange={handleInputChange} 
                                placeholder="e.g. CSE, ECE, MECH"
                                required
                              />
                            </FormGroup>
                          </>
                        )}

                        <FormGroup $fullWidth>
                          <Label>Are you a parent of a current Sairam student?</Label>
                          <SelectWrapper>
                            <Select name="isSairamParent" value={formData.isSairamParent} onChange={handleInputChange}>
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </Select>
                            <ChevronDown size={18} />
                          </SelectWrapper>
                        </FormGroup>
                      </Grid>
                    </FormSection>
                  </motion.div>
                )}

                {/* STEP 4: MENTORSHIP PREFERENCES (SKILLS & DOMAINS) */}
                {activeStep === 4 && !submitSuccess && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FormSection>
                      <h2><Award size={24} /> Mentorship Preferences</h2>
                      <p className="subtitle font-medium">Detail your fields of guidance. You can select topics from both technical/engineering domains and defence exam preps.</p>
                      
                      <FormGroup style={{ marginBottom: '2rem' }}>
                        <Label>Willingness to Mentor <span>*</span></Label>
                        <SelectWrapper>
                          <Select name="willingnessToMentor" value={formData.willingnessToMentor} onChange={handleInputChange}>
                            <option value="Weekly">Weekly (Online/Offline Interactions)</option>
                            <option value="Monthly">Monthly sessions</option>
                            <option value="Occasional">Occasional mentorship requests</option>
                            <option value="Guest Lectures">Guest lectures & webinars only</option>
                          </Select>
                          <ChevronDown size={18} />
                        </SelectWrapper>
                      </FormGroup>

                      {/* TECHNICAL / ENGINEERING SKILLS */}
                      <FormGroup style={{ marginBottom: '2rem' }}>
                        <Label>Engineering & Technical Skills (Select multiple)</Label>
                        <ChipsContainer>
                          {technicalSkillsList.map(skill => (
                            <Chip 
                              key={skill} 
                              $selected={formData.technicalSkills.includes(skill)}
                              onClick={() => toggleTechnicalSkill(skill)}
                            >
                              {formData.technicalSkills.includes(skill) && <Check />}
                              {skill}
                            </Chip>
                          ))}
                        </ChipsContainer>
                      </FormGroup>

                      {/* NCC / DEFENCE PREP SKILLS */}
                      <FormGroup style={{ marginBottom: '2rem' }}>
                        <Label>NCC & Armed Forces / Defence Skills (Select multiple)</Label>
                        <ChipsContainer>
                          {defenceSkillsList.map(skill => (
                            <Chip 
                              key={skill} 
                              $selected={formData.defenceSkills.includes(skill)}
                              onClick={() => toggleDefenceSkill(skill)}
                            >
                              {formData.defenceSkills.includes(skill) && <Check />}
                              {skill}
                            </Chip>
                          ))}
                        </ChipsContainer>
                      </FormGroup>

                      {/* DOMAIN EXPERTISE */}
                      <FormGroup>
                        <Label>General Domain Expertise (Select multiple)</Label>
                        <ChipsContainer>
                          {domainExpertiseList.map(domain => (
                            <Chip 
                              key={domain} 
                              $selected={formData.domainExpertise.includes(domain)}
                              onClick={() => toggleDomainExpertise(domain)}
                            >
                              {formData.domainExpertise.includes(domain) && <Check />}
                              {domain}
                            </Chip>
                          ))}
                        </ChipsContainer>
                      </FormGroup>
                    </FormSection>
                  </motion.div>
                )}

                {/* SUCCESS DISPLAY */}
                {submitSuccess && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <SuccessOverlay>
                      <SuccessIconWrapper>
                        <Check />
                      </SuccessIconWrapper>
                      <h2>Registration Complete!</h2>
                      <p>
                        Thank you, Officer/Mentor <strong>{formData.fullName}</strong>. We appreciate your willingness to support the cadets. We will review your mentorship domains and reach out to connect you with relevant mentees.
                      </p>
                      <Button onClick={() => navigate('/alumni')} $primary style={{ margin: '0 auto' }}>
                        Go Back to Alumni Network
                      </Button>
                    </SuccessOverlay>
                  </motion.div>
                )}
              </AnimatePresence>

              {!submitSuccess && (
                <ActionRow>
                  {activeStep > 1 ? (
                    <Button type="button" onClick={prevStep} whileTap={{ scale: 0.98 }}>
                      <ArrowLeft size={18} /> Previous
                    </Button>
                  ) : (
                    <div />
                  )}

                  {activeStep < 4 ? (
                    <Button type="button" $primary onClick={nextStep} whileTap={{ scale: 0.98 }}>
                      Next <ArrowRight size={18} />
                    </Button>
                  ) : (
                    <Button type="submit" $primary disabled={submitting} whileTap={{ scale: 0.98 }}>
                      {submitting ? 'Submitting...' : 'Register as Mentor'} <Check size={18} />
                    </Button>
                  )}
                </ActionRow>
              )}
            </form>
          </FormCard>
        </ContentWrapper>
      </PageContainer>
    </>
  );
};

export default BecomeMentorPage;
