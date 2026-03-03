import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Image as ImageIcon, User, BookOpen,
    Tag, Compass, Sparkles, CheckCircle2,
    ChevronLeft, Layout
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 100px;
  background: #f8fafc;
  padding-bottom: 5rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const ContentWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1.5rem;
`;

const FormCard = styled(motion.div)`
  background: white;
  border-radius: 32px;
  padding: 3rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) { padding: 1.5rem; }

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 6px;
    background: linear-gradient(90deg, #1a2b4c, #FFBF00);
  }
`;

const Header = styled.div`
  margin-bottom: 3rem;
  text-align: center;

  h1 { font-size: 2.5rem; font-weight: 900; color: #1a2b4c; letter-spacing: -1.5px; }
  p { color: #64748b; margin-top: 0.5rem; font-size: 1.1rem; }
`;

const InputGroup = styled.div`
  margin-bottom: 2rem;
  label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: #1a2b4c;
    margin-bottom: 0.8rem;
    font-size: 0.95rem;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 1rem 1.2rem;
  border: 2px solid #f1f5f9;
  border-radius: 16px;
  background: #f8fafc;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #FFBF00;
    background: white;
    box-shadow: 0 10px 20px -5px rgba(255, 191, 0, 0.1);
  }
`;

const StyledTextArea = styled.textarea`
  width: 100%;
  padding: 1rem 1.2rem;
  border: 2px solid #f1f5f9;
  border-radius: 16px;
  background: #f8fafc;
  font-size: 1rem;
  font-family: inherit;
  min-height: 250px;
  resize: vertical;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #FFBF00;
    background: white;
  }
`;

const ImageUpload = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  border: 2px dashed #e2e8f0;
  border-radius: 20px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #FFBF00;
    background: #fffdf5;
  }

  .preview {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    border-radius: 12px;
    margin-bottom: 1rem;
  }
`;

const SubmitButton = styled(motion.button)`
  width: 100%;
  padding: 1.2rem;
  background: #1a2b4c;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 20px 30px -10px rgba(26, 43, 76, 0.3);

  &:disabled { opacity: 0.7; cursor: wait; }
`;

const SuccessScreen = styled(motion.div)`
  text-align: center;
  padding: 4rem 2rem;

  .icon {
    width: 100px;
    height: 100px;
    background: #FFBF0020;
    color: #FFBF00;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 2rem;
  }

  h2 { font-size: 2.5rem; font-weight: 900; color: #1a2b4c; }
  p { color: #64748b; font-size: 1.2rem; margin-top: 1rem; }
`;

const SubmitBlogPage = () => {
    const [formData, setFormData] = useState({
        title: '',
        authorName: '',
        content: '',
        category: 'Experience',
        tags: '',
        image: null
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content || !formData.authorName) return alert("Please fill mandatory fields.");

        setSubmitting(true);
        try {
            let imageUrl = '';
            if (formData.image) {
                const fileRef = ref(storage, `blogs/${Date.now()}_${formData.image.name}`);
                await uploadBytes(fileRef, formData.image);
                imageUrl = await getDownloadURL(fileRef);
            }

            await addDoc(collection(db, 'blogs'), {
                title: formData.title,
                authorName: formData.authorName,
                content: formData.content,
                category: formData.category,
                tags: formData.tags.split(',').map(t => t.trim()),
                imageUrl,
                status: 'pending',
                createdAt: new Date().toISOString(),
                views: 0
            });

            setSuccess(true);
        } catch (error) {
            console.error(error);
            alert("Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageContainer>
            <SEO title="Share Your Story" description="Contribute to the Sairam NCC Blog. Share your experiences and insights." />
            <ContentWrapper>
                <AnimatePresence mode="wait">
                    {!success ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Header>
                                <h1>Voices of Sairam NCC</h1>
                                <p>Pen down your experiences, lessons, and legacies.</p>
                            </Header>

                            <FormCard>
                                <form onSubmit={handleSubmit}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <InputGroup>
                                            <label><BookOpen size={18} /> Blog Title *</label>
                                            <StyledInput
                                                placeholder="Enter a catchy title"
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            />
                                        </InputGroup>
                                        <InputGroup>
                                            <label><User size={18} /> Author Name *</label>
                                            <StyledInput
                                                placeholder="Your full name"
                                                value={formData.authorName}
                                                onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                                            />
                                        </InputGroup>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <InputGroup>
                                            <label><Compass size={18} /> Category</label>
                                            <StyledInput as="select"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                style={{ background: '#f8fafc' }}
                                            >
                                                <option value="Experience">Experience</option>
                                                <option value="Achievements">Achievements</option>
                                                <option value="Training">Training</option>
                                                <option value="Perspective">Perspective</option>
                                            </StyledInput>
                                        </InputGroup>
                                        <InputGroup>
                                            <label><Tag size={18} /> Tags (Comma separated)</label>
                                            <StyledInput
                                                placeholder="e.g. RDC, Trekking, Leadership"
                                                value={formData.tags}
                                                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                            />
                                        </InputGroup>
                                    </div>

                                    <InputGroup>
                                        <label><Layout size={18} /> Featured Image</label>
                                        <ImageUpload>
                                            <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="preview" />
                                            ) : (
                                                <>
                                                    <ImageIcon size={48} color="#94a3b8" />
                                                    <p>Click to upload a cover photo</p>
                                                </>
                                            )}
                                        </ImageUpload>
                                    </InputGroup>

                                    <InputGroup>
                                        <label><Sparkles size={18} /> The Narrative *</label>
                                        <StyledTextArea
                                            placeholder="Tell your story here..."
                                            value={formData.content}
                                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        />
                                    </InputGroup>

                                    <SubmitButton
                                        type="submit"
                                        disabled={submitting}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Send size={20} /> {submitting ? "Broadcasting..." : "Submit for Approval"}
                                    </SubmitButton>
                                </form>
                            </FormCard>
                        </motion.div>
                    ) : (
                        <SuccessScreen
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="icon"><CheckCircle2 size={60} /></div>
                            <h2>Story Submitted!</h2>
                            <p>Thank you for contributing. Our admins will review and publish it soon.</p>
                            <SubmitButton
                                style={{ maxWidth: '300px', margin: '2rem auto' }}
                                onClick={() => navigate('/blog')}
                            >
                                <ChevronLeft size={20} /> Back to Blog
                            </SubmitButton>
                        </SuccessScreen>
                    )}
                </AnimatePresence>
            </ContentWrapper>
        </PageContainer>
    );
};

export default SubmitBlogPage;
