mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
current_dir := $(patsubst %/,%,$(dir $(mkfile_path)))


INSTANCE_NAME := ponder-indexer
REGION := us-central1
ZONE := us-central1-a
MODE ?= update
VERSION := $(shell jq -r '.version' $(current_dir)/package.json)
export DOCKER_TAG := us-central1-docker.pkg.dev/d3serve-labs/namefi-astra/ponder/ponder-indexer:$(VERSION)
export APP_IMAGE := $(DOCKER_TAG)

.PHONY: deploy clean build version app-image

version:
	@echo $(VERSION)
app-image:
	@echo $(APP_IMAGE)

deploy: build
	@chmod +x $(current_dir)/scripts/deploy.sh
	@$(current_dir)/scripts/deploy.sh $(MODE)

build: configure-docker
	@# this checks if the image exists in the registry and if not, it builds it
	@if docker pull $(DOCKER_TAG); then \
		echo "Image already exists in registry"; \
		exit 0; \
	else \
		echo "Image does not exist in registry, building and pushing"; \
		docker build -t $(DOCKER_TAG) -f $(current_dir)/Dockerfile $(current_dir)/../../; \
		docker push $(DOCKER_TAG); \
		echo "Image built and pushed"; \
	fi

configure-docker:
	@gcloud auth configure-docker $(REGION)-docker.pkg.dev
	@echo "Docker configured"

clean:
	@gcloud compute instances delete $(INSTANCE_NAME) --zone=$(ZONE) --quiet
