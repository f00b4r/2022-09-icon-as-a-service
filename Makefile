.PHONY: install dev deploy publish

install:
	npm install

dev:
	vercel dev

deploy:
	vercel

publish:
	vercel --prod