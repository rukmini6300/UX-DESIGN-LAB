/* =========================================================================
   HTML IMPORT · SAMPLE PAGE
   A small page in a typical third-party style (framework class names,
   inline styles, a script and an inline event handler) for "Try a sample
   page". It shows what the converter maps and what it removes.

   Provides: HI_SAMPLE_NAME, HI_SAMPLE
   ========================================================================= */
'use strict';

const HI_SAMPLE_NAME = 'supplier-portal-sample.html';

const HI_SAMPLE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Supplier portal · Purchase requests</title>
  <link rel="stylesheet" href="https://cdn.example.com/bootstrap.min.css">
  <style>
    body { font-family: Georgia, serif; background: #fdf6e3; color: #333; }
    .btn-primary { background: #ff00aa; }
  </style>
  <script>console.log('tracking');</script>
</head>
<body onload="init()">
  <header class="navbar navbar-dark bg-dark">
    <strong style="color:#fff">Supplier portal</strong>
    <nav>
      <ul class="nav">
        <li><a href="#requests">Requests</a></li>
        <li><a href="#orders">Orders</a></li>
        <li><a href="javascript:logout()">Sign out</a></li>
      </ul>
    </nav>
  </header>

  <div class="container">
    <h1>Purchase requests</h1>
    <p>Raise a request for stock that is running low. Requests over $5,000 need approval.</p>

    <div class="alert alert-warning" role="alert">
      <b>3 requests</b> are waiting for your approval.
    </div>

    <div class="row">
      <div class="col-md-6">
        <div class="card">
          <h2 class="card-title">New request</h2>
          <form action="/requests" method="post">
            <div class="form-group">
              <label for="item">Item</label>
              <input id="item" class="form-control" type="text" placeholder="Search SKU or name">
            </div>
            <div class="form-group">
              <label for="qty">Quantity</label>
              <input id="qty" class="form-control" type="number" value="25">
            </div>
            <div class="form-group">
              <label for="site">Deliver to</label>
              <select id="site" class="form-select">
                <option>Chicago Central DC</option>
                <option>Dallas Distribution Center</option>
              </select>
            </div>
            <div class="form-group">
              <label for="note">Note for the buyer</label>
              <textarea id="note" class="form-control" rows="3"></textarea>
            </div>
            <label class="form-check"><input type="checkbox" checked> Urgent</label>
            <div class="actions">
              <button type="submit" class="btn btn-primary" onclick="send()">Submit request</button>
              <button type="button" class="btn btn-secondary">Save draft</button>
            </div>
          </form>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card">
          <h2 class="card-title">Recent requests</h2>
          <table class="table table-striped" border="1" cellpadding="6">
            <thead><tr><th>Request</th><th>Item</th><th>Qty</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>PR-1042</td><td>Bearing 6204-2RS</td><td>120</td><td><span class="badge bg-success">Approved</span></td></tr>
              <tr><td>PR-1041</td><td>Hydraulic hose 3/4"</td><td>40</td><td><span class="badge bg-warning">Pending</span></td></tr>
              <tr><td>PR-1039</td><td>Gasket kit, Type B</td><td>15</td><td><span class="badge bg-danger">Rejected</span></td></tr>
            </tbody>
          </table>
          <a href="#all" class="btn btn-link">View all requests</a>
          <button class="btn btn-danger">Delete selected</button>
        </div>
      </div>
    </div>

    <font color="red">Prices exclude tax.</font>
    <iframe src="https://ads.example.com/banner"></iframe>
  </div>

  <footer class="footer">© 2026 Supplier portal · <a href="#help">Help</a></footer>
  <script>function init(){} function send(){}</script>
</body>
</html>
`;
