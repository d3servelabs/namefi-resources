FROM listmonk/listmonk:latest

COPY startup.sh ./startup.sh
RUN chmod +x ./startup.sh
    
EXPOSE 9000
CMD ["/bin/sh", "./startup.sh"]
# us-central1-docker.pkg.dev/d3serve-labs/apps/listmonk:latest