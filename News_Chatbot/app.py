from dotenv import find_dotenv, load_dotenv
import os
import time
import logging
from datetime import datetime
import requests
import json
from flask import Flask, jsonify, request, render_template 
from flask_cors import CORS
from openai import OpenAI

# Load environment variables
load_dotenv()

OpenAI().api_key = os.environ.get("OPENAI_API_KEY")
client = OpenAI()
client = OpenAI(default_headers={"OpenAI-Beta": "assistants=v1"})
model = "gpt-3.5-turbo"
assistant_id = "asst_BW7zS0k0MnDfghACW2Ud3SPY"

# Function for calling news api
def get_news(topic):
    news_api_key = os.getenv("NEWS_AI_KEY")
    url = f"https://newsapi.org/v2/everything?q={topic}&apiKey={news_api_key}&pageSize=3"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            news_json = response.json()
            articles = news_json["articles"]
            final_news = []
            for article in articles:
                title_descrition = f"""
                    Title: {article["title"]},
                    Author: {article["author"]},
                    Source: {article["source"]["name"]},
                    Description: {article["description"]},
                    URL: {article["url"]}
                 """
                final_news.append(title_descrition)
            final_news_string = ', '.join(final_news)
            return final_news_string
        else:
            return "No news found."
    except requests.exceptions.RequestException as e:
        print("Error", e)
        return "Failed to fetch news."

# Create Flask Routes
app = Flask(__name__)

# Serve the HTML file
@app.route("/")
def index():
    return render_template("index.html")

# /api/home
@app.route("/api/home", methods=["POST","GET"])
def main():
    
    # Get user input to variable user_input
    user_input = str(request.form["user-input"])

    # Retrieve the assistant ID
    assistant = client.beta.assistants.retrieve(assistant_id=assistant_id)

    # Create a thread
    thread = client.beta.threads.create()

    # Promt the model to tell us all about the data provided
    run = client.beta.threads.runs.create(
        thread_id=thread.id,
        assistant_id=assistant.id,

        instructions=user_input, # user-input from UI
        
    )

    # Wait until the job is completed
    time.sleep(5)
    run = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)

    # Function for getting information after calling function tools
    def get_outputs_for_tool_call(tool_call):
        topic = json.loads(tool_call.function.arguments)["topic"]
        news = get_news(topic=topic)
        return {
            "tool_call_id": tool_call.id,
            "output": news
        }

    tool_calls = run.required_action.submit_tool_outputs.tool_calls
    tool_outputs = list(map(get_outputs_for_tool_call, tool_calls))

    # Submit information to the chatbot
    run = client.beta.threads.runs.submit_tool_outputs(
        thread_id=thread.id,
        run_id=run.id,
        tool_outputs=tool_outputs
    )
    
    # Wait for the chatbot to process the message
    time.sleep(5)
    run = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)

    message = client.beta.threads.messages.list(thread_id=thread.id)
    final_output = message.data[0].content[0].text.value

    return jsonify({"response": final_output})



if __name__ == "__main__":
    app.run(debug=True, port=8080)
