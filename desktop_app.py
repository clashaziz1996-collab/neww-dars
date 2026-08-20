"""
EduSchedule - Standalone Windows 11 Desktop Application Runner
"""
import sys
import os
import webbrowser
import threading
import http.server
import socketserver

PORT = 8765
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

if __name__ == "__main__":
    # Start local background server
    threading.Thread(target=start_server, daemon=True).start()
    
    url = f"http://localhost:{PORT}/index.html"
    print(f"EduSchedule ishga tushdi: {url}")
    
    # Try opening Edge or Chrome in app mode
    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    ]
    
    opened = False
    for p in edge_paths:
        if os.path.exists(p):
            os.system(f'start "" "{p}" --app="{url}" --window-size=1280,850')
            opened = True
            break
            
    if not opened:
        webbrowser.open(url)
    
    # Keep process alive
    try:
        import time
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        sys.exit(0)
