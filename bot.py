# bot.py
import os
import asyncio
import secrets
from dotenv import load_dotenv
import discord
from discord import app_commands

# 環境変数の読み込み
load_dotenv()
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
GUILD_ID = os.getenv("DISCORD_GUILD_ID")  # 開発中に即時反映したいサーバーのID（省略可）
APP_URL = os.getenv("APP_URL", "http://localhost:5000")  # FlaskアプリのURL

intents = discord.Intents.default()
bot = discord.Client(intents=intents)
tree = app_commands.CommandTree(bot)

# /setupverify コマンドの定義
@tree.command(name="setupverify", description="ウォレット検証用リンクを取得します")
async def setupverify(interaction: discord.Interaction):
    # ランダムなnonceを生成（16桁のhex文字列など）
    nonce = secrets.token_hex(8)
    discord_id = interaction.user.id

    # 検証サイトへのURLを構築（Discord IDとnonceをクエリに含める）
    base_url = APP_URL.rstrip("/")  # URL末尾のスラッシュを除去
    verify_url = f"{base_url}/?discord_id={discord_id}&nonce={nonce}"

    # 埋め込みメッセージを作成
    embed = discord.Embed(title="Wallet Verification",
                          description="以下のボタンをクリックしてウォレット署名による検証を行ってください。")
    # ボタン（DiscordのメッセージボタンはViewとして実装）
    view = discord.ui.View()
    # Linkボタン（クリックで外部URLに飛ぶ）
    view.add_item(discord.ui.Button(label="Verify Wallet", url=verify_url))

    # ユーザーに返信（ephemeral=True で本人にのみ表示。不要なら False に）
    await interaction.response.send_message(embed=embed, view=view, ephemeral=True)

# Botの起動とスラッシュコマンド登録
@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")
    try:
        # GUILD_ID が指定されていればそのGuildにスラッシュコマンドを同期
        if GUILD_ID:
            guild = discord.Object(id=int(GUILD_ID))
            await tree.sync(guild=guild)
        else:
            # グローバル登録（反映に時間がかかる場合があります）
            await tree.sync()
        print("Slash commands synced.")
    except Exception as e:
        print(f"Error syncing commands: {e}")

bot.run(DISCORD_TOKEN)
