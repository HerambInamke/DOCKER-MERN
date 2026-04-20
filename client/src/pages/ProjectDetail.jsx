import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { Calendar, ExternalLink, Eye, Github, MessageCircle, Pencil, Star, Trash2, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [comment, setComment] = useState('');

  const {
    data: project,
    isLoading,
    error,
  } = useQuery(['project', id], () => api.get(`/api/projects/${id}`).then(res => res.data.project), {
    enabled: !!id,
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery(
    ['project-comments', id],
    () => api.get(`/api/projects/${id}/comments`).then(res => res.data),
    {
      enabled: !!id,
    }
  );

  const upvoteMutation = useMutation(() => api.post(`/api/projects/${id}/upvote`), {
    onSuccess: () => {
      queryClient.invalidateQueries(['project', id]);
    },
    onError: () => toast.error('Could not update your upvote.'),
  });

  const commentMutation = useMutation(
    content => api.post(`/api/projects/${id}/comments`, { content }),
    {
      onSuccess: () => {
        setComment('');
        queryClient.invalidateQueries(['project-comments', id]);
        queryClient.invalidateQueries(['project', id]);
        toast.success('Comment posted.');
      },
      onError: error => {
        toast.error(error.response?.data?.message || 'Could not post comment.');
      },
    }
  );

  const deleteProjectMutation = useMutation(() => api.delete(`/api/projects/${id}`), {
    onSuccess: () => {
      toast.success('Project deleted.');
      navigate('/projects');
    },
    onError: error => {
      toast.error(error.response?.data?.message || 'Could not delete project.');
    },
  });

  const hasUserUpvoted = project?.upvotes?.some(upvote => {
    const upvoteUser = typeof upvote.user === 'string' ? upvote.user : upvote.user?._id;
    return upvoteUser === user?._id;
  });

  const isOwner = project?.author?._id === user?._id;

  const handleUpvote = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    upvoteMutation.mutate();
  };

  const handleCommentSubmit = event => {
    event.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      toast.error('Write a comment first.');
      return;
    }
    commentMutation.mutate(trimmedComment);
  };

  const handleDeleteProject = () => {
    const confirmed = window.confirm('Delete this project? This will also remove its comments.');
    if (confirmed) {
      deleteProjectMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-10 w-2/3 rounded bg-slate-200" />
          <div className="h-28 rounded bg-slate-200" />
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="h-96 rounded bg-slate-200" />
            <div className="h-80 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-24">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-3xl font-bold text-slate-950">Project not found</h1>
          <p className="mt-3 text-slate-600">This project may have been removed or made private.</p>
          <Link className="mt-8 inline-flex rounded-md bg-blue-600 px-4 py-2 font-medium text-white" to="/projects">
            Browse projects
          </Link>
        </div>
      </div>
    );
  }

  const comments = commentsData?.comments || [];
  const authorName = project.author?.displayName || `${project.author?.firstName || ''} ${project.author?.lastName || ''}`.trim() || project.author?.username;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <Link to="/projects" className="font-medium text-blue-600 hover:text-blue-700">
                Projects
              </Link>
              <span>/</span>
              <span>{project.title}</span>
            </div>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950">{project.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{project.shortDescription}</p>
          </div>
          {isOwner && (
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/edit-project/${project._id}`}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800 hover:bg-slate-100"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit project
              </Link>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deleteProjectMutation.isLoading}
                className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleteProjectMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <main className="space-y-8">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-semibold text-slate-950">About this project</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-700">{project.description}</p>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="flex items-center font-medium text-slate-900">
                    <Github className="mr-3 h-5 w-5" />
                    GitHub repository
                  </span>
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                </a>
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span className="flex items-center font-medium text-slate-900">
                      <ExternalLink className="mr-3 h-5 w-5" />
                      Live demo
                    </span>
                    <ExternalLink className="h-4 w-4 text-slate-500" />
                  </a>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-semibold text-slate-950">Comments</h2>
              <p className="mt-2 text-sm text-slate-500">
                Everyone can read the discussion. Sign in to add your thoughts.
              </p>

              {isAuthenticated ? (
                <form onSubmit={handleCommentSubmit} className="mt-6 space-y-3">
                  <textarea
                    value={comment}
                    onChange={event => setComment(event.target.value)}
                    rows={4}
                    maxLength={1000}
                    className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ask a question, share feedback, or tell the maker what you liked."
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{comment.length}/1000</span>
                    <button
                      type="submit"
                      disabled={commentMutation.isLoading}
                      className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {commentMutation.isLoading ? 'Posting...' : 'Post comment'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
                    Log in
                  </Link>{' '}
                  to comment or upvote this project.
                </div>
              )}

              <div className="mt-8 space-y-4">
                {commentsLoading ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map(item => (
                      <div key={item} className="h-20 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                  </div>
                ) : comments.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 p-8 text-center text-slate-500">
                    No comments yet. Be the first to start the conversation.
                  </div>
                ) : (
                  comments.map(item => (
                    <article key={item._id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600">
                          {item.author?.firstName?.charAt(0) || item.author?.username?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <Link
                              to={`/profile/${item.author?.username}`}
                              className="font-semibold text-slate-900 hover:text-blue-600"
                            >
                              {item.author?.displayName || item.author?.username || 'Unknown user'}
                            </Link>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{item.content}</p>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Maker</h2>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
                  <User className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <Link to={`/profile/${project.author?.username}`} className="font-semibold text-slate-950 hover:text-blue-600">
                    {authorName}
                  </Link>
                  <p className="text-sm text-slate-500">@{project.author?.username}</p>
                </div>
              </div>
              {project.author?.bio && <p className="mt-4 text-sm leading-6 text-slate-600">{project.author.bio}</p>}
              {project.author?.college && <p className="mt-3 text-sm text-slate-500">{project.author.college}</p>}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <button
                type="button"
                onClick={handleUpvote}
                disabled={upvoteMutation.isLoading}
                className={`flex w-full items-center justify-center rounded-md px-4 py-3 font-semibold transition-colors ${
                  hasUserUpvoted
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    : 'bg-slate-950 text-white hover:bg-slate-800'
                }`}
              >
                <Star className="mr-2 h-5 w-5" />
                {hasUserUpvoted ? 'Upvoted' : 'Upvote project'}
              </button>

              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-slate-50 p-3">
                  <Star className="mx-auto h-4 w-4 text-slate-500" />
                  <p className="mt-2 text-lg font-semibold text-slate-950">{project.metrics?.upvoteCount || 0}</p>
                  <p className="text-xs text-slate-500">Upvotes</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <Eye className="mx-auto h-4 w-4 text-slate-500" />
                  <p className="mt-2 text-lg font-semibold text-slate-950">{project.views || 0}</p>
                  <p className="text-xs text-slate-500">Views</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <MessageCircle className="mx-auto h-4 w-4 text-slate-500" />
                  <p className="mt-2 text-lg font-semibold text-slate-950">{project.metrics?.commentCount || 0}</p>
                  <p className="text-xs text-slate-500">Comments</p>
                </div>
              </div>

              <div className="mt-5 flex items-center text-sm text-slate-500">
                <Calendar className="mr-2 h-4 w-4" />
                Posted {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-950">Technologies</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.technologies?.length ? (
                  project.technologies.map(tech => (
                    <Link
                      key={tech}
                      to={`/projects?technologies=${encodeURIComponent(tech)}`}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700"
                    >
                      {tech}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No technologies listed.</p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-950">Tags</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tags?.length ? (
                  project.tags.map(tag => (
                    <Link
                      key={tag}
                      to={`/projects?tags=${encodeURIComponent(tag)}`}
                      className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                    >
                      {tag}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No tags listed.</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
