up:
	docker-compose up --build
down:
	docker-compose down -v
prod-up:
	docker-compose -f docker-compose.prod.yml up --build -d
prod-down:
	docker-compose -f docker-compose.prod.yml down -v
prod-purge-sqs:
	aws sqs purge-queue --queue-url https://sqs.us-east-1.amazonaws.com/510755279176/parse-sitemap
	aws sqs purge-queue --queue-url https://sqs.us-east-1.amazonaws.com/510755279176/parse-page
	aws sqs purge-queue --queue-url https://sqs.us-east-1.amazonaws.com/510755279176/parse-shortlink
	aws sqs purge-queue --queue-url https://sqs.us-east-1.amazonaws.com/510755279176/parse-product
	aws sqs purge-queue --queue-url https://sqs.us-east-1.amazonaws.com/510755279176/parse-variations
	aws sqs purge-queue --queue-url https://sqs.us-east-1.amazonaws.com/510755279176/generate-report
	aws sqs purge-queue --queue-url https://sqs.us-east-1.amazonaws.com/510755279176/create-connect-product
dev-purge-sqs:
	aws sqs purge-queue --queue-url https://sqs.us-east-1.amazonaws.com/510755279176/parse-sitemap-dev
	aws sqs purge-queue --queue-url https://sqs.us-east-1.amazonaws.com/510755279176/parse-page-dev
	aws sqs purge-queue --queue-url https://sqs.us-east-1.amazonaws.com/510755279176/parse-shortlink-dev
	aws sqs purge-queue --queue-url https://sqs.us-east-1.amazonaws.com/510755279176/parse-product-dev
	aws sqs purge-queue --queue-url https://sqs.us-east-1.amazonaws.com/510755279176/parse-variations-dev
	aws sqs purge-queue --queue-url https://sqs.us-east-1.amazonaws.com/510755279176/generate-report-dev
	aws sqs purge-queue --queue-url https://sqs.us-east-1.amazonaws.com/510755279176/create-connect-product-dev
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
