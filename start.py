"""Start the miniature world locally using Python 3's standard library."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import threading
import webbrowser


def main():
    parser = argparse.ArgumentParser(description='Open For You — Haris made this for you')
    parser.add_argument('--port', type=int, default=4173, help='Stable local port (default 4173); use 0 for a temporary address')
    parser.add_argument('--no-browser', action='store_true', help='Print the URL without opening a browser')
    args = parser.parse_args()
    game = Path(__file__).resolve().parent / 'dist'
    if not (game / 'index.html').is_file():
        raise SystemExit('Please extract the entire ZIP first, keeping the dist folder beside start.py.')
    class GameHandler(SimpleHTTPRequestHandler):
        extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.css': 'text/css'}
        def end_headers(self):
            self.send_header('Cache-Control', 'no-cache')
            super().end_headers()
    try:
        server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(GameHandler, directory=str(game)))
    except OSError as error:
        raise SystemExit(f'Port {args.port} is unavailable. If this game is already running, return to its browser tab. Otherwise close the old server or use --port 4175.\n{error}') from None
    with server:
        url = f'http://127.0.0.1:{server.server_address[1]}/'
        print(f'Your world is ready: {url}', flush=True)
        print('Use a desktop or laptop. Keep this window open; press Ctrl+C to stop.', flush=True)
        if not args.no_browser:
            threading.Timer(0.5, lambda: webbrowser.open(url)).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print('\nGarden closed. Your progress stays in this browser.')

if __name__ == '__main__':
    main()
