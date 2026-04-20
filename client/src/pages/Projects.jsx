import { useCallback, useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { Search, Star, Eye, Calendar } from 'lucide-react';

const Projects = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest',
    tags: searchParams.get('tags') || '',
    technologies: searchParams.get('technologies') || '',
    page: Number(searchParams.get('page')) || 1,
  });
  const [draftFilters, setDraftFilters] = useState({
    search: searchParams.get('search') || '',
    tags: searchParams.get('tags') || '',
    technologies: searchParams.get('technologies') || '',
  });

  useEffect(() => {
    const nextFilters = {
      search: searchParams.get('search') || '',
      sort: searchParams.get('sort') || 'newest',
      tags: searchParams.get('tags') || '',
      technologies: searchParams.get('technologies') || '',
      page: Number(searchParams.get('page')) || 1,
    };

    setFilters(nextFilters);
    setDraftFilters({
      search: nextFilters.search,
      tags: nextFilters.tags,
      technologies: nextFilters.technologies,
    });
  }, [searchParams]);

  const handleFilterChange = useCallback((key, value) => {
    const nextFilters = key === 'bulk'
      ? { ...filters, ...value, page: 1 }
      : { ...filters, [key]: value, page: 1 };
    setFilters(nextFilters);
    const nextParams = new URLSearchParams();
    Object.entries(nextFilters).forEach(([filterKey, filterValue]) => {
      if (filterValue && filterValue !== 'newest' && filterValue !== 1) {
        nextParams.set(filterKey, filterValue);
      }
    });
    setSearchParams(nextParams);
  }, [filters, setSearchParams]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const hasChanged =
        draftFilters.search !== filters.search ||
        draftFilters.tags !== filters.tags ||
        draftFilters.technologies !== filters.technologies;

      if (hasChanged) {
        handleFilterChange('bulk', draftFilters);
      }
    }, 450);

    return () => clearTimeout(timeout);
  }, [draftFilters, filters.search, filters.tags, filters.technologies, handleFilterChange]);

  const { data, isLoading, error } = useQuery(
    ['projects', filters],
    () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return api.get(`/api/projects?${params.toString()}`).then(res => res.data);
    },
    {
      keepPreviousData: true,
    }
  );

  const handlePageChange = (page) => {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', page);
    setSearchParams(nextParams);
  };

  const clearFilters = () => {
    const nextFilters = {
      search: '',
      sort: 'newest',
      tags: '',
      technologies: '',
      page: 1,
    };
    setFilters(nextFilters);
    setDraftFilters({
      search: '',
      tags: '',
      technologies: '',
    });
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Projects</h1>
          <p className="text-gray-600">
            Explore amazing projects built by developers around the world
          </p>
          </div>
          <Link
            to="/create-project"
            className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Post a project
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={draftFilters.search}
                onChange={(e) => setDraftFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Popular</option>
              <option value="trending">Trending</option>
            </select>

            {/* Tags */}
            <input
              type="text"
              placeholder="Filter by tags..."
              value={draftFilters.tags}
              onChange={(e) => setDraftFilters(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Technologies */}
            <input
              type="text"
              placeholder="Filter by technologies..."
              value={draftFilters.technologies}
              onChange={(e) => setDraftFilters(prev => ({ ...prev, technologies: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {(filters.search || filters.tags || filters.technologies || filters.sort !== 'newest') && (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-600">
                Showing filtered results{data?.pagination?.total !== undefined ? ` (${data.pagination.total})` : ''}
              </span>
              <button type="button" onClick={clearFilters} className="font-medium text-blue-600 hover:text-blue-700">
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Error loading projects. Please try again.</p>
          </div>
        ) : data?.projects?.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white py-12 text-center">
            <p className="text-gray-600">No projects found matching your criteria.</p>
            <button type="button" onClick={clearFilters} className="mt-4 rounded-md bg-slate-950 px-4 py-2 font-medium text-white">
              Reset filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.projects?.map((project) => (
                <div key={project._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Author */}
                    <div className="flex items-center space-x-3 mb-4">
                      {project.author?.avatar ? (
                        <img
                          src={project.author.avatar}
                          alt={project.author.username}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {project.author?.firstName?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{project.author?.displayName || project.author?.username}</p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Project Info */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{project.shortDescription}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags?.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags?.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{project.tags.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Technologies */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies?.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Stats and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          {project.metrics?.upvoteCount || 0}
                        </span>
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {project.views || 0}
                        </span>
                      </div>
                      <Link
                        to={`/projects/${project._id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Project →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.pages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={!data.pagination.hasPrev}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  {[...Array(data.pagination.pages)].map((_, i) => {
                    const page = i + 1;
                    const isCurrentPage = page === filters.page;
                    
                    if (
                      page === 1 ||
                      page === data.pagination.pages ||
                      (page >= filters.page - 1 && page <= filters.page + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 border rounded-lg ${
                            isCurrentPage
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === filters.page - 2 ||
                      page === filters.page + 2
                    ) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={!data.pagination.hasNext}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Projects;
 
