FROM node

ADD . /app
WORKDIR /app

RUN yarn global add awsmobile-cli && \
    yarn install

EXPOSE 3000
ENTRYPOINT ["sh", "/app/entrypoint.sh"]
CMD ["awsmobile", "run"]
