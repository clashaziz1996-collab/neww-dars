"""
EduSchedule - Python Backend Server (Online Deploy & Local)
"""
import os
import json
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = int(os.environ.get("PORT", 3000))
DB_FILE = os.path.join(os.path.dirname(__file__), 'database.json')

class RequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/schedule':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            if os.path.exists(DB_FILE):
                with open(DB_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                res = json.dumps({"success": True, "data": data.get("schedule"), "auth": data.get("auth")})
            else:
                res = json.dumps({"success": False})
            self.wfile.write(res.encode('utf-8'))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/schedule':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))

            db_data = {}
            if os.path.exists(DB_FILE):
                try:
                    with open(DB_FILE, 'r', encoding='utf-8') as f:
                        db_data = json.load(f)
                except Exception:
                    pass

            db_data['schedule'] = body.get('schedule')
            if body.get('auth'):
                db_data['auth'] = body.get('auth')

            with open(DB_FILE, 'w', encoding='utf-8') as f:
                json.dump(db_data, f, indent=2, ensure_ascii=False)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "message": "Serverda saqlandi"}).encode('utf-8'))
        else:
            self.send_error(404)

if __name__ == '__main__':
    print(f"EduSchedule Python Server ishga tushdi: http://localhost:{PORT}")
    server = HTTPServer(('', PORT), RequestHandler)
    server.serve_forever()
