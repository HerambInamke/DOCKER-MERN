const Project = require('../models/Project');

class TrendingService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour in milliseconds
  }

  // Calculate trending score: (stars * 0.7) + (comments * 0.3)
  calculateTrendingScore(project) {
    const stars = project.metrics?.upvoteCount || 0;
    const comments = project.metrics?.commentCount || 0;
    return (stars * 0.7) + (comments * 0.3);
  }

  // Get trending projects with caching
  async getTrendingProjects(limit = 10) {
    const cacheKey = `trending_${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const projects = await Project.find({
        status: 'published',
        visibility: 'public',
      })
        .populate('author', 'username firstName lastName avatar')
        .sort({ createdAt: -1 })
        .limit(100); // Get more projects to calculate trending

      // Calculate trending scores and sort
      const projectsWithScores = projects.map(project => ({
        ...project.toObject(),
        trendingScore: this.calculateTrendingScore(project)
      }));

      const trendingProjects = projectsWithScores
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, limit);

      // Cache the results
      this.cache.set(cacheKey, {
        data: trendingProjects,
        timestamp: Date.now()
      });

      return trendingProjects;
    } catch (error) {
      console.error('Error getting trending projects:', error);
      return [];
    }
  }

  // Get popular tags with caching
  async getPopularTags(limit = 20) {
    const cacheKey = 'popular_tags';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const projects = await Project.find({
        status: 'published',
        visibility: 'public',
      }).select('tags');

      // Count tag occurrences
      const tagCounts = {};
      projects.forEach(project => {
        if (project.tags) {
          project.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      // Sort by count and get top tags
      const popularTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }));

      // Cache the results
      this.cache.set(cacheKey, {
        data: popularTags,
        timestamp: Date.now()
      });

      return popularTags;
    } catch (error) {
      console.error('Error getting popular tags:', error);
      return [];
    }
  }

  // Get popular technologies with caching
  async getPopularTechnologies(limit = 20) {
    const cacheKey = 'popular_technologies';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const projects = await Project.find({
        status: 'published',
        visibility: 'public',
      }).select('technologies');

      // Count technology occurrences
      const techCounts = {};
      projects.forEach(project => {
        if (project.technologies) {
          project.technologies.forEach(tech => {
            techCounts[tech] = (techCounts[tech] || 0) + 1;
          });
        }
      });

      // Sort by count and get top technologies
      const popularTechnologies = Object.entries(techCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([tech, count]) => ({ tech, count }));

      // Cache the results
      this.cache.set(cacheKey, {
        data: popularTechnologies,
        timestamp: Date.now()
      });

      return popularTechnologies;
    } catch (error) {
      console.error('Error getting popular technologies:', error);
      return [];
    }
  }

  // Clear cache (useful for testing or manual refresh)
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        timestamp: value.timestamp,
        age: Date.now() - value.timestamp
      }))
    };
  }
}

module.exports = new TrendingService();
