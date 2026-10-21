// CloudFront Function (viewer request, runtime cloudfront-js-2.0).
// The S3 bucket is a private REST origin: map clean URLs to the index.html files Astro builds.
//   /entrainements/  -> /entrainements/index.html
//   /entrainements   -> 301 to /entrainements/
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
    return request;
  }

  // No file extension in the last segment: a page URL missing its trailing slash.
  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
  if (lastSegment.indexOf('.') === -1) {
    var query = request.querystring && Object.keys(request.querystring).length ? '?' + Object.keys(request.querystring).map(function (key) {
      return key + '=' + request.querystring[key].value;
    }).join('&') : '';
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: uri + '/' + query } },
    };
  }

  return request;
}
