import http.server
import socketserver
import mimetypes

# Explicitly register JavaScript & JSX MIME types for Windows Python http.server
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.jsx')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('image/svg+xml', '.svg')

PORT = 8000

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and disable restrictive MIME blocking for local testing
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"OmniVision AI Server running at http://localhost:{PORT}")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
