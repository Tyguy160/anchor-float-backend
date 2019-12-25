up:
	docker-compose up --build
down:
	docker-compose down -v
redis-connect:
	docker run -it --network="host" --rm redis redis-cli
docker-clean:
	docker system prune -f
	docker volume prune -f
migrate:
	docker build -f ./prisma/Dockerfile -t dbmigrateandseed ./
	docker run -it --rm --network=anchor-float-backend_default dbmigrateandseed
stripe-listen:
	stripe listen --forward-to localhost:4000/stripe-checkout
