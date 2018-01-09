.PHONY: build run

PORT?=80

build:
	docker build -t gitlab-bot-poll:dev .

run: build
	docker run --rm -p ${PORT}:3000 -it gitlab-bot-poll:dev

clean:
	docker rmi gitlab-bot-poll:dev

