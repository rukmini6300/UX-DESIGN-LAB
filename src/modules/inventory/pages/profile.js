/* =========================================================================
   MY PROFILE
   Account details and recent activity.

   Provides: #/profile
   ========================================================================= */
'use strict';

ROUTES.profile = () => {
  const mine = audit.filter(a => a.user === CURRENT_USER.name).slice(0, 8);
  return {
    title: 'My Profile',
    nav: '',
    crumbs: [['My Profile']],
    sub: 'Your account details and recent activity.',
    body:
      '<div class="grid g-main"><form class="card" id="prof" novalidate><div class="form-section"><div class="row" style="gap:16px;margin-bottom:20px"><span class="avatar lg">AM</span><div><h2 style="font-size:18px;font-weight:650">' +
      esc(CURRENT_USER.name) +
      '</h2><p class="muted">' +
      esc(CURRENT_USER.role) +
      ' · ' +
      esc(CURRENT_USER.dept) +
      '</p></div></div><div class="form-grid">' +
      F({
        name: 'name',
        label: 'Full name',
        span: 6,
        value: CURRENT_USER.name,
        readonly: true,
        hint: 'Managed by your administrator'
      }) +
      F({ name: 'email', label: 'Email', type: 'email', req: true, span: 6, value: CURRENT_USER.email }) +
      F({
        name: 'phone',
        label: 'Phone',
        req: true,
        span: 6,
        value: CURRENT_USER.phone,
        pattern: '^[+0-9 ()-]{7,20}$',
        patternMsg: 'Enter a valid phone number'
      }) +
      F({
        name: 'location',
        label: 'Home warehouse',
        type: 'select',
        span: 6,
        value: CURRENT_USER.location,
        placeholder: false,
        options: activeWh().map(w => w.name)
      }) +
      '</div></div><div class="form-actions"><span class="spacer"></span>' +
      btn('Save profile', 'save', 'primary', 'type="submit"') +
      '</div></form>' +
      card('Recent activity', auditTimeline(mine), {
        sub: 'Your latest changes',
        actions: '<a class="btn btn-sm btn-ghost" href="#/audit?user=Alex%20Morgan">All activity</a>'
      }) +
      '</div>',
    mount(page) {
      const f = $('#prof', page);
      f.addEventListener('submit', e => {
        e.preventDefault();
        if (!validateForm(f)) return;
        const d = formData(f);
        ['email', 'phone', 'location'].forEach(k => {
          if (CURRENT_USER[k] !== d[k]) {
            logAudit('Security', 'Updated', 'Profile ' + k, CURRENT_USER[k], d[k]);
            CURRENT_USER[k] = d[k];
          }
        });
        toast('success', 'Profile saved', 'Your contact details are updated.');
      });
    }
  };
};
