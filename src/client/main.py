import json
import logging

import httpx
from flask import Flask

logging.getLogger().setLevel(logging.INFO)

app = Flask(__name__)

@app.route("/")
def index():
    logging.info("Request received")

    rHello = httpx.get("http://worker-hello:5000")
    rWorld = httpx.get("http://worker-world:5001")
    rUuid = httpx.get("https://www.uuidtools.com/api/generate/v1")

    return f"{rHello.text} {rWorld.text}, {json.loads(rUuid.text)[0]}!"
