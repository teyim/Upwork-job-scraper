![image](https://github.com/user-attachments/assets/3ff4dc20-e398-4fa3-ad00-930bf12ee96f)

Easily get updated upwork job alerts via telegram based on specific search terms.
Built with **Node**, **Express**, **Typesrcript**, **Puppeteer**, **Mongodb** and **Telegram chat bot** api

## Getting Started

This project is fairly easy to setup and run locally. follow these steps to get started:

### Clone repo

    git clone git@github.com:teyim/Upwork-job-scraper.git

Navigate into the project's directory and run the following command to install all dependencies

### Install dependencies

    npm install

### Configure Environment variables

Create a new _.env_ file and copy the environment variable examples from _.env.example_ file into your new _.env_ file

- Configure the .env file with your **_Mongodb url_**, **_Database name_**, **_Collection name_**

## Setup telegram bot

1.  Create telegram bot using BotFather on telegram.
2.  Get your telegram bot token from bot father
3.  Set your bot bot token as the **_TOKEN_** env variable
4.  Download and start Ngrok to forward port 5000
5.  add the Ngrok url as the **_SERVER_URL_** env variable
6.  Get your bots chat id by opening a chat with the bot and sending a message to it, you will as esponse as such:
    Your Chat ID is -- **CHAT BOT ID**
    copy the chatbot ID and set as the **CHAT_ID** env variable.

## Run project

Use the following command to run the project locally

    npm run dev

### Run with docker

The project uses docker, to run the project in a docker container, run the following command in the projects directory

    docker-compose up --build

## Features

- Scrapes job listings from Upwork using Puppeteer.
- Filters jobs based on specified keywords.
- Stores job data in MongoDB and compares new jobs to previously stored ones.
- Sends alerts for newly added jobs via a Telegram bot.
- Configurable scraping interval and keywords (to be completed).
- Dockerized for consistent deployment.

## Challenge

The main challenge with this project is making sure puppeteer works in the production server. The application run well locally with docker , but when hosted on render or other hosting platform, puppeteer gives timeout error.

**Solutions attempted**

- Configure puppeteer to run in headless mode
- Switching headless mode off
- Setting up a proxy with puppeteer
