import logging

from flask import Flask

logging.getLogger().setLevel(logging.INFO)

app = Flask(__name__)

@app.route("/")
def index():
    logging.info("Request received")
    return "Hello"
