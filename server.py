# server.py
import os
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from eth_account import Account
from eth_account.messages import encode_defunct
import gspread

# 環境変数の読み込み (.envファイルから)
load_dotenv()
GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID")
SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE", "service_account.json")

# Googleサービスアカウントで認証し、スプレッドシートにアクセス
gc = gspread.service_account(filename=SERVICE_ACCOUNT_FILE)
sh = gc.open_by_key(GOOGLE_SHEET_ID)  # シートIDでスプレッドシートを開く（事前に共有権限を設定）

# Flaskアプリの設定
app = Flask(__name__, static_folder="static", static_url_path="")

# フロントエンドページ（index.html）を提供
@app.route("/")
def index():
    # staticフォルダからindex.htmlを返す
    return app.send_static_file("index.html")

# 署名検証APIエンドポイント
@app.route("/verify", methods=["POST"])
def verify():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    discord_id = data.get("discord_id")
    address = data.get("address")
    signature = data.get("signature")
    nonce = data.get("nonce")

    if not discord_id or not address or not signature or not nonce:
        return jsonify({"error": "Missing fields"}), 400

    try:
        # 署名されたメッセージを再構築（Discord IDとnonceはフロントと同じ形式にする）
        message_text = f"Verify Discord ID {discord_id} with nonce {nonce}"
        # メッセージオブジェクトを作成し、署名からアドレスを復元
        encoded_msg = encode_defunct(text=message_text)
        recovered_address = Account.recover_message(encoded_msg, signature=signature)
    except Exception as e:
        return jsonify({"error": f"Signature recovery failed: {e}"}), 400

    # アドレスの一致確認（小文字に揃えて比較）
    if recovered_address.lower() != address.lower():
        return jsonify({"error": "Address mismatch or invalid signature"}), 400

    # 一致した場合、（Discord ID, アドレス, タイムスタンプ）をスプレッドシートに追記
    try:
        worksheet = sh.sheet1  # 一つ目のシートを使用（必要に応じて名前指定も可能）
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        worksheet.append_row([str(discord_id), address, timestamp])
    except Exception as e:
        return jsonify({"error": f"Google Sheet append failed: {e}"}), 500

    # 成功レスポンスを返す
    return jsonify({"status": "success"}), 200

# 開発サーバーの起動（RailwayではProcfile/railway.jsonでGunicornなどを使用）
if __name__ == "__main__":
    # RailwayではPORT環境変数が指定されるのでそれを使用、無い場合5000番ポート
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
