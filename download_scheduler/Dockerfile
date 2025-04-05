FROM python:3.9-slim-buster

# for shapely, pdf creation
RUN apt-get -y -qq update
# libqt5gui5 needed by wkhtmltopdf
RUN apt-get -y -qq install gcc libc-dev libgeos-dev python3-dev wkhtmltopdf libqt5gui5

# See https://github.com/wkhtmltopdf/wkhtmltopdf/issues/4497. exit 0 so it doesnt fail on ARM

# NOTE: THIS MUST STAY AS A SINGLE LINE
RUN strip --remove-section=.note.ABI-tag /usr/lib/x86_64-linux-gnu/libQt5Core.so.5;exit 0

RUN apt-get update && apt-get install -y postgresql-client

WORKDIR /usr/src/app

COPY . .
COPY ./platforms_nerc_ioos.csv /usr/src/app/platforms_nerc_ioos.csv

RUN pip install -q numpy==1.26.4 pandas==2.1.1
RUN pip install -q ./downloader ./download_scheduler ./harvester

COPY ../database /usr/src/app/database

COPY ./download_scheduler/init_db.sh /usr/src/app/init_db.sh
RUN chmod +x /usr/src/app/init_db.sh

# -u seems to be needed to get it to print to stdout
CMD [ "python", "-u","-m","download_scheduler" ]
