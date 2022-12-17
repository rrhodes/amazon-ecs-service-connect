FROM python:3.9-slim

ENV HOME /src/server-world

COPY $HOME $HOME
COPY requirements.txt $HOME

WORKDIR $HOME

RUN pip install -r requirements.txt

EXPOSE 5001

CMD ["flask", "--app", "main", "run", "-p", "5001"]
