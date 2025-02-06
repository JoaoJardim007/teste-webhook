import streamlit as st
import requests
import asyncio
from fastapi import FastAPI, Request
from starlette.middleware.wsgi import WSGIMiddleware
import uvicorn
from threading import Thread

# Inicializar FastAPI dentro do Streamlit
app = FastAPI()

# URLs de destino dos webhooks
UCHAT_WEBHOOK_URL = "https://bot.dfktv2.com/bot/waapi/a6854e3379f7b1dc27930c231dfa919b"
CHATWOOT_WEBHOOK_URL = "https://chatwoot.webhook.url"

@app.post("/webhook")
async def receive_webhook(request: Request):
    """ Recebe o webhook do Z-API e repassa para os outros serviços """
    data = await request.json()
    headers = {"Content-Type": "application/json"}

    async def send_to_uchat():
        try:
            requests.post(UCHAT_WEBHOOK_URL, json=data, headers=headers)
        except Exception as e:
            print(f"Erro ao enviar para UChat: {e}")

    async def send_to_chatwoot():
        try:
            requests.post(CHATWOOT_WEBHOOK_URL, json=data, headers=headers)
        except Exception as e:
            print(f"Erro ao enviar para Chatwoot: {e}")

    await asyncio.gather(send_to_uchat(), send_to_chatwoot())

    return {"status": "Webhook recebido e encaminhado"}

# Iniciar o servidor FastAPI em segundo plano
def run_server():
    uvicorn.run(app, host="0.0.0.0", port=8000)

server_thread = Thread(target=run_server, daemon=True)
server_thread.start()

# Interface no Streamlit
st.title("Webhook Forwarder com Streamlit 🚀")
st.write("Este serviço recebe webhooks do Z-API e os repassa para UChat e Chatwoot.")

st.success("Servidor FastAPI rodando em segundo plano na porta 8000.")
st.write("Configure o Z-API para enviar webhooks para este serviço.")

st.code("https://seu-projeto.streamlit.app/webhook", language="bash")
