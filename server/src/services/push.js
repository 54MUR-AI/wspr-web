const webpush = require('web-push');
const User = require('../models/User');

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.saveSubscription = async (userId, subscription) => {
  try {
    await User.update(
      { pushSubscription: subscription },
      { where: { id: userId } }
    );
    return true;
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return false;
  }
};

exports.sendPushNotification = async (userId, notification) => {
  try {
    const user = await User.findByPk(userId);
    if (!user || !user.pushSubscription) {
      return false;
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/logo192.png',
      badge: notification.badge || '/badge.png',
      data: {
        url: notification.url || '/',
        ...notification.data,
      },
    });

    await webpush.sendNotification(user.pushSubscription, payload);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    if (error.statusCode === 410) {
      // Subscription has expired or is no longer valid
      await User.update(
        { pushSubscription: null },
        { where: { id: userId } }
      );
    }
    return false;
  }
};

exports.sendMessageNotification = async (recipientId, message, sender) => {
  const notification = {
    title: `New message from ${sender.username}`,
    body: message.type === 'text' ? message.content : `Sent you a ${message.type}`,
    icon: sender.avatar,
    badge: '/badge.png',
    data: {
      url: '/chat',
      messageId: message.id,
      senderId: sender.id,
    },
  };

  return exports.sendPushNotification(recipientId, notification);
};

exports.sendGroupNotification = async (userId, group, notification) => {
  const payload = {
    title: `${group.name}`,
    body: notification.message,
    icon: group.avatar || '/group-avatar.png',
    badge: '/badge.png',
    data: {
      url: `/groups/${group.id}`,
      groupId: group.id,
      type: notification.type,
    },
  };

  return exports.sendPushNotification(userId, payload);
};

exports.sendCallNotification = async (recipientId, caller, type = 'video') => {
  const notification = {
    title: `Incoming ${type} call`,
    body: `${caller.username} is calling you`,
    icon: caller.avatar,
    badge: '/badge.png',
    data: {
      url: '/call',
      callerId: caller.id,
      callerName: caller.username,
      type,
    },
  };

  return exports.sendPushNotification(recipientId, notification);
};
