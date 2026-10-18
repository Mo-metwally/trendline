const { EventEmitter } = require('events');
const { NextResponse } = require('next/server');
const { app, initDb } = require('../serverApp');

async function handleNextApiRequest(request) {
  await initDb();

  const urlObj = new URL(request.url);
  const pathname = urlObj.pathname;
  const search = urlObj.search;

  // Parse query parameters
  const query = {};
  for (const [key, val] of urlObj.searchParams.entries()) {
    if (query[key] !== undefined) {
      if (Array.isArray(query[key])) {
        query[key].push(val);
      } else {
        query[key] = [query[key], val];
      }
    } else {
      query[key] = val;
    }
  }

  // Parse headers
  const headers = {};
  request.headers.forEach((val, key) => {
    headers[key.toLowerCase()] = val;
  });

  // Parse body if applicable
  let body = {};
  const method = request.method.toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const contentType = headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      try {
        body = await request.json();
      } catch {
        body = {};
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      try {
        const text = await request.text();
        const params = new URLSearchParams(text);
        body = Object.fromEntries(params.entries());
      } catch {
        body = {};
      }
    } else {
      try {
        body = await request.text();
      } catch {
        body = {};
      }
    }
  }

  // Create synthetic Node req
  const req = Object.assign(new EventEmitter(), {
    method,
    url: pathname + search,
    originalUrl: pathname + search,
    headers,
    query,
    body,
    _body: true, // Tells express body-parser that body is already resolved
    complete: true,
  });
  Object.setPrototypeOf(req, app.request);

  // Create synthetic Node res
  const resHeaders = new Headers();
  let statusCode = 200;
  const chunks = [];

  const res = Object.assign(new EventEmitter(), {
    req,
    statusCode: 200,
    setHeader: (k, v) => {
      resHeaders.set(k.toLowerCase(), String(v));
    },
    getHeader: (k) => resHeaders.get(k.toLowerCase()),
    getHeaders: () => Object.fromEntries(resHeaders.entries()),
    removeHeader: (k) => {
      resHeaders.delete(k.toLowerCase());
    },
    writeHead: (code, hdrs) => {
      statusCode = code;
      if (hdrs) {
        if (Array.isArray(hdrs)) {
          for (let i = 0; i < hdrs.length; i += 2) {
            resHeaders.set(hdrs[i].toLowerCase(), String(hdrs[i + 1]));
          }
        } else {
          Object.entries(hdrs).forEach(([k, v]) => resHeaders.set(k.toLowerCase(), String(v)));
        }
      }
    },
  });
  Object.setPrototypeOf(res, app.response);
  req.res = res;

  await new Promise((resolve) => {
    let resolved = false;
    const finish = () => {
      if (!resolved) {
        resolved = true;
        res.emit('finish');
        res.emit('close');
        resolve();
      }
    };

    res.write = function (chunk, encoding) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding || 'utf8'));
      }
      return true;
    };

    res.end = function (chunk, encoding) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding || 'utf8'));
      }
      finish();
    };

    app.handle(req, res, (err) => {
      if (resolved) return;
      if (err) {
        statusCode = 500;
        chunks.length = 0;
        chunks.push(
          Buffer.from(
            JSON.stringify({
              success: false,
              message: err.message || 'Internal Server Error',
            })
          )
        );
        resHeaders.set('content-type', 'application/json');
      } else if (chunks.length === 0) {
        statusCode = 404;
        chunks.push(
          Buffer.from(
            JSON.stringify({
              success: false,
              message: `Cannot ${method} ${pathname}`,
            })
          )
        );
        resHeaders.set('content-type', 'application/json');
      }
      finish();
    });
  });

  // Strip manual content-length and transfer-encoding so NextResponse calculates correct byte length
  resHeaders.delete('content-length');
  resHeaders.delete('transfer-encoding');

  const finalStatus = res.statusCode || statusCode || 200;
  let finalBody = Buffer.concat(chunks);

  const contentType = resHeaders.get('content-type') || '';
  if (finalBody.length === 0 && contentType.includes('application/json')) {
    finalBody = Buffer.from('{}');
  }

  const isNullBodyStatus = [204, 205, 304].includes(finalStatus);
  return new NextResponse(isNullBodyStatus ? null : finalBody, {
    status: finalStatus,
    headers: resHeaders,
  });
}

module.exports = { handleNextApiRequest };
