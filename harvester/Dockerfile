FROM python:3.10.2

WORKDIR /usr/src/app

COPY ./harvester ./harvester
COPY ./db-loader ./db-loader

RUN pip install -q numpy==1.26.4 pandas==2.1.1
RUN pip install -q ./db-loader ./harvester

CMD [ "sh","./harvester/run.sh" ]
