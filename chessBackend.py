from flask import Flask, request, jsonify
from flask_cors import CORS
from stockfish import Stockfish

app = Flask(__name__)
CORS(app)

# Set the path to your Stockfish engine binary
stockfish = Stockfish(path="/usr/games/stockfish")  # Update with your stockfish path

@app.route('/best_move', methods=['POST'])
def best_move():
    data = request.get_json()
    fen = data.get('FEN', '')
    print("data received ", data)
    
    if not fen:
        return jsonify({"error": "FEN not provided"}), 400
    
    stockfish.set_fen_position(fen)
    best_move = stockfish.get_best_move()

    return jsonify({"best_move": best_move})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)