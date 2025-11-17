const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');

module.exports = function(app) {
  // Handle CORS preflight (OPTIONS) locally in the dev server before proxying.
  // This avoids forwarding OPTIONS to the backend which may not handle it.
  app.options('/api/*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.sendStatus(200);
  });

  // Ensure we can read JSON bodies in our mock handlers
  // Do not install dev mock handlers here; forward requests to backend via proxy.
  // Keep JSON parser disabled for the dev proxy so request body streams reach the proxy unmodified.

  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8080/api/v1',
    changeOrigin: true,
      pathRewrite: {
        '^/api': ''  // Удаляем '/api' из пути, так как он уже есть в target
      },
      // Ensure Content-Type is set for POST requests
      onProxyReq(proxyReq, req) {
        if (req.method === 'POST') {
      proxyReq.setHeader('Content-Type', 'application/json');
        }
      },
      onError(err, req, res) {
        console.error('Proxy Error:', err);
      }
    })
  );
};
