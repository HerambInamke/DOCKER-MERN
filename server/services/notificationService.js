const Notification = require('../models/Notification');

class NotificationService {
  // Create follow notification
  static async createFollowNotification(followedUserId, followerUser) {
    try {
      await Notification.createNotification({
        user: followedUserId,
        type: 'follow',
        title: 'New Follower',
        message: `${followerUser.username} started following you`,
        data: {
          followerId: followerUser._id,
          followerUsername: followerUser.username,
        },
        triggeredBy: followerUser._id,
        entity: {
          type: 'user',
          id: followerUser._id,
        },
      });
    } catch (error) {
      console.error('Error creating follow notification:', error);
    }
  }

  // Create star notification
  static async createStarNotification(projectAuthorId, starrerUser, project) {
    try {
      await Notification.createNotification({
        user: projectAuthorId,
        type: 'star',
        title: 'Project Starred',
        message: `${starrerUser.username} starred your project "${project.title}"`,
        data: {
          projectId: project._id,
          projectTitle: project.title,
          starrerId: starrerUser._id,
          starrerUsername: starrerUser.username,
        },
        triggeredBy: starrerUser._id,
        entity: {
          type: 'project',
          id: project._id,
        },
      });
    } catch (error) {
      console.error('Error creating star notification:', error);
    }
  }

  // Create comment notification
  static async createCommentNotification(projectAuthorId, commenterUser, project, comment) {
    try {
      await Notification.createNotification({
        user: projectAuthorId,
        type: 'comment',
        title: 'New Comment',
        message: `${commenterUser.username} commented on your project "${project.title}"`,
        data: {
          projectId: project._id,
          projectTitle: project.title,
          commentId: comment._id,
          commentPreview: comment.content.substring(0, 100),
          commenterId: commenterUser._id,
          commenterUsername: commenterUser.username,
        },
        triggeredBy: commenterUser._id,
        entity: {
          type: 'comment',
          id: comment._id,
        },
      });
    } catch (error) {
      console.error('Error creating comment notification:', error);
    }
  }

  // Create reply notification
  static async createReplyNotification(parentCommentAuthorId, replierUser, project, reply) {
    try {
      await Notification.createNotification({
        user: parentCommentAuthorId,
        type: 'comment',
        title: 'Comment Reply',
        message: `${replierUser.username} replied to your comment on "${project.title}"`,
        data: {
          projectId: project._id,
          projectTitle: project.title,
          commentId: reply._id,
          commentPreview: reply.content.substring(0, 100),
          replierId: replierUser._id,
          replierUsername: replierUser.username,
        },
        triggeredBy: replierUser._id,
        entity: {
          type: 'comment',
          id: reply._id,
        },
      });
    } catch (error) {
      console.error('Error creating reply notification:', error);
    }
  }

  // Create system notification
  static async createSystemNotification(userId, title, message, data = {}) {
    try {
      await Notification.createNotification({
        user: userId,
        type: 'system',
        title,
        message,
        data,
      });
    } catch (error) {
      console.error('Error creating system notification:', error);
    }
  }

  // Get notification stats for a user
  static async getNotificationStats(userId) {
    try {
      const [unreadCount, totalCount] = await Promise.all([
        Notification.countDocuments({ user: userId, isRead: false }),
        Notification.countDocuments({ user: userId }),
      ]);

      return { unreadCount, totalCount };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return { unreadCount: 0, totalCount: 0 };
    }
  }
}

module.exports = NotificationService;
