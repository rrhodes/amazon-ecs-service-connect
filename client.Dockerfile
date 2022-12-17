FROM python:3.9-slim

ENV HOME /src/client

COPY $HOME $HOME
COPY requirements.txt $HOME

WORKDIR $HOME

RUN apt-get update \
    && apt-get install curl -y \
    && pip install -r requirements.txt

EXPOSE 5000

CMD ["flask", "--app", "main", "run"]
