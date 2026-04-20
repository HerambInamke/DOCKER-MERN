import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { Calendar, Edit3, ExternalLink, Github, Linkedin, MapPin, Save, Star, Twitter, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

const profileFields = ['firstName', 'lastName', 'bio', 'location', 'website', 'github', 'twitter', 'linkedin'];

const Profile = () => {
  const { username } = useParams();
  const queryClient = useQueryClient();
  const { user: currentUser, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    website: '',
    github: '',
    twitter: '',
    linkedin: '',
    skills: '',
  });

  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery(['profile', username], () => api.get(`/api/users/${username}`).then(res => res.data), {
    enabled: !!username,
    retry: false,
  });

  const profileUser = profileData?.user;
  const projects = profileData?.projects || [];
  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    if (!profileUser) return;

    const nextFormData = {};
    profileFields.forEach(field => {
      nextFormData[field] = profileUser[field] || '';
    });
    nextFormData.skills = profileUser.skills?.join(', ') || '';
    setFormData(nextFormData);
  }, [profileUser]);

  const handleChange = event => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async event => {
    event.preventDefault();
    setIsSaving(true);

    const payload = {
      ...profileFields.reduce((acc, field) => ({ ...acc, [field]: formData[field].trim() }), {}),
      skills: formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(Boolean),
    };

    const result = await updateProfile(payload);
    setIsSaving(false);

    if (result.success) {
      setIsEditing(false);
      queryClient.invalidateQueries(['profile', username]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-48 rounded-lg bg-slate-200" />
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map(item => (
              <div key={item} className="h-44 rounded-lg bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-24">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-3xl font-bold text-slate-950">User not found</h1>
          <p className="mt-3 text-slate-600">The profile you are looking for does not exist or is private.</p>
          <Link className="mt-8 inline-flex rounded-md bg-blue-600 px-4 py-2 font-medium text-white" to="/projects">
            Browse projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-slate-200 text-3xl font-bold text-slate-600">
                {profileUser.avatar ? (
                  <img src={profileUser.avatar} alt={profileUser.username} className="h-24 w-24 rounded-full object-cover" />
                ) : (
                  `${profileUser.firstName?.charAt(0) || ''}${profileUser.lastName?.charAt(0) || ''}`
                )}
              </div>

              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-slate-950">
                  {profileUser.firstName} {profileUser.lastName}
                </h1>
                <p className="mt-1 text-lg text-slate-500">@{profileUser.username}</p>
                {profileUser.bio && <p className="mt-4 max-w-3xl leading-7 text-slate-700">{profileUser.bio}</p>}

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                  {profileUser.location && (
                    <span className="flex items-center">
                      <MapPin className="mr-1.5 h-4 w-4" />
                      {profileUser.location}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Calendar className="mr-1.5 h-4 w-4" />
                    Joined {new Date(profileUser.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setIsEditing(value => !value)}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800 hover:bg-slate-100"
              >
                {isEditing ? <X className="mr-2 h-4 w-4" /> : <Edit3 className="mr-2 h-4 w-4" />}
                {isEditing ? 'Cancel edit' : 'Edit profile'}
              </button>
            )}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-950">{projects.length}</p>
              <p className="text-sm text-slate-500">Projects</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-950">{profileUser.followers?.length || 0}</p>
              <p className="text-sm text-slate-500">Followers</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-950">{profileUser.following?.length || 0}</p>
              <p className="text-sm text-slate-500">Following</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {profileUser.github && (
              <a className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700" href={`https://github.com/${profileUser.github}`} target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" /> GitHub
              </a>
            )}
            {profileUser.twitter && (
              <a className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700" href={`https://twitter.com/${profileUser.twitter}`} target="_blank" rel="noopener noreferrer">
                <Twitter className="mr-2 h-4 w-4" /> Twitter
              </a>
            )}
            {profileUser.linkedin && (
              <a className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700" href={`https://linkedin.com/in/${profileUser.linkedin}`} target="_blank" rel="noopener noreferrer">
                <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
              </a>
            )}
            {profileUser.website && (
              <a className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700" href={profileUser.website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Website
              </a>
            )}
          </div>
        </section>

        {isEditing && (
          <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-slate-950">Update profile</h2>
            <form onSubmit={handleSave} className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">First name</span>
                <input name="firstName" value={formData.firstName} onChange={handleChange} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Last name</span>
                <input name="lastName" value={formData.lastName} onChange={handleChange} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Bio</span>
                <textarea name="bio" rows={4} maxLength={500} value={formData.bio} onChange={handleChange} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Location</span>
                <input name="location" value={formData.location} onChange={handleChange} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Website</span>
                <input name="website" value={formData.website} onChange={handleChange} placeholder="https://example.com" className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">GitHub username</span>
                <input name="github" value={formData.github} onChange={handleChange} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Twitter username</span>
                <input name="twitter" value={formData.twitter} onChange={handleChange} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">LinkedIn username</span>
                <input name="linkedin" value={formData.linkedin} onChange={handleChange} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Skills</span>
                <input name="skills" value={formData.skills} onChange={handleChange} placeholder="React, Node.js, MongoDB" className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <div className="md:col-span-2 flex justify-end">
                <button disabled={isSaving} className="inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>
        )}

        {profileUser.skills?.length > 0 && (
          <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-slate-950">Skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {profileUser.skills.map(skill => (
                <Link key={skill} to={`/projects?technologies=${encodeURIComponent(skill)}`} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  {skill}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Projects</h2>
              <p className="mt-1 text-slate-500">Public projects shared by @{profileUser.username}</p>
            </div>
            {isOwnProfile && (
              <Link to="/create-project" className="inline-flex rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
                Add project
              </Link>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-slate-600">{isOwnProfile ? 'You have not posted a project yet.' : 'This user has not posted any public projects yet.'}</p>
              {isOwnProfile && (
                <Link to="/create-project" className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 font-medium text-white">
                  Post your first project
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map(project => (
                <article key={project._id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                  <h3 className="text-lg font-semibold text-slate-950">{project.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{project.shortDescription}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                    <span className="inline-flex items-center">
                      <Star className="mr-1 h-4 w-4" />
                      {project.metrics?.upvoteCount || 0}
                    </span>
                    <Link to={`/projects/${project._id}`} className="font-medium text-blue-600 hover:text-blue-700">
                      View project
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Profile;
