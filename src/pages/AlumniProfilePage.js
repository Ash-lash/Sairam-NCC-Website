import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Save, LogOut, User, Upload, Briefcase, Phone, Calendar } from 'lucide-react';
import SEO from '../components/common/SEO';
import { uploadFile } from '../utils/uploadHelper';
import FuturisticLogout from '../components/common/FuturisticLogout';

const PageContainer = styled.div`
  min-height: 100vh;
  padding: 100px 2rem 4rem;
  background: #f8f9fa;
`;

const ContentWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #1A2B4C;
  font-weight: 800;
`;

const FormCard = styled(motion.div)`
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  color: #1A2B4C;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #4b5563;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #1A2B4C;
    box-shadow: 0 0 0 3px rgba(26, 43, 76, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #1A2B4C;
    box-shadow: 0 0 0 3px rgba(26, 43, 76, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 1rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #1A2B4C;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const Button = styled(motion.button)`
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  font-size: 1rem;
  
  ${props => props.$primary ? `
    background: #1A2B4C;
    color: white;
    box-shadow: 0 4px 12px rgba(26, 43, 76, 0.2);
    &:hover { background: #2D4A7C; }
  ` : `
    background: #fee2e2;
    color: #991b1b;
    &:hover { background: #fecaca; }
  `}
`;

const ImagePreview = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 1rem;
  border: 4px solid #f0f0f0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const FileInputLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #4b5563;
  
  &:hover {
    background: #f9fafb;
  }
`;

const AlumniProfilePage = () => {
    const [user, setUser] = useState(null);
    const [profileId, setProfileId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        dob: '',
        nccStartYear: '',
        nccEndYear: '',
        batch: '',
        wing: 'Army',
        department: '',
        currentPosition: '',
        company: '',
        linkedin: '',
        achievements: '',
        photoUrl: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [isCustomDept, setIsCustomDept] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'cadets'));
                const uniqueDepts = new Set();
                querySnapshot.forEach(doc => {
                    if (doc.data().dept) {
                        uniqueDepts.add(doc.data().dept.trim().toUpperCase());
                    }
                });
                const sortedDepts = Array.from(uniqueDepts).sort();
                setDepartments(sortedDepts);
            } catch (error) {
                console.error('Error fetching departments:', error);
            }
        };
        fetchDepartments();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setFormData(prev => ({ ...prev, email: currentUser.email }));
                fetchProfile(currentUser);
            } else {
                navigate('/alumni-login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const fetchProfile = async (currentUser) => {
        try {
            // First try to find by userId
            const alumniRef = collection(db, 'alumni');
            let q = query(alumniRef, where('userId', '==', currentUser.uid));
            let querySnapshot = await getDocs(q);

            // If not found, try by email (for legacy linkage)
            if (querySnapshot.empty && currentUser.email) {
                q = query(alumniRef, where('email', '==', currentUser.email));
                querySnapshot = await getDocs(q);
            }

            if (!querySnapshot.empty) {
                const docData = querySnapshot.docs[0];
                setProfileId(docData.id);
                const data = docData.data();
                // Parse existing batch into start/end years
                let nccStart = data.nccStartYear || '';
                let nccEnd = data.nccEndYear || '';
                if (!nccStart && data.batch) {
                    const parts = data.batch.replace(/\s/g, '').split('-');
                    if (parts.length === 2) {
                        nccStart = parts[0];
                        nccEnd = parts[1];
                    }
                }
                setFormData(prev => ({
                    ...prev,
                    ...data,
                    nccStartYear: nccStart,
                    nccEndYear: nccEnd,
                    email: currentUser.email // Ensure email matches auth
                }));

                // Check if dept is custom
                if (data.department) {
                    const isKnown = departments.includes(data.department);
                    if (!isKnown && departments.length > 0) {
                        setIsCustomDept(true);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'departmentSelect') {
            if (value === 'Other') {
                setIsCustomDept(true);
                setFormData(prev => ({ ...prev, department: '' }));
            } else {
                setIsCustomDept(false);
                setFormData(prev => ({ ...prev, department: value }));
            }
            return;
        }

        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            // Auto-compute batch when either year changes
            if (name === 'nccStartYear' || name === 'nccEndYear') {
                const start = name === 'nccStartYear' ? value : prev.nccStartYear;
                const end = name === 'nccEndYear' ? value : prev.nccEndYear;
                updated.batch = (start && end) ? `${start}-${end}` : '';
            }
            return updated;
        });
    };

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        // FuturisticLogout handles the rest
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let url = formData.photoUrl;

            // Upload image to Cloudinary (via shared utility)
            if (imageFile) {
                console.log("Uploading profile image...");
                url = await uploadFile(imageFile);
            }

            const alumniData = {
                ...formData,
                photoUrl: url,
                userId: user.uid,
                updatedAt: new Date()
            };

            if (profileId) {
                await updateDoc(doc(db, 'alumni', profileId), alumniData);
            } else {
                const docRef = await addDoc(collection(db, 'alumni'), {
                    ...alumniData,
                    createdAt: new Date()
                });
                setProfileId(docRef.id);
            }

            setFormData(prev => ({ ...prev, photoUrl: url }));
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading profile...</div>;

    return (
        <PageContainer>
            <SEO title="My Alumni Profile" />
            <ContentWrapper>
                <Header>
                    <Title>My Profile</Title>
                    <Button onClick={handleLogout}>
                        <LogOut size={18} />
                        Logout
                    </Button>
                </Header>

                <FormCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                            <ImagePreview>
                                {imageFile ? (
                                    <img src={URL.createObjectURL(imageFile)} alt="Preview" loading="lazy" />
                                ) : formData.photoUrl ? (
                                    <img src={formData.photoUrl} alt="Profile" loading="lazy" />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={40} color="#999" />
                                    </div>
                                )}
                            </ImagePreview>
                            <FileInputLabel>
                                <Upload size={18} />
                                Change Photo
                                <input type="file" onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
                            </FileInputLabel>
                        </div>

                        <SectionTitle><User size={20} /> Personal Info</SectionTitle>
                        <Grid>
                            <FormGroup>
                                <Label>Full Name</Label>
                                <Input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>Email (Read-only)</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                />
                            </FormGroup>
                        </Grid>

                        <Grid>
                            <FormGroup>
                                <Label>NCC Start Year</Label>
                                <Select
                                    name="nccStartYear"
                                    value={formData.nccStartYear}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Year</option>
                                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                                </Select>
                            </FormGroup>
                            <FormGroup>
                                <Label>NCC End Year</Label>
                                <Select
                                    name="nccEndYear"
                                    value={formData.nccEndYear}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Year</option>
                                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                                </Select>
                            </FormGroup>
                            <FormGroup>
                                <Label>Wing</Label>
                                <Select
                                    name="wing"
                                    value={formData.wing}
                                    onChange={handleChange}
                                >
                                    <option value="Army">Army Wing</option>
                                    <option value="Navy">Navy Wing</option>
                                    <option value="Air">Air Wing</option>
                                </Select>
                            </FormGroup>
                        </Grid>

                        <FormGroup>
                            <Label>Department</Label>
                            <Select
                                name="departmentSelect"
                                value={isCustomDept ? 'Other' : formData.department}
                                onChange={handleChange}
                            >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                                <option value="Other">Other (Enter Manually)</option>
                            </Select>
                            {isCustomDept && (
                                <Input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    placeholder="Enter Department Name"
                                    style={{ marginTop: '0.5rem' }}
                                    required
                                />
                            )}
                        </FormGroup>

                        <SectionTitle><Phone size={20} /> Contact & Personal</SectionTitle>
                        <Grid>
                            <FormGroup>
                                <Label>Phone Number</Label>
                                <Input
                                    type="tel"
                                    name="phone"
                                    placeholder="e.g. +91 98765 43210"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>Date of Birth</Label>
                                <Input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Grid>

                        <SectionTitle><Briefcase size={20} /> Professional Info</SectionTitle>
                        <Grid>
                            <FormGroup>
                                <Label>Current Position/Role</Label>
                                <Input
                                    type="text"
                                    name="currentPosition"
                                    placeholder="e.g. Software Engineer"
                                    value={formData.currentPosition}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>Company/Organization</Label>
                                <Input
                                    type="text"
                                    name="company"
                                    placeholder="e.g. Google"
                                    value={formData.company}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Grid>

                        <FormGroup>
                            <Label>LinkedIn Profile URL</Label>
                            <Input
                                type="url"
                                name="linkedin"
                                placeholder="https://linkedin.com/in/..."
                                value={formData.linkedin}
                                onChange={handleChange}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>Achievements / Bio (Short)</Label>
                            <TextArea
                                name="achievements"
                                placeholder="Briefly describe your achievements or current work..."
                                value={formData.achievements}
                                onChange={handleChange}
                            />
                        </FormGroup>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                            <Button type="submit" $primary disabled={saving}>
                                <Save size={20} />
                                {saving ? 'Saving...' : 'Save Profile'}
                            </Button>
                        </div>
                    </form>
                </FormCard>
            </ContentWrapper>
            <AnimatePresence>
                {isLoggingOut && <FuturisticLogout onLogoutComplete={() => setIsLoggingOut(false)} />}
            </AnimatePresence>
        </PageContainer>
    );
};

export default AlumniProfilePage;
