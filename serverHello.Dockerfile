FROM python:3.9-slim

ENV HOME /src/server-hello

COPY $HOME $HOME
COPY requirements.txt $HOME

WORKDIR $HOME

RUN pip install -r requirements.txt

EXPOSE 5000

CMD ["flask", "--app", "main", "run"]
