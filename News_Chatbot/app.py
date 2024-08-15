from dotenv import find_dotenv, load_dotenv
import os
import time
import logging
from datetime import datetime
import requests
import json
from flask import Flask, jsonify
import streamlit as st
from flask_cors import CORS
from openai import OpenAI

# Load all the environment variables
load_dotenv()
# If not work then use:
OpenAI().api_key = os.environ.get("OPENAI_API_KEY")

client = OpenAI()
client = OpenAI(default_headers={"OpenAI-Beta": "assistants=v1"})
model = "gpt-3.5-turbo"
# Declaire assistant id
assistant_id = "asst_BW7zS0k0MnDfghACW2Ud3SPY"

#====== Call News API ======
def get_news(topic):

    # Load API KEYS 
    news_api_key = os.environ.get("NEWS_API_KEY")

    url = (
        f"https://newsapi.org/v2/everything?q={topic}&apiKey={news_api_key}&pageSize=3"
    )
    try:
        response = requests.get(url)
        
        if response.status_code == 200:
            news = json.dumps(response.json(), indent=4)
            news_json = json.loads(news)

            data = news_json

            # Access all the fields
            status = data["status"]
            total_results = data["totalResults"]
            articles = data["articles"]

            final_news =[]

            # Loop through articles
            for article in articles:
                source_name = article["source"]["name"]
                author = article["author"]
                title = article["title"]
                description = article["description"]
                url = article["url"]
                content = article["content"]
                title_descrition = f"""
                    Title: {title},
                    Author: {author},
                    Source: {source_name},
                    Description: {description},
                    URL: {url}
                 """
                final_news.append(title_descrition)
                final_news_string = ','.join(str(x) for x in final_news)
            return final_news_string
        else: 
            return []
        
    except requests.exceptions.RequestException as e:
        print("Error", e)
# print(get_news("Donald Trump"))

# ====== Flask App ======
app = Flask(__name__)
CORS(app)

# /api/home
@app.route("/api/home", methods=["GET"])
def main():

    # Log assistant
    assistant = client.beta.assistants.retrieve(
        assistant_id=assistant_id
    )
    # print(assistant)

    # Create a thread
    thread = client.beta.threads.create()
    # print(thread)

    # Promt the model to tell us all about the data provided
    run = client.beta.threads.runs.create(
        thread_id=thread.id,
        assistant_id=assistant.id,
        instructions="What are the latest news about Trump?",
    )
    # print(run)


    # Wait until the job has finished completed
    time.sleep(5)
    run = client.beta.threads.runs.retrieve(
        thread_id=thread.id,
        run_id=run.id
    )
    # print(run)

    def get_outputs_for_tool_call(tool_call):
        topic = json.loads(tool_call.function.arguments)["topic"]
        news = get_news(topic=topic)
        return {
            "tool_call_id": tool_call.id,
            "output": news
        }

    tool_calls = run.required_action.submit_tool_outputs.tool_calls
    tool_outputs = map(get_outputs_for_tool_call, tool_calls)
    tool_outputs = list(tool_outputs)
    # print(f"tool_outputs results:{tool_outputs}")


    run = client.beta.threads.runs.submit_tool_outputs(
            thread_id=thread.id,
            run_id=run.id,
            tool_outputs=tool_outputs
    )
    # print(run)

    # Wait until the job has finished completed
    time.sleep(10)
    run = client.beta.threads.runs.retrieve(
        thread_id=thread.id,
        run_id=run.id
    )
    # print(run)

    message = client.beta.threads.messages.list(
        thread_id=thread.id
    )

    final_output = message.data[0].content[0].text.value
    return final_output
    # print(f"The Message: {message.data[0].content[0].text.value}")

if __name__ == "__main__":
    app.run(debug=True, port=8080)
