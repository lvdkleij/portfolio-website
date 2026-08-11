FROM postgres:18.4

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      postgresql-18-pgvector \
    && rm -rf /var/lib/apt/lists/* \

ENV POSTGRES_DB postgres
ENV POSTGRES_USERNAME admin
ENV POSTGRES_PASSWORD password

COPY ./inits/ ./docker-entrypoint-initdb.d/

EXPOSE 5432