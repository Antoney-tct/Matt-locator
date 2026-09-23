/* Local notification center for the static prototype. */
(function () {
  'use strict';

  var mount = document.querySelector('.topnav-inner');
  if (!mount || typeof MT === 'undefined') return;

  var notifications = MT.loadNotifications();
  var wrapper = document.createElement('div');
  wrapper.className = 'notification-center';
  wrapper.innerHTML = '<button class="notification-toggle" type="button" aria-label="Open notifications" aria-expanded="false"><span data-icon="bell"></span><span class="notification-count" hidden>0</span></button>' +
    '<div class="notification-panel" hidden><div class="notification-panel-head"><strong>Notifications</strong><button type="button" class="notification-clear">Clear all</button></div><div class="notification-list"></div><div class="notification-permission" hidden><span>Get browser alerts for booking updates.</span><button type="button">Enable alerts</button></div></div>';
  mount.appendChild(wrapper);
  hydrateIcons(wrapper);

  var toggle = wrapper.querySelector('.notification-toggle');
  var panel = wrapper.querySelector('.notification-panel');
  var count = wrapper.querySelector('.notification-count');
  var list = wrapper.querySelector('.notification-list');
  var clear = wrapper.querySelector('.notification-clear');
  var permission = wrapper.querySelector('.notification-permission');

  function escapeText(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
    });
  }

  function render() {
    notifications = MT.loadNotifications();
    var unread = notifications.filter(function (item) { return !item.read; }).length;
    count.hidden = unread === 0;
    count.textContent = unread > 9 ? '9+' : unread;
    list.innerHTML = notifications.length ? notifications.map(function (item) {
      return '<article class="notification-item' + (item.read ? '' : ' is-unread') + '">' +
        '<span class="notification-icon">' + icon(item.icon || 'info') + '</span>' +
        '<div><strong>' + escapeText(item.title) + '</strong><p>' + escapeText(item.message) + '</p><time>' + escapeText(item.timeLabel || 'Just now') + '</time></div></article>';
    }).join('') : '<p class="notification-empty">You are all caught up.</p>';
    if ('Notification' in window && Notification.permission === 'default') permission.hidden = false;
  }

  toggle.addEventListener('click', function () {
    var opening = panel.hidden;
    panel.hidden = !opening;
    toggle.setAttribute('aria-expanded', String(opening));
    if (opening) {
      MT.markNotificationsRead();
      render();
    }
  });
  clear.addEventListener('click', function () { MT.clearNotifications(); render(); });
  permission.querySelector('button').addEventListener('click', function () {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then(function () { permission.hidden = true; });
  });
  document.addEventListener('click', function (event) {
    if (!wrapper.contains(event.target)) { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
  });

  render();
})();
